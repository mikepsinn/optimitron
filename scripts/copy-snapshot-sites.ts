/**
 * copy-snapshot-sites.ts
 *
 * One command that regenerates the page-copy snapshots for every website in
 * the monorepo: the Optimitron app plus each split site app.
 *
 * Each site's routes are rendered to markdown next to their `page.tsx` so copy
 * is reviewable and diffable without opening a browser:
 *
 *   apps/optimitron/src/app/treaty/page.tsx -> .../treaty/page.logged-out.md
 *   apps/warondisease/app/about/page.tsx -> .../about/page.logged-out.md
 *
 * `apps/optimitron` keeps its own renderer (`render-pages-to-markdown.ts`) — it
 * handles demo-session auth, redirect-only routes, and dynamic route paths that
 * the apps don't have. This script drives it rather than reimplementing it, so
 * there is one command without two copies of that logic.
 *
 * Dev servers are reused when a site is already serving on its port, otherwise
 * booted here and shut down afterwards.
 *
 * Usage:
 *   pnpm copy                      # every site
 *   pnpm copy acceleratedmedicine  # one site, while iterating
 *   pnpm copy web --routes=/shirt  # one site, some routes
 */
import "./lib/load-copy-preview-env";

import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import type { SiteVariant } from "../packages/site-kit/src/lib/site-config";
import {
  getInternalNavigationRoutesForVariant,
  getSiteConfigForVariant,
  VARIANTS,
} from "../packages/site-kit/src/lib/site-config";
import { buildCopyPreviewMarkdown } from "../apps/optimitron/src/lib/copy-preview-markdown";
import { extractVisibleCopyMarkdown } from "./lib/copy-preview-dom";

const repoRoot = path.resolve(__dirname, "..");

const routeFilterArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--routes="));
const routeFilter = routeFilterArg
  ?.slice("--routes=".length)
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean);

interface Site {
  /** Extra public routes that are not linked from this site's navigation. */
  additionalSnapshotRoutes?: string[];
  /** Stable command-line selector, when it differs from the directory name. */
  commandName?: string;
  /**
   * Package script that starts the dev server. When set, it is used instead of
   * calling `next dev` directly, so the package's own env and DB preflight run.
   */
  devScript?: string;
  /**
   * Hostname the browser uses. Pages that echo the request host (/mcp prints
   * setup commands, share links embed the origin) bake it into the snapshot, so
   * every site pins one host. 127.0.0.1 matches the default in
   * render-pages-to-markdown.ts, so running that directly agrees with this.
   */
  host: string;
  /** Directory under the repo root that holds the Next app. */
  directory: string;
  /** Human label used in log lines. */
  label: string;
  /** Dev port — matches each package's own `dev` script. */
  port: number;
  /**
   * `own` sites delegate to their package's renderer; `nav` sites are rendered
   * here from their site-config navigation routes.
   */
  renderer: "own" | "nav";
  variant: SiteVariant;
}

const SITES: Site[] = [
  {
    // web serves every variant from one server and selects between them with
    // the x-optimitron-site-key request header, so it must NOT get the
    // NEXT_PUBLIC_SITE_VARIANT / NEXT_PUBLIC_BASE_URL pinning the apps need.
    commandName: "web",
    devScript: "dev:fast",
    directory: "apps/optimitron",
    host: "127.0.0.1",
    label: "@optimitron/web",
    port: 3001,
    renderer: "own",
    variant: VARIANTS.WAR_ON_DISEASE,
  },
  {
    directory: "apps/warondisease",
    host: "127.0.0.1",
    label: "@apps/warondisease",
    port: 3010,
    renderer: "nav",
    variant: VARIANTS.WAR_ON_DISEASE,
  },
  {
    directory: "apps/dfda",
    host: "127.0.0.1",
    label: "@apps/dfda",
    port: 3011,
    renderer: "nav",
    variant: VARIANTS.DFDA,
  },
  {
    directory: "apps/wishocracy",
    host: "127.0.0.1",
    label: "@apps/wishocracy",
    port: 3013,
    renderer: "nav",
    variant: VARIANTS.WISHOCRACY,
  },
  {
    directory: "apps/trialabundancesurvey",
    host: "127.0.0.1",
    label: "@apps/trialabundancesurvey",
    port: 3014,
    renderer: "nav",
    variant: VARIANTS.SURVEY,
  },
  {
    directory: "apps/curedao",
    host: "127.0.0.1",
    label: "@apps/curedao",
    port: 3015,
    renderer: "nav",
    variant: VARIANTS.CUREDAO,
  },
  {
    additionalSnapshotRoutes: [
      "/the-plan",
      "/impact",
      "/montana",
      "/model-act",
      "/states/missouri",
      "/survey",
    ],
    directory: "apps/acceleratedmedicine",
    host: "127.0.0.1",
    label: "@apps/acceleratedmedicine",
    port: 3016,
    renderer: "nav",
    variant: VARIANTS.ACCELERATED_MEDICINE,
  },
];

