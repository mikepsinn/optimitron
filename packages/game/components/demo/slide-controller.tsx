"use client";

import { useEffect, useCallback, useRef } from "react";
import { useDemoStore } from "@/lib/demo/store";
import { SLIDES } from "@/lib/demo/demo-config";

interface SlideControllerProps {
  children: React.ReactNode;
}

export function SlideController({ children }: SlideControllerProps) {
  const {
    currentSlide,
    nextSlide,
    prevSlide,
    setPalette,
  } = useDemoStore();

  // Get current slide config
  const currentSlideConfig = SLIDES[currentSlide];

  // Update palette based on current slide's act
  useEffect(() => {
    if (currentSlideConfig) {
      // Switch to VGA palette after The Turn
      if (currentSlideConfig.act === "turn" || currentSlideConfig.act === "act2" || currentSlideConfig.act === "act3") {
        setPalette("vga");
      } else {
        setPalette("ega");
      }
    }
  }, [currentSlideConfig, setPalette]);

  // Simple keyboard controls - only arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if in an input
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
