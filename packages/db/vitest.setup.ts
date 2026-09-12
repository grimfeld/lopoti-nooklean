import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { config as loadDotenv } from 'dotenv';

/**
 * Makes `packages/db/.env` available to the test run.
 *
 * Without this, the database-backed tests would skip themselves locally (they
 * are gated on `DATABASE_URL`) and a contributor would think they had run the
 * important tests when they had not — the worst kind of green.
 *
 * CI sets real environment variables pointing at its own Postgres, and those
 * take precedence: `override` is deliberately left off.
 */
const path = fileURLToPath(new URL('.env', import.meta.url));
if (existsSync(path)) {
  loadDotenv({ path });
}
