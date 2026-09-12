import { expect, test } from '@playwright/test';

/**
 * Smoke flow 2: a building manager asks Nooklean for a cleaning quote.
 *
 * The interesting difference from Lopoti is the repeated address block — one
 * request can cover several buildings, each with its own mailbox count, and the
 * API has to receive them as a list rather than as flat fields.
 */

test('a visitor can submit a cleaning request for two buildings', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await page.selectOption('select[name="service"]', 'Entretien régulier des parties communes');

  // First building.
  await page.locator('input[name="street"]').first().fill('12 rue des Abbesses');
  await page.locator('input[name="postal"]').first().fill('75018');
  await page.locator('input[name="floors"]').first().fill('6');
  await page.locator('input[name="mailboxes"]').first().fill('24');

  // A second building: the multi-address path is where this form differs most
  // from Lopoti's, so the smoke test covers it rather than the simple case.
  await page.getByRole('button', { name: /Ajouter une autre adresse/i }).click();
  await page.locator('input[name="street"]').nth(1).fill('8 rue Lepic');
  await page.locator('input[name="postal"]').nth(1).fill('75018');
  await page.locator('input[name="floors"]').nth(1).fill('4');
  await page.locator('input[name="mailboxes"]').nth(1).fill('12');

  // Recurring is the default; pick the days.
  await page.getByRole('checkbox', { name: 'Mardi' }).check();
  await page.getByRole('checkbox', { name: 'Vendredi' }).check();

  const clientName = `Test Playwright ${Date.now()}`;
  await page.fill('input[name="nom_client"]', clientName);
  await page.fill('input[name="email"]', 'syndic@example.com');
  await page.fill('input[name="telephone"]', '01 23 45 67 89');

  await page.getByRole('button', { name: /Envoyer ma demande/i }).click();

  // Matched by text rather than role, as in the Lopoti spec: Next.js adds its own
  // ARIA live region, so a role query matches more than the confirmation.
  await expect(page.getByText(/c’est noté, merci/i)).toBeVisible();
});

test('a one-off request hides the weekday picker', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('checkbox', { name: 'Mardi' })).toBeVisible();

  await page.getByRole('radio', { name: /ponctuelle/i }).check();

  // Weekly days make no sense for a single visit; offering them would produce
  // requests the owner cannot fulfil as described.
  await expect(page.getByRole('checkbox', { name: 'Mardi' })).toBeHidden();
});
