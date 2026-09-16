import { db, getDbPool } from '../db/client';
import { campaigns, leads, contacts, gmailAccounts, messages, jobs, systemSettings } from '../db/schema';
import { sql } from 'drizzle-orm';

async function check() {
  const c = await db.select().from(campaigns);
  console.log('CAMPAIGNS:', c.map(x => ({ id: x.id, name: x.name, status: x.status })));
  
  const g = await db.select().from(gmailAccounts);
  console.log('GMAIL ACCOUNTS:', g.map(x => ({ id: x.id, email: x.email, status: x.status, sentToday: x.sentToday })));

  const ks = await db.select().from(systemSettings);
  console.log('SYSTEM SETTINGS:', ks.map(x => ({ key: x.key, value: x.value })));

  const leadCounts = await db.select({
    total: sql`count(*)`,
    qualified: sql`count(*) filter (where qualification_status = 'QUALIFIED')`,
    unprocessed: sql`count(*) filter (where outreach_status = 'UNPROCESSED')`,
    contacted: sql`count(*) filter (where outreach_status = 'CONTACTED')`,
  }).from(leads);
  console.log('LEADS STATS:', leadCounts[0]);

  const contactStatuses = await db.select({
    status: contacts.emailStatus,
    count: sql`count(*)`
  }).from(contacts).groupBy(contacts.emailStatus);
  console.log('CONTACT EMAIL STATUSES:', contactStatuses);

  const msgCount = await db.select({ count: sql`count(*)` }).from(messages);
  console.log('MESSAGES COUNT:', msgCount[0]);

  const recentJobs = await db.select().from(jobs).orderBy(sql`id desc`).limit(5);
  console.log('RECENT JOBS:', recentJobs.map(j => ({ id: j.id, type: j.jobType, status: j.status, error: j.error, processed: j.itemsProcessed })));

  await getDbPool().end();
}

check().then(() => process.exit(0)).catch(async e => {
  console.error(e);
  await getDbPool().end();
  process.exit(1);
});
