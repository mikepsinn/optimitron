/**
 * Playwright E2E: Demo recording for PL Genesis Hackathon.
 *
 * Narrative: "Your government is a misaligned superintelligence.
 * Here's the alignment software."
 *
 * Records a 1920x1080 video walking through the full narrative arc:
 *   1. Hook — homepage hero
 *   2. The numbers — Invisible Graveyard, $604 war vs $1 cures
 *   3. The 1% Treaty — One Percent Treaty section
 *   4. Wishocracy — pairwise allocation flow (full)
 *   5. Alignment — politician report cards
 *   6. Misconceptions — myth vs data
 *   7. Compare — country outcomes
 *   8. Transparency — Hypercerts / IPFS attestations
 *   9. Prize Pool — dominant assurance contract
 *  10. IAB — Incentive Alignment Bonds
 *  11. Close — homepage hero
 *
 * Run:
 *   BASE_URL=http://localhost:3001 pnpm --filter @optomitron/web exec playwright test e2e/demo-recording.spec.ts --project=demo-recording
 *
 * Output: packages/web/test-results/ (video files)
 */

import { test, expect, type Page } from "@playwright/test";

// ─── Timing constants ────────────────────────────────────────────────────────
const SECTION_PAUSE = 2_500; // breathing room between sections
const SCROLL_PAUSE = 1_800;  // after a scroll
const BEAT_PAUSE = 1_200;    // short beat inside a section

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Navigate and wait for fonts + images to fully settle */
async function go(page: Page, path: string, extraMs = 1500) {
  await page.goto(path, { waitUntil: "networkidle" });
  await page.waitForLoadState("load");
  await page.evaluate(() => document.fonts.ready);
  await pause(extraMs);
}

/** Smooth-scroll to an absolute Y position */
async function scrollTo(page: Page, y: number, waitMs = SCROLL_PAUSE) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "smooth" }), y);
  await pause(waitMs);
}

/** Scroll until a text string is in view; safe (no-op if not found) */
async function scrollToText(page: Page, text: string, waitMs = SCROLL_PAUSE) {
  const el = page.locator(`text="${text}"`).first();
  if ((await el.count()) > 0) {
    await el.scrollIntoViewIfNeeded();
    await pause(waitMs);
  }
}

/** Scroll until a locator is in view; safe no-op if not found */
async function scrollToLocator(page: Page, locator: import("@playwright/test").Locator, waitMs = SCROLL_PAUSE) {
  if ((await locator.count()) > 0) {
    await locator.first().scrollIntoViewIfNeeded();
    await pause(waitMs);
  }
}

/** Set a range slider via fill() which triggers React onChange */
async function setSlider(page: Page, value: number) {
  const slider = page.locator('input[type="range"]');
  await slider.waitFor({ state: "visible" });
  await slider.fill(String(value));
  await pause(600);
}

// ─── Demo constants ───────────────────────────────────────────────────────────
const CATEGORIES_TO_FUND = 5;   // first N categories get funded (C(5,2)=10 pairs)
const TOTAL_CATEGORIES = 17;    // total budget categories in the system

// Slider values for visual variety across the 10 pairs
const SLIDER_VALUES = [30, 70, 25, 60, 45, 75, 35, 55, 40, 65];

// ─── Test ─────────────────────────────────────────────────────────────────────

