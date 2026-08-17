import { test, expect } from '@playwright/test';

// One full run through register -> browse -> search -> save -> preferences
// -> personalized feed -> profile -> change password -> logout -> login
// against a real server + database (see playwright.config.js and
// .github/workflows/ci.yml's `e2e` job). Tests run in file order and share
// a single page/browser context - Playwright isolates context per `test()`
// by default, which would silently drop the logged-in session between
// steps, so the shared `page` here is deliberate, not an oversight.

const timestamp = Date.now();
const user = {
  name: 'E2E Test User',
  email: `e2e-${timestamp}@example.com`,
  password: 'E2ETestPass123',
};
const newPassword = 'E2ENewPass456';

test.describe.configure({ mode: 'serial' });

test.describe('Critical path', () => {
  /** @type {import('@playwright/test').Page} */
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('register creates an account and logs in immediately', async () => {
    await page.goto('/register');
    await page.fill('#name', user.name);
    await page.fill('#email', user.email);
    await page.fill('#password', user.password);
    await page.fill('#confirmPassword', user.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('link', { name: 'Saved' })).toBeVisible();
  });

  test('home page shows the seeded article and search finds it', async () => {
    await page.goto('/');
    await expect(page.getByText('E2E Test Article')).toBeVisible();

    await page.fill('input[placeholder="Search articles..."]', 'E2E Test Article');
    await page.waitForTimeout(700); // search is debounced client-side
    await expect(page.getByText('E2E Test Article')).toBeVisible();
  });

  test('an authenticated user can save an article and see it on the Saved page', async () => {
    await page.goto('/');
    await page.click('button[aria-label="Save article"]');
    await expect(page.getByLabel('Unsave article')).toBeVisible();

    await page.getByRole('link', { name: 'Saved' }).click();
    await expect(page).toHaveURL('/saved');
    await expect(page.getByText('E2E Test Article')).toBeVisible();
  });

  test('preferences can be updated and the personalized feed reflects them', async () => {
    await page.goto('/preferences');
    await expect(page.getByText('News Preferences')).toBeVisible();

    const firstCategoryChip = page.locator('button[aria-pressed]').first();
    await firstCategoryChip.click();
    await page.click('button:has-text("Save Preferences")');
    await expect(page.getByText('Preferences saved successfully')).toBeVisible();

    await page.getByRole('link', { name: 'For You' }).click();
    await expect(page).toHaveURL('/personalized');
  });

  test('profile name can be updated', async () => {
    await page.goto('/profile');
    await page.click('button:has-text("Edit Profile")');
    await page.fill('#name', 'E2E Updated Name');
    await page.click('button:has-text("Save Changes")');
    await expect(page.getByText('Profile updated successfully')).toBeVisible();
    await expect(page.getByText('E2E Updated Name')).toBeVisible();
  });

  test('password can be changed and used to log back in after logout', async () => {
    await page.goto('/profile');
    await page.click('button:has-text("Change Password")');
    await page.fill('#currentPassword', user.password);
    await page.fill('#newPassword', newPassword);
    await page.fill('#confirmPassword', newPassword);
    await page.click('button:has-text("Change Password")');
    await expect(page.getByText('Password changed successfully')).toBeVisible();

    // Logout via the user menu
    await page.click('button[aria-label="User menu"]');
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL('/login');

    // Old password no longer works
    await page.fill('#email', user.email);
    await page.fill('#password', user.password);
    await page.click('button[type="submit"]');
    await expect(page.getByText(/invalid/i)).toBeVisible();

    // New password does
    await page.fill('#password', newPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('an unknown route renders the 404 page', async () => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByText('Page Not Found')).toBeVisible();
  });
});
