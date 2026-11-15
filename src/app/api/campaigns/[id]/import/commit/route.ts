import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { campaigns, leads, contacts, campaignLeads, suppressions, logs } from '@/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { verifyDashboardAuth } from '@/lib/api-auth';
import { verifyWorkerAuth } from '@/lib/worker-auth';
import { withAdvisoryLock, LOCK_KEYS } from '@/lib/pipeline-lock';
import {
  spreadsheetImporterService,
  ColumnMapping,
  ParsedLeadRow,
} from '@/services/import/spreadsheet-importer.service';

export const dynamic = 'force-dynamic';

const BATCH_SIZE = 250;
const MAX_EXECUTION_MS = 45000; // 45s hard time budget to protect against Vercel 60s timeout

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const sessionAuth = verifyDashboardAuth(req);
  const workerAuth = verifyWorkerAuth(req);
  if (!sessionAuth.authorized && !workerAuth.authorized) {
    return sessionAuth.response || workerAuth.response!;
  }

  const campaignId = Number(params.id);
  if (!campaignId || isNaN(campaignId)) {
    return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
  }

  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data') && !contentType.includes('application/json')) {
    return NextResponse.json(
      { error: 'Unsupported Content-Type. Use multipart/form-data or application/json' },
      { status: 415 }
    );
  }

  // Acquire dedicated advisory lock for CSV ingestion
  const lockResult = await withAdvisoryLock(
    LOCK_KEYS.CSV_IMPORT,
    `CAMPAIGN_IMPORT_${campaignId}`,
    async () => {
      const [camp] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
      if (!camp) {
        return { notFound: true };
      }

      let validRows: ParsedLeadRow[] = [];
      let startIndex = 0;

      const contentType = req.headers.get('content-type') || '';

      if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        if (!file) {
          throw new Error('No file provided in form data');
        }

        let customMapping: Partial<ColumnMapping> | undefined;
        const mappingRaw = formData.get('mapping') as string | null;
        if (mappingRaw) {
          try {
            customMapping = JSON.parse(mappingRaw);
          } catch {
            // ignore
          }
        }

        const startIndexRaw = formData.get('startIndex') as string | null;
        if (startIndexRaw) {
          startIndex = parseInt(startIndexRaw, 10) || 0;
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const parsed = spreadsheetImporterService.parseSpreadsheet(buffer, customMapping);
        validRows = parsed.validRows;
      } else if (contentType.includes('application/json')) {
        const body = await req.json();
        if (body.rows && Array.isArray(body.rows)) {
          validRows = body.rows;
        } else if (body.fileBase64) {
          const buffer = Buffer.from(body.fileBase64, 'base64');
          const parsed = spreadsheetImporterService.parseSpreadsheet(buffer, body.mapping);
          validRows = parsed.validRows;
        } else {
          throw new Error('Missing file or rows array in request body');
        }
        if (typeof body.startIndex === 'number') {
          startIndex = body.startIndex;
        }
      } else {
        throw new Error('Unsupported Content-Type');
      }

      if (validRows.length === 0) {
        return {
          enrolledCount: 0,
          suppressedCount: 0,
          updatedCount: 0,
          totalProcessed: 0,
          isComplete: true,
          nextIndex: 0,
        };
      }

      const rowsToProcess = validRows.slice(startIndex);
      const startTime = Date.now();
      const deadline = startTime + MAX_EXECUTION_MS;

      let enrolledCount = 0;
      let suppressedCount = 0;
      let updatedCount = 0;
      let processedInSession = 0;
      let isComplete = true;
      let nextIndex = startIndex;

      // Process in batches of 250
      for (let b = 0; b < rowsToProcess.length; b += BATCH_SIZE) {
        if (Date.now() >= deadline) {
          console.warn(`⏱️ [Campaign Import] Time budget reached (${Math.round((Date.now() - startTime) / 1000)}s). Yielding cleanly.`);
          isComplete = false;
          nextIndex = startIndex + processedInSession;
          break;
        }

        const batch = rowsToProcess.slice(b, b + BATCH_SIZE);
        const batchEmails = batch.map((r) => r.email);

        // Pre-fetch global suppressions for this batch
        const suppressedRecords = await db
          .select({ email: suppressions.email })
          .from(suppressions)
          .where(inArray(suppressions.email, batchEmails));

        const suppressedSet = new Set(
          suppressedRecords
            .map((s) => s.email?.toLowerCase())
            .filter((e): e is string => Boolean(e))
        );

        for (const row of batch) {
          processedInSession++;
          const isSuppressed = suppressedSet.has(row.email.toLowerCase());

          // Step A: Find existing lead by normalizedDomain (if corporate) or by contact email
          let leadId: number | null = null;

          if (row.normalizedDomain) {
            const domainMatch = await db
              .select({ id: leads.id })
              .from(leads)
              .where(eq(leads.normalizedDomain, row.normalizedDomain))
              .limit(1);

            if (domainMatch.length > 0) {
              leadId = domainMatch[0].id;
            }
          }

          if (!leadId) {
            const contactMatch = await db
              .select({ leadId: contacts.leadId })
              .from(contacts)
              .where(sql`lower(${contacts.email}) = ${row.email}`)
              .limit(1);

            if (contactMatch.length > 0) {
              leadId = contactMatch[0].leadId;
            }
          }

          if (leadId) {
            // Update company name and contact info on existing lead if missing
            await db
              .update(leads)
              .set({
                companyName: row.companyName || sql`COALESCE(${leads.companyName}, ${row.companyName})`,
                firstName: row.firstName || sql`COALESCE(${leads.firstName}, ${row.firstName})`,
                lastName: row.lastName || sql`COALESCE(${leads.lastName}, ${row.lastName})`,
                website: row.website || sql`COALESCE(${leads.website}, ${row.website})`,
                industry: row.industry || sql`COALESCE(${leads.industry}, ${row.industry})`,
                country: row.country || sql`COALESCE(${leads.country}, ${row.country})`,
                updatedAt: new Date(),
              })
              .where(eq(leads.id, leadId));
            updatedCount++;
          } else {
            // Create new lead record
            const [newLead] = await db
              .insert(leads)
              .values({
                sourceProvider: 'CSV',
                companyName: row.companyName || null,
                firstName: row.firstName || null,
                lastName: row.lastName || null,
                website: row.website || null,
                normalizedDomain: row.normalizedDomain || null,
                industry: row.industry || null,
                country: row.country || null,
                qualificationStatus: isSuppressed ? 'DISQUALIFIED' : 'QUALIFIED',
                outreachStatus: isSuppressed ? 'UNSUBSCRIBED' : 'UNPROCESSED',
                suppressionStatus: isSuppressed,
              })
              .returning({ id: leads.id });

            leadId = newLead.id;
          }

          // Step B: Ensure contact exists for lead
          let contactId: number | null = null;
          const existingContact = await db
            .select({ id: contacts.id })
            .from(contacts)
            .where(
              sql`lower(${contacts.email}) = ${row.email} AND ${contacts.leadId} = ${leadId}`
            )
            .limit(1);

          if (existingContact.length > 0) {
            contactId = existingContact[0].id;
          } else {
            const [newContact] = await db
              .insert(contacts)
              .values({
                leadId,
                email: row.email,
                value: row.email,
                normalizedValue: row.email,
                emailStatus: 'VALID',
                contactType: 'EMAIL',
                isPrimary: true,
                source: 'csv_import',
                confidenceScore: '1.00',
              })
              .returning({ id: contacts.id });
            contactId = newContact.id;
          }

          // Step C: Enroll into campaign_leads join table (idempotent ON CONFLICT)
          const targetStatus = isSuppressed ? 'DISQUALIFIED' : 'ENROLLED';
          const disqualifiedReason = isSuppressed ? 'GLOBAL_SUPPRESSION' : null;

          const enrolled = await db
            .insert(campaignLeads)
            .values({
              campaignId,
              leadId,
              primaryContactId: contactId,
              status: targetStatus,
              customVariables: row.customVariables || {},
              disqualifiedReason,
              enrolledAt: new Date(),
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [campaignLeads.campaignId, campaignLeads.leadId],
              set: {
                primaryContactId: contactId,
                customVariables: row.customVariables || {},
                updatedAt: new Date(),
              },
            })
            .returning({ id: campaignLeads.id });

          if (isSuppressed) {
            suppressedCount++;
          } else {
            enrolledCount++;
          }
        }
      }

      if (isComplete) {
        nextIndex = validRows.length;
        // Audit log import completion
        try {
          await db.insert(logs).values({
            eventType: 'CAMPAIGN_LEAD_IMPORT_COMPLETED',
            level: 'INFO',
            message: `Imported and enrolled ${enrolledCount} leads into campaign #${campaignId} (${suppressedCount} suppressed, ${updatedCount} existing updated)`,
            metadata: { campaignId, enrolledCount, suppressedCount, updatedCount },
          });
        } catch {
          // non-fatal
        }
      }

      return {
        enrolledCount,
        suppressedCount,
        updatedCount,
        totalProcessed: processedInSession,
        isComplete,
        nextIndex,
        totalValidRows: validRows.length,
      };
    }
  );

  if (!lockResult.executed) {
    return NextResponse.json(
      { error: 'Import job is currently running for another request. Please wait a moment.' },
      { status: 429 }
    );
  }

  if (lockResult.result?.notFound) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    campaignId,
    ...lockResult.result,
  });
}
