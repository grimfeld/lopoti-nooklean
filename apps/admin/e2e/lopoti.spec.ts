import { expect, test } from '@playwright/test';

/**
 * Lopoti — the pet-sitting request.
 *
 * This is the flow that earns the business money, so it is the one that must
 * never silently break. It walks the whole five-step form the way a visitor
 * does, and exercises the site's organising idea: choosing an animal changes
 * which services are offered, everywhere.
 */

test.describe('Lopoti', () => {
  test('the page renders with its real design', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/en toute confiance/i);
    // The band that gives the brand its name.
    await expect(page.getByRole('link', { name: /Découvrir les potes/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Qui accompagne Lopoti/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /quatre potites étapes/i })).toBeVisible();
  });

  test('choosing a companion changes the services offered', async ({ page }) => {
    await page.goto('/');

    // A dog gets walks; a fish does not. If this ever stops being true, the
    // conditional catalogue has broken and visitors see irrelevant services.
    await page.getByRole('button', { name: 'Chien' }).click();
    await expect(page.getByRole('heading', { name: /pensés pour votre chien/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Balade & promenade' })).toBeVisible();

    await page.getByRole('button', { name: 'Poisson' }).click();
    await expect(page.getByRole('heading', { name: /pensés pour votre poisson/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Balade & promenade' })).toBeHidden();
  });

  test('a visitor can complete the five-step request', async ({ page }) => {
    await page.goto('/');

    // Step 1 — animal.
    await page.locator('#demande').scrollIntoViewIfNeeded();
    await page.locator('input[name="type_animal_choice"][value="chat"]').check();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Step 2 — service, whose options depend on the animal chosen above.
    await expect(page.getByText(/disponibles pour/i)).toBeVisible();
    await page.locator('input[name="service_choice"]').first().check();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Step 3 — date. Pick an enabled day from the calendar rather than typing,
    // so the Saturday rule is exercised by the component itself.
    const availableDay = page.locator('button:not([disabled])', { hasText: /^\d+$/ }).first();
    await availableDay.click();
    await page.selectOption('select[name="moment_souhaite"]', 'Matin');
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Step 4 — the animal's record.
    await page.fill('input[name="nom_animal"]', 'Pixel');
    await page.fill('textarea[name="temperament"]', 'Sociable et curieux.');
    await page.fill('textarea[name="routine"]', 'Deux repas par jour, litière le matin.');
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Step 5 — contact details.
    await page.fill('input[name="nom_client"]', `Test Playwright ${Date.now()}`);
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="telephone"]', '06 12 34 56 78');
    await page.fill('input[name="adresse"]', '12 rue de Test');
    await page.fill('input[name="secteur"]', 'Paris 11e');
    await page.fill('input[name="contact_urgence"]', 'Contact Test 06 98 76 54 32');
    await page.locator('input[name="accord_prise_contact"]').check();
    await page.locator('input[name="accord_premiere_rencontre"]').check();

    await page.getByRole('button', { name: /Envoyer ma demande/i }).click();

    // The confirmation must be explicit: a visitor unsure whether their request
    // arrived will phone, or give up.
    await expect(page.getByText(/votre demande est bien arrivée/i)).toBeVisible();
  });

  test('Saturdays cannot be chosen', async ({ page }) => {
    await page.goto('/');

    await page.locator('#demande').scrollIntoViewIfNeeded();
    await page.locator('input[name="type_animal_choice"]').first().check();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.locator('input[name="service_choice"]').first().check();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // The sixth column of the calendar grid is Saturday (Monday-first).
    // Every cell in it must be disabled — the owner does not work Saturdays and
    // a bookable one would produce a request that cannot be honoured.
    await expect(page.getByText(/Samedi indisponible/i)).toBeVisible();
    const saturdays = page.locator('button[disabled]');
    expect(await saturdays.count()).toBeGreaterThan(0);
  });

  test('the form refuses to advance without a choice', async ({ page }) => {
    await page.goto('/');

    await page.locator('#demande').scrollIntoViewIfNeeded();
    // Step 2 requires a service; skipping it must not reach step 3.
    await page.locator('input[name="type_animal_choice"]').first().check();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Matched by text rather than role: Next.js renders its own ARIA live
    // region, so a bare role query matches more than the error message.
    await expect(page.getByText(/choisissez un service/i)).toBeVisible();
  });
});
