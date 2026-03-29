/**
 * Collapsible RAG debug card — shows what was sent to Gemini.
 * Matches transmit's buildRagDetailsElement().
 */

"use client";

import { renderMarkdown } from "@/lib/markdown";

interface RagDebugCardProps {
  transcript: string;
  ragContext: string;
  systemPrompt?: string;
  indexSize?: number;
}

export function RagDebugCard({ transcript, ragContext, systemPrompt, indexSize }: RagDebugCardProps) {
  const charCount = (systemPrompt?.length ?? 0) + transcript.length + ragContext.length;
  const summary = ragContext
    ? `📚 Sent ${charCount.toLocaleString()} chars to Gemini Live`
    : `⚠️ No RAG context sent${indexSize != null ? ` (search index: ${indexSize} entries)` : ""}`;

  return (
    <div style={{
      display: "flex", justifyContent: "flex-start", marginBottom: 12,
      animation: "chatSlideIn 0.25s ease-out",
    }}>
      <div style={{ maxWidth: "80%" }}>
        <details style={{
          fontSize: 12, margin: "4px 0",
          background: "rgba(209,0,177,0.07)", border: "1px solid rgba(209,0,177,0.15)",
          borderRadius: 12, padding: "8px 12px", color: "#C6CBF5",
        }}>
          <summary style={{ cursor: "pointer", color: ragContext ? "#C6CBF5" : "#d9534f" }}>
            {summary}
          </summary>
          <div style={{
            maxHeight: 400, overflowY: "auto", marginTop: 8,
            fontSize: 12, lineHeight: 1.5,
          }}>
            {systemPrompt && (
              <>
                <strong style={{ display: "block", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 4, marginBottom: 4 }}>
                  🤖 System Prompt
                </strong>
                <div style={{ color: "#888", marginBottom: 8, maxHeight: 100, overflow: "hidden" }}>
                  {systemPrompt.slice(0, 200)}...
                </div>
              </>
            )}
            <strong style={{ display: "block", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 4, marginBottom: 4 }}>
              🗣️ User
            </strong>
            <div style={{ color: "#d1d1d1", marginBottom: 8 }}>{transcript}</div>
            <strong style={{ display: "block", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 4, marginBottom: 4 }}>
              📚 RAG Context
            </strong>
            <div
              className="chat-markdown"
              style={{ color: "#999" }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(ragContext || "(none)") }}
            />
          </div>
        </details>
      </div>
    </div>
  );
}