test("full demo walkthrough", async ({ page }) => {
  test.setTimeout(720_000); // 12 min ceiling

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 1 — Hook: Homepage Hero
  // "Your government is a misaligned superintelligence."
  // ══════════════════════════════════════════════════════════════════════════
  await go(page, "/");
  await expect(page.locator("h1").first()).toBeVisible();
  await pause(2_000);

  // Slow hero scroll — let the animations fire
  await scrollTo(page, 400);
  await scrollTo(page, 900);
  await scrollTo(page, 1_500);
  await pause(SECTION_PAUSE);

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 2 — The Numbers: Political Dysfunction Tax + Invisible Graveyard
  // "$604 on war for every $1 on cures. 150,000 dead per day."
  // ══════════════════════════════════════════════════════════════════════════
  await scrollToText(page, "The Political Dysfunction Tax");
  await scrollToText(page, "The Invisible Graveyard");
  await scrollTo(page, await page.evaluate(() => {
    const el = document.querySelector('h2');
    return el ? el.getBoundingClientRect().top + window.scrollY - 100 : window.scrollY + 400;
  }));

  // Scroll through the graveyard stats cards
  const graveyardSection = page.locator("text=The Invisible Graveyard").first();
  if ((await graveyardSection.count()) > 0) {
    await graveyardSection.scrollIntoViewIfNeeded();
    await pause(BEAT_PAUSE);
    // Scroll down through the four stat cards
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy({ top: 250, behavior: "smooth" }));
      await pause(1_000);
    }
  }
  await pause(SECTION_PAUSE);

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 3 — War vs Cures Chart
  // "22X more on war than curing all diseases combined"
  // ══════════════════════════════════════════════════════════════════════════
  await scrollToText(page, "Your species spends");
  // Let the big number animation play
  await pause(2_500);
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: "smooth" }));
  await pause(BEAT_PAUSE);
  await pause(SECTION_PAUSE);

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 4 — The 1% Treaty
  // "Redirect 1% of the murder budget. 443 years → 36 years."
  // ══════════════════════════════════════════════════════════════════════════
  await scrollToText(page, "The 1% Treaty");
  await page.evaluate(() => window.scrollBy({ top: 200, behavior: "smooth" }));
  await pause(2_000);
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: "smooth" }));
  await pause(2_000);
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: "smooth" }));
  await pause(SECTION_PAUSE);

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 5 — Misconceptions: Myth vs Data
  // "What your species believes vs what the spreadsheet says"
  // ══════════════════════════════════════════════════════════════════════════
  await go(page, "/misconceptions");
  await pause(BEAT_PAUSE);

  // Show the summary header
  await scrollTo(page, 0);
  await pause(BEAT_PAUSE);

  // Scroll through a few myth cards
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => window.scrollBy({ top: 300, behavior: "smooth" }));
    await pause(900);
  }

  // Hover over a grade-F card for emphasis
  const gradeF = page.locator('text="F"').first();
  if ((await gradeF.count()) > 0) {
    await gradeF.scrollIntoViewIfNeeded();
    await gradeF.hover();
    await pause(1_500);
  }
  await pause(SECTION_PAUSE);

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 6 — Compare: Country Outcomes
  // "Which countries are winning, and why"
  // ══════════════════════════════════════════════════════════════════════════
  await go(page, "/compare");
  await pause(BEAT_PAUSE);
  await scrollTo(page, 0);

  // Scroll through the health data table
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollBy({ top: 400, behavior: "smooth" }));
    await pause(1_000);
  }

  // Toggle between health/drug tabs if they exist
  const drugTab = page.getByRole("button", { name: /drug/i });
  if ((await drugTab.count()) > 0) {
    await pause(BEAT_PAUSE);
    await drugTab.click();
    await pause(1_500);
    await page.evaluate(() => window.scrollBy({ top: 200, behavior: "smooth" }));
    await pause(1_200);
  }
  await pause(SECTION_PAUSE);

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 7 — Wishocracy: The Game
  // "Allocate. Vote. Share your URL. Decentralise the lobby."
  // ══════════════════════════════════════════════════════════════════════════
  await go(page, "/wishocracy");
  await pause(2_000);

  // ── 7a: LET'S GO ──
  const letsGoButton = page.getByRole("button", { name: /LET'S GO/i });
  await expect(letsGoButton).toBeVisible({ timeout: 8_000 });
  await pause(1_500);
  await letsGoButton.click();
  await pause(1_500);

  // ── 7b: Category selection ──
  for (let i = 0; i < TOTAL_CATEGORIES; i++) {
    if (i < CATEGORIES_TO_FUND) {
      const fundButton = page.getByRole("button", { name: /More Than \$0/i });
      await expect(fundButton).toBeVisible({ timeout: 5_000 });
      await pause(600);
      await fundButton.click();
    } else {
      const skipButton = page.locator('button:has-text("$0"):not(:has-text("More"))');
      await expect(skipButton).toBeVisible({ timeout: 5_000 });
      await pause(400);
      await skipButton.click();
    }
    await pause(700); // animation settle
  }

  // ── 7c: Start Comparing ──
  await pause(2_000);
  const startComparing = page.getByRole("button", { name: /Start Comparing/i });
  await expect(startComparing).toBeVisible({ timeout: 10_000 });
  await pause(1_500);
  await startComparing.click();
  await pause(2_000);

  // ── 7d: Pairwise comparisons (10 pairs) ──
  const totalPairs = (CATEGORIES_TO_FUND * (CATEGORIES_TO_FUND - 1)) / 2;

  for (let i = 0; i < totalPairs; i++) {
    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible({ timeout: 5_000 });
    await pause(900);

    await setSlider(page, SLIDER_VALUES[i % SLIDER_VALUES.length]!);
    await pause(800);

    const submitButton = page.getByRole("button", { name: /SUBMIT CHOICE/i });
    await expect(submitButton).toBeVisible({ timeout: 5_000 });
    await pause(500);
    await submitButton.click();
    await pause(1_200);
  }

  // ── 7e: Results ──
  await pause(3_000);

  // Scroll to allocation results
  const ipfsBadge = page
    .locator('text="Content-addressed on IPFS"')
    .or(page.locator('text="Storacha"'));
  await scrollToLocator(page, ipfsBadge, 3_000);

  const viewAllocation = page.getByRole("button", { name: /View Full Allocation/i });
  if ((await viewAllocation.count()) > 0) {
    await viewAllocation.click();
    await pause(3_500);
  }
  await pause(SECTION_PAUSE);

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 8 — Alignment: Politician Report Cards
  // "Which politicians actually represent you? A single number."
  // ══════════════════════════════════════════════════════════════════════════
  await go(page, "/alignment");
  await pause(2_000);
  await scrollTo(page, 0);

  // Scroll through politician rankings
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollBy({ top: 400, behavior: "smooth" }));
    await pause(1_000);
  }

  // Highlight an IPFS verification badge
  const verifiedBadge = page
    .locator('text="Verified on IPFS"')
    .or(page.locator('text="Citizen Alignment Score"'))
    .first();
  await scrollToLocator(page, verifiedBadge);
  if ((await verifiedBadge.count()) > 0) {
    await verifiedBadge.first().hover();
    await pause(2_000);
  }
  await pause(SECTION_PAUSE);

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 9 — Transparency: Hypercerts & Storacha
  // "Every score immutable. Every claim auditable."
  // ══════════════════════════════════════════════════════════════════════════
  await go(page, "/transparency");
  await pause(2_000);

  // Pipeline diagram
  await scrollTo(page, 300);
  await pause(2_000);

  // Attestation records grid
  await scrollTo(page, 900);
  await pause(2_000);

  // Hover over a Storacha CID link
  const cidLinks = page.locator('a[href*="ipfs.storacha.link"], a[href*="storacha"]');
  if ((await cidLinks.count()) > 0) {
    await cidLinks.first().scrollIntoViewIfNeeded();
    await pause(BEAT_PAUSE);
    await cidLinks.first().hover();
    await pause(2_000);
  }

  // $WISH + IAB section
  await scrollToText(page, "$WISH Token");
  await pause(2_000);
  await page.evaluate(() => window.scrollBy({ top: 500, behavior: "smooth" }));
  await pause(2_000);
  await pause(SECTION_PAUSE);

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 10 — Prize Pool: The Free Option
  // "You either get a healthier planet, or you get your money back + 17%."
  // ══════════════════════════════════════════════════════════════════════════
  await go(page, "/prize");
  await pause(2_000);

  // Mechanism steps
  await scrollTo(page, 400);
  await pause(2_000);

  await scrollToText(page, "Three Mechanisms");
  await pause(2_500);

  await page.evaluate(() => window.scrollBy({ top: 400, behavior: "smooth" }));
  await pause(1_500);

  // Pool status / smart contract details
  await scrollToText(page, "Pool Status");
  await pause(2_500);

  // Deposit / wallet section
  await page.evaluate(() => window.scrollBy({ top: 500, behavior: "smooth" }));
  await pause(2_000);
  await pause(SECTION_PAUSE);

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 11 — Outcomes & Studies: The Data Engine
  // "Which policies actually worked. Not which ones were popular."
  // ══════════════════════════════════════════════════════════════════════════
  await go(page, "/outcomes");
  await pause(BEAT_PAUSE);
  await scrollTo(page, 0);

  // Browse a few outcome cards
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: "smooth" }));
    await pause(900);
  }

  // Click into one outcome for depth
  const firstOutcomeCard = page.locator('a[href*="/outcomes/"]').first();
  if ((await firstOutcomeCard.count()) > 0) {
    await firstOutcomeCard.scrollIntoViewIfNeeded();
    await pause(BEAT_PAUSE);
    await firstOutcomeCard.click();
    await page.waitForLoadState("networkidle");
    await pause(2_000);
    await page.evaluate(() => window.scrollBy({ top: 400, behavior: "smooth" }));
    await pause(1_500);
    await page.evaluate(() => window.scrollBy({ top: 400, behavior: "smooth" }));
    await pause(1_500);
  }
  await pause(SECTION_PAUSE);

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 12 — Close: Back to Homepage Hero
  // "Alignment software for the most powerful AIs on your planet —
  //  the ones made of people."
  // ══════════════════════════════════════════════════════════════════════════
  await go(page, "/");
  await scrollTo(page, 0);
  await expect(page.locator("h1").first()).toBeVisible();
  await pause(3_000);

  // Final slow hero scroll
  await scrollTo(page, 400);
  await scrollTo(page, 900);

  // Land on the IAB / Prize sections for the closer
  await scrollToText(page, "Incentive Alignment");
  await pause(2_000);
  await page.evaluate(() => window.scrollBy({ top: 300, behavior: "smooth" }));
  await pause(2_000);

  // Return to top for end card
  await scrollTo(page, 0);
  await pause(4_000);
});
