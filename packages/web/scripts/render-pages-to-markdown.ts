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
 * The generated `page.md` files are gitignored; local preview only.
 *
 * Usage:
 *   pnpm --filter @optimitron/web copy:preview
 *   pnpm --filter @optimitron/web copy:preview -- --routes=/,/treaty
 */

import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, "..");
const APP_DIR = path.resolve(WEB_ROOT, "src/app");

const BASE = process.env.PREVIEW_BASE_URL ?? "http://127.0.0.1:3001";
const SITE_KEY = process.env.PREVIEW_SITE_KEY ?? "warOnDisease";

// Public surfaces. Edit this list as the site grows.
const DEFAULT_ROUTES = [
  "/",
  "/vote",
  "/treaty",
  "/why",
  "/scoreboard",
  "/humanity-v-government",
  "/plaintiffs",
  "/court",
  "/donate",
  "/endorse",
  "/prize",
  "/iab",
  "/tasks",
  "/agencies",
  "/governments",
  "/politicians",
  "/wishonia",
  "/opg",
  "/obg",
  "/about",
];

function parseRoutesFromArgs(): string[] {
  const arg = process.argv.find((a) => a.startsWith("--routes="));
  if (!arg) return DEFAULT_ROUTES;
  return arg
    .slice("--routes=".length)
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
}

function routeToFilePath(route: string): string {
  // "/"        -> src/app/page.md
  // "/treaty"  -> src/app/treaty/page.md
  // "/a/b"     -> src/app/a/b/page.md
  const segments = route === "/" ? [] : route.split("/").filter(Boolean);
  return path.join(APP_DIR, ...segments, "page.md");
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

async function main() {
  const routes = parseRoutesFromArgs();
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      extraHTTPHeaders: { "x-optimitron-site-key": SITE_KEY },
    });
    const page = await ctx.newPage();
    for (const route of routes) {
      const outPath = routeToFilePath(route);
      try {
        const md = await extractPage(page, route);
        await mkdir(path.dirname(outPath), { recursive: true });
        const header = [
          `# ${route}`,
          "",
          `_Captured ${new Date().toISOString()} from ${BASE} (site=${SITE_KEY}). Gitignored; regenerate with \`pnpm --filter @optimitron/web copy:preview\`._`,
          "",
        ].join("\n");
        await writeFile(outPath, header + md + "\n", "utf8");
        console.log(`OK ${route}  ->  ${path.relative(WEB_ROOT, outPath)}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`FAIL ${route}  (${message})`);
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
