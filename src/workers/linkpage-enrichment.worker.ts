import { db } from '../db/client';
import { contacts, leads } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { linkPageScraper } from '../services/extraction/linkpage.scraper';
import { jobRunner } from '../services/jobs/job.runner';
import { reconcilePendingLeadQualifications } from './verification.worker';

export interface LinkpageEnrichmentResult {
  processed: number;
  emailsFound: number;
  failed: number;
}

export async function runLinkpageEnrichmentBatch(batchSize = 20): Promise<LinkpageEnrichmentResult> {
  console.log(`\n======================================================`);
  console.log(`🔗 Starting Link-Page Enrichment Worker (batchSize=${batchSize})`);
  console.log(`======================================================\n`);

  const jobId = await jobRunner.createJob('CLEANUP', { type: 'LINKPAGE_ENRICHMENT', batchSize });

  let processedCount = 0;
  let emailsFoundCount = 0;
  let failedCount = 0;

  try {
    // 1. Atomically claim batch of PENDING link pages
    const claimedRows = await db.transaction(async (tx) => {
      const candidateIdsResult = await tx.execute<{ id: number; lead_id: number; value: string; contact_type: string }>(sql`
        SELECT id, lead_id, value, contact_type
        FROM contacts
        WHERE link_scrape_status = 'PENDING'
          AND value IS NOT NULL
          AND value != ''
        ORDER BY id ASC
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED;
      `);

      const rows = candidateIdsResult.rows;
      if (rows.length === 0) return [];

      const ids = rows.map((r) => Number(r.id));
      await tx.execute(sql`
        UPDATE contacts
        SET link_scrape_status = 'SCRAPING', updated_at = NOW()
        WHERE id IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)});
      `);

      return rows;
    });

    if (claimedRows.length === 0) {
      console.log('ℹ️ [Linkpage Worker] No PENDING link-page contacts found to scrape.');
      await jobRunner.completeJob(jobId, 0);
      return { processed: 0, emailsFound: 0, failed: 0 };
    }

    console.log(`[Linkpage Worker] Claimed ${claimedRows.length} link page(s) for deep scraping.`);

    for (const row of claimedRows) {
      const contactId = Number(row.id);
      const leadId = Number(row.lead_id);
      const targetUrl = row.value;

      try {
        console.log(`  🌐 Scraping [${row.contact_type}]: ${targetUrl}`);
        const result = await linkPageScraper.scrapeLinkPage(targetUrl);

        if (result.status === 'SUCCESS' && result.emails.length > 0) {
          console.log(`    ✅ Found ${result.emails.length} email(s) on ${targetUrl}`);

          // Insert each recovered email atomically
          for (let i = 0; i < result.emails.length; i++) {
            const item = result.emails[i];
            const cleanEmail = item.email.toLowerCase().trim();

            await db
              .insert(contacts)
              .values({
                leadId,
                contactType: 'EMAIL',
                value: cleanEmail,
                normalizedValue: cleanEmail,
                source: 'linkpage_scraper',
                isPrimary: false,
                email: cleanEmail,
                emailStatus: 'UNKNOWN', // Ready for verification worker!
                emailCategory: item.category,
              })
              .onConflictDoNothing();

            emailsFoundCount++;
          }

          // Mark source row as COMPLETED
          await db
            .update(contacts)
            .set({
              linkScrapeStatus: 'COMPLETED',
              updatedAt: new Date(),
            })
            .where(eq(contacts.id, contactId));
        } else if (result.status === 'NO_EMAIL') {
          console.log(`    ℹ️ No emails found on ${targetUrl}`);
          await db
            .update(contacts)
            .set({
              linkScrapeStatus: 'NO_EMAIL',
              updatedAt: new Date(),
            })
            .where(eq(contacts.id, contactId));
        } else {
          console.warn(`    ⚠️ Scrape failed (${result.error}) for ${targetUrl}`);
          await db
            .update(contacts)
            .set({
              linkScrapeStatus: 'FAILED',
              updatedAt: new Date(),
            })
            .where(eq(contacts.id, contactId));
          failedCount++;
        }

        // Also update socials on the lead if newly discovered from Linktree
        if (Object.keys(result.socials).length > 0) {
          for (const [sType, sHandle] of Object.entries(result.socials)) {
            const cType = (sType.toLowerCase() === 'twitter' ? 'TWITTER_X' : sType.toUpperCase()) as any;
            await db
              .insert(contacts)
              .values({
                leadId,
                contactType: cType,
                value: sHandle,
                normalizedValue: sHandle.toLowerCase(),
                source: 'linkpage_scraper',
                isPrimary: false,
              })
              .onConflictDoNothing();
          }
        }
      } catch (rowErr: any) {
        console.error(`    ❌ Error processing contact ${contactId}:`, rowErr.message);
        await db
          .update(contacts)
          .set({ linkScrapeStatus: 'FAILED', updatedAt: new Date() })
          .where(eq(contacts.id, contactId));
        failedCount++;
      }

      processedCount++;
    }

    // Reconcile qualifications so any newly added emails qualify their leads
    await reconcilePendingLeadQualifications();

    await jobRunner.completeJob(jobId, processedCount);
    console.log(
      `\n✅ Linkpage enrichment completed: ${processedCount} pages processed, ${emailsFoundCount} new emails discovered, ${failedCount} failed.`
    );

    return { processed: processedCount, emailsFound: emailsFoundCount, failed: failedCount };
  } catch (error: any) {
    console.error('[Linkpage Worker] Critical error:', error);
    await jobRunner.failJob(jobId, error.message);
    return { processed: processedCount, emailsFound: emailsFoundCount, failed: failedCount };
  }
}
