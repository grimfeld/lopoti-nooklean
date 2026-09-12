import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { formatViolations, inspectSql, type GuardViolation } from '../guard';

/**
 * `pnpm db:migrate:check` — the destructive-SQL guard as a standalone CI check.
 *
 * Runs without a database connection, so it can gate a pull request before any
 * deployment happens and report the problem as a plain failure.
 */

const MIGRATIONS_DIR = fileURLToPath(new URL('../../migrations', import.meta.url));

async function main(): Promise<void> {
  const entries = await readdir(MIGRATIONS_DIR);
  const files = entries.filter((name) => name.endsWith('.sql')).sort();

  const violations: GuardViolation[] = [];
  for (const file of files) {
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
    violations.push(...inspectSql(file, sql));
  }

  if (violations.length > 0) {
    console.error(formatViolations(violations));
    process.exit(1);
  }

  console.log(`[migrate:check] ${files.length} migration file(s) clean`);
}

main().catch((error: unknown) => {
  console.error('[migrate:check] failed to inspect migrations');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