/** Stable selector used by the optional CLI site filter. */
function siteName(site: Site): string {
  return site.commandName ?? (site.directory.split("/").at(-1) as string);
}

function routeToOutputPath(site: Site, routePath: string): string {
  const segments = routePath
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
  return path.join(
    repoRoot,
    site.directory,
    "app",
    ...segments,
    "page.logged-out.md",
  );
}

async function isServing(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { redirect: "manual" });
    return response.status >= 200 && response.status < 400;
  } catch {
    return false;
  }
}

async function waitForServer(
  url: string,
  child: ChildProcess,
  output: string[],
): Promise<void> {
  const started = Date.now();
  const deadline = started + 300_000;
  let nextHeartbeat = started + 15_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(
        `Dev server exited with code ${child.exitCode} / signal ${child.signalCode}.\n${output.join("")}`,
      );
    }
    if (await isServing(url)) return;
    if (Date.now() >= nextHeartbeat) {
      console.log(
        `  still waiting for ${url} (${Math.round((Date.now() - started) / 1000)}s)`,
      );
      nextHeartbeat = Date.now() + 15_000;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for ${url}.\n${output.join("")}`);
}

function siteEnv(site: Site): NodeJS.ProcessEnv {
  if (site.devScript) return { ...process.env, PORT: String(site.port) };
  return {
    ...process.env,
    // Canonical and OG URLs come from NEXT_PUBLIC_BASE_URL (site-kit
    // lib/url.ts). Pin it to the variant's production origin or the snapshot
    // bakes in whatever NEXTAUTH_URL the local .env happens to hold, and the
    // committed baseline differs per machine.
    NEXT_PUBLIC_BASE_URL: getSiteConfigForVariant(site.variant).baseUrl,
    NEXT_PUBLIC_SITE_VARIANT: site.variant,
    // The War on Disease app initializes NextAuth middleware on public routes.
    // Keep its local callback local and provide a non-production signing secret
    // so copy review never requires real credentials.
    NEXTAUTH_SECRET: "copy-snapshot-local-only-secret",
    NEXTAUTH_URL: `http://${site.host}:${site.port}`,
    PORT: String(site.port),
  };
}

/**
 * Start `next dev` for a site, or return null when something is already
 * serving that port — a running dev server is reused, never restarted.
 */
async function startServer(
  site: Site,
  baseUrl: string,
): Promise<{ child: ChildProcess; output: string[] } | null> {
  if (await isServing(`${baseUrl}/`)) {
    console.log(`${site.label}: reusing the server already on ${site.port}`);
    return null;
  }
  console.log(`${site.label}: starting dev server on ${site.port}`);

  const output: string[] = [];
  const directory = path.join(repoRoot, site.directory);
  const nextCli = path.join(
    directory,
    "node_modules",
    "next",
    "dist",
    "bin",
    "next",
  );
  const child = site.devScript
    ? spawn("pnpm", ["run", site.devScript], {
        cwd: directory,
        env: siteEnv(site),
        shell: process.platform === "win32",
        stdio: ["ignore", "pipe", "pipe"],
      })
    : spawn(
        process.execPath,
        [nextCli, "dev", "--hostname", site.host, "--port", String(site.port)],
        {
          cwd: directory,
          env: siteEnv(site),
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
  child.stdout?.on("data", (chunk) => output.push(chunk.toString()));
  child.stderr?.on("data", (chunk) => output.push(chunk.toString()));

  await waitForServer(`${baseUrl}/`, child, output);
  return { child, output };
}

async function stopServer(child: ChildProcess): Promise<void> {
  // A dev server started through `pnpm run` is a child of pnpm, and on Windows
  // signalling the parent leaves next holding the port. Kill the tree.
  if (process.platform === "win32" && child.pid) {
    spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
    });
  }
  child.kill("SIGTERM");
  const stopped = await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    new Promise((resolve) => setTimeout(() => resolve(false), 8_000)),
  ]);
  if (stopped === false) child.kill("SIGKILL");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function headAttribute(
  page: any,
  selector: string,
  attribute: string,
): Promise<string | null> {
  return page
    .locator(selector)
    .first()
    .getAttribute(attribute)
    .catch(() => null);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function extractMetadata(page: any) {
  const title = (await page.title()).replace(/\s+/g, " ").trim();
  return {
    canonical: await headAttribute(page, 'link[rel="canonical"]', "href"),
    description: await headAttribute(
      page,
      'meta[name="description"]',
      "content",
    ),
    openGraphDescription: await headAttribute(
      page,
      'meta[property="og:description"]',
      "content",
    ),
    openGraphImage: await headAttribute(
      page,
      'meta[property="og:image"]',
      "content",
    ),
    openGraphTitle: await headAttribute(
      page,
      'meta[property="og:title"]',
      "content",
    ),
    title: title.length > 0 ? title : null,
    twitterDescription: await headAttribute(
      page,
      'meta[name="twitter:description"]',
      "content",
    ),
    twitterTitle: await headAttribute(
      page,
      'meta[name="twitter:title"]',
      "content",
    ),
  };
}

/** Sites in `apps/` — routes come from their site-config navigation. */
async function snapshotNavRoutes(site: Site, baseUrl: string): Promise<void> {
  const routes = [
    ...new Set([
      ...getInternalNavigationRoutesForVariant(site.variant).map(
        ({ path: routePath }) => routePath,
      ),
      ...(site.additionalSnapshotRoutes ?? []),
    ]),
  ].filter((routePath) => !routeFilter || routeFilter.includes(routePath));
  if (routes.length === 0) {
    console.log(`${site.label}: no routes matched --routes, skipped`);
    return;
  }
  const requireFromWeb = createRequire(
    path.join(repoRoot, "apps", "optimitron", "package.json"),
  );
  const { chromium } = requireFromWeb("@playwright/test");
  const browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || "chrome",
    headless: true,
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    for (const routePath of routes) {
      // Dev-mode first hit compiles the route, so allow a generous timeout and
      // one retry before treating a route as broken.
      let status: number | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await page.goto(`${baseUrl}${routePath}`, {
            timeout: 120_000,
            waitUntil: "load",
          });
          status = response?.status() ?? null;
          break;
        } catch (error) {
          if (attempt === 1) throw error;
          await page.waitForTimeout(2000);
        }
      }
      await page
        .waitForLoadState("networkidle", { timeout: 20_000 })
        .catch(() => {});
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(500);

      const metadata = await extractMetadata(page);
      // A 5xx or a page with no metadata at all is a broken render. Writing a
      // snapshot from it would replace real copy with "[missing]" placeholders.
      if (
        (status !== null && status >= 500) ||
        (!metadata.title && !metadata.description && !metadata.openGraphTitle)
      ) {
        throw new Error(
          `${site.label}${routePath}: broken render (HTTP ${status ?? "?"}) — snapshot NOT written.`,
        );
      }
      const bodyMarkdown = await page.evaluate(extractVisibleCopyMarkdown);
      const outputPath = routeToOutputPath(site, routePath);
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(
        outputPath,
        buildCopyPreviewMarkdown({ bodyMarkdown, metadata, route: routePath }),
        "utf8",
      );
      console.log(`  ${routePath} -> ${path.relative(repoRoot, outputPath)}`);
    }

    await context.close();
    console.log(`${site.label}: wrote ${routes.length} copy snapshots`);
  } finally {
    await browser.close();
  }
}

