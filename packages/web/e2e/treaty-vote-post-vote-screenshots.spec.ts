/**
 * Treaty vote + post-vote screenshot audit.
 *
 * Captures the primary YES-vote path through the survey and post-vote invite
 * loop so the current UI can be reviewed before visual redesign work.
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

const FLOW_VARIANTS = [
  {
    hasPrelude: false,
    queryValue: "treaty_flow_v1_vote_first",
    slug: "treaty-flow-v1-vote-first",
  },
  {
    hasPrelude: true,
    queryValue: "treaty_flow_v2_context_first",
    slug: "treaty-flow-v2-context-first",
  },
] as const;

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

function screenshotDir(testInfo: TestInfo, flowSlug: string, viewportSlug: string) {
  const project = [
    testInfo.project.name,
    flowSlug,
    viewportSlug,
  ]
    .filter(Boolean)
    .join("-");
  const safeProject = project.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase();
  return path.join(SCREENSHOT_ROOT, safeProject);
}

function resetScreenshotDir(testInfo: TestInfo, flowSlug: string, viewportSlug: string) {
  const dir = screenshotDir(testInfo, flowSlug, viewportSlug);
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
      [class*="fixed"],
      [class*="sticky"] {
        display: none !important;
      }
      [data-testid="treaty-post-vote-overlay"],
      [data-testid="treaty-math-dialog"] {
        display: block !important;
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

async function capture(
  target: Locator,
  dir: string,
  step: number,
  slug: string,
) {
  const filePath = path.join(
    dir,
    `${String(step).padStart(2, "0")}-${slug}.png`,
  );
  await target.scrollIntoViewIfNeeded();
  await target.screenshot({
    animations: "disabled",
    caret: "hide",
    path: filePath,
  });
  console.log(`Screenshot: ${filePath}`);
}

async function captureSurveyCard(
  page: Page,
  dir: string,
  step: number,
  slug: string,
) {
  await capture(page.getByTestId("treaty-vote-slider-card"), dir, step, slug);
}

async function captureChoiceCard(
  page: Page,
  dir: string,
  step: number,
  slug: string,
) {
  await capture(page.getByTestId("treaty-vote-choice-card"), dir, step, slug);
}

async function expectPostVoteOverlayCoversViewport(page: Page) {
  const overlay = page.getByTestId("treaty-post-vote-overlay");
  await expect(overlay).toBeVisible();

  const box = await overlay.boundingBox();
  const viewport = page.viewportSize();
  expect(box, "post-vote overlay bounding box").not.toBeNull();
  if (!box || !viewport) return;

  expect(box.x).toBeLessThanOrEqual(1);
  expect(box.y).toBeLessThanOrEqual(1);
  expect(box.width).toBeGreaterThanOrEqual(viewport.width - 2);
  expect(box.height).toBeGreaterThanOrEqual(viewport.height - 2);
}

async function capturePostVoteCard(
  page: Page,
  dir: string,
  step: number,
  slug: string,
) {
  await expectPostVoteOverlayCoversViewport(page);
  await capture(page.getByTestId("treaty-post-vote-overlay"), dir, step, slug);
}

async function capturePage(
  page: Page,
  dir: string,
  step: number,
  slug: string,
) {
  const filePath = path.join(
    dir,
    `${String(step).padStart(2, "0")}-${slug}.png`,
  );
  await page.screenshot({
    animations: "disabled",
    caret: "hide",
    fullPage: false,
    path: filePath,
  });
  console.log(`Screenshot: ${filePath}`);
}

function preVoteCard(page: Page) {
  return page.getByTestId("treaty-vote-prelude-card");
}

async function expectPreVoteScreen(page: Page, screen: string) {
  await expect(preVoteCard(page)).toHaveAttribute("data-screen", screen, {
    timeout: 15_000,
  });
}

async function clickPreVotePrimary(page: Page) {
  await preVoteCard(page).locator("button").last().click();
}

function postVoteFlow(page: Page) {
  return page.getByTestId("treaty-post-vote-share-flow");
}

async function expectPostVoteScreen(page: Page, screen: string) {
  await expect(postVoteFlow(page)).toHaveAttribute("data-screen", screen, {
    timeout: 15_000,
  });
}

async function clickPostVotePrimary(page: Page) {
  await postVoteFlow(page).locator("button").last().click();
}

test.describe("treaty vote and post-vote screenshot audit", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(180_000);

  for (const flowVariant of FLOW_VARIANTS) {
    for (const viewportVariant of VIEWPORT_VARIANTS) {
      test(`captures the primary survey and post-vote flow screens (${flowVariant.slug}, ${viewportVariant.slug})`, async ({
        page,
        request,
      }, testInfo) => {
    const dir = resetScreenshotDir(testInfo, flowVariant.slug, viewportVariant.slug);
    let step = 1;
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
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

    const response = await page.goto(`/?treatyFlow=${flowVariant.queryValue}`, {
      timeout: 60_000,
      waitUntil: "domcontentloaded",
    });
    if ((response?.status() ?? 0) >= 500) {
      test.skip(true, "Needs database");
      return;
    }
    await page.waitForLoadState("domcontentloaded");
    await stabilizeVisuals(page);

    const voteSection = page.locator("#vote");
    await voteSection.scrollIntoViewIfNeeded();

    if (flowVariant.hasPrelude) {
      await expectPreVoteScreen(page, "apology");
      await capture(preVoteCard(page), dir, step++, "pre-vote-apology");

      await clickPreVotePrimary(page);
      await expectPreVoteScreen(page, "grandma");
      await capture(preVoteCard(page), dir, step++, "pre-vote-grandma");

      await clickPreVotePrimary(page);
      await expectPreVoteScreen(page, "apocalypse");
      await capture(preVoteCard(page), dir, step++, "pre-vote-apocalypse");

      await clickPreVotePrimary(page);
    }

    const slider = voteSection.locator('input[type="range"]');
    await expect(slider).toBeVisible({ timeout: 15_000 });
    await captureSurveyCard(page, dir, step++, "survey-allocation-slider");

    await setRangeValue(page, slider, "30");
    const submit = voteSection.getByRole("button", { name: "SUBMIT" });
    await expect(submit).toBeVisible({ timeout: 5_000 });
    await captureSurveyCard(page, dir, step++, "survey-allocation-submit-ready");

    await submit.click();
    await expect(voteSection.getByRole("button", { name: "YES" })).toBeVisible({ timeout: 10_000 });
    await captureChoiceCard(page, dir, step++, "survey-yes-no-question");

    await voteSection.getByRole("button", { name: "YES" }).click();
    await page.waitForTimeout(800);
    if (!flowVariant.hasPrelude) {
      await expectPostVoteScreen(page, "opening");
      await capturePostVoteCard(page, dir, step++, "post-vote-opening");
      await clickPostVotePrimary(page);
    }

    await expectPostVoteScreen(page, "stakes");
    await capturePostVoteCard(page, dir, step++, "post-vote-stakes");

    await clickPostVotePrimary(page);
    if (!flowVariant.hasPrelude) {
      await expectPostVoteScreen(page, "nuclear");
      await capturePostVoteCard(page, dir, step++, "post-vote-nuclear");
      await clickPostVotePrimary(page);
    }
    await expectPostVoteScreen(page, "math");
    await expect(page.getByText("Show the math", { exact: true })).toHaveCount(0);
    await capturePostVoteCard(page, dir, step++, "post-vote-math");
    await page.getByTestId("treaty-post-vote-open-math").click();
    const mathDialog = page.getByTestId("treaty-math-dialog");
    await expect(mathDialog).toBeVisible();
    await mathDialog.locator("button").last().click();
    await expect(mathDialog).toHaveCount(0);

    await clickPostVotePrimary(page);
    await expectPostVoteScreen(page, "neat");
    await capturePostVoteCard(page, dir, step++, "post-vote-neat");

    await clickPostVotePrimary(page);
    await expectPostVoteScreen(page, "twoHumans");
    await capturePostVoteCard(page, dir, step++, "post-vote-two-humans");

    await clickPostVotePrimary(page);
    await expectPostVoteScreen(page, "perVote");
    await capturePostVoteCard(page, dir, step++, "post-vote-per-vote-impact");

    await clickPostVotePrimary(page);
    await expectPostVoteScreen(page, "sendMessage");
    await capturePostVoteCard(page, dir, step++, "post-vote-message-composer");

    const recipientName = `Screenshot Friend ${Date.now().toString(36)}`;
    await page.locator("#post-vote-recipient-name").fill(recipientName);
    await page.getByRole("button", { name: "Bossy mode" }).click();
    const messageBox = page.locator('textarea[placeholder="Enter text..."]');
    await expect(messageBox).toBeVisible();
    await expect(messageBox).not.toHaveValue("");
    const bossyMessage = await messageBox.inputValue();
    expect(bossyMessage).not.toMatch(/[┌┐└┘│─]/);
    expect(bossyMessage).not.toContain("**");
    expect(bossyMessage).not.toContain("[ COMPLETE TASK");
    expect(bossyMessage).not.toContain("Management apologizes");
    await capturePostVoteCard(page, dir, step++, "post-vote-message-copy");

    await clickPostVotePrimary(page);
    await expectPostVoteScreen(page, "copyConfirm");
    await capturePostVoteCard(page, dir, step++, "post-vote-copy-confirm");

    await clickPostVotePrimary(page);
    await expectPostVoteScreen(page, "sendImpact");
    await capturePostVoteCard(page, dir, step++, "post-vote-send-impact");

    await postVoteFlow(page).locator("button").first().click();
    await expectPostVoteScreen(page, "depthHook");
    await capturePostVoteCard(page, dir, step++, "post-vote-depth-hook");

    await postVoteFlow(page).locator("button").first().click();
    await expectPostVoteScreen(page, "close");
    await capturePostVoteCard(page, dir, step++, "post-vote-close");

    await clickPostVotePrimary(page);
    await expectPostVoteScreen(page, "feedback");
    await capturePostVoteCard(page, dir, step++, "post-vote-feedback");

    await clickPostVotePrimary(page);
    await expect(page).toHaveURL(/\/dashboard(?:[?#]|$)/, { timeout: 15_000 });
    await capturePage(page, dir, step++, "dashboard-after-feedback");

    console.log(`Treaty flow screenshots saved to: ${dir}`);
    });
    }
  }
});
