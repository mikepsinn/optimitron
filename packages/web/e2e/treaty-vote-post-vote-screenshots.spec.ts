/**
 * Treaty vote + post-vote screenshot audit.
 *
 * Captures the primary YES-vote path through the survey and post-vote invite
 * loop so the current UI can be reviewed before visual redesign work.
 *
 * Run:
 *   pnpm --filter @optimitron/web exec playwright test e2e/treaty-vote-post-vote-screenshots.spec.ts --project=default --reporter=list
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
      await expect(page.getByText(/I'm very sorry to bother you/i)).toBeVisible({ timeout: 15_000 });
      await capture(page.getByTestId("treaty-vote-prelude-card"), dir, step++, "pre-vote-apology");

      await page.getByRole("button", { name: "Fine", exact: true }).click();
      await expect(page.getByText(/This is my grandmother/i)).toBeVisible();
      await capture(page.getByTestId("treaty-vote-prelude-card"), dir, step++, "pre-vote-grandma");

      await page.getByRole("button", { name: "I'm sorry about your grandmother", exact: true }).click();
      await expect(page.getByText(/nuclear winter that collapses the food chain/i)).toBeVisible();
      await capture(page.getByTestId("treaty-vote-prelude-card"), dir, step++, "pre-vote-apocalypse");

      await page.getByRole("button", { name: "Take me to the vote", exact: true }).click();
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
      await expect(page.getByText(/I'm very sorry to bother you/i)).toBeVisible({ timeout: 15_000 });
      await capturePostVoteCard(page, dir, step++, "post-vote-opening");
      await page.getByRole("button", { name: "Fine", exact: true }).click();
    }

    await expect(page.getByText(/someone you love will get a horrible disease/i)).toBeVisible();
    await capturePostVoteCard(page, dir, step++, "post-vote-stakes");

    await page.getByRole("button", { name: "Okay, go on", exact: true }).click();
    if (!flowVariant.hasPrelude) {
      await expect(page.getByText(/nuclear winter that collapses the food chain/i)).toBeVisible();
      await capturePostVoteCard(page, dir, step++, "post-vote-nuclear");
      await page.getByRole("button", { name: "Go on", exact: true }).click();
    }
    await expect(page.getByRole("button", { name: "Okay, I buy it", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Check the math", exact: true })).toBeVisible();
    await expect(page.getByText("Show the math", { exact: true })).toHaveCount(0);
    await capturePostVoteCard(page, dir, step++, "post-vote-math");
    await page.getByRole("button", { name: "Check the math", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Treaty Math" })).toBeVisible();
    await expect(page.getByText("Military spending to treaty funding")).toBeVisible();
    await page.getByRole("button", { name: "Close Math", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Treaty Math" })).toHaveCount(0);

    await page.getByRole("button", { name: "Okay, I buy it", exact: true }).click();
    await expect(page.getByText(/Wouldn't that be neat/i)).toBeVisible();
    await capturePostVoteCard(page, dir, step++, "post-vote-neat");

    await page.getByRole("button", { name: "Neat", exact: true }).click();
    await expect(page.getByText(/Tell 2 friends/i)).toBeVisible();
    await capturePostVoteCard(page, dir, step++, "post-vote-two-humans");

    await page.getByRole("button", { name: "Okay, two humans", exact: true }).click();
    await expect(page.getByText(/One vote = 1 full human lifetime/i)).toBeVisible();
    await capturePostVoteCard(page, dir, step++, "post-vote-per-vote-impact");

    await page.getByRole("button", { name: "Show me mine", exact: true }).click();
    await expect(page.getByText("Who do you want to tell first?")).toBeVisible();
    await capturePostVoteCard(page, dir, step++, "post-vote-recipient-name");

    const recipientName = `Screenshot Friend ${Date.now().toString(36)}`;
    await page.locator("#post-vote-recipient-name").fill(recipientName);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText(/How do you want to tell/i)).toBeVisible();
    await capturePostVoteCard(page, dir, step++, "post-vote-message-format");

    await page.getByRole("button", { name: "Bossy mode" }).click();
    const bossyPreview = page.getByTestId("bossy-task-preview");
    await expect(bossyPreview).toBeVisible();
    await expect(bossyPreview).not.toContainText(/[┌┐└┘│─]/);
    await page.getByRole("button", { name: "Continue" }).click();
    const messageBox = page.locator('textarea[placeholder="Enter text..."]');
    await expect(messageBox).toBeVisible();
    await expect(messageBox).not.toHaveValue("");
    const bossyMessage = await messageBox.inputValue();
    expect(bossyMessage).not.toMatch(/[┌┐└┘│─]/);
    expect(bossyMessage).not.toContain("**");
    expect(bossyMessage).not.toContain("[ COMPLETE TASK");
    expect(bossyMessage).not.toContain("Management apologizes");
    await capturePostVoteCard(page, dir, step++, "post-vote-message-copy");

    await page.getByRole("button", { name: /^Copy$/ }).first().click();
    await expect(page.getByText(/Now paste it into your texts/i)).toBeVisible({ timeout: 10_000 });
    await capturePostVoteCard(page, dir, step++, "post-vote-copy-confirm");

    await page.getByRole("button", { name: "I sent it" }).click();
    await expect(page.getByText(/When Screenshot votes: \+1 lifetime of suffering prevented/i)).toBeVisible({ timeout: 10_000 });
    await capturePostVoteCard(page, dir, step++, "post-vote-send-impact");

    await page.getByRole("button", { name: "No, I'm done" }).click();
    await expect(page.getByText(/Want us to email you in a few days/i)).toBeVisible();
    await capturePostVoteCard(page, dir, step++, "post-vote-depth-hook");

    await page.getByRole("button", { name: "No thanks" }).click();
    await expect(page.getByText(/The chain only breaks if one human says/i)).toBeVisible();
    await capturePostVoteCard(page, dir, step++, "post-vote-close");

    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.getByText(/most effective chain letter in history/i)).toBeVisible();
    await capturePostVoteCard(page, dir, step++, "post-vote-feedback");

    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page).toHaveURL(/\/dashboard(?:[?#]|$)/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "EARTH OPTIMIZATION", exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await capturePage(page, dir, step++, "dashboard-after-feedback");

    console.log(`Treaty flow screenshots saved to: ${dir}`);
    });
    }
  }
});
