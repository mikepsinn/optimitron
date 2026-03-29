/**
 * Structured visual supplements endpoint.
 * Called in parallel with /api/chat from the client.
 * Returns JSON with optional keyFigure, chart, table, latex, mermaid, etc.
 */

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { VISUALS_SYSTEM_PROMPT, visualsSchema } from "@/lib/visuals-prompt";
import { getImageIndex } from "@/lib/image-index-cache";
import { getSearchIndex } from "@/lib/search-index-cache";
import { searchContent } from "@/lib/search";
import { findTopImageCandidates } from "@/lib/manual-images";

export async function POST(request: Request) {
  const {
    question,
    context: providedContext,
    imageOptions: providedImageOptions,
  } = (await request.json()) as {
    question: string;
    context?: string;
    imageOptions?: Array<{ path: string; title?: string; description?: string }>;
  };

  if (!question) {
    return Response.json({ error: "question is required" }, { status: 400 });
  }

  // Server-side RAG for visual context
  const index = await getSearchIndex();
  const { context, results } = searchContent(index, question);
  const resolvedContext = providedContext?.trim() || context;

  let imageOptions = providedImageOptions ?? [];
  if (imageOptions.length === 0) {
    const imageIndex = await getImageIndex();
    imageOptions = findTopImageCandidates(imageIndex, question, results, 3);
  }

  const systemPrompt = VISUALS_SYSTEM_PROMPT.replace(
    "{context}",
    resolvedContext || "No specific book context available."
  );

  let prompt = question;
  if (imageOptions.length > 0) {
    prompt +=
      "\n\nAvailable image candidates:\n" +
      imageOptions
        .map(
          (image) =>
            `- ${image.path}${image.title ? ` (${image.title})` : ""}${
              image.description ? `: ${image.description}` : ""
            }`
        )
        .join("\n");
  }

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
      prompt,
    });

    return Response.json(result.object);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
