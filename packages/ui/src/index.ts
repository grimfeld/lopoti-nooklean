/**
 * `@lopoti-nooklean/ui` — components and tokens shared by the three apps.
 *
 * Kept deliberately small. This package exists for things that genuinely must
 * look and behave identically everywhere — the customer-facing quote page is
 * the main one, since both brands serve it from their own domain.
 *
 * Brand-specific presentation does NOT belong here. Each site keeps its own
 * design, and the point of CSS Modules per app is that an edit to one brand
 * cannot restyle the other.
 */

export { formatDateFr, formatDateTimeFr, formatMoment } from './format';
