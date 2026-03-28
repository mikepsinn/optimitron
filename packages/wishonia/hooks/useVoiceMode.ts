/**
 * Voice mode loop: listen → send → TTS → listen.
 * Orchestrates useVoiceInput and useTTS with the streaming chat.
 */

"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface VoiceModeOptions {
  sendMessage: (text: string) => Promise<string | undefined>;
  startListening: () => void;
  stopListening: () => void;
  playTTS: (text: string) => Promise<void>;
  stopTTS: () => void;
  isStreaming: boolean;
}

const VOICE_IDLE_MS = 60_000;

export function useVoiceMode({
  sendMessage,
  startListening,
  stopListening,
  playTTS,
  stopTTS,
  isStreaming,
}: VoiceModeOptions) {
  const [isActive, setIsActive] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);
  activeRef.current = isActive;

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (activeRef.current) {
        setIsActive(false);
        stopListening();
        stopTTS();
      }
    }, VOICE_IDLE_MS);
  }, [stopListening, stopTTS]);

  const toggle = useCallback(() => {
    if (isActive) {
      setIsActive(false);
      stopListening();
      stopTTS();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    } else {
      setIsActive(true);
      startListening();
      resetIdleTimer();
    }
  }, [isActive, startListening, stopListening, stopTTS, resetIdleTimer]);

  // Handle voice result: send message, play TTS on response, then listen again
  const handleVoiceResult = useCallback(
    async (transcript: string) => {
      if (!activeRef.current) return;
      resetIdleTimer();

      const response = await sendMessage(transcript);
      if (!activeRef.current || !response) return;

      // Strip expression tags from the response for TTS
      const cleanText = response.replace(/\[expression:\w+\]/g, "").trim();
      if (cleanText) {
        await playTTS(cleanText);
      }

      // Resume listening after TTS
      if (activeRef.current) {
        startListening();
        resetIdleTimer();
      }
    },
    [sendMessage, playTTS, startListening, resetIdleTimer]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  return { isActive, toggle, handleVoiceResult };
}
