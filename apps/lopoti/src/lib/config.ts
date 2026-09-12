/* eslint-disable no-restricted-properties --
 * The ONE place this public app reads the environment.
 *
 * The ban exists because a public site must never ship a secret to a browser.
 * The exception is narrow and auditable: only `NEXT_PUBLIC_*` variables may be
 * read here, and those are inlined at build time by design — a URL, never a
 * credential. Centralising the read means a reviewer checks one short file
 * instead of trusting every component.
 *
 * If you find yourself wanting to add a non-public variable here, the logic
 * belongs in apps/admin instead. That is where secrets live.
 */

/**
 * Origin of the back-office API. Every write from this site goes through it,
 * because this app has no database access of its own.
 *
 * Defaults to the admin app's local dev port, so `pnpm dev` works with no setup.
 */
export const API_ORIGIN = process.env['NEXT_PUBLIC_API_ORIGIN'] ?? 'http://localhost:3003';

/* eslint-enable no-restricted-properties */
