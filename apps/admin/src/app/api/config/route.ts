import { z } from 'zod';

import {
  DEFAULT_SERVICES_CONFIG,
  SERVICES_CONFIG_KEY,
  getConfig,
  sanitizeServicesConfig,
  setConfig,
} from '@lopoti-nooklean/db';

import { errorResponse, ok, protectedRoute, publicRoute } from '@/lib/api';
import { preflight } from '@/lib/cors';

/**
 * GET  /api/config  — the service catalogue, read by the public Lopoti site.
 * POST /api/config  — saves it from the back office.
 *
 * The GET is PUBLIC BY DESIGN: it feeds the request form, and it contains
 * nothing private — the same words a visitor reads on the page. It is one of
 * only three unauthenticated endpoints.
 *
 * The POST is protected, because it changes what every visitor sees.
 */

export const GET = publicRoute(z.object({}).passthrough(), async ({ origin }) => {
  try {
    const config = await getConfig('lopoti', SERVICES_CONFIG_KEY, DEFAULT_SERVICES_CONFIG);
    return ok({ config }, origin);
  } catch (error) {
    // A database outage must degrade to a working site rather than an empty
    // form, so the shipped defaults are served instead of an error.
    console.error('[config] read failed, serving defaults:', error);
    return ok({ config: DEFAULT_SERVICES_CONFIG }, origin);
  }
});

const saveSchema = z.object({ config: z.unknown() });

export const POST = protectedRoute(saveSchema, async ({ input, origin }) => {
  const clean = sanitizeServicesConfig(input.config);

  if (!clean) {
    return errorResponse(
      'Configuration invalide : au moins un service et un animal sont requis.',
      400,
      origin,
    );
  }

  await setConfig('lopoti', SERVICES_CONFIG_KEY, clean);
  return ok({ config: clean }, origin);
});

export function OPTIONS(request: Request): Response {
  return preflight(request.headers.get('origin'));
}
