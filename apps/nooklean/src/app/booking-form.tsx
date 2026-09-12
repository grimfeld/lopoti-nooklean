'use client';

import { useState } from 'react';

import { submitRequest } from '@/lib/api-client';

import styles from './booking-form.module.css';

/**
 * Nooklean booking form — first vertical slice.
 *
 * The multi-step flow, the slot picker and the price estimator are ported in a
 * later slice (the estimator needs the per-postal-code rates the owner edits in
 * the back office). This collects the fields the API validates today, including
 * the multi-address shape that makes Nooklean's data different from Lopoti's.
 */

const SERVICES = [
  'Entretien régulier des parties communes',
  'Nettoyage des vitres',
  'Autre service',
] as const;

const WEEKDAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'] as const;

interface AddressDraft {
  readonly key: number;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent' }
  | { kind: 'error'; message: string };

export function BookingForm() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [addresses, setAddresses] = useState<AddressDraft[]>([{ key: 0 }]);
  const [isRecurring, setIsRecurring] = useState(true);

  function addAddress(): void {
    setAddresses((current) => [...current, { key: Date.now() }]);
  }

  function removeAddress(key: number): void {
    setAddresses((current) => (current.length === 1 ? current : current.filter((a) => a.key !== key)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus({ kind: 'sending' });

    // Addresses arrive as parallel arrays of repeated field names; zip them into
    // the object shape the API expects.
    const streets = form.getAll('street').map(String);
    const postals = form.getAll('postal').map(String);
    const floors = form.getAll('floors').map(String);
    const mailboxes = form.getAll('mailboxes').map(String);

    const builtAddresses = streets.map((street, index) => ({
      street,
      postal: postals[index] ?? '',
      floors: floors[index] ?? '',
      mailboxes: mailboxes[index] ?? '',
    }));

    const result = await submitRequest({
      service: form.get('service'),
      addresses: builtAddresses,
      billing: isRecurring ? 'monthly' : 'one_off',
      weekdays: form.getAll('weekdays').map(String),
      date_souhaitee: form.get('date_souhaitee'),
      free_visit_requested: form.get('free_visit_requested') === 'on',
      nom_client: form.get('nom_client'),
      email: form.get('email'),
      telephone: form.get('telephone'),
      secteur: postals[0] ?? '',
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
        <h3>C’est noté, merci !</h3>
        <p>
          Votre demande est arrivée. Nous étudions les accès de votre immeuble et revenons vers vous
          avec une proposition détaillée.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className={styles.form}>
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="bot-field">Ne pas remplir</label>
        <input id="bot-field" name="bot-field" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className={styles.fieldset}>
        <legend>Votre besoin</legend>
        <label className={styles.field}>
          Service *
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
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Le ou les immeubles</legend>

        {addresses.map((address, index) => (
          <div key={address.key} className={styles.address}>
            <div className={styles.addressHead}>
              <strong>Immeuble {index + 1}</strong>
              {addresses.length > 1 && (
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => removeAddress(address.key)}
                >
                  Retirer
                </button>
              )}
            </div>

            <label className={styles.field}>
              Adresse complète *
              <input
                name="street"
                type="text"
                required
                maxLength={300}
                placeholder="ex. 12 rue des Abbesses"
                autoComplete="street-address"
              />
            </label>

            <div className={styles.row3}>
              <label className={styles.field}>
                Code postal *
                <input
                  name="postal"
                  type="text"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{5}"
                  maxLength={5}
                  placeholder="75018"
                />
              </label>
              <label className={styles.field}>
                Étages *
                <input name="floors" type="number" required min={1} max={50} placeholder="6" />
              </label>
              <label className={styles.field}>
                Boîtes aux lettres *
                <input name="mailboxes" type="number" required min={1} max={1000} placeholder="24" />
              </label>
            </div>
          </div>
        ))}

        <button type="button" className={styles.addAddress} onClick={addAddress}>
          + Ajouter une autre adresse
        </button>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Rythme souhaité</legend>

        <div className={styles.choice}>
          <label className={styles.radio}>
            <input
              type="radio"
              name="rhythm"
              checked={isRecurring}
              onChange={() => setIsRecurring(true)}
            />
            Passages réguliers, facturation mensuelle
          </label>
          <label className={styles.radio}>
            <input
              type="radio"
              name="rhythm"
              checked={!isRecurring}
              onChange={() => setIsRecurring(false)}
            />
            Intervention ponctuelle
          </label>
        </div>

        {isRecurring ? (
          <fieldset className={styles.weekdays}>
            <legend className={styles.weekdaysLegend}>Jours de passage</legend>
            {WEEKDAYS.map((day) => (
              <label key={day} className={styles.weekday}>
                <input type="checkbox" name="weekdays" value={day} />
                {day}
              </label>
            ))}
          </fieldset>
        ) : null}

        <label className={styles.field}>
          {isRecurring ? 'Date de démarrage' : 'Date souhaitée'}
          <input name="date_souhaitee" type="date" />
        </label>

        <label className={styles.check}>
          <input type="checkbox" name="free_visit_requested" />
          <span>
            <strong>Je souhaite une visite gratuite de l’immeuble</strong>
            <small>Pour évaluer les accès et préparer un devis précis, sans engagement.</small>
          </span>
        </label>
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
