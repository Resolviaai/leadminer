import fs from 'fs';
import path from 'path';
import { getDbPool } from './client';

export function splitSqlStatements(sql: string): string[] {
  const lines = sql.split('\n');
  const cleanedLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--')) continue;
    cleanedLines.push(line);
  }
  const cleanedSql = cleanedLines.join('\n');

  const statements: string[] = [];
  let current = '';
  let inString = false;
  let dollarTag: string | null = null;

  for (let i = 0; i < cleanedSql.length; i++) {
    const char = cleanedSql[i];

    if (!dollarTag && char === "'") {
      if (inString && cleanedSql[i + 1] === "'") {
        current += "''";
        i++;
        continue;
      }
      inString = !inString;
      current += char;
    } else if (!inString && char === '$') {
      // Check for dollar quote start or end
      if (dollarTag) {
        if (cleanedSql.startsWith(dollarTag, i)) {
          current += dollarTag;
          i += dollarTag.length - 1;
          dollarTag = null;
          continue;
        }
      } else {
        // Look ahead for matching '$' to form opening $tag$ (e.g. $$ or $body$)
        const match = cleanedSql.slice(i).match(/^(\$[a-zA-Z0-9_]*\$)/);
        if (match) {
          dollarTag = match[1];
          current += dollarTag;
          i += dollarTag.length - 1;
          continue;
        }
      }
      current += char;
    } else if (char === ';' && !inString && !dollarTag) {
      const stmt = current.trim();
      if (stmt.length > 0) {
        statements.push(stmt);
      }
      current = '';
    } else {
      current += char;
    }
  }

  const remainder = current.trim();
  if (remainder.length > 0) {
    statements.push(remainder);
  }

  return statements;
}

// Postgres SQLSTATE codes for duplicate schema objects:
// 42P07: duplicate_table
// 42701: duplicate_column
// 42710: duplicate_object (enum label, constraint, index, type)
// 42723: duplicate_function
export const DUPLICATE_OBJECT_SQLSTATES = new Set(['42P07', '42701', '42710', '42723']);

export function isDuplicateObjectError(err: any): boolean {
  if (!err) return false;
  if (err.code && DUPLICATE_OBJECT_SQLSTATES.has(err.code)) {
    return true;
  }
  const msg = (err.message || '').toLowerCase();
  return (
    (msg.includes('relation') && msg.includes('already exists')) ||
    (msg.includes('column') && msg.includes('already exists')) ||
    (msg.includes('type') && msg.includes('already exists')) ||
    (msg.includes('enum label') && msg.includes('already exists')) ||
    (msg.includes('constraint') && msg.includes('already exists')) ||
    (msg.includes('index') && msg.includes('already exists'))
  );
}

export async function runMigrations() {
  console.log('🔄 Running database migrations...');
  const pool = getDbPool();
  const client = await pool.connect();

  const MIGRATION_LOCK_ID = 884729104;

  try {
    // 1. Acquire advisory lock to serialize migrations across concurrent workers/instances
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_ID]);

    const migrationsDir = path.join(process.cwd(), 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found at ${migrationsDir}`);
    }

    // 2. Ensure migrations ledger table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "__app_migrations" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE "__app_migrations" ENABLE ROW LEVEL SECURITY;
    `);

    // 3. Fetch already applied migrations
    const appliedResult = await client.query<{ name: string }>('SELECT name FROM "__app_migrations"');
    const appliedSet = new Set(appliedResult.rows.map((r) => r.name));

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration file(s): ${files.join(', ')}`);

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`⏩ [Skipped] Migration ${file} already applied.`);
        continue;
      }

      console.log(`Running migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
      const statements = splitSqlStatements(sql);
      const hasAddValue = /ADD\s+VALUE/i.test(sql);

      if (hasAddValue) {
        // Run statements directly without transaction block (Postgres requirement for ADD VALUE)
        for (const stmt of statements) {
          try {
            await client.query(stmt);
          } catch (stmtErr: any) {
            if (isDuplicateObjectError(stmtErr)) {
              console.warn(`⚠️ [Migration ${file}] Duplicate object (ignored): ${stmtErr.message?.split('\n')[0]}`);
            } else {
              throw stmtErr;
            }
          }
        }
        await client.query('INSERT INTO "__app_migrations" (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [file]);
      } else {
        // Run inside transaction with safe statement-level savepoints
        await client.query('BEGIN');
        try {
          for (let sIdx = 0; sIdx < statements.length; sIdx++) {
            const stmt = statements[sIdx];
            const spName = `sp_${sIdx}`;
            await client.query(`SAVEPOINT ${spName}`);
            try {
              await client.query(stmt);
              await client.query(`RELEASE SAVEPOINT ${spName}`);
            } catch (stmtErr: any) {
              if (isDuplicateObjectError(stmtErr)) {
                await client.query(`ROLLBACK TO SAVEPOINT ${spName}`);
                console.warn(`⚠️ [Migration ${file}] Duplicate object (ignored): ${stmtErr.message?.split('\n')[0]}`);
              } else {
                throw stmtErr;
              }
            }
          }
          await client.query('INSERT INTO "__app_migrations" (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [file]);
          await client.query('COMMIT');
        } catch (txErr: any) {
          await client.query('ROLLBACK');
          throw txErr;
        }
      }
      console.log(`✅ ${file} applied successfully.`);
    }
    console.log('✅ All database migrations executed successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_ID]);
    } catch {
      // Ignore unlock failure on closed connection
    }
    client.release();
  }
}

// Allow direct execution
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
