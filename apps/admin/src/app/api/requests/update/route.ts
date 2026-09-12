import { SlotConflictError, requestUpdateSchema, updateRequest } from '@lopoti-nooklean/db';

import { errorResponse, ok, protectedRoute } from '@/lib/api';
import { preflight } from '@/lib/cors';

/**
 * POST /api/requests/update   { id, statut?, starts_at? }
 *
 * Changes a request's lifecycle status, or moves it on the calendar.
 *
 * Confirming a request can fail: the shared calendar allows only one *confirmed*
 * job at a given moment across both brands, enforced by a partial unique index.
 * That conflict is reported as a clear French message rather than a 500.
 */

export const POST = protectedRoute(requestUpdateSchema, async ({ input, origin }) => {
  const { id, ...patch } = input;

  try {
    const updated = await updateRequest(id, patch);
    if (!updated) return errorResponse('Demande introuvable.', 404, origin);
    return ok({ request: updated }, origin);
  } catch (error) {
    if (error instanceof SlotConflictError) {
      return errorResponse(error.message, 409, origin);
    }
    throw error;
  }
});

export function OPTIONS(request: Request): Response {
  return preflight(request.headers.get('origin'));
}
