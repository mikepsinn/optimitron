/**
 * Simple localStorage-based chat history.
 */

export interface ChatMessage {
  role: "user" | "wishonia";
  text: string;
  visuals?: Record<string, unknown> | null;
}

export interface Chat {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
}

const STORAGE_KEY = "wishonia-chats";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function loadChats(): Chat[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Chat[]) : [];
  } catch {
    return [];
  }
}

export function saveChats(chats: Chat[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

export function createChat(): Chat {
  return {
    id: generateId(),
    title: "New Chat",
    createdAt: Date.now(),
    messages: [],
  };
}

export function deleteChat(chats: Chat[], id: string): Chat[] {
  return chats.filter((c) => c.id !== id);
}

export function updateChatTitle(chat: Chat): Chat {
  const firstUserMsg = chat.messages.find((m) => m.role === "user");
  if (firstUserMsg) {
    return { ...chat, title: firstUserMsg.text.slice(0, 40) + (firstUserMsg.text.length > 40 ? "..." : "") };
  }
  return chat;
}
