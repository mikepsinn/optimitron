/**
 * New-user funnel screenshot audit, per site variant.
 *
 * Run:
 *   pnpm --filter @optimitron/web run e2e -- new-user-flow-screenshots --reporter=list
 *
 * Output:
 *   <repo>/screenshots/new-user-flow/<variant>/<viewport>/<NN>-<step>.png
 *   <repo>/screenshots/new-user-flow/index.html
 */
import {
  expect,
  test,
  type Locator,
  type Page,
} from "@playwright/test";
import * as fs from "fs";
import path from "path";
import { buildMagicLinkHtml } from "@/lib/email/magic-link-render";
import { SITE_VARIANT_OVERRIDE_HEADER, type SiteKey } from "@/lib/site";
import { freezeClock } from "./helpers/freeze-clock";
import { DEMO_PASSWORD } from "./utils/auth";

interface VariantConfig {
  slug: string;
  label: string;
  host: string;
  siteKey: SiteKey;
  treatyFlow: boolean;
}

const VARIANTS: readonly VariantConfig[] = [
  {
    slug: "warondisease",
    label: "warondisease.org",
    host: "warondisease.org",
    siteKey: "warOnDisease",
    treatyFlow: true,
  },
  {
    slug: "optimitron",
    label: "optimitron.com",
    host: "optimitron.com",
    siteKey: "optimitron",
    treatyFlow: true,
  },
  {
    slug: "dfda",
    label: "dfda.earth",
    host: "dfda.earth",
    siteKey: "dfda",
    treatyFlow: false,
  },
];

const VIEWPORTS = [
  { slug: "desktop", viewport: { width: 1280, height: 900 } },
  { slug: "mobile", viewport: { width: 390, height: 844 } },
] as const;

const OUTPUT_ROOT = path.resolve(__dirname, "../../../screenshots/new-user-flow");

interface Frame {
  step: number;
  slug: string;
  relativePath: string;
}

interface VariantOutcome {
  variant: VariantConfig;
  viewportSlug: string;
  frames: Frame[];
  warnings: string[];
  error: string | null;
}

interface TestUser {
  email: string;
  name: string;
  password: string;
}

interface BrowserFetchResult<T = unknown> {
  status: number;
  json: T | null;
  text: string;
}

const collected: VariantOutcome[] = [];

function variantDir(variantSlug: string, viewportSlug: string) {
  return path.join(OUTPUT_ROOT, variantSlug, viewportSlug);
}

