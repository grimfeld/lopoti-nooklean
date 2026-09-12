import { FlatCompat } from '@eslint/eslintrc';

import { publicSite } from '@lopoti-nooklean/eslint-config/next';

/**
 * Lopoti is a PUBLIC site: the `publicSite` config bans database imports and
 * `process.env` access here, because this app is deployed with no secrets at all.
 *
 * `next/core-web-vitals` is layered on top. It catches the framework-specific
 * mistakes our own rules cannot see — an unoptimised `<img>`, a missing `key`, a
 * client-only hook in a server component — which are exactly the errors an AI
 * makes when editing React it did not write.
 */
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  // Config files sit outside the TypeScript project, so typed linting cannot
  // parse them. They are plain ESM with no app logic in them.
  { ignores: ['.next/**', 'next-env.d.ts', '*.config.mjs'] },
  ...compat.extends('next/core-web-vitals'),
  ...publicSite,
];
