import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../../.env") });
config({ path: resolve(__dirname, "../.env"), override: true });
import { GoogleGenAI } from "@google/genai";

async function tryText(label: string, text: string) {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_API_KEY;
  const client = new GoogleGenAI({ apiKey: apiKey! });
  try {
    const result = await client.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Speak in a patient, warm, slightly quick tone. You are an alien governance AI reading a declaration aloud.\n\n${text}`,
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
        },
      },
    });
    const cand = result.candidates?.[0];
    const hasAudio = !!cand?.content?.parts?.[0]?.inlineData?.data;
    console.log(
      `${hasAudio ? "✅" : "❌"} ${label}: finish=${cand?.finishReason}`,
    );
  } catch (e) {
    console.log(
      `❌ ${label}: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

async function main() {
  await tryText(
    "37778-years",
    "That money could have funded 37,778 years of clinical trials.",
  );
  await tryText(
    "37778-research",
    "That money could have funded 37,778 years of medical research.",
  );
  await tryText(
    "fewer-years",
    "That money could have funded 38 thousand years of clinical trials.",
  );
  await tryText(
    "no-number",
    "That money could have funded many years of clinical trials.",
  );
}

void main();
