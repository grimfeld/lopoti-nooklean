import { API_ORIGIN } from './config';

/**
 * Client for the back-office API.
 *
 * This site holds no secrets and no database connection: every write goes
 * through the admin API. The origin comes from `./config`, which is the single
 * audited place this app reads the environment.
 */

export interface SubmitResult {
  readonly ok: boolean;
  readonly id?: number;
  readonly error?: string;
}

/**
 * Sends a request form to the back office.
 *
 * `credentials: 'omit'` is deliberate: a visitor has no session, and sending
 * cookies cross-origin would force a stricter CORS configuration for no gain.
 */
export async function submitRequest(payload: Record<string, unknown>): Promise<SubmitResult> {
  try {
    const response = await fetch(`${API_ORIGIN}/api/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      body: JSON.stringify({ ...payload, brand: 'lopoti' }),
    });

    const data: unknown = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
          ? data.error
          : 'Une erreur est survenue. Merci de réessayer.';
      return { ok: false, error: message };
    }

    const id =
      typeof data === 'object' && data !== null && 'id' in data && typeof data.id === 'number'
        ? data.id
        : undefined;

    return { ok: true, ...(id === undefined ? {} : { id }) };
  } catch {
    // A network failure must not look like a successful submission: the visitor
    // would believe their request was received.
    return {
      ok: false,
      error: 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.',
    };
  }
}
