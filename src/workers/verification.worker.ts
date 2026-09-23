import { db } from '../db/client';
import { contacts, leads, keywords, suppressions, campaigns } from '../db/schema';
import { eq, and, isNotNull, inArray, sql } from 'drizzle-orm';
import { emailVerificationService } from '../services/verification/verifier.service';
import { aggregateQualificationStatus, leadQualificationService } from '../services/qualification/qualification.service';
import { jobRunner } from '../services/jobs/job.runner';

export async function runVerificationBatch(limit = 25): Promise<{ verified: number; qualified: number }> {
  console.log(`\n======================================================`);
  console.log(`🔍 Starting Email Verification & Qualification Worker (limit=${limit})`);
  console.log(`======================================================\n`);

  const jobId = await jobRunner.createJob('EMAIL_VERIFICATION', { limit });

  try {
    // 1. Atomically claim unverified contacts using FOR UPDATE SKIP LOCKED ordered by oldest first (P2-12)
    const claimedContactIds = await db.transaction(async (tx) => {
      const candidateIdsResult = await tx.execute<{ id: number }>(sql`
        SELECT c.id FROM ${contacts} c
        WHERE c.email_status = 'UNKNOWN' 
          AND c.email IS NOT NULL
          AND (c.verification_provider IS NULL OR c.verification_provider != 'IN_PROGRESS')
        ORDER BY c.id ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      `);
      const rows = (candidateIdsResult.rows || candidateIdsResult || []) as { id: number }[];
      const ids = rows.map((r) => Number(r.id));
      if (ids.length > 0) {
        await tx
          .update(contacts)
          .set({
            verificationProvider: 'IN_PROGRESS',
            updatedAt: new Date(),
          })
          .where(inArray(contacts.id, ids));
      }
      return ids;
    });

    if (claimedContactIds.length === 0) {
      const requalified = await reconcilePendingLeadQualifications();
      console.log(`ℹ️ No unverified emails pending in database. Reconciled and qualified ${requalified} existing leads.`);
      await jobRunner.completeJob(jobId, requalified);
      return { verified: 0, qualified: requalified };
    }

    // Fetch full contact and lead data for claimed contacts
    const unverified = await db
      .select({
        contactId: contacts.id,
        email: contacts.email,
        verificationReason: contacts.verificationReason,
        leadId: leads.id,
        channelTitle: leads.channelTitle,
        subscriberCount: leads.subscriberCount,
        category: keywords.category,
        suppressionStatus: leads.suppressionStatus,
        country: leads.country,
        outreachStatus: leads.outreachStatus,
      })
      .from(contacts)
      .innerJoin(leads, eq(contacts.leadId, leads.id))
      .leftJoin(keywords, eq(leads.sourceKeywordId, keywords.id))
      .where(inArray(contacts.id, claimedContactIds))
      .orderBy(contacts.id);

    console.log(`📋 Atomically claimed ${unverified.length} unverified contacts (oldest first).`);

    // 2. Extract emails and run parallel batch verification
    const emailsToVerify = unverified.map((item) => item.email || '');
    const verificationResults = await emailVerificationService.verifyBatch(emailsToVerify, 20);

    // 3. Dynamically fetch active campaign qualification criteria
    const activeCampaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.status, 'ACTIVE'))
      .limit(1);

    const minSubs = activeCampaign[0]?.minSubscribers ? Number(activeCampaign[0].minSubscribers) : 10;
    const maxSubs = activeCampaign[0]?.maxSubscribers ? Number(activeCampaign[0].maxSubscribers) : undefined;

    let verifiedCount = 0;
    let qualifiedCount = 0;
    const qualificationResultsByLead = new Map<number, ReturnType<typeof leadQualificationService.qualify>[]>();

    // 4. Map results back to contact IDs and persist checkpoints immediately
    for (let i = 0; i < unverified.length; i++) {
      const item = unverified[i];
      const vResult = verificationResults[i];
      if (!item.email || !vResult) continue;

      console.log(
        `\n[Contact ${item.contactId}] Verified: ${item.email} -> ${vResult.status} [${vResult.reasonCode || ''}]`
      );

      // DNS Timeout Re-queue Logic (P2-13): allow up to 3 transient timeouts before permanent failure
      if (vResult.reasonCode === 'DNS_TIMEOUT') {
        const timeoutMatch = (item.verificationReason || '').match(/DNS timeout \(attempt (\d+)\/3\)/);
        const previousTimeouts = timeoutMatch ? parseInt(timeoutMatch[1], 10) : 0;

        if (previousTimeouts < 2) {
          const nextAttempt = previousTimeouts + 1;
          console.warn(`  ⚠️ DNS lookup timed out for ${item.email}. Re-queuing (attempt ${nextAttempt}/3)...`);
          await db
            .update(contacts)
            .set({
              emailStatus: 'UNKNOWN',
              verificationProvider: null,
              verificationReason: `DNS timeout (attempt ${nextAttempt}/3)`,
              updatedAt: new Date(),
            })
            .where(eq(contacts.id, item.contactId));

          await jobRunner.logEvent(
            jobId,
            'EMAIL_VERIFIED',
            'WARN',
            `DNS timeout for ${item.email}. Re-queued for retry (${nextAttempt}/3).`,
            { contactId: item.contactId, email: item.email, attempt: nextAttempt }
          );
          continue;
        }
      }

      // Build descriptive verification reason including role-based flag if applicable
      const reasonParts: string[] = [];
      if (vResult.reason) {
        reasonParts.push(vResult.reason);
      }
      if (vResult.isRoleBased && !vResult.reason?.includes('role-based')) {
        reasonParts.push('(role-based address flagged)');
      }
      const verificationReason = reasonParts.length > 0 ? reasonParts.join(' ') : (vResult.reasonCode || 'verified');

      // Checkpoint: update contact record immediately in DB
      await db
        .update(contacts)
        .set({
          emailStatus: vResult.status,
          verificationProvider: vResult.provider,
          verificationReason,
          verificationTimestamp: vResult.timestamp || new Date(),
          updatedAt: new Date(),
        })
        .where(eq(contacts.id, item.contactId));

      await jobRunner.logEvent(
        jobId,
        'EMAIL_VERIFIED',
        'INFO',
        `Verified ${item.email}: ${vResult.status} [${vResult.reasonCode || ''}]`,
        {
          contactId: item.contactId,
          email: item.email,
          status: vResult.status,
          reasonCode: vResult.reasonCode,
          isRoleBased: vResult.isRoleBased,
        }
      );

      // 5. Run Lead Qualification
      const qResult = leadQualificationService.qualify(
        {
          subscriberCount: item.subscriberCount || 0,
          email: item.email,
          emailStatus: vResult.status,
          category: item.category,
          country: item.country || undefined,
          isSuppressed: item.suppressionStatus,
          alreadyContacted: ['CONTACTED', 'REPLIED', 'UNSUBSCRIBED', 'BOUNCED'].includes(item.outreachStatus),
        },
        {
          minSubscribers: minSubs,
          maxSubscribers: maxSubs,
          requireEmail: true,
          requireValidEmail: true,
          targetCountry: activeCampaign[0]?.targetCountry || undefined,
        }
      );

      const results = qualificationResultsByLead.get(item.leadId) || [];
      results.push(qResult);
      qualificationResultsByLead.set(item.leadId, results);

      verifiedCount++;
    }

    // Aggregate at lead level after all contacts in this batch have been
    // evaluated. A valid secondary contact must never be overwritten by a
    // later invalid contact result.
    for (const [leadId, results] of qualificationResultsByLead.entries()) {
      const aggregateStatus = aggregateQualificationStatus(results);
      await db
        .update(leads)
        .set({ qualificationStatus: aggregateStatus, updatedAt: new Date() })
        .where(eq(leads.id, leadId));

      if (aggregateStatus === 'QUALIFIED') {
        qualifiedCount++;
        await jobRunner.logEvent(jobId, 'LEAD_QUALIFIED', 'INFO', `Lead #${leadId} marked QUALIFIED`, { leadId });
      }
    }

    const requalified = await reconcilePendingLeadQualifications();
    qualifiedCount += requalified;

    await jobRunner.updateHeartbeat(jobId, verifiedCount, 0);
    await jobRunner.completeJob(jobId, verifiedCount + requalified);
    console.log(`\n✅ Verification batch completed: ${verifiedCount} emails verified, ${qualifiedCount} leads qualified (${requalified} reconciled).`);
    return { verified: verifiedCount, qualified: qualifiedCount };
  } catch (error: any) {
    console.error('[Verification Worker] Critical failure:', error);
    await jobRunner.failJob(jobId, error.message);
    return { verified: 0, qualified: 0 };
  }
}

