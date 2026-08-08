import { test, expect } from "@playwright/test"

test.describe("Donation Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/donate")
  })

  test("displays donation page with all required elements", async ({ page }) => {
    // Check hero section
    await expect(page.getByRole("heading", { name: /FUND THE WAR ON DISEASE/i })).toBeVisible()

    // Check donation type buttons
    await expect(page.getByRole("button", { name: /ONE-TIME/i })).toBeVisible()
    await expect(page.getByRole("button", { name: "MONTHLY", exact: true })).toBeVisible()

    // Check amount buttons
    await expect(page.getByRole("button", { name: "$1", exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "$25", exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "$100", exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "$250", exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "$1000", exact: true })).toBeVisible()

    // Check form fields
    await expect(page.getByPlaceholder("John Doe")).toBeVisible()
    await expect(page.getByPlaceholder("john@example.com")).toBeVisible()

    // Check submit button
    await expect(page.getByRole("button", { name: /DONATE/i })).toBeVisible()
  })

  test("validates required fields", async ({ page }) => {
    // Try to submit without filling form
    await page.getByRole("button", { name: /DONATE \$25 MONTHLY/i }).click()

    // Should show validation error
    await expect(page.getByText(/Please enter your name/i)).toBeVisible()
  })

  test("validates email format", async ({ page }) => {
    await page.getByPlaceholder("John Doe").fill("Test User")
    await page.getByPlaceholder("john@example.com").fill("invalid-email")
    await page.getByRole("button", { name: "$100", exact: true }).click()
    await page.getByRole("button", { name: /DONATE/i }).click()

    await expect(page.getByText(/valid email/i)).toBeVisible()
  })

  test("switches between one-time and monthly donation", async ({ page }) => {
    // Default is monthly
    const monthlyButton = page.getByRole("button", { name: /MONTHLY/i }).first()
    await expect(monthlyButton).toHaveClass(/bg-brutal-pink/)

    // Switch to one-time
    await page.getByRole("button", { name: /ONE-TIME/i }).click()

    // Verify button text changes
    await expect(page.getByRole("button", { name: /DONATE \$25 NOW/i })).toBeVisible()
  })

  test("updates the submit button when selecting a preset amount", async ({ page }) => {
    await page.getByRole("button", { name: "$250", exact: true }).click()

    await expect(page.getByRole("button", { name: /DONATE \$250 MONTHLY/i })).toBeVisible()
  })

  test("shows cancellation message when returning from cancelled checkout", async ({ page }) => {
    await page.goto("/donate?canceled=true")

    await expect(page.getByText(/Donation cancelled/i)).toBeVisible()
  })

  test("opens Stripe payment link with donor details", async ({ page }) => {
    await page.route("https://buy.stripe.com/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html><body>Stripe checkout</body></html>",
      })
    })

    await page.getByPlaceholder("John Doe").fill("Test User")
    await page.getByPlaceholder("john@example.com").fill("test@example.com")

    await Promise.all([
      page.waitForURL(/https:\/\/buy\.stripe\.com\/.*prefilled_email=test%40example\.com/),
      page.getByRole("button", { name: /DONATE \$25 MONTHLY/i }).click(),
    ])

    expect(page.url()).toContain("client_reference_id=Test+User")
  })

  test.describe("Stripe Integration (requires test mode)", () => {
    test.skip("completes donation with test card", async ({ page }) => {
      // This test requires Stripe test mode to be configured
      // Run with: STRIPE_SECRET_KEY=sk_test_... pnpm test:e2e

      await page.getByPlaceholder("John Doe").fill("E2E Test User")
      await page.getByPlaceholder("john@example.com").fill("test@example.com")
      await page.getByRole("button", { name: "$25" }).click()
      await page.getByRole("button", { name: /DONATE/i }).click()

      // Should redirect to Stripe Checkout
      await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 10000 })

      // Fill Stripe test card (Stripe's test UI)
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 10000 })

      // Note: Actual Stripe form filling would require more complex iframe handling
      // This is a placeholder for the full integration test
    })
  })
})

test.describe("Donation Success Page", () => {
  test("shows success page with session details", async ({ page }) => {
    // Mock the session API
    await page.route("/api/stripe/session*", async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: "cs_test_123",
          amount_total: 10000,
          currency: "usd",
          customer_email: "test@example.com",
          payment_status: "paid",
          mode: "payment",
          metadata: {
            amount: "100",
            donationType: "one-time",
          },
        }),
      })
    })

    await page.goto("/donate/success?session_id=cs_test_123")

    // Should show success message
    await expect(page.getByText(/THANK YOU/i)).toBeVisible()
    await expect(page.getByText(/\$100/i)).toBeVisible()
  })
})
