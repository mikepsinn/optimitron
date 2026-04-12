import { GoogleGenAI } from "@google/genai";

const apiKey =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_API_KEY;

const SAMPLE_RATE = 24000;
const BITS_PER_SAMPLE = 16;
const CHANNELS = 1;

function wavHeader(dataSize: number): Uint8Array {
  const byteRate = SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8);
  const blockAlign = CHANNELS * (BITS_PER_SAMPLE / 8);
  const buf = new ArrayBuffer(44);
  const view = new DataView(buf);
  const te = new TextEncoder();
  const h = te.encode("RIFF");
  new Uint8Array(buf).set(h, 0);
  view.setUint32(4, 36 + dataSize, true);
  new Uint8Array(buf).set(te.encode("WAVE"), 8);
  new Uint8Array(buf).set(te.encode("fmt "), 12);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, CHANNELS, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, BITS_PER_SAMPLE, true);
  new Uint8Array(buf).set(te.encode("data"), 36);
  view.setUint32(40, dataSize, true);
  return new Uint8Array(buf);
}

/**
 * GET /api/demo/tts/stream?text=...
 *
 * Streams a WAV response with audio starting as soon as the first
 * Gemini chunk arrives. Uses a large placeholder size in the WAV header
 * so browsers start playback before the full response is received.
 */
export async function GET(request: Request) {
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "No Gemini API key" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const text = url.searchParams.get("text");
  if (!text) {
    return new Response(JSON.stringify({ error: "Missing text param" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = new GoogleGenAI({ apiKey });

  const readable = new ReadableStream({
    async start(controller) {
      try {
        // WAV header with large placeholder — browser plays as data streams in
        controller.enqueue(wavHeader(0x7fffffff));

        const stream = await client.models.generateContentStream({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ role: "user", parts: [{ text }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Kore" },
              },
            },
          },
        } as unknown as Parameters<typeof client.models.generateContentStream>[0]);

        for await (const chunk of stream as AsyncIterable<{ candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string } }> } }> }>) {
          const parts = chunk.candidates?.[0]?.content?.parts;
          if (!parts) continue;
          for (const part of parts) {
            if (part.inlineData?.data) {
              const bytes = Uint8Array.from(atob(part.inlineData.data), (c) =>
                c.charCodeAt(0),
              );
              controller.enqueue(bytes);
            }
          }
        }
      } catch (e) {
        console.error("TTS stream error:", e);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "audio/wav",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  });
}
