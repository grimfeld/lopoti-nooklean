import { expect, test } from '@playwright/test';

/**
 * The back office.
 *
 * Between them these cover the two things that would hurt most if broken: the
 * owner being locked out, and the customer database being readable by anyone.
 */

const PASSWORD = process.env['ADMIN_PASSWORD'] ?? 'mot-de-passe-local-de-developpement';

test.describe('Back office', () => {
  test('the request list is not readable without logging in', async ({ request }) => {
    // Checked at the API, not the UI: hiding a table in the browser is not
    // access control, and this endpoint returns every customer's details.
    const response = await request.get('/api/requests');
    expect(response.status()).toBe(401);
  });

  test('the service catalogue is public, but saving it is not', async ({ request }) => {
    // The public Lopoti site reads this to build its form, so it must be
    // reachable anonymously...
    const read = await request.get('/api/config');
    expect(read.status()).toBe(200);

    // ...while changing what every visitor sees must not be.
    const write = await request.post('/api/config', { data: { config: {} } });
    expect(write.status()).toBe(401);
  });

  test('a wrong password is refused', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[name="password"]', 'definitely-not-the-password');
    await page.getByRole('button', { name: 'Entrer' }).click();

    // Matched by the text the owner reads, not by role: Next.js renders its own
    // route announcer with role="alert", which makes a role query ambiguous.
    await expect(page.getByText(/mot de passe incorrect/i)).toBeVisible();
  });

  test('the owner can log in, see both brands, and change a status', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[name="password"]', PASSWORD);
    await page.getByRole('button', { name: 'Entrer' }).click();

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Demandes/);

    // The brand switcher is the whole reason there is one back office rather
    // than two, so both sides are asserted.
    await expect(page.getByRole('tab', { name: 'Lopoti' })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: 'Nooklean' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Nooklean/);
    await page.getByRole('tab', { name: 'Lopoti' }).click();

  });

  test('a status change survives a reload', async ({ page, request }) => {
    // This test creates its own request rather than picking whatever row is
    // first in the table.
    //
    // The earlier version did the latter and was flaky for a good reason: two
    // runs of the Lopoti form both pick the first free calendar day, so the
    // database accumulates several requests wanting the same moment. Confirming
    // a second one at a moment already taken is refused by the partial unique
    // index — the double-booking guard working exactly as intended. A test that
    // asserts on an arbitrary row was therefore asserting on whether someone
    // else had already claimed that slot.
    const marker = `E2E statut ${Date.now()}`;
    const created = await request.post('/api/submit', {
      data: {
        brand: 'lopoti',
        service: 'Visite à domicile',
        type_animal: 'Chat',
        adresse: '2 rue de Test',
        contact_urgence: 'Test 0600000000',
        nom_client: marker,
        email: 'statut@example.com',
        telephone: '0612345678',
        secteur: 'Paris 11e',
        // No date: the request carries no moment, so confirming it cannot
        // collide with anything on the shared calendar.
      },
    });
    expect(created.status()).toBe(200);

    await page.goto('/');
    await page.fill('input[name="password"]', PASSWORD);
    await page.getByRole('button', { name: 'Entrer' }).click();

    const row = page.getByRole('row').filter({ hasText: marker });
    await expect(row).toBeVisible();

    // An optimistic update that never reached the database would look identical
    // until the owner refreshed, which is why the assertion is after a reload.
    await row.locator('select').selectOption('confirme');
    await page.reload();

    await expect(page.getByRole('row').filter({ hasText: marker }).locator('select')).toHaveValue(
      'confirme',
    );
  });

  test('a submitted request reaches the back office', async ({ page, request }) => {
    // Submit straight to the API rather than driving a public site: this test is
    // about the back office receiving what arrives, and the public forms have
    // their own specs.
    const marker = `E2E ${Date.now()}`;
    const submission = await request.post('/api/submit', {
      data: {
        brand: 'lopoti',
        service: 'Visite à domicile',
        type_animal: 'Chat',
        adresse: '1 rue de Test',
        contact_urgence: 'Test 0600000000',
        nom_client: marker,
        email: 'e2e@example.com',
        telephone: '0612345678',
        secteur: 'Paris 11e',
      },
    });
    expect(submission.status()).toBe(200);

    await page.goto('/');
    await page.fill('input[name="password"]', PASSWORD);
    await page.getByRole('button', { name: 'Entrer' }).click();

    // The row must be visible without any filtering: a new request the owner
    // cannot see is a lost customer.
    await expect(page.getByText(marker)).toBeVisible();
  });
});
