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
 * Run with dev server already up:
 *   SKIP_SERVER=1 pnpm --filter @optimitron/web exec playwright test e2e/contrast-audit.spec.ts
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import * as fs from "fs";
import * as path from "path";
import { navigateAndSettle, writeAuditReport } from "./utils/audit-helpers";
import { getContrastViolations, type ComputedContrastViolation } from "./utils/computed-contrast";

// Auto-discover all demo slide components from the sierra/ directory
const DEMO_SLIDES = fs
  .readdirSync(path.resolve(__dirname, "../src/components/demo/slides/sierra"))
  .filter((f) => f.startsWith("slide-") && f.endsWith(".tsx"))
  .map((f) => f.replace(/^slide-/, "").replace(/\.tsx$/, ""))
  .sort();

// All static routes
const PAGES = [
  "/",
  "/prize",
  "/iab",
  "/scoreboard",
  "/about",
  "/compare",
  "/misconceptions",
  "/outcomes",
  "/tools",
  "/wishonia",
  "/moronia",
  "/agencies",
  "/agencies/dcongress",
  "/agencies/dcongress/wishocracy",
  "/agencies/dcongress/referendums",
  "/agencies/dtreasury",
  "/agencies/dtreasury/dirs",
  "/agencies/dtreasury/dfed",
  "/agencies/dtreasury/dssa",
  "/agencies/dfec",
  "/agencies/dcbo",
  "/agencies/domb",
  "/agencies/dgao",
  "/agencies/dih",
  "/agencies/dih/discoveries",
  "/agencies/ddod",
  "/governments",
  ...DEMO_SLIDES.map((id) => `/demo#${id}`),
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

const allViolations: ContrastViolation[] = [];

// ── Desktop pass (default viewport from config) ─────────────────

test.describe("Contrast — desktop", () => {
  for (const url of PAGES) {
    test(`contrast desktop: ${url}`, async ({ page }) => {
      await navigateAndSettle(page, url);

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

          pageViolations.push({
            page: url,
            viewport: "desktop",
            source: "axe",
            selector: node.target.join(" > "),
            text: node.html.replace(/<[^>]+>/g, "").slice(0, 80).trim(),
            fg: fgMatch?.[1] ?? "unknown",
            bg: bgMatch?.[1] ?? "unknown",
            ratio: ratioMatch?.[1] ?? "unknown",
            expected: expectedMatch?.[1] ?? "4.5:1",
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

  for (const url of PAGES) {
    test(`contrast mobile: ${url}`, async ({ page }) => {
      await navigateAndSettle(page, url);

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

          pageViolations.push({
            page: url,
            viewport: "mobile",
            source: "axe",
            selector: node.target.join(" > "),
            text: node.html.replace(/<[^>]+>/g, "").slice(0, 80).trim(),
            fg: fgMatch?.[1] ?? "unknown",
            bg: bgMatch?.[1] ?? "unknown",
            ratio: ratioMatch?.[1] ?? "unknown",
            expected: expectedMatch?.[1] ?? "4.5:1",
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

  // Write JSON report
  const reportPath = writeAuditReport("contrast-audit", {
    timestamp: new Date().toISOString(),
    totalViolations: allViolations.length,
    violations: allViolations,
  });
  console.log(`\nReport written to: ${reportPath}`);
});
