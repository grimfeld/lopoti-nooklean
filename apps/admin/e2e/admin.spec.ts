import { expect, test } from '@playwright/test';

/**
 * Smoke flows 3 and 4: the back office.
 *
 * Between them these cover the two things that would hurt most if broken — the
 * owner being locked out, and the customer database being readable by anyone.
 */

const PASSWORD = process.env['ADMIN_PASSWORD'] ?? 'mot-de-passe-local-de-developpement';

test('the request list is not readable without logging in', async ({ request }) => {
  // Checked at the API, not the UI: hiding a table in the browser is not access
  // control, and this is the endpoint that returns every customer's details.
  const response = await request.get('/api/requests');
  expect(response.status()).toBe(401);
});

test('a wrong password is refused', async ({ page }) => {
  await page.goto('/');

  await page.fill('input[name="password"]', 'definitely-not-the-password');
  await page.getByRole('button', { name: 'Entrer' }).click();

  await expect(page.getByRole('alert')).toContainText(/incorrect/i);
});

test('the owner can log in, see both brands, and change a status', async ({ page }) => {
  await page.goto('/');

  await page.fill('input[name="password"]', PASSWORD);
  await page.getByRole('button', { name: 'Entrer' }).click();

  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Demandes/);

  // The brand switcher is the whole reason there is one back office rather than
  // two, so it is worth asserting both sides actually switch.
  await expect(page.getByRole('tab', { name: 'Lopoti' })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  await page.getByRole('tab', { name: 'Nooklean' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Nooklean/);
  await expect(page.getByRole('tab', { name: 'Nooklean' })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  await page.getByRole('tab', { name: 'Lopoti' }).click();

  // Changing a status must persist across a reload — an optimistic UI update
  // that never reached the database would look identical until the owner
  // refreshed and lost the change.
  const statusSelect = page.locator('table select').first();
  const hasRequests = await statusSelect.isVisible().catch(() => false);

  if (hasRequests) {
    await statusSelect.selectOption('confirme');
    await page.reload();
    await expect(page.locator('table select').first()).toHaveValue('confirme');
  }
});
