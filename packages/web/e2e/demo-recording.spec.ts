/**
 * Playwright E2E: Demo recording for PL Genesis Hackathon.
 *
 * Records a 1920x1080 video walking through the site in demo-script order.
 * Includes full Wishocracy pairwise comparison flow.
 *
 * Run:
 *   pnpm --filter @optimitron/web exec playwright test e2e/demo-recording.spec.ts
 *
 * Output: packages/web/test-results/ (video files)
 */
import { test, expect } from "@playwright/test";

const SECTION_PAUSE = 3_000; // breathing room between sections

async function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Navigate and wait for CSS, fonts, and images to fully load */
async function navigateTo(
  page: import("@playwright/test").Page,
  path: string,
) {
  await page.goto(path, { waitUntil: "networkidle" });
  await page.waitForLoadState("load");
  await page.evaluate(() => document.fonts.ready);
  await pause(1500);
}

/**
 * Set the range slider using Playwright's fill() which triggers React onChange.
 */
async function setSlider(
  page: import("@playwright/test").Page,
  value: number,
) {
  const slider = page.locator('input[type="range"]');
  await slider.waitFor({ state: "visible" });

  // Playwright's fill() on range inputs sets the value and fires all necessary events
  await slider.fill(String(value));
  await pause(600);
}

// How many categories to fund (more = more pairwise comparisons)
// 5 categories = 10 pairs, which is a good demo length
const CATEGORIES_TO_FUND = 5;
// Total budget categories in the system
const TOTAL_CATEGORIES = 17;

