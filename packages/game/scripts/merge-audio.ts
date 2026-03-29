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

import { SLIDES, resolvePlaylist, type SlideConfig } from "../lib/demo/demo-config";

// Parse --playlist flag (e.g., --playlist=protocol-labs)
const playlistArg = process.argv.find((a) => a.startsWith("--playlist="));
const playlistId = playlistArg?.split("=")[1] || "full";
const activeSlides: SlideConfig[] = resolvePlaylist(playlistId);

const NARRATION_DIR = join(process.cwd(), "public", "audio", "narration");
const MANIFEST_PATH = join(NARRATION_DIR, "manifest.json");
const RECORDING_DIR = join(process.cwd(), "presentation-recording");
const VIDEO_PATH = join(RECORDING_DIR, `presentation-${playlistId}.mp4`);
const CONCAT_AUDIO = join(RECORDING_DIR, "_concat_audio.mp3");
const FINAL_PATH = join(RECORDING_DIR, `presentation-${playlistId}-final.mp4`);

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

  // Load timestamps from recording (for precise alignment)
  const timestampsPath = join(RECORDING_DIR, `timestamps-${playlistId}.json`);
  let timestamps: { id: string; startMs: number; endMs: number }[] | null = null;
  if (existsSync(timestampsPath)) {
    timestamps = JSON.parse(readFileSync(timestampsPath, "utf-8"));
    console.log(`  Using timestamps from recording for precise alignment\n`);
  }

  console.log("🔊 Merging narration audio with video...\n");

  const tempDir = join(RECORDING_DIR, "_temp_audio");
  mkdirSync(tempDir, { recursive: true });

  const concatEntries: string[] = [];
  let totalAudioDuration = 0;

  for (let i = 0; i < activeSlides.length; i++) {
    const slide = activeSlides[i];
    const entry = manifest[`${playlistId}--${slide.id}`] || manifest[slide.id];
    const ts = timestamps?.[i];

    // How long this slide was visible in the video
    const slideVisibleSec = ts
      ? (ts.endMs - ts.startMs) / 1000
      : Math.max(slide.duration || 8, 5);

    if (entry) {
      const mp3Path = join(NARRATION_DIR, entry.file);
      if (existsSync(mp3Path)) {
        const audioDur = getAudioDuration(mp3Path);

        // Add narration
        concatEntries.push(`file '${mp3Path.replace(/\\/g, "/")}'`);
        totalAudioDuration += audioDur;

        // Fill remaining visible time with silence (the gap between audio end and slide transition)
        const gap = slideVisibleSec - audioDur;
        if (gap > 0.1) {
          const gapSilence = join(tempDir, `gap_${slide.id}.mp3`);
          generateSilence(gapSilence, gap);
          concatEntries.push(`file '${gapSilence.replace(/\\/g, "/")}'`);
          totalAudioDuration += gap;
        }

        console.log(`  [${String(i + 1).padStart(2, "0")}] ${slide.id} (${audioDur.toFixed(1)}s audio + ${Math.max(0, gap).toFixed(1)}s gap)`);
        continue;
      }
    }

    // No audio — insert silence matching visible duration
    const slideSilence = join(tempDir, `silence_${slide.id}.mp3`);
    generateSilence(slideSilence, slideVisibleSec);
    concatEntries.push(`file '${slideSilence.replace(/\\/g, "/")}'`);
    totalAudioDuration += slideVisibleSec;

    console.log(`  [${String(i + 1).padStart(2, "0")}] ${slide.id} (silence ${slideVisibleSec.toFixed(1)}s)`);
  }

  // Add final hold silence (matches the 3s hold in the recording script)
  const finalSilence = join(tempDir, "silence_final.mp3");
  generateSilence(finalSilence, 3);
  concatEntries.push(`file '${finalSilence.replace(/\\/g, "/")}'`);
  totalAudioDuration += 3;

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
