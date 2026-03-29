/**
 * Single chat message bubble with markdown rendering, source pills, TTS, and copy.
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { renderMarkdown } from "@/lib/markdown";
import { SourcePills } from "./SourcePills";
import type { SourceLink } from "@/lib/source-links";
import {
  extractReadMoreLinks,
  mergeSourceLinks,
  normalizeManualUrl,
} from "@/lib/source-links";

interface ChatMessageProps {
  role: "user" | "wishonia";
  text: string;
  isStreaming?: boolean;
  sourceLinks?: SourceLink[];
  relevantImage?: {
    path: string;
    title?: string;
  } | null;
  thinkingText?: string | null;
  onPlayTTS?: (text: string) => void;
  isTTSPlaying?: boolean;
}

export function ChatMessage({
  role, text, isStreaming, sourceLinks, relevantImage, thinkingText, onPlayTTS, isTTSPlaying,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  // Strip expression tags
  const rawText = text.replace(/\[expression:\w+\]/g, "").trim();

  // Extract source links from completed wishonia messages
  const { links: extractedLinks, cleanText } = useMemo(() => {
    if (role === "user" || isStreaming) return { links: [], cleanText: rawText };
    return extractReadMoreLinks(rawText);
  }, [role, isStreaming, rawText]);

  const links = useMemo(
    () => mergeSourceLinks(sourceLinks ?? [], extractedLinks),
    [sourceLinks, extractedLinks]
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(cleanText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [cleanText]);

  const handleTTS = useCallback(() => {
    onPlayTTS?.(cleanText);
  }, [cleanText, onPlayTTS]);

  const isUser = role === "user";
  const relevantImageUrl = relevantImage ? normalizeManualUrl(relevantImage.path) : null;

  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 12,
      animation: "chatSlideIn 0.25s ease-out",
    }}>
      <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column" }}>
        <div style={{
          padding: "14px 16px", borderRadius: 12, fontSize: 15, lineHeight: 1.7,
          ...(isUser
            ? {
                background: "rgba(54,226,248,0.08)",
                border: "1px solid rgba(54,226,248,0.15)",
                color: "#ececec",
              }
            : {
                background: "rgba(209,0,177,0.07)",
                border: "1px solid rgba(209,0,177,0.15)",
                color: "#d1d1d1",
              }),
        }}>
          {isUser || isStreaming ? (
            <span>{isStreaming ? rawText : cleanText}</span>
          ) : (
            <div
              className="chat-markdown"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(cleanText) }}
            />
          )}
          {isStreaming && (
            <span style={{ animation: "pulse 1.5s infinite", color: "#555" }}>▋</span>
          )}
        </div>

        {/* Source pills */}
        {links.length > 0 && <SourcePills links={links} />}

        {!!relevantImageUrl && !isUser && (
          <div style={{ marginTop: 10 }}>
            <a href={relevantImageUrl} target="_blank" rel="noopener">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={relevantImageUrl}
                alt={relevantImage?.title || ""}
                style={{
                  maxWidth: "100%",
                  maxHeight: 280,
                  borderRadius: 10,
                  border: "1px solid rgba(54,226,248,0.15)",
                  display: "block",
                }}
              />
            </a>
          </div>
        )}

        {!!thinkingText?.trim() && !isUser && !isStreaming && (
          <details style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
            <summary style={{ cursor: "pointer" }}>Show thinking</summary>
            <pre
              style={{
                marginTop: 8,
                whiteSpace: "pre-wrap",
                fontFamily: "inherit",
                lineHeight: 1.5,
              }}
            >
              {thinkingText}
            </pre>
          </details>
        )}

        {/* Action buttons for wishonia messages */}
        {!isUser && !isStreaming && cleanText && (
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              onClick={handleTTS}
              title="Play audio"
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 14, color: isTTSPlaying ? "#36E2F8" : "#555",
                padding: "2px 6px", opacity: 0.6,
              }}
            >
              🔊
            </button>
            <button
              onClick={handleCopy}
              title="Copy"
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 14, color: copied ? "#28a745" : "#555",
                padding: "2px 6px", opacity: copied ? 1 : 0.6,
              }}
            >
              {copied ? "✓" : "📋"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
