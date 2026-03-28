/**
 * Gemini TTS - Text-to-Speech using Google's Gemini TTS model.
 * Ported from transmit/lib/gemini-tts.ts.
 *
 * Voice: Kore (winner from A/B testing 53 combos)
 * Speaking instructions: patient, warm, slightly quick
 */

import { GoogleGenAI } from "@google/genai";

const TTS_MODEL_ID = "gemini-2.5-flash-preview-tts";
const DEFAULT_VOICE = "Kore";
const DEFAULT_SPEAKING_INSTRUCTIONS =
  "Generate a patient, warm voice explaining something counterintuitive to someone smart. " +
  "Not condescending. Respects the listener's intelligence. Slightly quick.";

function parseAudioMimeType(mimeType: string): {
  bitsPerSample: number;
  rate: number;
} {
  let bitsPerSample = 16;
  let rate = 24000;

  for (const param of mimeType.split(";")) {
    const trimmed = param.trim();
    if (trimmed.toLowerCase().startsWith("rate=")) {
      const val = parseInt(trimmed.split("=")[1] ?? "", 10);
      if (!isNaN(val)) rate = val;
    } else if (trimmed.startsWith("audio/L")) {
      const val = parseInt(trimmed.split("L")[1] ?? "", 10);
      if (!isNaN(val)) bitsPerSample = val;
    }
  }

  return { bitsPerSample, rate };
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function convertToWav(audioData: Uint8Array, mimeType: string): Uint8Array {
  const { bitsPerSample, rate } = parseAudioMimeType(mimeType);
  const numChannels = 1;
  const dataSize = audioData.length;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = rate * blockAlign;
  const chunkSize = 36 + dataSize;

  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, chunkSize, true);
  writeString(view, 8, "WAVE");

  // fmt subchunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data subchunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const result = new Uint8Array(44 + dataSize);
  result.set(new Uint8Array(header), 0);
  result.set(audioData, 44);
  return result;
}

/**
 * Generate speech audio from text using Gemini TTS.
 * Returns WAV bytes.
 */
export async function generateSpeech(
  text: string,
  apiKey: string,
  voice: string = DEFAULT_VOICE,
  speakingInstructions: string = DEFAULT_SPEAKING_INSTRUCTIONS
): Promise<Uint8Array> {
  const client = new GoogleGenAI({ apiKey });

  const promptText = `${speakingInstructions}\n\n${text}`;

  const result = await client.models.generateContent({
    model: TTS_MODEL_ID,
    contents: [{ role: "user", parts: [{ text: promptText }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });

  const part = result.candidates?.[0]?.content?.parts?.[0];
  if (!part?.inlineData?.data) {
    throw new Error("No audio data received from Gemini TTS");
  }

  // Decode base64 without Buffer (works in both Node.js and Edge runtime)
  const binary = atob(part.inlineData.data);
  const audioData = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    audioData[i] = binary.charCodeAt(i);
  }
  const mimeType = part.inlineData.mimeType || "audio/L16;rate=24000";

  return convertToWav(audioData, mimeType);
}
