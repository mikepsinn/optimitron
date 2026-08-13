#!/usr/bin/env tsx
/**
 * render-pages-to-markdown.ts
 *
 * Visits each public route on the running dev server (port 3001 by
 * default), extracts the visible text from <main>, writes per-route
 * markdown files next to the matching `page.tsx` so you can preview
 * page metadata and visible copy before committing.
 *
 * Output paths:
 *   src/app/treaty/page.tsx   -> src/app/treaty/page.logged-out.md
 *   src/app/page.tsx (root)   -> src/app/page.logged-out.md
 *   src/app/[a]/[b]/page.tsx  -> src/app/[a]/[b]/page.logged-out.md  (best-effort)
 *
 * The generated `page.logged-out.md` files are deterministic copy inventory files.
 * Authenticated `page.logged-in.md` files are local-only and gitignored.
 * CI sets COPY_PREVIEW_OUTPUT_ROOT to keep both kinds inside its review artifact.
 *
 * Usage:
 *   pnpm --filter @optimitron/web copy:preview
 *   pnpm --filter @optimitron/web copy:preview -- --routes=/,/treaty
 */

import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mintDemoSessionCookie } from "./mint-demo-session";
import { extractVisibleCopyMarkdown } from "../../../scripts/lib/copy-preview-dom";
import { buildCopyPreviewMarkdown } from "../src/lib/copy-preview-markdown";
import type { CopyPreviewMetadata } from "../src/lib/copy-preview-markdown";
import { isRedirectOnlyRoutePath } from "../src/lib/redirect-review";
import { getRouteReviewSpecs } from "../src/lib/routes";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, "..");
const APP_DIR = path.resolve(WEB_ROOT, "src/app");
const OUTPUT_ROOT = process.env.COPY_PREVIEW_OUTPUT_ROOT
  ? path.resolve(WEB_ROOT, process.env.COPY_PREVIEW_OUTPUT_ROOT)
  : APP_DIR;

const BASE = process.env.PREVIEW_BASE_URL ?? "http://127.0.0.1:3001";
const SITE_KEY = process.env.PREVIEW_SITE_KEY ?? "warOnDisease";
const ROUTES_PER_BROWSER = Math.max(
  1,
  Number.parseInt(process.env.COPY_PREVIEW_ROUTES_PER_BROWSER ?? "8", 10) || 8,
);

const DEFAULT_LOGGED_OUT_ROUTES = filterRedirectOnlyRoutes(
  dedupeRoutes([
    ...getRouteReviewSpecs("copyPreview").map((spec) => spec.path),
    ...getRouteReviewSpecs("screenshot").map((spec) => spec.path),
  ]),
);
const DEFAULT_AUTHENTICATED_ROUTES = filterRedirectOnlyRoutes(
  dedupeRoutes([
    ...getRouteReviewSpecs("authenticatedCopyPreview").map((spec) => spec.path),
    ...getRouteReviewSpecs("authenticatedScreenshot").map((spec) => spec.path),
  ]),
);
const DEFAULT_AUTHENTICATED_ROUTE_SET = new Set(DEFAULT_AUTHENTICATED_ROUTES);
const GLOBAL_LOADING_TEXT = [
  "Booting Earth Optimization System",
  "Your civilization is very important to us.",
];
const COPY_CAPTURE_PATH_OVERRIDE_BY_PATH = new Map<string, string>([
  ["/calendar", "/calendar?date=2036-01-01"],
]);

function dedupeRoutes(routes: string[]) {
  return [...new Set(routes)];
}

function parseRoutesFromArgs(): {
  authenticatedRoutes: string[];
  loggedOutRoutes: string[];
} {
  const arg = process.argv.find((a) => a.startsWith("--routes="));
  if (!arg) {
    return {
      authenticatedRoutes: DEFAULT_AUTHENTICATED_ROUTES,
      loggedOutRoutes: DEFAULT_LOGGED_OUT_ROUTES,
    };
  }
  const routes = filterRedirectOnlyRoutes(
    arg
      .slice("--routes=".length)
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean),
  );
  return {
    authenticatedRoutes: routes.filter((route) =>
      DEFAULT_AUTHENTICATED_ROUTE_SET.has(route),
    ),
    loggedOutRoutes: routes,
  };
}

