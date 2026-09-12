'use client';

import { useCallback, useEffect, useState } from 'react';

import { REQUEST_STATUS_LABELS, type Brand, type RequestStatus } from '@lopoti-nooklean/db/schema';
import { formatDateFr } from '@lopoti-nooklean/ui';

import styles from './back-office.module.css';

/**
 * Back office — first vertical slice.
 *
 * Proves the protected path: log in, read every request from both brands,
 * change a status, see it persist. The calendar, quote editor, service editors
 * and health page arrive in later slices as additional views behind the same
 * brand switcher.
 */

interface RequestRow {
  id: number;
  brand: Brand;
  statut: RequestStatus;
  service: string;
  starts_at: string | null;
  nom_client: string;
  email: string;
  telephone: string;
  secteur?: string;
  created_at: string;
}

const BRAND_LABELS: Record<Brand, string> = {
  lopoti: 'Lopoti',
  nooklean: 'Nooklean',
};

type View = { kind: 'loading' } | { kind: 'login'; error?: string } | { kind: 'dashboard' };

export function BackOffice() {
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [brand, setBrand] = useState<Brand>('lopoti');
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    const response = await fetch('/api/requests', { credentials: 'same-origin' });

    if (response.status === 401) {
      setView({ kind: 'login' });
      return;
    }
    if (!response.ok) {
      setNotice('Impossible de charger les demandes.');
      return;
    }

    const data: unknown = await response.json();
    const list =
      typeof data === 'object' && data !== null && 'requests' in data && Array.isArray(data.requests)
        ? (data.requests as RequestRow[])
        : [];

    setRequests(list);
    setView({ kind: 'dashboard' });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get('password');

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      await load();
      return;
    }

    const data: unknown = await response.json().catch(() => ({}));
    const message =
      typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
        ? data.error
        : 'Connexion impossible.';
    setView({ kind: 'login', error: message });
  }

  async function handleLogout(): Promise<void> {
    await fetch('/api/login', { method: 'DELETE', credentials: 'same-origin' });
    setRequests([]);
    setView({ kind: 'login' });
  }

  async function changeStatus(id: number, statut: RequestStatus): Promise<void> {
    setNotice(null);

    const response = await fetch('/api/requests/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ id, statut }),
    });

    if (!response.ok) {
      const data: unknown = await response.json().catch(() => ({}));
      const message =
        typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
          ? data.error
          : 'La modification a échoué.';
      // A 409 means the shared calendar already has a confirmed job at that
      // moment — worth saying plainly rather than failing silently.
      setNotice(message);
      return;
    }

    await load();
  }

  if (view.kind === 'loading') {
    return <p className={styles.loading}>Chargement…</p>;
  }

  if (view.kind === 'login') {
    return (
      <section className={styles.loginCard}>
        <h1>Back-office</h1>
        <p className="muted">Espace réservé.</p>
        <form onSubmit={(event) => void handleLogin(event)}>
          <input
            type="password"
            name="password"
            placeholder="Mot de passe"
            autoComplete="current-password"
            required
          />
          {view.error != null && (
            <p className={styles.loginError} role="alert">
              {view.error}
            </p>
          )}
          <button type="submit" className={styles.primary}>
            Entrer
          </button>
        </form>
      </section>
    );
  }

  const visible = requests.filter((request) => request.brand === brand);

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brandSwitch} role="tablist" aria-label="Choisir la marque">
          {(Object.keys(BRAND_LABELS) as Brand[]).map((candidate) => (
            <button
              key={candidate}
              type="button"
              role="tab"
              aria-selected={brand === candidate}
              className={brand === candidate ? styles.brandOn : styles.brandOff}
              onClick={() => setBrand(candidate)}
            >
              {BRAND_LABELS[candidate]}
            </button>
          ))}
        </div>

        <div>
          <h1>Demandes {BRAND_LABELS[brand]}</h1>
          <p className="muted">
            {visible.length} demande{visible.length === 1 ? '' : 's'}
          </p>
        </div>

        <button type="button" className={styles.ghost} onClick={() => void handleLogout()}>
          Déconnexion
        </button>
      </header>

      {notice != null && (
        <p className={styles.notice} role="alert">
          {notice}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="muted">Aucune demande pour l’instant.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Reçue le</th>
              <th>Service</th>
              <th>Client</th>
              <th>Contact</th>
              <th>Secteur</th>
              <th>Créneau</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((request) => (
              <tr key={request.id}>
                <td>{formatDateFr(request.created_at)}</td>
                <td>{request.service}</td>
                <td>{request.nom_client}</td>
                <td>
                  <a href={`mailto:${request.email}`}>{request.email}</a>
                  <br />
                  <span className="muted">{request.telephone}</span>
                </td>
                <td>{request.secteur ?? '—'}</td>
                <td>{formatDateFr(request.starts_at)}</td>
                <td>
                  <select
                    value={request.statut}
                    onChange={(event) =>
                      void changeStatus(request.id, event.target.value as RequestStatus)
                    }
                  >
                    {(Object.keys(REQUEST_STATUS_LABELS) as RequestStatus[]).map((value) => (
                      <option key={value} value={value}>
                        {REQUEST_STATUS_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
