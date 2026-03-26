/**
 * Record the full presentation as a video using Playwright.
 *
 * Usage: npx tsx scripts/record-presentation.ts
 *
 * Outputs: presentation-recording/presentation.webm (raw)
 *          presentation-recording/presentation.mp4 (converted via ffmpeg)
 */

import { chromium } from "@playwright/test";
import { existsSync, mkdirSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";

// Import slide config for durations
import { SLIDES } from "../lib/demo/demo-config";

const OUTPUT_DIR = join(process.cwd(), "presentation-recording");
const BASE_URL = "http://localhost:3333";

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

  // Skip boot screen, suppress help overlay
  await page.goto(`${BASE_URL}/?skipBoot`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  console.log(`  Total slides: ${SLIDES.length}`);
  console.log(`  Resolution: 1920x1080`);
  console.log("");

  // Navigate through each slide using store
  for (let i = 0; i < SLIDES.length; i++) {
    const slide = SLIDES[i];
    const duration = Math.max(slide.duration || 8, 5) * 1000; // Min 5s per slide

    // Set slide directly via store
    await page.evaluate((idx) => {
      const store = (window as any).__demoStore;
      if (store) store.setState({ currentSlide: idx, typewriterComplete: false });
    }, i);

    const slideNum = String(i + 1).padStart(2, "0");
    console.log(`  [${slideNum}/${SLIDES.length}] ${slide.id} (${(duration / 1000).toFixed(0)}s)`);

    // Wait for slide duration to let animations play
    await page.waitForTimeout(duration);
  }

  // Hold on final slide for a few extra seconds
  await page.waitForTimeout(3000);

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

  // Calculate total duration
  const totalDuration = SLIDES.reduce((sum, s) => sum + Math.max(s.duration || 8, 5), 0) + 3;
  console.log(`\n🎬 Done! Total duration: ~${Math.floor(totalDuration / 60)}m ${totalDuration % 60}s\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
