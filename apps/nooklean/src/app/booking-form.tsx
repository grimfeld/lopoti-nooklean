'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

import { fetchTakenSlots, submitRequest } from '@/lib/api-client';

import styles from './booking-form.module.css';

/**
 * Nooklean's booking form: describe the building, choose when, leave contact
 * details.
 *
 * As in the Lopoti form, every answer lives in React state rather than being
 * read from the DOM at submit time. Only the active step is rendered, so the
 * addresses entered on step one have unmounted by the time the visitor submits
 * on step three — reading `FormData` there would send an empty address list.
 *
 * Two things make this form different from Lopoti's. A request can cover
 * several buildings, each with its own mailbox count, which is what the quote is
 * priced on. And a request is either a recurring contract (weekdays, billed
 * monthly) or a single visit (one date and slot), which changes what step two
 * even asks.
 */

const SERVICE_OPTIONS = [
  'Entretien régulier des parties communes',
  'Nettoyage des vitres',
  'Autre service',
];

const WEEKDAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'] as const;

/** Thursdays lose the last slot in the original design; kept as-is. */
const SLOTS_STANDARD = ['08:30', '10:00', '11:30', '14:00', '15:30', '17:00'];
const SLOTS_THURSDAY = ['08:30', '10:00', '11:30', '14:00', '15:30'];

interface Address {
  key: number;
  street: string;
  postal: string;
  floors: string;
  mailboxes: string;
}

function emptyAddress(): Address {
  return { key: Date.now() + Math.random(), street: '', postal: '', floors: '', mailboxes: '' };
}

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string };

interface Props {
  readonly service: string;
  readonly onServiceChange: (label: string) => void;
}

