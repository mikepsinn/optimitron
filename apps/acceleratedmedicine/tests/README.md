# Testing Guide

## Overview

This project uses **Vitest** for unit/integration tests and **Playwright** for E2E tests.

## Running Tests

### Unit Tests (Vitest)
```bash
# Run all unit tests
pnpm test

# Run in watch mode
pnpm test:watch

# Run with UI
pnpm test:ui

# Run with coverage
pnpm test:coverage
```

### E2E Tests (Playwright)
```bash
# Run all E2E tests
pnpm test:e2e

# Run with UI mode (interactive)
pnpm test:e2e:ui

# Run in debug mode
pnpm test:e2e:debug
```

## Test Structure

```
tests/
├── setup.ts                    # Vitest setup (mocks, global config)
├── fixtures/
│   └── stripe.ts              # Mock Stripe data (test cards, sessions, etc.)
└── e2e/
    └── donate.spec.ts         # E2E donation flow tests

app/api/stripe/webhook/
└── route.test.ts              # Webhook handler unit tests
```

## Writing Tests

### Unit Tests Example

```typescript
import { describe, it, expect, vi } from 'vitest'

describe('MyComponent', () => {
  it('should do something', () => {
    expect(true).toBe(true)
  })
})
```

### E2E Tests Example

```typescript
import { test, expect } from '@playwright/test'

test('user can complete flow', async ({ page }) => {
  await page.goto('/donate')
  await expect(page.getByText('DONATE')).toBeVisible()
})
```

## Stripe Testing

### Test Cards (from Stripe)
- **Success**: `4242424242424242`
- **Decline**: `4000000000000002`
- **Requires Auth**: `4000002500003155`

### Test Mode
All tests use Stripe test mode with mock data. Real API calls are mocked using fixtures.

## Testing Webhooks Locally

```bash
# Terminal 1: Start dev server
pnpm dev

# Terminal 2: Listen to Stripe webhooks
pnpm stripe:listen

# Terminal 3: Trigger test events
stripe trigger checkout.session.completed
```

## Debugging Tests

### Vitest
- Use `test.only()` to run a single test
- Use `vi.mock()` to mock modules
- Check `tests/setup.ts` for global mocks

### Playwright
- Use `test.only()` to run a single test
- Use `--debug` flag for step-by-step execution
- Use `--ui` flag for interactive debugging
- Screenshots/videos saved to `test-results/` on failure

## CI/CD

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Before deployment

## Common Issues

### "Cannot find module"
- Run `pnpm install` to ensure all dependencies are installed
- Check path aliases in `vitest.config.ts`

### "Stripe webhook tests failing"
- Verify `STRIPE_WEBHOOK_SECRET` is set in `tests/setup.ts`
- Check mock data in `tests/fixtures/stripe.ts`

### "E2E tests timeout"
- Increase timeout in `playwright.config.ts`
- Check that dev server is running (`pnpm dev`)
