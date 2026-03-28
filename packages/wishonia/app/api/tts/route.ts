/**
 * Text-to-speech endpoint using Gemini TTS with Kore voice.
 * Returns audio/wav bytes.
 */

import { generateSpeech } from "@/lib/gemini-tts";

export async function POST(request: Request) {
  const apiKey = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
  if (!apiKey) {
    return Response.json({ error: "TTS service not configured" }, { status: 503 });
  }

  const { text } = (await request.json()) as { text: string };

  if (!text) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const wavBytes = await generateSpeech(text, apiKey);

    return new Response(wavBytes, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
