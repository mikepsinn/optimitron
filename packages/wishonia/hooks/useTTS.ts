/**
 * Text-to-speech playback hook.
 * POSTs to /api/tts, caches audio blobs, plays via Audio API.
 */

"use client";

import { useState, useRef, useCallback } from "react";

export function useTTS(onEnded?: () => void) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());

  const play = useCallback(async (text: string) => {
    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    let blobUrl = cacheRef.current.get(text);

    if (!blobUrl) {
      setIsLoading(true);
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
        const blob = await res.blob();
        blobUrl = URL.createObjectURL(blob);
        cacheRef.current.set(text, blobUrl);
      } catch (err) {
        console.error("[tts] Failed:", err);
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    }

    const audio = new Audio(blobUrl);
    audioRef.current = audio;

    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => {
      setIsPlaying(false);
      audioRef.current = null;
      onEnded?.();
    };
    audio.onerror = () => {
      setIsPlaying(false);
      audioRef.current = null;
    };

    audio.play().catch(console.error);
  }, [onEnded]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  return { play, stop, isPlaying, isLoading };
}
