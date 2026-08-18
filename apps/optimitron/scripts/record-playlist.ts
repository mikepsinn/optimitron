/**
 * Record a demo playlist as a video with narration audio.
 *
 * Approach:
 *   1. Regenerate stale narration MP3s
 *   2. Record each slide individually with Playwright (duration = audio length)
 *   3. Concatenate narration MP3s into one audio track
 *   4. Merge video + audio with ffmpeg
 *
 * Usage:
 *   npx tsx scripts/record-playlist.ts [playlistId] [baseUrl]
 *
 * Prerequisites:
 *   - Dev server running
 *   - GOOGLE_GENERATIVE_AI_API_KEY in .env
 *   - ffmpeg installed
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../../.env") });
config({ path: resolve(__dirname, "../.env"), override: true });

import { getPlaylistSegments, PLAYLISTS } from "../src/lib/demo-script";
import {
  getNarrationManifestLookupKeys,
  type NarrationManifest,
} from "../src/lib/demo-narration";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Get MP3 duration in seconds using ffprobe
function getAudioDuration(filePath: string): number {
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
      { encoding: "utf8" },
    ).trim();
    return parseFloat(out) || 10;
  } catch {
    return 10; // fallback
  }
}

async function main() {
  const playlistId = process.argv[2] ?? "protocol-labs";
  const baseUrl = process.argv[3] ?? "http://localhost:3001";

  const playlist = PLAYLISTS.find((p) => p.id === playlistId);
  if (!playlist) {
    console.error(`Playlist "${playlistId}" not found.`);
    process.exit(1);
  }

  const segments = getPlaylistSegments(playlistId);
  const outDir = path.resolve(__dirname, "../../..", "docs", "demo-scripts");
  const audioDir = path.resolve(__dirname, "..", "public", "audio", "narration");
  fs.mkdirSync(outDir, { recursive: true });

  // Step 1: Regenerate narration
  console.log("Step 1: Ensuring narration MP3s are up to date...\n");
  try {
    execSync(`npx tsx scripts/generate-narration.ts --playlist=${playlistId}`, {
      cwd: resolve(__dirname, ".."),
      stdio: "inherit",
    });
  } catch {
    console.error("Warning: Narration generation failed. Continuing with existing audio.\n");
  }

  // Load manifest to find audio files
  const manifestPath = path.join(audioDir, "manifest.json");
  const manifest: NarrationManifest = JSON.parse(
    fs.readFileSync(manifestPath, "utf8"),
  );

  // Step 2: Record video
  console.log("\nStep 2: Recording slides...\n");

  const { chromium } = await import("@playwright/test");

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    colorScheme: "dark",
    recordVideo: {
      dir: outDir,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  // Build audio concat list
  const audioFiles: string[] = [];

  for (const [i, seg] of segments.entries()) {
    const id = seg.id;

    // Find audio file
    const entry = getNarrationManifestLookupKeys(id)
      .map((key) => manifest[key])
      .find((candidate) => candidate !== undefined);
    const audioFile = entry ? path.join(audioDir, entry.file) : null;
    const duration = audioFile && fs.existsSync(audioFile) ? getAudioDuration(audioFile) : 10;

    if (audioFile && fs.existsSync(audioFile)) {
      audioFiles.push(audioFile);
    }

    console.log(`[${i + 1}/${segments.length}] ${id} — ${duration.toFixed(1)}s`);

    // Navigate to slide
    const url = `${baseUrl}/demo?playlist=${playlistId}#${id}`;
    await page.goto("about:blank");
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Wait for slide animations + narration duration
    // Extra 2s for animations to start, then hold for audio duration
    await page.waitForTimeout((duration + 2) * 1000);
  }

  await context.close();
  await browser.close();

  // Find the recorded video
  const videos = fs.readdirSync(outDir).filter((f) => f.endsWith(".webm"));
  const latest = videos.sort().pop();
  if (!latest) {
    console.error("No video file found.");
    process.exit(1);
  }

  const videoPath = path.join(outDir, latest);
  const videoFinal = path.join(outDir, `${playlistId}-video.webm`);
  fs.renameSync(videoPath, videoFinal);
  console.log(`\n  Video: ${videoFinal}`);

  // Step 3: Concatenate audio
  console.log("\nStep 3: Concatenating narration audio...\n");

  const audioListPath = path.join(outDir, "audio-list.txt");
  const audioListContent = audioFiles
    .map((f) => `file '${f.replace(/\\/g, "/")}'`)
    .join("\n");
  fs.writeFileSync(audioListPath, audioListContent);

  const audioFinal = path.join(outDir, `${playlistId}-audio.mp3`);
  try {
    execSync(
      `ffmpeg -y -f concat -safe 0 -i "${audioListPath}" -c copy "${audioFinal}"`,
      { stdio: "inherit" },
    );
    console.log(`  Audio: ${audioFinal}`);
  } catch {
    console.error("  ffmpeg concat failed. Audio files listed in:", audioListPath);
  }

  // Step 4: Merge video + audio
  console.log("\nStep 4: Merging video + audio...\n");

  const finalPath = path.join(outDir, `${playlistId}-recording.mp4`);
  try {
    execSync(
      `ffmpeg -y -i "${videoFinal}" -i "${audioFinal}" -c:v libx264 -c:a aac -shortest "${finalPath}"`,
      { stdio: "inherit" },
    );
    console.log(`\n✅ Final video: ${finalPath}`);
  } catch {
    console.error("  ffmpeg merge failed.");
    console.log(`  Video: ${videoFinal}`);
    console.log(`  Audio: ${audioFinal}`);
    console.log("  Merge manually: ffmpeg -i video.webm -i audio.mp3 -c:v libx264 -c:a aac -shortest output.mp4");
  }

  // Cleanup
  fs.unlinkSync(audioListPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
