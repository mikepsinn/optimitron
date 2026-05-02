/**
 * Treaty vote + Humanity Management Training screenshot audit.
 *
 * Run:
 *   pnpm --filter @optimitron/web run e2e -- treaty-screenshots --reporter=list
 */
import { expect, test, type APIRequestContext, type Locator, type Page, type TestInfo } from "@playwright/test";
import * as fs from "fs";
import path from "path";
import { DEMO_PASSWORD, signInUser } from "./utils/auth";

interface TestUser {
  email: string;
  name: string;
  password: string;
}

const SCREENSHOT_ROOT = path.resolve(
  __dirname,
  "../public/img/screenshots/treaty-vote-post-vote-flow",
);

const VIEWPORT_VARIANTS = [
  { slug: "desktop", viewport: null },
  { slug: "mobile", viewport: { width: 390, height: 844 } },
] as const;

function makeUniqueUser(): TestUser {
  const nonce = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return {
    email: `pw-treaty-flow-screenshot-${nonce}@example.test`,
    name: `Treaty Screenshot Voter ${nonce}`,
    password: DEMO_PASSWORD,
  };
}

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

async function createUserAccount(
  request: APIRequestContext,
  user: TestUser,
): Promise<boolean> {
  const response = await request.post("/api/auth/signup", {
    data: {
      email: user.email,
      name: user.name,
      newsletterSubscribed: false,
      password: user.password,
    },
  });

  if (response.status() >= 500) return false;
  expect(response.status()).toBe(201);
  return true;
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

async function setRangeValue(page: Page, range: Locator, value: string) {
  await range.scrollIntoViewIfNeeded();
  const box = await range.boundingBox();
  expect(box, "range input bounding box").not.toBeNull();
  if (!box) return;

  const numericValue = Number(value);
  const min = Number(await range.getAttribute("min") ?? "0");
  const max = Number(await range.getAttribute("max") ?? "100");
  const ratio = Math.min(1, Math.max(0, (numericValue - min) / (max - min)));
  const y = box.y + box.height / 2;
  const startX = box.x + box.width / 2;
  const targetX = box.x + box.width * ratio;

  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(targetX, y, { steps: 8 });
  await page.mouse.up();
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

async function completeSliderAndVote(page: Page) {
  const voteSection = page.locator("#vote");
  const slider = voteSection.locator('input[type="range"]');
  await expect(slider).toBeVisible({ timeout: 15_000 });
  await setRangeValue(page, slider, "30");
  const submit = voteSection.getByRole("button", { name: "SUBMIT" });
  await expect(submit).toBeVisible({ timeout: 5_000 });
  await submit.click();
  await expect(voteSection.getByRole("button", { name: "YES" })).toBeVisible({ timeout: 10_000 });
  await voteSection.getByRole("button", { name: "YES" }).click();
}

test.describe("treaty vote and training screenshot audit", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000);

  for (const viewportVariant of VIEWPORT_VARIANTS) {
    test(`captures fast vote and training (${viewportVariant.slug})`, async ({
      page,
      request,
    }, testInfo) => {
      const dir = resetScreenshotDir(testInfo, "fast-vote-training", viewportVariant.slug);
      let step = 1;
      if (viewportVariant.viewport) {
        await page.setViewportSize(viewportVariant.viewport);
      }

      const user = makeUniqueUser();
      const created = await createUserAccount(request, user);
      if (!created) {
        test.skip(true, "Signup API/database not available");
        return;
      }

      const signedIn = await signInUser(page, {
        email: user.email,
        password: user.password,
      });
      if (!signedIn) {
        test.skip(true, "Fresh user credentials not available");
        return;
      }
      await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

      const response = await page.goto("/vote", {
        timeout: 60_000,
        waitUntil: "domcontentloaded",
      });
      if ((response?.status() ?? 0) >= 500) {
        test.skip(true, "Needs database");
        return;
      }
      await stabilizeVisuals(page);

      await expect(page.getByTestId("treaty-vote-prelude-card")).toHaveCount(0);
      await capture(page.getByTestId("treaty-vote-slider-card"), dir, step++, "fast-vote-slider");
      await completeSliderAndVote(page);
      await expect(page).toHaveURL(/\/dashboard(?:[?#]|$)/, { timeout: 15_000 });
      await stabilizeVisuals(page);
      await capture(page.locator("body"), dir, step++, "dashboard-after-vote");
    });

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
