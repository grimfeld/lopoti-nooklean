import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@lopoti-nooklean/ui/styles/tokens.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Back-office — Lopoti × Nooklean',
  // The back office must never appear in a search result.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
