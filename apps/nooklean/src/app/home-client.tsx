'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { BookingForm } from './booking-form';

import styles from './page.module.css';

/**
 * The Nooklean home page.
 *
 * Two pieces of the original design are load-bearing for its character and are
 * reproduced faithfully: the arch-shaped hero with cross-fading photographs,
 * and the star-cleaning easter egg — hover a ✦ and it is "cleaned" away; clear
 * them all and the raccoon congratulates you.
 */

export const SERVICES = [
  {
    id: 'regulier',
    label: 'Entretien régulier des parties communes',
    short: 'Entretien régulier',
    number: '01',
    icon: '⌂',
    description: 'Hall, paliers, escaliers, ascenseur et points de contact de votre résidence.',
    colour: styles.cardCoral,
  },
  {
    id: 'vitres',
    label: 'Nettoyage des vitres',
    short: 'Nettoyage des vitres',
    number: '02',
    icon: '▦',
    description: 'Vitres, portes vitrées et surfaces accessibles, sans traces et avec soin.',
    colour: styles.cardMint,
  },
  {
    id: 'autre',
    label: 'Autre service',
    short: 'Autre service',
    number: '03',
    icon: '✦',
    description: 'Un besoin ponctuel ou particulier ? Décrivez-nous votre demande.',
    colour: styles.cardCream,
  },
] as const;

const HERO_SLIDES = ['/img/hero-1.jpg', '/img/hero-2.jpg', '/img/hero-3.jpg'];

/**
 * Where the stars sit, as [section selector, x%, y%, size px].
 * Taken from the original `fixedStarMap` so they land in the same places.
 */
const STAR_MAP: ReadonlyArray<readonly [string, number, number, number]> = [
  ['hero', 50, 18, 20],
  ['hero', 36, 55, 27],
  ['hero', 91, 86, 17],
  ['services', 65, 12, 22],
  ['services', 92, 7, 19],
  ['method', 8, 94, 18],
  ['method', 22, 76, 25],
  ['method', 46, 84, 16],
  ['booking', 29, 75, 17],
  ['booking', 35, 55, 24],
  ['values', 26, 53, 19],
  ['values', 96, 13, 25],
  ['values', 96, 84, 17],
  ['values', 5, 12, 28],
  ['footer', 19, 7, 18],
  ['footer', 24, 67, 26],
  ['footer', 95, 16, 21],
  ['footer', 80, 58, 23],
  ['footer', 64, 25, 17],
];

const STAR_PALETTES: Record<string, readonly string[]> = {
  method: ['#64d25a', '#dcefc6', '#ffffff'],
  footer: ['#64d25a', '#dcefc6', '#ffffff'],
  values: ['#102427', '#64d25a', '#dcefc6'],
  default: ['#64d25a', '#628e94', '#254a50'],
};

function Stars({ section }: { section: string }) {
  const [cleaned, setCleaned] = useState<Set<number>>(new Set());
  const stars = STAR_MAP.map((star, index) => ({ star, index })).filter(
    ({ star }) => star[0] === section,
  );

  return (
    <>
      {stars.map(({ star, index }) => {
        const [, x, y, size] = star;
        const palette = STAR_PALETTES[section] ?? STAR_PALETTES['default'] ?? [];
        return (
          <button
            key={index}
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className={`${styles.fixedStar} ${cleaned.has(index) ? styles.starCleaned : ''}`}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              fontSize: `${size}px`,
              color: palette[index % palette.length],
            }}
            onMouseEnter={() => setCleaned((set) => new Set(set).add(index))}
            onClick={() => setCleaned((set) => new Set(set).add(index))}
          >
            ✦
          </button>
        );
      })}
    </>
  );
}

