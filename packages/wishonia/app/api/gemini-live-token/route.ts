import { GoogleGenAI, Modality } from "@google/genai";
import { WISHONIA_VOICE_PROMPT } from "@/lib/wishonia-chat";

/**
 * Centralized ephemeral token endpoint for Gemini Live API.
 * Any site embedding Wishonia can call this to get a short-lived token.
 * Also returns the voice system prompt for the live session.
 * CORS enabled via next.config.mjs headers.
 */
export async function GET() {
  const apiKey = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
  if (!apiKey) {
    return Response.json(
      { error: "GOOGLE_GENERATIVE_AI_API_KEY not configured" },
      { status: 503 },
    );
  }

  try {
    const client = new GoogleGenAI({ apiKey });
    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const token = await client.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        liveConnectConstraints: {
          model: "gemini-3.1-flash-live-preview",
          config: {
            responseModalities: [Modality.AUDIO],
          },
        },
      },
    });

    return Response.json({
      token: token.name,
      systemPrompt: WISHONIA_VOICE_PROMPT,
    });
  } catch (err) {
    console.error("[gemini-live-token] Failed to create token:", err);
    return Response.json(
      { error: "Failed to create ephemeral token" },
      { status: 500 },
    );
  }
}

/** Handle CORS preflight */
export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
