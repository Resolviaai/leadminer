import { db } from '../db/client';
import { contacts, leads, keywords, suppressions } from '../db/schema';
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

    let verifiedCount = 0;
    let qualifiedCount = 0;

    for (const item of unverified) {
      if (!item.email) continue;

      console.log(`\n[Contact ${item.contactId}] Verifying email: ${item.email}...`);

      // 2. Run Verification
      const vResult = await emailVerificationService.verifyEmail(item.email);
      console.log(`  Result: ${vResult.status} (${vResult.reason || 'verified'})`);

      // 3. Update Contact Record
      await db
        .update(contacts)
        .set({
          emailStatus: vResult.status,
          verificationProvider: vResult.provider,
          verificationReason: vResult.reason,
          verificationTimestamp: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(contacts.id, item.contactId));

      await jobRunner.logEvent(jobId, 'EMAIL_VERIFIED', 'INFO', `Verified ${item.email}: ${vResult.status}`, {
        contactId: item.contactId,
        email: item.email,
        status: vResult.status,
      });

      // 4. Run Lead Qualification
      const qResult = leadQualificationService.qualify(
        {
          subscriberCount: item.subscriberCount || 0,
          email: item.email,
          emailStatus: vResult.status,
          category: item.category,
          isSuppressed: item.suppressionStatus,
          alreadyContacted: false,
        },
        {
          minSubscribers: 1000,
          maxSubscribers: 1000000,
          requireEmail: true,
          requireValidEmail: true,
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
        await jobRunner.logEvent(jobId, 'LEAD_QUALIFIED', 'INFO', `Lead ${item.channelTitle} marked QUALIFIED`, { leadId: item.leadId });
      }

      verifiedCount++;
      await jobRunner.updateHeartbeat(jobId, verifiedCount, 0);
    }

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
