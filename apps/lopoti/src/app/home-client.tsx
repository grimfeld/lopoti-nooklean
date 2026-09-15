'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

import type { PoteProfile, ResolvedAnimal } from '@lopoti-nooklean/db/schema';

import { BookingForm } from './booking-form';

import styles from './page.module.css';

/**
 * The Lopoti home page.
 *
 * The organising idea of this site: the visitor picks an animal, and everything
 * downstream adapts — the services shown on the page, the services offered in
 * the form, and the species pre-filled on the animal's record. Choosing a
 * companion card, a service card, or the form's own animal step all drive the
 * same piece of state.
 */

const ANIMAL_PHOTOS: Record<string, string> = {
  chien: '/img/dog.jpg',
  chat: '/img/cat.jpg',
  lapin: '/img/rabbit.jpg',
  furet: '/img/ferret.jpg',
  rongeur: '/img/rodent.jpg',
  poisson: '/img/fish.jpg',
  reptile: '/img/snake.jpg',
  oiseau: '/img/bird.jpg',
};

/** Hand-drawn pictograms exist for some animals; the rest fall back to emoji. */
const ANIMAL_PICTOS: Record<string, string> = {
  chien: '/img/picto-chien.png',
  chat: '/img/picto-chat.png',
  furet: '/img/picto-furet.png',
  reptile: '/img/picto-reptile.png',
  oiseau: '/img/picto-oiseau.png',
};

const CARD_COLOURS = [styles.cardCoral, styles.cardYellow, styles.cardGreen, styles.cardBlue];

const POTE_PHOTOS: Record<string, string> = {
  noyam: '/img/pote-noyam.jpg',
};

/** "Demander une visite", "Préparer une garde"… matched to the service name. */
function serviceAction(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes('balade') || normalized.includes('promenade')) return 'Demander une promenade';
  if (normalized.includes('garde')) return 'Préparer une garde';
  if (normalized.includes('soins')) return 'Demander des soins NAC';
  return 'Demander une visite';
}

interface Props {
  readonly animals: ResolvedAnimal[];
  readonly potes: PoteProfile[];
}

