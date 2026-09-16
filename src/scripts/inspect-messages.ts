import { db, getDbPool } from '../db/client';
import { messages } from '../db/schema';

async function check() {
  const msgs = await db.select().from(messages);
  console.log('ALL MESSAGES:', JSON.stringify(msgs, null, 2));
  await getDbPool().end();
}
check().then(() => process.exit(0)).catch(async e => { console.error(e); await getDbPool().end(); process.exit(1); });
