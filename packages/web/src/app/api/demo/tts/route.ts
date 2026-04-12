import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_API_KEY;

/**
 * POST /api/demo/tts
 * Body: { text: string, slideId?: string }
 * Returns: audio/wav
 *
 * Uses Gemini TTS (Kore voice — authoritative female, closest to Wishonia)
 * to generate speech from narration text.
 */
export async function POST(request: Request) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "No Gemini API key configured" },
      { status: 503 },
    );
  }

  const body = (await request.json()) as { text?: string };
  if (!body.text || typeof body.text !== "string") {
    return NextResponse.json(
      { error: "Missing 'text' field" },
      { status: 400 },
    );
  }

  const sampleRate = 24000;
  const bitsPerSample = 16;
  const channels = 1;

  try {
    const client = new GoogleGenAI({ apiKey });

    const stream = await client.models.generateContentStream({
      model: "gemini-2.5-flash-preview-tts",
      contents: [
        {
          role: "user",
          parts: [{ text: body.text }],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Kore",
            },
          },
        },
      },
    } as Parameters<typeof client.models.generateContentStream>[0]);

    // Collect PCM chunks as they arrive
    const pcmChunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<{ candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string } }> } }> }>) {
      const candidate = chunk.candidates?.[0];
      const parts = candidate?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part.inlineData?.data) {
          pcmChunks.push(Buffer.from(part.inlineData.data, "base64"));
        }
      }
    }

    if (pcmChunks.length === 0) {
      return NextResponse.json(
        { error: "No audio in Gemini response" },
        { status: 502 },
      );
    }

    const pcmData = Buffer.concat(pcmChunks);

    // Wrap in WAV header
    const byteRate = sampleRate * channels * (bitsPerSample / 8);
    const blockAlign = channels * (bitsPerSample / 8);
    const dataSize = pcmData.length;
    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write("data", 36);
    header.writeUInt32LE(dataSize, 40);
    const finalBuffer = Buffer.concat([header, pcmData]);

    return new NextResponse(finalBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(finalBuffer.length),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
