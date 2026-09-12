import pg from 'pg';

/**
 * The single Postgres connection pool for the whole system.
 *
 * This module is the ONLY place in the repository allowed to import `pg`
 * (enforced by ESLint). Every query goes through `packages/db` so that schema
 * knowledge, validation, and connection handling live in exactly one place.
 *
 * `max: 1` is deliberate. On Vercel each serverless instance gets its own
 * process, so a large pool per instance multiplies connections against Neon's
 * limit without helping throughput at this traffic level.
 */

const connectionString = process.env['DATABASE_URL'] ?? process.env['POSTGRES_URL'];

if (!connectionString) {
  throw new Error(
    'No database connection string. Set DATABASE_URL (or POSTGRES_URL).\n' +
      'Local development: run `pnpm db:local:up` and copy packages/db/.env.example to .env.',
  );
}

/**
 * Neon requires TLS. `pg` does not enable it from the URL alone in every
 * environment, so it is set explicitly. `rejectUnauthorized` stays true —
 * disabling certificate verification would make the TLS pointless.
 */
const needsTls = /neon\.tech|sslmode=require/.test(connectionString);

export const pool = new pg.Pool({
  connectionString,
  max: 1,
  // Fail fast rather than hanging a serverless invocation until its timeout.
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,
  ...(needsTls ? { ssl: { rejectUnauthorized: true } } : {}),
});

/** Surfaces pool-level failures instead of crashing the process silently. */
pool.on('error', (error) => {
  console.error('[db] idle client error', error);
});

export type QueryParam = string | number | boolean | Date | null | undefined;

/**
 * Runs a parameterised query. Always pass values as `params` — never
 * interpolate them into the SQL string, or the query becomes injectable.
 */
export async function query<Row extends pg.QueryResultRow>(
  sql: string,
  params: readonly QueryParam[] = [],
): Promise<Row[]> {
  const result = await pool.query<Row>(sql, params as QueryParam[]);
  return result.rows;
}

/** Runs `fn` inside a transaction, rolling back if it throws. */
export async function transaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
