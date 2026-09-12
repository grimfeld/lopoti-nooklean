import { RequestForm } from './request-form';

import styles from './page.module.css';

/**
 * Lopoti home page — first vertical slice.
 *
 * The full design (hero, service cards, the conditional animal → service flow)
 * is ported in a later slice. What matters now is that the whole path works
 * end to end: a visitor submits this form, the admin API validates and stores
 * it, and the row appears in the back office.
 */
export default function HomePage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Paris et proche banlieue</p>
        <h1>Des services attentionnés pour votre animal.</h1>
        <p className={styles.lede}>
          Visites à domicile, balades et garde pendant vos absences. Dites-nous ce dont votre animal
          a besoin — nous revenons vers vous avant tout engagement.
        </p>
      </header>

      <section className={styles.formSection} id="demande">
        <h2>Demander un créneau</h2>
        <p className={styles.note}>
          Il s’agit d’une <strong>demande</strong>, pas d’une réservation confirmée. Nous vérifions
          la disponibilité et vous répondons personnellement.
        </p>
        <RequestForm />
      </section>
    </main>
  );
}
