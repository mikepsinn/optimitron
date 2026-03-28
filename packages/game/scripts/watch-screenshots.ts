/**
 * Watch slide files and auto-regenerate screenshots on change.
 *
 * Usage: npx tsx scripts/watch-screenshots.ts
 *
 * On startup, compares source file hashes against a stored manifest
 * (screenshots/.hashes.json) and re-screenshots only stale slides.
 * Then watches for live changes.
 *
 * Watches:
 *   - components/demo/slides/**\/*.tsx  (slide components)
 *   - lib/demo/demo-config.ts           (narration/config changes)
 *   - lib/demo/parameters.ts            (parameter changes)
 *
 * Requires dev server running: pnpm dev
 */

import { watch, readFileSync, writeFileSync, existsSync } from "fs";
import { join, basename } from "path";
import { execSync } from "child_process";
import { createHash } from "crypto";
import { readdirSync } from "fs";

const ROOT = process.cwd();
const SLIDES_DIR = join(ROOT, "components", "demo", "slides");
const CONFIG_FILE = join(ROOT, "lib", "demo", "demo-config.ts");
const PARAMS_FILE = join(ROOT, "lib", "demo", "parameters.ts");
const SCREENSHOTS_DIR = join(ROOT, "presentation-recording", "screenshots");
const HASH_MANIFEST = join(SCREENSHOTS_DIR, ".hashes.json");

// Debounce: collect changes over 2s before screenshotting
let pendingSlideIds = new Set<string>();
let pendingAll = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 2000;

// In-memory hash tracking for live watch (prevents fs.watch noise)
const liveHashes = new Map<string, string>();

// Persisted manifest: slideId → { sourceHash, configHash }
type HashManifest = Record<string, { sourceHash: string; configHash: string }>;

function hashContent(content: string): string {
  return createHash("md5").update(content).digest("hex");
}

function hashFile(filepath: string): string | null {
  try {
    return hashContent(readFileSync(filepath, "utf-8"));
  } catch {
    return null;
  }
}

function loadManifest(): HashManifest {
  try {
    return JSON.parse(readFileSync(HASH_MANIFEST, "utf-8")) as HashManifest;
  } catch {
    return {};
  }
}

function saveManifest(manifest: HashManifest) {
  writeFileSync(HASH_MANIFEST, JSON.stringify(manifest, null, 2));
}

function getCombinedConfigHash(): string {
  const configHash = hashFile(CONFIG_FILE) ?? "";
  const paramsHash = hashFile(PARAMS_FILE) ?? "";
  return hashContent(configHash + paramsHash);
}

/** Find all slide-*.tsx files recursively and map filename → slide ID */
function findSlideFiles(): Map<string, string> {
  const map = new Map<string, string>();
  function scan(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        scan(join(dir, entry.name));
      } else if (entry.name.startsWith("slide-") && entry.name.endsWith(".tsx")) {
        const slideId = entry.name.replace(/^slide-/, "").replace(/\.tsx$/, "");
        map.set(slideId, join(dir, entry.name));
      }
    }
  }
  scan(SLIDES_DIR);
  return map;
}

/** Check for stale screenshots on startup and re-screenshot them.
 *  Only checks source file hashes — config changes are handled by live watch. */
function syncStaleScreenshots() {
  const manifest = loadManifest();
  const slideFiles = findSlideFiles();

  const staleIds: string[] = [];

  for (const [slideId, filepath] of slideFiles) {
    const sourceHash = hashFile(filepath);
    if (!sourceHash) continue;

    const stored = manifest[slideId];
    const screenshotExists = existsSync(join(SCREENSHOTS_DIR, `${slideId}.png`));

    if (
      !screenshotExists ||
      !stored ||
      stored.sourceHash !== sourceHash
    ) {
      staleIds.push(slideId);
    }
  }

  if (staleIds.length === 0) {
    console.log("✅ All screenshots up to date.\n");
    return;
  }

  console.log(`🔄 ${staleIds.length} stale screenshot(s): ${staleIds.join(", ")}\n`);

  try {
    execSync(`npx tsx scripts/screenshot-slides.ts --only=${staleIds.join(",")}`, {
      cwd: ROOT,
      stdio: "inherit",
    });
  } catch {
    console.error("Screenshot sync failed");
  }

  // Update manifest for the slides we just re-screenshotted
  const combinedConfigHash = getCombinedConfigHash();
  const updatedManifest = loadManifest();
  for (const slideId of staleIds) {
    const filepath = slideFiles.get(slideId);
    if (!filepath) continue;
    const sourceHash = hashFile(filepath);
    if (sourceHash) {
      updatedManifest[slideId] = { sourceHash, configHash: combinedConfigHash };
    }
  }
  saveManifest(updatedManifest);
}

