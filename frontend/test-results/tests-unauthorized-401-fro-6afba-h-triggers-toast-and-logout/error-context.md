# Test info

- Name: 401 from global search triggers toast and logout
- Location: C:\Users\William Boone\Desktop\Websites\pathsix-crm\frontend\tests\unauthorized.spec.ts:3:5

# Error details

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByPlaceholder('Search...')

    at C:\Users\William Boone\Desktop\Websites\pathsix-crm\frontend\tests\unauthorized.spec.ts:18:15
```

# Page snapshot

```yaml
- heading "Login to PathSix CRM" [level=1]
- text: Email
- textbox "Email"
- text: Password
- textbox "Password"
- button "Log In"
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test('401 from global search triggers toast and logout', async ({ page }) => {
   4 |   // Intercept the /search request and force a 401 response
   5 |   await page.route('**/search/?q=test', route => {
   6 |     route.fulfill({
   7 |       status: 401,
   8 |       contentType: 'application/json',
   9 |       body: JSON.stringify({ error: 'Unauthorized' }),
  10 |     });
  11 |   });
  12 |
  13 |   // Visit the root path (assumes you're logged in)
  14 |   await page.goto('/');
  15 |
  16 |   // Type "test" to trigger the search
  17 |   const input = page.getByPlaceholder('Search...');
> 18 |   await input.fill('test');
     |               ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  19 |
  20 |   // Wait for toast to appear
  21 |   const toast = page.locator('.react-hot-toast');
  22 |   await expect(toast).toContainText('Session expired');
  23 |
  24 |   // Assert user was logged out (you redirect to /login on logout)
  25 |   await expect(page).toHaveURL(/\/login$/);
  26 | });
  27 |
```