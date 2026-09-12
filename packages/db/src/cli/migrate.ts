// Load packages/db/.env before anything reads process.env, so running this from
// a terminal needs no shell setup. Real environment variables still win.
import { loadLocalEnv } from '../env';

loadLocalEnv();

const { migrate } = await import('../migrate');
const { pool } = await import('../pool');

/**
 * `pnpm db:migrate` — applies pending migrations.
 *
 * Also runs as part of the admin app's Vercel build, so production and preview
 * databases are migrated before the new code serves traffic.
 *
 * The dynamic imports above are deliberate: `pool.ts` throws at module load if
 * no connection string is set, so the .env file has to be read first.
 */
async function main(): Promise<void> {
  const { applied, skipped } = await migrate();

  if (applied.length === 0) {
    console.log(`[migrate] up to date (${skipped.length} already applied)`);
  } else {
    for (const name of applied) console.log(`[migrate] applied ${name}`);
    console.log(`[migrate] done — ${applied.length} applied, ${skipped.length} already applied`);
  }
}

main()
  .then(() => pool.end())
  .catch(async (error: unknown) => {
    console.error('[migrate] FAILED\n');
    console.error(error instanceof Error ? error.message : error);
    await pool.end().catch(() => undefined);
    process.exit(1);
  });
