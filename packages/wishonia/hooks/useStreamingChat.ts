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
  // Map of "chatId:messageIndex" → visuals for completed messages
  const [visualsMap, setVisualsMap] = useState<Record<string, VisualsResult>>({});
  const abortRef = useRef<AbortController | null>(null);
  const chatsRef = useRef<Chat[]>([]);
  const pendingVisualsRef = useRef<VisualsResult | null>(null);

  // Keep ref in sync for use in callbacks
  chatsRef.current = chats;

  const activeChat = chats.find((c) => c.id === activeChatId);
  const messages = activeChat?.messages ?? [];

  const persistChats = useCallback((updated: Chat[]) => {
    setChats(updated);
    saveChats(updated);
    chatsRef.current = updated;
  }, []);

  function syncHash(id: string | null) {
    if (typeof window === "undefined") return;
    if (id) {
      window.history.replaceState(null, "", `#${id}`);
    } else {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }

  function initChats() {
    const saved = loadChats();
    // Check URL hash for a specific chat ID
    const hashId = typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
    if (saved.length > 0) {
      setChats(saved);
      const target = hashId && saved.find((c) => c.id === hashId) ? hashId : saved[0]!.id;
      setActiveChatId(target);
      syncHash(target);
    } else {
      const first = createChat();
      setChats([first]);
      setActiveChatId(first.id);
      syncHash(first.id);
    }
  }

  function handleNewChat() {
    const c = createChat();
    const updated = [c, ...chatsRef.current];
    persistChats(updated);
    setActiveChatId(c.id);
    syncHash(c.id);
    return c;
  }

  function handleDeleteChat(id: string) {
    const updated = deleteChat(chatsRef.current, id);
    persistChats(updated);
    if (activeChatId === id) {
      const newId = updated[0]?.id ?? null;
      setActiveChatId(newId);
      syncHash(newId);
    }
  }

  function handleSelectChat(id: string) {
    setActiveChatId(id);
    syncHash(id);
  }

  /** Add a user message to the chat without triggering the text API (for voice mode). */
  function addUserMessage(text: string): number {
    const chatId = activeChatId;
    const currentChat = chatsRef.current.find((c) => c.id === chatId);
    if (!currentChat) return -1;

    const userMsg: ChatMessage = { role: "user", text };
    const updatedMessages = [...currentChat.messages, userMsg];
    let updatedChat = { ...currentChat, messages: updatedMessages };
    updatedChat = updateChatTitle(updatedChat);
    persistChats(chatsRef.current.map((c) => c.id === chatId ? updatedChat : c));
    return updatedMessages.length - 1; // index of the new user message
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
    pendingVisualsRef.current = null;
    fetch("/api/visuals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: text }),
      signal: abort.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          const v = data as VisualsResult;
          setPendingVisuals(v);
          pendingVisualsRef.current = v;
        }
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
      const finalMessages = [...updatedMessages, wishoniaMsg];
      const finalChat = {
        ...updatedChat,
        messages: finalMessages,
      };
      persistChats(
        chatsRef.current.map((c) => (c.id === chatId ? finalChat : c))
      );

      // Persist visuals for this message
      if (pendingVisualsRef.current && chatId) {
        const msgIdx = finalMessages.length - 1;
        setVisualsMap((prev) => ({
          ...prev,
          [`${chatId}:${msgIdx}`]: pendingVisualsRef.current!,
        }));
      }

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

  function getVisualsForMessage(msgIndex: number): VisualsResult | null {
    if (!activeChatId) return null;
    return visualsMap[`${activeChatId}:${msgIndex}`] ?? null;
  }

  return {
    chats,
    activeChatId,
    activeChat,
    messages,
    isStreaming,
    streamingText,
    pendingVisuals,
    getVisualsForMessage,
    addUserMessage,
    initChats,
    handleNewChat,
    handleDeleteChat,
    handleSelectChat,
    setActiveChatId,
    sendMessage,
    stopStreaming,
  };
}