test("full demo walkthrough", async ({ page }) => {
  test.setTimeout(600_000); // 10 min total (wishocracy interactions take time)

  // ─── Section 1: Hook — Homepage hero (15s) ───
  await navigateTo(page, "/");
  await expect(page.locator("h1")).toBeVisible();
  await pause(2000);

  // Slow scroll down to reveal the hero
  await page.evaluate(() =>
    window.scrollTo({ top: 400, behavior: "smooth" }),
  );
  await pause(3000);
  await page.evaluate(() =>
    window.scrollTo({ top: 800, behavior: "smooth" }),
  );
  await pause(3000);

  // Scroll to the urgency stats
  await page.evaluate(() =>
    window.scrollTo({ top: 1400, behavior: "smooth" }),
  );
  await pause(4000);
  await pause(SECTION_PAUSE);

  // ─── Section 2: Wishocracy — Full allocation flow (60s+) ───
  await navigateTo(page, "/wishocracy");
  await pause(2000);

  // Step 2a: Click "LET'S GO" on the intro card
  const letsGoButton = page.getByRole("button", { name: /LET'S GO/i });
  await expect(letsGoButton).toBeVisible();
  await pause(1500);
  await letsGoButton.click();
  await pause(1500);

  // Step 2b: Category selection — fund the first N, skip the rest
  // Categories appear one at a time with 300ms animation between each.
  for (let i = 0; i < TOTAL_CATEGORIES; i++) {
    if (i < CATEGORIES_TO_FUND) {
      // Fund this category — click "More Than $0"
      const fundButton = page.getByRole("button", {
        name: /More Than \$0/i,
      });
      await expect(fundButton).toBeVisible({ timeout: 5000 });
      await pause(600);
      await fundButton.click();
    } else {
      // Skip this category — click "$0"
      // The button text is exactly "$0" — use exact text match
      const skipButton = page.locator(
        'button:has-text("$0"):not(:has-text("More"))',
      );
      await expect(skipButton).toBeVisible({ timeout: 5000 });
      await pause(400);
      await skipButton.click();
    }
    // Wait for animation to complete (300ms setTimeout + 300ms framer motion)
    await pause(700);
  }

  // Wait for completion card with animation
  await pause(2000);
  const startComparingButton = page.getByRole("button", {
    name: /Start Comparing/i,
  });
  await expect(startComparingButton).toBeVisible({ timeout: 10000 });
  await pause(1500);
  await startComparingButton.click();
  await pause(2000);

  // Step 2c: Pairwise comparisons
  // With 5 funded categories, we get C(5,2) = 10 pairs
  const totalPairs = (CATEGORIES_TO_FUND * (CATEGORIES_TO_FUND - 1)) / 2;

  // Slider allocations for visual variety — alternate between favoring left/right
  const sliderValues = [30, 70, 25, 60, 45, 75, 35, 55, 40, 65];

  for (let pairIndex = 0; pairIndex < totalPairs; pairIndex++) {
    // Wait for the slider to appear
    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible({ timeout: 5000 });
    await pause(1000);

    // Set the slider to a varied position
    const targetValue = sliderValues[pairIndex % sliderValues.length]!;
    await setSlider(page, targetValue);
    await pause(800);

    // Click "SUBMIT CHOICE"
    const submitButton = page.getByRole("button", {
      name: /SUBMIT CHOICE/i,
    });
    await expect(submitButton).toBeVisible({ timeout: 5000 });
    await pause(500);
    await submitButton.click();
    await pause(1200);
  }

  // Step 2d: Completion — show the results
  await pause(3000);

  // Scroll to the allocation results
  const allocationCard = page.locator("[data-complete-list]");
  if ((await allocationCard.count()) > 0) {
    await allocationCard.scrollIntoViewIfNeeded();
    await pause(4000);
  }

  // Look for "View Full Allocation" button
  const viewAllocation = page.getByRole("button", {
    name: /View Full Allocation/i,
  });
  if ((await viewAllocation.count()) > 0) {
    await viewAllocation.click();
    await pause(4000);
  }

  // Look for IPFS badge on completion
  const ipfsBadge = page
    .locator('text="Content-addressed on IPFS"')
    .or(page.locator('text="Storacha"'));
  if ((await ipfsBadge.count()) > 0) {
    await ipfsBadge.first().scrollIntoViewIfNeeded();
    await pause(3000);
  }
  await pause(SECTION_PAUSE);

  // ─── Section 3: Alignment — Politician Report Cards (20s) ───
  await navigateTo(page, "/alignment");
  await pause(2000);
  await page.evaluate(() =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );
  await pause(3000);

  // Scroll through ranked politicians
  await page.evaluate(() =>
    window.scrollTo({ top: 500, behavior: "smooth" }),
  );
  await pause(3000);

  // Look for "Verified on IPFS" badge
  const verifiedBadge = page.locator('text="Verified on IPFS"');
  if ((await verifiedBadge.count()) > 0) {
    await verifiedBadge.first().scrollIntoViewIfNeeded();
    await pause(2000);
    await verifiedBadge.first().hover();
    await pause(2000);
  }

  await page.evaluate(() =>
    window.scrollTo({ top: 1000, behavior: "smooth" }),
  );
  await pause(3000);
  await pause(SECTION_PAUSE);

  // ─── Section 4: Hypercerts — Verifiable Attestations (25s) ───
  await navigateTo(page, "/transparency");
  await pause(2000);

  // Show the pipeline
  await page.evaluate(() =>
    window.scrollTo({ top: 300, behavior: "smooth" }),
  );
  await pause(3000);

  // Scroll to attestation records grid
  await page.evaluate(() =>
    window.scrollTo({ top: 900, behavior: "smooth" }),
  );
  await pause(4000);

  // Find and highlight IPFS CID links
  const cidLinks = page.locator('a[href*="ipfs.storacha.link"]');
  if ((await cidLinks.count()) > 0) {
    await cidLinks.first().scrollIntoViewIfNeeded();
    await pause(2000);
    await cidLinks.first().hover();
    await pause(2000);
  }

  // Scroll to preference snapshot
  await page.evaluate(() =>
    window.scrollTo({ top: 1400, behavior: "smooth" }),
  );
  await pause(3000);
  await pause(SECTION_PAUSE);

  // ─── Section 5: Earth Optimization Prize (20s) ───
  await navigateTo(page, "/prize");
  await pause(2000);

  // Show the mechanism steps
  await page.evaluate(() =>
    window.scrollTo({ top: 400, behavior: "smooth" }),
  );
  await pause(3000);
  await page.evaluate(() =>
    window.scrollTo({ top: 900, behavior: "smooth" }),
  );
  await pause(3000);

  // Show donation/wallet section
  await page.evaluate(() =>
    window.scrollTo({ top: 1400, behavior: "smooth" }),
  );
  await pause(3000);

  // Show the Three Mechanisms section
  const threeMechanisms = page.locator(
    'text="Three Mechanisms. One System."',
  );
  if ((await threeMechanisms.count()) > 0) {
    await threeMechanisms.scrollIntoViewIfNeeded();
    await pause(4000);
  }

  // Show pool status
  const poolStatus = page.locator('text="Pool Status"');
  if ((await poolStatus.count()) > 0) {
    await poolStatus.scrollIntoViewIfNeeded();
    await pause(3000);
  }
  await pause(SECTION_PAUSE);

  // ─── Section 6: $WISH Token + IAB (25s) ───
  await navigateTo(page, "/transparency");
  await pause(1000);

  // Scroll to $WISH Token & UBI section
  const wishSection = page.locator('text="$WISH Token & UBI"');
  if ((await wishSection.count()) > 0) {
    await wishSection.scrollIntoViewIfNeeded();
    await pause(4000);
  }

  // Scroll through mechanism cards
  await page.evaluate(() =>
    window.scrollTo({ top: 2000, behavior: "smooth" }),
  );
  await pause(4000);

  // Show technology stack
  const techStack = page.locator('text="Technology Stack"');
  if ((await techStack.count()) > 0) {
    await techStack.scrollIntoViewIfNeeded();
    await pause(3000);
  }
  await pause(SECTION_PAUSE);

  // ─── Section 7: Architecture (15s) ───
  await navigateTo(page, "/about");
  await pause(1000);
  await page.evaluate(() =>
    window.scrollTo({ top: 400, behavior: "smooth" }),
  );
  await pause(2000);
  await page.evaluate(() =>
    window.scrollTo({ top: 1000, behavior: "smooth" }),
  );
  await pause(2000);

  const economicSystem = page.locator('text="The Economic System"');
  if ((await economicSystem.count()) > 0) {
    await economicSystem.scrollIntoViewIfNeeded();
    await pause(3000);
  }

  const research = page.locator('text="Research"');
  if ((await research.count()) > 0) {
    await research.scrollIntoViewIfNeeded();
    await pause(3000);
  }
  await pause(SECTION_PAUSE);

  // ─── Section 8: Close (15s) ───
  await navigateTo(page, "/");
  await pause(2000);
  await expect(page.locator("h1")).toBeVisible();
  await pause(3000);

  // Final scroll to economic system section on homepage
  const diagnosisFree = page
    .locator('text="Diagnosis Is Free"')
    .or(page.locator('text="Funding Isn"'));
  if ((await diagnosisFree.count()) > 0) {
    await diagnosisFree.first().scrollIntoViewIfNeeded();
    await pause(4000);
  }

  // End on the hero
  await page.evaluate(() =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );
  await pause(4000);
});
