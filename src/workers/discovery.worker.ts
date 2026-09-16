import { db } from '../db/client';
import { keywords, leads, contacts, leadKeywordSources } from '../db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { env } from '../config/env';
import { youtubeDiscoveryService } from '../services/youtube/discovery.service';
import { emailExtractor } from '../services/extraction/email.extractor';
import { socialExtractor } from '../services/extraction/social.extractor';
import { websiteScraper } from '../services/extraction/website.scraper';
import { jobRunner } from '../services/jobs/job.runner';

export function calculatePriorityScore(newLeadsCount: number): number {
  if (newLeadsCount >= 11) return 90; // High yield
  if (newLeadsCount >= 4) return 65;  // Normal yield
  if (newLeadsCount >= 1) return 40;  // Low yield
  return 20;                          // Very low yield (0 new leads)
}

export async function runDiscoveryBatch(batchSize: number = env.YOUTUBE_BATCH_SIZE): Promise<{ processed: number; leadsDiscovered: number; quotaReached: boolean }> {
  console.log(`\n======================================================`);
  console.log(`🚀 Starting YouTube Discovery Batch Worker (batchSize=${batchSize})`);
  console.log(`======================================================\n`);

  // 1. Run recovery for any abandoned work from previous runs
  await jobRunner.recoverStaleJobsAndKeywords(env.WORKER_STALE_TIMEOUT_MINUTES);

  // 2. Register job
  const jobId = await jobRunner.createJob('DISCOVERY_BATCH', { batchSize });

  // 3. Atomically claim batch of PENDING or RETRY keywords ordered by priorityScore DESC, id ASC
  const pool = db;
  let claimedKeywords: typeof keywords.$inferSelect[] = [];

  try {
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
          ORDER BY priority_score DESC, id ASC
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

  console.log(`📋 Claimed ${claimedKeywords.length} keywords for discovery execution (priority-ordered).`);

  let processedCount = 0;
  let totalNewLeadsCount = 0;
  let quotaReached = false;

  for (let i = 0; i < claimedKeywords.length; i++) {
    const kw = claimedKeywords[i];
    console.log(`\n[Keyword ${kw.id}] Processing: "${kw.keyword}" (${kw.category} / ${kw.entity}) [Priority: ${kw.priorityScore}]...`);

    let kwNewLeadsCount = 0;
    let kwEmailsFoundCount = 0;

    try {
      // 4. Call search.list ONLY
      const searchResult = await youtubeDiscoveryService.searchChannelIds({
        query: kw.keyword,
        maxResults: env.YOUTUBE_MAX_RESULTS_PER_SEARCH,
      });

      if (searchResult.quotaReached) {
        quotaReached = true;
        const remainingKeywords = claimedKeywords.slice(i);
        const remainingIds = remainingKeywords.map((k) => k.id);
        console.warn(`⚠️ [YouTube Quota Reached] Stopping discovery batch cleanly. Rolling back ${remainingIds.length} unprocessed keywords to PENDING.`);

        // Reset current and all remaining keywords in batch back to PENDING and decrement attemptCount
        if (remainingIds.length > 0) {
          await pool
            .update(keywords)
            .set({
              status: 'PENDING',
              attemptCount: sql`GREATEST(0, ${keywords.attemptCount} - 1)`,
              updatedAt: new Date(),
            })
            .where(inArray(keywords.id, remainingIds));
        }

        break;
      }

      // 5. In-Memory Channel ID Deduplication
      const rawIds = searchResult.channelIds;
      const uniqueChannelIds = Array.from(new Set(rawIds));
      console.log(`  Found ${rawIds.length} raw channels -> ${uniqueChannelIds.length} unique channel IDs.`);

      if (uniqueChannelIds.length === 0) {
        // Keyword returned 0 results -> mark SKIPPED and adjust priority
        await pool
          .update(keywords)
          .set({
            status: 'SKIPPED',
            channelsFound: 0,
            priorityScore: 20,
            lastRunAt: new Date(),
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(keywords.id, kw.id));

        processedCount++;
        continue;
      }

      // 6. Batch Query PostgreSQL for Already-Known Channels (Zero-Waste Enrichment)
      const existingLeads = await pool
        .select({ id: leads.id, channelId: leads.channelId })
        .from(leads)
        .where(inArray(leads.channelId, uniqueChannelIds));

      const existingMap = new Map<string, number>();
      for (const el of existingLeads) {
        existingMap.set(el.channelId, el.id);
      }

      console.log(`  Identified ${existingLeads.length} existing channels in database.`);

      // 7. Update Provenance for Known Channels without Calling channels.list
      for (const el of existingLeads) {
        await pool
          .insert(leadKeywordSources)
          .values({
            leadId: el.id,
            keywordId: kw.id,
            firstSeenAt: new Date(),
            lastSeenAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [leadKeywordSources.leadId, leadKeywordSources.keywordId],
            set: { lastSeenAt: new Date() },
          });

        // Update lead's last seen time
        await pool
          .update(leads)
          .set({ updatedAt: new Date() })
          .where(eq(leads.id, el.id));
      }

      // 8. Filter Genuinely New Channels for channels.list Enrichment
      const genuinelyNewChannelIds = uniqueChannelIds.filter((id) => !existingMap.has(id));
      console.log(`  Enriching ${genuinelyNewChannelIds.length} genuinely new channels via channels.list...`);

      if (genuinelyNewChannelIds.length > 0) {
        const enrichResult = await youtubeDiscoveryService.enrichChannelsBatch(genuinelyNewChannelIds);

        if (enrichResult.quotaReached) {
          console.warn(`⚠️ [YouTube Quota Reached during enrichment] Pausing batch.`);
          quotaReached = true;
          await pool
            .update(keywords)
            .set({ status: 'PENDING', updatedAt: new Date() })
            .where(eq(keywords.id, kw.id));
          break;
        }

        for (const ch of enrichResult.channels) {
          // 9. Discovery Quality Filter (Lightweight n8n Pre-Filter)
          if (ch.subscriberCount < env.MIN_DISCOVERY_SUBSCRIBERS || ch.videoCount < env.MIN_DISCOVERY_VIDEOS) {
            console.log(`  ⏩ Skipping low-volume channel: "${ch.title}" (${ch.subscriberCount} subs, ${ch.videoCount} vids)`);
            continue;
          }

          // 10. Extract Contacts from description first
          const extractedEmails = emailExtractor.extractEmails(ch.description || '');
          const extractedSocials = socialExtractor.extractSocials(ch.description || '');

          // If no email found in description, try lightweight internal website scraper
          const targetScrapeUrl = ch.website || extractedSocials.website || extractedSocials.linktree || extractedSocials.beacons;
          let scrapedResult: Awaited<ReturnType<typeof websiteScraper.scrapeUrl>> | null = null;
          if (extractedEmails.length === 0 && targetScrapeUrl) {
            try {
              scrapedResult = await websiteScraper.scrapeUrl(targetScrapeUrl);
              if (scrapedResult.emails.length > 0) {
                for (const emailStr of scrapedResult.emails) {
                  extractedEmails.push({ email: emailStr, source: 'links' });
                }
              }
            } catch (scrapeErr: any) {
              console.warn(`[Website Scraper] Error scraping ${targetScrapeUrl}:`, scrapeErr?.message);
            }
          }

          const primaryPhone = scrapedResult?.phones[0] || extractedSocials.phone || null;
          const contactPageUrl = scrapedResult?.contactPageUrl || null;

          // 11. Persist New Lead atomically with provenance and contacts inside a single transaction
          await pool.transaction(async (tx) => {
            const [newLead] = await tx
              .insert(leads)
              .values({
                channelId: ch.channelId,
                channelUrl: `https://youtube.com/channel/${ch.channelId}`,
                channelTitle: ch.title,
                customUrl: ch.customUrl,
                description: ch.description,
                website: ch.website || scrapedResult?.url || extractedSocials.website || null,
                thumbnailUrl: ch.thumbnailUrl,
                subscriberCount: ch.subscriberCount,
                videoCount: ch.videoCount,
                viewCount: ch.viewCount,
                publishedAt: ch.publishedAt ? new Date(ch.publishedAt) : null,
                sourceKeywordId: kw.id,
                qualificationStatus: 'UNQUALIFIED',
                outreachStatus: 'UNPROCESSED',
                country: ch.country || null,
                phone: primaryPhone,
                contactPageUrl: contactPageUrl,
                rawPayload: ch.rawPayload,
              })
              .returning({ id: leads.id });

            const leadId = newLead.id;

            // 12. Record Provenance in lead_keyword_sources
            await tx
              .insert(leadKeywordSources)
              .values({
                leadId,
                keywordId: kw.id,
                firstSeenAt: new Date(),
                lastSeenAt: new Date(),
              })
              .onConflictDoNothing();

            // 13. Contact Extraction: Preserve ALL Discovered Emails and Links
            // Insert ALL discovered unique emails
            for (let i = 0; i < extractedEmails.length; i++) {
              const emailObj = extractedEmails[i];
              const cleanEmail = emailObj.email.toLowerCase().trim();

              await tx
                .insert(contacts)
                .values({
                  leadId,
                  contactType: 'EMAIL',
                  value: cleanEmail,
                  normalizedValue: cleanEmail,
                  source: emailObj.source,
                  isPrimary: i === 0,
                  email: cleanEmail,
                  emailStatus: 'UNKNOWN',
                })
                .onConflictDoNothing();

              kwEmailsFoundCount++;
            }

            // Insert structured social/profile links from description
            for (const item of extractedSocials.items) {
              if (item.type === 'EMAIL') continue;

              await tx
                .insert(contacts)
                .values({
                  leadId,
                  contactType: item.type,
                  value: item.value,
                  normalizedValue: item.normalizedValue,
                  source: item.source,
                  isPrimary: false,
                  instagram: item.type === 'INSTAGRAM' ? item.normalizedValue : undefined,
                  twitter: item.type === 'TWITTER_X' ? item.normalizedValue : undefined,
                  discord: item.type === 'DISCORD' ? item.value : undefined,
                  tiktok: item.type === 'TIKTOK' ? item.normalizedValue : undefined,
                  linkedin: item.type === 'LINKEDIN' ? item.value : undefined,
                })
                .onConflictDoNothing();
            }

            // Also insert any extra scraped items (e.g. phone, website subpages, extra socials)
            if (scrapedResult?.rawItems) {
              for (const item of scrapedResult.rawItems) {
                if (item.type === 'EMAIL') continue;
                await tx
                  .insert(contacts)
                  .values({
                    leadId,
                    contactType: item.type,
                    value: item.value,
                    normalizedValue: item.normalizedValue,
                    source: item.source,
                    isPrimary: false,
                    instagram: item.type === 'INSTAGRAM' ? item.normalizedValue : undefined,
                    twitter: item.type === 'TWITTER_X' ? item.normalizedValue : undefined,
                    discord: item.type === 'DISCORD' ? item.value : undefined,
                    tiktok: item.type === 'TIKTOK' ? item.normalizedValue : undefined,
                    linkedin: item.type === 'LINKEDIN' ? item.value : undefined,
                  })
                  .onConflictDoNothing();
              }
            }
          });

          kwNewLeadsCount++;
          totalNewLeadsCount++;
        }
      }

      // 13. Keyword Performance Feedback Loop & Priority Re-scoring
      const newScore = calculatePriorityScore(kwNewLeadsCount);
      console.log(`  Keyword summary: ${uniqueChannelIds.length} found, ${kwNewLeadsCount} new leads, ${kwEmailsFoundCount} emails. New Priority Score: ${newScore}`);

      await pool
        .update(keywords)
        .set({
          status: 'COMPLETED',
          channelsFound: uniqueChannelIds.length,
          newChannelsFound: sql`${keywords.newChannelsFound} + ${kwNewLeadsCount}`,
          emailsFound: sql`${keywords.emailsFound} + ${kwEmailsFoundCount}`,
          priorityScore: newScore,
          lastRunAt: new Date(),
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
    await jobRunner.stopJobQuota(jobId, 'YouTube API quota reached for today');
  } else {
    await jobRunner.completeJob(jobId, processedCount);
  }

  console.log(`\n✅ Discovery batch completed: ${processedCount} keywords processed, ${totalNewLeadsCount} new leads recorded.`);
  return { processed: processedCount, leadsDiscovered: totalNewLeadsCount, quotaReached };
}

if (require.main === module) {
  runDiscoveryBatch()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal discovery worker crash:', err);
      process.exit(1);
    });
}