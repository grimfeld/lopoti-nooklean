import { z } from 'zod';

import { listConfirmedSlots } from '@lopoti-nooklean/db';

import { ok, publicRoute } from '@/lib/api';
import { preflight } from '@/lib/cors';

/**
 * GET /api/availability?date=YYYY-MM-DD
 *
 * PUBLIC BY DESIGN — both public sites call this to grey out times that are
 * already taken.
 *
 * Returns confirmed jobs across BOTH brands, because they are one person's time.
 * A pending request from another visitor is deliberately NOT returned: the owner
 * decides who gets a contested slot, so an unanswered 2am enquiry must not lock
 * out a paying customer. See docs/decisions.md, decision 6.
 *
 * This endpoint is an optimisation, not a guarantee. The partial unique index in
 * the database is what actually prevents a double booking, so a stale answer
 * here is harmless — the worst case is a visitor asking for a slot that turns
 * out to be taken, which the owner then resolves.
 *
 * Only times are returned, never who holds them: this is readable by anyone.
 */

const querySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format AAAA-MM-JJ'),
});

export const GET = publicRoute(querySchema, async ({ input, origin }) => {
  // Paris local day. Storing timestamptz means the database handles the offset;
  // constructing the bounds from the date string keeps the query to one day.
  const from = new Date(`${input.date}T00:00:00`);
  const to = new Date(`${input.date}T23:59:59.999`);

  if (Number.isNaN(from.getTime())) {
    return ok({ date: input.date, taken: [] }, origin);
  }

  const slots = await listConfirmedSlots(from, to);

  const taken = slots.map((slot) =>
    slot.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris',
    }),
  );

  return ok({ date: input.date, taken }, origin);
});

export function OPTIONS(request: Request): Response {
  return preflight(request.headers.get('origin'));
}
