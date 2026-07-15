/**
 * Route visual coverage for PR review.
 *
 * The self-built visual review compares PR screenshots against the default
 * branch and publishes a mobile-friendly HTML gallery for review.
 */
import { expect, test, type Page } from "@playwright/test";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { isRedirectOnlyRoutePath } from "@/lib/redirect-review";
import { getRouteReviewSpecs } from "@/lib/routes";
import { forceAnimationsComplete, waitForPaint } from "./utils/audit-helpers";
import { signInDemoUser } from "./utils/auth";
import { VISUAL_ROUTES } from "./utils/visual-routes";
import { freezeClock } from "./helpers/freeze-clock";

const VISUAL_REVIEW_CSS = `
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
  }

  [data-visual-mask="dynamic"]::before {
    color: currentColor !important;
    content: attr(data-visual-placeholder) !important;
    -webkit-text-fill-color: currentColor !important;
  }

  [data-volatile]::before {
    color: currentColor !important;
    content: "[" attr(data-volatile) "]" !important;
    -webkit-text-fill-color: currentColor !important;
  }

  time {
    visibility: hidden !important;
  }

  /* Full-page screenshot stabilization can expose hover-only nav tooltips. */
  [data-nav-tooltip] {
    display: none !important;
  }
`;
const OPTIONAL_ROUTE_SKIP_STATUSES = new Set([401, 403, 404]);
const SCREENSHOT_ROOT = path.resolve(process.cwd(), "screenshots");
const REVIEW_AFTER_ROOT = path.resolve(
  process.cwd(),
  "output",
  "playwright",
  "review",
  "assets",
  "after",
);
const ROUTE_MANIFEST_PATH = path.join(SCREENSHOT_ROOT, "routes.json");
const ROUTE_REVIEW_MANIFEST = buildRouteReviewManifest();

function buildRouteReviewManifest() {
  const entries = VISUAL_ROUTES.map((route) => ({
    name: route.name,
    path: route.path,
    authenticated: route.authenticated === true,
  }));
  const representedStates = new Set(
    entries.map((entry) => `${entry.path}\u0000${entry.authenticated}`),
  );

  const appendCopyRoutes = (
    mode: "copyPreview" | "authenticatedCopyPreview",
    authenticated: boolean,
  ) => {
    for (const spec of getRouteReviewSpecs(mode)) {
      if (isRedirectOnlyRoutePath(spec.path)) continue;
      const stateKey = `${spec.path}\u0000${authenticated}`;
      if (representedStates.has(stateKey)) continue;

      const hasLoggedOutState = entries.some(
        (entry) => entry.path === spec.path && !entry.authenticated,
      );
      entries.push({
        name:
          authenticated && hasLoggedOutState ? `${spec.name}-auth` : spec.name,
        path: spec.path,
        authenticated,
      });
      representedStates.add(stateKey);
    }
  };

  appendCopyRoutes("copyPreview", false);
  appendCopyRoutes("authenticatedCopyPreview", true);
  return entries;
}

test.describe("route visual regression", () => {
  test.beforeAll(async () => {
    await mkdir(SCREENSHOT_ROOT, { recursive: true });
    await writeFile(
      ROUTE_MANIFEST_PATH,
      JSON.stringify(ROUTE_REVIEW_MANIFEST, null, 2),
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
        test.skip(
          true,
          `${route.path} returned ${status}; seed data not available`,
        );
        return;
      }

      expect(
        status,
        `${route.path} should load before screenshot`,
      ).toBeLessThan(400);

      await normalizeVisualPage(page);
      if ("openMenu" in route && route.openMenu) {
        await openSideMenu(page, {
          expectSettings: "expectSettings" in route && route.expectSettings,
        });
      }
      if ("openCreateTask" in route && route.openCreateTask) {
        await openCreateTaskDialog(page, {
          mode: route.createTaskMode,
        });
      }
      if ("openContentShare" in route && route.openContentShare) {
        await openContentShare(page);
      }

      if (route.requiredSelector) {
        // Regression guard: these visual pages must keep exposing the
        // president/signer task list. Do not delete without Mike's explicit
        // approval.
        await expect(page.locator(route.requiredSelector)).toBeVisible();
      }

      if (route.requiredText) {
        await expect(page.getByText(route.requiredText)).toBeVisible();
      }

      await waitForVisualIdle(page);
      if (route.waitForImages) {
        await waitForVisualImages(page);
      }
      const screenshotFileName = `${route.name}.png`;
      const reviewScreenshotDir = path.join(
        REVIEW_AFTER_ROOT,
        testInfo.project.name,
      );
      const screenshotDir = path.join(SCREENSHOT_ROOT, testInfo.project.name);
      const reviewScreenshotPath = path.join(
        reviewScreenshotDir,
        screenshotFileName,
      );
      const screenshotPath = path.join(screenshotDir, screenshotFileName);
      await mkdir(reviewScreenshotDir, { recursive: true });
      await mkdir(screenshotDir, { recursive: true });
      await page.screenshot({ path: reviewScreenshotPath, fullPage: true });
      await copyFile(reviewScreenshotPath, screenshotPath);
      await testInfo.attach(`${route.name}-${testInfo.project.name}`, {
        path: reviewScreenshotPath,
        contentType: "image/png",
      });
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
    if (!isIgnoredVisualPageError(error)) {
      errors.push(error.stack ?? error.message);
    }
  });

  const response = await page.goto(routePath, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  await page.waitForLoadState("load", { timeout: 10_000 }).catch(() => {
    // Some streaming pages keep subresources open; screenshots only need the
    // final document after redirects settle.
  });
  await forceAnimationsComplete(page);

  expect(errors, `${routePath} should not throw client-side errors`).toEqual(
    [],
  );
  return response;
}

function isIgnoredVisualPageError(error: Error) {
  const message = error.stack ?? error.message;
  return (
    message.includes("Hydration") ||
    /\$RS[\s\S]+Cannot read properties of null \(reading 'parentNode'\)/.test(
      message,
    ) ||
    /Cannot read properties of null \(reading 'parentNode'\)[\s\S]+\$RS/.test(
      message,
    )
  );
}

async function normalizeVisualPage(page: Page) {
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
  });

  await page.addStyleTag({ content: VISUAL_REVIEW_CSS });
  await waitForPaint(page);
}

