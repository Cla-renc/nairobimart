import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage with navbar', async ({ page }) => {
    // Check navbar is visible
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should have search box on navbar', async ({ page }) => {
    // Look for search input
    const searchBox = page.locator('input[placeholder*="Search"]').first();
    await expect(searchBox).toBeVisible();
  });

  test('should navigate to products page', async ({ page }) => {
    // Click on products link (adjust selector based on your navbar)
    const productsLink = page.locator('a:has-text("Products")').first();
    if (await productsLink.isVisible()) {
      await productsLink.click();
      await expect(page).toHaveURL(/.*products/);
    }
  });

  test('should load without critical errors', async ({ page }) => {
    // Check no console errors
    let hasError = false;
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Page error:', msg.text());
        hasError = true;
      }
    });
    // Wait a moment for any errors
    await page.waitForTimeout(2000);
    expect(hasError).toBeFalsy();
  });
});
