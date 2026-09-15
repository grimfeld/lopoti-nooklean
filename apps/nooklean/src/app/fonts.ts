import localFont from 'next/font/local';
import { DM_Sans, Manrope } from 'next/font/google';

/**
 * Nooklean's typefaces, all self-hosted at build time.
 *
 * Titan One is used for the wordmark and the price figures in the original
 * design; DM Sans carries the body text and Manrope the headings. See the
 * matching file in apps/lopoti for why none of these are loaded from Google's
 * CDN at runtime.
 */

export const titanOne = localFont({
  src: '../../public/fonts/titan-one.ttf',
  display: 'swap',
  variable: '--font-display',
  fallback: ['Impact', 'sans-serif'],
});

export const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-body',
});

export const manrope = Manrope({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
  variable: '--font-heading',
});
