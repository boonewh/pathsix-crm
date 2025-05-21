import { test, expect } from '@playwright/test';

test('401 from global search triggers toast and logout', async ({ page }) => {
  // Intercept the /search request and force a 401 response
  await page.route('**/search/?q=test', route => {
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Unauthorized' }),
    });
  });

  // Visit the root path (assumes you're logged in)
  await page.goto('/');

  // Type "test" to trigger the search
  const input = page.getByPlaceholder('Search...');
  await input.fill('test');

  // Wait for toast to appear
  const toast = page.locator('.react-hot-toast');
  await expect(toast).toContainText('Session expired');

  // Assert user was logged out (you redirect to /login on logout)
  await expect(page).toHaveURL(/\/login$/);
});
