import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',

    // Unit tests only. The `e2e/` directory belongs to Playwright, and without
    // this exclusion Vitest collects those files and fails — two runners
    // fighting over the same glob. Playwright is run separately via
    // `pnpm test:e2e`.
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],

    // There are no unit tests in this app yet: its logic lives in packages/db
    // (tested there against a real database) and its behaviour is covered by the
    // Playwright smoke flows. This stops `pnpm verify` failing over an empty run
    // while leaving the task in place for when unit tests are added.
    passWithNoTests: true,
  },
});
