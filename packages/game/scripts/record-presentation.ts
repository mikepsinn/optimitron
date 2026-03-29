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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";

import { SLIDES, resolvePlaylist, type SlideConfig } from "../lib/demo/demo-config";

// Parse --playlist flag (e.g., --playlist=protocol-labs)
const playlistArg = process.argv.find((a) => a.startsWith("--playlist="));
const playlistId = playlistArg?.split("=")[1] || "full";
const activeSlides: SlideConfig[] = resolvePlaylist(playlistId);

const OUTPUT_DIR = join(process.cwd(), "presentation-recording");
const NARRATION_DIR = join(process.cwd(), "public", "audio", "narration");
const MANIFEST_PATH = join(NARRATION_DIR, "manifest.json");
const BASE_URL = process.env.GAME_URL || "http://localhost:4000";

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

  for (const slide of activeSlides) {
    const configDuration = Math.max(slide.duration || 8, 5);
    let waitMs = configDuration * 1000;

    const manifestKey = manifest?.[`${playlistId}--${slide.id}`] ? `${playlistId}--${slide.id}` : slide.id;
    if (manifest?.[manifestKey]) {
      const mp3Path = join(NARRATION_DIR, manifest[manifestKey].file);
      if (existsSync(mp3Path)) {
        const audioDuration = getAudioDuration(mp3Path);
        if (audioDuration !== null) {
          // Use audio duration + 1s buffer, but at least the config duration
          waitMs = Math.max(audioDuration + 1, configDuration) * 1000;
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

  // Skip boot screen, set playlist, enable recording mode
  const urlParams = playlistId !== "full" ? `?skipBoot&playlist=${playlistId}` : "?skipBoot";
  await page.goto(`${BASE_URL}/${urlParams}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Enable recording mode (hides controls) and reset to trigger fresh audio on slide 0
  await page.evaluate(() => {
    const store = (window as any).__demoStore;
    if (store) {
      store.setState({ isRecordingMode: true, currentSlide: -1 });
    }
  });
  await page.waitForTimeout(500);

  console.log(`  Playlist: ${playlistId}`);
  console.log(`  Total slides: ${activeSlides.length}`);
  console.log(`  Resolution: 1920x1080`);
  console.log("");

  let totalWait = 0;
  const slideTimestamps: { id: string; startMs: number; endMs: number }[] = [];
  const recordingStart = Date.now();

  // Navigate through each slide, wait for in-browser audio to finish
  for (let i = 0; i < activeSlides.length; i++) {
    const slide = activeSlides[i];
    const slideStart = Date.now();

    // Set slide directly via store (resets narrationEnded to false)
    await page.evaluate((idx) => {
      const store = (window as any).__demoStore;
      if (store) store.setState({ currentSlide: idx, typewriterComplete: false, narrationEnded: false });
    }, i);

    // Wait for narrationEnded to become true (audio finished in browser),
    // with a max timeout based on config duration + buffer
    const maxWaitMs = Math.max((slide.duration || 8) * 1000, 5000) + 30_000;
    const pollInterval = 200;
    let waited = 0;

    // First slide needs extra init time for audio hook to mount
    const initDelay = i === 0 ? 2000 : 500;
    await page.waitForTimeout(initDelay);
    waited += initDelay;

    while (waited < maxWaitMs) {
      const ended = await page.evaluate(() => {
        const store = (window as any).__demoStore;
        return store?.getState()?.narrationEnded === true;
      });
      if (ended) break;
      await page.waitForTimeout(pollInterval);
      waited += pollInterval;
    }

    // Brief hold after narration ends (let last words breathe)
    await page.waitForTimeout(500);

    const elapsed = Date.now() - slideStart;
    totalWait += elapsed;

    slideTimestamps.push({
      id: slide.id,
      startMs: slideStart - recordingStart,
      endMs: Date.now() - recordingStart,
    });

    const slideNum = String(i + 1).padStart(2, "0");
    console.log(`  [${slideNum}/${activeSlides.length}] ${slide.id} (${(elapsed / 1000).toFixed(1)}s)`);
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
  const mp4Path = join(OUTPUT_DIR, `presentation-${playlistId}.mp4`);
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

  // Save timestamps for merge script
  const timestampsPath = join(OUTPUT_DIR, `timestamps-${playlistId}.json`);
  writeFileSync(timestampsPath, JSON.stringify(slideTimestamps, null, 2));
  console.log(`  Timestamps: ${timestampsPath}`);

  const totalSec = Math.round(totalWait / 1000);
  console.log(`\n🎬 Done! Total duration: ~${Math.floor(totalSec / 60)}m ${totalSec % 60}s\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
