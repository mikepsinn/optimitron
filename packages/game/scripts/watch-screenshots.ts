/**
 * Watch slide files and auto-regenerate screenshots on change.
 *
 * Usage: npx tsx scripts/watch-screenshots.ts
 *
 * Watches:
 *   - components/demo/slides/**\/*.tsx  (slide components)
 *   - lib/demo/demo-config.ts           (narration/config changes)
 *   - lib/demo/parameters.ts            (parameter changes)
 *
 * On change, extracts the slide ID from the filename and runs
 * screenshot-slides.ts --only=<slideId> for just that slide.
 *
 * If demo-config.ts or parameters.ts change, re-screenshots ALL slides.
 *
 * Requires dev server running: pnpm dev
 */

import { watch } from "fs";
import { join, basename } from "path";
import { execSync } from "child_process";
import { readdirSync, statSync } from "fs";

const ROOT = process.cwd();
const SLIDES_DIR = join(ROOT, "components", "demo", "slides");
const CONFIG_FILE = join(ROOT, "lib", "demo", "demo-config.ts");
const PARAMS_FILE = join(ROOT, "lib", "demo", "parameters.ts");

// Debounce: collect changes over 2s before screenshotting
let pendingSlideIds = new Set<string>();
let pendingAll = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 2000;

/** Extract slide ID from filename: "slide-foo-bar.tsx" → "foo-bar" */
function fileToSlideId(filename: string): string | null {
  const match = basename(filename).match(/^slide-(.+)\.tsx$/);
  return match ? match[1] : null;
}

/** Recursively get all directories to watch */
function getWatchDirs(dir: string): string[] {
  const dirs = [dir];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      dirs.push(...getWatchDirs(full));
    }
  }
  return dirs;
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
      } catch {
        console.error("Screenshot failed");
      }
    } else if (pendingSlideIds.size > 0) {
      const ids = Array.from(pendingSlideIds).join(",");
      console.log(`\n📸 Re-screenshotting: ${ids}`);
      try {
        execSync(`npx tsx scripts/screenshot-slides.ts --only=${ids}`, {
          cwd: ROOT,
          stdio: "inherit",
        });
      } catch {
        console.error("Screenshot failed");
      }
    }
    pendingSlideIds.clear();
    pendingAll = false;
    debounceTimer = null;
  }, DEBOUNCE_MS);
}

function handleChange(filepath: string) {
  // Config or parameters → re-screenshot everything
  if (filepath === CONFIG_FILE || filepath === PARAMS_FILE) {
    pendingAll = true;
    scheduleScreenshot();
    return;
  }

  // Slide file → extract ID
  const slideId = fileToSlideId(filepath);
  if (slideId) {
    pendingSlideIds.add(slideId);
    console.log(`  Changed: ${basename(filepath)} → slide ID: ${slideId}`);
    scheduleScreenshot();
  }
}

// Start watching
console.log("👁️  Watching for slide changes...");
console.log(`   Slides: ${SLIDES_DIR}`);
console.log(`   Config: ${CONFIG_FILE}`);
console.log(`   Params: ${PARAMS_FILE}`);
console.log(`   Debounce: ${DEBOUNCE_MS}ms\n`);

// Watch slide directories (fs.watch is recursive on Windows)
watch(SLIDES_DIR, { recursive: true }, (_event, filename) => {
  if (filename && filename.endsWith(".tsx")) {
    handleChange(join(SLIDES_DIR, filename));
  }
});

// Watch config files
for (const file of [CONFIG_FILE, PARAMS_FILE]) {
  watch(file, () => handleChange(file));
}

// Keep process alive
process.on("SIGINT", () => {
  console.log("\n👋 Stopped watching.");
  process.exit(0);
});
