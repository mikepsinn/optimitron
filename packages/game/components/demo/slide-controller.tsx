"use client";

import { useEffect, useRef } from "react";
import { useDemoStore } from "@/lib/demo/store";
import { SLIDES } from "@/lib/demo/demo-config";

interface SlideControllerProps {
  children: React.ReactNode;
}

export function SlideController({ children }: SlideControllerProps) {
  const {
    currentSlide,
    isPlaying,
    narrationEnded,
    typewriterComplete,
    nextSlide,
    prevSlide,
    setPalette,
  } = useDemoStore();

  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get current slide config
  const currentSlideConfig = SLIDES[currentSlide];

  // Update palette based on current slide's act
  useEffect(() => {
    if (currentSlideConfig) {
      if (currentSlideConfig.act === "turn" || currentSlideConfig.act === "act2" || currentSlideConfig.act === "act3") {
        setPalette("vga");
      } else {
        setPalette("ega");
      }
    }
  }, [currentSlideConfig, setPalette]);

  // Auto-advance: when narration audio ends, wait 1.5s then advance
  useEffect(() => {
    if (!isPlaying || !narrationEnded) return;

    advanceTimerRef.current = setTimeout(() => {
      nextSlide();
    }, 1500);

    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, [isPlaying, narrationEnded, nextSlide]);

  // Fallback auto-advance: if no audio ends within duration + buffer, advance anyway
  useEffect(() => {
    if (!isPlaying) return;

    const duration = Math.max((currentSlideConfig?.duration || 8) * 1000, 5000);
    // Add 5s buffer beyond stated duration to allow audio to finish
    const maxWait = duration + 5000;

    fallbackTimerRef.current = setTimeout(() => {
      // Only advance if narration hasn't already triggered advance
      if (!useDemoStore.getState().narrationEnded) {
        nextSlide();
      }
    }, maxWait);

    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, [isPlaying, currentSlide, currentSlideConfig, nextSlide]);

  // Simple keyboard controls - only arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        nextSlide();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        prevSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [nextSlide, prevSlide]);

  return <>{children}</>;
}
