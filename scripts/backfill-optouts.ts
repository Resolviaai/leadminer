import { getDbPool } from '../src/db/client';
import { OPT_OUT_REGEX, stripQuotedText } from '../src/services/replies/reply.detector';
import { sequenceService } from '../src/services/outreach/sequence.service';

async function main() {
  const pool = getDbPool();
  console.log('=== RUNNING HISTORICAL BACKFILL & TEMPLATE CLEANUP ===');

  // 1. Clean default templates
  const tRes = await pool.query('SELECT id, name, body FROM templates');
  for (const t of tRes.rows) {
    if (t.body && t.body.includes('Opt-out:')) {
      const cleanBody = t.body.replace(/\n*Opt-out: reply STOP to unsubscribe\./gi, '').trim();
      await pool.query('UPDATE templates SET body = $1 WHERE id = $2', [cleanBody, t.id]);
      console.log(`✅ Cleaned opt-out line from template #${t.id} (${t.name})`);
    }
  }

  // 2. Scan historical replies for newly expanded opt-out phrases
  const repliesRes = await pool.query(`
    SELECT r.id, r.lead_id, r.sender_email, r.snippet, l.outreach_status
    FROM replies r
    JOIN leads l ON r.lead_id = l.id
    WHERE l.outreach_status != 'UNSUBSCRIBED'
  `);

  console.log(`Found ${repliesRes.rows.length} replies on non-unsubscribed leads.`);
  let suppressedCount = 0;

  for (const row of repliesRes.rows) {
    const text = stripQuotedText(row.snippet || '');
    if (OPT_OUT_REGEX.test(text)) {
      console.log(`🛑 Detected historical opt-out for lead #${row.lead_id} (${row.sender_email}): "${text}"`);
      await pool.query(
        `INSERT INTO suppressions (email, reason, source) VALUES ($1, 'OPT_OUT_REPLY', 'HISTORICAL_BACKFILL') ON CONFLICT (email) DO NOTHING`,
        [row.sender_email.toLowerCase().trim()]
      );
      await pool.query(
        `UPDATE leads SET outreach_status = 'UNSUBSCRIBED', suppression_status = true, updated_at = NOW() WHERE id = $1`,
        [row.lead_id]
      );
      try {
        await sequenceService.cancelSequenceForLead(row.lead_id, 'CANCELLED_OPT_OUT');
      } catch (e: any) {
        console.warn('Sequence cancel non-fatal:', e.message);
      }
      suppressedCount++;
    }
  }

  console.log(`🎉 Finished historical backfill: ${suppressedCount} leads suppressed & cancelled.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Backfill error:', err);
  process.exit(1);
});
