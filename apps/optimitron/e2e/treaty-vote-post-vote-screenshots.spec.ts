/**
 * Treaty context (/questions) screenshot audit. The vote flow itself moved to
 * warondisease.org (apps/warondisease), so this app only owns /questions.
 *
 * Run:
 *   pnpm --filter @optimitron/web run e2e -- treaty-screenshots --reporter=list
 */
import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import * as fs from "fs";
import path from "path";
import { freezeClock } from "./helpers/freeze-clock.mjs";

const SCREENSHOT_ROOT = path.resolve(
  __dirname,
  "../public/img/screenshots/treaty-vote-post-vote-flow",
);

const VIEWPORT_VARIANTS = [
  { slug: "desktop", viewport: null },
  { slug: "mobile", viewport: { width: 390, height: 844 } },
] as const;

function screenshotDir(testInfo: TestInfo, slug: string, viewportSlug: string) {
  const project = [testInfo.project.name, slug, viewportSlug]
    .filter(Boolean)
    .join("-");
  const safeProject = project.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase();
  return path.join(SCREENSHOT_ROOT, safeProject);
}

function resetScreenshotDir(testInfo: TestInfo, slug: string, viewportSlug: string) {
  const dir = screenshotDir(testInfo, slug, viewportSlug);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function stabilizeVisuals(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0ms !important;
        animation-duration: 1ms !important;
        scroll-behavior: auto !important;
        transition-delay: 0ms !important;
        transition-duration: 1ms !important;
      }
      canvas {
        display: none !important;
      }
      body > header,
      body > nav,
      nextjs-portal,
      [data-nextjs-toast],
      [data-nextjs-dialog-overlay],
      [data-nextjs-dev-tools-button],
      [id^="nextjs"],
      [class*="sticky"] {
        display: none !important;
      }
    `,
  });
}

async function capture(target: Locator, dir: string, step: number, slug: string) {
  const filePath = path.join(dir, `${String(step).padStart(2, "0")}-${slug}.png`);
  await target.scrollIntoViewIfNeeded();
  await target.screenshot({
    animations: "disabled",
    caret: "hide",
    path: filePath,
  });
  console.log(`Screenshot: ${filePath}`);
}

test.describe("treaty context screenshot audit", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await freezeClock(page);
  });

  for (const viewportVariant of VIEWPORT_VARIANTS) {
    test(`captures questions context flow (${viewportVariant.slug})`, async ({
      page,
    }, testInfo) => {
      const dir = resetScreenshotDir(testInfo, "questions-flow", viewportVariant.slug);
      let step = 1;
      if (viewportVariant.viewport) {
        await page.setViewportSize(viewportVariant.viewport);
      }

      const response = await page.goto("/questions", {
        timeout: 60_000,
        waitUntil: "domcontentloaded",
      });
      if ((response?.status() ?? 0) >= 500) {
        test.skip(true, "Needs database");
        return;
      }
      await stabilizeVisuals(page);

      const prelude = page.getByTestId("treaty-vote-prelude-card");
      await expect(prelude).toHaveAttribute("data-screen", "apology", { timeout: 10_000 });
      await capture(prelude, dir, step++, "questions-apology");
      await prelude.locator("button").last().click();
      await expect(prelude).toHaveAttribute("data-screen", "grandma", { timeout: 10_000 });
      await capture(prelude, dir, step++, "questions-grandma");
      await prelude.locator("button").last().click();
      await expect(prelude).toHaveAttribute("data-screen", "apocalypse", { timeout: 10_000 });
      await capture(prelude, dir, step++, "questions-apocalypse");
    });
  }
});
