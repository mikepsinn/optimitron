"use client";

import { useEffect, useState } from "react";
import { useDemoStore } from "@/lib/demo/store";
import { PALETTE_SEMANTIC } from "@/lib/demo/palette";

interface BootLine {
  text: string;
  delay: number;
  isProgress?: boolean;
}

const BOOT_SEQUENCE: BootLine[] = [
  { text: "WISHONIA SYSTEMS BIOS v1.0", delay: 0 },
  { text: "Copyright (C) 2026 Wishonia Corp.", delay: 200 },
  { text: "", delay: 400 },
  { text: "Checking memory... 640K OK", delay: 600 },
  { text: "Loading SIERRA.SYS... OK", delay: 1000 },
  { text: "Initializing QUEST.EXE...", delay: 1400 },
  { text: "", delay: 1600 },
  { text: "Loading assets...", delay: 1800, isProgress: true },
  { text: "", delay: 3500 },
  { text: "Ready.", delay: 3700 },
];

export function BootScreen({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [showStart, setShowStart] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const { palette: paletteMode } = useDemoStore();
  const palette = PALETTE_SEMANTIC[paletteMode];

  // Cursor blink effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Boot sequence animation
  useEffect(() => {
    BOOT_SEQUENCE.forEach((line, index) => {
      setTimeout(() => {
        if (line.isProgress) {
          // Start progress animation
          const progressInterval = setInterval(() => {
            setProgress((p) => {
              if (p >= 100) {
                clearInterval(progressInterval);
                return 100;
              }
              return p + 2;
            });
          }, 30);
        } else {
          setLines((prev) => [...prev, line.text]);
        }
      }, line.delay);
    });

    // Show start prompt
    const startTimer = setTimeout(() => setShowStart(true), 4000);
    return () => clearTimeout(startTimer);
  }, []);

  // Handle keypress to start
  useEffect(() => {
    if (!showStart) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key) {
        onComplete();
      }
    };

    const handleClick = () => onComplete();

    window.addEventListener("keydown", handleKey);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("click", handleClick);
    };
  }, [showStart, onComplete]);

  // Progress bar visualization
  const progressBar = () => {
    const filled = Math.floor(progress / 4);
    const empty = 25 - filled;
    return "█".repeat(filled) + "░".repeat(empty) + ` ${progress}%`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: palette.background }}
    >
      {/* CRT scanline overlay */}
      <div className="sierra-scanlines absolute inset-0 pointer-events-none" />

      <div className="w-full max-w-2xl font-terminal text-sm md:text-base">
        {/* Boot text */}
        <div className="space-y-1" style={{ color: palette.foreground }}>
          {lines.map((line, i) => (
            <div key={i} className="whitespace-pre">
              {line}
            </div>
          ))}

          {/* Progress bar */}
          {progress > 0 && progress < 100 && (
            <div className="whitespace-pre" style={{ color: palette.accent }}>
              {progressBar()}
            </div>
          )}

          {/* Completed progress */}
          {progress >= 100 && (
            <div className="whitespace-pre" style={{ color: palette.success }}>
              {"█".repeat(25)} 100% COMPLETE
            </div>
          )}
        </div>

        {/* Start prompt */}
        {showStart && (
          <div 
            className="mt-8 text-center animate-pulse"
            style={{ color: palette.accent }}
          >
            <div className="text-lg md:text-xl">
              Press any key to begin...
            </div>
            <div className="mt-2 text-xs opacity-50">
              (or tap/click anywhere)
            </div>
          </div>
        )}

        {/* Blinking cursor */}
        <div 
          className="mt-4 inline-block w-3 h-5"
          style={{ 
            backgroundColor: cursorVisible ? palette.foreground : 'transparent',
            transition: 'none'
          }}
        />
      </div>

      {/* Retro border frame */}
      <div 
        className="absolute inset-4 md:inset-8 border-2 pointer-events-none rounded"
        style={{ borderColor: `${palette.foreground}30` }}
      />
    </div>
  );
}
