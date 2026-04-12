/**
 * TTS Voice Tester — generates audio samples across voices and delivery styles.
 *
 * Usage:
 *   npx tsx scripts/test-tts-voices.ts
 *   npx tsx scripts/test-tts-voices.ts "Your custom test sentence here."
 *   npx tsx scripts/test-tts-voices.ts --text-file=path/to/file.txt
 *
 * Output: public/audio/tts-test/{voice}-{style}.mp3
 * Listen to all files and pick the combination that hits hardest.
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../../.env") });
config({ path: resolve(__dirname, "../.env"), override: true });
import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { GoogleGenAI } from "@google/genai";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const VOICES = [
  "Kore",    // authoritative female
  "Aoede",   // warm female
  "Leda",    // calm female
  "Zephyr",  // soft female
  "Charon",  // deep male
  "Fenrir",  // strong male
  "Orus",    // resonant male
  "Puck",    // lighter male
] as const;

// Each style is a phrase that fits after "Say " — e.g. `Say slowly and solemnly: "..."`
// The bare string (no preamble) is also supported.
export const STYLES: Record<string, string> = {
  solemn:    "slowly and solemnly",
  grave:     "as if reading a death toll",
  building:  "starting quiet and building in intensity",
  calm:      "calmly and measured, letting the facts speak for themselves",
  angry:     "with controlled, barely contained anger",
  chaplin:   "like the final speech in The Great Dictator",
  narrator:  "as an authoritative documentary narrator",
  wishonia:  "in a patient, warm, slightly quick tone",
  bare:      "", // no style direction — raw voice
};

/** Build a Gemini TTS prompt in the "director format". */
export function buildTtsPrompt(style: string, text: string): string {
  const safeText = text.replace(/"/g, "'");
  return style ? `Say ${style}: "${safeText}"` : `Say: "${safeText}"`;
}

const DEFAULT_TEXT =
  "They have permitted 150 thousand people to die of diseases every day, " +
  "104 every minute that passes, while possessing the means to accelerate solutions. " +
  "The annual toll: 2.88 billion years of healthy life lost to disease and disability, quietly deleted.";

const MODELS: Record<string, string> = {
  flash: "gemini-2.5-flash-preview-tts",
  pro: "gemini-2.5-pro-preview-tts",
};

// ---------------------------------------------------------------------------
// WAV conversion
// ---------------------------------------------------------------------------

function convertToWav(audioData: Uint8Array, mimeType: string): Uint8Array {
  let bitsPerSample = 16;
  let rate = 24000;
  for (const param of mimeType.split(";")) {
    const t = param.trim();
    if (t.toLowerCase().startsWith("rate=")) {
      const v = parseInt(t.split("=")[1]!, 10);
      if (!isNaN(v)) rate = v;
    } else if (t.startsWith("audio/L")) {
      const v = parseInt(t.split("L")[1]!, 10);
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

// ---------------------------------------------------------------------------
// TTS
// ---------------------------------------------------------------------------

async function generateSpeech(
  text: string,
  voice: string,
  instructions: string,
  model: string,
  apiKey: string,
): Promise<Uint8Array> {
  const client = new GoogleGenAI({ apiKey });
  const prompt = buildTtsPrompt(instructions, text);
  const result = await client.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
      },
    },
  });
  const part = result.candidates?.[0]?.content?.parts?.[0];
  if (!part?.inlineData?.data) {
    throw new Error("No audio data received");
  }
  const audioData = new Uint8Array(Buffer.from(part.inlineData.data, "base64"));
  const mime = part.inlineData.mimeType || "audio/L16;rate=24000";
  return convertToWav(audioData, mime);
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
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("ERROR: GOOGLE_GENERATIVE_AI_API_KEY not set.");
    process.exit(1);
  }

  try {
    execSync("ffmpeg -version", { stdio: "pipe" });
  } catch {
    console.error("ERROR: ffmpeg not found. Install it: choco install ffmpeg");
    process.exit(1);
  }

  // Parse args
  let text = DEFAULT_TEXT;
  const textFileArg = process.argv.find((a) => a.startsWith("--text-file="));
  if (textFileArg) {
    const filePath = textFileArg.split("=")[1]!;
    text = readFileSync(filePath, "utf-8").trim();
  } else if (process.argv[2] && !process.argv[2].startsWith("-")) {
    text = process.argv[2];
  }

  const OUTPUT_DIR = join(__dirname, "..", "public", "audio", "tts-test");
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const CONCURRENCY = 4;

  const combos = VOICES.flatMap((voice) =>
    Object.entries(STYLES).flatMap(([style, instructions]) =>
      Object.entries(MODELS).map(([modelKey, model]) => ({
        voice,
        style,
        instructions,
        modelKey,
        model,
      })),
    ),
  );

  // Filter to only what needs generating
  const toGenerate = combos.filter(({ voice, style, modelKey }) => {
    const filename = `${modelKey}-${voice.toLowerCase()}-${style}`;
    const mp3Path = join(OUTPUT_DIR, `${filename}.mp3`);
    if (existsSync(mp3Path)) {
      console.log(`  ✓  ${filename} — exists, skipping`);
      return false;
    }
    return true;
  });

  const total = combos.length;
  console.log(`\n🎙️  TTS Voice Tester — ${VOICES.length} voices × ${Object.keys(STYLES).length} styles × ${Object.keys(MODELS).length} models = ${total} samples`);
  console.log(`📝 Text: "${text.slice(0, 80)}${text.length > 80 ? "..." : ""}"`);
  console.log(`🔄 ${toGenerate.length} to generate (${total - toGenerate.length} cached), ${CONCURRENCY} parallel\n`);

  let done = 0;
  let errors = 0;

  async function processOne({ voice, style, instructions, modelKey, model }: typeof combos[number]) {
    const filename = `${modelKey}-${voice.toLowerCase()}-${style}`;
    const mp3Path = join(OUTPUT_DIR, `${filename}.mp3`);
    const tempWav = join(OUTPUT_DIR, `_temp_${filename}.wav`);

    console.log(`  🔄 ${filename} — generating...`);

    try {
      const wavBytes = await generateSpeech(text, voice, instructions, model, apiKey);
      writeFileSync(tempWav, wavBytes);
      wavToMp3(tempWav, mp3Path);
      if (existsSync(tempWav)) unlinkSync(tempWav);
      done++;
      console.log(`  ✅ ${filename} — done`);
    } catch (err: unknown) {
      errors++;
      if (existsSync(tempWav)) unlinkSync(tempWav);
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ ${filename} — ${message}`);
    }
  }

  // Process in batches of CONCURRENCY
  for (let i = 0; i < toGenerate.length; i += CONCURRENCY) {
    const batch = toGenerate.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(processOne));
  }

  console.log(`\n📊 Summary: ${done} generated, ${errors} errors`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  console.log(`\n🎧 Listen to the files and pick your winner!\n`);
  console.log(`Voices: ${VOICES.join(", ")}`);
  console.log(`Styles: ${Object.keys(STYLES).join(", ")}\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
