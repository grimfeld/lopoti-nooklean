import { checkHealth } from '@lopoti-nooklean/db';

import { ok, protectedRoute } from '@/lib/api';
import { z } from 'zod';

/**
 * GET /api/health
 *
 * Backs the back-office health page, which answers "is everything working?" in
 * plain French for someone who will never read a log.
 *
 * Protected, because it reports row counts and timestamps about real customers.
 */

export const GET = protectedRoute(z.object({}).passthrough(), async ({ origin }) => {
  try {
    const db = await checkHealth();
    return ok({ db }, origin);
  } catch (error) {
    // A health check must report failure as data, not as a 500 — the page needs
    // to render "la base de données ne répond pas" rather than break.
    return ok(
      {
        db: {
          reachable: false,
          error: error instanceof Error ? error.message : String(error),
        },
      },
      origin,
    );
  }
});
