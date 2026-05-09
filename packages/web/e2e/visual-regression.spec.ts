/**
 * Route visual coverage for PR review.
 *
 * Argos compares PR screenshots against the default branch and only surfaces
 * meaningful visual diffs. Local runs still attach screenshots to the
 * Playwright HTML report, which keeps the manual review fallback available.
 */
import { expect, test, type Page } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { forceAnimationsComplete } from "./utils/audit-helpers";
import { signInDemoUser } from "./utils/auth";
import { VISUAL_ROUTES } from "./utils/visual-routes";

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
const OPTIONAL_ROUTE_SKIP_STATUSES = new Set([401, 403, 404]);
const SCREENSHOT_ROOT = path.resolve(process.cwd(), "screenshots");

test.describe("route visual regression", () => {
  for (const route of VISUAL_ROUTES) {
    test(`${route.name}`, async ({ page }, testInfo) => {
      if ("authenticated" in route && route.authenticated) {
        const signedIn = await signInDemoUser(page);
        expect(
          signedIn,
          "demo user should sign in before dashboard screenshot",
        ).toBe(true);
      }

      const response = await openVisualRoute(page, route.path);
      const status = response?.status() ?? 0;

      if (!route.required && OPTIONAL_ROUTE_SKIP_STATUSES.has(status)) {
        test.skip(true, `${route.path} returned ${status}; seed data not available`);
        return;
      }

      expect(status, `${route.path} should load before screenshot`).toBeLessThan(400);

      await normalizeVisualPage(page);
      if ("openMenu" in route && route.openMenu) {
        await openSideMenu(page, {
          expectSettings: "expectSettings" in route && route.expectSettings,
        });
      }

      if (route.requiredText) {
        // Regression guard: these visual pages must keep exposing the
        // president/signer task list. Do not delete without Mike's explicit
        // approval.
        await expect(page.getByText(route.requiredText)).toBeVisible();
      }

      await waitForVisualIdle(page);
      await argosScreenshot(
        page,
        `${route.name}-${testInfo.project.name}`,
        {
          argosCSS: ARGOS_CSS,
          fullPage: true,
          threshold: 0.55,
        },
      );

      const screenshotDir = path.join(SCREENSHOT_ROOT, testInfo.project.name);
      await mkdir(screenshotDir, { recursive: true });
      await page.screenshot({
        fullPage: true,
        path: path.join(
          screenshotDir,
          `${route.name}-${testInfo.project.name}.png`,
        ),
      });
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

async function waitForVisualIdle(page: Page) {
  await page.waitForFunction(
    () => !document.querySelector('[data-visual-state="animating"]'),
    undefined,
    { timeout: 10_000 },
  );
  await forceAnimationsComplete(page);
}

async function openSideMenu(
  page: Page,
  { expectSettings = false }: { expectSettings?: boolean } = {},
) {
  await page.getByRole("button", { name: "Open menu" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link", { name: /Manage Humanity/i })).toBeVisible();
  if (expectSettings) {
    await expect(dialog.getByRole("link", { name: /Settings/i })).toBeVisible();
  } else {
    await expect(dialog.getByRole("link", { name: /Sign In/i })).toBeVisible();
  }
  await forceAnimationsComplete(page);
  await page.waitForTimeout(250);
}
