import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { pool } from './pool';
import { formatViolations, inspectSql } from './guard';

/**
 * Migration runner.
 *
 * Runs on every deploy, before the new code serves traffic. Applying a
 * migration is therefore a normal part of shipping, not a step anyone has to
 * remember — which matters because the person who owns these sites is not a
 * developer and will not be running SQL by hand.
 *
 * Properties that make this safe to run unattended:
 *
 *   * A ledger table (`schema_migrations`) records every applied file, so
 *     re-running is a no-op rather than a disaster.
 *   * Files apply in filename order, each inside its own transaction. A failing
 *     migration rolls back and stops the deploy.
 *   * A checksum detects a migration file edited after it was applied — the
 *     mistake where the database and the code silently disagree forever.
 *   * An advisory lock prevents two concurrent deploys from racing.
 *   * The destructive-SQL guard runs again here, so it cannot be bypassed.
 */

const MIGRATIONS_DIR = fileURLToPath(new URL('../migrations', import.meta.url));

// Arbitrary but fixed: any deploy taking this lock waits for the other.
const ADVISORY_LOCK_KEY = 8_423_117;

interface AppliedMigration {
  readonly name: string;
  readonly checksum: string;
}

function checksum(contents: string): string {
  // Normalise line endings so a Windows checkout and a Linux CI runner agree.
  return createHash('sha256').update(contents.replace(/\r\n/g, '\n')).digest('hex');
}

async function ensureLedger(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function readLedger(): Promise<Map<string, AppliedMigration>> {
  const { rows } = await pool.query<AppliedMigration>(
    'SELECT name, checksum FROM schema_migrations',
  );
  return new Map(rows.map((row) => [row.name, row]));
}

async function listMigrationFiles(): Promise<string[]> {
  const entries = await readdir(MIGRATIONS_DIR);
  return entries.filter((name) => name.endsWith('.sql')).sort();
}

export interface MigrateResult {
  readonly applied: string[];
  readonly skipped: string[];
}

export async function migrate(): Promise<MigrateResult> {
  const files = await listMigrationFiles();

  // Guard every file before touching the database, so a destructive migration
  // later in the list cannot be preceded by half-applied changes.
  const violations = [];
  for (const file of files) {
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
    violations.push(...inspectSql(file, sql));
  }
  if (violations.length > 0) {
    throw new Error(formatViolations(violations));
  }

  await ensureLedger();

  // Serialise concurrent deploys. Released automatically with the session.
  await pool.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_KEY]);

  try {
    const ledger = await readLedger();
    const applied: string[] = [];
    const skipped: string[] = [];

    for (const file of files) {
      const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
      const hash = checksum(sql);
      const previous = ledger.get(file);

      if (previous) {
        if (previous.checksum !== hash) {
          throw new Error(
            `Migration "${file}" was modified after it was applied.\n` +
              'The database and this file no longer agree, and editing an ' +
              'applied migration cannot fix that.\n' +
              'Add a NEW migration file with the change instead.',
          );
        }
        skipped.push(file);
        continue;
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)', [
          file,
          hash,
        ]);
        await client.query('COMMIT');
        applied.push(file);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(
          `Migration "${file}" failed and was rolled back:\n${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      } finally {
        client.release();
      }
    }

    return { applied, skipped };
  } finally {
    await pool.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_KEY]);
  }
}
