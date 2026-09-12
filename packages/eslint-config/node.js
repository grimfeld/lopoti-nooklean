import tseslint from 'typescript-eslint';

import { base } from './index.js';

/**
 * Rules for server-side packages.
 *
 * `packages/db` is the one place allowed to import `pg` — see ./next.js for the
 * ban that applies everywhere else.
 */
export default tseslint.config(...base, {
  rules: {
    // Raw `process.env` access scattered through a codebase is how a missing
    // variable becomes a 3am production failure. Read configuration once, in a
    // module that validates it and fails loudly at startup.
    'no-restricted-properties': [
      'error',
      {
        object: 'process',
        property: 'env',
        message:
          'Read configuration through a validated config module, not process.env directly. ' +
          'In packages/db this is allowed only in pool.ts.',
      },
    ],
  },
});
