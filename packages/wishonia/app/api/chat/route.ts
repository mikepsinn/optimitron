/**
 * Streaming chat endpoint using AI SDK + Gemini Flash + server-side RAG.
 * Replaces the previous non-streaming @google/genai implementation.
 */

import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { WISHONIA_SYSTEM_PROMPT } from "@/lib/wishonia-chat";
import { getSearchIndex } from "@/lib/search-index-cache";
import { searchContent } from "@/lib/search";

interface ChatMessage {
  role: "user" | "wishonia";
  text: string;
}

export async function POST(request: Request) {
  const { message, history } = (await request.json()) as {
    message: string;
    history?: ChatMessage[];
  };

  if (!message) {
    return Response.json({ error: "message is required" }, { status: 400 });
  }

  // Server-side RAG: fetch search index and find relevant context
  const index = await getSearchIndex();
  const { context } = searchContent(index, message);

  const systemPrompt = WISHONIA_SYSTEM_PROMPT.replace(
    "{context}",
    context || "No specific book context available for this question."
  );

  // Map history to AI SDK format
  const messages = [
    ...(history ?? []).map((m) => ({
      role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.text,
    })),
    { role: "user" as const, content: message },
  ];

  const result = streamText({
    model: google("gemini-3-flash-preview", {
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
    }),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}
