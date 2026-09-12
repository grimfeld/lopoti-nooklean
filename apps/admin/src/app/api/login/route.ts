import { z } from 'zod';

import {
  checkPassword,
  clearAttempts,
  clearedCookie,
  clientKey,
  isRateLimited,
  recordFailedAttempt,
  sessionCookie,
} from '@/lib/auth';
import { corsHeaders } from '@/lib/cors';

/**
 * POST /api/login    { password }  -> sets the session cookie
 * DELETE /api/login                -> clears it
 *
 * Deliberately NOT built with `publicRoute`: login is the one endpoint that
 * must be reachable unauthenticated *and* needs rate limiting, so it handles
 * its own request parsing.
 */

const bodySchema = z.object({ password: z.string().max(200) });

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get('origin');
  const headers = { 'Content-Type': 'application/json', ...corsHeaders(origin) };

  const key = clientKey(request);
  if (isRateLimited(key)) {
    return new Response(
      JSON.stringify({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' }),
      { status: 429, headers },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Requête invalide.' }), { status: 400, headers });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    recordFailedAttempt(key);
    return new Response(JSON.stringify({ error: 'Mot de passe manquant.' }), {
      status: 400,
      headers,
    });
  }

  if (!checkPassword(parsed.data.password)) {
    recordFailedAttempt(key);
    // The same message whether the password was wrong or malformed: there is
    // nothing useful to tell an attacker, and the owner knows his own password.
    return new Response(JSON.stringify({ error: 'Mot de passe incorrect.' }), {
      status: 401,
      headers,
    });
  }

  clearAttempts(key);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...headers, 'Set-Cookie': sessionCookie() },
  });
}

export function DELETE(request: Request): Response {
  const origin = request.headers.get('origin');
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
      'Set-Cookie': clearedCookie(),
    },
  });
}
