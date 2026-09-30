import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const SOURCE_URL = process.env.SOURCE_DATABASE_URL;
const TARGET_URL = process.env.TARGET_DATABASE_URL;

if (!SOURCE_URL || !TARGET_URL) {
  console.error('⛔ Missing required environment variables: SOURCE_DATABASE_URL and TARGET_DATABASE_URL must both be set.');
  process.exit(1);
}

const sourcePool = new Pool({
  connectionString: SOURCE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 10000,
});

const targetPool = new Pool({
  connectionString: TARGET_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 10000,
});

async function runSql(pool: Pool, sqlContent: string, desc: string) {
  console.log(`Executing ${desc}...`);
  const client = await pool.connect();
  try {
    await client.query(sqlContent);
    console.log(`✅ ${desc} completed.`);
  } finally {
    client.release();
  }
}

async function runTargetMigrations() {
  console.log('\n--- Step 1: Running all migrations on target database ---');
  const migrationsDir = path.join(process.cwd(), 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found at ${migrationsDir}`);
  }

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    await runSql(targetPool, sql, file);
  }
}

async function copyTable(tableName: string, batchSize = 500) {
  console.log(`\n📦 Copying table "${tableName}"...`);
  const sourceClient = await sourcePool.connect();
  const targetClient = await targetPool.connect();

  try {
    const countRes = await sourceClient.query(`SELECT count(*)::int as cnt FROM ${tableName}`);
    const total = countRes.rows[0].cnt;
    console.log(`   Source has ${total} rows.`);

    if (total === 0) {
      console.log(`   Skipping empty table "${tableName}".`);
      return;
    }

    const colsRes = await sourceClient.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
      [tableName]
    );
    const cols = colsRes.rows.map((r) => r.column_name);
    const colList = cols.map((c) => `"${c}"`).join(', ');
    const hasIdCol = cols.includes('id');

    let processed = 0;
    let lastId = 0;

    while (processed < total) {
      let rows: any[] = [];
      if (hasIdCol) {
        // Fast keyset pagination
        const rowsRes = await sourceClient.query(
          `SELECT * FROM ${tableName} WHERE id > $1 ORDER BY id ASC LIMIT $2`,
          [lastId, batchSize]
        );
        rows = rowsRes.rows;
      } else {
        // Fallback offset pagination for tables without id
        const rowsRes = await sourceClient.query(
          `SELECT * FROM ${tableName} ORDER BY 1 LIMIT $1 OFFSET $2`,
          [batchSize, processed]
        );
        rows = rowsRes.rows;
      }

      if (rows.length === 0) break;

      const valueParams: any[] = [];
      const rowPlaceholders: string[] = [];

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const placeholders: string[] = [];
        for (let c = 0; c < cols.length; c++) {
          let val = row[cols[c]];
          if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
            val = JSON.stringify(val);
          }
          valueParams.push(val);
          placeholders.push(`$${valueParams.length}`);
        }
        rowPlaceholders.push(`(${placeholders.join(', ')})`);
      }

      await targetClient.query(
        `INSERT INTO ${tableName} (${colList}) VALUES ${rowPlaceholders.join(', ')} ON CONFLICT DO NOTHING`,
        valueParams
      );

      processed += rows.length;
      if (hasIdCol && rows.length > 0) {
        lastId = Number(rows[rows.length - 1].id);
      }

      if (processed % 2000 === 0 || processed === total) {
        console.log(`   Transferred ${processed} / ${total} rows...`);
      }
    }

    if (hasIdCol) {
      try {
        await targetClient.query(`SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), coalesce(max(id), 1)) FROM ${tableName}`);
      } catch {
        // Ignore sequence reset errors for non-serial ids
      }
    }

    const targetCount = await targetClient.query(`SELECT count(*)::int as cnt FROM ${tableName}`);
    console.log(`   ✅ "${tableName}" copy complete: Target has ${targetCount.rows[0].cnt} rows.`);
  } finally {
    sourceClient.release();
    targetClient.release();
  }
}

async function main() {
  console.log('🚀 Starting Supabase Database Migration & Transfer...');
  const start = Date.now();

  try {
    await runTargetMigrations();

    const tables = [
      'system_settings',
      'templates',
      'campaigns',
      'gmail_accounts',
      'keywords',
      'leads',
      'contacts',
      'lead_keyword_sources',
      'messages',
      'jobs',
      'logs',
      'replies',
      'scheduled_emails',
      'sequences',
      'sequence_steps',
      'lead_sequence_progress',
      'suppressions',
      'daily_api_usage',
      'jev_evaluations_cache',
    ];

    for (const table of tables) {
      await copyTable(table, table === 'keywords' ? 500 : 250);
    }

    // Run post-migration reconciliation
    await reconcileDatabase(tables);

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\n🎉 Migration & Data Transfer Finished Successfully in ${elapsed}s!`);
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

async function reconcileDatabase(tables: string[]) {
  console.log('\n======================================================');
  console.log('🔍 Running Post-Migration Table Reconciliation & Verification');
  console.log('======================================================\n');
  const sourceClient = await sourcePool.connect();
  const targetClient = await targetPool.connect();

  let allReconciled = true;

  try {
    for (const table of tables) {
      const srcCountRes = await sourceClient.query(`SELECT count(*)::int as cnt FROM ${table}`);
      const tgtCountRes = await targetClient.query(`SELECT count(*)::int as cnt FROM ${table}`);
      const srcCnt = srcCountRes.rows[0].cnt;
      const tgtCnt = tgtCountRes.rows[0].cnt;

      let srcMinMax = { min: 0, max: 0 };
      let tgtMinMax = { min: 0, max: 0 };
      try {
        const sMm = await sourceClient.query(`SELECT coalesce(min(id), 0) as min, coalesce(max(id), 0) as max FROM ${table}`);
        const tMm = await targetClient.query(`SELECT coalesce(min(id), 0) as min, coalesce(max(id), 0) as max FROM ${table}`);
        srcMinMax = sMm.rows[0];
        tgtMinMax = tMm.rows[0];
      } catch {
        // Table without id column
      }

      const match = srcCnt === tgtCnt;
      if (!match) allReconciled = false;

      const statusIcon = match ? '✅' : '⚠️';
      console.log(
        `${statusIcon} ${table.padEnd(26)} Source: ${String(srcCnt).padStart(6)} rows (id: ${srcMinMax.min}..${srcMinMax.max}) | Target: ${String(tgtCnt).padStart(6)} rows (id: ${tgtMinMax.min}..${tgtMinMax.max})`
      );
    }

    if (allReconciled) {
      console.log('\n🎉 Perfect Reconciliation: 100% of rows match between Source and Target!');
    } else {
      console.warn('\n⚠️ Discrepancy detected in row counts between Source and Target databases. Review log above.');
    }
  } finally {
    sourceClient.release();
    targetClient.release();
  }
}

if (require.main === module) {
  main();
}
