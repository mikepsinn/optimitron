/**
 * Voice mode orchestrator — matches transmit's bidirectional Gemini Live flow.
 *
 * Flow: activate → connect Gemini Live → start continuous STT
 *   → user speaks → accumulate (1.5s debounce) → RAG search → send to Gemini Live
 *   → Gemini responds with streaming audio → lip-sync → turn complete → restart STT
 *   → 60s idle → auto-deactivate
 */

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { VoiceState } from "./useGeminiLiveVoice";

interface VoiceModeOptions {
  /** Gemini Live voice hook */
  geminiLive: {
    state: VoiceState;
    connect: () => Promise<void>;
    disconnect: () => void;
    sendText: (text: string) => void;
    outputTranscript: string;
    isConnected: boolean;
  };
  /** Voice input hook */
  voiceInput: {
    startListening: () => void;
    stopListening: () => void;
    pause: () => void;
    resume: () => void;
    clearLiveTranscript: () => void;
    isListening: boolean;
    liveTranscript: string;
  };
  /** Client-side RAG search */
  ragSearch: (query: string) => { context: string };
  /** Callback when RAG is sent (to show debug card) */
  onRagSent?: (data: { transcript: string; ragContext: string }) => void;
  /** Callback when user message should be added to chat */
  onUserMessage?: (text: string) => void;
  /** Fire visuals request in parallel (without triggering text chat API) */
  fetchVisuals?: (question: string) => void;
}

const VOICE_IDLE_MS = 60_000;

export function useVoiceMode({
  geminiLive,
  voiceInput,
  ragSearch,
  onRagSent,
  onUserMessage,
  fetchVisuals,
}: VoiceModeOptions) {
  const [isActive, setIsActive] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);
  activeRef.current = isActive;

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (activeRef.current) deactivate();
    }, VOICE_IDLE_MS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activate = useCallback(async () => {
    setIsActive(true);
    await geminiLive.connect();
    voiceInput.startListening();
    resetIdleTimer();
  }, [geminiLive, voiceInput, resetIdleTimer]);

  const deactivate = useCallback(() => {
    setIsActive(false);
    voiceInput.stopListening();
    geminiLive.disconnect();
    if (idleTimerRef.current) { clearTimeout(idleTimerRef.current); idleTimerRef.current = null; }
  }, [voiceInput, geminiLive]);

  const toggle = useCallback(async () => {
    if (isActive) {
      deactivate();
    } else {
      await activate();
    }
  }, [isActive, activate, deactivate]);

  /**
   * Called when continuous STT fires a final transcript (after 1.5s silence).
   * This is the core voice loop: RAG search → send to Gemini Live → show debug card.
   */
  const handleFinalTranscript = useCallback((transcript: string) => {
    if (!activeRef.current) return;
    resetIdleTimer();

    // Add user message to chat display
    onUserMessage?.(transcript);

    // Now that the message is in the chat, clear the live transcript bubble
    voiceInput.clearLiveTranscript();

    // Pause local STT while Gemini responds
    voiceInput.pause();

    // Client-side RAG search
    const { context: ragContext } = ragSearch(transcript);

    // Build combined prompt (matching transmit's sendRagToGemini)
    let combined = `The user just asked: "${transcript}"\n\n`;
    if (ragContext) {
      combined += `Your Earth Optimization Protocol notes:\n${ragContext}\n\n`;
      combined += "Answer the user's question using your own knowledge above.";
    } else {
      combined += "Answer the user's question.";
    }

    // Send to Gemini Live
    geminiLive.sendText(combined);

    // Show RAG debug card
    onRagSent?.({ transcript, ragContext });

    // Fire visuals request in parallel (non-blocking)
    fetchVisuals?.(transcript);
  }, [geminiLive, voiceInput, ragSearch, onRagSent, onUserMessage, fetchVisuals, resetIdleTimer]);

  // When Gemini finishes speaking, resume listening
  useEffect(() => {
    if (isActive && geminiLive.state === "listening") {
      voiceInput.resume();
      resetIdleTimer();
    }
  }, [isActive, geminiLive.state, voiceInput, resetIdleTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  return {
    isActive,
    toggle,
    handleFinalTranscript,
    voiceState: geminiLive.state,
  };
}
