"use client";

import { useState, useRef, useCallback } from "react";
import {
  ChatContainer,
  ConversationContext,
  type ChatMessage,
  type ParsedMeasurement,
} from "@optomitron/chat-ui";
import "./chat-theme.css";

const STORAGE_KEY_API = "opto-chat-api-key";
const STORAGE_KEY_PROVIDER = "opto-chat-provider";

function formatMeasurement(m: ParsedMeasurement): string {
  return `${m.variableName}: ${m.value} ${m.unitAbbreviation}`;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      type: "text",
      role: "assistant",
      content:
        "Hello. I'm Wishonia — World Integrated System for High-Efficiency Optimization Networked Intelligence for Allocation. I've been running a planet for 4,237 years. We ended war in year 12 and disease in year 340. Now I'm here to help you track your meals, symptoms, treatments, and mood. It's not exactly planetary governance but everyone's got to start somewhere. Try \"took 500mg magnesium\" or \"mood 4/5\".",
    },
    { type: "apiKey" },
  ]);

  const [recentFoods, setRecentFoods] = useState<string[]>([]);
  const ctxRef = useRef(new ConversationContext());

  const append = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      append({ type: "text", role: "user", content: text });

      const apiKey = localStorage.getItem(STORAGE_KEY_API) ?? undefined;
      const provider =
        (localStorage.getItem(STORAGE_KEY_PROVIDER) as
          | "openai"
          | "anthropic"
          | "gemini"
          | undefined) ?? undefined;

      try {
        const result = await ctxRef.current.parseWithContext({
          text,
          apiKey,
          provider,
        });

        if (result.measurements.length > 0) {
          const summary = result.measurements.map(formatMeasurement).join(", ");
          append({
            type: "text",
            role: "assistant",
            content: `Logged: ${summary}`,
          });

          // Track recent foods
          for (const m of result.measurements) {
            if (m.categoryName === "Food") {
              setRecentFoods((prev) =>
                [m.variableName, ...prev.filter((f) => f !== m.variableName)].slice(0, 5)
              );
            }
          }
        } else if (result.followUpQuestion) {
          append({
            type: "text",
            role: "assistant",
            content: result.followUpQuestion,
          });
        } else {
          append({
            type: "text",
            role: "assistant",
            content:
              "I've been running a planet for four millennia and I couldn't parse that. Try something like \"took 200mg ibuprofen\" or \"headache 3/5\". I need structure. We all do.",
          });
        }
      } catch {
        append({
          type: "text",
          role: "assistant",
          content: "Something went wrong on my end. Even alien systems have bad days. Try again.",
        });
      }
    },
    [append],
  );

  const handleMoodRate = useCallback(
    (_id: string, value: number) => {
      append({
        type: "text",
        role: "assistant",
        content: `Mood rated ${value}/5. Thanks!`,
      });
    },
    [append],
  );

  const handleTreatmentAction = useCallback(
    (_id: string, action: string, minutes?: number) => {
      const label =
        action === "done"
          ? "Marked as taken."
          : action === "skip"
            ? "Skipped."
            : `Snoozed for ${minutes ?? 15} minutes.`;
      append({ type: "text", role: "assistant", content: label });
    },
    [append],
  );

  const handleSymptomRate = useCallback(
    (_id: string, value: number) => {
      append({
        type: "text",
        role: "assistant",
        content: `Symptom rated ${value}/5. Recorded.`,
      });
    },
    [append],
  );

  const handlePairwiseCompare = useCallback(
    (_id: string, allocationA: number) => {
      append({
        type: "text",
        role: "assistant",
        content: `Allocation saved: ${allocationA}% / ${100 - allocationA}%.`,
      });
    },
    [append],
  );

  const handleFoodLog = useCallback(
    (_id: string, description: string) => {
      setRecentFoods((prev) =>
        [description, ...prev.filter((f) => f !== description)].slice(0, 5)
      );
      append({
        type: "text",
        role: "assistant",
        content: `Logged food: ${description}`,
      });
    },
    [append],
  );

  const handleApiKeySave = useCallback(
    (provider: string, key: string) => {
      localStorage.setItem(STORAGE_KEY_API, key);
      localStorage.setItem(STORAGE_KEY_PROVIDER, provider);
      append({
        type: "text",
        role: "assistant",
        content: `API key saved (${provider}). I'll use AI-powered parsing for better accuracy.`,
      });
    },
    [append],
  );

  return (
    <section className="min-h-screen border-b-4 border-black bg-white pb-8 pt-4">
      <ChatContainer
        messages={messages}
        onSend={handleSend}
        onMoodRate={handleMoodRate}
        onTreatmentAction={handleTreatmentAction}
        onSymptomRate={handleSymptomRate}
        onPairwiseCompare={handlePairwiseCompare}
        onFoodLog={handleFoodLog}
        onApiKeySave={handleApiKeySave}
        recentFoods={recentFoods}
      />
    </section>
  );
}
