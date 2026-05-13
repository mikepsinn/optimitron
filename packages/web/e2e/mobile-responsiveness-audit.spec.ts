/**
 * Mobile Responsiveness Audit — Playwright
 *
 * Crawls every static route at a mobile viewport (390x844) and detects:
 *   1. Horizontal overflow (page wider than viewport)
 *   2. Elements extending beyond viewport right edge (de-duplicated by ancestry)
 *   3. Clipped text (overflow:hidden with truncated content)
 *   4. Images wider than viewport
 *
 * Saves a mobile screenshot of every page.
 *
 * Contrast is handled by `contrast-audit.spec.ts`.
 * Tap target sizing is useful accessibility feedback, but too noisy for a
 * CI-blocking mobile layout audit.
 *
 * Run:
 *   pnpm --filter @optimitron/web run e2e -- mobile
 */
import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import {
  navigateAndSettle,
  writeAuditReport,
  getDeduplicatedOverflows,
} from "./utils/audit-helpers";
import { freezeClock } from "./helpers/freeze-clock";
import { PUBLIC_PAGE_PATHS } from "./utils/static-pages";

// Force mobile viewport for this entire spec
test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

// Derived from ROUTES — add a route in routes.ts and it's automatically tested.
// Demo slides are excluded because they intentionally use overflow-hidden for
// particle containment and animated bars — not standard mobile pages.
const PAGES = PUBLIC_PAGE_PATHS.filter((p) => !p.startsWith("/demo"));

const SEVERE_CLIPPED_TEXT_PX = 32;

// ── Types ───────────────────────────────────────────────────────

interface ResponsivenessIssue {
  page: string;
  type:
    | "horizontal-overflow"
    | "element-overflow"
    | "clipped-text"
    | "oversized-image";
  selector: string;
  details: string;
}

const allIssues: ResponsivenessIssue[] = [];

const screenshotDir = path.resolve(
  __dirname,
  "..",
  "public",
  "img",
  "screenshots",
  "mobile",
);

