import { db, getDbPool } from '../db/client';
import { contacts, leads } from '../db/schema';
import { isNotNull, eq } from 'drizzle-orm';

async function check() {
  const withEmail = await db.select({
    contactId: contacts.id,
    leadId: contacts.leadId,
    email: contacts.email,
    emailStatus: contacts.emailStatus,
    reason: contacts.verificationReason,
    leadQual: leads.qualificationStatus,
    leadOutreach: leads.outreachStatus,
    subs: leads.subscriberCount,
    title: leads.channelTitle
  }).from(contacts).innerJoin(leads, eq(contacts.leadId, leads.id)).where(isNotNull(contacts.email));
  console.log('CONTACTS WITH EMAIL (' + withEmail.length + '):', JSON.stringify(withEmail, null, 2));
  await getDbPool().end();
}
check().then(() => process.exit(0)).catch(async e => { console.error(e); await getDbPool().end(); process.exit(1); });
