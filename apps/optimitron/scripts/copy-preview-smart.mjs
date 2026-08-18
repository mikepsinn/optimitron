#!/usr/bin/env node
/**
 * copy-preview-smart.mjs
 *
 * Default wrapper for `pnpm copy:preview`. Runs `affected-routes.mjs`
 * against the working-tree diff (staged + unstaged vs HEAD), builds
 * the `--routes=...` arg, and invokes the underlying renderer for
 * only the affected pages. Falls through to full regen when:
 *
 *   - the affected-routes index returns nothing (shared helper /
 *     barrel / global CSS change — the static import walker can't see
 *     it), OR
 *   - the user passes `--all` (escape hatch for parity with CI's
 *     full drift check), OR
 *   - the user passes their own `--routes=...` (explicit override).
 *
 * The non-smart full regen still exists as `pnpm copy:preview:all`
 * for CI / initial generation. CLAUDE.md says never hand-edit the
 * .md snapshots — run this script.
 */

import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = __dirname;
const RENDER_SCRIPT = path.join(SCRIPTS_DIR, "render-pages-to-markdown.ts");
const AFFECTED_SCRIPT = path.join(SCRIPTS_DIR, "affected-routes.mjs");

const userArgs = process.argv.slice(2);
const passthrough = [];
let mode = "smart";
let explicitRoutes = null;

for (const arg of userArgs) {
  if (arg === "--all") {
    mode = "all";
  } else if (arg.startsWith("--routes=")) {
    explicitRoutes = arg.slice("--routes=".length);
    mode = "explicit";
  } else {
    passthrough.push(arg);
  }
}

function runRenderer(extraArgs) {
  const result = spawnSync(
    "pnpm",
    ["exec", "tsx", RENDER_SCRIPT, ...extraArgs, ...passthrough],
    { stdio: "inherit", shell: process.platform === "win32" },
  );
  process.exit(result.status ?? 1);
}

if (mode === "all") {
  console.log("[copy:preview] --all → regenerating every route.");
  runRenderer([]);
}

if (mode === "explicit") {
  console.log(`[copy:preview] explicit routes: ${explicitRoutes}`);
  runRenderer([`--routes=${explicitRoutes}`]);
}

// Smart mode: ask affected-routes.mjs which pages changed.
let detected = "";
try {
  detected = execFileSync("node", [AFFECTED_SCRIPT], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
} catch (error) {
  console.error("[copy:preview] affected-routes detection failed:", error.message);
  console.error("[copy:preview] Falling back to full regen.");
  runRenderer([]);
}

if (!detected) {
  console.log(
    "[copy:preview] No affected routes from static import walk (shared helper / CSS / barrel change?). Falling back to full regen.",
  );
  runRenderer([]);
}

console.log(`[copy:preview] affected routes: ${detected}`);
runRenderer([`--routes=${detected}`]);
