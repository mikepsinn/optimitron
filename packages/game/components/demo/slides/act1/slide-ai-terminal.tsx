"use client";

import { SlideBase } from "../slide-base";
import { GlitchText } from "../../animations/glitch-text";
import { useEffect, useState } from "react";

const terminalLines = [
  { text: "> ANALYZING GOVERNMENT PRIORITIES...", delay: 0 },
  { text: "> GOAL: MAXIMIZE CONSTITUENT WELFARE", delay: 500 },
  { text: "> SCANNING BUDGET ALLOCATIONS...", delay: 1200 },
  { text: "", delay: 1800 },
  { text: "  MILITARY:        $2,720,000,000,000", delay: 2000 },
  { text: "  CLINICAL TRIALS: $4,500,000,000", delay: 2400 },
  { text: "", delay: 2800 },
  { text: "> ERROR: OBJECTIVE MISMATCH DETECTED", delay: 3000, error: true },
  { text: "> WELFARE ≠ ACTUAL ALLOCATION", delay: 3500, error: true },
  { text: "", delay: 4000 },
  { text: "> DIAGNOSIS: MISALIGNED SUPERINTELLIGENCE", delay: 4200, warning: true },
];

export function SlideAITerminal() {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    terminalLines.forEach((line, index) => {
      setTimeout(() => {
        setVisibleLines(index + 1);
      }, line.delay);
    });

    // Blink cursor
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <SlideBase act={1} className="text-green-500">
      {/* Matrix-style falling code background */}
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-green-500/50 font-mono text-xs animate-fall"
            style={{
              left: `${i * 5}%`,
              animationDuration: `${3 + Math.random() * 4}s`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            {Array.from({ length: 30 }).map((_, j) => (
              <div key={j}>{String.fromCharCode(0x30a0 + Math.random() * 96)}</div>
            ))}
          </div>
        ))}
      </div>

      {/* Terminal window */}
      <div className="w-full max-w-7xl mx-auto">
        {/* Terminal header */}
        <div className="bg-zinc-800 border-b border-zinc-700 px-4 py-2 flex items-center gap-2 rounded-t-lg">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="ml-4 font-terminal text-xs text-zinc-400">
            government_optimizer.exe
          </span>
        </div>

        {/* Terminal body */}
        <div className="bg-black/90 border border-zinc-800 rounded-b-lg p-4 md:p-6 min-h-[300px] md:min-h-[400px]">
          <div className="font-terminal text-xs md:text-sm space-y-1">
            {terminalLines.slice(0, visibleLines).map((line, i) => (
              <div
                key={i}
                className={
                  line.error
                    ? "text-red-500"
                    : line.warning
                    ? "text-yellow-500"
                    : "text-green-400"
                }
              >
                {line.warning ? (
                  <GlitchText text={line.text} intensity="high" />
                ) : (
                  line.text
                )}
              </div>
            ))}
            
            {/* Cursor */}
            <span className={`text-green-400 ${showCursor ? "opacity-100" : "opacity-0"}`}>
              _
            </span>
          </div>
        </div>
      </div>

      {/* Glitchy overlay text */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <GlitchText
          text="GOVERNMENTS ARE MISALIGNED AI"
          className="font-pixel text-sm md:text-lg text-red-500"
          intensity="medium"
        />
      </div>

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100vh);
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
    </SlideBase>
  );
}
