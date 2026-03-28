import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Mints an ephemeral token for Gemini Live API.
 * The real API key stays server-side; the client gets a short-lived,
 * single-use token locked to audio-only response modality.
 */
export async function GET() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
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

    return Response.json({ token: token.name });
  } catch (err) {
    console.error("[gemini-live-token] Failed to create token:", err);
    return Response.json(
      { error: "Failed to create ephemeral token" },
      { status: 500 },
    );
  }
}
