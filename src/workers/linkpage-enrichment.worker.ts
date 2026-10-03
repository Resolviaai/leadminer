import { db } from '../db/client';
import { contacts, leads } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { linkPageScraper } from '../services/extraction/linkpage.scraper';
import { websiteScraper } from '../services/extraction/website.scraper';
import { emailExtractor, classifyEmailRole, categorizeEmail } from '../services/extraction/email.extractor';
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

  const jobId = await jobRunner.createJob('LINKPAGE_ENRICHMENT', { batchSize });

  let processedCount = 0;
  let emailsFoundCount = 0;
  let failedCount = 0;

  try {
    // 1. Atomically claim batch of PENDING link pages with dual-queue fair-share:
    // Prioritize high-yield LINKTREE / BEACONS (up to 80% of batch), balance with WEBSITE (20%)
    const claimedRows = await db.transaction(async (tx) => {
      const targetLinkCount = Math.min(batchSize, Math.max(1, Math.floor(batchSize * 0.8)));

      const linkResult = await tx.execute<{ id: number; lead_id: number; value: string; contact_type: string }>(sql`
        SELECT id, lead_id, value, contact_type
        FROM contacts
        WHERE link_scrape_status = 'PENDING'
          AND contact_type IN ('LINKTREE', 'BEACONS')
          AND value IS NOT NULL
          AND value != ''
        ORDER BY id ASC
        LIMIT ${targetLinkCount}
        FOR UPDATE SKIP LOCKED;
      `);

      const linkRows = linkResult.rows;

      // Fill remaining batch capacity with websites
      const targetWebCount = Math.max(batchSize - linkRows.length, 1);
      const webResult = await tx.execute<{ id: number; lead_id: number; value: string; contact_type: string }>(sql`
        SELECT id, lead_id, value, contact_type
        FROM contacts
        WHERE link_scrape_status = 'PENDING'
          AND contact_type NOT IN ('LINKTREE', 'BEACONS')
          AND value IS NOT NULL
          AND value != ''
        ORDER BY id ASC
        LIMIT ${targetWebCount}
        FOR UPDATE SKIP LOCKED;
      `);

      const webRows = webResult.rows;
      const combined = [...linkRows, ...webRows];
      if (combined.length === 0) return [];

      const ids = combined.map((r) => Number(r.id));
      await tx.execute(sql`
        UPDATE contacts
        SET link_scrape_status = 'SCRAPING', updated_at = NOW()
        WHERE id IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)});
      `);

      return combined;
    });

    if (claimedRows.length === 0) {
      console.log('ℹ️ [Linkpage Worker] No PENDING link-page contacts found to scrape.');
      await jobRunner.completeJob(jobId, 0);
      return { processed: 0, emailsFound: 0, failed: 0 };
    }

    console.log(`[Linkpage Worker] Claimed ${claimedRows.length} link page(s) for deep scraping.`);

    // 2. Process claimed rows with bounded concurrency (4 parallel workers) and 45s time-budget guard
    const CONCURRENCY_LIMIT = 4;
    const MAX_EXECUTION_TIME_MS = 45000;
    const startTime = Date.now();
    let currentIndex = 0;

    const processSingleContact = async (row: { id: number; lead_id: number; value: string; contact_type: string }) => {
      const contactId = Number(row.id);
      const leadId = Number(row.lead_id);
      const targetUrl = row.value;

      try {
        const isLinkTreeOrBeacons =
          row.contact_type === 'LINKTREE' ||
          row.contact_type === 'BEACONS' ||
          /linktr\.ee|beacons\.ai|stan\.store/i.test(targetUrl);

        console.log(`  🌐 Scraping [${row.contact_type}]: ${targetUrl}`);

        if (isLinkTreeOrBeacons) {
          const result = await linkPageScraper.scrapeLinkPage(targetUrl);

          if (result.status === 'SUCCESS' && result.emails.length > 0) {
            console.log(`    ✅ Found ${result.emails.length} email(s) on ${targetUrl}`);

            // Insert each recovered email atomically with full repair provenance
            for (let i = 0; i < result.emails.length; i++) {
              const item = result.emails[i];
              const cleanEmail = item.email.toLowerCase().trim();

              const inserted = await db
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
                  emailCategory: item.category || item.role,
                  wasRepaired: item.wasRepaired ?? false,
                  repairedFrom: item.repairedFrom ?? null,
                  repairCode: item.repairCode ?? null,
                  rawContextSnippet: item.rawContextSnippet ?? null,
                })
                .onConflictDoNothing()
                .returning({ id: contacts.id });

              if (inserted && inserted.length > 0) {
                emailsFoundCount++;
              }
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
          if (result.socials && Object.keys(result.socials).length > 0) {
            for (const [sType, sHandle] of Object.entries(result.socials)) {
              if (!sHandle) continue;
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
        } else {
          // Scrape standard website
          const result = await websiteScraper.scrapeUrl(targetUrl);
          const foundEmailObjects = result.extractedEmailDetails || [];

          if (foundEmailObjects.length > 0 || result.emails.length > 0) {
            console.log(`    ✅ Found ${Math.max(foundEmailObjects.length, result.emails.length)} email(s) on website ${targetUrl}`);

            const emailsToInsert = foundEmailObjects.length > 0
              ? foundEmailObjects
              : result.emails.map((em) => {
                  const { role, priorityScore } = classifyEmailRole(em, targetUrl);
                  return {
                    email: em,
                    source: 'website_scraper' as const,
                    role,
                    priorityScore,
                    category: categorizeEmail(em),
                    confidence: 0.90,
                    contextSnippet: `Website: ${targetUrl}`,
                    wasRepaired: false,
                    repairedFrom: null,
                    repairCode: null,
                    rawContextSnippet: `Website: ${targetUrl}`,
                  };
                });

            for (const item of emailsToInsert) {
              const cleanEmail = item.email.toLowerCase().trim();

              const inserted = await db
                .insert(contacts)
                .values({
                  leadId,
                  contactType: 'EMAIL',
                  value: cleanEmail,
                  normalizedValue: cleanEmail,
                  source: 'website_scraper',
                  isPrimary: false,
                  email: cleanEmail,
                  emailStatus: 'UNKNOWN',
                  emailCategory: item.category || item.role,
                  wasRepaired: item.wasRepaired ?? false,
                  repairedFrom: item.repairedFrom ?? null,
                  repairCode: item.repairCode ?? null,
                  rawContextSnippet: item.rawContextSnippet ?? item.contextSnippet ?? null,
                })
                .onConflictDoNothing()
                .returning({ id: contacts.id });

              if (inserted && inserted.length > 0) {
                emailsFoundCount++;
              }
            }

            await db
              .update(contacts)
              .set({
                linkScrapeStatus: 'COMPLETED',
                updatedAt: new Date(),
              })
              .where(eq(contacts.id, contactId));
          } else {
            console.log(`    ℹ️ No emails found on website ${targetUrl}`);
            await db
              .update(contacts)
              .set({
                linkScrapeStatus: 'NO_EMAIL',
                updatedAt: new Date(),
              })
              .where(eq(contacts.id, contactId));
          }

          // Insert discovered socials
          if (result.socials && Object.keys(result.socials).length > 0) {
            for (const [sType, sHandle] of Object.entries(result.socials)) {
              if (!sHandle) continue;
              const cType = (sType.toLowerCase() === 'twitter' ? 'TWITTER_X' : sType.toUpperCase()) as any;
              await db
                .insert(contacts)
                .values({
                  leadId,
                  contactType: cType,
                  value: sHandle,
                  normalizedValue: sHandle.toLowerCase(),
                  source: 'website_scraper',
                  isPrimary: false,
                })
                .onConflictDoNothing();
            }
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
    };

    // Run up to CONCURRENCY_LIMIT workers concurrently
    const workerPromises = Array.from({ length: CONCURRENCY_LIMIT }, async () => {
      while (true) {
        if (Date.now() - startTime > MAX_EXECUTION_TIME_MS) {
          break;
        }
        let rowToProcess: { id: number; lead_id: number; value: string; contact_type: string } | undefined;
        if (currentIndex < claimedRows.length) {
          rowToProcess = claimedRows[currentIndex++];
        } else {
          break;
        }
        if (rowToProcess) {
          await processSingleContact(rowToProcess);
        }
      }
    });

    await Promise.all(workerPromises);

    // Release any unhandled rows due to time budget back to PENDING
    if (currentIndex < claimedRows.length) {
      const unhandledRows = claimedRows.slice(currentIndex);
      const unhandledIds = unhandledRows.map((r) => Number(r.id));
      await db.execute(sql`
        UPDATE contacts
        SET link_scrape_status = 'PENDING', updated_at = NOW()
        WHERE id IN (${sql.join(unhandledIds.map((id) => sql`${id}`), sql`, `)});
      `);
      console.log(`⏱️ [Linkpage Worker] Released ${unhandledRows.length} unhandled contacts back to PENDING due to time budget.`);
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
