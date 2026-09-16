import { db, getDbPool } from '../db/client';
import { contacts, leads, campaigns } from '../db/schema';
import { isNotNull, eq } from 'drizzle-orm';
import { leadQualificationService } from '../services/qualification/qualification.service';
import { env } from '../config/env';

async function check() {
  console.log('ALLOW_DOMAIN_VALID_OUTREACH in env:', env.ALLOW_DOMAIN_VALID_OUTREACH, typeof env.ALLOW_DOMAIN_VALID_OUTREACH);

  const activeCampaign = await db.select().from(campaigns).where(eq(campaigns.status, 'ACTIVE')).limit(1);
  const camp = activeCampaign[0];
  console.log('ACTIVE CAMPAIGN:', camp);

  const withEmail = await db.select({
    contactId: contacts.id,
    leadId: leads.id,
    email: contacts.email,
    emailStatus: contacts.emailStatus,
    subs: leads.subscriberCount,
    title: leads.channelTitle,
    country: leads.country,
    suppressionStatus: leads.suppressionStatus,
    outreachStatus: leads.outreachStatus,
    qualificationStatus: leads.qualificationStatus,
  }).from(contacts).innerJoin(leads, eq(contacts.leadId, leads.id)).where(isNotNull(contacts.email));

  for (const item of withEmail) {
    const res = leadQualificationService.qualify(
      {
        subscriberCount: item.subs || 0,
        email: item.email,
        emailStatus: item.emailStatus,
        country: item.country || undefined,
        isSuppressed: item.suppressionStatus,
        alreadyContacted: item.outreachStatus === 'CONTACTED',
      },
      {
        minSubscribers: camp?.minSubscribers ? Number(camp.minSubscribers) : 10,
        maxSubscribers: camp?.maxSubscribers ? Number(camp.maxSubscribers) : undefined,
        requireEmail: true,
        requireValidEmail: true,
        targetCountry: camp?.targetCountry || undefined,
      }
    );
    console.log(`Lead ${item.leadId} ("${item.title}", email: ${item.email}, status: ${item.emailStatus}, currentQual: ${item.qualificationStatus}) -> QUALIFIES? ${res.qualified} (${res.reason})`);
  }

  await getDbPool().end();
}
check().then(() => process.exit(0)).catch(async e => { console.error(e); await getDbPool().end(); process.exit(1); });
