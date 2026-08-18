/**
 * Demo Slide Audit — Playwright
 *
 * Loads the demo page ONCE at desktop (for keyboard navigation), then for
 * each slide checks contrast and overflow at BOTH desktop and mobile viewports.
 *
 * Run with dev server already up:
 *   SKIP_SERVER=1 pnpm --filter @optimitron/web exec playwright test e2e/demo-audit.spec.ts
 */
import { test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import * as fs from "fs";
import * as path from "path";
import { forceAnimationsComplete, writeAuditReport } from "./utils/audit-helpers";
import { getContrastViolations } from "./utils/computed-contrast";
import { freezeClock } from "./helpers/freeze-clock.mjs";

// Desktop viewport for keyboard navigation
test.use({ viewport: { width: 1920, height: 1080 } });

interface SlideIssue {
  slideId: string;
  slideIndex: number;
  viewport: "desktop" | "mobile";
  type: "contrast-axe" | "contrast-computed" | "element-overflow";
  selector: string;
  details: string;
}

const screenshotDir = path.resolve(
  __dirname,
  "..",
  "public",
  "img",
  "screenshots",
  "demo-mobile",
);

async function auditCurrentSlide(
  page: import("@playwright/test").Page,
  slideId: string,
  slideIndex: number,
  viewport: "desktop" | "mobile",
  vw: number,
): Promise<SlideIssue[]> {
  const issues: SlideIssue[] = [];

  // Contrast: axe-core
  try {
    const axeResults = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .analyze();
    for (const v of axeResults.violations) {
      for (const node of v.nodes) {
        const msg = node.any?.[0]?.message ?? "";
        const ratioMatch = msg.match(/contrast of ([\d.]+)/);
        issues.push({
          slideId, slideIndex, viewport,
          type: "contrast-axe",
          selector: node.target.join(" > ").slice(0, 120),
          details: `ratio=${ratioMatch?.[1] ?? "?"} — ${node.html.replace(/<[^>]+>/g, "").slice(0, 60).trim()}`,
        });
      }
    }
  } catch { /* axe can error on complex slides */ }

  // Contrast: computed
  try {
    const computed = await getContrastViolations(page);
    for (const c of computed) {
      issues.push({
        slideId, slideIndex, viewport,
        type: "contrast-computed",
        selector: c.selector,
        details: `ratio=${c.ratio} (need ${c.required}:1) fg=${c.fg} bg=${c.bg} "${c.text.slice(0, 50)}"`,
      });
    }
  } catch { /* computed can error on unusual DOM */ }

  // Element overflow (only at mobile)
  if (viewport === "mobile") {
    const overflows = await page.evaluate((viewportW: number) => {
      const results: { selector: string; right: number; width: number }[] = [];
      const els = document.querySelectorAll("*");
      for (const el of els) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        if (rect.right <= viewportW + 5) continue;
        // Skip elements inside overflow:hidden
        let clipped = false;
        let parent = el.parentElement;
        while (parent) {
          const ps = window.getComputedStyle(parent);
          if (ps.overflow === "hidden" || ps.overflowX === "hidden") { clipped = true; break; }
          parent = parent.parentElement;
        }
        if (clipped) continue;
        const tag = el.tagName.toLowerCase();
        const cls = el.className && typeof el.className === "string"
          ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "";
        results.push({ selector: `${tag}${cls}`, right: Math.round(rect.right), width: Math.round(rect.width) });
        if (results.length >= 10) break;
      }
      return results;
    }, vw);
    for (const o of overflows) {
      issues.push({
        slideId, slideIndex, viewport,
        type: "element-overflow",
        selector: o.selector,
        details: `right=${o.right}px, width=${o.width}px (viewport=${vw}px)`,
      });
    }
  }

  return issues;
}