export function BookingForm({ service, onServiceChange }: Props) {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const [addresses, setAddresses] = useState<Address[]>([emptyAddress()]);
  const [freeVisit, setFreeVisit] = useState(false);

  const [recurring, setRecurring] = useState(true);
  const [weekdays, setWeekdays] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [day, setDay] = useState('');
  const [slot, setSlot] = useState('');
  const [taken, setTaken] = useState<string[]>([]);

  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  /** The next few weekdays; weekends are never offered. */
  const [days] = useState(() => {
    const result: { iso: string; weekday: string; label: string }[] = [];
    for (let offset = 1; result.length < 6 && offset <= 12; offset += 1) {
      const date = new Date();
      date.setDate(date.getDate() + offset);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      result.push({
        iso: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        weekday: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date),
        label: new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date),
      });
    }
    return result;
  });

  const loadSlots = useCallback(async (iso: string) => {
    // Only confirmed jobs block a slot. A pending request from another visitor
    // does not — the owner decides who gets a contested time.
    setTaken(await fetchTakenSlots(iso));
  }, []);

  useEffect(() => {
    if (!recurring && day) void loadSlots(day);
  }, [recurring, day, loadSlots]);

  const slots = day && new Date(`${day}T12:00:00`).getDay() === 4 ? SLOTS_THURSDAY : SLOTS_STANDARD;

  function updateAddress(key: number, field: keyof Omit<Address, 'key'>, value: string): void {
    setAddresses((current) =>
      current.map((address) => (address.key === key ? { ...address, [field]: value } : address)),
    );
  }

  function toggleWeekday(dayName: string): void {
    setWeekdays((current) =>
      current.includes(dayName) ? current.filter((d) => d !== dayName) : [...current, dayName],
    );
  }

  function problemWithBuildings(): string | null {
    for (const [index, address] of addresses.entries()) {
      const where = addresses.length > 1 ? ` (immeuble ${index + 1})` : '';
      if (!address.street.trim()) return `Indiquez l’adresse complète${where}.`;
      if (!/^\d{5}$/.test(address.postal)) return `Code postal invalide${where}.`;
      if (!address.floors) return `Indiquez le nombre d’étages${where}.`;
      if (!address.mailboxes) return `Indiquez le nombre de boîtes aux lettres${where}.`;
    }
    return null;
  }

  function problemWithSchedule(): string | null {
    if (recurring) {
      if (weekdays.length === 0 || !startDate) {
        return 'Choisissez au moins un jour de passage et une date de démarrage.';
      }
      return null;
    }
    if (!day || !slot) return 'Choisissez une date et un créneau.';
    return null;
  }

  function next(): void {
    const problem = step === 0 ? problemWithBuildings() : problemWithSchedule();
    if (problem) {
      setStatus({ kind: 'error', message: problem });
      return;
    }
    setStatus({ kind: 'idle' });
    setStep((current) => current + 1);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!firstname.trim() || !lastname.trim()) {
      setStatus({ kind: 'error', message: 'Indiquez votre prénom et votre nom.' });
      return;
    }
    if (!email.trim()) {
      setStatus({ kind: 'error', message: 'Indiquez votre e-mail.' });
      return;
    }
    if (!telephone.trim()) {
      setStatus({ kind: 'error', message: 'Indiquez votre téléphone.' });
      return;
    }
    if (!consent) {
      setStatus({ kind: 'error', message: 'Merci d’accepter d’être contacté·e.' });
      return;
    }

    setStatus({ kind: 'sending' });

    const result = await submitRequest({
      service,
      addresses: addresses.map(({ street, postal, floors, mailboxes }) => ({
        street,
        postal,
        floors,
        mailboxes,
      })),
      billing: recurring ? 'monthly' : 'one_off',
      weekdays: recurring ? weekdays : [],
      date_souhaitee: recurring ? startDate : day,
      ...(recurring ? {} : { slot }),
      free_visit_requested: freeVisit,
      nom_client: `${firstname} ${lastname}`.trim(),
      email,
      telephone,
      secteur: addresses[0]?.postal ?? '',
      'bot-field': honeypot,
    });

    setStatus(
      result.ok ? { kind: 'sent' } : { kind: 'error', message: result.error ?? 'Une erreur est survenue.' },
    );
  }

  if (status.kind === 'sent') {
    return (
      <div className={styles.success} role="status">
        <Image src="/img/nook-mascotte.png" alt="" aria-hidden="true" width={90} height={90} />
        <h3>C’est noté, merci !</h3>
        <p>
          Votre demande est arrivée. J’étudie les accès de votre immeuble et je reviens vers vous avec
          une proposition détaillée.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.bookingCard} onSubmit={(event) => void handleSubmit(event)} noValidate>
      <span className={styles.bookingTail} aria-hidden="true">
        <Image src="/img/tail.png" alt="" width={175} height={145} />
      </span>

      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="bot-field">Ne pas remplir</label>
        <input
          id="bot-field"
          name="bot-field"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      <div className={styles.progress} aria-label="Progression">
        {[0, 1, 2].map((index) => (
          <i key={index} className={index <= step ? styles.progressActive : undefined} />
        ))}
      </div>

      {/* --- 1. The buildings --- */}
      {step === 0 && (
        <fieldset className={styles.step}>
          <label htmlFor="service">Votre besoin</label>
          <select
            id="service"
            name="service"
            value={service}
            onChange={(event) => onServiceChange(event.target.value)}
          >
            {SERVICE_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>

          {addresses.map((address, index) => (
            <div key={address.key} className={styles.addressEntry}>
              <div className={styles.addressHeading}>
                <b>Immeuble {index + 1}</b>
                {addresses.length > 1 && (
                  <button
                    type="button"
                    className={styles.removeAddress}
                    onClick={() =>
                      setAddresses((current) => current.filter((item) => item.key !== address.key))
                    }
                  >
                    Retirer
                  </button>
                )}
              </div>
              <label>
                Adresse complète
                <input
                  name="street"
                  placeholder="ex. 12 rue des Abbesses"
                  autoComplete="street-address"
                  value={address.street}
                  onChange={(event) => updateAddress(address.key, 'street', event.target.value)}
                />
              </label>
              <div className={styles.addressFields}>
                <label>
                  Code postal
                  <input
                    name="postal"
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="75018"
                    value={address.postal}
                    onChange={(event) => updateAddress(address.key, 'postal', event.target.value)}
                  />
                </label>
                <label>
                  Étages
                  <input
                    name="floors"
                    type="number"
                    min={1}
                    max={50}
                    placeholder="6"
                    value={address.floors}
                    onChange={(event) => updateAddress(address.key, 'floors', event.target.value)}
                  />
                </label>
                <label>
                  Boîtes aux lettres
                  <input
                    name="mailboxes"
                    type="number"
                    min={1}
                    max={1000}
                    placeholder="24"
                    value={address.mailboxes}
                    onChange={(event) => updateAddress(address.key, 'mailboxes', event.target.value)}
                  />
                </label>
              </div>
            </div>
          ))}

          <button
            type="button"
            className={styles.addAddress}
            onClick={() => setAddresses((current) => [...current, emptyAddress()])}
          >
            ＋ Ajouter une autre adresse
          </button>

          <label className={styles.visitOption}>
            <input
              type="checkbox"
              name="free_visit_requested"
              checked={freeVisit}
              onChange={(event) => setFreeVisit(event.target.checked)}
            />
            <span>
              <b>Je souhaite une visite gratuite de l’immeuble</b>
              <small>Pour évaluer les accès et préparer un devis précis, sans engagement.</small>
            </span>
          </label>

          <button type="button" className={styles.btnCoral} onClick={next}>
            Voir les créneaux →
          </button>
        </fieldset>
      )}

      {/* --- 2. When --- */}
      {step === 1 && (
        <fieldset className={styles.step}>
          <div className={styles.stepTop}>
            <button type="button" className={styles.back} onClick={() => setStep(0)} aria-label="Retour">
              ←
            </button>
            <label>{recurring ? 'Planifiez les passages réguliers' : 'Choisissez une date'}</label>
          </div>

          <div className={styles.rhythm}>
            <label>
              <input type="radio" name="rhythm" checked={recurring} onChange={() => setRecurring(true)} />
              Passages réguliers, facturation mensuelle
            </label>
            <label>
              <input type="radio" name="rhythm" checked={!recurring} onChange={() => setRecurring(false)} />
              Intervention ponctuelle
            </label>
          </div>

          {recurring ? (
            <>
              <p className={styles.scheduleNote}>
                Sélectionnez le ou les jours de passage. L’intervention se répétera chaque semaine et le
                tarif sera calculé au mois.
              </p>
              <label>Jours de passage</label>
              <div className={styles.weekdays}>
                {WEEKDAYS.map((dayName) => (
                  <button
                    key={dayName}
                    type="button"
                    aria-pressed={weekdays.includes(dayName)}
                    className={weekdays.includes(dayName) ? styles.weekdayActive : undefined}
                    onClick={() => toggleWeekday(dayName)}
                  >
                    {dayName.slice(0, 3)}
                  </button>
                ))}
              </div>
              <label>
                Date de démarrage
                <input
                  type="date"
                  value={startDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </label>
              <div className={styles.monthlyPill}>↻ Passage hebdomadaire · facturation mensuelle</div>
            </>
          ) : (
            <>
              <div className={styles.days}>
                {days.map((candidate) => (
                  <button
                    key={candidate.iso}
                    type="button"
                    className={`${styles.day} ${day === candidate.iso ? styles.dayActive : ''}`}
                    onClick={() => {
                      setDay(candidate.iso);
                      setSlot('');
                    }}
                  >
                    <small>{candidate.weekday}</small>
                    <b>{candidate.label}</b>
                  </button>
                ))}
              </div>
              <label>Créneaux disponibles</label>
              <div className={styles.slots}>
                {slots.map((candidate) => {
                  const unavailable = taken.includes(candidate);
                  return (
                    <button
                      key={candidate}
                      type="button"
                      disabled={unavailable || !day}
                      className={`${styles.slot} ${slot === candidate ? styles.slotActive : ''}`}
                      onClick={() => setSlot(candidate)}
                    >
                      {candidate}
                      {unavailable ? ' · pris' : ''}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <button type="button" className={styles.btnCoral} onClick={next}>
            Continuer →
          </button>
        </fieldset>
      )}

      {/* --- 3. Contact --- */}
      {step === 2 && (
        <fieldset className={styles.step}>
          <div className={styles.stepTop}>
            <button type="button" className={styles.back} onClick={() => setStep(1)} aria-label="Retour">
              ←
            </button>
            <label>Vos coordonnées</label>
          </div>
          <div className={styles.two}>
            <input
              name="firstname"
              placeholder="Prénom"
              value={firstname}
              onChange={(event) => setFirstname(event.target.value)}
            />
            <input
              name="lastname"
              placeholder="Nom"
              value={lastname}
              onChange={(event) => setLastname(event.target.value)}
            />
          </div>
          <input
            name="email"
            type="email"
            placeholder="E-mail"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            name="telephone"
            type="tel"
            placeholder="Téléphone"
            autoComplete="tel"
            value={telephone}
            onChange={(event) => setTelephone(event.target.value)}
          />
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />{' '}
            J’accepte d’être contacté·e au sujet de ma réservation.
          </label>
          <button type="submit" className={styles.btnCoral} disabled={status.kind === 'sending'}>
            {status.kind === 'sending' ? 'Envoi…' : 'Confirmer ma demande →'}
          </button>
        </fieldset>
      )}

      {status.kind === 'error' && (
        <p className={styles.error} role="alert">
          {status.message}
        </p>
      )}
    </form>
  );
}
