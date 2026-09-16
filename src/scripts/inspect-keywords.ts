import { db, getDbPool } from '../db/client';
import { keywords, leads, contacts } from '../db/schema';
import { sql } from 'drizzle-orm';

async function check() {
  const kwStats = await db.select({
    status: keywords.status,
    count: sql`count(*)`
  }).from(keywords).groupBy(keywords.status);
  console.log('KEYWORD STATS:', kwStats);

  const totalLeads = await db.select({ count: sql`count(*)` }).from(leads);
  const totalContacts = await db.select({ count: sql`count(*)` }).from(contacts);
  console.log('TOTAL LEADS:', totalLeads[0].count, 'TOTAL CONTACTS:', totalContacts[0].count);

  await getDbPool().end();
}
check().then(() => process.exit(0)).catch(async e => { console.error(e); await getDbPool().end(); process.exit(1); });
