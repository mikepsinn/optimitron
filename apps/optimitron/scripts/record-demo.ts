/**
 * Record the full PL Genesis demo: video capture + narration audio.
 *
 * This script orchestrates:
 * 1. Playwright browser recording of the site walkthrough
 * 2. Gemini TTS narration generation
 * 3. Outputs ffmpeg commands to combine them
 *
 * Usage:
 *   pnpm --filter @optimitron/web demo:record
 *
 * Prerequisites:
 *   - GOOGLE_GENERATIVE_AI_API_KEY in root .env
 *   - ffmpeg installed for final assembly
 *   - Site pre-built (`pnpm build`)
 */
import "./load-env";
import { execSync } from "node:child_process";
import { existsSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const DEMO_ASSETS = join(ROOT, "demo-assets");
const NARRATION_DIR = join(DEMO_ASSETS, "narration");

async function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║  PL Genesis Demo Recording Pipeline  ║");
  console.log("╚══════════════════════════════════════╝\n");

  if (!existsSync(DEMO_ASSETS)) {
    mkdirSync(DEMO_ASSETS, { recursive: true });
  }

  // Step 1: Run Playwright recording
  console.log("Step 1: Recording browser walkthrough...\n");
  try {
    execSync(
      "npx playwright test e2e/demo-recording.spec.ts --project=demo-recording",
      {
        cwd: ROOT,
        stdio: "inherit",
        env: { ...process.env, SKIP_SERVER: process.env.SKIP_SERVER ?? "" },
      },
    );
    console.log("\n  Browser recording complete.\n");
  } catch {
    console.log("\n  Browser recording finished (check test-results/ for video).\n");
  }

  // Find the recorded video
  const testResults = join(ROOT, "test-results");
  let videoPath = "";
  if (existsSync(testResults)) {
    const findVideo = (dir: string): string => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          const found = findVideo(full);
          if (found) return found;
        } else if (entry.name.endsWith(".webm")) {
          return full;
        }
      }
      return "";
    };
    videoPath = findVideo(testResults);
  }

  if (videoPath) {
    console.log(`  Video found: ${videoPath}\n`);
  } else {
    console.log("  No video file found in test-results/. Check Playwright output.\n");
  }

  // Step 2: Generate narration
  console.log("Step 2: Generating narration audio via Gemini TTS...\n");
  try {
    execSync("npx tsx scripts/generate-narration.ts", {
      cwd: ROOT,
      stdio: "inherit",
    });
  } catch {
    console.log("  Narration generation encountered errors (see above).\n");
  }

  // Step 3: Output assembly instructions
  console.log("\n════════════════════════════════════════");
  console.log("  ASSEMBLY INSTRUCTIONS");
  console.log("════════════════════════════════════════\n");

  if (videoPath) {
    console.log("Video file:");
    console.log(`  ${videoPath}\n`);
  }

  if (existsSync(NARRATION_DIR)) {
    const audioFiles = readdirSync(NARRATION_DIR)
      .filter((f) => f.endsWith(".wav"))
      .sort();
    if (audioFiles.length > 0) {
      console.log("Audio files:");
      for (const f of audioFiles) {
        console.log(`  ${join(NARRATION_DIR, f)}`);
      }
    }
  }

  console.log("\nTo concatenate narration files:");
  console.log(
    '  ffmpeg -f concat -safe 0 -i narration-list.txt -c copy demo-assets/narration-full.wav',
  );
  console.log("\nTo combine video + narration:");
  console.log(
    "  ffmpeg -i <video.webm> -i demo-assets/narration-full.wav \\",
  );
  console.log(
    "    -c:v libx264 -c:a aac -shortest demo-assets/demo-final.mp4",
  );
  console.log("\nOr for a quick merge with the raw video:");
  if (videoPath) {
    console.log(
      `  ffmpeg -i "${videoPath}" -i demo-assets/narration-full.wav -c:v libx264 -c:a aac -shortest demo-assets/demo-final.mp4`,
    );
  }
  console.log("");
}

main().catch(console.error);
