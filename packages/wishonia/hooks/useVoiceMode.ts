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
import type { ScoredResult } from "@/lib/search";
import { shouldResumeVoiceInput } from "@/lib/voice-mode-utils";

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
  ragSearch: (query: string) => { context: string; results: ScoredResult[] };
  /** Callback when RAG is sent (to show debug card) */
  onRagSent?: (data: {
    transcript: string;
    ragContext: string;
    results: ScoredResult[];
  }) => void;
  /** Callback when user message should be added to chat */
  onUserMessage?: (text: string) => void;
  /** Fire visuals request in parallel (without triggering text chat API) */
  fetchVisuals?: (question: string, ragContext: string) => void;
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
  const previousGeminiStateRef = useRef<VoiceState | null>(null);
  activeRef.current = isActive;

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (activeRef.current) {
        console.info("[voice-rag] idle timeout, stopping voice mode");
        deactivate();
      }
    }, VOICE_IDLE_MS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activate = useCallback(async () => {
    console.info("[voice-rag] activating voice mode");
    setIsActive(true);
    await geminiLive.connect();
    voiceInput.startListening();
    resetIdleTimer();
  }, [geminiLive, voiceInput, resetIdleTimer]);

  const deactivate = useCallback(() => {
    console.info("[voice-rag] deactivating voice mode");
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
    console.info("[voice-rag] final transcript", transcript);

    // Add user message to chat display
    onUserMessage?.(transcript);

    // Now that the message is in the chat, clear the live transcript bubble
    voiceInput.clearLiveTranscript();

    // Pause local STT while Gemini responds
    voiceInput.pause();

    // Client-side RAG search
    const { context: ragContext, results } = ragSearch(transcript);
    console.info("[voice-rag] rag search", {
      transcriptChars: transcript.length,
      contextChars: ragContext.length,
      resultCount: results.length,
    });

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
    console.info("[voice-rag] sent RAG-enriched text to Gemini Live", {
      combinedChars: combined.length,
    });

    // Show RAG debug card
    onRagSent?.({ transcript, ragContext, results });

    // Fire visuals request in parallel (non-blocking)
    fetchVisuals?.(transcript, ragContext);
  }, [geminiLive, voiceInput, ragSearch, onRagSent, onUserMessage, fetchVisuals, resetIdleTimer]);

  // When Gemini finishes speaking, resume listening
  useEffect(() => {
    const previousState = previousGeminiStateRef.current;
    previousGeminiStateRef.current = geminiLive.state;
    if (shouldResumeVoiceInput(isActive, previousState, geminiLive.state)) {
      console.info("[voice-rag] Gemini returned to listening, resuming local speech recognition");
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
