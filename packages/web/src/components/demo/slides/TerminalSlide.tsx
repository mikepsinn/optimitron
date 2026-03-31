"use client";

import { ScanLines } from "@/components/animations/GlitchText";
import { GlitchText } from "@/components/animations/GlitchText";

const ARCADE = "font-pixel";

/** 1. Terminal slide — CRT horror, glitching transmission */
export default function TerminalSlide() {
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 bg-foreground overflow-hidden">
      <ScanLines />
      <div className="w-full max-w-6xl">
        <GlitchText intensity="high" className="block">
          <p
            className={`${ARCADE} text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-brutal-cyan leading-tight`}
            style={{
              overflow: "hidden",
              borderRight: "6px solid",
              whiteSpace: "normal",
              animation:
                "terminal-reveal 3s steps(60, end), blink-caret 0.75s step-end infinite",
            }}
          >
            MISALIGNED SUPERINTELLIGENCE
          </p>
        </GlitchText>
      </div>
      <style>{`
        @keyframes terminal-reveal { from { max-height: 0; } to { max-height: 600px; } }
        @keyframes blink-caret { from, to { border-color: transparent; } 50% { border-color: currentColor; } }
      `}</style>
    </div>
  );
}