function filterRedirectOnlyRoutes(routes: string[]): string[] {
  return routes.filter((route) => !isRedirectOnlyRoutePath(route));
}

function routeToDirPath(route: string): string {
  // "/"        -> src/app
  // "/treaty"  -> src/app/treaty
  // "/a/b"     -> src/app/a/b
  if (!route.startsWith("/")) {
    throw new Error(`Route must start with "/": ${route}`);
  }
  const pathname = route.split(/[?#]/, 1)[0] ?? "/";
  const segments = pathname === "/" ? [] : pathname.split("/").filter(Boolean);
  if (
    segments.some(
      (segment) =>
        segment === "." ||
        segment === ".." ||
        segment.includes("\\") ||
        path.isAbsolute(segment),
    )
  ) {
    throw new Error(`Invalid route segment in "${route}"`);
  }
  const outPath = path.resolve(OUTPUT_ROOT, ...segments);
  const relative = path.relative(OUTPUT_ROOT, outPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Resolved path escapes app dir for route "${route}"`);
  }
  return outPath;
}

async function getHeadAttribute(
  page: import("@playwright/test").Page,
  selector: string,
  attribute: "content" | "href",
): Promise<string | null> {
  const value = await page
    .locator(selector)
    .first()
    .getAttribute(attribute)
    .catch(() => null);
  const cleaned = value?.replace(/\s+/g, " ").trim();
  return cleaned && cleaned.length > 0 ? cleaned : null;
}

async function extractPageMetadata(
  page: import("@playwright/test").Page,
): Promise<CopyPreviewMetadata> {
  const title = await page.title();
  const cleanedTitle = title.replace(/\s+/g, " ").trim();

  return {
    canonical: await getHeadAttribute(page, 'link[rel="canonical"]', "href"),
    description: await getHeadAttribute(
      page,
      'meta[name="description"]',
      "content",
    ),
    openGraphDescription: await getHeadAttribute(
      page,
      'meta[property="og:description"]',
      "content",
    ),
    openGraphImage: await getHeadAttribute(
      page,
      'meta[property="og:image"]',
      "content",
    ),
    openGraphTitle: await getHeadAttribute(
      page,
      'meta[property="og:title"]',
      "content",
    ),
    title: cleanedTitle.length > 0 ? cleanedTitle : null,
    twitterDescription: await getHeadAttribute(
      page,
      'meta[name="twitter:description"]',
      "content",
    ),
    twitterTitle: await getHeadAttribute(
      page,
      'meta[name="twitter:title"]',
      "content",
    ),
  };
}

async function extractPage(
  page: import("@playwright/test").Page,
  route: string,
): Promise<{
  bodyMarkdown: string;
  metadata: CopyPreviewMetadata;
  redirectedFromStatus: number | null;
}> {
  // Three failure modes recur on this DB-shared / Next-streaming setup:
  //  1. The route hits a transient 404 (dev-server compile mid-flight,
  //     Neon DB blip, or other race) and we capture "PAGE NOT FOUND".
  //  2. domcontentloaded fires before <head> meta tags hydrate, so the
  //     metadata extraction returns null for every field.
  //  3. Heavy pages (large datasets, many DB queries) get ERR_CONNECTION_RESET,
  //     ERR_ABORTED, or never reach networkidle (continuous background polling).
  //     Strategy: retry connection errors after a pause; on final retry fall back
  //     to "load" so we capture rendered content even if requests keep running.
  const isRetryableNavError = (err: unknown): boolean => {
    const msg = err instanceof Error ? err.message : String(err);
    return (
      msg.includes("ERR_CONNECTION_RESET") ||
      msg.includes("ERR_ABORTED") ||
      msg.includes("ERR_EMPTY_RESPONSE") ||
      msg.includes("net::ERR_") ||
      msg.includes("Timeout")
    );
  };
  const tryExtract = async (
    settleMs: number,
    waitUntil: "networkidle" | "load" = "networkidle",
  ) => {
    const response = await page.goto(`${BASE}${route}`, {
      waitUntil,
      timeout: 60000,
    });
    const status = response?.status() ?? null;
    const redirectedFromRequest = response?.request().redirectedFrom();
    const redirectedFromResponse = redirectedFromRequest
      ? await redirectedFromRequest.response()
      : null;
    const redirectedFromStatus = redirectedFromResponse
      ? redirectedFromResponse.status()
      : null;
    await waitForGlobalLoaderToClear(page, route);
    await page.waitForTimeout(settleMs);
    return { status, redirectedFromStatus };
  };
  let navResult: Awaited<ReturnType<typeof tryExtract>>;
  const NAV_RETRIES = 2;
  for (let attempt = 0; ; attempt++) {
    // Final retry: fall back to "load" for pages that never reach networkidle.
    const waitUntil = attempt === NAV_RETRIES ? "load" : "networkidle";
    try {
      navResult = await tryExtract(
        attempt === NAV_RETRIES ? 2000 : 400,
        waitUntil,
      );
      break;
    } catch (err) {
      if (isRetryableNavError(err) && attempt < NAV_RETRIES) {
        console.warn(
          `  retry ${attempt + 1}/${NAV_RETRIES} for ${route} (${err instanceof Error ? err.message.split("\n")[0] : err})`,
        );
        await page.waitForTimeout(3000);
        continue;
      }
      throw err;
    }
  }
  let { redirectedFromStatus, status } = navResult!;
  let metadata = await extractPageMetadata(page);
  let bodyText = await page
    .locator("body")
    .innerText()
    .catch(() => "");
  const allMetaMissing =
    !metadata.title &&
    !metadata.description &&
    !metadata.canonical &&
    !metadata.openGraphTitle;
  const bodyLooks404 = /page not found|404/i.test(bodyText.slice(0, 500));
  if (allMetaMissing || bodyLooks404) {
    // Re-capture status too: the snapshot is built from THIS navigation, so
    // the 5xx guard below and the redirect marker must describe it, not the
    // first attempt (a transient 5xx that recovers would false-positive; a
    // 200 that turns 5xx on retry would slip past).
    ({ redirectedFromStatus, status } = await tryExtract(2000));
    metadata = await extractPageMetadata(page);
    bodyText = await page
      .locator("body")
      .innerText()
      .catch(() => "");
  }
  // A 5xx or a page with zero metadata is a broken render (dev-server error
  // overlay, import crash, mid-compile). Writing a snapshot from it would
  // silently replace real copy with "[missing]" placeholders — refuse loudly
  // instead so the run fails and the log says what to fix.
  const stillAllMetaMissing =
    !metadata.title &&
    !metadata.description &&
    !metadata.canonical &&
    !metadata.openGraphTitle;
  if ((status !== null && status >= 500) || stillAllMetaMissing) {
    const excerpt = bodyText.replace(/\s+/g, " ").trim().slice(0, 300);
    throw new Error(
      `broken render (HTTP ${status ?? "?"}; metadata ${
        stillAllMetaMissing ? "all missing" : "present"
      }) — snapshot NOT written. Body starts: "${excerpt}". Fix the page or dev server, then rerun copy:preview.`,
    );
  }
  const bodyMarkdown = await page.evaluate(extractVisibleCopyMarkdown);

  return { bodyMarkdown, metadata, redirectedFromStatus };
}

async function waitForGlobalLoaderToClear(
  page: import("@playwright/test").Page,
  route: string,
): Promise<void> {
  const hasLoadingText = (bodyText: string) => {
    const normalizedBody = bodyText.toLowerCase();
    return GLOBAL_LOADING_TEXT.some((text) =>
      normalizedBody.includes(text.toLowerCase()),
    );
  };

  try {
    await page.waitForFunction(
      (loadingText) => {
        const bodyText = (document.body.innerText ?? "").toLowerCase();
        return loadingText.every(
          (text: string) => !bodyText.includes(text.toLowerCase()),
        );
      },
      GLOBAL_LOADING_TEXT,
      { timeout: 30_000 },
    );
  } catch {
    const bodyText = await page
      .locator("body")
      .innerText()
      .catch(() => "");
    if (hasLoadingText(bodyText)) {
      const excerpt = bodyText.replace(/\s+/g, " ").trim().slice(0, 300);
      throw new Error(
        `global loader still visible after 30s on ${route}; snapshot NOT written. Body starts: "${excerpt}". Fix the slow render or add a route-specific readiness signal before regenerating markdown.`,
      );
    }
  }
}

function cookieDomainFromBase(): string {
  // Playwright's addCookies needs a domain. For localhost/127.0.0.1
  // strip the protocol + port and use the hostname directly.
  try {
    const url = new URL(BASE);
    return url.hostname;
  } catch {
    return "127.0.0.1";
  }
}

async function capturePass(
  browser: import("@playwright/test").Browser,
  routes: string[],
  filename: "page.logged-out.md" | "page.logged-in.md",
  options: { authCookie?: { name: string; value: string } } = {},
): Promise<number> {
  let failures = 0;
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    extraHTTPHeaders: { "x-optimitron-site-key": SITE_KEY },
  });
  if (options.authCookie) {
    await ctx.addCookies([
      {
        name: options.authCookie.name,
        value: options.authCookie.value,
        domain: cookieDomainFromBase(),
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
  }
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(window, "__OPTIMITRON_COPY_PREVIEW__", {
      value: true,
      configurable: true,
    });
  });
  try {
    for (const route of routes) {
      const dir = routeToDirPath(route);
      const outPath = path.join(dir, filename);
      try {
        const captureRoute =
          COPY_CAPTURE_PATH_OVERRIDE_BY_PATH.get(route) ?? route;
        const extracted = await extractPage(page, captureRoute);
        await mkdir(dir, { recursive: true });
        // When the route returned 3xx (typically auth-required pages
        // redirecting logged-out users to /signin or the campaign root),
        // prepend a marker so the snapshot is self-documenting. Without
        // this, the .md just shows the redirect-target content + the
        // target's metadata, which is confusing without context.
        const redirectMarker = extracted.redirectedFromStatus
          ? `> Route returned HTTP ${extracted.redirectedFromStatus}; snapshot below captures the redirect target (typically the logged-out fallback page for an auth-required route).\n\n`
          : "";
        const markdown = buildCopyPreviewMarkdown({
          bodyMarkdown: redirectMarker + extracted.bodyMarkdown,
          metadata: extracted.metadata,
          route,
        });
        await writeFile(outPath, markdown, "utf8");
        console.log(`OK ${route}  ->  ${path.relative(WEB_ROOT, outPath)}`);
      } catch (err) {
        failures += 1;
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`FAIL ${route}  (${message})`);
      }
    }
    return failures;
  } finally {
    await ctx.close();
  }
}

async function captureRoutes(
  routes: string[],
  filename: "page.logged-out.md" | "page.logged-in.md",
  options: { authCookie?: { name: string; value: string } } = {},
): Promise<number> {
  let failures = 0;
  for (let index = 0; index < routes.length; index += ROUTES_PER_BROWSER) {
    const batch = routes.slice(index, index + ROUTES_PER_BROWSER);
    const browser = await chromium.launch(
      process.env.PLAYWRIGHT_BROWSER_CHANNEL === "chrome"
        ? { channel: "chrome" }
        : undefined,
    );
    try {
      failures += await capturePass(browser, batch, filename, options);
    } finally {
      await browser.close();
    }
  }
  return failures;
}

async function main() {
  const { authenticatedRoutes, loggedOutRoutes } = parseRoutesFromArgs();
  const skipAuthed = process.argv.includes("--no-authed");
  let failures = 0;
  console.log("--- Logged-out pass ---");
  failures += await captureRoutes(loggedOutRoutes, "page.logged-out.md");

  if (skipAuthed) {
    console.log("\n(--no-authed; skipping authenticated pass)");
  } else if (authenticatedRoutes.length === 0) {
    console.log("\n(no authenticated copy-preview routes configured)");
  } else {
    try {
      const authCookie = await mintDemoSessionCookie();
      console.log(
        `\n--- Authenticated pass (cookie minted offline for ${process.env.COPY_PREVIEW_USER_EMAIL ?? "m@thinkbynumbers.org"}) ---`,
      );
      failures += await captureRoutes(
        authenticatedRoutes,
        "page.logged-in.md",
        {
          authCookie,
        },
      );
    } catch (err) {
      failures += authenticatedRoutes.length;
      const message = err instanceof Error ? err.message : String(err);
      console.warn(
        `\n(skipping authenticated pass: ${message})\n` +
          `Set NEXTAUTH_SECRET in .env and ensure the demo user exists, ` +
          `or pass --no-authed to silence this.`,
      );
    }
  }
  if (failures > 0) {
    throw new Error(`Copy preview failed for ${failures} route(s).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