/** `apps/optimitron` — hand off to the renderer that already lives there. */
async function snapshotOwnRenderer(site: Site, baseUrl: string): Promise<void> {
  const exitCode = await new Promise<number>((resolve) => {
    const child = spawn(
      "pnpm",
      [
        "exec",
        "tsx",
        "scripts/render-pages-to-markdown.ts",
        ...(routeFilterArg ? [routeFilterArg] : []),
      ],
      {
        cwd: path.join(repoRoot, site.directory),
        env: { ...siteEnv(site), PREVIEW_BASE_URL: baseUrl },
        shell: process.platform === "win32",
        stdio: "inherit",
      },
    );
    child.on("exit", (code) => resolve(code ?? 1));
  });
  if (exitCode !== 0) {
    throw new Error(`renderer exited with code ${exitCode}`);
  }
}

async function snapshotSite(site: Site): Promise<void> {
  const baseUrl = `http://${site.host}:${site.port}`;
  const server = await startServer(site, baseUrl);
  try {
    if (site.renderer === "own") {
      await snapshotOwnRenderer(site, baseUrl);
    } else {
      await snapshotNavRoutes(site, baseUrl);
    }
  } finally {
    // Only stop what this run started. A dev server that was already up is
    // somebody's working session.
    if (server) await stopServer(server.child);
  }
}

// CJS entry (repo root has no "type": "module"), so no top-level await.
async function main() {
  // Default is every site. Names narrow it down, for iterating on one site
  // without paying for the other six.
  const requested = process.argv
    .slice(2)
    .filter((arg) => !arg.startsWith("--"));
  const unknown = requested.filter(
    (name) => !SITES.some((site) => siteName(site) === name),
  );
  if (unknown.length > 0) {
    throw new Error(
      `Unknown site(s): ${unknown.join(", ")}. Known: ${SITES.map(siteName).join(", ")}`,
    );
  }
  const selected =
    requested.length > 0
      ? SITES.filter((site) => requested.includes(siteName(site)))
      : SITES;

  // One broken site must not cost the other six their snapshots — collect the
  // failures, keep going, and fail the command at the end.
  const failures: string[] = [];
  for (const site of selected) {
    try {
      await snapshotSite(site);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${site.label}: ${message}`);
      console.error(`${site.label}: FAILED — ${message}`);
    }
  }
  if (failures.length > 0) {
    throw new Error(
      `${failures.length} site(s) failed:\n${failures.join("\n")}`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
