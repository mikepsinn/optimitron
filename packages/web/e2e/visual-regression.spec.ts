/**
 * Route visual coverage for PR review.
 *
 * Argos compares PR screenshots against the default branch and only surfaces
 * meaningful visual diffs. Local runs still attach screenshots to the
 * Playwright HTML report, which keeps the manual review fallback available.
 */
import { expect, test, type Page } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { forceAnimationsComplete } from "./utils/audit-helpers";

const VISUAL_ROUTES = [
  { name: "home", path: "/", required: true },
  { name: "tasks-index", path: "/tasks", required: true },
  { name: "task-optimize-earth", path: "/tasks/optimize-earth", required: false },
  { name: "task-one-percent-treaty", path: "/tasks/1-pct-treaty", required: false },
  { name: "task-signer-canada", path: "/tasks/1-pct-treaty-signer-ca", required: false },
  { name: "endorse", path: "/endorse", required: false },
  { name: "humanity-v-government", path: "/humanity-v-government", required: true },
] as const;

const ARGOS_CSS = `
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    caret-color: transparent !important;
  }

  [data-nextjs-toast],
  [data-nextjs-dialog-overlay],
  [data-nextjs-dialog],
  nextjs-portal {
    display: none !important;
  }

  /* Live counters and timestamps should not create noisy visual diffs. */
  [data-visual-mask="dynamic"],
  time {
    visibility: hidden !important;
  }

  /* Argos full-page stabilization can expose hover-only nav tooltips. */
  [data-nav-tooltip] {
    display: none !important;
  }
`;

test.describe("route visual regression", () => {
  for (const route of VISUAL_ROUTES) {
    test(`${route.name}`, async ({ page }, testInfo) => {
      const response = await openVisualRoute(page, route.path);
      const status = response?.status() ?? 0;

      if (!route.required && status >= 400) {
        test.skip(true, `${route.path} returned ${status}; seed data not available`);
        return;
      }

      expect(status, `${route.path} should load before screenshot`).toBeLessThan(400);

      await normalizeVisualPage(page);

      await argosScreenshot(
        page,
        `${route.name}-${testInfo.project.name}`,
        {
          argosCSS: ARGOS_CSS,
          fullPage: true,
          threshold: 0.55,
        },
      );
    });
  }
});

async function openVisualRoute(page: Page, routePath: string) {
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    if (!error.message.includes("Hydration")) {
      errors.push(error.message);
    }
  });

  const response = await page.goto(routePath, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  await page.waitForTimeout(2_000);
  await forceAnimationsComplete(page);

  expect(errors, `${routePath} should not throw client-side errors`).toEqual([]);
  return response;
}

async function normalizeVisualPage(page: Page) {
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
  });

  await page.addStyleTag({ content: ARGOS_CSS });
  await page.waitForTimeout(250);
}
