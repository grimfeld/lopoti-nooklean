/* eslint-disable no-restricted-properties --
 * The ONE place this public app reads the environment. See the matching file in
 * apps/lopoti for the full reasoning: only `NEXT_PUBLIC_*` variables are allowed
 * here, they are public URLs rather than credentials, and anything secret
 * belongs in apps/admin.
 */

/** Origin of the back-office API, which owns the database. */
export const API_ORIGIN = process.env['NEXT_PUBLIC_API_ORIGIN'] ?? 'http://localhost:3003';

/* eslint-enable no-restricted-properties */
