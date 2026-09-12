import { base } from '@lopoti-nooklean/eslint-config';

/**
 * Shared components. The base rules are enough here: this package holds no
 * secrets, makes no database calls, and is imported by all three apps.
 */
export default [{ ignores: ['dist/**'] }, ...base];
