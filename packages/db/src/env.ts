import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { config as loadDotenv } from 'dotenv';

/**
 * Loads `packages/db/.env` for command-line use.
 *
 * Why this exists: the migration commands are run from a terminal, and relying
 * on the shell to carry `DATABASE_URL` is exactly the kind of invisible step
 * that goes wrong. A file on disk is something you can look at.
 *
 * Deployed environments are unaffected: Vercel and CI inject real environment
 * variables, and those always win — `override` is left off deliberately, so a
 * stale local file can never shadow a production connection string.
 *
 * Only the CLI entry points import this. The library itself never reads files,
 * so importing `@lopoti-nooklean/db` from an app has no filesystem side effects.
 */
export function loadLocalEnv(): void {
  const path = fileURLToPath(new URL('../.env', import.meta.url));
  if (existsSync(path)) {
    loadDotenv({ path });
  }
}
