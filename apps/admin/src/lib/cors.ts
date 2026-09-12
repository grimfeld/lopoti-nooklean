import { config } from './config';

/**
 * CORS for the admin API.
 *
 * The two public sites are separate Vercel projects on separate origins, so
 * every form submission and availability lookup is a cross-origin request.
 *
 * Preview deployments are the awkward part: Vercel gives each build a fresh URL
 * like `lopoti-git-fix-abc123-team.vercel.app`, so an allowlist of literal
 * strings would break on every pull request. They are matched by pattern
 * instead — still restricted to this team's projects on vercel.app, never a
 * blanket wildcard.
 */

/** Production origins, from configuration. */
function configuredOrigins(): string[] {
  return [config.PUBLIC_ORIGIN_LOPOTI, config.PUBLIC_ORIGIN_NOOKLEAN].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  );
}

/**
 * Vercel preview and production URLs for the two public projects.
 * Matches e.g. `https://lopoti-abc123-grimfeld.vercel.app` and
 * `https://nooklean.vercel.app`.
 */
const PREVIEW_ORIGIN = /^https:\/\/(lopoti|nooklean)(-[a-z0-9-]+)?\.vercel\.app$/;

/** Local development ports, allowed only when not running in production. */
const LOCAL_ORIGIN = /^http:\/\/localhost:(3001|3002)$/;

export function isAllowedOrigin(origin: string | null): origin is string {
  if (!origin) return false;

  if (configuredOrigins().includes(origin)) return true;
  if (PREVIEW_ORIGIN.test(origin)) return true;
  if (config.VERCEL_ENV !== 'production' && LOCAL_ORIGIN.test(origin)) return true;

  return false;
}

/**
 * Headers for a cross-origin response.
 *
 * `credentials: true` is required because the back office authenticates with a
 * cookie. That in turn means the origin must be echoed exactly — a wildcard is
 * not permitted alongside credentials, which is a useful safety property rather
 * than an inconvenience.
 */
export function corsHeaders(origin: string | null): Record<string, string> {
  if (!isAllowedOrigin(origin)) return {};

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    // Caches must not serve one origin's response to another.
    Vary: 'Origin',
  };
}

/** Response for a CORS preflight request. */
export function preflight(origin: string | null): Response {
  const headers = corsHeaders(origin);
  // An origin we do not recognise gets a plain refusal, not CORS headers.
  return new Response(null, {
    status: Object.keys(headers).length > 0 ? 204 : 403,
    headers,
  });
}
