/**
 * Record the full presentation as a video using Playwright.
 *
 * Usage: npx tsx scripts/record-presentation.ts
 *
 * Outputs: presentation-recording/presentation.webm (raw)
 *          presentation-recording/presentation.mp4 (converted via ffmpeg)
 *
 * If narration audio exists, slide wait times are synced to actual audio durations.
 */

import { chromium } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";

import { SLIDES } from "../lib/demo/demo-config";

const OUTPUT_DIR = join(process.cwd(), "presentation-recording");
const NARRATION_DIR = join(process.cwd(), "public", "audio", "narration");
const MANIFEST_PATH = join(NARRATION_DIR, "manifest.json");
const BASE_URL = "http://localhost:3333";

/** Get audio duration in seconds via ffprobe, or null if unavailable */
function getAudioDuration(mp3Path: string): number | null {
  try {
    const result = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${mp3Path}"`,
      { stdio: "pipe" }
    );
    const duration = parseFloat(result.toString().trim());
    return isNaN(duration) ? null : duration;
  } catch {
    return null;
  }
}

/** Load narration manifest and compute per-slide wait times */
function computeWaitTimes(): Map<string, number> {
  const waitTimes = new Map<string, number>();

  let manifest: Record<string, { file: string }> | null = null;
  if (existsSync(MANIFEST_PATH)) {
    try {
      manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
    } catch {}
  }

  for (const slide of SLIDES) {
    const configDuration = Math.max(slide.duration || 8, 5);
    let waitMs = configDuration * 1000;

    if (manifest?.[slide.id]) {
      const mp3Path = join(NARRATION_DIR, manifest[slide.id].file);
      if (existsSync(mp3Path)) {
        const audioDuration = getAudioDuration(mp3Path);
        if (audioDuration !== null) {
          // Use audio duration + 2s buffer, but at least the config duration
          waitMs = Math.max(audioDuration + 2, configDuration) * 1000;
        }
      }
    }

    waitTimes.set(slide.id, waitMs);
  }

  return waitTimes;
}

async function main() {
  // Check dev server is running
  try {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error();
  } catch {
    console.error("ERROR: Dev server not running. Start it first: pnpm dev");
    process.exit(1);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const waitTimes = computeWaitTimes();

  console.log("\n🎬 Recording presentation...\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  // Skip boot screen, enable recording mode
  await page.goto(`${BASE_URL}/?skipBoot`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Enable recording mode (hides controls)
  await page.evaluate(() => {
    const store = (window as any).__demoStore;
    if (store) store.setState({ isRecordingMode: true });
  });

  console.log(`  Total slides: ${SLIDES.length}`);
  console.log(`  Resolution: 1920x1080`);
  console.log("");

  let totalWait = 0;

  // Navigate through each slide using store
  for (let i = 0; i < SLIDES.length; i++) {
    const slide = SLIDES[i];
    const waitMs = waitTimes.get(slide.id) || 8000;

    // Set slide directly via store
    await page.evaluate((idx) => {
      const store = (window as any).__demoStore;
      if (store) store.setState({ currentSlide: idx, typewriterComplete: false, narrationEnded: false });
    }, i);

    const slideNum = String(i + 1).padStart(2, "0");
    console.log(`  [${slideNum}/${SLIDES.length}] ${slide.id} (${(waitMs / 1000).toFixed(1)}s)`);

    await page.waitForTimeout(waitMs);
    totalWait += waitMs;
  }

  // Hold on final slide
  await page.waitForTimeout(3000);
  totalWait += 3000;

  // Close context to finalize video
  const video = page.video();
  await context.close();
  await browser.close();

  if (!video) {
    console.error("ERROR: No video recorded");
    process.exit(1);
  }

  const webmPath = await video.path();
  console.log(`\n  Raw recording: ${webmPath}`);

  // Convert to MP4 with ffmpeg
  const mp4Path = join(OUTPUT_DIR, "presentation.mp4");
  console.log(`  Converting to MP4...`);

  try {
    execSync(
      `ffmpeg -y -i "${webmPath}" -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k "${mp4Path}"`,
      { stdio: "pipe" }
    );
    console.log(`  MP4: ${mp4Path}`);
  } catch (err: any) {
    console.error(`  ffmpeg conversion failed: ${err.message}`);
    console.log(`  WebM still available at: ${webmPath}`);
  }

  const totalSec = Math.round(totalWait / 1000);
  console.log(`\n🎬 Done! Total duration: ~${Math.floor(totalSec / 60)}m ${totalSec % 60}s\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
