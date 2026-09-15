import localFont from 'next/font/local';
import { Roboto } from 'next/font/google';

/**
 * Lopoti's typefaces.
 *
 * Both are self-hosted: `next/font/google` downloads Roboto at build time and
 * serves it from this app, so there is no request to Google at runtime. That
 * removes a third-party dependency, removes the flash of unstyled text, and
 * avoids the GDPR problem the Google Fonts CDN carries for a French business.
 *
 * Basteleur Moonlight is the display face from the original design — open
 * source, from Velvetyne, so self-hosting is permitted.
 */

export const basteleur = localFont({
  src: '../../public/fonts/basteleur-moonlight.ttf',
  display: 'swap',
  variable: '--font-display',
  // Georgia is the closest widely available serif, so the fallback keeps the
  // page's character if the font ever fails to load.
  fallback: ['Georgia', 'serif'],
});

export const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-body',
});
