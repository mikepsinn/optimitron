"use client";

// Cache bust: v3
import { useEffect, useState, useRef, useCallback } from "react";
import { useDemoStore } from "@/lib/demo/store";
import { SFX } from "@/lib/demo/audio";
import { cn } from "@/lib/utils";

interface NarratorBoxProps {
  text?: string;
  slideId?: string;
  characterSpeed?: number;
  onComplete?: () => void;
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
 * Hook to play narration audio for the current slide
 */
function useNarrationAudio(slideId?: string) {
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

    if (!slideId) return;

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
  }, [slideId]); // Only re-run when slide changes
}

/**
 * Wishonia Portrait - Pixel art character portrait
 */
function WishoniaPortrait() {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
      }
    }, 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div className={cn(
      "narrator-portrait relative overflow-hidden",
      "w-12 h-12 md:w-16 md:h-16",
      "flex-shrink-0"
    )}>
      <div className="absolute inset-0 bg-[#1a1a2e] flex items-center justify-center">
        <div className="relative w-10 h-10 md:w-12 md:h-12">
          <div className="absolute inset-1 bg-[#e8c4a0] rounded-sm" />
          <div className={cn(
            "absolute top-3 left-2 w-2 h-2 bg-[#2a2a4a] rounded-sm transition-all",
            isBlinking && "h-0.5"
          )} />
          <div className={cn(
            "absolute top-3 right-2 w-2 h-2 bg-[#2a2a4a] rounded-sm transition-all",
            isBlinking && "h-0.5"
          )} />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-3 h-1 bg-[#8b4513] rounded-sm" />
          <div className="absolute top-0 left-0 right-0 h-2 bg-[#4a3728] rounded-t-sm" />
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />
    </div>
  );
}

/**
 * Typewriter Text - Character by character reveal
 * NOTE: This component uses displayText prop, NOT text
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
export function NarratorBox({ text = "", slideId, characterSpeed = 30, onComplete }: NarratorBoxProps) {
  const { palette, isRecordingMode } = useDemoStore();
  const [key, setKey] = useState(0);

  // Play narration audio
  useNarrationAudio(slideId);
  
  // Always ensure text is a string - this is passed to TypewriterText as displayText
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
        <WishoniaPortrait />
        
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
