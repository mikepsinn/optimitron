/**
 * rename-optimitron-to-optimitron.ts
 *
 * Renames "optimitron" → "optimitron" in all casings across file contents and file names.
 * Only touches git-tracked (+ untracked non-ignored) files.
 *
 * Usage:
 *   npx tsx scripts/rename-optimitron-to-optimitron.ts --dry-run   # preview
 *   npx tsx scripts/rename-optimitron-to-optimitron.ts              # execute
 *
 * After running:
 *   pnpm install   (regenerate lockfile)
 *   pnpm check     (verify compilation)
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".webp", ".svg", ".pdf",
  ".zip", ".tar", ".gz", ".woff", ".woff2", ".ttf", ".eot",
  ".mp3", ".mp4", ".webm", ".wav", ".ogg", ".avif",
]);

const SKIP_FILES = new Set(["pnpm-lock.yaml"]);

/** Get all git-tracked + untracked-but-not-ignored files */
function getFiles(): string[] {
  const tracked = execSync("git ls-files -z", { cwd: REPO_ROOT })
    .toString()
    .split("\0")
    .filter(Boolean);

  const untracked = execSync("git ls-files --others --exclude-standard -z", { cwd: REPO_ROOT })
    .toString()
    .split("\0")
    .filter(Boolean);

  return [...tracked, ...untracked];
}

/** Apply all casing replacements to a string */
function replaceAll(text: string): string {
  return text
    .replaceAll("OPTIMITRON", "OPTIMITRON")
    .replaceAll("Optimitron", "Optimitron")
    .replaceAll("optimitron", "optimitron");
}

// ── Main ────────────────────────────────────────────────────────────────────

if (DRY_RUN) {
  console.log("=== DRY RUN — no changes will be made ===\n");
}

console.log("=== Renaming optimitron → optimitron ===");
console.log(`Repo root: ${REPO_ROOT}\n`);

const files = getFiles();

// ── Step 1: Replace in file contents ────────────────────────────────────────
console.log("Step 1: Replacing in file contents...\n");

let contentCount = 0;
const pattern = /optimitron/i;

for (const rel of files) {
  if (SKIP_FILES.has(path.basename(rel))) continue;
  if (BINARY_EXTENSIONS.has(path.extname(rel).toLowerCase())) continue;

  const abs = path.resolve(REPO_ROOT, rel);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) continue;

  let content: string;
  try {
    content = fs.readFileSync(abs, "utf-8");
  } catch {
    continue; // skip unreadable files
  }

  if (!pattern.test(content)) continue;

  const updated = replaceAll(content);
  if (updated === content) continue;

  if (DRY_RUN) {
    console.log(`  would modify: ${rel}`);
  } else {
    fs.writeFileSync(abs, updated, "utf-8");
    console.log(`  ✓ ${rel}`);
  }
  contentCount++;
}

console.log(`\n  Content replacements: ${contentCount} files\n`);

// ── Step 2: Rename files/directories ────────────────────────────────────────
console.log("Step 2: Renaming files and directories...\n");

// Collect all paths that need renaming, process deepest first
const pathsToRename: string[] = [];

for (const rel of files) {
  if (pattern.test(path.basename(rel))) {
    pathsToRename.push(rel);
  }
}

// Also check directory names by walking unique directory segments
const dirsToRename = new Set<string>();
for (const rel of files) {
  const parts = rel.split("/");
  for (let i = 0; i < parts.length - 1; i++) {
    if (pattern.test(parts[i])) {
      dirsToRename.add(parts.slice(0, i + 1).join("/"));
    }
  }
}
for (const d of dirsToRename) {
  pathsToRename.push(d);
}

// Sort deepest first so child renames happen before parent renames
const uniquePaths = [...new Set(pathsToRename)].sort(
  (a, b) => b.split("/").length - a.split("/").length || b.localeCompare(a)
);

let renameCount = 0;

for (const rel of uniquePaths) {
  const abs = path.resolve(REPO_ROOT, rel);
  if (!fs.existsSync(abs)) continue;

  const dir = path.dirname(abs);
  const base = path.basename(abs);
  const newBase = replaceAll(base);

  if (base === newBase) continue;

  const newAbs = path.join(dir, newBase);

  if (DRY_RUN) {
    console.log(`  would rename: ${rel} → ${path.join(path.dirname(rel), newBase)}`);
  } else {
    fs.renameSync(abs, newAbs);
    console.log(`  ✓ ${rel} → ${path.join(path.dirname(rel), newBase)}`);
  }
  renameCount++;
}

console.log(`\n  Renamed: ${renameCount} paths\n`);

// ── Summary ─────────────────────────────────────────────────────────────────
console.log("=== Done ===\n");
console.log(`  Files modified:  ${contentCount}`);
console.log(`  Paths renamed:   ${renameCount}\n`);

if (!DRY_RUN) {
  console.log("Next steps:");
  console.log("  1. pnpm install        # regenerate lockfile");
  console.log("  2. pnpm check          # verify compilation");
  console.log("  3. git diff            # review changes");
}
