import { expect, test } from '@playwright/test';

/**
 * Smoke flow 1: a visitor asks Lopoti for a pet-sitting slot.
 *
 * This is the flow that earns the business money, so it is the flow that must
 * never silently break. It deliberately exercises the whole path — browser form,
 * cross-origin call to the admin API, Zod validation, database insert — rather
 * than mocking any part of it.
 */

test('a visitor can submit a pet-sitting request', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await page.selectOption('select[name="type_animal"]', 'Chien');
  await page.fill('input[name="nom_animal"]', 'Pixel');
  await page.selectOption('select[name="service"]', 'Visite à domicile');
  await page.selectOption('select[name="moment_souhaite"]', 'Matin');

  // A unique name per run, so the assertion in the admin test can find this row
  // without depending on database state left by an earlier run.
  const clientName = `Test Playwright ${Date.now()}`;
  await page.fill('input[name="nom_client"]', clientName);
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="telephone"]', '06 12 34 56 78');
  await page.fill('input[name="adresse"]', '12 rue de Test');
  await page.fill('input[name="secteur"]', 'Paris 11e');
  await page.fill('input[name="contact_urgence"]', 'Contact Test 06 98 76 54 32');

  await page.getByRole('button', { name: /Envoyer ma demande/i }).click();

  // The confirmation must be explicit. A visitor who is unsure whether their
  // request was received will phone, or give up.
  // Matched by text rather than role: Next.js renders its own announcer element
  // with an ARIA live role, which makes a bare role query ambiguous.
  await expect(page.getByText(/votre demande est bien arrivée/i)).toBeVisible();
});

test('the form refuses an incomplete submission', async ({ page }) => {
  await page.goto('/');

  // Submitting with nothing filled in must not produce a success state.
  await page.getByRole('button', { name: /Envoyer ma demande/i }).click();

  await expect(page.getByText(/votre demande est bien arrivée/i)).toBeHidden();
});
