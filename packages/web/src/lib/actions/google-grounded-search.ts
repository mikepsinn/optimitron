"use server";

import { GoogleGenAI } from "@google/genai";
import { RAG_MODEL } from "@/lib/voice-config";
import { createLogger } from "@/lib/logger";
import type { GroundedSearchResult } from "@/lib/types/grounded-search";

const log = createLogger("google-grounded-search");

const SYSTEM_INSTRUCTION = [
  "You are a medical evidence summariser. The user gives you a treatment, drug,",
  "intervention, or medical concept. Use Google Search to retrieve current",
  "evidence and write a short, plain-English summary (3-6 sentences).",
  "Lead with what the treatment does and how strong the evidence is. Mention",
  "the main outcome it is used for, typical effect size or NNT/NNH if known,",
  "and the most common or serious side effects. Cite specific trials,",
  "guidelines, or meta-analyses where possible. Do not invent numbers; if the",
  "evidence is weak or mixed, say so.",
].join(" ");

export async function getGroundedAnswerAction(
  query: string,
): Promise<GroundedSearchResult | null> {
  const trimmed = query?.trim();
  if (!trimmed) return null;

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    log.warn(
      "GOOGLE_GENERATIVE_AI_API_KEY is not configured; grounded search disabled",
    );
    return null;
  }

  try {
    const genai = new GoogleGenAI({ apiKey });
    const response = await genai.models.generateContent({
      model: RAG_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: `Summarise the medical evidence for: ${trimmed}` },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });

    const answer = response.text?.trim();
    if (!answer) return null;

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const citations: GroundedSearchResult["citations"] =
      groundingMetadata?.groundingChunks?.flatMap((chunk) => {
        const url = chunk.web?.uri;
        if (!url) return [];
        const title = chunk.web?.title;
        return [title ? { url, title } : { url }];
      }) ?? [];

    return {
      answer,
      citations: citations.length > 0 ? citations : undefined,
      renderedContent: groundingMetadata?.searchEntryPoint?.renderedContent,
    };
  } catch (error) {
    log.error("grounded search failed", { query: trimmed, error });
    return null;
  }
}
