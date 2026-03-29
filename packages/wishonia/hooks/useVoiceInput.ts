/**
 * Web Speech API STT hook with continuous mode + debounce.
 * In continuous mode, accumulates multi-sentence speech and fires
 * onFinalTranscript after 1.5s of silence (matching transmit behavior).
 */

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { correctTranscript } from "@/lib/search";

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onresult: ((event: any) => void) | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface UseVoiceInputOptions {
  /** Called for single-utterance result (continuous=false) */
  onResult?: (transcript: string) => void;
  /** Called after silence debounce in continuous mode */
  onFinalTranscript?: (transcript: string) => void;
  /** Enable continuous listening with debounce (default false) */
  continuous?: boolean;
  /** Debounce delay in ms (default 1500) */
  debounceMs?: number;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const { onResult, onFinalTranscript, continuous = false, debounceMs = 1500 } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const accumulatorRef = useRef("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedRef = useRef(false);
  const listeningRequestedRef = useRef(false);
  const isListeningRef = useRef(false);
  const onResultRef = useRef(onResult);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const continuousRef = useRef(continuous);
  continuousRef.current = continuous;
  onResultRef.current = onResult;
  onFinalTranscriptRef.current = onFinalTranscript;

  // Check support after hydration
  useEffect(() => {
    setIsSupported(
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window
    );
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || isListeningRef.current || recognitionRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const Ctor = win["SpeechRecognition"] || win["webkitSpeechRecognition"];
    if (!Ctor) return;

    listeningRequestedRef.current = true;
    accumulatorRef.current = "";
    setLiveTranscript("");
    pausedRef.current = false;

    const recognition: SpeechRecognitionLike = new Ctor();
    recognition.continuous = continuousRef.current;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const raw = event.results[i][0]?.transcript ?? "";
          const corrected = correctTranscript(raw.trim());
          if (!corrected) continue;

          if (continuousRef.current) {
            // Continuous mode: accumulate + debounce
            accumulatorRef.current += (accumulatorRef.current ? " " : "") + corrected;
            setLiveTranscript(accumulatorRef.current);
            console.info("[voice-rag] chunk", {
              chunk: corrected,
              accumulated: accumulatorRef.current,
            });

            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
              const finalText = accumulatorRef.current.trim();
              accumulatorRef.current = "";
              debounceTimerRef.current = null;
              // Don't clear liveTranscript yet — keep it visible until the
              // message appears in the chat array. The caller clears it via
              // clearLiveTranscript() after confirming the message was added.
              if (finalText) {
                console.info("[voice-rag] debounce fired, sending", finalText);
                onFinalTranscriptRef.current?.(finalText);
              }
            }, debounceMs);
          } else {
            // Single-utterance mode
            onResultRef.current?.(corrected);
            setIsListening(false);
          }
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      console.error("[voice-input] Error:", event.error);
    };

    recognition.onend = () => {
      console.info("[voice-rag] local speech recognition ended", {
        paused: pausedRef.current,
        listeningRequested: listeningRequestedRef.current,
      });
      if (continuousRef.current && !pausedRef.current && listeningRequestedRef.current) {
        // Auto-restart in continuous mode
        console.info("[voice-rag] local speech recognition restarting");
        try {
          recognition.start();
          isListeningRef.current = true;
          setIsListening(true);
        } catch {
          recognitionRef.current = null;
          isListeningRef.current = false;
          setIsListening(false);
        }
      } else {
        recognitionRef.current = null;
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    isListeningRef.current = true;
    setIsListening(true);
    console.info("[voice-rag] local speech recognition started");
  }, [isSupported, debounceMs]);

  const stopListening = useCallback(() => {
    pausedRef.current = true;
    listeningRequestedRef.current = false;
    if (debounceTimerRef.current) { clearTimeout(debounceTimerRef.current); debounceTimerRef.current = null; }
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    accumulatorRef.current = "";
    isListeningRef.current = false;
    setLiveTranscript("");
    setIsListening(false);
    console.info("[voice-rag] local speech recognition stopped");
  }, []);

  /** Pause without cleaning up (for when AI is speaking) */
  const pause = useCallback(() => {
    pausedRef.current = true;
    isListeningRef.current = false;
    setIsListening(false);
    recognitionRef.current?.stop();
    console.info("[voice-rag] local speech recognition paused");
  }, []);

  /** Resume after pause */
  const resume = useCallback(() => {
    if (!isSupported) return;
    pausedRef.current = false;
    listeningRequestedRef.current = true;
    // Delay to avoid conflicts
    setTimeout(() => {
      if (!pausedRef.current) startListening();
    }, 200);
    console.info("[voice-rag] local speech recognition resuming");
  }, [isSupported, startListening]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      recognitionRef.current?.stop();
    };
  }, []);

  const clearLiveTranscript = useCallback(() => {
    setLiveTranscript("");
  }, []);

  return { isListening, startListening, stopListening, pause, resume, isSupported, liveTranscript, clearLiveTranscript };
}
