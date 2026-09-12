import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@lopoti-nooklean/ui/styles/tokens.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lopoti — services attentionnés pour chiens, chats et NAC à Paris',
  description:
    'Visites à domicile, balades et garde pour chiens, chats et NAC à Paris. ' +
    'Demandez un créneau en quelques minutes.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // `data-brand` selects the Lopoti palette from the shared token sheet.
  return (
    <html lang="fr" data-brand="lopoti">
      <body>{children}</body>
    </html>
  );
}
