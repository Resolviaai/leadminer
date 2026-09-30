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

  // Group candidate contacts by leadId to correctly handle 1:N contact relationships
  const leadsMap = new Map<
    number,
    {
      leadId: number;
      title: string;
      subs: number;
      country: string | null;
      suppressionStatus: boolean;
      qualificationStatus: string;
      contacts: { email: string; emailStatus: any }[];
    }
  >();

  for (const row of candidates) {
    if (!leadsMap.has(row.leadId)) {
      leadsMap.set(row.leadId, {
        leadId: row.leadId,
        title: row.title,
        subs: row.subs || 0,
        country: row.country,
        suppressionStatus: row.suppressionStatus,
        qualificationStatus: row.qualificationStatus,
        contacts: [],
      });
    }
    if (row.email) {
      leadsMap.get(row.leadId)!.contacts.push({
        email: row.email,
        emailStatus: row.emailStatus,
      });
    }
  }

  let reconciled = 0;
  let newlyQualified = 0;

  for (const item of leadsMap.values()) {
    reconciled++;
    // A lead is QUALIFIED if ANY of its eligible contacts satisfy campaign criteria
    let isLeadQualified = false;
    let qualifyingEmail: string | undefined;

    for (const c of item.contacts) {
      const res = leadQualificationService.qualify(
        {
          subscriberCount: item.subs,
          email: c.email,
          emailStatus: c.emailStatus,
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

      if (res.qualified) {
        isLeadQualified = true;
        qualifyingEmail = c.email;
        break;
      }
    }

    const targetStatus = isLeadQualified ? 'QUALIFIED' : 'DISQUALIFIED';
    if (item.qualificationStatus !== targetStatus) {
      await db.update(leads).set({ qualificationStatus: targetStatus, updatedAt: new Date() }).where(eq(leads.id, item.leadId));
      if (isLeadQualified) {
        newlyQualified++;
        console.log(`[Reconcile] Lead ${item.leadId} ("${item.title}") marked QUALIFIED for outreach (${qualifyingEmail})`);
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
