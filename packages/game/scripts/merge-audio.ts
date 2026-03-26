/**
 * Merge narration audio with a silent video recording.
 *
 * Usage: npx tsx scripts/merge-audio.ts
 *
 * Prerequisites:
 * - narration audio in public/audio/narration/ (run generate:narration first)
 * - video in presentation-recording/presentation.mp4 (run record first)
 *
 * Output: presentation-recording/presentation-final.mp4
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";

import { SLIDES } from "../lib/demo/demo-config";

const NARRATION_DIR = join(process.cwd(), "public", "audio", "narration");
const MANIFEST_PATH = join(NARRATION_DIR, "manifest.json");
const RECORDING_DIR = join(process.cwd(), "presentation-recording");
const VIDEO_PATH = join(RECORDING_DIR, "presentation.mp4");
const CONCAT_AUDIO = join(RECORDING_DIR, "_concat_audio.mp3");
const FINAL_PATH = join(RECORDING_DIR, "presentation-final.mp4");

/** Get audio duration in seconds via ffprobe */
function getAudioDuration(path: string): number {
  try {
    const result = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${path}"`,
      { stdio: "pipe" }
    );
    return parseFloat(result.toString().trim()) || 0;
  } catch {
    return 0;
  }
}

/** Generate a silent MP3 of given duration */
function generateSilence(outputPath: string, durationSec: number) {
  execSync(
    `ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t ${durationSec.toFixed(2)} -codec:a libmp3lame -b:a 128k "${outputPath}"`,
    { stdio: "pipe" }
  );
}

async function main() {
  // Verify prerequisites
  if (!existsSync(VIDEO_PATH)) {
    console.error(`ERROR: Video not found at ${VIDEO_PATH}. Run 'pnpm record' first.`);
    process.exit(1);
  }

  if (!existsSync(MANIFEST_PATH)) {
    console.error(`ERROR: Narration manifest not found. Run 'pnpm generate:narration' first.`);
    process.exit(1);
  }

  const manifest: Record<string, { file: string }> = JSON.parse(
    readFileSync(MANIFEST_PATH, "utf-8")
  );

  console.log("\n🔊 Merging narration audio with video...\n");

  // Build ffmpeg concat file
  // For each slide: narration MP3 + silence gap (2s between slides)
  const tempDir = join(RECORDING_DIR, "_temp_audio");
  mkdirSync(tempDir, { recursive: true });

  const concatEntries: string[] = [];
  const silencePath = join(tempDir, "silence_2s.mp3");
  generateSilence(silencePath, 2);

  let totalAudioDuration = 0;

  for (let i = 0; i < SLIDES.length; i++) {
    const slide = SLIDES[i];
    const entry = manifest[slide.id];

    if (entry) {
      const mp3Path = join(NARRATION_DIR, entry.file);
      if (existsSync(mp3Path)) {
        // Add narration
        concatEntries.push(`file '${mp3Path.replace(/\\/g, "/")}'`);
        const dur = getAudioDuration(mp3Path);
        totalAudioDuration += dur;

        // Add silence gap between slides (not after last)
        if (i < SLIDES.length - 1) {
          concatEntries.push(`file '${silencePath.replace(/\\/g, "/")}'`);
          totalAudioDuration += 2;
        }

        console.log(`  [${String(i + 1).padStart(2, "0")}] ${slide.id} (${dur.toFixed(1)}s)`);
        continue;
      }
    }

    // No audio for this slide — insert silence matching its duration
    const slideDuration = Math.max(slide.duration || 8, 5);
    const slideSilence = join(tempDir, `silence_${slide.id}.mp3`);
    generateSilence(slideSilence, slideDuration);
    concatEntries.push(`file '${slideSilence.replace(/\\/g, "/")}'`);
    totalAudioDuration += slideDuration;

    console.log(`  [${String(i + 1).padStart(2, "0")}] ${slide.id} (silence ${slideDuration}s)`);
  }

  // Write concat list
  const concatListPath = join(tempDir, "concat.txt");
  writeFileSync(concatListPath, concatEntries.join("\n") + "\n");

  // Concatenate all audio
  console.log("\n  Concatenating audio tracks...");
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${CONCAT_AUDIO}"`,
    { stdio: "pipe" }
  );

  // Merge audio with video
  console.log("  Merging with video...");
  try {
    execSync(
      `ffmpeg -y -i "${VIDEO_PATH}" -i "${CONCAT_AUDIO}" -c:v copy -c:a aac -b:a 128k -shortest "${FINAL_PATH}"`,
      { stdio: "pipe" }
    );
    console.log(`\n  ✅ Final video: ${FINAL_PATH}`);
  } catch (err: any) {
    console.error(`  ❌ Merge failed: ${err.message}`);
    console.log(`  Concatenated audio available at: ${CONCAT_AUDIO}`);
  }

  // Clean up temp files
  try {
    execSync(`rm -rf "${tempDir}"`, { stdio: "pipe" });
    if (existsSync(CONCAT_AUDIO)) unlinkSync(CONCAT_AUDIO);
  } catch {}

  const totalMin = Math.floor(totalAudioDuration / 60);
  const totalSec = Math.round(totalAudioDuration % 60);
  console.log(`\n🔊 Done! Audio duration: ~${totalMin}m ${totalSec}s\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
