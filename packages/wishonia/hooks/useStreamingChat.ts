/**
 * Custom streaming chat hook.
 * Uses fetch + ReadableStream.getReader() to consume the text stream
 * from /api/chat. Fires /api/visuals in parallel.
 */

"use client";

import { useState, useRef, useCallback } from "react";
import type { VisualsResult } from "@/lib/visuals-prompt";
import {
  loadChats, saveChats, createChat, deleteChat, updateChatTitle,
  type Chat, type ChatMessage,
} from "@/lib/chat-storage";

export interface StreamingMessage extends ChatMessage {
  visuals?: VisualsResult | null;
}

export function useStreamingChat() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [pendingVisuals, setPendingVisuals] = useState<VisualsResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const chatsRef = useRef<Chat[]>([]);

  // Keep ref in sync for use in callbacks
  chatsRef.current = chats;

  const activeChat = chats.find((c) => c.id === activeChatId);
  const messages = activeChat?.messages ?? [];

  const persistChats = useCallback((updated: Chat[]) => {
    setChats(updated);
    saveChats(updated);
    chatsRef.current = updated;
  }, []);

  function initChats() {
    const saved = loadChats();
    if (saved.length > 0) {
      setChats(saved);
      setActiveChatId(saved[0]!.id);
    } else {
      const first = createChat();
      setChats([first]);
      setActiveChatId(first.id);
    }
  }

  function handleNewChat() {
    const c = createChat();
    const updated = [c, ...chatsRef.current];
    persistChats(updated);
    setActiveChatId(c.id);
    return c;
  }

  function handleDeleteChat(id: string) {
    const updated = deleteChat(chatsRef.current, id);
    persistChats(updated);
    if (activeChatId === id) {
      setActiveChatId(updated[0]?.id ?? null);
    }
  }

  function handleSelectChat(id: string) {
    setActiveChatId(id);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || isStreaming) return;

    const chatId = activeChatId;
    const currentChat = chatsRef.current.find((c) => c.id === chatId);
    if (!currentChat) return;

    // Add user message
    const userMsg: ChatMessage = { role: "user", text };
    const updatedMessages = [...currentChat.messages, userMsg];
    let updatedChat = { ...currentChat, messages: updatedMessages };
    updatedChat = updateChatTitle(updatedChat);
    const updatedChats = chatsRef.current.map((c) =>
      c.id === chatId ? updatedChat : c
    );
    persistChats(updatedChats);

    setIsStreaming(true);
    setStreamingText("");
    setPendingVisuals(null);

    const abort = new AbortController();
    abortRef.current = abort;

    // Fire visuals request in parallel
    fetch("/api/visuals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: text }),
      signal: abort.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setPendingVisuals(data as VisualsResult);
      })
      .catch(() => {
        // Visuals are optional — ignore errors
      });

    // Stream chat response
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: updatedMessages }),
        signal: abort.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setStreamingText(fullText);
      }

      // Finalize: add wishonia message to chat
      const wishoniaMsg: ChatMessage = { role: "wishonia", text: fullText };
      const finalChat = {
        ...updatedChat,
        messages: [...updatedMessages, wishoniaMsg],
      };
      persistChats(
        chatsRef.current.map((c) => (c.id === chatId ? finalChat : c))
      );

      return fullText;
    } catch (err) {
      if ((err as Error).name === "AbortError") return "";

      const fallback: ChatMessage = {
        role: "wishonia",
        text: "Your internet appears to be as reliable as your governance systems.",
      };
      const finalChat = {
        ...updatedChat,
        messages: [...updatedMessages, fallback],
      };
      persistChats(
        chatsRef.current.map((c) => (c.id === chatId ? finalChat : c))
      );
      return fallback.text;
    } finally {
      setIsStreaming(false);
      setStreamingText("");
      abortRef.current = null;
    }
  }

  function stopStreaming() {
    abortRef.current?.abort();
  }

  return {
    chats,
    activeChatId,
    activeChat,
    messages,
    isStreaming,
    streamingText,
    pendingVisuals,
    initChats,
    handleNewChat,
    handleDeleteChat,
    handleSelectChat,
    setActiveChatId,
    sendMessage,
    stopStreaming,
  };
}
