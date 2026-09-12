import { HONEYPOT_FIELD, insertRequest, submissionSchema } from '@lopoti-nooklean/db';

import { ok, publicRoute } from '@/lib/api';
import { preflight } from '@/lib/cors';

/**
 * POST /api/submit
 *
 * PUBLIC BY DESIGN — this is how a visitor's form reaches the database.
 * It is one of only three unauthenticated endpoints (the others serve published
 * configuration and a quote by its secret token).
 *
 * Defences, since anyone can call this:
 *   * CORS restricts which origins a browser will let call it.
 *   * Zod validates every field, so malformed input never reaches SQL.
 *   * A honeypot field silently absorbs bots.
 */

export const POST = publicRoute(submissionSchema, async ({ input, origin }) => {
  // Bots fill every field they find, including the one no human can see.
  // Respond as though it worked: telling a bot it was detected only invites
  // a more careful bot.
  const honeypot = (input as Record<string, unknown>)[HONEYPOT_FIELD];
  if (typeof honeypot === 'string' && honeypot.length > 0) {
    return ok({ ok: true }, origin);
  }

  const created = await insertRequest(input);

  // Only the id goes back. The public site needs nothing else, and echoing the
  // stored row would leak whatever the database chose to keep.
  return ok({ ok: true, id: created.id }, origin);
});

export function OPTIONS(request: Request): Response {
  return preflight(request.headers.get('origin'));
}
