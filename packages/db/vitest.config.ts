import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Node environment: this package is server-only, never bundled for a browser.
    environment: 'node',
    include: ['src/**/*.test.ts'],

    // Loads packages/db/.env so the database-backed tests actually run locally
    // instead of silently skipping. See vitest.setup.ts.
    setupFiles: ['./vitest.setup.ts'],

    // The database tests share one schema, so they must not run concurrently
    // against each other — a parallel truncate would break a sibling test.
    fileParallelism: false,

    passWithNoTests: false,
  },
});
