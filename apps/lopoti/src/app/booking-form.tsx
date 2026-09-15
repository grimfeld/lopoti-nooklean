'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

import type { ResolvedAnimal } from '@lopoti-nooklean/db/schema';

import { submitRequest } from '@/lib/api-client';

import styles from './booking-form.module.css';

/**
 * Lopoti's request form: five steps, in the order the conversation actually
 * happens — which animal, which service, when, tell me about them, how to reach
 * you.
 *
 * Every answer lives in React state rather than being read from the DOM at
 * submit time. That is not a stylistic choice: only the active step is
 * rendered, so earlier steps' inputs have unmounted by the time the visitor
 * submits, and a `new FormData(form)` would silently contain nothing but the
 * last step. The first version of this component did exactly that and threw
 * away four steps of the customer's answers.
 *
 * The animal chosen here is the same state the rest of the page uses, so
 * picking a companion card above or a service card in the catalogue arrives
 * pre-selected.
 */

const STEPS = ['1. Animal', '2. Service', '3. Créneau', '4. Compagnon', '5. Coordonnées'];

const MOMENTS = ['Matin', 'Midi', 'Après-midi', 'Fin de journée', 'Garde de nuit (exceptionnelle)'];
const FREQUENCIES = [
  'Besoin ponctuel',
  'Une fois par semaine',
  'Plusieurs fois par semaine',
  'Absence / vacances',
];
const ESPECES = [
  'Chien',
  'Chat',
  'Lapin',
  'Rongeur',
  'Poisson',
  'Reptile',
  'Tortue',
  'Oiseau',
  'Autre NAC autorisé',
];

/** Everything the visitor can tell us, across all five steps. */
interface Answers {
  date_souhaitee: string;
  moment_souhaite: string;
  frequence: string;
  nom_animal: string;
  espece: string;
  race_type: string;
  age: string;
  temperament: string;
  routine: string;
  traitement: string;
  details_traitement: string;
  veterinaire_nom: string;
  veterinaire_tel: string;
  nom_client: string;
  email: string;
  telephone: string;
  adresse: string;
  secteur: string;
  contact_urgence: string;
  message: string;
  accord_prise_contact: boolean;
  accord_premiere_rencontre: boolean;
  honeypot: string;
}

const EMPTY: Answers = {
  date_souhaitee: '',
  moment_souhaite: '',
  frequence: FREQUENCIES[0] ?? '',
  nom_animal: '',
  espece: '',
  race_type: '',
  age: '',
  temperament: '',
  routine: '',
  traitement: 'Non',
  details_traitement: '',
  veterinaire_nom: '',
  veterinaire_tel: '',
  nom_client: '',
  email: '',
  telephone: '',
  adresse: '',
  secteur: '',
  contact_urgence: '',
  message: '',
  accord_prise_contact: false,
  accord_premiere_rencontre: false,
  honeypot: '',
};

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string };

interface Props {
  readonly animals: ResolvedAnimal[];
  readonly animalSlug: string;
  readonly onAnimalChange: (slug: string) => void;
  readonly serviceLabel: string | null;
  readonly onServiceChange: (label: string) => void;
  readonly animalPictos: Record<string, string>;
}

