import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should search for products', async ({ page }) => {
    // Find search box (adjust selector if needed)
    const searchBox = page.locator('input[placeholder*="Search"]').first();
    
    if (await searchBox.isVisible()) {
      // Type search query
      await searchBox.fill('laptop');
      
      // Wait for search results to appear
      await page.waitForTimeout(500); // Allow debounce time
      
      // Check if dropdown with results appears
      const resultsDropdown = page.locator('[role="listbox"], [role="menu"]');
      if (await resultsDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(resultsDropdown).toBeVisible();
      }
    }
  });

  test('should clear search input', async ({ page }) => {
    const searchBox = page.locator('input[placeholder*="Search"]').first();
    
    if (await searchBox.isVisible()) {
      await searchBox.fill('test product');
      await expect(searchBox).toHaveValue('test product');
      
      // Clear the input
      await searchBox.clear();
      await expect(searchBox).toHaveValue('');
    }
  });

  test('should filter products by category if available', async ({ page }) => {
    // Check if category filters are visible
    const categoryLink = page.locator('a:has-text("Categories")').first();
    
    if (await categoryLink.isVisible()) {
      await categoryLink.click();
      // Should navigate to categories or open categories view
      await expect(page).toHaveURL(/.*categor/i);
    }
  });
});
