/**
 * Route visual coverage for PR review.
 *
 * Argos compares PR screenshots against the default branch and only surfaces
 * meaningful visual diffs. Local runs still attach screenshots to the
 * Playwright HTML report, which keeps the manual review fallback available.
 */
import { expect, test, type Page } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { forceAnimationsComplete } from "./utils/audit-helpers";
import { signInDemoUser } from "./utils/auth";
import { VISUAL_ROUTES } from "./utils/visual-routes";
import { freezeClock } from "./helpers/freeze-clock";

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

  /* Live counters and timestamps should not create noisy visual diffs.
     Two mask attributes are supported for historical reasons:
       - data-visual-mask="dynamic" + data-visual-placeholder="<text>" — older
         attribute pair, still in some components.
       - data-volatile="<label>" — newer single-attribute form, also consumed
         by the markdown walker (scripts/render-pages-to-markdown.ts). The
         value of data-volatile becomes the placeholder, wrapped in brackets,
         so the screenshot displays "[deaths]" / "[money]" / "[days-overdue]"
         matching the markdown snapshot. */
  [data-visual-mask="dynamic"],
  [data-volatile] {
    -webkit-text-fill-color: transparent !important;
    position: relative !important;
  }

  [data-visual-mask="dynamic"]::after {
    color: currentColor !important;
    content: attr(data-visual-placeholder) !important;
    left: 0;
    position: absolute;
    top: 0;
    -webkit-text-fill-color: currentColor !important;
  }

  [data-volatile]::after {
    color: currentColor !important;
    content: "[" attr(data-volatile) "]" !important;
    left: 0;
    position: absolute;
    top: 0;
    -webkit-text-fill-color: currentColor !important;
  }

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
const ROUTE_MANIFEST_PATH = path.join(SCREENSHOT_ROOT, "routes.json");

test.describe("route visual regression", () => {
  test.beforeAll(async () => {
    await mkdir(SCREENSHOT_ROOT, { recursive: true });
    await writeFile(
      ROUTE_MANIFEST_PATH,
      JSON.stringify(
        VISUAL_ROUTES.map(({ name, path: routePath }) => ({
          name,
          path: routePath,
        })),
        null,
        2,
      ),
      "utf8",
    );
  });

  test.beforeEach(async ({ page }) => {
    await freezeClock(page);
  });

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
      const attachments = await argosScreenshot(
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
      const screenshotAttachment = attachments.find(
        (attachment) => attachment.contentType === "image/png",
      );
      expect(
        screenshotAttachment,
        `${route.name} should produce an Argos screenshot attachment`,
      ).toBeTruthy();
      await copyFile(
        screenshotAttachment!.path,
        path.join(
          screenshotDir,
          `${route.name}-${testInfo.project.name}.png`,
        ),
      );
    });
  }
});

async function openVisualRoute(page: Page, routePath: string) {
  const errors: string[] = [];
  await page.addInitScript(() => {
    Object.defineProperty(window, "__OPTIMITRON_VISUAL_REVIEW__", {
      value: true,
      configurable: true,
    });
  });

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
