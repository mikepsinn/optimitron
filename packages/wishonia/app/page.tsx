"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { WishoniaNarrator } from "@/lib/widget/components/WishoniaNarrator";
import type { Expression } from "@/lib/widget/types";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useTTS } from "@/hooks/useTTS";
import { useVoiceMode } from "@/hooks/useVoiceMode";
import { ChatMessage } from "@/components/ChatMessage";

const WELCOME = "Hello. I have been running my planet for 4,237 years. I ended war in year 12. Your species is still arguing about it. Ask me anything.";

/** Extract [expression:X] tag from text and return the expression + clean text. */
function extractExpression(text: string): { expression: Expression; cleanText: string } {
  const match = text.match(/\[expression:(\w+)\]/);
  const expression = (match?.[1] ?? "happy") as Expression;
  const cleanText = text.replace(/\[expression:\w+\]/g, "").trim();
  return { expression, cleanText };
}

export default function ChatPage(): React.JSX.Element {
  const [input, setInput] = useState("");
  const [currentSpeech, setCurrentSpeech] = useState(WELCOME);
  const [expression, setExpression] = useState<Expression>("neutral");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const chat = useStreamingChat();

  // TTS with voice mode chaining
  const tts = useTTS();

  // Voice input
  const voiceResultHandler = useCallback((transcript: string) => {
    if (voiceMode.isActive) {
      voiceMode.handleVoiceResult(transcript);
    } else {
      setInput(transcript);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const voiceInput = useVoiceInput(voiceResultHandler);

  // Voice mode loop
  const voiceMode = useVoiceMode({
    sendMessage: chat.sendMessage,
    startListening: voiceInput.startListening,
    stopListening: voiceInput.stopListening,
    playTTS: tts.play,
    stopTTS: tts.stop,
    isStreaming: chat.isStreaming,
  });

  // Init chats on mount
  useEffect(() => {
    chat.initChats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll unless user scrolled up
  useEffect(() => {
    if (!userScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat.messages.length, chat.streamingText]);

  // Track user scroll
  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const threshold = 100;
    userScrolledUpRef.current = el.scrollHeight - el.scrollTop - el.clientHeight > threshold;
  }, []);

  // Update expression from completed messages
  useEffect(() => {
    if (!chat.isStreaming && chat.messages.length > 0) {
      const lastMsg = chat.messages[chat.messages.length - 1];
      if (lastMsg?.role === "wishonia") {
        const { expression: expr, cleanText } = extractExpression(lastMsg.text);
        setExpression(expr);
        setCurrentSpeech(cleanText);
      }
    }
  }, [chat.isStreaming, chat.messages]);

  // Set thinking expression while streaming
  useEffect(() => {
    if (chat.isStreaming) {
      setExpression("thinking");
    }
  }, [chat.isStreaming]);

  async function handleSend() {
    const text = input.trim();
    if (!text || chat.isStreaming) return;
    setInput("");
    userScrolledUpRef.current = false;
    const response = await chat.sendMessage(text);
    if (response) {
      const { expression: expr, cleanText } = extractExpression(response);
      setExpression(expr);
      setCurrentSpeech(cleanText);
    }
  }

  function handleSelectChat(id: string) {
    chat.handleSelectChat(id);
    const selected = chat.chats.find((c) => c.id === id);
    const lastWishonia = [...(selected?.messages ?? [])].reverse().find((m) => m.role === "wishonia");
    if (lastWishonia) {
      const { expression: expr, cleanText } = extractExpression(lastWishonia.text);
      setExpression(expr);
      setCurrentSpeech(cleanText);
    }
    setSidebarOpen(false);
  }

  function handleNewChat() {
    chat.handleNewChat();
    setCurrentSpeech(WELCOME);
    setExpression("neutral");
    setSidebarOpen(false);
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0d0d0d", color: "#ececec", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflow: "hidden" }}>

      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{ position: "fixed", top: 12, left: 12, zIndex: 50, background: "none", border: "none", color: "#36E2F8", fontSize: 24, cursor: "pointer", display: "none" }}
        className="hamburger-btn"
      >
        &#9776;
      </button>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 19 }}
          className="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          width: 260, background: "#111", borderRight: "1px solid rgba(54,226,248,0.1)",
          display: "flex", flexDirection: "column", flexShrink: 0, zIndex: 20,
        }}
        className={`sidebar ${sidebarOpen ? "open" : ""}`}
      >
        <div style={{ padding: 12, borderBottom: "1px solid rgba(54,226,248,0.1)" }}>
          <button
            onClick={handleNewChat}
            style={{ width: "100%", padding: "10px 16px", background: "rgba(209,0,177,0.15)", border: "1px solid rgba(209,0,177,0.3)", borderRadius: 0, color: "#d100b1", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
          >
            + New Chat
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {chat.chats.map((c) => (
            <div
              key={c.id}
              onClick={() => handleSelectChat(c.id)}
              style={{
                padding: "10px 12px", margin: "2px 8px", borderRadius: 0, cursor: "pointer",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: c.id === chat.activeChatId ? "rgba(54,226,248,0.08)" : "transparent",
                color: c.id === chat.activeChatId ? "#36E2F8" : "#888",
              }}
            >
              <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                {c.title}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); chat.handleDeleteChat(c.id); }}
                style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 16, padding: "0 4px", flexShrink: 0 }}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", minWidth: 0 }}>
        {/* Background gradient */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse at center bottom, rgba(127,0,173,0.15) 0%, transparent 60%)" }} />

        {/* Header */}
        <header style={{ padding: "12px 20px", borderBottom: "1px solid rgba(54,226,248,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, background: "linear-gradient(135deg, #C6CBF5, #d100b1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Wishonia
          </h1>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {/* Voice mode toggle */}
            {voiceInput.isSupported && (
              <button
                onClick={voiceMode.toggle}
                title={voiceMode.isActive ? "Stop voice mode" : "Start voice mode"}
                style={{
                  background: voiceMode.isActive ? "rgba(54,226,248,0.15)" : "none",
                  border: voiceMode.isActive ? "1px solid rgba(54,226,248,0.3)" : "1px solid transparent",
                  borderRadius: 0, padding: "4px 10px", cursor: "pointer",
                  color: voiceMode.isActive ? "#36E2F8" : "#555", fontSize: 13,
                }}
              >
                {voiceMode.isActive ? "🎙️ Voice ON" : "🎙️ Voice"}
              </button>
            )}
            <a href="/embed" style={{ fontSize: 12, color: "#555", textDecoration: "none" }}>Embed &rarr;</a>
          </div>
        </header>

        {/* Chat + Character */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative", zIndex: 1 }}>
          {/* Messages */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            style={{ flex: 1, overflowY: "auto", padding: 20 }}
          >
            {/* Welcome message */}
            <ChatMessage role="wishonia" text={WELCOME} />

            {chat.messages.map((msg, i) => {
              const isLastWishonia = msg.role === "wishonia" && i === chat.messages.length - 1;
              return (
                <ChatMessage
                  key={i}
                  role={msg.role}
                  text={msg.text}
                  visuals={isLastWishonia ? chat.pendingVisuals : undefined}
                  onPlayTTS={tts.play}
                  isTTSPlaying={tts.isPlaying}
                />
              );
            })}

            {/* Streaming message */}
            {chat.isStreaming && chat.streamingText && (
              <ChatMessage
                role="wishonia"
                text={chat.streamingText}
                isStreaming
              />
            )}

            {/* Thinking indicator (before first chunk arrives) */}
            {chat.isStreaming && !chat.streamingText && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
                <div style={{ padding: "10px 14px", borderRadius: 0, background: "#1a1a2e", border: "1px solid rgba(54,226,248,0.15)", color: "#555", fontSize: 14 }}>
                  <span style={{ animation: "pulse 1.5s infinite" }}>thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Character panel */}
          <div style={{ width: 200, borderLeft: "1px solid rgba(54,226,248,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            className="character-panel"
          >
            <WishoniaNarrator
              tokenEndpoint="/api/gemini-live-token"
              text={currentSpeech}
              expression={expression}
              bodyPose={chat.isStreaming ? "thinking" : "presenting"}
              size={140}
              position="custom"
              style={{ position: "relative" }}
            />
          </div>
        </div>

        {/* Input bar */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(54,226,248,0.1)", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", gap: 8, maxWidth: 800 }}>
            {/* Voice input button */}
            {voiceInput.isSupported && (
              <button
                onClick={voiceInput.isListening ? voiceInput.stopListening : voiceInput.startListening}
                title={voiceInput.isListening ? "Stop listening" : "Voice input"}
                style={{
                  padding: "12px 14px", borderRadius: 0, cursor: "pointer", fontSize: 16,
                  background: voiceInput.isListening ? "rgba(54,226,248,0.15)" : "#111",
                  border: voiceInput.isListening ? "1px solid rgba(54,226,248,0.3)" : "1px solid rgba(54,226,248,0.15)",
                  color: voiceInput.isListening ? "#36E2F8" : "#888",
                }}
              >
                🎤
              </button>
            )}

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={voiceInput.isListening ? "Listening..." : "Ask Wishonia anything..."}
              disabled={chat.isStreaming}
              style={{ flex: 1, padding: "12px 16px", background: "#111", border: "1px solid rgba(54,226,248,0.15)", borderRadius: 0, color: "#ececec", fontSize: 14, outline: "none" }}
            />

            <button
              onClick={chat.isStreaming ? chat.stopStreaming : handleSend}
              style={{
                padding: "12px 24px", borderRadius: 0, fontSize: 14, fontWeight: 600, cursor: "pointer",
                background: chat.isStreaming ? "rgba(54,226,248,0.15)" : "rgba(209,0,177,0.2)",
                border: chat.isStreaming ? "1px solid rgba(54,226,248,0.3)" : "1px solid rgba(209,0,177,0.4)",
                color: chat.isStreaming ? "#36E2F8" : "#d100b1",
              }}
            >
              {chat.isStreaming ? "Stop" : "Send"}
            </button>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        @media (max-width: 800px) {
          .sidebar { position: fixed !important; left: 0; top: 0; bottom: 0; transform: translateX(-100%); transition: transform 0.2s; }
          .sidebar.open { transform: translateX(0) !important; }
          .hamburger-btn { display: block !important; }
          .character-panel { display: none !important; }
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .chat-markdown p { margin: 0 0 8px 0; }
        .chat-markdown p:last-child { margin-bottom: 0; }
        .chat-markdown strong { color: #ececec; }
        .chat-markdown a { color: #d100b1; text-decoration: underline; }
        .chat-markdown a:hover { color: #36E2F8; }
        .chat-markdown .chat-codeblock {
          background: rgba(0,0,0,0.3); padding: 10px 14px; margin: 8px 0;
          overflow-x: auto; font-size: 12px; font-family: 'Menlo', 'Monaco', monospace;
          border: 1px solid rgba(54,226,248,0.1);
        }
        .chat-markdown .chat-inline-code {
          background: rgba(54,226,248,0.08); padding: 1px 5px;
          font-family: 'Menlo', 'Monaco', monospace; font-size: 12px;
        }
        .chat-markdown .chat-h3 { font-size: 16px; font-weight: 700; color: #36E2F8; margin: 12px 0 6px; }
        .chat-markdown .chat-h4 { font-size: 14px; font-weight: 700; color: #C6CBF5; margin: 10px 0 4px; }
        .chat-markdown .chat-blockquote {
          border-left: 3px solid rgba(209,0,177,0.4); padding-left: 12px;
          color: #888; margin: 8px 0; font-style: italic;
        }
        .chat-markdown .chat-list { margin: 4px 0; padding-left: 20px; }
        .chat-markdown .chat-list li { margin: 2px 0; }
        .chat-markdown .chat-latex-pending { font-family: 'Menlo', monospace; font-size: 13px; color: #d100b1; }
        .chat-markdown .chat-latex-display { display: block; text-align: center; margin: 8px 0; }
      `}</style>
    </div>
  );
}