export function BookingForm({
  animals,
  animalSlug,
  onAnimalChange,
  serviceLabel,
  onServiceChange,
  animalPictos,
}: Props) {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [answers, setAnswers] = useState<Answers>(EMPTY);

  // The calendar shows the current month only. The original had no month
  // navigation either: requests are made days ahead, not months, and a visitor
  // who needs a distant date types it into the field beside it.
  const [month] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const animal = animals.find((item) => item.slug === animalSlug) ?? animals[0];

  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);

  function set<K extends keyof Answers>(key: K, value: Answers[K]): void {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  /** Calendar cells for the shown month, Monday-first like a French calendar. */
  const days = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const leading = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
    const count = new Date(year, monthIndex + 1, 0).getDate();

    const cells: ({ day: number; iso: string; saturday: boolean; past: boolean } | null)[] = Array.from(
      { length: leading },
      () => null,
    );

    for (let day = 1; day <= count; day += 1) {
      const value = new Date(year, monthIndex, day);
      cells.push({
        day,
        // Built from local parts: toISOString would shift the date in a timezone
        // east of UTC and select the wrong day.
        iso: `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        saturday: value.getDay() === 6,
        past: value < today,
      });
    }
    return cells;
  }, [month, today]);

  function problemWithStep(): string | null {
    if (step === 0 && !animalSlug) return 'Choisissez un animal.';
    if (step === 1 && !serviceLabel) return 'Choisissez un service.';
    if (step === 2) {
      if (!answers.date_souhaitee) return 'Choisissez une date.';
      // Saturdays are never available. The calendar disables them, but a date
      // typed into the field beside it could still land on one.
      if (new Date(`${answers.date_souhaitee}T12:00:00`).getDay() === 6) {
        return 'Les samedis ne sont pas disponibles.';
      }
      if (!answers.moment_souhaite) return 'Choisissez un moment de la journée.';
    }
    if (step === 3) {
      if (!answers.nom_animal.trim()) return 'Indiquez le nom de votre animal.';
      if (!answers.espece) return 'Indiquez l’espèce.';
      if (!answers.temperament.trim()) return 'Décrivez le caractère de votre animal.';
      if (!answers.routine.trim()) return 'Décrivez sa routine et ses consignes.';
    }
    return null;
  }

  function next(): void {
    const problem = problemWithStep();
    if (problem) {
      setStatus({ kind: 'error', message: problem });
      return;
    }
    setStatus({ kind: 'idle' });
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function problemWithContact(): string | null {
    if (!answers.nom_client.trim()) return 'Indiquez votre nom.';
    if (!answers.email.trim()) return 'Indiquez votre e-mail.';
    if (!answers.telephone.trim()) return 'Indiquez votre téléphone.';
    if (!answers.adresse.trim()) return 'Indiquez l’adresse de la prestation.';
    if (!answers.secteur.trim()) return 'Indiquez l’arrondissement ou la ville.';
    if (!answers.contact_urgence.trim()) return 'Indiquez un contact d’urgence.';
    if (!answers.accord_prise_contact || !answers.accord_premiere_rencontre) {
      return 'Merci de cocher les deux cases avant d’envoyer.';
    }
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const problem = problemWithContact();
    if (problem) {
      setStatus({ kind: 'error', message: problem });
      return;
    }

    setStatus({ kind: 'sending' });

    const result = await submitRequest({
      type_animal: animal?.label ?? '',
      service: serviceLabel ?? '',
      nom_animal: answers.nom_animal,
      espece: answers.espece,
      date_souhaitee: answers.date_souhaitee,
      moment_souhaite: answers.moment_souhaite,
      frequence: answers.frequence,
      nom_client: answers.nom_client,
      email: answers.email,
      telephone: answers.telephone,
      adresse: answers.adresse,
      secteur: answers.secteur,
      contact_urgence: answers.contact_urgence,
      'bot-field': answers.honeypot,
      // The full record travels alongside, so nothing the visitor typed is lost
      // just because there is no column for it.
      details: {
        race_type: answers.race_type,
        age: answers.age,
        temperament: answers.temperament,
        routine: answers.routine,
        traitement: answers.traitement,
        details_traitement: answers.details_traitement,
        veterinaire_nom: answers.veterinaire_nom,
        veterinaire_tel: answers.veterinaire_tel,
        message: answers.message,
        accord_prise_contact: answers.accord_prise_contact,
        accord_premiere_rencontre: answers.accord_premiere_rencontre,
      },
    });

    setStatus(
      result.ok ? { kind: 'sent' } : { kind: 'error', message: result.error ?? 'Une erreur est survenue.' },
    );
  }

  if (!animal) return null;

  return (
    <section id="demande" className={styles.bookingSection}>
      <div className={styles.bookingHeading}>
        <p className={styles.eyebrow}>Demande de prestation</p>
        <h2>Parlons de votre compagnon.</h2>
        <p>
          Cette demande ne vaut pas confirmation. Je vérifie d’abord la faisabilité, puis je vous
          réponds par e-mail sous 48 h avec un devis si la prestation est possible.
        </p>
        <p className={styles.bookingNote}>Les champs marqués d’un * sont nécessaires.</p>
      </div>

      {status.kind === 'sent' ? (
        <div className={styles.success} role="status">
          <h3>Merci, votre demande est bien arrivée.</h3>
          <p>
            Je vérifie la disponibilité du créneau et je vous réponds sous 48 h, par e-mail ou par
            téléphone. À très vite !
          </p>
        </div>
      ) : (
        <form className={styles.form} onSubmit={(event) => void handleSubmit(event)} noValidate>
          <div className={styles.honeypot} aria-hidden="true">
            <label htmlFor="bot-field">Ne pas remplir</label>
            <input
              id="bot-field"
              name="bot-field"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={answers.honeypot}
              onChange={(event) => set('honeypot', event.target.value)}
            />
          </div>

          <div className={styles.progress} aria-label="Progression">
            {STEPS.map((label, index) => (
              <span key={label} className={index === step ? styles.progressActive : undefined}>
                {label}
              </span>
            ))}
          </div>

          {/* --- 1. Animal --- */}
          {step === 0 && (
            <fieldset className={styles.step}>
              <legend>Quel est votre compagnon ?</legend>
              <p className={styles.stepHelp}>
                Choisissez le type d’animal : les services proposés à l’étape suivante s’adaptent à
                votre choix.
              </p>
              <div className={styles.choiceGrid}>
                {animals.map((item) => {
                  const picto = animalPictos[item.slug];
                  const selected = item.slug === animalSlug;
                  return (
                    <label
                      key={item.slug}
                      className={`${styles.choice} ${selected ? styles.choiceSelected : ''}`}
                    >
                      <input
                        type="radio"
                        name="type_animal_choice"
                        value={item.slug}
                        checked={selected}
                        onChange={() => {
                          onAnimalChange(item.slug);
                          // Pre-fill the species on the animal's record, which is
                          // four steps away and asks the same question again.
                          set('espece', item.espece);
                        }}
                      />
                      <span>
                        {picto ? (
                          <Image src={picto} alt="" aria-hidden="true" width={88} height={88} />
                        ) : (
                          item.icon
                        )}
                      </span>
                      <strong>{item.label}</strong>
                      <small>
                        {item.services.length} service{item.services.length > 1 ? 's' : ''} disponible
                        {item.services.length > 1 ? 's' : ''}
                      </small>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* --- 2. Service --- */}
          {step === 1 && (
            <fieldset className={styles.step}>
              <legend>Quel service recherchez-vous ?</legend>
              <p className={styles.stepHelp}>
                Voici les prestations disponibles pour <strong>{animal.label.toLowerCase()}</strong>.
              </p>
              <div className={styles.choiceGrid}>
                {animal.services.map((service) => {
                  const selected = service.label === serviceLabel;
                  return (
                    <label
                      key={service.id}
                      className={`${styles.choice} ${selected ? styles.choiceSelected : ''}`}
                    >
                      <input
                        type="radio"
                        name="service_choice"
                        value={service.label}
                        checked={selected}
                        onChange={() => onServiceChange(service.label)}
                      />
                      <span>{service.icon}</span>
                      <strong>{service.label}</strong>
                      <small>{service.description}</small>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* --- 3. Créneau --- */}
          {step === 2 && (
            <fieldset className={styles.step}>
              <legend>Quelles dates vous conviendraient ?</legend>
              <p className={styles.stepHelp}>
                Indiquez votre préférence. Le créneau ne sera confirmé qu’après mon retour. Les
                samedis ne sont pas disponibles.
              </p>
              <div className={styles.dateLayout}>
                <div>
                  <label htmlFor="request-date">
                    Date souhaitée *
                    <input
                      id="request-date"
                      name="date_souhaitee"
                      type="date"
                      value={answers.date_souhaitee}
                      min={today.toISOString().slice(0, 10)}
                      onChange={(event) => set('date_souhaitee', event.target.value)}
                    />
                  </label>
                  <label>
                    Moment souhaité *
                    <select
                      name="moment_souhaite"
                      value={answers.moment_souhaite}
                      onChange={(event) => set('moment_souhaite', event.target.value)}
                    >
                      <option value="">Choisir</option>
                      {MOMENTS.map((moment) => (
                        <option key={moment}>{moment}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Fréquence
                    <select
                      name="frequence"
                      value={answers.frequence}
                      onChange={(event) => set('frequence', event.target.value)}
                    >
                      {FREQUENCIES.map((frequency) => (
                        <option key={frequency}>{frequency}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className={styles.calendarBox}>
                  <p className={styles.calendarTitle}>
                    {month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </p>
                  <div className={styles.calendarWeekdays}>
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((letter, index) => (
                      <span key={`${letter}-${index}`}>{letter}</span>
                    ))}
                  </div>
                  <div className={styles.calendarDays}>
                    {days.map((cell, index) =>
                      cell === null ? (
                        <span key={`empty-${index}`} className={styles.dayEmpty} />
                      ) : (
                        <button
                          key={cell.iso}
                          type="button"
                          disabled={cell.saturday || cell.past}
                          className={`${cell.saturday || cell.past ? styles.dayOff : ''} ${
                            answers.date_souhaitee === cell.iso ? styles.daySelected : ''
                          }`}
                          onClick={() => set('date_souhaitee', cell.iso)}
                        >
                          {cell.day}
                        </button>
                      ),
                    )}
                  </div>
                  <p className={styles.legend}>
                    <i /> Disponible à confirmer <i className={styles.legendOff} /> Samedi indisponible
                  </p>
                </div>
              </div>
            </fieldset>
          )}

          {/* --- 4. Compagnon --- */}
          {step === 3 && (
            <fieldset className={styles.step}>
              <legend>Présentez-moi votre compagnon.</legend>
              <p className={styles.stepHelp}>
                Ces informations permettent d’évaluer la demande et de préparer une première rencontre
                adaptée.
              </p>
              <div className={styles.formGrid}>
                <label>
                  Nom de l’animal *
                  <input
                    name="nom_animal"
                    value={answers.nom_animal}
                    onChange={(event) => set('nom_animal', event.target.value)}
                  />
                </label>
                <label>
                  Espèce *
                  <select
                    name="espece"
                    value={answers.espece}
                    onChange={(event) => set('espece', event.target.value)}
                  >
                    <option value="">Choisir</option>
                    {ESPECES.map((espece) => (
                      <option key={espece}>{espece}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Race / type
                  <input
                    name="race_type"
                    value={answers.race_type}
                    onChange={(event) => set('race_type', event.target.value)}
                  />
                </label>
                <label>
                  Âge
                  <input
                    name="age"
                    placeholder="Ex. 3 ans"
                    value={answers.age}
                    onChange={(event) => set('age', event.target.value)}
                  />
                </label>
              </div>
              <label>
                Caractère et tempérament *
                <textarea
                  name="temperament"
                  placeholder="Ex. sociable, craintif, énergique, réactif avec les autres chiens…"
                  value={answers.temperament}
                  onChange={(event) => set('temperament', event.target.value)}
                />
              </label>
              <label>
                Routine, alimentation et consignes importantes *
                <textarea
                  name="routine"
                  placeholder="Repas, sorties, litière, besoins spécifiques, accès au logement…"
                  value={answers.routine}
                  onChange={(event) => set('routine', event.target.value)}
                />
              </label>
              <div className={styles.yesNo}>
                <p>Un traitement est-il nécessaire ? *</p>
                <label>
                  <input
                    type="radio"
                    name="traitement"
                    value="Non"
                    checked={answers.traitement === 'Non'}
                    onChange={() => set('traitement', 'Non')}
                  />{' '}
                  Non
                </label>
                <label>
                  <input
                    type="radio"
                    name="traitement"
                    value="Oui"
                    checked={answers.traitement === 'Oui'}
                    onChange={() => set('traitement', 'Oui')}
                  />{' '}
                  Oui
                </label>
              </div>
              <label>
                Si oui : traitement et consignes du vétérinaire
                <textarea
                  name="details_traitement"
                  placeholder="Uniquement les soins habituellement administrés par le propriétaire."
                  value={answers.details_traitement}
                  onChange={(event) => set('details_traitement', event.target.value)}
                />
              </label>
              <div className={styles.formGrid}>
                <label>
                  Nom du vétérinaire habituel
                  <input
                    name="veterinaire_nom"
                    value={answers.veterinaire_nom}
                    onChange={(event) => set('veterinaire_nom', event.target.value)}
                  />
                </label>
                <label>
                  Téléphone du vétérinaire
                  <input
                    name="veterinaire_tel"
                    type="tel"
                    value={answers.veterinaire_tel}
                    onChange={(event) => set('veterinaire_tel', event.target.value)}
                  />
                </label>
              </div>
            </fieldset>
          )}

          {/* --- 5. Coordonnées --- */}
          {step === 4 && (
            <fieldset className={styles.step}>
              <legend>Vos coordonnées</legend>
              <p className={styles.stepHelp}>
                Je les utilise uniquement pour étudier votre demande et vous répondre.
              </p>
              <div className={styles.formGrid}>
                <label>
                  Prénom et nom *
                  <input
                    name="nom_client"
                    autoComplete="name"
                    value={answers.nom_client}
                    onChange={(event) => set('nom_client', event.target.value)}
                  />
                </label>
                <label>
                  E-mail *
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={answers.email}
                    onChange={(event) => set('email', event.target.value)}
                  />
                </label>
                <label>
                  Téléphone *
                  <input
                    name="telephone"
                    type="tel"
                    autoComplete="tel"
                    value={answers.telephone}
                    onChange={(event) => set('telephone', event.target.value)}
                  />
                </label>
                <label>
                  Adresse de la prestation *
                  <input
                    name="adresse"
                    autoComplete="street-address"
                    value={answers.adresse}
                    onChange={(event) => set('adresse', event.target.value)}
                  />
                </label>
                <label>
                  Arrondissement / ville *
                  <input
                    name="secteur"
                    placeholder="Ex. Paris 11e"
                    value={answers.secteur}
                    onChange={(event) => set('secteur', event.target.value)}
                  />
                </label>
                <label>
                  Contact d’urgence *
                  <input
                    name="contact_urgence"
                    placeholder="Nom et téléphone"
                    value={answers.contact_urgence}
                    onChange={(event) => set('contact_urgence', event.target.value)}
                  />
                </label>
              </div>
              <label>
                Informations complémentaires
                <textarea
                  name="message"
                  placeholder="Dates de fin, nombre d’animaux, demande particulière…"
                  value={answers.message}
                  onChange={(event) => set('message', event.target.value)}
                />
              </label>
              <label className={styles.consent}>
                <input
                  type="checkbox"
                  name="accord_prise_contact"
                  checked={answers.accord_prise_contact}
                  onChange={(event) => set('accord_prise_contact', event.target.checked)}
                />
                <span>
                  J’accepte que Lopoti utilise mes informations afin d’étudier ma demande et de me
                  recontacter. *
                </span>
              </label>
              <label className={styles.consent}>
                <input
                  type="checkbox"
                  name="accord_premiere_rencontre"
                  checked={answers.accord_premiere_rencontre}
                  onChange={(event) => set('accord_premiere_rencontre', event.target.checked)}
                />
                <span>
                  Je comprends qu’une première rencontre est obligatoire avant toute garde ou
                  prestation en mon absence. *
                </span>
              </label>
            </fieldset>
          )}

          {status.kind === 'error' && (
            <p className={styles.error} role="alert">
              {status.message}
            </p>
          )}

          <div className={styles.stepActions}>
            {step > 0 && (
              <button type="button" className={styles.buttonGhost} onClick={() => setStep((s) => s - 1)}>
                Retour
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" className={styles.buttonPrimary} onClick={next}>
                Continuer
              </button>
            ) : (
              <button type="submit" className={styles.buttonPrimary} disabled={status.kind === 'sending'}>
                {status.kind === 'sending' ? 'Envoi…' : 'Envoyer ma demande'}
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
