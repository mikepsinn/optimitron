/**
 * Web Speech API STT hook.
 * Wraps SpeechRecognition with transcript correction for domain terms.
 */

"use client";

import { useState, useRef, useCallback } from "react";
import { correctTranscript } from "@/lib/search";

// Web Speech API types (not in all TS libs)
interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionResultItem;
  length: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionEventLike {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

export function useVoiceInput(onResult?: (transcript: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const isSupported = typeof window !== "undefined" && (
    "SpeechRecognition" in window || "webkitSpeechRecognition" in window
  );

  const startListening = useCallback(() => {
    if (!isSupported || isListening) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const Ctor = win["SpeechRecognition"] || win["webkitSpeechRecognition"];
    if (!Ctor) return;

    const recognition: SpeechRecognitionLike = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const raw = event.results[0]?.[0]?.transcript ?? "";
      const corrected = correctTranscript(raw);
      onResult?.(corrected);
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      console.error("[voice-input] Error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isSupported, isListening, onResult]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, startListening, stopListening, isSupported };
}
