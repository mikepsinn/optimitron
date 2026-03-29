/**
 * Take a screenshot of every slide after animations complete.
 *
 * Usage: npx tsx scripts/screenshot-slides.ts
 *
 * Options:
 *   --only=cold-open,the-bug    Screenshot only these slide IDs
 *   --mobile                     Also capture at 375x812 (iPhone SE)
 *   --wait=8000                  Override per-slide wait (ms, default: auto)
 *
 * Outputs: presentation-recording/screenshots/{slideId}.png
 *          presentation-recording/screenshots/{slideId}-mobile.png  (with --mobile)
 *
 * Requires dev server running: pnpm dev
 */

import { chromium } from "@playwright/test";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

import { SLIDES, resolvePlaylist, type SlideConfig } from "../lib/demo/demo-config";

// Parse --playlist flag
const playlistFlag = process.argv.find((a) => a.startsWith("--playlist="));
const playlistId = playlistFlag?.split("=")[1] || "full";
const playlistSlides: SlideConfig[] = resolvePlaylist(playlistId);

const OUTPUT_DIR = join(process.cwd(), "presentation-recording", `screenshots-${playlistId}`);
const BASE_URL = process.env.GAME_URL || "http://localhost:4000";

const DESKTOP = { width: 1920, height: 1080 };
const MOBILE = { width: 375, height: 812 };

/** Estimate how long to wait for animations to settle (ms) */
function animationWait(slide: (typeof SLIDES)[number]): number {
  // Most slides use phase-based reveals spread across their duration.
  // Wait for the full config duration (capped at 14s) so the final phase
  // has time to render, plus a 1.5s buffer for CSS transitions.
  const configSec = Math.min(slide.duration || 8, 14);
  return configSec * 1000 + 1500;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let only: string[] | null = null;
  let mobile = false;
  let waitOverride: number | null = null;

  for (const arg of args) {
    if (arg.startsWith("--only=")) {
      only = arg.slice(7).split(",").map((s) => s.trim());
    } else if (arg === "--mobile") {
      mobile = true;
    } else if (arg.startsWith("--wait=")) {
      waitOverride = parseInt(arg.slice(7), 10);
    }
  }

  return { only, mobile, waitOverride };
}

async function screenshotAtViewport(
  page: any,
  slideIndex: number,
  slideId: string,
  viewport: { width: number; height: number },
  suffix: string,
  waitMs: number,
) {
  await page.setViewportSize(viewport);

  // Navigate to slide via store
  await page.evaluate((idx: number) => {
    const store = (window as any).__demoStore;
    if (store) {
      store.setState({
        currentSlide: idx,
        typewriterComplete: false,
        narrationEnded: false,
      });
    }
  }, slideIndex);

  // Wait for animations to complete
  await page.waitForTimeout(waitMs);

  const filename = suffix ? `${slideId}-${suffix}.png` : `${slideId}.png`;
  const filepath = join(OUTPUT_DIR, filename);

  await page.screenshot({ path: filepath, fullPage: false });
  return filepath;
}

async function main() {
  const { only, mobile, waitOverride } = parseArgs();

  // Check dev server
  try {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error();
  } catch {
    console.error("ERROR: Dev server not running. Start it first: pnpm dev");
    process.exit(1);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Filter slides
  const slides = only
    ? playlistSlides.filter((s) => only.includes(s.id))
    : playlistSlides;

  if (slides.length === 0) {
    console.error("ERROR: No slides matched --only filter");
    process.exit(1);
  }

  console.log(`\n📸 Screenshotting ${slides.length} slides...\n`);
  if (mobile) console.log("  Including mobile (375x812)\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();

  // Load page, skip boot, set playlist, enable recording mode
  const urlParams = playlistId !== "full" ? `?skipBoot&playlist=${playlistId}` : "?skipBoot";
  await page.goto(`${BASE_URL}/${urlParams}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  await page.evaluate(() => {
    const store = (window as any).__demoStore;
    if (store) store.setState({ isRecordingMode: true });
  });

  const results: { id: string; desktop: string; mobile?: string }[] = [];

  for (const slide of slides) {
    const slideIndex = playlistSlides.indexOf(slide);
    const waitMs = waitOverride ?? animationWait(slide);
    const num = String(slides.indexOf(slide) + 1).padStart(2, "0");

    process.stdout.write(`  [${num}/${slides.length}] ${slide.id} (${(waitMs / 1000).toFixed(1)}s)...`);

    const desktopPath = await screenshotAtViewport(
      page, slideIndex, slide.id, DESKTOP, "", waitMs,
    );

    let mobilePath: string | undefined;
    if (mobile) {
      mobilePath = await screenshotAtViewport(
        page, slideIndex, slide.id, MOBILE, "mobile", waitMs,
      );
    }

    results.push({ id: slide.id, desktop: desktopPath, mobile: mobilePath });
    console.log(" ✓");
  }

  await context.close();
  await browser.close();

  console.log(`\n📸 Done! ${results.length} slides captured.`);
  console.log(`   Output: ${OUTPUT_DIR}/\n`);

  // Print summary of just the new slides if filtering
  if (only) {
    console.log("  Files:");
    for (const r of results) {
      console.log(`    ${r.id}.png`);
      if (r.mobile) console.log(`    ${r.id}-mobile.png`);
    }
    console.log("");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
