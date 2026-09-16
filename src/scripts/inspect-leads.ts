import { db, getDbPool } from '../db/client';
import { campaigns, leads, contacts } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

async function check() {
  const sampleLeads = await db.select({
    id: leads.id,
    title: leads.channelTitle,
    subs: leads.subscriberCount,
    country: leads.country,
    outreachStatus: leads.outreachStatus,
    qualificationStatus: leads.qualificationStatus,
    email: contacts.email,
    emailStatus: contacts.emailStatus,
    reason: contacts.verificationReason,
  }).from(leads).leftJoin(contacts, eq(leads.id, contacts.leadId)).limit(20);
  console.log('SAMPLE LEADS:', JSON.stringify(sampleLeads, null, 2));

  const qualCounts = await db.select({
    status: leads.qualificationStatus,
    count: sql`count(*)`
  }).from(leads).groupBy(leads.qualificationStatus);
  console.log('QUALIFICATION COUNTS:', JSON.stringify(qualCounts, null, 2));

  await getDbPool().end();
}
check().then(() => process.exit(0)).catch(async e => { console.error(e); await getDbPool().end(); process.exit(1); });
