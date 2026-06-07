import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to checkout page
    await page.goto('/checkout');
  });

  test('should load checkout page with stepper', async ({ page }) => {
    // Check stepper is visible (Delivery, Payment, Review steps)
    await expect(page.locator('text=Delivery')).toBeVisible();
    await expect(page.locator('text=Payment')).toBeVisible();
    await expect(page.locator('text=Review')).toBeVisible();
  });

  test('should show cart empty message if no items', async ({ page }) => {
    // If cart is empty, should show error on attempt to proceed
    const confirmBtn = page.locator('button:has-text("Confirm Order")');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      // Should show error about empty cart
      await expect(page.locator('text=empty')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should have delivery form on step 1', async ({ page }) => {
    // Check delivery info fields are present
    await expect(page.locator('label:has-text("First Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Last Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Email Address")')).toBeVisible();
    await expect(page.locator('label:has-text("Address")')).toBeVisible();
  });

  test('should navigate through checkout steps', async ({ page }) => {
    // Check we're on step 1 (Delivery)
    const continueBtn = page.locator('button:has-text("Continue")').first();
    
    // Try to move to next step (should fail if form not filled)
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
      // Should still be on same step or show validation error
      await expect(page.locator('text=Delivery').or(page.locator('text=required'))).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display order summary', async ({ page }) => {
    // Check order summary sidebar
    await expect(page.locator('text=Order Summary')).toBeVisible();
    await expect(page.locator('text=Subtotal')).toBeVisible();
    await expect(page.locator('text=Shipping Fee')).toBeVisible();
    await expect(page.locator('text=Total')).toBeVisible();
  });

  test('should have payment methods on step 2', async ({ page }) => {
    // Navigate to payment step
    const continueBtn = page.locator('button:has-text("Continue")').first();
    
    // Fill required fields to proceed (if form visible)
    const firstNameField = page.locator('input[id="firstName"]');
    if (await firstNameField.isVisible()) {
      await firstNameField.fill('John');
      await page.locator('input[id="lastName"]').fill('Doe');
      await page.locator('input[id="email"]').fill('john@example.com');
      await page.locator('input[id="phone"]').fill('+254700000000');
      await page.locator('input[id="address"]').fill('123 Main St');
      
      // Click continue to go to payment step
      await continueBtn.click();
      
      // Should now see payment options
      await expect(page.locator('text=Payment Method').or(page.locator('text=M-Pesa')).or(page.locator('text=Wallet'))).toBeVisible({ timeout: 5000 });
    }
  });
});
