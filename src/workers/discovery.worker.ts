import { db } from '../db/client';
import { keywords, leads, contacts } from '../db/schema';
import { eq, and, sql, lt } from 'drizzle-orm';
import { env } from '../config/env';
import { youtubeDiscoveryService } from '../services/youtube/discovery.service';
import { emailExtractor } from '../services/extraction/email.extractor';
import { socialExtractor } from '../services/extraction/social.extractor';
import { jobRunner } from '../services/jobs/job.runner';

export async function runDiscoveryBatch(batchSize: number = env.YOUTUBE_BATCH_SIZE): Promise<{ processed: number; leadsDiscovered: number; quotaReached: boolean }> {
  console.log(`\n======================================================`);
  console.log(`🚀 Starting YouTube Discovery Batch Worker (batchSize=${batchSize})`);
  console.log(`======================================================\n`);

  // 1. Run recovery for any abandoned work from previous runs
  await jobRunner.recoverStaleJobsAndKeywords(env.WORKER_STALE_TIMEOUT_MINUTES);

  // 2. Register job
  const jobId = await jobRunner.createJob('DISCOVERY_BATCH', { batchSize });

  // 3. Atomically claim batch of PENDING or RETRY keywords
  const pool = db;
  let claimedKeywords: typeof keywords.$inferSelect[] = [];

  try {
    // Atomic update with subquery
    claimedKeywords = await pool
      .update(keywords)
      .set({
        status: 'PROCESSING',
        attemptCount: sql`${keywords.attemptCount} + 1`,
        lastAttemptAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        sql`${keywords.id} IN (
          SELECT id FROM ${keywords}
          WHERE status IN ('PENDING', 'RETRY') AND attempt_count < ${env.WORKER_MAX_RETRIES}
          ORDER BY id ASC
          LIMIT ${batchSize}
          FOR UPDATE SKIP LOCKED
        )`
      )
      .returning();
  } catch (e: any) {
    console.error('[Discovery Worker] Failed to claim keywords from database:', e.message);
    await jobRunner.failJob(jobId, e.message);
    return { processed: 0, leadsDiscovered: 0, quotaReached: false };
  }

  if (claimedKeywords.length === 0) {
    console.log('ℹ️ No pending keywords in queue to process.');
    await jobRunner.completeJob(jobId, 0);
    return { processed: 0, leadsDiscovered: 0, quotaReached: false };
  }

  console.log(`📋 Claimed ${claimedKeywords.length} keywords for discovery execution.`);

  let processedCount = 0;
  let leadsCount = 0;
  let quotaReached = false;

  for (const kw of claimedKeywords) {
    console.log(`\n[Keyword ${kw.id}] Processing: "${kw.keyword}" (${kw.category} / ${kw.entity})...`);

    try {
      const searchResult = await youtubeDiscoveryService.searchChannelsByKeyword({
        query: kw.keyword,
        maxResults: env.YOUTUBE_MAX_RESULTS_PER_SEARCH,
      });

      if (searchResult.quotaReached) {
        console.warn(`⚠️ [YouTube Quota Reached] Stopping discovery batch cleanly.`);
        quotaReached = true;

        // Reset current and remaining claimed keywords to PENDING so they are not lost
        await pool
          .update(keywords)
          .set({ status: 'PENDING', updatedAt: new Date() })
          .where(eq(keywords.id, kw.id));

        break;
      }

      const channels = searchResult.channels;
      console.log(`  Found ${channels.length} channels for keyword "${kw.keyword}".`);

      for (const ch of channels) {
        // 4. Deduplicate & Upsert Lead
        let leadId: number;

        const existingLead = await pool
          .select({ id: leads.id })
          .from(leads)
          .where(eq(leads.channelId, ch.channelId))
          .limit(1);

        if (existingLead.length > 0) {
          leadId = existingLead[0].id;
          // Update stats without duplicating lead
          await pool
            .update(leads)
            .set({
              subscriberCount: ch.subscriberCount,
              videoCount: ch.videoCount,
              viewCount: ch.viewCount,
              updatedAt: new Date(),
            })
            .where(eq(leads.id, leadId));
        } else {
          const [newLead] = await pool
            .insert(leads)
            .values({
              channelId: ch.channelId,
              channelUrl: `https://youtube.com/channel/${ch.channelId}`,
              channelTitle: ch.title,
              customUrl: ch.customUrl,
              description: ch.description,
              website: ch.website,
              thumbnailUrl: ch.thumbnailUrl,
              subscriberCount: ch.subscriberCount,
              videoCount: ch.videoCount,
              viewCount: ch.viewCount,
              publishedAt: ch.publishedAt ? new Date(ch.publishedAt) : null,
              sourceKeywordId: kw.id,
              qualificationStatus: 'UNQUALIFIED',
              outreachStatus: 'UNPROCESSED',
              rawPayload: ch.rawPayload,
            })
            .returning({ id: leads.id });

          leadId = newLead.id;
          leadsCount++;
          await jobRunner.logEvent(jobId, 'LEAD_CREATED', 'INFO', `Created lead: ${ch.title} (${ch.channelId})`, { leadId, channelId: ch.channelId });
        }

        // 5. Contact Extraction (Email & Socials)
        const extractedEmails = emailExtractor.extractEmails(ch.description || '');
        const extractedSocials = socialExtractor.extractSocials(ch.description || '');
        const primaryEmail = extractedEmails.length > 0 ? extractedEmails[0].email : null;

        // Upsert into contacts table
        await pool
          .insert(contacts)
          .values({
            leadId,
            email: primaryEmail,
            emailStatus: primaryEmail ? 'UNKNOWN' : 'INVALID',
            instagram: extractedSocials.instagram,
            twitter: extractedSocials.twitter,
            discord: extractedSocials.discord,
            tiktok: extractedSocials.tiktok,
            linkedin: extractedSocials.linkedin,
          })
          .onConflictDoUpdate({
            target: contacts.leadId,
            set: {
              email: primaryEmail || sql`contacts.email`,
              instagram: extractedSocials.instagram || sql`contacts.instagram`,
              twitter: extractedSocials.twitter || sql`contacts.twitter`,
              discord: extractedSocials.discord || sql`contacts.discord`,
              tiktok: extractedSocials.tiktok || sql`contacts.tiktok`,
              linkedin: extractedSocials.linkedin || sql`contacts.linkedin`,
              updatedAt: new Date(),
            },
          });

        if (primaryEmail) {
          await jobRunner.logEvent(jobId, 'CONTACT_FOUND', 'INFO', `Discovered email for ${ch.title}: ${primaryEmail}`, { leadId, email: primaryEmail });
        }
      }

      // Mark keyword completed or skipped
      const finalStatus = channels.length > 0 ? 'COMPLETED' : 'SKIPPED';
      await pool
        .update(keywords)
        .set({
          status: finalStatus,
          channelsFound: channels.length,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(keywords.id, kw.id));

      processedCount++;
      await jobRunner.updateHeartbeat(jobId, processedCount, 0);
    } catch (err: any) {
      console.error(`❌ [Keyword ${kw.id}] Execution failed:`, err.message);
      const isTerminal = kw.attemptCount >= env.WORKER_MAX_RETRIES;
      await pool
        .update(keywords)
        .set({
          status: isTerminal ? 'FAILED' : 'RETRY',
          lastError: err.message,
          updatedAt: new Date(),
        })
        .where(eq(keywords.id, kw.id));
    }
  }

  if (quotaReached) {
    await jobRunner.stopJobQuota(jobId, 'YouTube API search limit reached for today');
  } else {
    await jobRunner.completeJob(jobId, processedCount);
  }

  console.log(`\n✅ Discovery batch completed: ${processedCount} keywords processed, ${leadsCount} new leads recorded.`);
  return { processed: processedCount, leadsDiscovered: leadsCount, quotaReached };
}

if (require.main === module) {
  runDiscoveryBatch()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal discovery worker crash:', err);
      process.exit(1);
    });
}
