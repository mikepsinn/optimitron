#!/usr/bin/env node
/**
 * preview-shot.mjs — capture screenshots of routes on a live Vercel PREVIEW
 * deploy. Fills the gap the visual-review toolchain doesn't cover: it targets
 * a deployed preview (not local dev, not the full before/after variant matrix),
 * handling the preview's auth + protection.
 *
 * Local dev often can't run here (no root .env / DB), so previews are the only
 * way to render a branch. A preview is (a) protected by Vercel deployment
 * protection — pass the `_vercel_share` token from
 * `get_access_to_vercel_url` / the Vercel dashboard; (b) served as the
 * warondisease variant by default — the `optimitron_site_key` cookie forces the
 * optimitron variant; (c) gated by auth — `?login=demo` signs in the demo user.
 *
 * Usage:
 *   node scripts/preview-shot.mjs \
 *     --origin https://optimitron-web-git-<branch>-<team>.vercel.app \
 *     --route /dashboard --route /collections \
 *     --share <vercel-share-token> \
 *     [--login demo] [--site optimitron] [--viewports desktop,mobile] [--out <dir>]
 *
 * Screenshots land in output/playwright/review/<out> (out defaults to "preview").
 * Requires @playwright/test (already a dev dependency; run from apps/optimitron).
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VIEWPORTS = {
  desktop: { height: 900, width: 1440 },
  mobile: { height: 844, width: 390 },
};

function parseArgs(argv) {
  const opts = { routes: [], viewports: ["desktop", "mobile"], login: null, share: null, site: "optimitron", out: "preview", origin: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => {
      const value = argv[++i];
      if (value === undefined) {
        console.error(`missing value for ${arg}`);
        process.exit(1);
      }
      return value;
    };
    if (arg === "--origin") opts.origin = next();
    else if (arg === "--route") opts.routes.push(next());
    else if (arg === "--share") opts.share = next();
    else if (arg === "--login") opts.login = next();
    else if (arg === "--site") opts.site = next();
    else if (arg === "--out") opts.out = next();
    else if (arg === "--viewports") opts.viewports = next().split(",").map((v) => v.trim()).filter(Boolean);
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
if (!opts.origin || opts.routes.length === 0) {
  console.error("usage: node scripts/preview-shot.mjs --origin <url> --route <path> [--route ...] [--share TOKEN] [--login demo] [--site optimitron] [--viewports desktop,mobile] [--out <dir>]");
  process.exit(1);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(scriptDir, "..", "output", "playwright", "review", opts.out);
fs.mkdirSync(outDir, { recursive: true });

function routeSlug(route) {
  // Slug from the path only, so query/hash don't leak into filenames.
  const pathname = new URL(route, opts.origin).pathname;
  return pathname.replace(/^\/+|\/+$/g, "").replace(/[^\w.-]+/g, "-") || "home";
}

// Build the target URL with the URL API so a route with/without a leading
// slash, an existing query, or a hash all resolve correctly against origin.
function targetUrl(route) {
  const url = new URL(route, opts.origin);
  if (opts.login) url.searchParams.set("login", opts.login);
  return url.toString();
}

(async () => {
  const hostname = new URL(opts.origin).hostname;
  const browser = await chromium.launch();
  try {
    for (const vpName of opts.viewports) {
      const viewport = VIEWPORTS[vpName];
      if (!viewport) {
        console.error(`unknown viewport "${vpName}" (use desktop|mobile)`);
        continue;
      }
      const context = await browser.newContext({ viewport });
      if (opts.site) {
        await context.addCookies([
          { domain: hostname, name: "optimitron_site_key", path: "/", value: opts.site },
        ]);
      }
      const page = await context.newPage();
      // Visiting with the share token sets the deployment-protection cookie.
      if (opts.share) {
        const shareUrl = new URL("/", opts.origin);
        shareUrl.searchParams.set("_vercel_share", opts.share);
        await page.goto(shareUrl.toString(), { timeout: 90000, waitUntil: "domcontentloaded" });
      }
      for (const route of opts.routes) {
        const url = targetUrl(route);
        console.log(`[${vpName}] ${url}`);
        await page.goto(url, { timeout: 90000, waitUntil: "networkidle" });
        await page.waitForTimeout(1200);
        const file = path.join(outDir, `${routeSlug(route)}-${vpName}.png`);
        await page.screenshot({ path: file, fullPage: vpName === "desktop" });
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  console.log("done:", outDir);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
