"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { WishoniaNarrator } from "@/lib/widget/components/WishoniaNarrator";
import type { Expression } from "@/lib/widget/types";
import {
  loadChats, saveChats, createChat, deleteChat, updateChatTitle,
  type Chat, type ChatMessage,
} from "@/lib/chat-storage";

const WELCOME = "Hello. I have been running my planet for 4,237 years. I ended war in year 12. Your species is still arguing about it. Ask me anything.";

export default function ChatPage(): React.JSX.Element {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [currentSpeech, setCurrentSpeech] = useState(WELCOME);
  const [expression, setExpression] = useState<Expression>("neutral");
  const [isThinking, setIsThinking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chats on mount
  useEffect(() => {
    const saved = loadChats();
    if (saved.length > 0) {
      setChats(saved);
      setActiveChatId(saved[0]!.id);
    } else {
      const first = createChat();
      setChats([first]);
      setActiveChatId(first.id);
    }
  }, []);

  const activeChat = chats.find((c) => c.id === activeChatId);
  const messages = activeChat?.messages ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const persistChats = useCallback((updated: Chat[]) => {
    setChats(updated);
    saveChats(updated);
  }, []);

  function handleNewChat() {
    const c = createChat();
    const updated = [c, ...chats];
    persistChats(updated);
    setActiveChatId(c.id);
    setCurrentSpeech(WELCOME);
    setExpression("neutral");
    setSidebarOpen(false);
  }

  function handleDeleteChat(id: string) {
    const updated = deleteChat(chats, id);
    persistChats(updated);
    if (activeChatId === id) {
      setActiveChatId(updated[0]?.id ?? null);
    }
  }

  function handleSelectChat(id: string) {
    setActiveChatId(id);
    const chat = chats.find((c) => c.id === id);
    const lastWishonia = [...(chat?.messages ?? [])].reverse().find((m) => m.role === "wishonia");
    if (lastWishonia) setCurrentSpeech(lastWishonia.text);
    setSidebarOpen(false);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || isThinking || !activeChat) return;

    setInput("");
    const userMsg: ChatMessage = { role: "user", text };
    const updatedMessages = [...activeChat.messages, userMsg];
    let updatedChat = { ...activeChat, messages: updatedMessages };
    updatedChat = updateChatTitle(updatedChat);
    const updatedChats = chats.map((c) => (c.id === activeChat.id ? updatedChat : c));
    persistChats(updatedChats);

    setIsThinking(true);
    setExpression("thinking");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: updatedMessages }),
      });

      const data = (await res.json()) as { reply: string; expression?: string };
      const reply = data.reply;
      const wishoniaMsg: ChatMessage = { role: "wishonia", text: reply };

      const finalChat = { ...updatedChat, messages: [...updatedMessages, wishoniaMsg] };
      persistChats(updatedChats.map((c) => (c.id === activeChat.id ? finalChat : c)));
      setCurrentSpeech(reply);
      setExpression((data.expression as Expression) ?? "happy");
    } catch {
      const fallback: ChatMessage = { role: "wishonia", text: "Your internet appears to be as reliable as your governance systems." };
      const finalChat = { ...updatedChat, messages: [...updatedMessages, fallback] };
      persistChats(updatedChats.map((c) => (c.id === activeChat.id ? finalChat : c)));
      setExpression("eyeroll");
    } finally {
      setIsThinking(false);
    }
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
          ...(sidebarOpen ? {} : {}),
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
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat.id)}
              style={{
                padding: "10px 12px", margin: "2px 8px", borderRadius: 0, cursor: "pointer",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: chat.id === activeChatId ? "rgba(54,226,248,0.08)" : "transparent",
                color: chat.id === activeChatId ? "#36E2F8" : "#888",
              }}
            >
              <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                {chat.title}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.id); }}
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
          <a href="/embed" style={{ fontSize: 12, color: "#555", textDecoration: "none" }}>Embed &rarr;</a>
        </header>

        {/* Chat + Character */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative", zIndex: 1 }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
            {/* Welcome message */}
            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
              <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: 0, background: "#1a1a2e", border: "1px solid rgba(54,226,248,0.15)", color: "#C6CBF5", fontSize: 14, lineHeight: 1.6 }}>
                {WELCOME}
              </div>
            </div>

            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
                <div style={{
                  maxWidth: "75%", padding: "10px 14px", borderRadius: 0, fontSize: 14, lineHeight: 1.6,
                  ...(msg.role === "user"
                    ? { background: "rgba(209,0,177,0.12)", border: "1px solid rgba(209,0,177,0.25)", color: "#e0d0e8" }
                    : { background: "#1a1a2e", border: "1px solid rgba(54,226,248,0.15)", color: "#C6CBF5" }),
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {isThinking && (
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
              bodyPose={isThinking ? "thinking" : "presenting"}
              size={140}
              position="custom"
              style={{ position: "relative" }}
            />
          </div>
        </div>

        {/* Input bar */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(54,226,248,0.1)", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", gap: 8, maxWidth: 800 }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask Wishonia anything..."
              disabled={isThinking}
              style={{ flex: 1, padding: "12px 16px", background: "#111", border: "1px solid rgba(54,226,248,0.15)", borderRadius: 0, color: "#ececec", fontSize: 14, outline: "none" }}
            />
            <button
              onClick={handleSend}
              disabled={isThinking}
              style={{
                padding: "12px 24px", borderRadius: 0, fontSize: 14, fontWeight: 600, cursor: isThinking ? "not-allowed" : "pointer",
                background: isThinking ? "#222" : "rgba(209,0,177,0.2)",
                border: "1px solid rgba(209,0,177,0.4)",
                color: isThinking ? "#555" : "#d100b1",
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 800px) {
          .sidebar { position: fixed !important; left: 0; top: 0; bottom: 0; transform: translateX(-100%); transition: transform 0.2s; }
          .sidebar.open { transform: translateX(0) !important; }
          .hamburger-btn { display: block !important; }
          .character-panel { display: none !important; }
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
