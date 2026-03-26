"use client";

import { SlideBase } from "../slide-base";
import { GlitchText } from "../../animations/glitch-text";
import { PARAMETERS } from "@/lib/demo/parameters";
import { useEffect, useState } from "react";

export function SlideGameOver() {
  const [phase, setPhase] = useState(0);
  const [showRestore, setShowRestore] = useState(false);

  useEffect(() => {
    // Phase 1: Freeze
    setTimeout(() => setPhase(1), 500);
    // Phase 2: Desaturate
    setTimeout(() => setPhase(2), 1500);
    // Phase 3: CRT collapse effect
    setTimeout(() => setPhase(3), 2500);
    // Phase 4: Game over text
    setTimeout(() => setPhase(4), 3500);
    // Phase 5: Show restore option
    setTimeout(() => setShowRestore(true), 5000);
  }, []);

  return (
    <SlideBase act={1} className="text-red-500 overflow-hidden">
      {/* CRT collapse effect */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${
          phase >= 3 ? "scale-x-100 scale-y-[0.02]" : "scale-100"
        }`}
        style={{
          filter: phase >= 2 ? "grayscale(100%) brightness(0.5)" : "none",
        }}
      >
        {/* Static content that "freezes" */}
        <div className="w-full max-w-7xl aspect-video bg-zinc-900/80 border border-zinc-700 p-8 relative">
          {/* Frozen city scene */}
          <div className="grid grid-cols-5 gap-4 opacity-50">
            {["🏚️", "🏚️", "🏭", "🏥", "🏫"].map((e, i) => (
              <div key={i} className="text-4xl text-center grayscale">
                {e}
              </div>
            ))}
          </div>
          <div className="text-center mt-4 text-zinc-600 font-pixel text-xs">
            MORONIA - YEAR 2040
          </div>
        </div>
      </div>

      {/* Screen collapse line (CRT shutdown) */}
      {phase >= 3 && phase < 4 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-[2px] bg-white animate-pulse" />
        </div>
      )}

      {/* GAME OVER text */}
      {phase >= 4 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
          <GlitchText
            text="GAME OVER"
            className="font-pixel text-4xl md:text-8xl text-red-500"
            intensity="high"
            active={true}
          />
          
          <div className="mt-8 font-pixel text-sm md:text-lg text-red-400 animate-pulse">
            CIVILIZATION HAS COLLAPSED
          </div>

          <div className="mt-4 font-pixel text-xs text-zinc-400 max-w-md text-center space-y-1">
            <div>Moronia allocated {PARAMETERS.spending.ratio}&times; more to weapons than curing disease.</div>
            <div>Correlation with Earth: {PARAMETERS.moronia.correlationPercent}%.</div>
          </div>

          {/* Restore game option */}
          {showRestore && (
            <div className="mt-12 animate-fade-in">
              <div className="font-pixel text-xs text-zinc-500 mb-4 text-center animate-pulse">
                BUT WAIT...
              </div>
              
              <div className="border-2 border-amber-500/50 bg-black/80 px-6 py-4">
                <div className="font-pixel text-amber-400 text-sm mb-2">
                  SAVE FILE DETECTED
                </div>
                <div className="flex gap-4 font-pixel text-xs">
                  <div className="text-zinc-500">
                    <span className="text-amber-400">File:</span> WISHONIA.SAV
                  </div>
                  <div className="text-zinc-500">
                    <span className="text-amber-400">Date:</span> 2026
                  </div>
                </div>
                <div className="mt-4 flex justify-center gap-3">
                  <span className="font-pixel text-xs text-amber-400 border border-amber-500/50 px-3 py-1 hover:bg-amber-500/20 cursor-pointer">
                    RESTORE
                  </span>
                  <span className="font-pixel text-xs text-zinc-400 border border-zinc-600/50 px-3 py-1 hover:bg-zinc-500/20 cursor-pointer">
                    RESTART
                  </span>
                  <span className="font-pixel text-xs text-zinc-400 border border-zinc-600/50 px-3 py-1 hover:bg-zinc-500/20 cursor-pointer">
                    QUIT
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scanline effect intensifies */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
          phase >= 2 ? "opacity-30" : "opacity-10"
        }`}
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.3) 2px,
            rgba(0, 0, 0, 0.3) 4px
          )`,
        }}
      />

      {/* Vignette */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-2000 ${
          phase >= 2 ? "opacity-80" : "opacity-0"
        }`}
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, black 100%)`,
        }}
      />

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
      `}</style>
    </SlideBase>
  );
}
