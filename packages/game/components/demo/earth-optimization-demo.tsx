"use client";

import { useEffect, useState, useCallback } from "react";
import { useDemoStore } from "@/lib/demo/store";
import { SierraChrome } from "./chrome/sierra-chrome";
import { SlideController } from "./slide-controller";
import { SlideRenderer } from "./slide-renderer";
import { ProgressBar } from "./controls/progress-bar";
import { ControlPanel } from "./controls/control-panel";

import { BootScreen } from "./boot-screen";
import { SLIDES } from "@/lib/demo/demo-config";
import { cn } from "@/lib/utils";

/** Running death counter — "X humans terminated since this presentation began" */
function DeathCounter() {
  const [count, setCount] = useState(0);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    // ~1 death per 0.6 seconds (150,000 per day / 86,400s ≈ 1.736/s)
    const DEATHS_PER_MS = 1 / 600;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setCount(Math.floor(elapsed * DEATHS_PER_MS));
    }, 600);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 text-right">
      <div>
        <div className="font-pixel text-sm text-red-500 tabular-nums">
          💀 {count.toLocaleString()} HUMANS TERMINATED
        </div>
        <div className="font-pixel text-xs text-red-500/70">
          SINCE THIS PRESENTATION BEGAN
        </div>
      </div>
    </div>
  );
}

export function EarthOptimizationDemo() {
  const [booted, setBooted] = useState(false);
  const { 
    palette, 
    isRecordingMode,
    currentSlide,
    nextSlide,
    prevSlide,
  } = useDemoStore();

  const goToSlide = useDemoStore((s) => s.goToSlide);

  // Get current slide narration
  const currentSlideConfig = SLIDES[currentSlide];
  const narrationText = currentSlideConfig?.narration || "";

  const handleBootComplete = useCallback(() => {
    setBooted(true);
  }, []);

  // Sync slide position with URL hash
  useEffect(() => {
    // On mount, restore slide from hash
    const hash = window.location.hash.slice(1);
    if (hash) {
      const index = SLIDES.findIndex((s) => s.id === hash);
      if (index >= 0) goToSlide(index);
    }
  }, [goToSlide]);

  useEffect(() => {
    // Update hash when slide changes
    const id = SLIDES[currentSlide]?.id;
    if (id) {
      window.history.replaceState(null, "", `#${id}`);
    }
  }, [currentSlide]);

  // Skip boot screen in recording mode or test mode (?skipBoot=true)
  useEffect(() => {
    if (isRecordingMode && !booted) {
      setBooted(true);
    }
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("skipBoot")) {
      setBooted(true);
    }
  }, [isRecordingMode, booted]);
  
  // Handle click navigation - click left side to go back, right side to go forward
  const handleClick = useCallback((e: React.MouseEvent) => {
    // Ignore clicks on interactive elements or their children
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, [role="button"], .control-panel, .progress-bar, .narrator-box')) {
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    
    if (clickX < width / 3) {
      // Click on left third - go back
      prevSlide();
    } else {
      // Click on right two-thirds - go forward
      nextSlide();
    }
  }, [nextSlide, prevSlide]);

  // Palette-based color classes
  const paletteClasses = {
    ega: "text-red-500", // Horror act
    vga: "text-cyan-400", // Hope act
  };

  // Show boot screen first
  if (!booted) {
    return <BootScreen onComplete={handleBootComplete} />;
  }

  return (
    <SlideController>
      <div 
        className={cn(
          "relative w-full h-screen overflow-hidden cursor-pointer",
          "bg-black",
          paletteClasses[palette],
          // CRT effect
          "sierra-crt"
        )}
        onClick={handleClick}
      >
        {/* Main slide area */}
        <div className="absolute inset-0">
          <SierraChrome narrationText={narrationText} slideId={currentSlideConfig?.id}>
            <SlideRenderer />
          </SierraChrome>
        </div>

        {/* Progress bar at bottom (hidden in recording mode) */}
        {!isRecordingMode && (
          <div className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/80 to-transparent pt-8">
            <ProgressBar />
          </div>
        )}

        {/* Control panel (hidden in recording mode) */}
        <ControlPanel />

        {/* Death counter — replaces REC indicator */}
        <DeathCounter />

        {/* Navigation hint */}
        {!isRecordingMode && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none opacity-50">
            <span className="font-pixel text-[10px] text-white/60">Click or use arrow keys to navigate</span>
          </div>
        )}
      </div>
    </SlideController>
  );
}
