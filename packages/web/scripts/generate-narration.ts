/**
 * Offline narration generator — creates MP3 files from demo-script narration.
 *
 * Usage:
 *   npx tsx scripts/generate-narration.ts                    # all segments
 *   npx tsx scripts/generate-narration.ts --playlist=protocol-labs  # one playlist
 *
 * - Reads segments from src/lib/demo-script.ts
 * - Hashes each narration text (SHA-256, first 16 hex chars)
 * - Only regenerates when narration changes (compares against manifest)
 * - Generates WAV via Gemini TTS, converts to MP3 via ffmpeg
 * - Saves to public/audio/narration/{slideId}.mp3
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../../.env") });
config({ path: resolve(__dirname, "../.env"), override: true });
import { createHash } from "crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { SEGMENTS, getPlaylistSegments, PLAYLISTS } from "../src/lib/demo-script";
import { segmentToSlideId } from "../src/lib/demo-tts";

// ---------------------------------------------------------------------------
// Gemini TTS — inline to avoid cross-package dependency
// ---------------------------------------------------------------------------

import { GoogleGenAI } from "@google/genai";

// Try to import Wishonia voice config; fall back to defaults
let VOICE = "Kore";
let INSTRUCTIONS =
  "Speak in a patient, warm, slightly quick tone. You are an alien governance AI narrating a presentation.";
let MODEL = "gemini-2.5-flash-preview-tts";

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const w = require("@optimitron/wishonia-widget");
  VOICE = w.WISHONIA_VOICE ?? VOICE;
  INSTRUCTIONS = w.WISHONIA_SPEAKING_INSTRUCTIONS ?? INSTRUCTIONS;
  MODEL = w.WISHONIA_TTS_MODEL ?? MODEL;
} catch {
  // wishonia-widget not available; defaults are fine
}

function convertToWav(audioData: Uint8Array, mimeType: string): Uint8Array {
  let bitsPerSample = 16;
  let rate = 24000;
  for (const param of mimeType.split(";")) {
    const t = param.trim();
    if (t.toLowerCase().startsWith("rate=")) {
      const v = parseInt(t.split("=")[1], 10);
      if (!isNaN(v)) rate = v;
    } else if (t.startsWith("audio/L")) {
      const v = parseInt(t.split("L")[1], 10);
      if (!isNaN(v)) bitsPerSample = v;
    }
  }
  const numChannels = 1;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = rate * blockAlign;
  const dataSize = audioData.length;
  const header = new ArrayBuffer(44);
  const dv = new DataView(header);
  const w = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i));
  };
  w(0, "RIFF");
  dv.setUint32(4, 36 + dataSize, true);
  w(8, "WAVE");
  w(12, "fmt ");
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, numChannels, true);
  dv.setUint32(24, rate, true);
  dv.setUint32(28, byteRate, true);
  dv.setUint16(32, blockAlign, true);
  dv.setUint16(34, bitsPerSample, true);
  w(36, "data");
  dv.setUint32(40, dataSize, true);
  const result = new Uint8Array(44 + dataSize);
  result.set(new Uint8Array(header), 0);
  result.set(audioData, 44);
  return result;
}

async function generateSpeech(text: string, apiKey: string): Promise<Uint8Array> {
  const client = new GoogleGenAI({ apiKey });
  const result = await client.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: `${INSTRUCTIONS}\n\n${text}` }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } },
      },
    },
  });
  const part = result.candidates?.[0]?.content?.parts?.[0];
  if (!part?.inlineData?.data) {
    throw new Error("No audio data received from Gemini TTS");
  }
  const audioData = new Uint8Array(Buffer.from(part.inlineData.data, "base64"));
  const mime = part.inlineData.mimeType || "audio/L16;rate=24000";
  return convertToWav(audioData, mime);
}

// ---------------------------------------------------------------------------
// Manifest helpers
// ---------------------------------------------------------------------------

const OUTPUT_DIR = join(__dirname, "..", "public", "audio", "narration");
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
    { stdio: "pipe" },
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("ERROR: GOOGLE_GENERATIVE_AI_API_KEY not set. Add it to .env or export it.");
    process.exit(1);
  }

  try {
    execSync("ffmpeg -version", { stdio: "pipe" });
  } catch {
    console.error("ERROR: ffmpeg not found. Install it: choco install ffmpeg");
    process.exit(1);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Parse --playlist flag
  const playlistArg = process.argv.find((a) => a.startsWith("--playlist="));
  const playlistId = playlistArg?.split("=")[1] || null;

  const segments = playlistId ? getPlaylistSegments(playlistId) : SEGMENTS;

  // ── Validation: check TTS mappings ──────────────────────────────────
  const segmentIds = new Set(SEGMENTS.map((s) => s.id));
  const validationErrors: string[] = [];

  // Check all playlist segments have TTS mappings
  for (const playlist of PLAYLISTS) {
    for (const segId of playlist.segmentIds) {
      if (!segmentIds.has(segId)) {
        validationErrors.push(
          `Playlist "${playlist.id}" references segment "${segId}" which does not exist in SEGMENTS`,
        );
      }
    }
  }

  // Check segments used in the target playlist have manifest keys
  for (const seg of segments) {
    if (!seg.narration?.trim()) continue;
    const manifestKey = segmentToSlideId[seg.id] ?? seg.id;
    // Warn if using segment ID as manifest key (no explicit mapping)
    if (!segmentToSlideId[seg.id]) {
      console.warn(
        `  ⚠️  Segment "${seg.id}" has no entry in segmentToSlideId (demo-tts.ts). ` +
        `Using "${seg.id}" as manifest key. Add it to segmentToSlideId to fix TTS lookup.`,
      );
    }
  }

  if (validationErrors.length > 0) {
    console.error("\n❌ Validation errors:\n");
    for (const err of validationErrors) {
      console.error(`  • ${err}`);
    }
    console.error(
      "\nFix these in:\n" +
      "  - packages/web/src/lib/demo-script.ts (SEGMENTS / PLAYLISTS)\n" +
      "  - packages/web/src/lib/demo-tts.ts (segmentToSlideId)\n",
    );
    process.exit(1);
  }

  const manifest = loadManifest();
  let generated = 0;
  let cached = 0;
  let skipped = 0;
  let errors = 0;

  console.log(
    `\n🎙️  Narration Generator — ${segments.length} segments${playlistId ? ` (playlist: ${playlistId})` : ""}\n`,
  );

  // Pre-scan: classify each segment before generating
  const toGenerate: typeof segments = [];
  const preCached: string[] = [];
  const preSkipped: string[] = [];

  for (const seg of segments) {
    if (!seg.narration?.trim()) {
      preSkipped.push(seg.id);
      continue;
    }
    const hash = hashText(seg.narration);
    const manifestKey = segmentToSlideId[seg.id] ?? seg.id;
    const mp3Path = join(OUTPUT_DIR, `${manifestKey}.mp3`);
    if (manifest[manifestKey]?.hash === hash && existsSync(mp3Path)) {
      preCached.push(seg.id);
    } else {
      toGenerate.push(seg);
    }
  }

  console.log(`  ✓  ${preCached.length} cached (up to date)`);
  if (preSkipped.length > 0) {
    console.log(`  ⏭  ${preSkipped.length} skipped (no narration)`);
  }
  console.log(`  🔄 ${toGenerate.length} need regeneration`);

  if (toGenerate.length > 0) {
    const est = toGenerate.length * 15;
    console.log(`  ⏱️  Estimated time: ~${Math.ceil(est / 60)} min ${est % 60}s\n`);
    for (const id of toGenerate.map((s) => s.id)) {
      console.log(`     → ${id}`);
    }
  }
  console.log("");

  if (toGenerate.length === 0) {
    console.log("  Nothing to do — all audio is up to date!\n");
    return;
  }

  for (const seg of segments) {
    if (!seg.narration?.trim()) {
      skipped++;
      continue;
    }

    const hash = hashText(seg.narration);
    // Use the slide-level key that demo-tts.ts looks up in the manifest
    const manifestKey = segmentToSlideId[seg.id] ?? seg.id;
    const mp3File = `${manifestKey}.mp3`;
    const mp3Path = join(OUTPUT_DIR, mp3File);

    if (manifest[manifestKey]?.hash === hash && existsSync(mp3Path)) {
      cached++;
      console.log(`  ✓  ${seg.id} → ${manifestKey} — cached`);
      continue;
    }

    if (manifest[manifestKey]) {
      console.log(`  🔄 ${seg.id} → ${manifestKey} — narration changed, regenerating...`);
    } else {
      console.log(`  🆕 ${seg.id} → ${manifestKey} — generating...`);
    }

    try {
      const wavBytes = await generateSpeech(seg.narration, apiKey);
      writeFileSync(TEMP_WAV, wavBytes);
      wavToMp3(TEMP_WAV, mp3Path);
      if (existsSync(TEMP_WAV)) unlinkSync(TEMP_WAV);

      manifest[manifestKey] = {
        hash,
        file: mp3File,
        generatedAt: new Date().toISOString(),
      };
      generated++;
      console.log(`  ✅ ${seg.id} → ${manifestKey} — done`);
    } catch (err: any) {
      errors++;
      console.error(`  ❌ ${seg.id} — ${err.message}`);
    }

    // Rate-limit: pause every 5 generations
    if (generated > 0 && generated % 5 === 0) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  saveManifest(manifest);
  if (existsSync(TEMP_WAV)) unlinkSync(TEMP_WAV);

  console.log(
    `\n📊 Summary: ${generated} generated, ${cached} cached, ${skipped} skipped, ${errors} errors`,
  );
  console.log(`📁 Output: ${OUTPUT_DIR}\n`);

  if (generated > 0) {
    console.log(`💡 ${generated} audio file(s) updated. Commit public/audio/narration/ to persist.\n`);
  }

  // ── Post-generation validation ──────────────────────────────────────
  const postErrors: string[] = [];
  for (const seg of segments) {
    if (!seg.narration?.trim()) continue;
    const manifestKey = segmentToSlideId[seg.id] ?? seg.id;
    const entry = manifest[manifestKey];
    if (!entry) {
      postErrors.push(`Segment "${seg.id}" → manifest key "${manifestKey}" NOT in manifest`);
      continue;
    }
    const mp3Path = join(OUTPUT_DIR, entry.file);
    if (!existsSync(mp3Path)) {
      postErrors.push(`Segment "${seg.id}" → file "${entry.file}" does NOT exist on disk`);
    }
    const expectedHash = hashText(seg.narration);
    if (entry.hash !== expectedHash) {
      postErrors.push(
        `Segment "${seg.id}" → hash mismatch (manifest: ${entry.hash}, text: ${expectedHash}). ` +
        `Audio is stale. Re-run this script.`,
      );
    }
  }

  if (postErrors.length > 0) {
    console.error("⚠️  Post-generation warnings:\n");
    for (const err of postErrors) {
      console.error(`  • ${err}`);
    }
    console.error(
      "\nTo fix: ensure segmentToSlideId in demo-tts.ts matches the manifest keys.\n",
    );
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
