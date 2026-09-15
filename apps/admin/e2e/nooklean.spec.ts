import { expect, test } from '@playwright/test';

/**
 * Nooklean — the cleaning quote request.
 *
 * What makes this form different from Lopoti's, and therefore what the tests
 * concentrate on: one request can cover several buildings, and the rhythm choice
 * (a recurring contract versus a single visit) changes what step two asks for.
 */

test.describe('Nooklean', () => {
  test('the page renders with its real design', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Impeccables/i);
    await expect(page.getByRole('heading', { name: /pour que tout soit net/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /On fait briller/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Un immeuble suivi/i })).toBeVisible();
  });

  test('choosing a service card carries it into the form', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Choisir ce service/i }).nth(1).click();

    // The second card is window cleaning; the form's select should follow.
    await expect(page.locator('select[name="service"]')).toHaveValue('Nettoyage des vitres');
  });

  test('a visitor can request a recurring contract for two buildings', async ({ page }) => {
    await page.goto('/');
    await page.locator('#reservation').scrollIntoViewIfNeeded();

    // Step 1 — the buildings.
    await page.selectOption('select[name="service"]', 'Entretien régulier des parties communes');
    await page.locator('input[name="street"]').first().fill('12 rue des Abbesses');
    await page.locator('input[name="postal"]').first().fill('75018');
    await page.locator('input[name="floors"]').first().fill('6');
    await page.locator('input[name="mailboxes"]').first().fill('24');

    // The multi-address path is where this form differs most from Lopoti's.
    await page.getByRole('button', { name: /Ajouter une autre adresse/i }).click();
    await page.locator('input[name="street"]').nth(1).fill('8 rue Lepic');
    await page.locator('input[name="postal"]').nth(1).fill('75018');
    await page.locator('input[name="floors"]').nth(1).fill('4');
    await page.locator('input[name="mailboxes"]').nth(1).fill('12');

    await page.getByRole('button', { name: /Voir les créneaux/i }).click();

    // Step 2 — recurring is the default, so weekdays are what it asks for.
    await page.getByRole('button', { name: 'Mar' }).click();
    await page.getByRole('button', { name: 'Ven' }).click();
    const start = new Date();
    start.setDate(start.getDate() + 7);
    await page.locator('input[type="date"]').fill(start.toISOString().slice(0, 10));
    await page.getByRole('button', { name: /Continuer/i }).click();

    // Step 3 — contact.
    // The client name is composed from these two: there is no separate field.
    await page.fill('input[name="firstname"]', 'Test');
    await page.fill('input[name="lastname"]', `Syndic ${Date.now()}`);
    await page.fill('input[name="email"]', 'syndic@example.com');
    await page.fill('input[name="telephone"]', '01 23 45 67 89');
    await page.locator('input[type="checkbox"]').last().check();

    await page.getByRole('button', { name: /Confirmer ma demande/i }).click();

    await expect(page.getByText(/c’est noté, merci/i)).toBeVisible();
  });

  test('a one-off request asks for a slot instead of weekdays', async ({ page }) => {
    await page.goto('/');
    await page.locator('#reservation').scrollIntoViewIfNeeded();

    await page.locator('input[name="street"]').first().fill('1 rue de Test');
    await page.locator('input[name="postal"]').first().fill('75001');
    await page.locator('input[name="floors"]').first().fill('3');
    await page.locator('input[name="mailboxes"]').first().fill('8');
    await page.getByRole('button', { name: /Voir les créneaux/i }).click();

    // Weekly days make no sense for a single visit; offering them would produce
    // requests the owner cannot fulfil as described.
    //
    // Scoped to the weekday group: the day picker shown for a one-off visit also
    // renders buttons labelled "mar. 17", so a bare name query matches both.
    const weekdayPicker = page.getByRole('button', { name: 'Mar', exact: true });
    await expect(weekdayPicker).toBeVisible();

    await page.getByRole('radio', { name: /ponctuelle/i }).check();
    await expect(weekdayPicker).toBeHidden();

    // Slots only become selectable once a day is chosen.
    await expect(page.getByRole('button', { name: '08:30' })).toBeDisabled();
    await page.getByRole('button', { name: /\d{1,2}\s/ }).first().click();
    await expect(page.getByRole('button', { name: '08:30' })).toBeEnabled();
  });

  test('the form refuses to advance without a schedule', async ({ page }) => {
    await page.goto('/');
    await page.locator('#reservation').scrollIntoViewIfNeeded();

    await page.locator('input[name="street"]').first().fill('1 rue de Test');
    await page.locator('input[name="postal"]').first().fill('75001');
    await page.locator('input[name="floors"]').first().fill('3');
    await page.locator('input[name="mailboxes"]').first().fill('8');
    await page.getByRole('button', { name: /Voir les créneaux/i }).click();

    // No weekday, no start date: step three must stay out of reach.
    await page.getByRole('button', { name: /Continuer/i }).click();
    // Matched by text rather than role: Next.js renders its own ARIA live
    // region, so a bare role query matches more than the error message.
    await expect(page.getByText(/jour de passage/i)).toBeVisible();
  });
});
