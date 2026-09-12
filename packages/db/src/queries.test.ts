import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { pool, query } from './pool';
import {
  SlotConflictError,
  getConfig,
  insertRequest,
  listConfirmedSlots,
  listRequests,
  setConfig,
  updateRequest,
} from './queries';
import { migrate } from './migrate';

/**
 * Database-backed tests.
 *
 * These run against a real Postgres — the Docker container locally, a fresh Neon
 * branch in CI — because the behaviour being tested lives in the schema, not in
 * the TypeScript. A mock would happily "pass" while the real constraint was
 * missing.
 *
 * The double-booking test below is the single most important test in the
 * repository: it is what stops the owner being sent to two places at once.
 */

const hasDatabase = Boolean(process.env['DATABASE_URL'] ?? process.env['POSTGRES_URL']);

describe.runIf(hasDatabase)('queries against a real database', () => {
  beforeAll(async () => {
    await migrate();
    // Each run starts from a known state. Safe: this only ever runs against a
    // local container or an ephemeral CI branch, never a deployed database.
    await query('DELETE FROM quotes WHERE TRUE');
    await query('DELETE FROM requests WHERE TRUE');
    await query("DELETE FROM site_config WHERE cle LIKE 'test_%'");
  });

  afterAll(async () => {
    await pool.end();
  });

  function lopotiSubmission(overrides: Record<string, unknown> = {}) {
    return {
      brand: 'lopoti' as const,
      service: 'Visite à domicile',
      type_animal: 'Chien',
      nom_animal: 'Pixel',
      adresse: '12 rue de Test',
      contact_urgence: 'Contact 0600000000',
      nom_client: 'Client Test',
      email: 'client@example.com',
      telephone: '0612345678',
      secteur: 'Paris 11e',
      weekdays: [],
      details: {},
      ...overrides,
    };
  }

  it('stores a submission and reads it back', async () => {
    const created = await insertRequest(lopotiSubmission());

    expect(created.id).toBeGreaterThan(0);
    expect(created.brand).toBe('lopoti');
    expect(created.statut).toBe('nouveau');
    expect(created.nom_client).toBe('Client Test');
  });

  it('keeps the full submitted payload, including fields without a column', async () => {
    const created = await insertRequest(
      lopotiSubmission({ details: { routine: 'Sort à 8h et 19h', veterinaire: 'Dr Martin' } }),
    );

    // Nothing a visitor typed should be lost just because the schema has no
    // column for it yet.
    expect(created.details['routine']).toBe('Sort à 8h et 19h');
    expect(created.details['veterinaire']).toBe('Dr Martin');
    // The brand-specific fields are kept too.
    expect(created.details['contact_urgence']).toBe('Contact 0600000000');
  });

  it('separates the two brands', async () => {
    await insertRequest(lopotiSubmission({ nom_client: 'Client Lopoti' }));
    await insertRequest({
      brand: 'nooklean' as const,
      service: 'Nettoyage des vitres',
      addresses: [{ street: '8 rue Lepic', postal: '75018', floors: 4, mailboxes: 12 }],
      billing: 'one_off' as const,
      weekdays: [],
      free_visit_requested: false,
      nom_client: 'Syndic Test',
      email: 'syndic@example.com',
      telephone: '0123456789',
      secteur: '75018',
      details: {},
    });

    const lopoti = await listRequests({ brand: 'lopoti' });
    const nooklean = await listRequests({ brand: 'nooklean' });

    expect(lopoti.every((r) => r.brand === 'lopoti')).toBe(true);
    expect(nooklean.every((r) => r.brand === 'nooklean')).toBe(true);
    expect(nooklean.some((r) => r.nom_client === 'Syndic Test')).toBe(true);
  });

  it('changes a status', async () => {
    const created = await insertRequest(lopotiSubmission());
    const updated = await updateRequest(created.id, { statut: 'confirme' });

    expect(updated?.statut).toBe('confirme');
  });

  // --- The double-booking guard --------------------------------------------

  describe('the shared calendar', () => {
    const slot = new Date('2030-06-03T10:00:00.000Z');

    it('allows two PENDING requests for the same moment', async () => {
      // Deliberate: whoever fills in a form first does not get to lock out a
      // paying customer. The owner decides, and sees the conflict.
      const first = await insertRequest(
        lopotiSubmission({ date_souhaitee: '2030-06-04', nom_client: 'Premier' }),
      );
      const second = await insertRequest(
        lopotiSubmission({ date_souhaitee: '2030-06-04', nom_client: 'Second' }),
      );

      expect(first.id).not.toBe(second.id);
      expect(first.starts_at).not.toBeNull();
      expect(second.starts_at).toEqual(first.starts_at);
    });

    it('refuses a SECOND confirmation at the same moment, across brands', async () => {
      const lopotiRequest = await insertRequest(lopotiSubmission({ nom_client: 'Confirmé' }));
      const nookleanRequest = await insertRequest({
        brand: 'nooklean' as const,
        service: 'Nettoyage des vitres',
        addresses: [{ street: '1 rue Test', postal: '75001', floors: 2, mailboxes: 6 }],
        billing: 'one_off' as const,
        weekdays: [],
        free_visit_requested: false,
        nom_client: 'Conflit',
        email: 'conflit@example.com',
        telephone: '0100000000',
        secteur: '75001',
        details: {},
      });

      await updateRequest(lopotiRequest.id, { statut: 'confirme', starts_at: slot });

      // The second confirmation is for the OTHER brand — it must still be
      // refused, because both brands are the same person's time.
      await expect(
        updateRequest(nookleanRequest.id, { statut: 'confirme', starts_at: slot }),
      ).rejects.toThrow(SlotConflictError);
    });

    it('frees the slot again when a confirmed job is cancelled', async () => {
      const taken = new Date('2030-07-01T14:00:00.000Z');

      const first = await insertRequest(lopotiSubmission({ nom_client: 'À annuler' }));
      await updateRequest(first.id, { statut: 'confirme', starts_at: taken });

      await updateRequest(first.id, { statut: 'annule' });

      // Cancelling must release the moment, or a cancelled job would block that
      // time forever.
      const second = await insertRequest(lopotiSubmission({ nom_client: 'Remplaçant' }));
      const updated = await updateRequest(second.id, { statut: 'confirme', starts_at: taken });

      expect(updated?.statut).toBe('confirme');
    });

    it('reports confirmed slots for both brands on a given day', async () => {
      const moment = new Date('2030-08-12T09:30:00.000Z');
      const request = await insertRequest(lopotiSubmission({ nom_client: 'Calendrier' }));
      await updateRequest(request.id, { statut: 'confirme', starts_at: moment });

      const slots = await listConfirmedSlots(
        new Date('2030-08-12T00:00:00.000Z'),
        new Date('2030-08-13T00:00:00.000Z'),
      );

      expect(slots.map((s) => s.toISOString())).toContain(moment.toISOString());
    });
  });

  // --- Configuration -------------------------------------------------------

  describe('site configuration', () => {
    it('returns the fallback when nothing has been saved', async () => {
      const value = await getConfig('lopoti', 'test_absent', { services: [] });
      expect(value).toEqual({ services: [] });
    });

    it('saves and reads back a value', async () => {
      await setConfig('nooklean', 'test_rates', { '75018': [18, 24] });
      const value = await getConfig('nooklean', 'test_rates', {});
      expect(value).toEqual({ '75018': [18, 24] });
    });

    it('keeps each brand separate under the same key', async () => {
      await setConfig('lopoti', 'test_shared_key', { who: 'lopoti' });
      await setConfig('nooklean', 'test_shared_key', { who: 'nooklean' });

      expect(await getConfig('lopoti', 'test_shared_key', {})).toEqual({ who: 'lopoti' });
      expect(await getConfig('nooklean', 'test_shared_key', {})).toEqual({ who: 'nooklean' });
    });

    it('overwrites rather than duplicating on a second save', async () => {
      await setConfig('lopoti', 'test_overwrite', { v: 1 });
      await setConfig('lopoti', 'test_overwrite', { v: 2 });

      expect(await getConfig('lopoti', 'test_overwrite', {})).toEqual({ v: 2 });
    });
  });
});
