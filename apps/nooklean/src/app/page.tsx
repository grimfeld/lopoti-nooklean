import { BookingForm } from './booking-form';

import styles from './page.module.css';

/**
 * Nooklean home page — first vertical slice.
 *
 * The full design (hero slider, service cards, the star-cleaning easter egg) is
 * ported in a later slice. This proves the path end to end: a visitor submits,
 * the admin API validates and stores it, and the row shows up in the back office
 * beside the Lopoti requests.
 */
export default function HomePage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Paris et petite couronne</p>
        <h1>Vos parties communes, impeccables.</h1>
        <p className={styles.lede}>
          L’entretien régulier et attentif de votre immeuble : hall, escaliers, ascenseur et locaux
          communs. Décrivez votre immeuble, nous établissons une proposition.
        </p>
      </header>

      <section className={styles.formSection} id="reservation">
        <h2>Demander un devis</h2>
        <p className={styles.note}>
          Aucun tarif n’est engagé à ce stade. Nous étudions les accès et la fréquence, puis nous
          vous envoyons une proposition détaillée.
        </p>
        <BookingForm />
      </section>
    </main>
  );
}