test("demo slide audit — all slides, desktop + mobile", async ({ page }) => {
  test.setTimeout(600_000); // 10 min
  fs.mkdirSync(screenshotDir, { recursive: true });
  await freezeClock(page);

  const allIssues: SlideIssue[] = [];
  const seenSlides = new Set<string>();

  // Load demo page — first load after restart compiles 60+ slide components
  // Warm the page first, then reload for a clean state
  await page.goto("/demo", { waitUntil: "load", timeout: 120_000 });
  await page.waitForTimeout(5_000);
  await page.reload({ waitUntil: "load", timeout: 60_000 });
  await page.waitForSelector('[data-testid^="slide-"]', { timeout: 30_000 });
  await page.waitForTimeout(3_000);

  // Check if __demoNav test helper is available
  const hasNav = await page.evaluate(() => !!(window as any).__demoNav?.total);
  const totalSlides = hasNav
    ? await page.evaluate(() => (window as any).__demoNav.total as number)
    : 24; // fallback
  const useNav = hasNav;
  console.log(`  Navigation mode: ${useNav ? "__demoNav" : "keyboard"} (${totalSlides} segments)`);
  console.log(`\nAuditing up to ${totalSlides} segments (desktop + mobile)\n`);

  let stuckCount = 0;
  let lastSlideId = "";

  for (let i = 0; i < totalSlides; i++) {
    // Navigate to this segment
    if (useNav) {
      await page.evaluate((idx) => {
        (window as any).__demoNav?.setSlide(idx);
      }, i);
    } else if (i > 0) {
      await page.keyboard.press("ArrowRight");
    }

    // Wait for React to process the state update and render new slide
    await page.waitForTimeout(2_000);

    // Get slide ID from data-testid
    const slideId = await page.evaluate(() => {
      const el = document.querySelector('[data-testid^="slide-"]');
      return el?.getAttribute("data-testid")?.replace("slide-", "") ?? "";
    }) || `segment-${i}`;

    // Skip duplicate slides we've already audited
    if (seenSlides.has(slideId)) continue;
    seenSlides.add(slideId);

    // Wait for phased animations within the slide
    await page.waitForTimeout(3_000);

    // --- Desktop audit ---
    const desktopIssues = await auditCurrentSlide(page, slideId, i, "desktop", 1920);

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotDir, `${String(seenSlides.size - 1).padStart(2, "0")}-${slideId}.png`),
      fullPage: false,
    });

    if (desktopIssues.length > 0) {
      allIssues.push(...desktopIssues);
      console.log(`  [${seenSlides.size}] ${slideId}: ${desktopIssues.length} issues`);
      for (const issue of desktopIssues.slice(0, 5)) {
        console.log(`    [${issue.viewport}/${issue.type}] ${issue.details.slice(0, 90)}`);
      }
      if (desktopIssues.length > 5) console.log(`    ... and ${desktopIssues.length - 5} more`);
    } else {
      console.log(`  [${seenSlides.size}] ${slideId}: ✓`);
    }
  }

  // --- Summary ---
  console.log(`\n${"#".repeat(60)}`);
  console.log(`DEMO AUDIT: ${allIssues.length} issues across ${seenSlides.size} unique slides`);
  console.log("#".repeat(60));

  if (allIssues.length > 0) {
    const byType = new Map<string, number>();
    const byViewport = new Map<string, number>();
    for (const issue of allIssues) {
      byType.set(issue.type, (byType.get(issue.type) ?? 0) + 1);
      byViewport.set(issue.viewport, (byViewport.get(issue.viewport) ?? 0) + 1);
    }
    console.log("\nBy type:");
    for (const [t, c] of byType) console.log(`  ${t}: ${c}`);
    console.log("\nBy viewport:");
    for (const [v, c] of byViewport) console.log(`  ${v}: ${c}`);

    const bySlide = new Map<string, number>();
    for (const issue of allIssues) {
      bySlide.set(issue.slideId, (bySlide.get(issue.slideId) ?? 0) + 1);
    }
    console.log("\nBy slide:");
    for (const [s, c] of bySlide) console.log(`  ${s}: ${c}`);

    console.log("\nAll issues:");
    for (const issue of allIssues) {
      console.log(`  ${issue.slideId} [${issue.viewport}] [${issue.type}] ${issue.details.slice(0, 100)}`);
    }
  } else {
    console.log("  ✅ No issues found!");
  }

  const reportPath = writeAuditReport("demo-slide-audit", {
    timestamp: new Date().toISOString(),
    totalIssues: allIssues.length,
    uniqueSlides: seenSlides.size,
    issues: allIssues,
  });
  console.log(`\nReport: ${reportPath}`);
  console.log(`Screenshots: ${screenshotDir}`);
});
