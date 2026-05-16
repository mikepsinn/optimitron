#!/usr/bin/env node
/**
 * Print copy-preview routes affected by changed web files.
 *
 * This is intentionally an 80/20 static import index:
 * - only page.tsx files under packages/web/src/app become routes;
 * - only static relative imports and `@/` imports are followed;
 * - traversal stops after five import hops to avoid indexing the whole app.
 *
 * Known gaps: Next.js layouts/templates/loading/error files, dynamic imports,
 * data-driven route content, barrel exports outside the depth cap, package-level
 * side effects, and global CSS can affect rendered pages without appearing in a
 * page's static import tree. If this prints nothing for a broad shared change,
 * run the full copy preview.
 *
 * Usage:
 *   node packages/web/scripts/affected-routes.mjs
 *   node packages/web/scripts/affected-routes.mjs packages/web/src/app/treaty/page.tsx
 *   pnpm --filter @optimitron/web copy:preview -- --routes=$(node packages/web/scripts/affected-routes.mjs ...)
 */

import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { isRedirectOnlyRoutePath } = require("../src/lib/redirects.js");
const WEB_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(WEB_ROOT, "../..");
const APP_DIR = path.join(WEB_ROOT, "src/app");
const SRC_DIR = path.join(WEB_ROOT, "src");
const MAX_DEPTH = 5;
const RESOLVE_EXTENSIONS = [
  "",
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".mjs",
  ".cjs",
  ".css",
  ".scss",
];
const INDEX_FILENAMES = [
  "index.tsx",
  "index.ts",
  "index.jsx",
  "index.js",
  "index.mjs",
  "index.cjs",
];

const changedFiles = getChangedFiles();
const changedAbsPaths = new Set(
  changedFiles.map(toAbsolutePath).map(normalizePath),
);
const pages = findPageFiles(APP_DIR);
const affectedRoutes = [];

for (const pageFile of pages) {
  const imports = collectImportSet(pageFile);
  for (const changed of changedAbsPaths) {
    if (imports.has(changed)) {
      const route = pageFileToRoute(pageFile);
      if (!isRedirectOnlyRoutePath(route)) {
        affectedRoutes.push(route);
      }
      break;
    }
  }
}

const uniqueAffectedRoutes = Array.from(new Set(affectedRoutes));

process.stdout.write(uniqueAffectedRoutes.join(","));
if (uniqueAffectedRoutes.length > 0) {
  process.stdout.write("\n");
}

function getChangedFiles() {
  const args = process.argv.slice(2).filter(Boolean);
  if (args.length > 0) return args;
  const output = execFileSync("git", ["diff", "--name-only", "HEAD"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function findPageFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...findPageFiles(full));
    } else if (entry.isFile() && entry.name === "page.tsx") {
      out.push(full);
    }
  }
  return out.sort((a, b) => pageFileToRoute(a).localeCompare(pageFileToRoute(b)));
}

function collectImportSet(entryFile) {
  const visited = new Set();
  walkImports(entryFile, 0, visited);
  return visited;
}

function walkImports(file, depth, visited) {
  const normalized = normalizePath(file);
  if (visited.has(normalized)) return;
  visited.add(normalized);
  if (depth >= MAX_DEPTH || !isReadableFile(normalized)) return;

  const source = readFileSync(normalized, "utf8");
  for (const specifier of extractStaticSpecifiers(source)) {
    const resolved = resolveImport(specifier, normalized);
    if (resolved) {
      walkImports(resolved, depth + 1, visited);
    }
  }
}

function extractStaticSpecifiers(source) {
  const specifiers = [];
  const importPattern =
    /\bimport\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;
  const exportPattern =
    /\bexport\s+(?:type\s+)?[\s\S]*?\s+from\s+["']([^"']+)["']/g;

  for (const pattern of [importPattern, exportPattern]) {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      specifiers.push(match[1]);
    }
  }
  return specifiers;
}

function resolveImport(specifier, fromFile) {
  if (specifier.startsWith("@/")) {
    return resolveCandidate(path.join(SRC_DIR, specifier.slice(2)));
  }
  if (specifier.startsWith(".")) {
    return resolveCandidate(path.resolve(path.dirname(fromFile), specifier));
  }
  return null;
}

function resolveCandidate(basePath) {
  for (const ext of RESOLVE_EXTENSIONS) {
    const candidate = normalizePath(`${basePath}${ext}`);
    if (isReadableFile(candidate)) return candidate;
  }
  if (isReadableDirectory(basePath)) {
    for (const filename of INDEX_FILENAMES) {
      const candidate = normalizePath(path.join(basePath, filename));
      if (isReadableFile(candidate)) return candidate;
    }
  }
  return null;
}

function pageFileToRoute(pageFile) {
  const dir = path.dirname(pageFile);
  const relative = path.relative(APP_DIR, dir);
  if (!relative) return "/";
  const segments = relative
    .split(path.sep)
    .filter((segment) => segment && !segment.startsWith("(") && !segment.startsWith("@"));
  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

function toAbsolutePath(filePath) {
  const normalizedInput = filePath.replace(/\\/g, "/");
  if (path.isAbsolute(filePath)) return filePath;
  if (normalizedInput.startsWith("packages/web/")) {
    return path.resolve(REPO_ROOT, filePath);
  }
  if (normalizedInput.startsWith("src/")) {
    return path.resolve(WEB_ROOT, filePath);
  }
  return path.resolve(process.cwd(), filePath);
}

function isReadableFile(filePath) {
  try {
    return statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function isReadableDirectory(dirPath) {
  try {
    return statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

function normalizePath(filePath) {
  const resolved = path.resolve(filePath);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}
