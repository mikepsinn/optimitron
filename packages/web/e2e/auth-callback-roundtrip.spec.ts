/**
 * Auth-gated request → sign-in retains the callback → authenticated revisit.
 *
 * Guards the server-side redirect and callback handoff. The test signs in via
 * the credentials API, then revisits the captured callback on the same origin.
 *
 * Also covers MCP OAuth consent: cold `/mcp/authorize` → sign-in keeps OAuth
 * params in `callbackUrl` → return to consent → Authorize issues a code.
 *
 * Uses credentials API login (not the Try Demo button) so CI production builds
 * pass when `isDemoLoginEnabled` is false. AuthForm's demo path does the same
 * credentials sign-in then navigates to `callbackUrl`.
 *
 * Requires: seeded demo credentials (`prisma db seed`).
 *
 * Run:
 *   pnpm --filter @optimitron/web run e2e -- smoke --grep "auth-gated request|MCP authorize"
 */
import { test, expect, type Page } from "@playwright/test";
import { signInDemoUser } from "./utils/auth";

const DASHBOARD_TARGET = "/dashboard?from=auth-callback-roundtrip";
const OAUTH_REDIRECT_ORIGIN = "http://127.0.0.1:34567";
const OAUTH_REDIRECT_URI = `${OAUTH_REDIRECT_ORIGIN}/oauth-callback`;
const OAUTH_STATE = "e2e-mcp-authorize-state";
// RFC 7636 appendix B example challenge (consent stores it; token exchange not tested here).
const OAUTH_CODE_CHALLENGE = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

function pathAndSearch(urlLike: string, base: string): string {
  const url = new URL(urlLike, base);
  return `${url.pathname}${url.search}`;
}

async function readSignInCallbackUrl(page: Page): Promise<string> {
  await page.waitForURL(/\/auth\/signin/, { timeout: 15_000 });

  const signInUrl = new URL(page.url());
  expect(signInUrl.pathname).toBe("/auth/signin");

  const callbackUrl = signInUrl.searchParams.get("callbackUrl");
  expect(callbackUrl).toBeTruthy();
  return callbackUrl!;
}

function skipLocallyOrFailInCi(reason: string): void {
  if (process.env.CI) throw new Error(reason);
  test.skip(true, reason);
}

test("auth-gated request preserves callbackUrl for an authenticated revisit", async ({
  page,
}) => {
  const response = await page.goto(DASHBOARD_TARGET);
  if ((response?.status() ?? 0) >= 500) {
    skipLocallyOrFailInCi("Database unavailable for auth callback test");
    return;
  }

  const callbackUrl = await readSignInCallbackUrl(page);
  expect(pathAndSearch(callbackUrl, page.url())).toBe(DASHBOARD_TARGET);

  const signedIn = await signInDemoUser(page);
  if (!signedIn) {
    skipLocallyOrFailInCi("Seeded demo credentials are unavailable");
    return;
  }

  // Revisit the server-provided callback on the authenticated browser context.
  await page.goto(pathAndSearch(callbackUrl, page.url()));

  await expect(page).not.toHaveURL(/\/auth\/signin/, { timeout: 15_000 });

  const landed = new URL(page.url());
  expect(landed.pathname).toBe("/dashboard");
  expect(landed.searchParams.get("from")).toBe("auth-callback-roundtrip");
});

test("MCP authorize preserves the login callback and returns an OAuth code", async ({
  page,
}) => {
  // Serve the OAuth client redirect so Authorize's window.location navigation
  // does not hang on a closed port.
  await page.route(`${OAUTH_REDIRECT_ORIGIN}/**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/plain",
      body: "oauth-callback-ok",
    });
  });

  const register = await page.request.post("/api/mcp/oauth/register", {
    data: {
      client_name: "E2E MCP Authorize",
      redirect_uris: [OAUTH_REDIRECT_URI],
      grant_types: ["authorization_code"],
      scope: "tasks:personal",
    },
  });
  if (register.status() >= 500) {
    skipLocallyOrFailInCi("Database unavailable for MCP authorize test");
    return;
  }
  expect(register.status()).toBe(201);
  const registration = (await register.json()) as { client_id?: string };
  expect(registration.client_id).toBeTruthy();

  const authorizePath =
    `/mcp/authorize` +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(registration.client_id!)}` +
    `&redirect_uri=${encodeURIComponent(OAUTH_REDIRECT_URI)}` +
    `&code_challenge=${encodeURIComponent(OAUTH_CODE_CHALLENGE)}` +
    `&code_challenge_method=S256` +
    `&state=${encodeURIComponent(OAUTH_STATE)}` +
    `&scope=${encodeURIComponent("tasks:personal")}` +
    `&client_name=${encodeURIComponent("E2E MCP Authorize")}`;

  const response = await page.goto(authorizePath);
  if ((response?.status() ?? 0) >= 500) {
    skipLocallyOrFailInCi("Database unavailable for MCP authorize page");
    return;
  }

  const callbackUrl = await readSignInCallbackUrl(page);
  // Must be same-origin relative so localhost vs 127.0.0.1 does not drop cookies.
  expect(callbackUrl.startsWith("/mcp/authorize?")).toBe(true);
  expect(callbackUrl).not.toMatch(/^https?:\/\//);

  const callback = new URL(callbackUrl, page.url());
  expect(callback.pathname).toBe("/mcp/authorize");
  expect(callback.searchParams.get("client_id")).toBe(registration.client_id);
  expect(callback.searchParams.get("redirect_uri")).toBe(OAUTH_REDIRECT_URI);
  expect(callback.searchParams.get("code_challenge")).toBe(
    OAUTH_CODE_CHALLENGE,
  );
  expect(callback.searchParams.get("state")).toBe(OAUTH_STATE);
  expect(callback.searchParams.get("scope")).toBe("tasks:personal");

  const signedIn = await signInDemoUser(page);
  if (!signedIn) {
    skipLocallyOrFailInCi("Seeded demo credentials are unavailable");
    return;
  }

  await page.goto(pathAndSearch(callbackUrl, page.url()));

  await expect(page).not.toHaveURL(/\/auth\/signin/);
  await expect(page.locator("#mcp-authorize-heading")).toBeVisible({
    timeout: 15_000,
  });

  const authorizeButton = page.getByRole("button", { name: "Authorize" });
  await expect(authorizeButton).toBeEnabled({ timeout: 10_000 });

  await Promise.all([
    page.waitForURL(
      (url) =>
        url.origin === OAUTH_REDIRECT_ORIGIN &&
        url.searchParams.has("code") &&
        url.searchParams.get("state") === OAUTH_STATE,
      { timeout: 15_000 },
    ),
    authorizeButton.click(),
  ]);

  const redirected = new URL(page.url());
  expect(redirected.origin).toBe(OAUTH_REDIRECT_ORIGIN);
  expect(redirected.searchParams.get("code")).toBeTruthy();
  expect(redirected.searchParams.get("state")).toBe(OAUTH_STATE);
});
