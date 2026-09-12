import { z } from 'zod';

import { corsHeaders } from './cors';
import { readSession } from './auth';

/**
 * The API route toolkit.
 *
 * Two properties are enforced here rather than left to each route:
 *
 *   1. **Authentication is the default.** `protectedRoute` requires a session;
 *      `publicRoute` is a separate, explicit choice. An AI adding a new route by
 *      copying an existing one inherits protection by accident rather than
 *      omitting it by accident.
 *
 *   2. **Input is validated.** Both helpers take a Zod schema and hand the
 *      handler parsed, typed data. There is no path to reading a raw body.
 */

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

/** Error messages are in French: the only person who reads them is the owner. */
export function errorResponse(message: string, status: number, origin: string | null): Response {
  return json({ error: message }, status, origin);
}

interface HandlerContext<Input> {
  readonly input: Input;
  readonly request: Request;
  readonly origin: string | null;
}

type Handler<Input> = (context: HandlerContext<Input>) => Promise<Response> | Response;

async function parseInput<Schema extends z.ZodTypeAny>(
  request: Request,
  schema: Schema,
): Promise<{ ok: true; data: z.infer<Schema> } | { ok: false; message: string }> {
  let raw: unknown;

  if (request.method === 'GET') {
    raw = Object.fromEntries(new URL(request.url).searchParams);
  } else {
    try {
      raw = await request.json();
    } catch {
      return { ok: false, message: 'Corps de requête JSON invalide.' };
    }
  }

  const parsed = schema.safeParse(raw) as z.SafeParseReturnType<unknown, z.infer<Schema>>;
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const where = first?.path.join('.');
    return {
      ok: false,
      message:
        where !== undefined && where.length > 0
          ? `${where} : ${first?.message ?? 'valeur invalide'}`
          : (first?.message ?? 'Requête invalide.'),
    };
  }

  return { ok: true, data: parsed.data };
}

/**
 * A route requiring a valid back-office session.
 *
 * Use this unless there is a specific reason a route must be reachable by an
 * anonymous visitor — and write that reason down where `publicRoute` is used.
 */
export function protectedRoute<Schema extends z.ZodTypeAny>(
  schema: Schema,
  handler: Handler<z.infer<Schema>>,
) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('origin');

    const session = readSession(request);
    if (!session.valid) {
      return errorResponse('Non autorisé. Reconnectez-vous.', 401, origin);
    }

    const parsed = await parseInput(request, schema);
    if (!parsed.ok) return errorResponse(parsed.message, 400, origin);

    const response = await handler({ input: parsed.data, request, origin });

    // Slide the session forward so active use never expires mid-task.
    if (session.refreshCookie) {
      response.headers.append('Set-Cookie', session.refreshCookie);
    }
    return response;
  };
}

/**
 * A route deliberately reachable without authentication.
 *
 * There are only three legitimate cases: a public site submitting a form,
 * a public site reading published configuration, and a customer opening a quote
 * by its secret token. Anything else should be a `protectedRoute`.
 */
export function publicRoute<Schema extends z.ZodTypeAny>(
  schema: Schema,
  handler: Handler<z.infer<Schema>>,
) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('origin');

    const parsed = await parseInput(request, schema);
    if (!parsed.ok) return errorResponse(parsed.message, 400, origin);

    return handler({ input: parsed.data, request, origin });
  };
}

export function ok(body: unknown, origin: string | null): Response {
  return json(body, 200, origin);
}
