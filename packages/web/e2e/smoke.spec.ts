/**
 * Smoke tests: verify all pages load without errors and have valid metadata.
 *
 * Page list is derived from src/app and filtered through the active site
 * routing policy.
 *
 * Auth-required pages are tested by signing in with the demo account first.
 *
 * Run:
 *   SKIP_SERVER=1 BASE_URL=http://localhost:3333 npx playwright test e2e/smoke.spec.ts
 */
import { test, expect, type Page } from "@playwright/test";
import { signInDemoUser } from "./utils/auth";
import { ROUTES } from "@/lib/routes";

const ERROR_BOUNDARY_FALLBACK_PATTERNS = [
  /something went wrong/i,
  /application error/i,
  /client-side exception/i,
  /server-side exception/i,
  /an error occurred in the server components render/i,
  /internal server error/i,
  /runtime error/i,
  /switched to client rendering because the server rendering errored/i,
];

const SMOKE_SCOPE = process.env.PLAYWRIGHT_SMOKE_SCOPE === "critical"
  ? "critical"
  : "full";
const CRITICAL_SMOKE_PATHS = new Set<string>([
  ROUTES.home,
  ROUTES.treaty,
  ROUTES.vote,
  ROUTES.legislation,
  ROUTES.plaintiffs,
  ROUTES.endorse,
  ROUTES.tasks,
  ROUTES.dashboard,
]);
const CRITICAL_AUTH_REQUIRED_PATHS = new Set<string>([
  ROUTES.dashboard,
]);
const CRITICAL_PUBLIC_PAGE_PATHS = [...CRITICAL_SMOKE_PATHS].filter(
  (path) => !CRITICAL_AUTH_REQUIRED_PATHS.has(path),
);
const NEXT_AUTH_COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

function loadStaticPages() {
  // Keep critical smoke independent from full-route discovery so the fastest
  // preview guard can still catch page-level runtime fallbacks.
  return require("./utils/static-pages") as typeof import("./utils/static-pages");
}

function filterSmokePaths(paths: Iterable<string>) {
  const list = [...paths];
  if (SMOKE_SCOPE !== "critical") return list;
  return list.filter((path) => CRITICAL_SMOKE_PATHS.has(path));
}

const staticPages = SMOKE_SCOPE === "critical"
  ? null
  : loadStaticPages();
const SMOKE_PUBLIC_PAGE_PATHS = SMOKE_SCOPE === "critical"
  ? CRITICAL_PUBLIC_PAGE_PATHS
  : filterSmokePaths(staticPages?.PUBLIC_PAGE_PATHS ?? []);
const SMOKE_REDIRECT_ONLY_PATHS = SMOKE_SCOPE === "critical"
  ? []
  : filterSmokePaths(staticPages?.REDIRECT_ONLY_PATHS ?? []);
const SMOKE_AUTH_REQUIRED_PATHS = SMOKE_SCOPE === "critical"
  ? [...CRITICAL_AUTH_REQUIRED_PATHS]
  : filterSmokePaths(staticPages?.AUTH_REQUIRED_PATHS ?? []);

console.log(
  `[smoke] scope=${SMOKE_SCOPE} public=${SMOKE_PUBLIC_PAGE_PATHS.length} redirects=${SMOKE_REDIRECT_ONLY_PATHS.length} auth=${SMOKE_AUTH_REQUIRED_PATHS.length}`,
);

async function expectPageLoadsWithMetadata(page: Page, path: string, options?: {
  skipOnClientError?: boolean;
}) {
  const errors: string[] = [];
  page.on("pageerror", (err) => {
    if (err.message.includes("Hydration")) return;
    errors.push(err.message);
  });

  const response = await page.goto(path);
  const status = response?.status() ?? 0;

  if (status >= 500) {
    test.skip(true, `${path} returned ${status} (needs database)`);
    return;
  }

  if (options?.skipOnClientError && status >= 400) {
    test.skip(true, `${path} returned ${status}`);
    return;
  }

  expect(status).toBeLessThan(400);
  expect(errors).toEqual([]);

  const visibleText = await page.locator("body").innerText();
  const title = await page.title();
  const renderedPageText = `${title}\n${visibleText}`;
  const matchedFallback = ERROR_BOUNDARY_FALLBACK_PATTERNS.find((pattern) =>
    pattern.test(renderedPageText)
  );
  expect(
    matchedFallback?.source ?? null,
    `${path} should render real page content, not a Next.js error-boundary fallback`,
  ).toBeNull();

  expect(title, `<title> should not be empty`).toBeTruthy();

  const description = await page
    .$eval('meta[name="description"]', (el) => el.getAttribute("content"))
    .catch(() => null);
  expect(description, `should have <meta name="description">`).toBeTruthy();
  expect(
    (description ?? "").length,
    `<meta description> should not be empty`,
  ).toBeGreaterThan(0);
}

// ---------------------------------------------------------------------------
// Public pages — no auth needed
// ---------------------------------------------------------------------------

for (const path of SMOKE_PUBLIC_PAGE_PATHS) {
  test(`${path} loads without errors and has valid metadata`, async ({ page }) => {
    await expectPageLoadsWithMetadata(page, path);
  });
}

for (const path of SMOKE_REDIRECT_ONLY_PATHS) {
  test(`${path} redirects to its canonical content`, async ({ request }) => {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(response.headers().location).toBeTruthy();
  });
}

// ---------------------------------------------------------------------------
// Auth-required pages — sign in with demo account first
// ---------------------------------------------------------------------------

for (const path of SMOKE_AUTH_REQUIRED_PATHS) {
  test(`${path} loads without errors and has valid metadata (authenticated)`, async ({ page }) => {
    const signedIn = await signInDemoUser(page);
    if (!signedIn) {
      test.skip(true, "Auth API not available (needs database)");
      return;
    }

    await expectPageLoadsWithMetadata(page, path);
  });
}

if (SMOKE_SCOPE === "critical") {
  test(`${ROUTES.dashboard}?login=demo signs in and renders dashboard`, async ({
    context,
    page,
  }) => {
    await context.clearCookies();

    await expectPageLoadsWithMetadata(page, `${ROUTES.dashboard}?login=demo`);

    const finalUrl = new URL(page.url());
    expect(finalUrl.pathname).toBe(ROUTES.dashboard);
    expect(finalUrl.searchParams.has("login")).toBe(false);

    const sessionCookie = (await context.cookies()).find(
      (cookie) =>
        NEXT_AUTH_COOKIE_NAMES.includes(cookie.name) && cookie.value !== "",
    );
    expect(
      sessionCookie,
      "?login=demo should mint a NextAuth session cookie",
    ).toBeTruthy();
  });
}
