import { FlatCompat } from '@eslint/eslintrc';

import { adminApp } from '@lopoti-nooklean/eslint-config/next';

/**
 * The back office may read secrets, but still must not import `pg` directly —
 * all database access goes through @lopoti-nooklean/db so there is exactly one
 * place where queries are defined.
 *
 * Next.js's own rules are layered on for the same reason as the public sites.
 */
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  // Config files sit outside the TypeScript project, so typed linting cannot
  // parse them. They are plain ESM with no app logic in them.
  { ignores: ['.next/**', 'next-env.d.ts', 'e2e/**', '*.config.mjs', '*.config.ts'] },
  ...compat.extends('next/core-web-vitals'),
  ...adminApp,
];