export function HomeClient() {
  const [slide, setSlide] = useState(0);
  const [service, setService] = useState<string>(SERVICES[0].label);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlide((current) => (current + 1) % HERO_SLIDES.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  function chooseService(label: string): void {
    setService(label);
    document.querySelector('#reservation')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <header className={`${styles.nav} ${styles.shell}`}>
        <a className={styles.brand} href="#top" aria-label="Nooklean, accueil">
          <Image src="/img/nooklean-logo.png" alt="Nooklean" width={195} height={78} priority />
        </a>
        <nav className={styles.navLinks} aria-label="Navigation principale">
          <a href="#services">Services</a>
          <a href="#methode">Comment ça marche</a>
          <a href="#engagements">Nos engagements</a>
        </nav>
        <a className={styles.btnDark} href="#reservation">
          Réserver <span>↗</span>
        </a>
        <button className={styles.menu} aria-label="Ouvrir le menu">
          ☰
        </button>
      </header>

      <main id="top">
        {/* --- Hero --- */}
        <section className={`${styles.hero} ${styles.shell}`}>
          <Stars section="hero" />
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>
              <i /> Disponible à Paris &amp; petite couronne
            </div>
            <div className={styles.brandline}>
              <span>Avec</span>
              <Image src="/img/nooklean-wordmark.png" alt="Nooklean" width={420} height={88} priority />
            </div>
            <h1 className={styles.heroTitle}>
              vos parties communes.
              <br />
              <em>Impeccables,</em>
              <br />
              toute l’année.
            </h1>
            <p>
              L’entretien régulier et attentif de votre immeuble. Hall, escaliers, ascenseur et locaux
              communs : chaque passage compte.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.btnCoral} href="#reservation">
                Réserver un nettoyage <span>→</span>
              </a>
              <a className={styles.textLink} href="#methode">
                Découvrir Nooklean ↓
              </a>
            </div>
            <div className={styles.rating}>
              <span className={styles.faces}>★★★★★</span>
              <b>4,9/5</b>
              <small>· Des résidences propres, des occupants sereins</small>
            </div>
          </div>

          <div className={styles.heroArt}>
            <div className={styles.stamp}>
              <Image src="/img/nook-mascotte.png" alt="Nook, le raton laveur Nooklean" width={106} height={106} />
            </div>
            <div className={styles.arch} aria-label="Réalisations Nooklean">
              {HERO_SLIDES.map((src, index) => (
                <Image
                  key={src}
                  className={`${styles.heroSlide} ${index === slide ? styles.heroSlideActive : ''}`}
                  src={src}
                  alt=""
                  fill
                  sizes="(max-width: 800px) 100vw, 45vw"
                  priority={index === 0}
                />
              ))}
              <div className={styles.sliderDots} aria-hidden="true">
                {HERO_SLIDES.map((src, index) => (
                  <i key={src} className={index === slide ? styles.sliderDotActive : undefined} />
                ))}
              </div>
            </div>
            <div className={styles.floatCard}>
              <span>✓</span>
              <div>
                <b>Équipe vérifiée</b>
                <small>Des pros de confiance</small>
              </div>
            </div>
            <Image
              className={styles.carouselTail}
              src="/img/tail.png"
              alt=""
              aria-hidden="true"
              width={132}
              height={110}
            />
          </div>
        </section>

        {/* --- Trust band --- */}
        <section className={styles.trust}>
          <p>Une solution pensée pour</p>
          <div>
            <b>Syndics</b>
            <b>Copropriétés</b>
            <b>Bailleurs</b>
            <b>Gestionnaires</b>
            <b>Résidences</b>
            <b>Entreprises</b>
          </div>
        </section>

        {/* --- Services --- */}
        <section className={styles.services} id="services">
          <Stars section="services" />
          <div className={styles.shell}>
            <div className={styles.sectionHead}>
              <div>
                <span className={styles.kicker}>NOTRE PRIORITÉ</span>
                <h2>
                  Plusieurs casquettes
                  <br />
                  pour que tout soit net.
                </h2>
              </div>
              <p>
                Un entretien adapté à votre immeuble, avec des passages réguliers, contrôlés et faciles
                à planifier.
              </p>
            </div>

            <div className={styles.serviceGrid}>
              {SERVICES.map((item) => (
                <article
                  key={item.id}
                  className={`${styles.serviceCard} ${item.colour} ${
                    service === item.label ? styles.serviceSelected : ''
                  }`}
                >
                  <div className={styles.serviceIcon}>{item.icon}</div>
                  <span>{item.number}</span>
                  <h3>{item.short}</h3>
                  <p>{item.description}</p>
                  <button type="button" onClick={() => chooseService(item.label)}>
                    <b>Choisir ce service →</b>
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* --- Method --- */}
        <section className={styles.method} id="methode">
          <Stars section="method" />
          <div className={`${styles.shell} ${styles.methodGrid}`}>
            <div className={styles.methodIntro}>
              <span className={styles.kickerLight}>EN 3 ÉTAPES</span>
              <h2>
                Vous réservez.
                <br />
                On fait briller.
              </h2>
              <Image
                className={styles.miniMascot}
                src="/img/nook-mascotte.png"
                alt=""
                aria-hidden="true"
                width={112}
                height={112}
              />
              <p className={styles.methodBubble}>
                Simple comme un coup d’éponge. La réservation prend moins de deux minutes.
              </p>
            </div>
            <ol className={styles.methodList}>
              <li>
                <b>01</b>
                <div>
                  <h3>Décrivez votre immeuble</h3>
                  <p>Nombre d’étages, équipements et fréquence souhaitée.</p>
                </div>
              </li>
              <li>
                <b>02</b>
                <div>
                  <h3>Sélectionnez votre créneau</h3>
                  <p>Les disponibilités sont mises à jour en temps réel.</p>
                </div>
              </li>
              <li>
                <b>03</b>
                <div>
                  <h3>On prend le relais</h3>
                  <p>
                    J’interviens avec les produits et le matériel nécessaires, sauf si vous souhaitez
                    utiliser ceux déjà sur place.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* --- Booking --- */}
        <section className={`${styles.booking} ${styles.shell}`} id="reservation">
          <Stars section="booking" />
          <div className={styles.bookingIntro}>
            <span className={styles.kicker}>RÉSERVER</span>
            <h2>Quand passe-t-on ?</h2>
            <p>
              Choisissez la formule et les jours qui correspondent le mieux aux besoins de votre
              immeuble.
            </p>
            <div className={styles.syncPill}>
              <i /> Disponibilités en temps réel
            </div>
          </div>
          <BookingForm service={service} onServiceChange={setService} />
        </section>

        {/* --- Values --- */}
        <section className={styles.values} id="engagements">
          <Stars section="values" />
          <div>
            <span className={styles.kickerLight}>POURQUOI NOUS</span>
            <h2>
              Un immeuble suivi.
              <br />À chaque passage.
            </h2>
          </div>
          <div className={styles.value}>
            <b>01</b>
            <h3>Interlocuteur unique</h3>
            <p>Je réalise personnellement les prestations et je connais les priorités de votre résidence.</p>
          </div>
          <div className={styles.value}>
            <b>02</b>
            <h3>Service sur mesure</h3>
            <p>La fréquence et le cahier de passage sont adaptés aux besoins réels de chaque immeuble.</p>
          </div>
          <div className={styles.value}>
            <b>03</b>
            <h3>Matériel fourni</h3>
            <p>J’apporte les produits et le matériel nécessaires, sauf si vous en avez déjà à disposition.</p>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <Stars section="footer" />
        <div className={styles.shell}>
          <Image
            className={styles.footerLogo}
            src="/img/nooklean-logo.png"
            alt="Nooklean"
            width={340}
            height={130}
          />
          <h2>
            Prêt à offrir des espaces
            <br />
            impeccables à vos occupants ?
          </h2>
          <a className={styles.btnCoral} href="#reservation">
            Réserver maintenant →
          </a>
          <div className={styles.foot}>
            <span>© {new Date().getFullYear()} Nooklean</span>
            <span>Paris &amp; petite couronne</span>
            <span>bonjour@nooklean.fr</span>
          </div>
        </div>
      </footer>
    </>
  );
}
