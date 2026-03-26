import { test, expect } from "@playwright/test";

const SLIDE_IDS = [
  "cold-open",
  "governments-are-ai",
  "misaligned",
  "game-title",
  "ratio-604",
  "clock",
  "failed-state",
  "ai-spiral",
  "paycheck-theft",
  "moronia",
  "wishonia",
  "the-fix",
  "acceleration",
  "compounding",
  "pluralistic-ignorance",
  "dysfunction-tax",
  "scoreboard",
  "allocate",
  "vote",
  "asymmetry",
  "get-friends",
  "prize-investment",
  "prize-mechanism",
  "vote-point-value",
  "cannot-lose",
  "leaderboard",
  "changed-metric",
  "dfda",
  "iabs",
  "superpac",
  "storacha",
  "hypercerts",
  "wish-token",
  "optimizer",
  "i-pencil",
  "personal-upside",
  "lives-saved",
  "close",
  "easter-egg",
];

test.describe("Presentation Slide Review", () => {
  test("screenshot every slide and check for render issues", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const issues: string[] = [];

    // Load page, skip boot screen and help overlay
    await page.goto("/?skipBoot", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    for (let i = 0; i < SLIDE_IDS.length; i++) {
      const slideId = SLIDE_IDS[i];
      const slideNum = String(i + 1).padStart(2, "0");

      // Set slide directly via store to avoid keyboard timing issues
      await page.evaluate((idx) => {
        const store = (window as any).__demoStore;
        if (store) store.setState({ currentSlide: idx, typewriterComplete: false });
      }, i);
      await page.waitForTimeout(1200);

      // Take screenshot
      await page.screenshot({
        path: `test-results/screenshots/${slideNum}-${slideId}.png`,
        fullPage: true,
      });

      // Check for common rendering problems
      const slideProblems = await page.evaluate((currentSlideId) => {
        const problems: string[] = [];
        const body = document.body;

        // Check for visible error boundaries or React error overlays
        const errorOverlay = document.querySelector(
          '[id*="error"], [class*="error-overlay"], [class*="nextjs-toast"]'
        );
        if (errorOverlay) {
          problems.push("React/Next.js error overlay detected");
        }

        // Check for "undefined" or "NaN" text visible on page
        const allText = body.innerText;
        if (allText.includes("undefined") && !allText.includes("// undefined")) {
          problems.push('Visible "undefined" text on page');
        }
        if (allText.includes("NaN")) {
          problems.push('Visible "NaN" text on page');
        }
        if (allText.includes("[object Object]")) {
          problems.push('Visible "[object Object]" text on page');
        }

        // Check for placeholder text
        if (
          allText.includes("TODO") ||
          allText.includes("PLACEHOLDER") ||
          allText.includes("Lorem ipsum")
        ) {
          problems.push("Placeholder text detected");
        }

        // Check for the placeholder slide component
        if (allText.includes("Slide:") && allText.includes("not yet implemented")) {
          problems.push("PlaceholderSlide is being shown instead of a real component");
        }

        // Check for empty slide area (nothing rendered)
        const mainContent = document.querySelector(
          '[class*="slide"], [class*="scene"], main'
        );
        if (
          mainContent &&
          mainContent.children.length === 0 &&
          currentSlideId !== "easter-egg"
        ) {
          problems.push("Slide area appears empty (no children)");
        }

        // Check for elements overflowing viewport
        const allElements = document.querySelectorAll("*");
        let overflowCount = 0;
        allElements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (
            rect.width > 0 &&
            rect.height > 0 &&
            (rect.right > window.innerWidth + 10 ||
              rect.bottom > window.innerHeight + 50)
          ) {
            overflowCount++;
          }
        });
        if (overflowCount > 5) {
          problems.push(
            `${overflowCount} elements overflowing viewport`
          );
        }

        // Check for broken images
        const images = document.querySelectorAll("img");
        images.forEach((img) => {
          if (!img.complete || img.naturalWidth === 0) {
            problems.push(`Broken image: ${img.src}`);
          }
        });

        return problems;
      }, slideId);

      if (slideProblems.length > 0) {
        const msg = `Slide ${slideNum} (${slideId}): ${slideProblems.join("; ")}`;
        issues.push(msg);
        console.log(`  ISSUE: ${msg}`);
      } else {
        console.log(`  OK: ${slideNum}-${slideId}`);
      }

      // Collect console errors for this slide
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      // No need to advance — we set the slide directly at the top of each iteration

      if (consoleErrors.length > 0) {
        issues.push(
          `Slide ${slideNum} (${slideId}) console errors: ${consoleErrors.join("; ")}`
        );
      }
    }

    // Write summary report
    console.log("\n=== PRESENTATION REVIEW REPORT ===");
    console.log(`Total slides: ${SLIDE_IDS.length}`);
    console.log(`Issues found: ${issues.length}`);
    if (issues.length > 0) {
      console.log("\nIssues:");
      issues.forEach((issue) => console.log(`  - ${issue}`));
    } else {
      console.log("No issues detected!");
    }
    console.log("Screenshots saved to: test-results/screenshots/");

    // Don't fail the test for content issues - we want all screenshots
    // But do log them prominently
    if (issues.length > 0) {
      test.info().annotations.push({
        type: "issues",
        description: issues.join("\n"),
      });
    }
  });

  test("check all slides have visible content", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/?skipBoot", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const slideContentReport: { id: string; hasContent: boolean; textLength: number; visibleElements: number }[] = [];

    for (let i = 0; i < SLIDE_IDS.length; i++) {
      const slideId = SLIDE_IDS[i];

      // Set slide directly via store
      await page.evaluate((idx) => {
        const store = (window as any).__demoStore;
        if (store) store.setState({ currentSlide: idx, typewriterComplete: false });
      }, i);
      await page.waitForTimeout(1000);

      const metrics = await page.evaluate(() => {
        const body = document.body;
        const text = body.innerText.trim();

        // Count visible interactive/content elements
        let visibleElements = 0;
        const selectors = "h1, h2, h3, p, span, div, svg, canvas";
        document.querySelectorAll(selectors).forEach((el) => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          if (
            rect.width > 0 &&
            rect.height > 0 &&
            style.opacity !== "0" &&
            style.visibility !== "hidden"
          ) {
            visibleElements++;
          }
        });

        return {
          textLength: text.length,
          visibleElements,
        };
      });

      const hasContent = metrics.textLength > 10 || metrics.visibleElements > 5;
      slideContentReport.push({
        id: slideId,
        hasContent,
        ...metrics,
      });

      if (!hasContent && slideId !== "easter-egg") {
        console.log(
          `  WARNING: Slide "${slideId}" may be empty (text: ${metrics.textLength} chars, elements: ${metrics.visibleElements})`
        );
      }

      // No need to advance — we set the slide directly at the top of each iteration
    }

    console.log("\n=== SLIDE CONTENT REPORT ===");
    slideContentReport.forEach((s) => {
      const status = s.hasContent ? "OK" : "EMPTY?";
      console.log(
        `  [${status}] ${s.id} — ${s.textLength} chars, ${s.visibleElements} elements`
      );
    });

    // All non-easter-egg slides should have content
    const emptySlides = slideContentReport.filter(
      (s) => !s.hasContent && s.id !== "easter-egg"
    );
    expect(
      emptySlides,
      `These slides appear empty: ${emptySlides.map((s) => s.id).join(", ")}`
    ).toHaveLength(0);
  });
});
