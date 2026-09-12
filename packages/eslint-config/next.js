import tseslint from 'typescript-eslint';

import { base } from './index.js';

/**
 * Rules for the Next.js apps, including this project's structural invariants.
 *
 * These are the mechanical twins of the rules written in prose in CLAUDE.md.
 * Prose advises; these fail the build. That difference is the entire point —
 * changes here will often be authored by an AI working without supervision.
 */

/** Applied to the two PUBLIC sites (apps/lopoti, apps/nooklean). */
export const publicSite = tseslint.config(...base, {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'pg',
            message:
              'Public sites never talk to the database directly. They call the admin API. ' +
              'All database access lives in packages/db.',
          },
          {
            name: '@lopoti-nooklean/db',
            message:
              'Public sites are static and hold no credentials. Import types from ' +
              '@lopoti-nooklean/db/schema only, and fetch data from the admin API.',
          },
        ],
        patterns: [
          {
            group: ['**/apps/**'],
            message:
              'Apps must stay independent. Share code through packages/ui or packages/db instead.',
          },
        ],
      },
    ],

    // A public site that reads process.env can leak a secret into a client
    // bundle. These apps are deployed with no secrets at all; anything
    // environment-shaped belongs in the admin app.
    'no-restricted-properties': [
      'error',
      {
        object: 'process',
        property: 'env',
        message:
          'Public sites hold no environment secrets. Use the exported config constant, ' +
          'or move the logic into apps/admin where secrets live.',
      },
    ],
  },
});

/** Applied to the back office (apps/admin), which owns the API and the secrets. */
export const adminApp = tseslint.config(...base, {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'pg',
            message:
              'Import from @lopoti-nooklean/db instead. That package owns the connection pool ' +
              'so there is exactly one place where database access is defined.',
          },
        ],
        patterns: [
          {
            group: ['**/apps/**'],
            message:
              'Apps must stay independent. Share code through packages/ui or packages/db instead.',
          },
        ],
      },
    ],
  },
});

export default publicSite;
