import { db, getDbPool } from '../db/client';
import { contacts, leads, campaigns } from '../db/schema';
import { isNotNull, inArray, and, eq } from 'drizzle-orm';
import { leadQualificationService } from '../services/qualification/qualification.service';

export async function reconcileQualifications(): Promise<{ reconciled: number; newlyQualified: number }> {
  const activeCampaigns = await db.select().from(campaigns).where(eq(campaigns.status, 'ACTIVE')).limit(1);
  if (activeCampaigns.length === 0) {
    return { reconciled: 0, newlyQualified: 0 };
  }
  const campaign = activeCampaigns[0];
  const minSubs = campaign.minSubscribers ? Number(campaign.minSubscribers) : 10;
  const maxSubs = campaign.maxSubscribers ? Number(campaign.maxSubscribers) : undefined;

  const candidates = await db
    .select({
      leadId: leads.id,
      title: leads.channelTitle,
      subs: leads.subscriberCount,
      country: leads.country,
      suppressionStatus: leads.suppressionStatus,
      outreachStatus: leads.outreachStatus,
      qualificationStatus: leads.qualificationStatus,
      email: contacts.email,
      emailStatus: contacts.emailStatus,
    })
    .from(leads)
    .innerJoin(contacts, eq(leads.id, contacts.leadId))
    .where(
      and(
        eq(leads.outreachStatus, 'UNPROCESSED'),
        inArray(contacts.emailStatus, ['VALID', 'DOMAIN_VALID', 'MAILBOX_VERIFIED']),
        isNotNull(contacts.email)
      )
    );

  let reconciled = 0;
  let newlyQualified = 0;

  for (const item of candidates) {
    reconciled++;
    const res = leadQualificationService.qualify(
      {
        subscriberCount: item.subs || 0,
        email: item.email,
        emailStatus: item.emailStatus,
        country: item.country || undefined,
        isSuppressed: item.suppressionStatus,
        alreadyContacted: false,
      },
      {
        minSubscribers: minSubs,
        maxSubscribers: maxSubs,
        requireEmail: true,
        requireValidEmail: true,
        targetCountry: campaign.targetCountry || undefined,
      }
    );

    const targetStatus = res.qualified ? 'QUALIFIED' : 'DISQUALIFIED';
    if (item.qualificationStatus !== targetStatus) {
      await db.update(leads).set({ qualificationStatus: targetStatus, updatedAt: new Date() }).where(eq(leads.id, item.leadId));
      if (res.qualified) {
        newlyQualified++;
        console.log(`[Reconcile] Lead ${item.leadId} ("${item.title}") marked QUALIFIED for outreach (${item.email})`);
      }
    }
  }

  return { reconciled, newlyQualified };
}

if (require.main === module) {
  reconcileQualifications()
    .then(async (res) => {
      console.log(`Done: Reconciled ${res.reconciled} leads, ${res.newlyQualified} newly qualified.`);
      await getDbPool().end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Reconcile error:', err);
      await getDbPool().end();
      process.exit(1);
    });
}