function resetVariantDir(variantSlug: string, viewportSlug: string) {
  const dir = variantDir(variantSlug, viewportSlug);
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
      canvas,
      [data-nextjs-toast],
      [data-nextjs-dialog-overlay],
      [data-nextjs-dev-tools-button],
      [id^="nextjs"],
      nextjs-portal {
        display: none !important;
      }
    `,
  });
}

async function captureFull(page: Page, filePath: string) {
  await page.screenshot({
    animations: "disabled",
    caret: "hide",
    fullPage: false,
    path: filePath,
  });
}

async function captureElement(target: Locator, filePath: string) {
  await target.scrollIntoViewIfNeeded();
  await target.screenshot({
    animations: "disabled",
    caret: "hide",
    path: filePath,
  });
}

async function captureStep(
  outcome: VariantOutcome,
  dir: string,
  stepState: { step: number },
  slug: string,
  capture: (filePath: string) => Promise<void>,
) {
  const fileName = `${String(stepState.step).padStart(2, "0")}-${slug}.png`;
  const filePath = path.join(dir, fileName);
  await capture(filePath);
  console.log(`Screenshot: ${filePath}`);
  outcome.frames.push({
    step: stepState.step,
    slug,
    relativePath: `${outcome.variant.slug}/${outcome.viewportSlug}/${fileName}`,
  });
  stepState.step++;
}

async function setRangeValue(page: Page, range: Locator, value: string) {
  await range.scrollIntoViewIfNeeded();
  const box = await range.boundingBox();
  expect(box, "range input bounding box").not.toBeNull();
  if (!box) return;

  const numericValue = Number(value);
  const min = Number((await range.getAttribute("min")) ?? "0");
  const max = Number((await range.getAttribute("max")) ?? "100");
  const ratio = Math.min(1, Math.max(0, (numericValue - min) / (max - min)));
  const y = box.y + box.height / 2;
  const startX = box.x + box.width / 2;
  const targetX = box.x + box.width * ratio;

  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(targetX, y, { steps: 8 });
  await page.mouse.up();
  await range.fill(value);
  await range.dispatchEvent("input");
  await range.dispatchEvent("change");
}

function makeUniqueUser(variantSlug: string): TestUser {
  const nonce = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    email: `pw-newuser-${variantSlug}-${nonce}@example.test`,
    name: `New User Flow ${variantSlug} ${nonce}`,
    password: DEMO_PASSWORD,
  };
}

async function browserJsonRequest<T = unknown>(
  page: Page,
  input: {
    method: "GET" | "POST" | "PATCH";
    path: string;
    body?: unknown;
  },
): Promise<BrowserFetchResult<T>> {
  return page.evaluate(async ({ method, path: requestPath, body }) => {
    const response = await fetch(requestPath, {
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "include",
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      method,
    });
    const text = await response.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { status: response.status, json, text };
  }, input) as Promise<BrowserFetchResult<T>>;
}

async function createUserAccount(page: Page, user: TestUser): Promise<boolean> {
  const response = await browserJsonRequest(page, {
    method: "POST",
    path: "/api/auth/signup",
    body: {
      email: user.email,
      name: user.name,
      newsletterSubscribed: false,
      password: user.password,
    },
  });
  if (response.status >= 500) return false;
  expect(response.status).toBe(201);
  return true;
}

async function createAndConfirmInvitation(
  page: Page,
  input: { contactMethod: "COPY" | "OTHER"; recipientName: string },
) {
  const created = await browserJsonRequest<{ invitation: { id: string } }>(page, {
    method: "POST",
    path: "/api/referral-invitations",
    body: {
      contactMethod: input.contactMethod,
      messageFormat: "TASK_NOTIFICATION",
      messageText: `${input.recipientName}, vote on the 1% Treaty.`,
      originUrl: "/dashboard",
      recipientName: input.recipientName,
    },
  });
  if (created.status !== 201) {
    throw new Error(
      `Create referral invitation (${input.contactMethod}) returned ${created.status}: ${created.text.slice(0, 240)}`,
    );
  }
  const createdPayload = created.json;
  expect(createdPayload?.invitation?.id).toBeTruthy();

  const confirmed = await browserJsonRequest(page, {
    method: "PATCH",
    path: "/api/referral-invitations",
    body: {
      action: "markManualContacted",
      id: createdPayload!.invitation.id,
      messageText: `${input.recipientName}, vote on the 1% Treaty.`,
      shareAttemptId: `pw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      wasEdited: false,
    },
  });
  if (confirmed.status !== 200) {
    throw new Error(
      `Confirm referral invitation (${input.contactMethod}) returned ${confirmed.status}: ${confirmed.text.slice(0, 240)}`,
    );
  }
}

async function markSignTreatySubtask(page: Page) {
  const response = await browserJsonRequest(page, {
    method: "POST",
    path: "/api/user-treaty-task/sign-personally",
  });
  expect(response.status).toBeLessThan(400);
}

