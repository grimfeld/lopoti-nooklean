import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@lopoti-nooklean/ui/styles/tokens.css';
import './globals.css';
import { dmSans, manrope, titanOne } from './fonts';

export const metadata: Metadata = {
  title: 'Nooklean — Le propre, sans prise de tête',
  description:
    'Nooklean entretient les parties communes de votre immeuble à Paris et en petite couronne : ' +
    'hall, escaliers, ascenseur et vitres. Demandez un devis en quelques clics.',
  icons: { icon: '/img/nooklean-logo.png' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="fr"
      data-brand="nooklean"
      className={`${titanOne.variable} ${dmSans.variable} ${manrope.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
