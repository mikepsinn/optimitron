/**
 * Contrast Audit — Playwright + axe-core + custom computed-contrast
 *
 * Crawls every static route and demo slide checking WCAG AA color-contrast.
 *
 * Two-layer approach:
 *   1. axe-core  — catches straightforward contrast failures
 *   2. computed-contrast — catches what axe marks "incomplete":
 *      gradients, semi-transparent overlays, opacity-modified text
 *
 * Also runs a mobile pass (390×844) since stacking changes text/bg relationships.
 *
 * Run:
 *   pnpm --filter @optimitron/web run e2e -- contrast
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import * as fs from "fs";
import * as path from "path";
import { navigateAndSettle, writeAuditReport } from "./utils/audit-helpers";
import { signInDemoUser } from "./utils/auth";
import { getContrastViolations } from "./utils/computed-contrast";
import { ALL_PAGE_PATHS, AUTH_REQUIRED_PATHS, PUBLIC_PAGE_PATHS } from "./utils/static-pages";

const REDIRECT_ALLOWED_PATHS = new Set([
  "/politicians",
]);
const CONTRAST_SCOPE = process.env.PLAYWRIGHT_CONTRAST_SCOPE === "critical"
  ? "critical"
  : "full";
const CRITICAL_PUBLIC_PATHS = new Set([
  "/",
  "/agencies",
  "/agencies/dtreasury",
  "/agencies/dtreasury/dfed",
  "/agencies/dtreasury/dirs",
  "/agencies/dtreasury/dssa",
  "/governments",
  "/prize",
  "/scoreboard",
  "/tasks",
  "/tools",
  "/treaty",
]);
const MIN_FONT_SIZE_PX = 14;
const EMAIL_TEMPLATE_IDS = [
  "magic-link",
  "monthly-chain-digest",
  "post-vote-share",
  "referral-first-conversion",
  "task-assignment",
  "task-comment-notification",
];

function isContrastFailure(ratio: number, required: number): boolean {
  return ratio < required;
}

// Auto-discover all demo slide components from the sierra/ directory
const DEMO_SLIDES = fs
  .readdirSync(path.resolve(__dirname, "../src/components/demo/slides/sierra"))
  .filter((f) => f.startsWith("slide-") && f.endsWith(".tsx"))
  .map((f) => f.replace(/^slide-/, "").replace(/\.tsx$/, ""))
  .sort();

type AuditPage = {
  requiresAuth: boolean;
  url: string;
};

// All route pages + individual demo slides
const PAGES: AuditPage[] = [
  ...(CONTRAST_SCOPE === "critical" ? PUBLIC_PAGE_PATHS : ALL_PAGE_PATHS).filter((url) => (
    CONTRAST_SCOPE !== "critical" || CRITICAL_PUBLIC_PATHS.has(url)
  )).map((url) => ({
    requiresAuth: AUTH_REQUIRED_PATHS.has(url),
    url,
  })),
  ...(CONTRAST_SCOPE === "critical" ? [] : DEMO_SLIDES).map((id) => ({
    requiresAuth: false,
    url: `/demo#${id}`,
  })),
  ...EMAIL_TEMPLATE_IDS.map((id) => ({
    requiresAuth: false,
    url: `/dev/email/${id}?raw=1&full=1`,
  })),
];

// ── Types ───────────────────────────────────────────────────────

interface ContrastViolation {
  page: string;
  viewport: string;
  source: "axe" | "computed";
  selector: string;
  text: string;
  fg: string;
  bg: string;
  ratio: string;
  expected: string;
}

interface FontSizeViolation {
  page: string;
  viewport: string;
  selector: string;
  computedSize: string;
  nearestTextSnippet: string;
}

const allViolations: ContrastViolation[] = [];
const allFontSizeViolations: FontSizeViolation[] = [];

console.log(`[contrast-audit] scope=${CONTRAST_SCOPE} pages=${PAGES.length}`);

async function prepareAuditPage(
  page: import("@playwright/test").Page,
  url: string,
  requiresAuth: boolean,
) {
  if (requiresAuth) {
    const signedIn = await signInDemoUser(page);
    if (!signedIn) {
      test.skip(true, "Auth API not available (needs database)");
      return;
    }
  }

  const response = await navigateAndSettle(page, url);
  const status = response?.status() ?? 0;

  if (status >= 500) {
    test.skip(true, `${url} returned ${status} (needs database)`);
    return;
  }

  expect(
    status,
    `${url} should load before contrast auditing runs.`,
  ).toBeLessThan(400);

  if (!REDIRECT_ALLOWED_PATHS.has(url.split("#")[0] ?? url)) {
    assertAuditLocation(page, url);
  }
}

function assertAuditLocation(
  page: import("@playwright/test").Page,
  url: string,
) {
  const expected = new URL(url, "http://audit.local");
  const current = new URL(page.url());

  expect(
    current.pathname,
    `${url} redirected to ${current.pathname} before contrast auditing.`,
  ).toBe(expected.pathname);

  if (expected.search) {
    expect(
      current.search,
      `${url} should preserve its query during contrast auditing.`,
    ).toBe(expected.search);
  }

  // The demo player resolves `/demo#<slideId>` to the first matching segment and
  // then normalizes the hash to that segment id for sharing. For contrast audits
  // we only need to verify that the correct slide rendered, which
  // `navigateAndSettle()` already does, so exact hash preservation is not stable
  // or meaningful for `/demo`.
  if (expected.hash && expected.pathname !== "/demo") {
    expect(
      current.hash,
      `${url} should preserve its hash target during contrast auditing.`,
    ).toBe(expected.hash);
  }
}

async function getFontSizeViolations(
  page: import("@playwright/test").Page,
): Promise<Omit<FontSizeViolation, "page" | "viewport">[]> {
  return page.locator("body").evaluateAll((roots, minFontSizePx) => {
    function buildSelector(el: Element): string {
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : "";
      const cls =
        el.className && typeof el.className === "string"
          ? "." +
            el.className
              .trim()
              .split(/\s+/)
              .slice(0, 3)
              .join(".")
          : "";
      return `${tag}${id}${cls}`;
    }

    function isHidden(el: HTMLElement): boolean {
      let current: HTMLElement | null = el;
      while (current) {
        const style = window.getComputedStyle(current);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.opacity === "0"
        ) {
          return true;
        }
        current = current.parentElement;
      }
      return false;
    }

    const violations: {
      selector: string;
      computedSize: string;
      nearestTextSnippet: string;
    }[] = [];

    for (const root of roots) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const textNode = node;
        const rawText = textNode.textContent ?? "";
        const text = rawText.replace(/\s+/g, " ").trim();
        const parent = textNode.parentElement;
        node = walker.nextNode();

        if (!text || !parent) continue;
        if (["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"].includes(parent.tagName)) continue;
        if (parent.closest('[data-allow-small="footnote"]')) continue;

        const htmlParent = parent as HTMLElement;
        if (isHidden(htmlParent)) continue;

        const range = document.createRange();
        range.selectNodeContents(textNode);
        const hasRenderedRect = Array.from(range.getClientRects()).some(
          (rect) => rect.width > 0 && rect.height > 0,
        );
        range.detach();
        if (!hasRenderedRect) continue;

        const style = window.getComputedStyle(htmlParent);
        const fontSize = Number.parseFloat(style.fontSize);
        if (Number.isFinite(fontSize) && fontSize < minFontSizePx) {
          violations.push({
            selector: buildSelector(parent),
            computedSize: style.fontSize,
            nearestTextSnippet: text.slice(0, 80),
          });
        }
      }
    }

    return violations;
  }, MIN_FONT_SIZE_PX);
}

// ── Desktop pass (default viewport from config) ─────────────────

test.describe("Contrast — desktop", () => {
  for (const { url, requiresAuth } of PAGES) {
    test(`contrast desktop: ${url}`, async ({ page }) => {
      await prepareAuditPage(page, url, requiresAuth);

      const pageViolations: ContrastViolation[] = [];

      // Layer 1: axe-core
      const axeResults = await new AxeBuilder({ page })
        .withRules(["color-contrast"])
        .analyze();

      for (const v of axeResults.violations) {
        for (const node of v.nodes) {
          const msg = node.any?.[0]?.message ?? "";
          const ratioMatch = msg.match(/contrast of ([\d.]+)/);
          const fgMatch = msg.match(/foreground color: ([^,)]+)/);
          const bgMatch = msg.match(/background color: ([^,)]+)/);
          const expectedMatch = msg.match(
            /expected contrast ratio of ([\d.:]+)/,
          );
          const ratio = Number(ratioMatch?.[1] ?? Number.NaN);
          const expected = Number((expectedMatch?.[1] ?? "4.5:1").replace(":1", ""));

          if (!Number.isFinite(ratio) || !isContrastFailure(ratio, expected)) {
            continue;
          }

          pageViolations.push({
            page: url,
            viewport: "desktop",
            source: "axe",
            selector: node.target.join(" > "),
            text: node.html.replace(/<[^>]+>/g, "").slice(0, 80).trim(),
            fg: fgMatch?.[1] ?? "unknown",
            bg: bgMatch?.[1] ?? "unknown",
            ratio: String(ratio),
            expected: `${expected}:1`,
          });
        }
      }

      // Layer 2: custom computed-contrast (catches gradients, transparency)
      const computed = await getContrastViolations(page);
      for (const c of computed) {
        // Avoid duplicates — skip if axe already flagged the same text
        // (axe uses long CSS paths, computed uses short selectors, so match on text)
        const isDupe = pageViolations.some(
          (v) =>
            v.source === "axe" &&
            v.text.slice(0, 30) === c.text.slice(0, 30),
        );
        if (isDupe) continue;

        if (isContrastFailure(c.ratio, c.required)) {
          pageViolations.push({
            page: url,
            viewport: "desktop",
            source: "computed",
            selector: c.selector,
            text: c.text,
            fg: c.fg,
            bg: c.bg,
            ratio: String(c.ratio),
            expected: `${c.required}:1`,
          });
        }
      }

      if (pageViolations.length > 0) {
        allViolations.push(...pageViolations);

        console.log(`\n${"=".repeat(60)}`);
        console.log(
          `CONTRAST VIOLATIONS (desktop): ${url} (${pageViolations.length})`,
        );
        console.log("=".repeat(60));
        for (const v of pageViolations) {
          console.log(`  [${v.source}] ${v.selector}`);
          console.log(
            `    Text: "${v.text}"\n    FG: ${v.fg}  BG: ${v.bg}  Ratio: ${v.ratio} (need ${v.expected})`,
          );
          console.log("");
        }
      }

      const fontSizeViolations = (await getFontSizeViolations(page)).map((v) => ({
        page: url,
        viewport: "desktop",
        ...v,
      }));

      if (fontSizeViolations.length > 0) {
        allFontSizeViolations.push(...fontSizeViolations);

        console.log(`\n${"=".repeat(60)}`);
        console.log(
          `FONT-SIZE VIOLATIONS (desktop): ${url} (${fontSizeViolations.length})`,
        );
        console.log("=".repeat(60));
        for (const v of fontSizeViolations) {
          console.log(
            `  ${v.page} | ${v.selector} | ${v.computedSize} | "${v.nearestTextSnippet}"`,
          );
        }
      }

      expect(
        pageViolations.length,
        `${url} has ${pageViolations.length} desktop WCAG contrast violation(s). See playwright-report/contrast-audit.json for details.`,
      ).toBe(0);

      // Font-size audit is currently WARN-ONLY. Strict-fail would
      // immediately fail on ~140 pre-existing violations across
      // legacy surfaces (text-xs in landing components, etc.).
      // Migration plan: log violations now, ratchet to fail-on-new-
      // additions after a focused cleanup pass. See TODO.md.
      if (fontSizeViolations.length > 0) {
        console.warn(
          `[font-size warn] ${url} has ${fontSizeViolations.length} desktop violation(s) — see contrast-audit.json. Strict-fail enabled once pre-existing violations are cleaned up.`,
        );
      }
    });
  }
});

// ── Mobile pass (390×844) ───────────────────────────────────────

test.describe("Contrast — mobile", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  for (const { url, requiresAuth } of PAGES) {
    test(`contrast mobile: ${url}`, async ({ page }) => {
      await prepareAuditPage(page, url, requiresAuth);

      const pageViolations: ContrastViolation[] = [];

      // axe-core at mobile viewport
      const axeResults = await new AxeBuilder({ page })
        .withRules(["color-contrast"])
        .analyze();

      for (const v of axeResults.violations) {
        for (const node of v.nodes) {
          const msg = node.any?.[0]?.message ?? "";
          const ratioMatch = msg.match(/contrast of ([\d.]+)/);
          const fgMatch = msg.match(/foreground color: ([^,)]+)/);
          const bgMatch = msg.match(/background color: ([^,)]+)/);
          const expectedMatch = msg.match(
            /expected contrast ratio of ([\d.:]+)/,
          );
          const ratio = Number(ratioMatch?.[1] ?? Number.NaN);
          const expected = Number((expectedMatch?.[1] ?? "4.5:1").replace(":1", ""));

          if (!Number.isFinite(ratio) || !isContrastFailure(ratio, expected)) {
            continue;
          }

          pageViolations.push({
            page: url,
            viewport: "mobile",
            source: "axe",
            selector: node.target.join(" > "),
            text: node.html.replace(/<[^>]+>/g, "").slice(0, 80).trim(),
            fg: fgMatch?.[1] ?? "unknown",
            bg: bgMatch?.[1] ?? "unknown",
            ratio: String(ratio),
            expected: `${expected}:1`,
          });
        }
      }

      // custom computed-contrast at mobile
      const computed = await getContrastViolations(page);
      for (const c of computed) {
        const isDupe = pageViolations.some(
          (v) =>
            v.source === "axe" &&
            v.selector === c.selector &&
            v.text.slice(0, 30) === c.text.slice(0, 30),
        );
        if (isDupe) continue;

        if (isContrastFailure(c.ratio, c.required)) {
          pageViolations.push({
            page: url,
            viewport: "mobile",
            source: "computed",
            selector: c.selector,
            text: c.text,
            fg: c.fg,
            bg: c.bg,
            ratio: String(c.ratio),
            expected: `${c.required}:1`,
          });
        }
      }

      if (pageViolations.length > 0) {
        allViolations.push(...pageViolations);

        console.log(`\n${"=".repeat(60)}`);
        console.log(
          `CONTRAST VIOLATIONS (mobile): ${url} (${pageViolations.length})`,
        );
        console.log("=".repeat(60));
        for (const v of pageViolations) {
          console.log(`  [${v.source}] ${v.selector}`);
          console.log(
            `    Text: "${v.text}"\n    FG: ${v.fg}  BG: ${v.bg}  Ratio: ${v.ratio} (need ${v.expected})`,
          );
          console.log("");
        }
      }

      const fontSizeViolations = (await getFontSizeViolations(page)).map((v) => ({
        page: url,
        viewport: "mobile",
        ...v,
      }));

      if (fontSizeViolations.length > 0) {
        allFontSizeViolations.push(...fontSizeViolations);

        console.log(`\n${"=".repeat(60)}`);
        console.log(
          `FONT-SIZE VIOLATIONS (mobile): ${url} (${fontSizeViolations.length})`,
        );
        console.log("=".repeat(60));
        for (const v of fontSizeViolations) {
          console.log(
            `  ${v.page} | ${v.selector} | ${v.computedSize} | "${v.nearestTextSnippet}"`,
          );
        }
      }

      expect(
        pageViolations.length,
        `${url} has ${pageViolations.length} mobile WCAG contrast violation(s). See playwright-report/contrast-audit.json for details.`,
      ).toBe(0);

      // Font-size audit is currently WARN-ONLY (see desktop pass).
      if (fontSizeViolations.length > 0) {
        console.warn(
          `[font-size warn] ${url} has ${fontSizeViolations.length} mobile violation(s) — see contrast-audit.json. Strict-fail enabled once pre-existing violations are cleaned up.`,
        );
      }
    });
  }
});

// ── Summary + report ────────────────────────────────────────────

test.afterAll(() => {
  if (allViolations.length > 0) {
    console.log(`\n${"#".repeat(60)}`);
    console.log(`TOTAL CONTRAST VIOLATIONS: ${allViolations.length}`);
    console.log("#".repeat(60));

    // Group by viewport
    const desktop = allViolations.filter((v) => v.viewport === "desktop");
    const mobile = allViolations.filter((v) => v.viewport === "mobile");
    console.log(`  Desktop: ${desktop.length}`);
    console.log(`  Mobile:  ${mobile.length}`);

    // Group by source
    const axeCount = allViolations.filter((v) => v.source === "axe").length;
    const computedCount = allViolations.filter(
      (v) => v.source === "computed",
    ).length;
    console.log(`  axe-core: ${axeCount}`);
    console.log(`  computed: ${computedCount}`);

    // Group by page
    const byPage = new Map<string, ContrastViolation[]>();
    for (const v of allViolations) {
      const key = `${v.page} (${v.viewport})`;
      const list = byPage.get(key) ?? [];
      list.push(v);
      byPage.set(key, list);
    }

    console.log("\nBY PAGE:");
    for (const [pg, vs] of byPage) {
      console.log(`  ${pg}: ${vs.length} violations`);
    }

    // Full table
    console.log("\n\nFULL VIOLATION LIST:");
    console.log(
      "Page | Viewport | Source | Selector | FG | BG | Ratio | Expected",
    );
    console.log("--- | --- | --- | --- | --- | --- | --- | ---");
    for (const v of allViolations) {
      console.log(
        `${v.page} | ${v.viewport} | ${v.source} | ${v.selector} | ${v.fg} | ${v.bg} | ${v.ratio} | ${v.expected}`,
      );
    }
  } else {
    console.log("\n✅ No contrast violations found across all pages!");
  }

  if (allFontSizeViolations.length > 0) {
    console.log(`\n${"#".repeat(60)}`);
    console.log(`TOTAL FONT-SIZE VIOLATIONS: ${allFontSizeViolations.length}`);
    console.log("#".repeat(60));
    for (const v of allFontSizeViolations) {
      console.log(
        `${v.page} | ${v.viewport} | ${v.selector} | ${v.computedSize} | "${v.nearestTextSnippet}"`,
      );
    }
  } else {
    console.log("\nNo font-size violations found across all pages!");
  }

  // Write JSON report
  const reportPath = writeAuditReport("contrast-audit", {
    timestamp: new Date().toISOString(),
    totalViolations: allViolations.length,
    totalFontSizeViolations: allFontSizeViolations.length,
    violations: allViolations,
    fontSizeViolations: allFontSizeViolations,
  });
  console.log(`\nReport written to: ${reportPath}`);
});
