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

const SCREENSHOT_VARIANTS = [
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

function screenshotDir(testInfo: TestInfo, viewportSlug: string) {
  const project = [
    testInfo.project.name,
    viewportSlug,
  ]
    .filter(Boolean)
    .join("-");
  const safeProject = project.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase();
  return path.join(SCREENSHOT_ROOT, safeProject);
}

function resetScreenshotDir(testInfo: TestInfo, viewportSlug: string) {
  const dir = screenshotDir(testInfo, viewportSlug);
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
    `,
  });
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

async function capturePostVoteCard(
  page: Page,
  dir: string,
  step: number,
  slug: string,
) {
  await capture(page.getByTestId("treaty-post-vote-share-flow"), dir, step, slug);
}

test.describe("treaty vote and post-vote screenshot audit", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(180_000);

  for (const variant of SCREENSHOT_VARIANTS) {
    test(`captures the primary survey and post-vote flow screens (${variant.slug})`, async ({
      page,
      request,
    }, testInfo) => {
    const dir = resetScreenshotDir(testInfo, variant.slug);
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    if (variant.viewport) {
      await page.setViewportSize(variant.viewport);
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

    const response = await page.goto("/", {
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

    const slider = voteSection.locator('input[type="range"]');
    await expect(slider).toBeVisible({ timeout: 15_000 });
    await captureSurveyCard(page, dir, 1, "survey-allocation-slider");

    await slider.fill("30");
    const submit = voteSection.getByRole("button", { name: "SUBMIT" });
    await expect(submit).toBeVisible({ timeout: 5_000 });
    await captureSurveyCard(page, dir, 2, "survey-allocation-submit-ready");

    await submit.click();
    await expect(voteSection.getByRole("button", { name: "YES" })).toBeVisible({ timeout: 10_000 });
    await captureChoiceCard(page, dir, 3, "survey-yes-no-question");

    await voteSection.getByRole("button", { name: "YES" }).click();
    await expect(page.getByText(/I'm very sorry to bother you/i)).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(800);
    await capturePostVoteCard(page, dir, 4, "post-vote-opening");

    await page.getByRole("button", { name: "Fine", exact: true }).click();
    await expect(page.getByText(/someone you love will get a horrible disease/i)).toBeVisible();
    await capturePostVoteCard(page, dir, 5, "post-vote-stakes");

    await page.getByRole("button", { name: "Okay, go on", exact: true }).click();
    await expect(page.getByText(/nuclear winter that collapses the food chain/i)).toBeVisible();
    await capturePostVoteCard(page, dir, 6, "post-vote-nuclear");

    await page.getByRole("button", { name: "Go on", exact: true }).click();
    await expect(page.getByRole("button", { name: "Okay, I buy it", exact: true })).toBeVisible();
    await capturePostVoteCard(page, dir, 7, "post-vote-math");

    await page.getByRole("button", { name: "Okay, I buy it", exact: true }).click();
    await expect(page.getByText(/Wouldn't that be neat/i)).toBeVisible();
    await capturePostVoteCard(page, dir, 8, "post-vote-neat");

    await page.getByRole("button", { name: "Neat", exact: true }).click();
    await expect(page.getByText(/For that chain reaction to reach/i)).toBeVisible();
    await capturePostVoteCard(page, dir, 9, "post-vote-two-humans");

    await page.getByRole("button", { name: "Okay, two humans", exact: true }).click();
    await expect(page.getByText(/One vote = 1 full human lifetime/i)).toBeVisible();
    await capturePostVoteCard(page, dir, 10, "post-vote-per-vote-impact");

    await page.getByRole("button", { name: "Show me mine", exact: true }).click();
    await expect(page.getByText("Who do you want to tell first?")).toBeVisible();
    await capturePostVoteCard(page, dir, 11, "post-vote-recipient-name");

    const recipientName = `Screenshot Friend ${Date.now().toString(36)}`;
    await page.locator("#post-vote-recipient-name").fill(recipientName);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText(/How do you want to tell/i)).toBeVisible();
    await capturePostVoteCard(page, dir, 12, "post-vote-message-format");

    await page.getByRole("button", { name: "Bossy mode" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    const messageBox = page.locator('textarea[placeholder="Enter text..."]');
    await expect(messageBox).toBeVisible();
    await expect(messageBox).not.toHaveValue("");
    await capturePostVoteCard(page, dir, 13, "post-vote-message-copy");

    await page.getByRole("button", { name: /^Copy$/ }).first().click();
    await expect(page.getByText(/Now paste it into your texts/i)).toBeVisible({ timeout: 10_000 });
    await capturePostVoteCard(page, dir, 14, "post-vote-copy-confirm");

    await page.getByRole("button", { name: "I sent it" }).click();
    await expect(page.getByText(/When Screenshot votes: \+1 lifetime of suffering prevented/i)).toBeVisible({ timeout: 10_000 });
    await capturePostVoteCard(page, dir, 15, "post-vote-send-impact");

    await page.getByRole("button", { name: "No, I'm done" }).click();
    await expect(page.getByText(/Want us to email you in a few days/i)).toBeVisible();
    await capturePostVoteCard(page, dir, 16, "post-vote-depth-hook");

    await page.getByRole("button", { name: "No thanks" }).click();
    await expect(page.getByText(/The chain only breaks if one human says/i)).toBeVisible();
    await capturePostVoteCard(page, dir, 17, "post-vote-close");

    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.getByText(/most effective chain letter in history/i)).toBeVisible();
    await capturePostVoteCard(page, dir, 18, "post-vote-feedback");

    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText(/Noted. Thank you for helping us end disease/i)).toBeVisible();
    await capturePostVoteCard(page, dir, 19, "post-vote-submitted-donate");

    console.log(`Treaty flow screenshots saved to: ${dir}`);
    });
  }
});