async function signInUserInBrowser(page: Page, credentials: Required<Pick<TestUser, "email" | "password">>) {
  const csrf = await browserJsonRequest<{ csrfToken: string }>(page, {
    method: "GET",
    path: "/api/auth/csrf",
  });
  if (csrf.status >= 500) return false;
  const csrfToken = csrf.json?.csrfToken;
  if (!csrfToken) return false;

  const signInResponse = await page.evaluate(
    async ({ csrfToken: token, email, password }) => {
      const form = new URLSearchParams({
        csrfToken: token,
        email,
        json: "true",
        password,
      });
      const response = await fetch("/api/auth/callback/credentials", {
        body: form,
        credentials: "include",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        method: "POST",
      });
      return response.status;
    },
    { csrfToken, email: credentials.email, password: credentials.password },
  );

  if (signInResponse >= 400) return false;

  const session = await browserJsonRequest<{ user?: { id?: string } }>(page, {
    method: "GET",
    path: "/api/auth/session",
  });
  return Boolean(session.json?.user?.id);
}

async function renderEmailPreviewDocument(input: {
  host: string;
  label: string;
  url: string;
}) {
  const html = await buildMagicLinkHtml(input.url, input.host, {});
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(input.label)} magic-link preview</title>
<style>
  body { margin: 0; padding: 32px; background: #f4f4f5; font-family: Arial, sans-serif; color: #111827; }
  .email-shell { max-width: 640px; margin: 0 auto; background: #fff; border: 1px solid #d4d4d8; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12); }
  .email-meta { padding: 12px 16px; border-bottom: 1px solid #e4e4e7; color: #52525b; font-size: 12px; }
</style>
</head>
<body>
  <main class="email-shell" data-testid="magic-link-email-preview">
    <div class="email-meta">Subject: Sign in to ${escapeHtml(input.host)}</div>
    ${html}
  </main>
</body>
</html>`;
}

async function captureEmailPreview(
  page: Page,
  outcome: VariantOutcome,
  dir: string,
  stepState: { step: number },
  user: TestUser,
) {
  const magicLinkUrl = `https://${outcome.variant.host}/api/auth/callback/email?token=preview-${encodeURIComponent(user.email)}`;
  await page.setContent(
    await renderEmailPreviewDocument({
      host: outcome.variant.host,
      label: outcome.variant.label,
      url: magicLinkUrl,
    }),
    { waitUntil: "domcontentloaded" },
  );
  await expect(page.getByTestId("magic-link-email-preview")).toContainText(
    "Click the button below to verify your email and save your vote.",
  );
  await captureStep(outcome, dir, stepState, "magic-link-email", (filePath) =>
    captureElement(page.getByTestId("magic-link-email-preview"), filePath),
  );
}

async function captureDashboard(
  page: Page,
  outcome: VariantOutcome,
  dir: string,
  stepState: { step: number },
  slug: string,
) {
  const response = await page.goto("/dashboard", {
    timeout: 30_000,
    waitUntil: "domcontentloaded",
  });
  if (new URL(page.url()).pathname === "/auth/signin") {
    outcome.error = "Dashboard redirected to sign-in";
    return false;
  }
  const signInForm = page.getByText("EMAIL ME A SIGN-IN LINK");
  if (await signInForm.isVisible({ timeout: 500 }).catch(() => false)) {
    outcome.error = `Dashboard rendered sign-in at ${page.url()}`;
    return false;
  }
  const status = response?.status() ?? 0;
  if (status >= 500) {
    outcome.error = `Dashboard returned ${status}`;
    return false;
  }
  await stabilizeVisuals(page);
  await page.waitForTimeout(500);
  await captureStep(outcome, dir, stepState, slug, (filePath) => captureFull(page, filePath));
  return true;
}

async function captureTreatyVoteAndTraining(
  page: Page,
  outcome: VariantOutcome,
  dir: string,
  stepState: { step: number },
) {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

  const voteResponse = await page.goto("/vote", {
    timeout: 30_000,
    waitUntil: "domcontentloaded",
  });
  const voteStatus = voteResponse?.status() ?? 0;
  if (voteStatus >= 400) {
    outcome.warnings.push(`/vote returned ${voteStatus}; treaty frames skipped`);
    return;
  }

  await stabilizeVisuals(page);
  const voteSection = page.locator("#vote");
  await voteSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const slider = voteSection.locator('input[type="range"]').first();
  await expect(slider).toBeVisible({ timeout: 15_000 });
  await setRangeValue(page, slider, "70");
  const submit = voteSection.getByRole("button", { name: "SUBMIT" });
  await expect(submit).toBeVisible({ timeout: 10_000 });

  const sliderCard = page.getByTestId("treaty-vote-slider-card").first();
  await captureStep(outcome, dir, stepState, "vote-slider", (filePath) =>
    captureElement(sliderCard, filePath),
  );

  await submit.click();
  await expect(voteSection.getByRole("button", { name: "YES" })).toBeVisible({
    timeout: 10_000,
  });
  await captureStep(outcome, dir, stepState, "vote-submitted", (filePath) =>
    captureElement(voteSection, filePath),
  );

  await voteSection.getByRole("button", { name: "YES" }).click();
  await expect(page).toHaveURL(/\/dashboard(?:[?#]|$)/, {
    timeout: 15_000,
  });
  await stabilizeVisuals(page);
  await captureDashboard(page, outcome, dir, stepState, "dashboard-after-vote");

  await markSignTreatySubtask(page);
  await createAndConfirmInvitation(page, {
    contactMethod: "OTHER",
    recipientName: `First Friend ${Date.now().toString(36)}`,
  });
  await createAndConfirmInvitation(page, {
    contactMethod: "COPY",
    recipientName: `Second Friend ${Date.now().toString(36)}`,
  });

  await captureDashboard(page, outcome, dir, stepState, "dashboard-after-all-subtasks");
}

async function captureVariant(
  variant: VariantConfig,
  viewport: { slug: string; viewport: { width: number; height: number } },
  page: Page,
): Promise<VariantOutcome> {
  const outcome: VariantOutcome = {
    variant,
    viewportSlug: viewport.slug,
    frames: [],
    warnings: [],
    error: null,
  };

  const dir = resetVariantDir(variant.slug, viewport.slug);
  const stepState = { step: 1 };
  await page.setViewportSize(viewport.viewport);

  try {
    const landingResponse = await page.goto("/", {
      timeout: 30_000,
      waitUntil: "domcontentloaded",
    });
    const landingStatus = landingResponse?.status() ?? 0;
    if (landingStatus >= 500) {
      outcome.error = `Landing returned ${landingStatus}`;
      return outcome;
    }
    await stabilizeVisuals(page);
    await page.waitForTimeout(300);
    await captureStep(outcome, dir, stepState, "landing", (filePath) =>
      captureFull(page, filePath),
    );

    const user = makeUniqueUser(variant.slug);
    const created = await createUserAccount(page, user);
    if (!created) {
      outcome.error = "Signup unavailable";
      return outcome;
    }

    await captureEmailPreview(page, outcome, dir, stepState, user);

    const signedIn = await signInUserInBrowser(page, {
      email: user.email,
      password: user.password,
    });
    if (!signedIn) {
      outcome.error = "Sign-in unavailable";
      return outcome;
    }

    const dashboardCaptured = await captureDashboard(
      page,
      outcome,
      dir,
      stepState,
      "dashboard-post-signin",
    );
    if (!dashboardCaptured) return outcome;

    if (variant.treatyFlow) {
      await captureTreatyVoteAndTraining(page, outcome, dir, stepState);
    } else {
      outcome.warnings.push("No treaty vote/HMT route on this host; captured landing, email, and dashboard only");
    }
  } catch (e) {
    outcome.error = e instanceof Error ? e.message : String(e);
  }

  return outcome;
}

function renderIndexHtml(outcomes: VariantOutcome[]): string {
  const byVariant = new Map<string, VariantOutcome[]>();
  for (const outcome of outcomes) {
    const list = byVariant.get(outcome.variant.slug) ?? [];
    list.push(outcome);
    byVariant.set(outcome.variant.slug, list);
  }

  const sections = Array.from(byVariant.entries())
    .map(([slug, runs]) => {
      const label = runs[0]!.variant.label;
      const viewportBlocks = runs
        .map((run) => {
          const statusBlocks = [
            ...run.warnings.map((warning) => `<div class="warn">${escapeHtml(warning)}</div>`),
            ...(run.error ? [`<div class="error">${escapeHtml(run.error)}</div>`] : []),
          ].join("");
          const cells = run.frames
            .map(
              (frame) =>
                `<figure><img src="${frame.relativePath}" alt="${escapeHtml(
                  frame.slug,
                )}" loading="lazy" /><figcaption>${String(frame.step).padStart(
                  2,
                  "0",
                )} - ${escapeHtml(frame.slug)}</figcaption></figure>`,
            )
            .join("");
          return `<div class="viewport"><h3>${escapeHtml(run.viewportSlug)}</h3>${statusBlocks}<div class="grid">${cells}</div></div>`;
        })
        .join("");
      return `<section><h2>${escapeHtml(label)} <span class="slug">${escapeHtml(slug)}</span></h2>${viewportBlocks}</section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>New-user funnel screenshot audit</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 24px; background: #fafafa; color: #111; }
  h1 { margin: 0 0 4px; font-size: 24px; }
  .meta { color: #555; margin-bottom: 24px; font-size: 13px; }
  section { background: #fff; border: 1px solid #ddd; padding: 16px 20px; margin-bottom: 24px; }
  section h2 { margin: 0 0 12px; font-size: 18px; }
  .slug { color: #888; font-weight: normal; font-size: 13px; margin-left: 8px; }
  .viewport { margin: 12px 0 20px; }
  .viewport h3 { color: #666; font-size: 13px; letter-spacing: 0.08em; margin: 0 0 8px; text-transform: uppercase; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 12px; }
  figure { margin: 0; border: 1px solid #ddd; background: #fff; }
  figure img { width: 100%; display: block; }
  figcaption { padding: 6px 8px; font-size: 12px; color: #555; background: #f5f5f5; border-top: 1px solid #eee; font-family: ui-monospace, Menlo, monospace; }
  .error, .warn { padding: 8px 10px; background: #fff7e6; border: 1px solid #f3d49a; color: #7c2d12; font-size: 13px; margin-bottom: 8px; }
</style>
</head>
<body>
<h1>New-user funnel screenshot audit</h1>
<div class="meta">Generated ${escapeHtml(new Date().toISOString())} - run <code>pnpm --filter @optimitron/web run e2e -- new-user-flow-screenshots</code> to refresh.</div>
${sections}
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

test.describe("new-user funnel screenshot audit", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(240_000);

  for (const variant of VARIANTS) {
    for (const viewport of VIEWPORTS) {
      test(`${variant.slug} (${viewport.slug})`, async ({ baseURL, browser }) => {
        const context = await browser.newContext({
          baseURL,
          extraHTTPHeaders: {
            [SITE_VARIANT_OVERRIDE_HEADER]: variant.siteKey,
          },
          viewport: viewport.viewport,
        });
        const page = await context.newPage();
        try {
          await freezeClock(page);
          const outcome = await captureVariant(variant, viewport, page);
          collected.push(outcome);
          if (outcome.frames.length === 0) {
            throw new Error(`${variant.slug} produced zero frames`);
          }
          if (outcome.error) {
            throw new Error(`${variant.slug} failed: ${outcome.error}`);
          }
        } finally {
          await context.close();
        }
      });
    }
  }

  test.afterAll(async () => {
    if (collected.length === 0) return;
    fs.mkdirSync(OUTPUT_ROOT, { recursive: true });
    const indexPath = path.join(OUTPUT_ROOT, "index.html");
    fs.writeFileSync(indexPath, renderIndexHtml(collected), "utf8");
    console.log(`Index: ${indexPath}`);
    expect(fs.existsSync(indexPath)).toBe(true);
  });
});
