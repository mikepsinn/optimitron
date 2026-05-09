#!/usr/bin/env tsx
/**
 * render-pages-to-markdown.ts
 *
 * Visits each public route on the running dev server (port 3001 by
 * default), extracts the visible text from <main>, writes per-route
 * markdown files next to the matching `page.tsx` so you can preview
 * what each page actually says before committing.
 *
 * Output paths:
 *   src/app/treaty/page.tsx   -> src/app/treaty/page.md
 *   src/app/page.tsx (root)   -> src/app/page.md
 *   src/app/[a]/[b]/page.tsx  -> src/app/[a]/[b]/page.md  (best-effort)
 *
 * The generated `page.md` files are deterministic copy inventory files.
 * Authenticated `page.authed.md` files are local-only and gitignored.
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
import { getRouteReviewSpecs } from "../src/lib/routes";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, "..");
const APP_DIR = path.resolve(WEB_ROOT, "src/app");

const BASE = process.env.PREVIEW_BASE_URL ?? "http://127.0.0.1:3001";
const SITE_KEY = process.env.PREVIEW_SITE_KEY ?? "warOnDisease";

const DEFAULT_LOGGED_OUT_ROUTES = getRouteReviewSpecs("copyPreview").map(
  (spec) => spec.path,
);
const DEFAULT_AUTHENTICATED_ROUTES = getRouteReviewSpecs(
  "authenticatedCopyPreview",
).map((spec) => spec.path);

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
  const routes = arg
    .slice("--routes=".length)
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
  return {
    authenticatedRoutes: routes,
    loggedOutRoutes: routes,
  };
}

function routeToFilePath(route: string): string {
  // "/"        -> src/app/page.md
  // "/treaty"  -> src/app/treaty/page.md
  // "/a/b"     -> src/app/a/b/page.md
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
  const outPath = path.resolve(APP_DIR, ...segments, "page.md");
  const relative = path.relative(APP_DIR, outPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Resolved path escapes app dir for route "${route}"`);
  }
  return outPath;
}

async function extractPage(page: import("@playwright/test").Page, route: string) {
  await page.goto(`${BASE}${route}`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await page.waitForTimeout(400);
  return page.evaluate(() => {
    const root = document.querySelector("main") ?? document.body;
    const tags =
      "h1,h2,h3,h4,h5,h6,p,li,button,a,blockquote,td,th,figcaption,summary,label,span";
    const seen = new Set<string>();
    const out: string[] = [];
    for (const el of Array.from(root.querySelectorAll(tags))) {
      const text = (el as HTMLElement).innerText
        ?.replace(/\s+/g, " ")
        .trim();
      if (!text || text.length < 2) continue;
      if (seen.has(text)) continue;
      // Skip nodes whose text equals a child's text (avoids dupes).
      const childTexts = Array.from(el.children).map((c) =>
        (c as HTMLElement).innerText?.replace(/\s+/g, " ").trim(),
      );
      if (childTexts.some((t) => t === text)) continue;
      seen.add(text);
      const tag = el.tagName.toLowerCase();
      const headerLevel = tag.match(/^h([1-6])$/)?.[1];
      const prefix = headerLevel
        ? `${"#".repeat(Math.min(6, Number(headerLevel) + 1))} `
        : "- ";
      out.push(prefix + text);
    }
    return out.join("\n");
  });
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
  filename: "page.md" | "page.authed.md",
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
  try {
    for (const route of routes) {
      const dir = path.dirname(routeToFilePath(route));
      const outPath = path.join(dir, filename);
      try {
        const md = await extractPage(page, route);
        await mkdir(dir, { recursive: true });
        // Deterministic: route as the only header. No timestamps, no
        // capture metadata — every regeneration produces the same
        // bytes for unchanged copy, so PR diffs only show real changes.
        const header = `# ${route}\n\n`;
        await writeFile(outPath, header + md + "\n", "utf8");
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

async function main() {
  const { authenticatedRoutes, loggedOutRoutes } = parseRoutesFromArgs();
  const skipAuthed = process.argv.includes("--no-authed");
  const browser = await chromium.launch();
  let failures = 0;
  try {
    console.log("--- Logged-out pass ---");
    failures += await capturePass(browser, loggedOutRoutes, "page.md");

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
        failures += await capturePass(browser, authenticatedRoutes, "page.authed.md", {
          authCookie,
        });
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
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