test.beforeAll(() => {
  fs.mkdirSync(screenshotDir, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await freezeClock(page);
});

for (const url of PAGES) {
  test(`mobile: ${url}`, async ({ page }) => {
    await navigateAndSettle(page, url);

    const pageIssues: ResponsivenessIssue[] = [];
    const viewportWidth = 390;

    // Scroll to bottom and back to trigger scroll-based content
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(300);

    // --- 1. Horizontal overflow ---
    const scrollInfo = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    if (scrollInfo.scrollWidth > scrollInfo.clientWidth) {
      pageIssues.push({
        page: url,
        type: "horizontal-overflow",
        selector: "html",
        details: `scrollWidth=${scrollInfo.scrollWidth} > clientWidth=${scrollInfo.clientWidth} (${scrollInfo.scrollWidth - scrollInfo.clientWidth}px overflow)`,
      });
    }

    // --- 2. Elements overflowing viewport (de-duplicated by ancestry) ---
    const overflowingElements = await getDeduplicatedOverflows(
      page,
      viewportWidth,
    );
    for (const el of overflowingElements) {
      pageIssues.push({
        page: url,
        type: "element-overflow",
        selector: el.selector,
        details: `right=${el.right}px, width=${el.width}px (viewport=${viewportWidth}px) "${el.text}"`,
      });
    }

    // --- 3. Clipped text ---
    const clippedElements = await page.evaluate((severeClippedTextPx: number) => {
      const results: {
        selector: string;
        scrollW: number;
        clientW: number;
        text: string;
      }[] = [];
      const els = document.querySelectorAll("*");
      for (const el of els) {
        const htmlEl = el as HTMLElement;
        const style = window.getComputedStyle(htmlEl);
        if (
          (style.overflow === "hidden" || style.overflowX === "hidden") &&
          htmlEl.scrollWidth > htmlEl.clientWidth + severeClippedTextPx &&
          htmlEl.clientWidth > 0
        ) {
          const tag = htmlEl.tagName.toLowerCase();
          const id = htmlEl.id ? `#${htmlEl.id}` : "";
          const text = htmlEl.textContent?.trim().slice(0, 50) || "";
          const hasAlphanumeric = /[A-Za-z0-9]/.test(text);
          const isEmojiOnly = !hasAlphanumeric && /\p{Extended_Pictographic}/u.test(text);
          // Skip containers that intentionally clip
          if (["html", "body", "main"].includes(tag)) continue;
          // Skip intentional text-overflow: ellipsis
          if (style.textOverflow === "ellipsis") continue;
          // Skip decorative emoji strips inside animated bars and counters.
          if (isEmojiOnly) continue;

          results.push({
            selector: `${tag}${id}`,
            scrollW: htmlEl.scrollWidth,
            clientW: htmlEl.clientWidth,
            text,
          });
        }
      }
      return results;
    }, SEVERE_CLIPPED_TEXT_PX);

    for (const el of clippedElements) {
      pageIssues.push({
        page: url,
        type: "clipped-text",
        selector: el.selector,
        details: `scrollWidth=${el.scrollW} > clientWidth=${el.clientW} "${el.text}"`,
      });
    }

    // --- 4. Oversized images ---
    const oversizedImages = await page.evaluate((vw: number) => {
      const results: {
        selector: string;
        naturalW: number;
        renderedW: number;
        src: string;
      }[] = [];
      const imgs = document.querySelectorAll("img");
      for (const img of imgs) {
        const rect = img.getBoundingClientRect();
        if (rect.width > vw + 5) {
          results.push({
            selector: `img${img.id ? "#" + img.id : ""}`,
            naturalW: img.naturalWidth,
            renderedW: Math.round(rect.width),
            src: img.src.slice(-60),
          });
        }
      }
      return results;
    }, viewportWidth);

    for (const img of oversizedImages) {
      pageIssues.push({
        page: url,
        type: "oversized-image",
        selector: img.selector,
        details: `rendered=${img.renderedW}px (viewport=${viewportWidth}px) src=...${img.src}`,
      });
    }

    // --- Take screenshot ---
    const filename =
      url === "/" ? "home" : url.replace(/[/#]/g, "_").replace(/^_/, "");
    await page.screenshot({
      path: path.join(screenshotDir, `${filename}.png`),
      fullPage: true,
    });

    // Collect issues
    if (pageIssues.length > 0) {
      allIssues.push(...pageIssues);

      console.log(`\n${"=".repeat(60)}`);
      console.log(`MOBILE ISSUES: ${url} (${pageIssues.length})`);
      console.log("=".repeat(60));
      for (const issue of pageIssues) {
        console.log(`  [${issue.type}] ${issue.selector}`);
        console.log(`    ${issue.details}`);
        console.log("");
      }
    }

    expect(
      pageIssues.length,
      `${url} has ${pageIssues.length} severe mobile responsiveness issue(s). See playwright-report/mobile-responsiveness-audit.json for details.`,
    ).toBe(0);
  });
}

// ── Summary + report ────────────────────────────────────────────

test.afterAll(() => {
  if (allIssues.length > 0) {
    console.log(`\n${"#".repeat(60)}`);
    console.log(`TOTAL MOBILE ISSUES: ${allIssues.length}`);
    console.log("#".repeat(60));

    // Group by type
    const byType = new Map<string, number>();
    for (const issue of allIssues) {
      byType.set(issue.type, (byType.get(issue.type) ?? 0) + 1);
    }
    for (const [type, count] of byType) {
      console.log(`  ${type}: ${count}`);
    }

    // Group by page
    const byPage = new Map<string, ResponsivenessIssue[]>();
    for (const issue of allIssues) {
      const list = byPage.get(issue.page) ?? [];
      list.push(issue);
      byPage.set(issue.page, list);
    }

    console.log("\nBY PAGE:");
    for (const [pg, issues] of byPage) {
      console.log(`  ${pg}: ${issues.length} issues`);
    }

    // Full table
    console.log("\n\nFULL ISSUE LIST:");
    console.log("Page | Type | Selector | Details");
    console.log("--- | --- | --- | ---");
    for (const issue of allIssues) {
      console.log(
        `${issue.page} | ${issue.type} | ${issue.selector} | ${issue.details}`,
      );
    }
  } else {
    console.log("\n✅ No mobile responsiveness issues found across all pages!");
  }

  // Write JSON report
  const reportPath = writeAuditReport("mobile-responsiveness-audit", {
    timestamp: new Date().toISOString(),
    totalIssues: allIssues.length,
    issues: allIssues,
  });
  console.log(`\nReport written to: ${reportPath}`);
  console.log(`Mobile screenshots saved to: ${screenshotDir}`);
});
