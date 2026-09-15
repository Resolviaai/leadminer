import { db } from '../db/client';
import { contacts, leads, keywords, suppressions, campaigns } from '../db/schema';
import { eq, and, isNotNull, sql } from 'drizzle-orm';
import { emailVerificationService } from '../services/verification/verifier.service';
import { leadQualificationService } from '../services/qualification/qualification.service';
import { jobRunner } from '../services/jobs/job.runner';

export async function runVerificationBatch(limit = 25): Promise<{ verified: number; qualified: number }> {
  console.log(`\n======================================================`);
  console.log(`🔍 Starting Email Verification & Qualification Worker (limit=${limit})`);
  console.log(`======================================================\n`);

  const jobId = await jobRunner.createJob('EMAIL_VERIFICATION', { limit });

  try {
    // 1. Fetch unverified contacts with associated lead data
    const unverified = await db
      .select({
        contactId: contacts.id,
        email: contacts.email,
        leadId: leads.id,
        channelTitle: leads.channelTitle,
        subscriberCount: leads.subscriberCount,
        category: keywords.category,
        suppressionStatus: leads.suppressionStatus,
        country: leads.country,
      })
      .from(contacts)
      .innerJoin(leads, eq(contacts.leadId, leads.id))
      .leftJoin(keywords, eq(leads.sourceKeywordId, keywords.id))
      .where(and(eq(contacts.emailStatus, 'UNKNOWN'), isNotNull(contacts.email)))
      .limit(limit);

    if (unverified.length === 0) {
      console.log('ℹ️ No unverified emails pending in database.');
      await jobRunner.completeJob(jobId, 0);
      return { verified: 0, qualified: 0 };
    }

    console.log(`📋 Found ${unverified.length} unverified contacts to verify.`);

    // 2. Extract emails and run parallel batch verification
    const emailsToVerify = unverified.map((item) => item.email || '');
    const verificationResults = await emailVerificationService.verifyBatch(emailsToVerify, 20);

    // 3. Dynamically fetch active campaign qualification criteria
    const activeCampaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.status, 'ACTIVE'))
      .limit(1);

    const minSubs = activeCampaign[0]?.minSubscribers ?? 1000;
    const maxSubs = activeCampaign[0]?.maxSubscribers ?? 1000000;

    let verifiedCount = 0;
    let qualifiedCount = 0;

    // 4. Map results back to contact IDs and persist checkpoints immediately
    for (let i = 0; i < unverified.length; i++) {
      const item = unverified[i];
      const vResult = verificationResults[i];
      if (!item.email || !vResult) continue;

      console.log(
        `\n[Contact ${item.contactId}] Verified: ${item.email} -> ${vResult.status} [${vResult.reasonCode || ''}]`
      );

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
          alreadyContacted: false,
        },
        {
          minSubscribers: minSubs,
          maxSubscribers: maxSubs,
          requireEmail: true,
          requireValidEmail: true,
          targetCountry: activeCampaign[0]?.targetCountry || undefined,
        }
      );

      const newQualStatus = qResult.qualified ? 'QUALIFIED' : 'DISQUALIFIED';
      await db
        .update(leads)
        .set({
          qualificationStatus: newQualStatus,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, item.leadId));

      if (qResult.qualified) {
        qualifiedCount++;
        await jobRunner.logEvent(jobId, 'LEAD_QUALIFIED', 'INFO', `Lead ${item.channelTitle} marked QUALIFIED`, {
          leadId: item.leadId,
        });
      }

      verifiedCount++;
    }

    await jobRunner.updateHeartbeat(jobId, verifiedCount, 0);
    await jobRunner.completeJob(jobId, verifiedCount);
    console.log(`\n✅ Verification batch completed: ${verifiedCount} emails verified, ${qualifiedCount} leads qualified.`);
    return { verified: verifiedCount, qualified: qualifiedCount };
  } catch (error: any) {
    console.error('[Verification Worker] Critical failure:', error);
    await jobRunner.failJob(jobId, error.message);
    return { verified: 0, qualified: 0 };
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
