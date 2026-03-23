/**
 * Playwright E2E: Wishocracy allocation flow with budget review.
 *
 * Validates the full user journey:
 *   1. Intro card → "LET'S GO"
 *   2. Category selection (fund some, skip some)
 *   3. Pairwise slider comparisons
 *   4. Completion card with top priorities
 *   5. Full budget allocation bars with YOU / AVG / GOVT breakdown
 *
 * Takes screenshots at each step for visual review.
 *
 * Run:
 *   pnpm --filter @optimitron/web exec playwright test e2e/wishocracy-allocation.spec.ts
 */
import { test, expect } from "@playwright/test";
import path from "path";

const SCREENSHOT_DIR = path.resolve(
  __dirname,
  "../public/img/screenshots/wishocracy-allocation",
);

// Fund 4 categories → C(4,2) = 6 pairwise comparisons (fast but meaningful)
const CATEGORIES_TO_FUND = 4;
const TOTAL_CATEGORIES = 18;

async function screenshot(
  page: import("@playwright/test").Page,
  name: string,
) {
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: false,
  });
}

async function screenshotFullPage(
  page: import("@playwright/test").Page,
  name: string,
) {
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: true,
  });
}

test.describe("Wishocracy allocation flow", () => {
  test.setTimeout(180_000); // 3 min max

  test("complete flow: intro → categories → comparisons → budget review", async ({
    page,
  }) => {
    // ─── Step 1: Navigate to /wishocracy ───
    const response = await page.goto("/wishocracy", {
      waitUntil: "networkidle",
    });
    if ((response?.status() ?? 0) >= 500) {
      test.skip(true, "Server returned 500 — needs database or build");
      return;
    }

    // ─── Step 2: Intro card ───
    // The intro card includes the "why" context (politicians vs wishocracy)
    // and the LET'S GO button. Everything collapses when the user starts.
    const letsGoButton = page.getByRole("button", { name: /LET.S GO/i });
    await expect(letsGoButton).toBeVisible({ timeout: 15_000 });

    // Verify intro content — politicians comparison is now part of the intro
    await expect(
      page.locator("h1", { hasText: /Wishocracy/i }),
    ).toBeVisible();
    await expect(
      page.locator("text=/What Politicians Actually Do/i"),
    ).toBeVisible();
    await expect(
      page.locator("text=/What Wishocracy Does Instead/i"),
    ).toBeVisible();

    await screenshot(page, "01-intro-card");

    await letsGoButton.click();

    // ─── Step 3: Category selection ───
    // Wait for first category card to appear
    const fundButton = page.getByRole("button", { name: /More Than \$0/i });
    await expect(fundButton).toBeVisible({ timeout: 10_000 });

    await screenshot(page, "02-category-selection-first");

    // Fund the first N categories, skip the rest
    for (let i = 0; i < TOTAL_CATEGORIES; i++) {
      if (i < CATEGORIES_TO_FUND) {
        const fund = page.getByRole("button", { name: /More Than \$0/i });
        await expect(fund).toBeVisible({ timeout: 8_000 });

        // Screenshot the 2nd funded category for variety
        if (i === 1) {
          await screenshot(page, "03-category-selection-mid");
        }

        await fund.click();
      } else {
        // The "$0" button — get the first visible button with exact "$0" text
        // excluding the "More Than $0" button
        const skip = page.getByRole("button", { name: "$0", exact: true });
        await expect(skip).toBeVisible({ timeout: 8_000 });
        await skip.click();
      }
      // Wait for animation (300ms framer motion + 300ms setTimeout)
      await page.waitForTimeout(1_000);
    }

    // ─── Step 4: Category selection complete → "Start Comparing" ───
    const startComparingButton = page.getByRole("button", {
      name: /Start Comparing/i,
    });
    await expect(startComparingButton).toBeVisible({ timeout: 15_000 });

    // Verify it shows the right count (text is uppercase in the UI)
    await expect(
      page.locator(`text=/${CATEGORIES_TO_FUND} Categories Selected/i`),
    ).toBeVisible();

    await screenshot(page, "04-categories-complete");

    await startComparingButton.click();
    await page.waitForTimeout(500);

    // ─── Step 5: Pairwise comparisons ───
    const totalPairs = (CATEGORIES_TO_FUND * (CATEGORIES_TO_FUND - 1)) / 2; // C(4,2) = 6

    // Varied slider positions for realistic budget distribution
    const sliderValues = [30, 65, 45, 70, 25, 55];

    for (let pairIndex = 0; pairIndex < totalPairs; pairIndex++) {
      // Wait for slider to appear
      const slider = page.locator('input[type="range"]');
      await expect(slider).toBeVisible({ timeout: 5_000 });

      // Wait for hand hint animation to finish before interacting
      await page.waitForTimeout(3_000);

      // Set slider value
      const targetValue = sliderValues[pairIndex % sliderValues.length]!;
      await slider.fill(String(targetValue));
      await page.waitForTimeout(300);

      // Screenshot first and last comparison
      if (pairIndex === 0) {
        await screenshot(page, "05-pairwise-first");
      }
      if (pairIndex === totalPairs - 1) {
        await screenshot(page, "06-pairwise-last");
      }

      // Submit
      const submitButton = page.getByRole("button", {
        name: /SUBMIT CHOICE/i,
      });
      await expect(submitButton).toBeVisible({ timeout: 5_000 });
      await submitButton.click();
      await page.waitForTimeout(800);
    }

    // ─── Step 6: Completion card ───
    await expect(page.locator('text="Well Done"')).toBeVisible({
      timeout: 10_000,
    });

    // Verify top priorities are shown
    const topPrioritiesHeading = page.locator('text="Your Top Priorities"');
    await expect(topPrioritiesHeading).toBeVisible();

    // Verify "View Full Allocation" button exists
    const viewFullAllocation = page.getByRole("button", {
      name: /View Full Allocation/i,
    });
    await expect(viewFullAllocation).toBeVisible();

    await screenshot(page, "07-completion-card");

    // ─── Step 7: Budget allocation bars ───
    // Click "View Full Allocation" to scroll to the bars
    await viewFullAllocation.click();
    await page.waitForTimeout(1_000);

    // Verify the allocation card is visible
    const allocationCard = page.locator("[data-complete-list]");
    await expect(allocationCard).toBeVisible({ timeout: 5_000 });

    // Verify "Your Budget Allocation" heading
    await expect(
      page.locator('text="Your Budget Allocation"'),
    ).toBeVisible();

    // Verify allocation bars show percentages with "YOU" label
    const youLabels = page.locator('text=/\\d+\\.\\d+% YOU/');
    const youCount = await youLabels.count();
    expect(youCount).toBeGreaterThanOrEqual(CATEGORIES_TO_FUND);

    // Verify government comparison bars exist
    const govLabels = page.locator('text=/\\d+\\.\\d+% GOVT/');
    const govCount = await govLabels.count();
    expect(govCount).toBeGreaterThanOrEqual(CATEGORIES_TO_FUND);

    // Verify the legend is present
    await expect(page.locator('text="Your Priorities"').first()).toBeVisible();
    await expect(page.locator('text="Gov Spending"')).toBeVisible();

    // Verify sort button works
    const sortButton = page.getByRole("button", {
      name: /Sort by: Your Priorities/i,
    });
    await expect(sortButton).toBeVisible();

    await screenshot(page, "08-budget-allocation-bars");

    // Screenshot the full allocation view
    await screenshotFullPage(page, "09-budget-full-page");

    // ─── Step 8: Test sort toggle ───
    await sortButton.click();
    await page.waitForTimeout(500);

    // Now it should say "Community Average"
    await expect(
      page.getByRole("button", { name: /Sort by: Community Average/i }),
    ).toBeVisible();

    await screenshot(page, "10-budget-sorted-by-average");

    // Toggle again to gov spending
    await page
      .getByRole("button", { name: /Sort by: Community Average/i })
      .click();
    await page.waitForTimeout(500);

    await expect(
      page.getByRole("button", { name: /Sort by: Gov Spending/i }),
    ).toBeVisible();

    await screenshot(page, "11-budget-sorted-by-gov");

    // ─── Step 9: Test search filter ───
    const searchInput = page.locator('input[placeholder="Search programs..."]');
    await expect(searchInput).toBeVisible();
    await searchInput.scrollIntoViewIfNeeded();
    await searchInput.fill("health");
    await page.waitForTimeout(500);

    await screenshot(page, "12-budget-search-filtered");

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(300);

    // ─── Step 10: Verify "Sign In to Save Results" for unauthenticated ───
    const signInButton = page.getByRole("button", {
      name: /Sign In to Save Results/i,
    });
    if ((await signInButton.count()) > 0) {
      await expect(signInButton).toBeVisible();
    }

    // ─── Step 11: Reset button exists ───
    const resetButton = page.locator('text="Reset"').or(
      page.getByRole("button", { name: /Reset|Start Over/i }),
    );
    if ((await resetButton.count()) > 0) {
      await resetButton.first().scrollIntoViewIfNeeded();
      await screenshot(page, "13-reset-button");
    }
  });
});