export async function reconcilePendingLeadQualifications(): Promise<number> {
  try {
    const activeCampaigns = await db.select().from(campaigns).where(eq(campaigns.status, 'ACTIVE')).limit(1);
    if (activeCampaigns.length === 0) return 0;
    const campaign = activeCampaigns[0];
    const minSubs = campaign.minSubscribers ? Number(campaign.minSubscribers) : 10;
    const maxSubs = campaign.maxSubscribers ? Number(campaign.maxSubscribers) : undefined;

    const candidates = await db
      .select({
        leadId: leads.id,
        channelTitle: leads.channelTitle,
        subscriberCount: leads.subscriberCount,
        category: keywords.category,
        country: leads.country,
        suppressionStatus: leads.suppressionStatus,
        qualificationStatus: leads.qualificationStatus,
        outreachStatus: leads.outreachStatus,
        email: contacts.email,
        emailStatus: contacts.emailStatus,
      })
      .from(leads)
      .innerJoin(contacts, eq(leads.id, contacts.leadId))
      .leftJoin(keywords, eq(leads.sourceKeywordId, keywords.id))
      .where(
        and(
          eq(leads.outreachStatus, 'UNPROCESSED'),
          eq(leads.qualificationStatus, 'DISQUALIFIED'),
          inArray(contacts.emailStatus, ['VALID', 'DOMAIN_VALID', 'MAILBOX_VERIFIED']),
          isNotNull(contacts.email)
        )
      )
      .limit(100);

    let newlyQualified = 0;
    for (const item of candidates) {
      const qResult = leadQualificationService.qualify(
        {
          subscriberCount: item.subscriberCount || 0,
          email: item.email,
          emailStatus: item.emailStatus,
          category: item.category,
          country: item.country || undefined,
          isSuppressed: item.suppressionStatus,
          alreadyContacted: ['CONTACTED', 'REPLIED', 'UNSUBSCRIBED', 'BOUNCED'].includes(item.outreachStatus),
        },
        {
          minSubscribers: minSubs,
          maxSubscribers: maxSubs,
          requireEmail: true,
          requireValidEmail: true,
          targetCountry: campaign.targetCountry || undefined,
        }
      );

      if (qResult.qualified) {
        await db
          .update(leads)
          .set({ qualificationStatus: 'QUALIFIED', updatedAt: new Date() })
          .where(eq(leads.id, item.leadId));
        newlyQualified++;
        console.log(`[Reconciled Lead] Marked ${item.channelTitle} (${item.email}) as QUALIFIED`);
      }
    }
    return newlyQualified;
  } catch (e: any) {
    console.warn('[Reconciliation Error]:', e.message);
    return 0;
  }
}

if (require.main === module) {
  runVerificationBatch()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal verification worker crash:', err);
      process.exit(1);
    });
}
