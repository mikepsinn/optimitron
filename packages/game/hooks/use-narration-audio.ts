"use client";

import { useEffect, useRef, useState } from "react";
import { useDemoStore } from "@/lib/demo/store";

/** Cached manifest — fetched once, concurrent callers wait on the same promise */
let manifestPromise: Promise<Record<string, { hash: string; file: string }> | null> | null = null;

function getManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch("/audio/narration/manifest.json")
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
  }
  return manifestPromise;
}

/** Shared AudioContext — reused across slide changes (browsers limit how many you can create) */
let sharedCtx: AudioContext | null = null;

function getAudioContext() {
  if (!sharedCtx) {
    sharedCtx = new AudioContext();
  }
  // Resume if suspended (happens before user gesture on some browsers)
  if (sharedCtx.state === "suspended") {
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

export interface NarrationAudioState {
  hasMp3: boolean | null;
  analyserNode: AnalyserNode | null;
}

/**
 * Hook to play narration audio for the current slide (MP3).
 * Returns hasMp3 status and an AnalyserNode for real-time lip-sync.
 */
export function useNarrationAudio(slideId?: string, enabled = true): NarrationAudioState {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const { isMuted, voiceVolume, masterVolume } = useDemoStore();
  const [hasMp3, setHasMp3] = useState<boolean | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : masterVolume * voiceVolume;
    }
  }, [isMuted, voiceVolume, masterVolume]);

  // Load and play audio when slide changes
  useEffect(() => {
    // Stop previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    // Disconnect previous source (but keep analyser alive for reuse)
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    setHasMp3(null);
    setAnalyserNode(null);

    if (!slideId || !enabled) {
      setHasMp3(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const manifest = await getManifest();
      if (cancelled) return;

      // Check for playlist-specific audio first, then fall back to default
      const { playlistId } = useDemoStore.getState();
      const playlistKey = `${playlistId}--${slideId}`;
      const manifestEntry = manifest?.[playlistKey] || manifest?.[slideId];

      if (!manifest || !manifestEntry) {
        console.warn(`[narration] No MP3 for slide "${slideId}" — will use live TTS`);
        setHasMp3(false);
        return;
      }

      setHasMp3(true);

      const url = `/audio/narration/${manifestEntry.file}`;
      const audio = new Audio(url);
      audio.crossOrigin = "anonymous";
      audio.volume = isMuted ? 0 : masterVolume * voiceVolume;
      audioRef.current = audio;

      // Wire up Web Audio for lip-sync analyser
      try {
        const ctx = getAudioContext();
        const source = ctx.createMediaElementSource(audio);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        sourceRef.current = source;
        analyserRef.current = analyser;
        if (!cancelled) setAnalyserNode(analyser);
      } catch {
        // Web Audio not available — lip-sync won't work but audio still plays
      }

      audio.addEventListener("ended", () => {
        useDemoStore.getState().setNarrationEnded(true);
      });

      audio.play().catch((err) => {
        console.warn(`[narration] Autoplay blocked:`, err.message);
      });
    })();

    return () => {
      cancelled = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
    };
  }, [slideId, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return { hasMp3, analyserNode };
}
