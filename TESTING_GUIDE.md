# Testing Guide

This project uses **Playwright** for end-to-end (E2E) testing and **GitHub Actions** for continuous integration (CI).

## Local Testing Setup

### Prerequisites
- Node.js 18+ installed
- Project dependencies installed (`npm install`)

### Install Playwright Browsers

```bash
npx playwright install
```

### Run Tests

**Run all tests:**
```bash
npm test
```

**Run tests with UI (interactive):**
```bash
npm run test:ui
```

**Run tests in debug mode:**
```bash
npm run test:debug
```

**Run a specific test file:**
```bash
npx playwright test tests/e2e/checkout.spec.ts
```

**Run tests matching a pattern:**
```bash
npx playwright test --grep "checkout"
```

**Run in a specific browser:**
```bash
npx playwright test --project=chromium
```

### View Test Report

After running tests, open the HTML report:
```bash
npx playwright show-report
```

## Test Structure

Tests are located in `tests/e2e/` and organized by feature:

- **`homepage.spec.ts`** — Tests for homepage navigation and loading
- **`checkout.spec.ts`** — Tests for checkout flow (delivery, payment, review steps)
- **`search.spec.ts`** — Tests for search functionality

## CI/CD Pipeline

The project uses **GitHub Actions** (`.github/workflows/ci.yml`) to automatically run tests on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

### CI Pipeline Steps

1. **Setup Node.js** — Install Node 18
2. **Install dependencies** — Run `npm ci`
3. **Generate Prisma Client** — Required for builds
4. **Lint** — Run ESLint (continues on error)
5. **Build** — Run Next.js build
6. **Install Playwright** — Download browser binaries
7. **Run E2E Tests** — Execute test suite
8. **Upload artifacts** — Save test reports and videos

### GitHub Actions Secrets (Required)

Add these to your GitHub repository settings under **Settings → Secrets and variables → Actions**:

```
NEXTAUTH_SECRET          # Your NextAuth secret key
DATABASE_URL             # MongoDB connection string (optional for CI)
```

Example `.env` values for CI (will be used if secrets not set):
- `NEXTAUTH_SECRET`: auto-generated for CI tests
- `DATABASE_URL`: uses MongoDB Docker service in CI

## Playwright Configuration

See `playwright.config.ts` for configuration:

- **Test directory:** `tests/e2e/`
- **Base URL:** `http://localhost:3000` (local) or from `PLAYWRIGHT_TEST_BASE_URL` env var
- **Browsers:** Chromium, Firefox, WebKit (desktop + mobile)
- **Parallelization:** Disabled on CI (workers: 1), enabled locally
- **Retries:** 2 retries on CI, 0 locally
- **Screenshots:** On failure only
- **Trace:** On first retry (helps debug flaky tests)

## Best Practices

### Writing Tests

1. **Use descriptive test names** — e.g., "should navigate to checkout and fill delivery form"
2. **Test user workflows** — E2E tests should simulate real user interactions
3. **Use meaningful selectors** — Prefer labels, text, and ARIA roles over fragile CSS selectors
4. **Handle async operations** — Use `waitFor` for async content (searches, API calls)
5. **Mock external dependencies** — If needed, intercept network requests in tests

### Example Test Pattern

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/path');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    const element = page.locator('selector');
    
    // Act
    await element.click();
    
    // Assert
    await expect(page.locator('result')).toBeVisible();
  });
});
```

## Debugging Failed Tests

### Run in Debug Mode
```bash
npm run test:debug
```
This opens Playwright Inspector—pause, step through, and inspect DOM.

### View Test Video
Videos are saved in `test-results/` when a test fails locally.

### Check Trace
Traces are saved on first retry—open with:
```bash
npx playwright show-trace trace.zip
```

### Run Single Test
```bash
npx playwright test tests/e2e/checkout.spec.ts:10
```
(runs test on line 10)

## Continuous Improvement

### Add New Tests

1. Create a new file in `tests/e2e/` (e.g., `tests/e2e/auth.spec.ts`)
2. Write tests following the pattern above
3. Run locally: `npm test`
4. Commit and push—CI will run automatically

### Flaky Tests

If a test is unreliable:
1. Increase timeout: `await page.waitForTimeout(5000)`
2. Add explicit waits: `await page.waitForLoadState('networkidle')`
3. Check for timing issues in your app
4. Run test in isolation: `npx playwright test --grep "test name"`

## Troubleshooting

### Tests hang or timeout
- Check if dev server is running: `npm run dev`
- Increase timeout in `playwright.config.ts` or test: `test.setTimeout(60000)`

### Browser not found
- Reinstall browsers: `npx playwright install`

### Selectors not working
- Use Playwright Inspector: `npm run test:debug`
- Click on page to highlight and select elements

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-test)
