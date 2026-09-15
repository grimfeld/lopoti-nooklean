import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@lopoti-nooklean/ui/styles/tokens.css';
import './globals.css';
import { basteleur, roboto } from './fonts';

export const metadata: Metadata = {
  title: 'Lopoti — Le pote de ton poti pote',
  description:
    'Lopoti, services attentionnés pour chiens, chats et NAC à Paris. Visites, promenades et gardes, ' +
    'avec une première rencontre systématique et des nouvelles après chaque visite.',
  icons: { icon: '/img/lopoti-picto.png' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // `data-brand` selects the Lopoti palette from the shared token sheet; the
  // font variables are what globals.css refers to as --font-display/--font-body.
  return (
    <html lang="fr" data-brand="lopoti" className={`${basteleur.variable} ${roboto.variable}`}>
      <body>{children}</body>
    </html>
  );
}
