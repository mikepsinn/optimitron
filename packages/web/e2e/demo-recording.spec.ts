/**
 * Playwright E2E: Demo recording for PL Genesis Hackathon.
 *
 * Records a 1920×1080 video walking through the site in demo-script order.
 * Each section has timed pauses matching the narration duration.
 *
 * Run:
 *   pnpm --filter @optomitron/web exec playwright test e2e/demo-recording.spec.ts
 *
 * Output: packages/web/test-results/ (video files)
 */
import { test, expect } from "@playwright/test";

const SLOW = 800; // ms between actions for visual clarity
const SECTION_PAUSE = 3_000; // breathing room between sections

async function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("full demo walkthrough", async ({ page }) => {
  test.setTimeout(300_000); // 5 min total

  // ─── Section 1: Hook — Homepage hero (15s) ───
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  await pause(2000);
  // Slow scroll down to reveal the hero
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
  await pause(3000);
  await page.evaluate(() => window.scrollTo({ top: 800, behavior: "smooth" }));
  await pause(3000);
  // Scroll to the urgency stats
  await page.evaluate(() => window.scrollTo({ top: 1400, behavior: "smooth" }));
  await pause(4000);
  await pause(SECTION_PAUSE);

  // ─── Section 2: Wishocracy — Citizen Preferences (25s) ───
  await page.goto("/wishocracy");
  await pause(2000);
  // Show the pairwise comparison interface
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await pause(3000);

  // Try to interact with comparison cards if visible
  const compareCards = page.locator('[data-testid="comparison-card"]');
  if ((await compareCards.count()) > 0) {
    await compareCards.first().click();
    await pause(2000);
  }

  // Scroll to show more content
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: "smooth" }));
  await pause(4000);
  await page.evaluate(() => window.scrollTo({ top: 1200, behavior: "smooth" }));
  await pause(4000);
  // Look for IPFS badge
  const ipfsBadge = page.locator('text="Content-addressed on IPFS"').or(
    page.locator('text="Storacha"'),
  );
  if ((await ipfsBadge.count()) > 0) {
    await ipfsBadge.first().scrollIntoViewIfNeeded();
    await pause(3000);
  }
  await pause(SECTION_PAUSE);

  // ─── Section 3: Alignment — Politician Report Cards (20s) ───
  await page.goto("/alignment");
  await pause(2000);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await pause(3000);

  // Scroll through ranked politicians
  await page.evaluate(() => window.scrollTo({ top: 500, behavior: "smooth" }));
  await pause(3000);

  // Look for "Verified on IPFS" badge and highlight it
  const verifiedBadge = page.locator('text="Verified on IPFS"');
  if ((await verifiedBadge.count()) > 0) {
    await verifiedBadge.first().scrollIntoViewIfNeeded();
    await pause(2000);
    // Hover to show the tooltip
    await verifiedBadge.first().hover();
    await pause(2000);
  }

  await page.evaluate(() =>
    window.scrollTo({ top: 1000, behavior: "smooth" }),
  );
  await pause(3000);
  await pause(SECTION_PAUSE);

  // ─── Section 4: Hypercerts — Verifiable Attestations (25s) ───
  await page.goto("/transparency");
  await pause(2000);

  // Show the pipeline
  await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
  await pause(3000);

  // Scroll to attestation records grid
  await page.evaluate(() => window.scrollTo({ top: 900, behavior: "smooth" }));
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
  await page.goto("/prize");
  await pause(2000);

  // Show the mechanism steps
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
  await pause(3000);
  await page.evaluate(() => window.scrollTo({ top: 900, behavior: "smooth" }));
  await pause(3000);

  // Show donation/wallet section
  await page.evaluate(() =>
    window.scrollTo({ top: 1400, behavior: "smooth" }),
  );
  await pause(3000);

  // Show the Three Mechanisms section
  const threeMechanisms = page.locator('text="Three Mechanisms. One System."');
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
  await page.goto("/transparency");
  await pause(1000);

  // Scroll to $WISH Token & UBI section
  const wishSection = page.locator('text="$WISH Token & UBI"');
  if ((await wishSection.count()) > 0) {
    await wishSection.scrollIntoViewIfNeeded();
    await pause(4000);
  }

  // Scroll through the four mechanism cards
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
  // Quick scroll through the about page to show product depth
  await page.goto("/about");
  await pause(1000);
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
  await pause(2000);
  await page.evaluate(() =>
    window.scrollTo({ top: 1000, behavior: "smooth" }),
  );
  await pause(2000);
  // Show the economic system section
  const economicSystem = page.locator('text="The Economic System"');
  if ((await economicSystem.count()) > 0) {
    await economicSystem.scrollIntoViewIfNeeded();
    await pause(3000);
  }
  // Show research papers
  const research = page.locator('text="Research"');
  if ((await research.count()) > 0) {
    await research.scrollIntoViewIfNeeded();
    await pause(3000);
  }
  await pause(SECTION_PAUSE);

  // ─── Section 8: Close (15s) ───
  await page.goto("/");
  await pause(2000);
  await expect(page.locator("h1")).toBeVisible();
  await pause(3000);

  // Final scroll to the economic system section on homepage
  const diagnosisFree = page.locator('text="Diagnosis Is Free"').or(
    page.locator('text="Funding Isn"'),
  );
  if ((await diagnosisFree.count()) > 0) {
    await diagnosisFree.first().scrollIntoViewIfNeeded();
    await pause(4000);
  }

  // End on the hero
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await pause(4000);
});