export function HomeClient({ animals, potes }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [animalSlug, setAnimalSlug] = useState(animals[0]?.slug ?? 'chien');
  const [serviceLabel, setServiceLabel] = useState<string | null>(null);
  const [selectedPote, setSelectedPote] = useState(potes[0]?.id ?? '');

  const companionTrack = useRef<HTMLDivElement>(null);
  const potesTrack = useRef<HTMLDivElement>(null);

  const animal = animals.find((item) => item.slug === animalSlug) ?? animals[0];

  function scrollTrack(track: HTMLDivElement | null, direction: 1 | -1): void {
    if (!track) return;
    const card = track.firstElementChild;
    const step = (card instanceof HTMLElement ? card.offsetWidth : 250) + 14;
    track.scrollBy({ left: step * direction, behavior: 'smooth' });
  }

  /** Choosing a service anywhere sends the visitor to the form with it applied. */
  function chooseService(label: string): void {
    setServiceLabel(label);
    document.querySelector('#demande')?.scrollIntoView({ behavior: 'smooth' });
  }

  if (!animal) return null;

  return (
    <>
      <header className={styles.siteHeader}>
        <a className={styles.brand} href="#accueil" aria-label="Lopoti, accueil">
          <Image src="/img/lopoti-logo.png" alt="Lopoti" width={116} height={55} priority />
          <span className={styles.brandAnimal}>{animal.label}</span>
        </a>
        <button
          className={styles.menuButton}
          aria-expanded={menuOpen}
          aria-controls="main-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          Menu
        </button>
        <nav id="main-nav" className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
          <a href="#services">Services</a>
          <a href="#comment-ca-marche">Comment ça marche</a>
          <a href="#confiance">L’esprit Lopoti</a>
          <a className={styles.navCta} href="#demande">
            Faire une demande
          </a>
        </nav>
      </header>

      <main>
        <a className={styles.potesLink} href="#les-potes" aria-label="Découvrir les potes de Lopoti">
          <span>Le pote de ton</span>
          <Image src="/img/poti-word.png" alt="poti" width={76} height={31} />
          <span>pote</span>
        </a>

        {/* --- Hero --- */}
        <section id="accueil" className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Paris · Chiens · Chats · NAC</p>
            <h1>
              Leur routine, leur bien-être, <em>en toute confiance.</em>
            </h1>
            <p className={styles.lead}>
              Visites, promenades et gardes pensées pour chaque compagnon — avec attention, nouvelles
              et beaucoup de douceur.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.buttonPrimary} href="#demande">
                Faire une demande
              </a>
              <a className={styles.textLink} href="#services">
                Découvrir les services <span>→</span>
              </a>
            </div>
            <ul className={styles.quickTrust}>
              <li>Première rencontre incluse</li>
              <li>Réponse sous 48 h</li>
              <li>Suivi photo après chaque visite</li>
            </ul>
          </div>

          <div className={styles.heroVisual}>
            <a className={styles.heroImageLink} href="#compagnons" aria-label="Découvrir tous les compagnons">
              <Image
                className={styles.heroPicto}
                src="/img/lopoti-picto.png"
                alt=""
                aria-hidden="true"
                width={76}
                height={76}
              />
              <div className={styles.slideshow} aria-hidden="true">
                <Image src="/img/dog.jpg" alt="" fill sizes="(max-width: 850px) 100vw, 45vw" priority />
                <Image src="/img/cat.jpg" alt="" fill sizes="(max-width: 850px) 100vw, 45vw" />
                <Image src="/img/rabbit.jpg" alt="" fill sizes="(max-width: 850px) 100vw, 45vw" />
                <Image src="/img/bird.jpg" alt="" fill sizes="(max-width: 850px) 100vw, 45vw" />
              </div>
            </a>
            <a className={styles.photoLabel} href="#services">
              Une attention adaptée à chaque animal <span>✦</span>
            </a>
          </div>
        </section>

        {/* --- Companion carousel --- */}
        <section id="compagnons" className={styles.companionCarousel} aria-labelledby="compagnons-title">
          <div className={styles.carouselHeading}>
            <div>
              <p className={styles.eyebrow}>Pour tous les compagnons</p>
              <h2 id="compagnons-title">Qui accompagne Lopoti ?</h2>
            </div>
            <div className={styles.carouselControls}>
              <button
                type="button"
                className={styles.carouselButton}
                aria-label="Voir les cartes précédentes"
                onClick={() => scrollTrack(companionTrack.current, -1)}
              >
                ←
              </button>
              <button
                type="button"
                className={styles.carouselButton}
                aria-label="Voir les cartes suivantes"
                onClick={() => scrollTrack(companionTrack.current, 1)}
              >
                →
              </button>
            </div>
          </div>

          <div ref={companionTrack} className={styles.carouselTrack} aria-label="Animaux accompagnés par Lopoti">
            {animals.map((item) => {
              const selected = item.slug === animalSlug;
              return (
                <button
                  key={item.slug}
                  type="button"
                  className={`${styles.companionCard} ${selected ? styles.companionSelected : ''}`}
                  aria-current={selected}
                  onClick={() => setAnimalSlug(item.slug)}
                >
                  <Image
                    src={ANIMAL_PHOTOS[item.slug] ?? '/img/dog.jpg'}
                    alt={item.label}
                    width={240}
                    height={300}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* --- Services, conditional on the chosen animal --- */}
        <section id="services" className={styles.services}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Les services</p>
            <h2 id="services-title">
              Des services pensés pour votre
              <Image
                className={styles.servicesTitlePicto}
                src="/img/lopoti-picto.png"
                alt=""
                aria-hidden="true"
                width={32}
                height={32}
              />
              {animal.label.toLowerCase()}.
            </h2>
            <p>Chaque prestation est préparée après avoir fait connaissance avec vous et votre animal.</p>
          </div>

          <div className={styles.serviceGrid} aria-live="polite">
            {animal.services.map((service, index) => (
              <article
                key={service.id}
                className={`${styles.serviceCard} ${CARD_COLOURS[index % CARD_COLOURS.length]} ${
                  service.label === serviceLabel ? styles.serviceSelected : ''
                }`}
              >
                <span className={styles.serviceIcon}>{service.icon}</span>
                <h3>{service.label}</h3>
                <p>{service.description}</p>
                <a
                  href="#demande"
                  onClick={(event) => {
                    event.preventDefault();
                    chooseService(service.label);
                  }}
                >
                  {serviceAction(service.label)} →
                </a>
              </article>
            ))}
          </div>

          <p className={styles.smallNote}>
            Les demandes de week-end ou de jour férié peuvent faire l’objet d’un tarif adapté. Les
            samedis ne sont pas disponibles.
          </p>
        </section>

        {/* --- Process --- */}
        <section id="comment-ca-marche" className={styles.process}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Simple et sur mesure</p>
            <h2>On s’organise en quatre potites étapes.</h2>
          </div>
          <ol className={styles.processList}>
            <li>
              <span className={styles.processStep}>01</span>
              <div>
                <h3>Votre demande</h3>
                <p>Vous nous indiquez le service, vos dates et les besoins de votre compagnon.</p>
              </div>
            </li>
            <li>
              <span className={styles.processStep}>02</span>
              <div>
                <h3>On fait connaissance</h3>
                <p>
                  Une première rencontre est systématiquement organisée avant une garde ou des visites
                  en votre absence.
                </p>
              </div>
            </li>
            <li>
              <span className={styles.processStep}>03</span>
              <div>
                <h3>Un devis clair</h3>
                <p>Après vérification des disponibilités, Lopoti vous envoie une proposition personnalisée.</p>
              </div>
            </li>
            <li>
              <span className={styles.processStep}>04</span>
              <div>
                <h3>À vos côtés</h3>
                <p>Une fois le devis accepté, la prestation est confirmée et vous recevez des nouvelles.</p>
              </div>
            </li>
          </ol>
        </section>

        {/* --- Trust --- */}
        <section id="confiance" className={styles.trust}>
          <div className={styles.trustImage}>
            <div className={styles.slideshow} aria-hidden="true">
              <Image src="/img/fish.jpg" alt="" fill sizes="(max-width: 850px) 100vw, 45vw" />
              <Image src="/img/ferret.jpg" alt="" fill sizes="(max-width: 850px) 100vw, 45vw" />
              <Image src="/img/rodent.jpg" alt="" fill sizes="(max-width: 850px) 100vw, 45vw" />
              <Image src="/img/snake.jpg" alt="" fill sizes="(max-width: 850px) 100vw, 45vw" />
            </div>
          </div>
          <div>
            <p className={styles.eyebrow}>L’esprit Lopoti</p>
            <h2>Parce qu’un animal est bien plus qu’un rendez-vous.</h2>
            <p className={styles.lead}>
              Chaque compagnon a ses habitudes, son énergie et sa façon d’être rassuré. Lopoti prend le
              temps de les comprendre.
            </p>
            <ul className={styles.checkList}>
              <li>Une première rencontre avant toute garde</li>
              <li>Un échange sur la routine, la santé et le caractère</li>
              <li>Des nouvelles et photos après les visites</li>
              <li>Un cadre clair, un devis avant toute confirmation</li>
            </ul>
            <p className={styles.credential}>
              ACACED et assurance professionnelle : informations à venir dès leur obtention.
            </p>
          </div>
        </section>

        {/* --- Booking --- */}
        <BookingForm
          animals={animals}
          animalSlug={animalSlug}
          onAnimalChange={setAnimalSlug}
          serviceLabel={serviceLabel}
          onServiceChange={setServiceLabel}
          animalPictos={ANIMAL_PICTOS}
        />

        {/* --- Les potes --- */}
        <section id="les-potes" className={styles.lesPotes} aria-labelledby="les-potes-title">
          <div className={styles.carouselHeading}>
            <div className={styles.sectionIntro}>
              <p className={styles.eyebrow}>Les potes</p>
              <h2 id="les-potes-title">Faisons connaissance.</h2>
              <p className={styles.poteSitter}>Pote-sitter</p>
              <p>Les personnes qui prennent soin de vos compagnons, avec attention et bienveillance.</p>
            </div>
            <div className={styles.carouselControls}>
              <button
                type="button"
                className={styles.carouselButton}
                aria-label="Voir les pote-sitters précédents"
                onClick={() => scrollTrack(potesTrack.current, -1)}
              >
                ←
              </button>
              <button
                type="button"
                className={styles.carouselButton}
                aria-label="Voir les pote-sitters suivants"
                onClick={() => scrollTrack(potesTrack.current, 1)}
              >
                →
              </button>
            </div>
          </div>

          <div ref={potesTrack} className={styles.potesCarousel} aria-label="Pote-sitters Lopoti">
            {potes.map((pote) => {
              const photo = POTE_PHOTOS[pote.id];
              const selected = pote.id === selectedPote;
              return (
                <button
                  key={pote.id}
                  type="button"
                  className={`${styles.poteWrapper} ${selected ? styles.poteSelected : ''}`}
                  aria-pressed={selected}
                  aria-label={`Sélectionner ${pote.name}`}
                  onClick={() => setSelectedPote(pote.id)}
                >
                  <Image
                    className={styles.potePicto}
                    src="/img/lopoti-picto.png"
                    alt=""
                    aria-hidden="true"
                    width={42}
                    height={42}
                  />
                  <article className={styles.poteCard}>
                    {photo ? (
                      <Image src={photo} alt={`Portrait de ${pote.name}`} width={280} height={310} />
                    ) : (
                      <div className={styles.potePlaceholder} aria-hidden="true">
                        ✦
                      </div>
                    )}
                    <div>
                      <h3>{pote.name}</h3>
                      <p className={styles.poteBio}>{pote.bio}</p>
                    </div>
                  </article>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <a className={styles.brand} href="#accueil">
          <Image src="/img/lopoti-logo.png" alt="Lopoti" width={116} height={55} />
        </a>
        <p>Paris · Services pour animaux de compagnie</p>
        <p>© {new Date().getFullYear()} Lopoti. Tous droits réservés.</p>
      </footer>
    </>
  );
}
