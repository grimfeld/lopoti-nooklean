'use client';

import { useState } from 'react';

import { submitRequest } from '@/lib/api-client';

import styles from './request-form.module.css';

/**
 * Lopoti request form — first vertical slice.
 *
 * The animal → service conditional flow and the multi-step layout are ported in
 * a later slice, driven by the service catalogue the owner edits in the back
 * office. For now this collects the fields the API already validates, so the
 * full path is exercised by a real submission.
 */

const ANIMALS = [
  { slug: 'chien', label: 'Chien' },
  { slug: 'chat', label: 'Chat' },
  { slug: 'lapin', label: 'Lapin' },
  { slug: 'rongeur', label: 'Rongeur' },
  { slug: 'furet', label: 'Furet' },
  { slug: 'poisson', label: 'Poisson' },
  { slug: 'reptile', label: 'Reptile' },
  { slug: 'oiseau', label: 'Oiseau' },
] as const;

const SERVICES = [
  'Visite à domicile',
  'Balade & promenade',
  'Garde pendant vos absences',
  'Soins des NAC',
] as const;

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string };

export function RequestForm() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus({ kind: 'sending' });

    const result = await submitRequest({
      type_animal: form.get('type_animal'),
      service: form.get('service'),
      nom_animal: form.get('nom_animal'),
      date_souhaitee: form.get('date_souhaitee'),
      moment_souhaite: form.get('moment_souhaite'),
      nom_client: form.get('nom_client'),
      email: form.get('email'),
      telephone: form.get('telephone'),
      adresse: form.get('adresse'),
      secteur: form.get('secteur'),
      contact_urgence: form.get('contact_urgence'),
      'bot-field': form.get('bot-field'),
    });

    setStatus(
      result.ok
        ? { kind: 'sent' }
        : { kind: 'error', message: result.error ?? 'Une erreur est survenue.' },
    );
  }

  if (status.kind === 'sent') {
    return (
      <div className={styles.success} role="status">
        <h3>Merci, votre demande est bien arrivée.</h3>
        <p>
          Nous vérifions la disponibilité du créneau et vous répondons rapidement, par e-mail ou par
          téléphone.
        </p>
      </div>
    );
  }

  return (
    /* `void` is deliberate: React's handler type expects no return value, and an
       ignored promise here would swallow a rejection silently. */
    <form onSubmit={(event) => void handleSubmit(event)} className={styles.form}>
      {/* Honeypot: hidden from people, irresistible to bots. */}
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="bot-field">Ne pas remplir</label>
        <input id="bot-field" name="bot-field" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className={styles.fieldset}>
        <legend>Votre animal</legend>

        <label className={styles.field}>
          Type d’animal *
          <select name="type_animal" required defaultValue="">
            <option value="" disabled>
              Choisissez…
            </option>
            {ANIMALS.map((animal) => (
              <option key={animal.slug} value={animal.label}>
                {animal.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          Son nom
          <input name="nom_animal" type="text" maxLength={120} autoComplete="off" />
        </label>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>La prestation</legend>

        <label className={styles.field}>
          Service souhaité *
          <select name="service" required defaultValue="">
            <option value="" disabled>
              Choisissez…
            </option>
            {SERVICES.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            Date souhaitée
            <input name="date_souhaitee" type="date" />
          </label>

          <label className={styles.field}>
            Moment de la journée
            <select name="moment_souhaite" defaultValue="">
              <option value="">Peu importe</option>
              <option value="Matin">Matin</option>
              <option value="Après-midi">Après-midi</option>
              <option value="Soirée">Soirée</option>
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Vos coordonnées</legend>

        <label className={styles.field}>
          Nom et prénom *
          <input name="nom_client" type="text" required maxLength={160} autoComplete="name" />
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            E-mail *
            <input name="email" type="email" required maxLength={200} autoComplete="email" />
          </label>

          <label className={styles.field}>
            Téléphone *
            <input name="telephone" type="tel" required maxLength={40} autoComplete="tel" />
          </label>
        </div>

        <label className={styles.field}>
          Adresse *
          <input name="adresse" type="text" required maxLength={300} autoComplete="street-address" />
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            Arrondissement / ville *
            <input name="secteur" type="text" required maxLength={160} placeholder="Ex. Paris 11e" />
          </label>

          <label className={styles.field}>
            Contact d’urgence *
            <input
              name="contact_urgence"
              type="text"
              required
              maxLength={200}
              placeholder="Nom et téléphone"
            />
          </label>
        </div>
      </fieldset>

      {status.kind === 'error' && (
        <p className={styles.error} role="alert">
          {status.message}
        </p>
      )}

      <button type="submit" className={styles.submit} disabled={status.kind === 'sending'}>
        {status.kind === 'sending' ? 'Envoi…' : 'Envoyer ma demande'}
      </button>
    </form>
  );
}
