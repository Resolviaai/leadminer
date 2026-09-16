import { db, getDbPool } from '../db/client';
import { gmailAccounts } from '../db/schema';

async function check() {
  const accs = await db.select().from(gmailAccounts);
  console.log('GMAIL ACCOUNTS:', accs.map(a => ({
    id: a.id,
    email: a.email,
    status: a.status,
    dailyLimit: a.dailyLimit,
    sentToday: a.sentToday,
    hasRefresh: Boolean(a.refreshToken),
    refreshLength: a.refreshToken?.length,
    hasAccess: Boolean(a.accessToken),
    expiresAt: a.tokenExpiresAt,
    lastError: a.lastError
  })));
  await getDbPool().end();
}
check().then(() => process.exit(0)).catch(async e => { console.error(e); await getDbPool().end(); process.exit(1); });
