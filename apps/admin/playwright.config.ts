import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke tests for the critical flows — four of them, deliberately.
 *
 * The point is not coverage, it is trust: a red build must mean "do not ship".
 * A broad, flaky suite would train the owner to ignore failures, which is worse
 * than having no end-to-end tests at all.
 *
 * These run against all three apps at once, because the flows that matter cross
 * app boundaries (a public site submits, the back office sees the row).
 */

const LOPOTI = process.env['E2E_BASE_URL_LOPOTI'] ?? 'http://localhost:3001';
const NOOKLEAN = process.env['E2E_BASE_URL_NOOKLEAN'] ?? 'http://localhost:3002';
const ADMIN = process.env['E2E_BASE_URL_ADMIN'] ?? 'http://localhost:3003';

export default defineConfig({
  testDir: './e2e',
  // A failing smoke test is a real failure, not something to paper over with
  // retries. One retry absorbs genuine flake (a cold serverless start) without
  // hiding a broken flow.
  retries: process.env['CI'] != null ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: process.env['CI'] != null,
  reporter: process.env['CI'] != null ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    ...devices['Desktop Chrome'],
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  },

  projects: [
    { name: 'lopoti', use: { baseURL: LOPOTI }, testMatch: /lopoti\./ },
    { name: 'nooklean', use: { baseURL: NOOKLEAN }, testMatch: /nooklean\./ },
    { name: 'admin', use: { baseURL: ADMIN }, testMatch: /admin\./ },
  ],

  // Start all three apps, in CI as well as locally.
  //
  // An earlier version started them only outside CI, on the assumption that CI
  // would test the Vercel preview deployments. That made the pull request gate
  // depend on a deployment finishing first, and when no URLs were passed the
  // tests quietly ran against nothing and every one of them failed at the first
  // navigation. Starting the apps here keeps the gate self-contained: it tests
  // the code in the pull request, before any deployment exists.
  //
  // `E2E_BASE_URL_*` still override, for pointing a run at a deployed preview.
  webServer: [
    {
      command: 'pnpm --filter @lopoti-nooklean/admin dev',
      url: ADMIN,
      // Locally, reuse a server already running from `pnpm dev`. In CI there is
      // never one to reuse, and silently reusing something unexpected would be
      // worse than starting fresh.
      reuseExistingServer: process.env['CI'] == null,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'pnpm --filter @lopoti-nooklean/lopoti dev',
      url: LOPOTI,
      reuseExistingServer: process.env['CI'] == null,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'pnpm --filter @lopoti-nooklean/nooklean dev',
      url: NOOKLEAN,
      reuseExistingServer: process.env['CI'] == null,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
