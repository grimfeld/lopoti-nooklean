import { z } from 'zod';

import { brandSchema, listRequests, requestStatusSchema } from '@lopoti-nooklean/db';

import { ok, protectedRoute } from '@/lib/api';
import { preflight } from '@/lib/cors';

/**
 * GET /api/requests?brand=...&statut=...
 *
 * Every request from both brands, newest first, for the back-office list.
 * Protected: this is the customer database.
 */

const querySchema = z.object({
  brand: brandSchema.optional(),
  statut: requestStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
});

export const GET = protectedRoute(querySchema, async ({ input, origin }) => {
  // Each filter is omitted entirely when absent rather than passed as
  // `undefined`: `exactOptionalPropertyTypes` treats those as different, and the
  // query builder reads "property missing" as "do not filter".
  const requests = await listRequests({
    ...(input.brand !== undefined ? { brand: input.brand } : {}),
    ...(input.statut !== undefined ? { statut: input.statut } : {}),
    ...(input.limit !== undefined ? { limit: input.limit } : {}),
  });

  return ok({ requests }, origin);
});

export function OPTIONS(request: Request): Response {
  return preflight(request.headers.get('origin'));
}
