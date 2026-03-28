"use client";

import { useEffect, useState, useRef } from "react";
import { useDemoStore } from "@/lib/demo/store";
import { SFX } from "@/lib/demo/audio";
import { cn } from "@/lib/utils";
import { WishoniaNarrator } from "@optimitron/wishonia-widget/narration";

const SPEAKING_INSTRUCTIONS =
  "Generate a patient, warm voice explaining something counterintuitive to someone smart. " +
  "Not condescending. Respects the listener's intelligence. Slightly quick.";

interface NarratorBoxProps {
  text?: string;
  slideId?: string;
  characterSpeed?: number;
  onComplete?: () => void;
  expression?: string;
  bodyPose?: string;
}

/** Cached manifest — fetched once */
let manifestCache: Record<string, { hash: string; file: string }> | null = null;
let manifestLoading = false;

async function getManifest() {
  if (manifestCache) return manifestCache;
  if (manifestLoading) return null;
  manifestLoading = true;
  try {
    const res = await fetch("/audio/narration/manifest.json");
    if (res.ok) {
      manifestCache = await res.json();
    }
  } catch {
    // No manifest = no audio files generated yet
  }
  manifestLoading = false;
  return manifestCache;
}

/**
 * Hook to play narration audio for the current slide (MP3 fallback)
 */
function useNarrationAudio(slideId?: string, enabled = true) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { isMuted, voiceVolume, masterVolume, isPlaying } = useDemoStore();

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : masterVolume * voiceVolume;
    }
  }, [isMuted, voiceVolume, masterVolume]);

  // Pause/resume with play state
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Load and play audio when slide changes
  useEffect(() => {
    // Stop previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    if (!slideId || !enabled) return;

    let cancelled = false;

    (async () => {
      const manifest = await getManifest();
      if (cancelled || !manifest || !manifest[slideId]) return;

      const audio = new Audio(`/audio/narration/${manifest[slideId].file}`);
      audio.volume = isMuted ? 0 : masterVolume * voiceVolume;
      audioRef.current = audio;

      // Signal auto-advance when narration finishes
      audio.addEventListener("ended", () => {
        useDemoStore.getState().setNarrationEnded(true);
      });

      // Auto-play (may be blocked by browser policy until user interaction)
      audio.play().catch(() => {});
    })();

    return () => {
      cancelled = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, [slideId, enabled]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Typewriter Text - Character by character reveal
 */
function TypewriterText({
  displayText,
  speed = 30,
  onComplete
}: {
  displayText: string;
  speed?: number;
  onComplete?: () => void;
}) {
  const [output, setOutput] = useState("");
  const [done, setDone] = useState(false);
  const { isMuted, setTyping, setTypewriterComplete } = useDemoStore();

  useEffect(() => {
    // Reset state
    setOutput("");
    setDone(false);

    // If empty or undefined, complete immediately
    if (!displayText || displayText.length === 0) {
      setDone(true);
      setTypewriterComplete(true);
      return;
    }

    setTyping(true);
    setTypewriterComplete(false);

    let charIndex = 0;
    const totalChars = displayText.length;

    const timer = setInterval(() => {
      if (charIndex < totalChars) {
        setOutput(displayText.slice(0, charIndex + 1));

        if (!isMuted && charIndex % 3 === 0) {
          try { SFX.typewriter(); } catch { /* ignore */ }
        }

        charIndex++;
      } else {
        clearInterval(timer);
        setDone(true);
        setTyping(false);
        setTypewriterComplete(true);
        if (onComplete) onComplete();
      }
    }, 1000 / speed);

    return () => {
      clearInterval(timer);
      setTyping(false);
    };
  }, [displayText, speed, onComplete, isMuted, setTyping, setTypewriterComplete]);

  return (
    <span className="narrator-text">
      {output}
      {!done && <span className="typewriter-cursor" />}
    </span>
  );
}

/**
 * Main Narrator Box Component
 */
export function NarratorBox({
  text = "",
  slideId,
  characterSpeed = 30,
  onComplete,
  expression,
  bodyPose,
}: NarratorBoxProps) {
  const { palette, isRecordingMode, isMuted, masterVolume, voiceVolume, liveTtsEnabled } = useDemoStore();
  const [key, setKey] = useState(0);

  // MP3 fallback: only active when live TTS is disabled
  useNarrationAudio(slideId, !liveTtsEnabled);

  // Always ensure text is a string
  const safeText = text ?? "";

  useEffect(() => {
    setKey((k) => k + 1);
  }, [safeText]);

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-40",
      `palette-${palette}`,
      isRecordingMode && "bottom-4 left-4 right-4"
    )}>
      <div className={cn(
        "narrator-box",
        "mx-2 mb-2 md:mx-4 md:mb-4",
        "flex gap-3 md:gap-4",
        "p-3 md:p-4",
        "min-h-[80px] md:min-h-[100px]"
      )}>
        {/* Animated Wishonia character — replaces old pixel portrait */}
        <div className={cn(
          "narrator-portrait relative",
          "w-12 h-12 md:w-16 md:h-16",
          "flex-shrink-0 flex items-center justify-center"
        )}>
          {liveTtsEnabled ? (
            <WishoniaNarrator
              tokenEndpoint="/api/gemini-live-token"
              text={safeText}
              voice="Kore"
              speakingInstructions={SPEAKING_INSTRUCTIONS}
              expression={expression as Parameters<typeof WishoniaNarrator>[0]["expression"]}
              bodyPose={bodyPose as Parameters<typeof WishoniaNarrator>[0]["bodyPose"]}
              size={40}
              position="custom"
              style={{ position: "relative" }}
              volume={masterVolume * voiceVolume}
              muted={isMuted}
              onNarrationEnd={() => {
                useDemoStore.getState().setNarrationEnded(true);
              }}
            />
          ) : (
            // Static fallback when live TTS is off — just the character, no audio
            <WishoniaNarrator
              tokenEndpoint=""
              text=""
              expression={expression as Parameters<typeof WishoniaNarrator>[0]["expression"]}
              bodyPose={bodyPose as Parameters<typeof WishoniaNarrator>[0]["bodyPose"]}
              size={40}
              position="custom"
              style={{ position: "relative" }}
              muted
            />
          )}
        </div>

        <div className="flex-1 flex items-center">
          <TypewriterText
            key={key}
            displayText={safeText}
            speed={characterSpeed}
            onComplete={onComplete}
          />
        </div>
      </div>
    </div>
  );
}

export function VerbResponse({ verb, response }: { verb: string; response: string }) {
  return (
    <div className={cn(
      "fixed top-20 left-1/2 -translate-x-1/2 z-50",
      "sierra-dialog max-w-md",
      "animate-slide-up"
    )}>
      <div className="text-pixel-xs text-[var(--sierra-accent)] mb-2">
        {">"} {verb}
      </div>
      <div className="font-terminal text-base text-[var(--sierra-fg)]">
        {response}
      </div>
    </div>
  );
}

export default NarratorBox;