async function waitForVisualIdle(page: Page) {
  await page.waitForFunction(
    () => !document.querySelector('[data-visual-state="animating"]'),
    undefined,
    { timeout: 10_000 },
  );
  await forceAnimationsComplete(page);
}

async function waitForVisualImages(page: Page) {
  await wakeOffscreenImages(page);
  await page
    .waitForLoadState("networkidle", { timeout: 15_000 })
    .catch(() => undefined);
  await waitForDomImages(page);
  await waitForAvatarFallbacksToSettle(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await waitForPaint(page);
}

async function wakeOffscreenImages(page: Page) {
  await page.evaluate(async () => {
    const height = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
    );
    const step = Math.max(window.innerHeight, 1);

    for (let y = 0; y < height; y += step) {
      window.scrollTo(0, y);
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
    }
  });
}

async function waitForDomImages(page: Page) {
  await page.evaluate(async () => {
    const images = Array.from(document.images).filter((image) => {
      if (!image.isConnected || !image.currentSrc) return false;
      const rect = image.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    await Promise.allSettled(
      images.map(
        (image) =>
          new Promise<void>((resolve) => {
            if (image.complete) {
              resolve();
              return;
            }

            const finish = () => resolve();
            const timeout = window.setTimeout(finish, 5_000);
            image.addEventListener(
              "load",
              () => {
                window.clearTimeout(timeout);
                finish();
              },
              { once: true },
            );
            image.addEventListener(
              "error",
              () => {
                window.clearTimeout(timeout);
                finish();
              },
              { once: true },
            );
          }),
      ),
    );

    await Promise.allSettled(
      images.map((image) =>
        image.complete && image.naturalWidth > 0
          ? image.decode().catch(() => undefined)
          : Promise.resolve(),
      ),
    );
  });
}

async function waitForAvatarFallbacksToSettle(page: Page) {
  await page
    .waitForFunction(
      () => {
        const getVisibleFallbackCount = () =>
          Array.from(
            document.querySelectorAll<HTMLElement>(
              '[data-volatile="initials"]',
            ),
          ).filter((element) => {
            const style = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return (
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              rect.width > 0 &&
              rect.height > 0
            );
          }).length;

        const key = "__OPTIMITRON_VISUAL_AVATAR_FALLBACK_SETTLE__";
        const now = performance.now();
        const currentCount = getVisibleFallbackCount();
        const windowWithState = window as Window & {
          [key]?: {
            changedAt: number;
            count: number;
            startedAt: number;
          };
        };
        const state =
          windowWithState[key] ??
          ({
            changedAt: now,
            count: currentCount,
            startedAt: now,
          } as const);

        if (state.count !== currentCount) {
          windowWithState[key] = {
            changedAt: now,
            count: currentCount,
            startedAt: state.startedAt,
          };
          return false;
        }

        windowWithState[key] = state;
        return now - state.startedAt >= 1_500 && now - state.changedAt >= 750;
      },
      undefined,
      { timeout: 8_000 },
    )
    .catch(() => undefined);
}

async function openSideMenu(
  page: Page,
  { expectSettings = false }: { expectSettings?: boolean } = {},
) {
  const trigger = page.getByRole("button", { name: "Open menu" });
  const dialog = page.getByRole("dialog");
  await expect(trigger).toBeVisible();

  let openError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await trigger.click();
    try {
      await expect(dialog).toBeVisible({ timeout: 3_000 });
      openError = undefined;
      break;
    } catch (error) {
      openError = error;
      await page.waitForTimeout(500);
    }
  }

  if (openError) {
    throw openError;
  }

  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: /Manage Humanity/i }),
  ).toBeVisible();
  if (expectSettings) {
    await expect(dialog.getByRole("link", { name: /Settings/i })).toBeVisible();
  } else {
    await expect(dialog.getByRole("link", { name: /Sign In/i })).toBeVisible();
  }
  await forceAnimationsComplete(page);
  await waitForPaint(page);
}

async function openCreateTaskDialog(
  page: Page,
  { mode }: { mode?: "person" } = {},
) {
  await page.getByRole("button", { name: "Open campaign actions" }).click();
  await page.getByRole("button", { name: /^Create task$/ }).click();

  const dialog = page.getByRole("dialog", { name: /Create task/i });
  await expect(dialog).toBeVisible();

  if (mode === "person") {
    await dialog.getByLabel("Who should do it?").fill("Jane Doe");
    await dialog
      .getByRole("button", { name: /Add "Jane Doe" as a new person/i })
      .click();
    await expect(dialog.getByText("New person")).toBeVisible();
  }

  await forceAnimationsComplete(page);
  await waitForPaint(page);
}

async function openContentShare(page: Page) {
  const summary = page.locator("summary").filter({ hasText: /^Share$/ });
  await expect(summary).toHaveCount(1);
  await summary.click();
  await expect(page.getByLabel("Collaborator email")).toBeVisible();
  await forceAnimationsComplete(page);
  await waitForPaint(page);
}
