/**
 * Single chat message bubble with markdown rendering, TTS, and copy.
 */

"use client";

import { useState, useCallback } from "react";
import { renderMarkdown } from "@/lib/markdown";
import { VisualCard } from "./VisualCard";
import type { VisualsResult } from "@/lib/visuals-prompt";

interface ChatMessageProps {
  role: "user" | "wishonia";
  text: string;
  isStreaming?: boolean;
  visuals?: VisualsResult | null;
  onPlayTTS?: (text: string) => void;
  isTTSPlaying?: boolean;
}

export function ChatMessage({
  role, text, isStreaming, visuals, onPlayTTS, isTTSPlaying,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    // Strip expression tags for clipboard
    const clean = text.replace(/\[expression:\w+\]/g, "").trim();
    navigator.clipboard.writeText(clean).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  const handleTTS = useCallback(() => {
    const clean = text.replace(/\[expression:\w+\]/g, "").trim();
    onPlayTTS?.(clean);
  }, [text, onPlayTTS]);

  // Strip expression tags from display text
  const displayText = text.replace(/\[expression:\w+\]/g, "").trim();

  const isUser = role === "user";

  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 12,
    }}>
      <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column" }}>
        <div style={{
          padding: "10px 14px", borderRadius: 0, fontSize: 14, lineHeight: 1.6,
          ...(isUser
            ? {
                background: "rgba(209,0,177,0.12)",
                border: "1px solid rgba(209,0,177,0.25)",
                color: "#e0d0e8",
              }
            : {
                background: "#1a1a2e",
                border: "1px solid rgba(54,226,248,0.15)",
                color: "#C6CBF5",
              }),
        }}>
          {isUser || isStreaming ? (
            // Plain text for user messages and during streaming
            <span>{displayText}</span>
          ) : (
            // Markdown-rendered for completed wishonia messages
            <div
              className="chat-markdown"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(displayText) }}
            />
          )}
          {isStreaming && (
            <span style={{ animation: "pulse 1.5s infinite", color: "#555" }}>▋</span>
          )}
        </div>

        {/* Action buttons for wishonia messages */}
        {!isUser && !isStreaming && displayText && (
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              onClick={handleTTS}
              title="Play audio"
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 14, color: isTTSPlaying ? "#36E2F8" : "#555",
                padding: "2px 6px",
              }}
            >
              🔊
            </button>
            <button
              onClick={handleCopy}
              title="Copy"
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 14, color: copied ? "#36E2F8" : "#555",
                padding: "2px 6px",
              }}
            >
              {copied ? "✓" : "📋"}
            </button>
          </div>
        )}

        {/* Visual supplements */}
        {visuals && <VisualCard data={visuals} />}
      </div>
    </div>
  );
}
