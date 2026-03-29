/**
 * Offline narration generator — creates MP3 files from slide narration text.
 *
 * Usage: GOOGLE_GENERATIVE_AI_API_KEY=... npx tsx scripts/generate-narration.ts
 *
 * - Reads all slides from demo-config.ts
 * - Hashes each narration text (SHA-256)
 * - Only regenerates when narration changes (compares against manifest)
 * - Generates WAV via Gemini TTS, converts to MP3 via ffmpeg
 * - Saves to public/audio/narration/{slideId}.mp3
 */

import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { generateSpeech } from "../lib/demo/gemini-tts";

// We need to import the SLIDES array. Since demo-config uses TS imports,
// we rely on tsx to handle the transpilation.
import { SLIDES, resolvePlaylist, PLAYLISTS } from "../lib/demo/demo-config";

// Parse --playlist flag (e.g., --playlist=protocol-labs)
// When set, generates audio only for that playlist's slides, using overridden narration.
// Override audio files are named {playlistId}--{slideId}.mp3
const playlistArg = process.argv.find((a) => a.startsWith("--playlist="));
const playlistId = playlistArg?.split("=")[1] || null;
const playlist = playlistId ? PLAYLISTS.find((p) => p.id === playlistId) : null;

// Load .env file manually (dotenv not required — just parse it)
function loadEnv() {
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv();

const OUTPUT_DIR = join(process.cwd(), "public", "audio", "narration");
const MANIFEST_PATH = join(OUTPUT_DIR, "manifest.json");
const TEMP_WAV = join(OUTPUT_DIR, "_temp.wav");

interface ManifestEntry {
  hash: string;
  file: string;
  generatedAt: string;
}

type Manifest = Record<string, ManifestEntry>;

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function loadManifest(): Manifest {
  if (existsSync(MANIFEST_PATH)) {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
  }
  return {};
}

function saveManifest(manifest: Manifest) {
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
}

function wavToMp3(wavPath: string, mp3Path: string) {
  execSync(
    `ffmpeg -y -i "${wavPath}" -codec:a libmp3lame -b:a 128k -ar 24000 "${mp3Path}"`,
    { stdio: "pipe" }
  );
}

async function main() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("ERROR: GOOGLE_GENERATIVE_AI_API_KEY not set. Add it to .env or export it.");
    process.exit(1);
  }

  // Verify ffmpeg is available
  try {
    execSync("ffmpeg -version", { stdio: "pipe" });
  } catch {
    console.error("ERROR: ffmpeg not found. Install it: choco install ffmpeg");
    process.exit(1);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const manifest = loadManifest();
  let generated = 0;
  let cached = 0;
  let errors = 0;

  // When --playlist is set, generate only for that playlist (with overrides applied)
  const slidesToGenerate = playlistId ? resolvePlaylist(playlistId) : SLIDES;
  const filePrefix = playlistId && playlist?.narrationOverrides ? `${playlistId}--` : "";
  const total = slidesToGenerate.length;

  console.log(`\n🎙️  Narration Generator — ${total} slides${playlistId ? ` (playlist: ${playlistId})` : ""}\n`);

  for (const slide of slidesToGenerate) {
    const { id, narration } = slide;
    if (!narration || narration.trim().length === 0) {
      console.log(`  ⏭  ${id} — no narration, skipping`);
      continue;
    }

    const hash = hashText(narration);
    const manifestKey = `${filePrefix}${id}`;
    const mp3File = `${filePrefix}${id}.mp3`;
    const mp3Path = join(OUTPUT_DIR, mp3File);

    // Check cache
    if (
      manifest[manifestKey]?.hash === hash &&
      existsSync(mp3Path)
    ) {
      cached++;
      console.log(`  ✓  ${id} — cached`);
      continue;
    }

    // Generate
    console.log(`  🔄 ${id} — generating...`);
    try {
      const wavBytes = await generateSpeech(narration, apiKey);

      // Write temp WAV
      writeFileSync(TEMP_WAV, wavBytes);

      // Convert to MP3
      wavToMp3(TEMP_WAV, mp3Path);

      // Clean up temp WAV
      if (existsSync(TEMP_WAV)) unlinkSync(TEMP_WAV);

      // Update manifest
      manifest[manifestKey] = {
        hash,
        file: mp3File,
        generatedAt: new Date().toISOString(),
      };

      generated++;
      console.log(`  ✅ ${id} — done`);
    } catch (err: any) {
      errors++;
      console.error(`  ❌ ${id} — error: ${err.message}`);
    }

    // Small delay to avoid rate limiting
    if (generated > 0 && generated % 5 === 0) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Save manifest
  saveManifest(manifest);

  // Clean up temp WAV if it exists
  if (existsSync(TEMP_WAV)) unlinkSync(TEMP_WAV);

  console.log(`\n📊 Summary: ${generated} generated, ${cached} cached, ${errors} errors, ${total} total`);
  console.log(`📁 Output: ${OUTPUT_DIR}\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
