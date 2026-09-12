import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@lopoti-nooklean/ui/styles/tokens.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nooklean — le propre, sans prise de tête',
  description:
    "L'entretien régulier et attentif de vos parties communes à Paris et en petite couronne. " +
    'Réservez votre créneau en quelques clics.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" data-brand="nooklean">
      <body>{children}</body>
    </html>
  );
}
