#!/usr/bin/env node
/**
 * review-local.mjs
 *
 * One-shot local review pipeline. Run after a UI/copy change to get the
 * artifacts the voice-critic agent needs (screenshots + markdown
 * extract) without waiting ~10 minutes for CI.
 *
 * Steps:
 *   1. Sanity-check the dev server (port 3001) is up — print a helpful
 *      message if it isn't.
 *   2. Run `copy:preview` (markdown extraction of public routes).
 *   3. Run Playwright visual regression locally (writes screenshots
 *      under packages/web/screenshots/<project>/).
 *   4. Build the visual-review HTML at output/playwright/review/latest.html.
 *   5. Open latest.html in the default browser (best-effort; falls back
 *      to printing the path).
 *
 * Usage (run from `packages/web/`):
 *   pnpm review:local
 *
 * Optional:
 *   pnpm review:local -- --routes=/treaty,/dashboard   # subset only
 *   pnpm review:local -- --skip-visual                  # markdown only
 *   pnpm review:local -- --skip-markdown                # screenshots only
 *
 * Designed to feed into the `voice-critic` Claude Code subagent — after
 * this finishes, the agent can open latest.html and the regenerated
 * page.logged-out.md files to spot violations of the voice / reuse /
 * ParameterValue rules.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, "..");
const REVIEW_HTML = path.join(
  WEB_ROOT,
  "output/playwright/review/latest.html",
);

const args = new Set(process.argv.slice(2));
const skipVisual = args.has("--skip-visual");
const skipMarkdown = args.has("--skip-markdown");
const routesArg = process.argv.find((a) => a.startsWith("--routes="));

function step(label) {
  process.stdout.write(`\n[review:local] === ${label} ===\n`);
}

function runPnpm(scriptName, extraArgs = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      "pnpm",
      ["--filter", "@optimitron/web", "run", scriptName, ...extraArgs],
      { cwd: path.resolve(WEB_ROOT, "../.."), stdio: "inherit", shell: true },
    );
    proc.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptName} exited with ${code}`));
    });
  });
}

async function checkDevServer() {
  step("dev server check");
  try {
    const res = await fetch("http://127.0.0.1:3001/api/auth/csrf", {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      console.log("[review:local] dev server up on :3001 ✓");
      return true;
    }
  } catch {
    // fall through
  }
  console.warn(
    "\n[review:local] dev server NOT detected on :3001.\n" +
      "  Start it in a separate terminal: `pnpm --filter @optimitron/web dev:fast`\n" +
      "  Then re-run this command.\n",
  );
  return false;
}

function openInBrowser(target) {
  step("open review");
  if (!existsSync(target)) {
    console.warn(`[review:local] file not found: ${target}`);
    return;
  }
  console.log(`[review:local] open: ${target}`);
  // Best-effort opener; if it fails, the path is already printed.
  const opener =
    process.platform === "win32"
      ? "start"
      : process.platform === "darwin"
        ? "open"
        : "xdg-open";
  try {
    spawn(opener, [target], { stdio: "ignore", shell: true, detached: true });
  } catch {
    // ignored — user has the path
  }
}

async function main() {
  const devUp = await checkDevServer();
  if (!devUp && !skipVisual) {
    process.exit(1);
  }

  if (!skipMarkdown) {
    step("markdown extract (copy:preview)");
    const passthroughArgs = routesArg ? ["--", routesArg] : [];
    await runPnpm("copy:preview", passthroughArgs);
  } else {
    console.log("[review:local] skipping markdown extract (--skip-markdown)");
  }

  if (!skipVisual) {
    step("playwright visual regression");
    const e2eArgs = ["--", "visual"];
    await runPnpm("e2e", e2eArgs);

    step("build visual review HTML");
    process.env.VISUAL_REVIEW_ALLOW_INCOMPLETE = "1";
    await runPnpm("visual:review");

    openInBrowser(REVIEW_HTML);
  } else {
    console.log("[review:local] skipping playwright (--skip-visual)");
  }

  step("done");
  console.log(
    "[review:local] Next:\n" +
      "  1. Open " +
      REVIEW_HTML +
      "\n" +
      "  2. Use the per-route Copy Context button to paste a complaint\n" +
      "  3. Or invoke the voice-critic Claude Code subagent against the\n" +
      "     diff + the regenerated page.logged-out.md files.\n",
  );
}

main().catch((err) => {
  console.error("[review:local] failed:", err.message);
  process.exit(1);
});