/** Update the manifest after a successful screenshot run */
function updateManifestForSlides(slideIds: string[] | "all") {
  const manifest = loadManifest();
  const slideFiles = findSlideFiles();
  const combinedConfigHash = getCombinedConfigHash();

  const ids = slideIds === "all" ? Array.from(slideFiles.keys()) : slideIds;

  for (const slideId of ids) {
    const filepath = slideFiles.get(slideId);
    if (!filepath) continue;
    const sourceHash = hashFile(filepath);
    if (sourceHash) {
      manifest[slideId] = { sourceHash, configHash: combinedConfigHash };
    }
  }
  saveManifest(manifest);
}

function hasContentChanged(filepath: string): boolean {
  const newHash = hashFile(filepath);
  if (!newHash) return false;
  const oldHash = liveHashes.get(filepath);
  if (oldHash === newHash) return false;
  liveHashes.set(filepath, newHash);
  return true;
}

function fileToSlideId(filename: string): string | null {
  const match = basename(filename).match(/^slide-(.+)\.tsx$/);
  return match ? match[1] : null;
}

function scheduleScreenshot() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (pendingAll) {
      console.log(`\n📸 Config changed — re-screenshotting ALL slides...`);
      try {
        execSync("npx tsx scripts/screenshot-slides.ts", {
          cwd: ROOT,
          stdio: "inherit",
        });
        updateManifestForSlides("all");
      } catch {
        console.error("Screenshot failed");
      }
    } else if (pendingSlideIds.size > 0) {
      const ids = Array.from(pendingSlideIds);
      console.log(`\n📸 Re-screenshotting: ${ids.join(", ")}`);
      try {
        execSync(`npx tsx scripts/screenshot-slides.ts --only=${ids.join(",")}`, {
          cwd: ROOT,
          stdio: "inherit",
        });
        updateManifestForSlides(ids);
      } catch {
        console.error("Screenshot failed");
      }
    }
    pendingSlideIds.clear();
    pendingAll = false;
    debounceTimer = null;
    console.log("\n👁️ Watching for changes...\n");
  }, DEBOUNCE_MS);
}

function handleChange(filepath: string) {
  if (!hasContentChanged(filepath)) return;

  if (filepath === CONFIG_FILE || filepath === PARAMS_FILE) {
    console.log(`  Config changed: ${basename(filepath)}`);
    pendingAll = true;
    scheduleScreenshot();
    return;
  }

  const slideId = fileToSlideId(filepath);
  if (slideId) {
    pendingSlideIds.add(slideId);
    console.log(`  Changed: ${basename(filepath)} → slide ID: ${slideId}`);
    scheduleScreenshot();
  }
}

// Seed live hashes so watch doesn't trigger on startup noise
function seedLiveHashes() {
  for (const file of [CONFIG_FILE, PARAMS_FILE]) {
    const hash = hashFile(file);
    if (hash) liveHashes.set(file, hash);
  }
}

// ─── Main ──────────────────────────────────────────────────────────

console.log("👁️  Slide screenshot watcher");
console.log(`   Slides: ${SLIDES_DIR}`);
console.log(`   Config: ${CONFIG_FILE}`);
console.log(`   Manifest: ${HASH_MANIFEST}`);
console.log(`   Debounce: ${DEBOUNCE_MS}ms\n`);

// Step 1: sync stale screenshots on startup
syncStaleScreenshots();

// Step 2: seed live hashes and start watching
seedLiveHashes();
console.log("👁️ Watching for changes...\n");

watch(SLIDES_DIR, { recursive: true }, (_event, filename) => {
  if (filename && filename.endsWith(".tsx")) {
    handleChange(join(SLIDES_DIR, filename));
  }
});

for (const file of [CONFIG_FILE, PARAMS_FILE]) {
  watch(file, () => handleChange(file));
}

process.on("SIGINT", () => {
  console.log("\n👋 Stopped watching.");
  process.exit(0);
});
