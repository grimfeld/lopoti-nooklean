/**
 * Date and time formatting, in French, used by all three apps.
 *
 * Centralised because the sites, the back office and the quote pages must agree
 * on how a date reads — a customer seeing "14/03/2026" on the site and
 * "2026-03-14" on their quote notices the seam.
 */

const DATE_FR = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
const DATE_SHORT_FR = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const TIME_FR = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

/** "14 mars 2026". Returns a dash for a missing date rather than "Invalid Date". */
export function formatDateFr(value: Date | string | null | undefined): string {
  const date = toDate(value);
  return date ? DATE_FR.format(date) : '—';
}

/** "14/03/2026 à 10:00" — used where a precise slot matters. */
export function formatDateTimeFr(value: Date | string | null | undefined): string {
  const date = toDate(value);
  if (!date) return '—';
  return `${DATE_SHORT_FR.format(date)} à ${TIME_FR.format(date)}`;
}

/**
 * Lopoti collects a day plus a rough moment ("matin", "après-midi") rather than
 * a clock time, and stores midday as a placeholder. Showing "12:00" would imply
 * a precision that was never asked for, so the moment is shown instead.
 */
export function formatMoment(
  value: Date | string | null | undefined,
  moment: string | null | undefined,
): string {
  const date = toDate(value);
  if (!date) return '—';
  const day = DATE_FR.format(date);
  return moment ? `${day} (${moment})` : day;
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
