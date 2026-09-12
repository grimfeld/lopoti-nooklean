/**
 * Client for the back-office API.
 *
 * Identical in shape to the Lopoti site's client, and deliberately duplicated
 * rather than shared: the two apps must stay independent, and this file is
 * small enough that a shared abstraction would cost more in coupling than it
 * saves in lines. The payloads differ (buildings and mailboxes here, animals
 * there), so the shared part would be a thin wrapper around `fetch`.
 */

import { API_ORIGIN } from './config';

export interface SubmitResult {
  readonly ok: boolean;
  readonly id?: number;
  readonly error?: string;
}

export async function submitRequest(payload: Record<string, unknown>): Promise<SubmitResult> {
  try {
    const response = await fetch(`${API_ORIGIN}/api/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      body: JSON.stringify({ ...payload, brand: 'nooklean' }),
    });

    const data: unknown = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        typeof data === 'object' &&
        data !== null &&
        'error' in data &&
        typeof data.error === 'string'
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
    return {
      ok: false,
      error: 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.',
    };
  }
}

/**
 * Reads confirmed slots so taken times can be greyed out.
 *
 * Only *confirmed* jobs block a slot — a pending request from another visitor
 * does not, because the owner decides who gets a contested time. See
 * docs/decisions.md, decision 6.
 */
export async function fetchTakenSlots(date: string): Promise<string[]> {
  try {
    const response = await fetch(
      `${API_ORIGIN}/api/availability?date=${encodeURIComponent(date)}`,
      { credentials: 'omit' },
    );
    if (!response.ok) return [];

    const data: unknown = await response.json();
    if (typeof data !== 'object' || data === null || !('taken' in data)) return [];
    const { taken } = data;
    return Array.isArray(taken) ? taken.filter((slot): slot is string => typeof slot === 'string') : [];
  } catch {
    // Availability is an optimisation, not a guarantee: the database constraint
    // is what actually prevents a double booking. Failing open keeps the form
    // usable when the lookup is unavailable.
    return [];
  }
}
