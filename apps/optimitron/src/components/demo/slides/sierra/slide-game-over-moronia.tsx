"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { GlitchText } from "../../animations/sierra/glitch-text";
import { MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO } from "@optimitron/data/parameters";
import { useEffect, useState } from "react";

export function SlideGameOverMoronia() {
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
    <SierraSlideWrapper act={1} className="text-red-500 overflow-hidden">
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
        <div className="w-full max-w-[1700px] aspect-video bg-zinc-900/80 border border-zinc-700 p-8 relative">
          {/* Frozen city scene */}
          <div className="grid grid-cols-5 gap-4 opacity-50">
            {["🏚️", "🏚️", "🏭", "🏥", "🏫"].map((e, i) => (
              <div key={i} className="text-4xl text-center grayscale">
                {e}
              </div>
            ))}
          </div>
          <div className="text-center mt-4 text-zinc-300 font-pixel text-xl">
            EARTH - YEAR 2040
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
          
          <div className="mt-8 font-pixel text-2xl md:text-4xl text-red-400 animate-pulse">
            YOUR CIVILIZATION HAS COLLAPSED
          </div>

          <div className="mt-4 font-pixel text-xl md:text-2xl text-zinc-200 max-w-4xl text-center space-y-1">
            <div>You allocated {Math.round(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value)}&times; more to weapons than curing disease.</div>
            <div>The math was not on your side.</div>
          </div>

          {/* Restore game option */}
          {showRestore && (
            <div className="mt-12 animate-fade-in">
              <div className="font-pixel text-2xl md:text-3xl text-zinc-200 mb-4 text-center animate-pulse">
                BUT WAIT...
              </div>

              <div className="border-2 border-amber-500/50 bg-black/80 px-8 py-6">
                <div className="font-pixel text-amber-400 text-2xl md:text-3xl mb-3">
                  SAVE FILE DETECTED
                </div>
                <div className="flex gap-6 font-pixel text-xl md:text-2xl">
                  <div className="text-zinc-200">
                    <span className="text-amber-400">File:</span> WISHONIA.SAV
                  </div>
                  <div className="text-zinc-200">
                    <span className="text-amber-400">Date:</span> 2026
                  </div>
                </div>
                <div className="mt-5 flex justify-center gap-4">
                  <span className="font-pixel text-xl md:text-2xl text-amber-400 border border-amber-500/50 px-5 py-2 hover:bg-amber-500/20 cursor-pointer">
                    RESTORE
                  </span>
                  <span className="font-pixel text-xl md:text-2xl text-zinc-200 border border-zinc-600/50 px-5 py-2 hover:bg-zinc-500/20 cursor-pointer">
                    RESTART
                  </span>
                  <span className="font-pixel text-xl md:text-2xl text-zinc-200 border border-zinc-600/50 px-5 py-2 hover:bg-zinc-500/20 cursor-pointer">
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
    </SierraSlideWrapper>
  );
}
export default SlideGameOverMoronia;
