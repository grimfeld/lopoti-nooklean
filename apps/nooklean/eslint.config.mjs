import { FlatCompat } from '@eslint/eslintrc';

import { publicSite } from '@lopoti-nooklean/eslint-config/next';

/**
 * Nooklean is a PUBLIC site — same restrictions as Lopoti, plus Next.js's own
 * rules for framework-specific mistakes (see apps/lopoti for the reasoning).
 */
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  // Config files sit outside the TypeScript project, so typed linting cannot
  // parse them. They are plain ESM with no app logic in them.
  { ignores: ['.next/**', 'next-env.d.ts', '*.config.mjs'] },
  ...compat.extends('next/core-web-vitals'),
  ...publicSite,
];
