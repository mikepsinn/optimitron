/**
 * Structured visual supplements endpoint.
 * Called in parallel with /api/chat from the client.
 * Returns JSON with optional keyFigure, chart, table, latex, mermaid, etc.
 */

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { VISUALS_SYSTEM_PROMPT, visualsSchema } from "@/lib/visuals-prompt";
import { getSearchIndex } from "@/lib/search-index-cache";
import { searchContent } from "@/lib/search";

export async function POST(request: Request) {
  const { question } = (await request.json()) as { question: string };

  if (!question) {
    return Response.json({ error: "question is required" }, { status: 400 });
  }

  // Server-side RAG for visual context
  const index = await getSearchIndex();
  const { context } = searchContent(index, question);

  const systemPrompt = VISUALS_SYSTEM_PROMPT.replace(
    "{context}",
    context || "No specific book context available."
  );

  try {
    const result = await generateObject({
      model: google("gemini-3-flash-preview", {
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
      }),
      schema: visualsSchema,
      system: systemPrompt,
      prompt: question,
    });

    return Response.json(result.object);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
