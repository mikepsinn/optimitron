"use client";

import { SlideBase } from "../slide-base";
import { ParticleEmitter } from "../../animations/particle-emitter";
import { useDemoStore } from "@/lib/demo/store";
import { useEffect, useState } from "react";

export function SlideRestoreFromWishonia() {
  const [phase, setPhase] = useState(0);
  const setPalette = useDemoStore((s) => s.setPalette);
  const setScore = useDemoStore((s) => s.setScore);
  const showQuestMeters = useDemoStore((s) => s.showQuestMeters);

  useEffect(() => {
    // Phase 0: Loading
    // Phase 1: Palette burst
    setTimeout(() => {
      setPhase(1);
      setPalette("vga"); // INSTANT palette shift!
      setScore(0);
    }, 1000);

    // Phase 2: Quest meters appear
    setTimeout(() => {
      setPhase(2);
      showQuestMeters();
    }, 2500);

    // Phase 3: CTA
    setTimeout(() => setPhase(3), 3500);
  }, [setPalette, setScore, showQuestMeters]);

  return (
    <SlideBase act="turn" className="text-cyan-400">
      {/* Color burst particles on palette shift */}
      {phase >= 1 && (
        <ParticleEmitter
          emoji={["✨", "🌟", "💫", "⭐"]}
          burst={30}
          direction="radial"
          speed={100}
          lifetime={2000}
          active={false}
        />
      )}

      {/* Main content */}
      <div className="text-center space-y-8">
        {/* Loading bar (phase 0) */}
        {phase === 0 && (
          <div className="space-y-4">
            <div className="font-pixel text-2xl text-amber-400">
              RESTORING SAVE FILE...
            </div>
            <div className="w-64 h-4 bg-black/50 border border-amber-500/50 mx-auto">
              <div className="h-full bg-amber-500 animate-pulse" style={{ width: "60%" }} />
            </div>
            <div className="font-pixel text-2xl text-amber-400">
              WISHONIA.SAV
            </div>
          </div>
        )}

        {/* Palette burst reveal (phase 1+) */}
        {phase >= 1 && (
          <div className="space-y-6 animate-fade-scale-in">
            {/* World restored */}
            <div className="text-7xl md:text-9xl animate-bounce-slow">
              🌍
            </div>

            <h1 className="font-pixel text-3xl md:text-6xl text-cyan-400">
              EARTH RESTORED
            </h1>

            <div className="font-pixel text-2xl md:text-4xl text-emerald-400">
              Welcome to Wishonia
            </div>
          </div>
        )}

        {/* Quest meters preview (phase 2+) */}
        {phase >= 2 && (
          <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto animate-slide-up">
            <div className="bg-black/60 border border-emerald-500/30 p-5 text-left">
              <div className="font-pixel text-2xl md:text-3xl text-emerald-400">QUEST: HEALTHY LIFE YEARS</div>
              <div className="font-pixel text-3xl md:text-4xl text-emerald-400">63.3 yrs</div>
              <div className="font-pixel text-xl md:text-2xl text-emerald-400">Target: 69.8 yrs</div>
            </div>
            <div className="bg-black/60 border border-amber-500/30 p-5 text-left">
              <div className="font-pixel text-2xl md:text-3xl text-amber-400">QUEST: INCOME</div>
              <div className="font-pixel text-3xl md:text-4xl text-amber-400">$18.7K</div>
              <div className="font-pixel text-xl md:text-2xl text-amber-400">Target: $149K</div>
            </div>
          </div>
        )}

        {/* CTA (phase 3+) */}
        {phase >= 3 && (
          <div className="animate-fade-in space-y-4">
            <div className="font-terminal text-2xl md:text-3xl text-cyan-400">
              A different timeline is possible.
            </div>
            <button className="font-pixel text-xl md:text-3xl text-black bg-cyan-400 hover:bg-cyan-300 px-8 py-4 border-4 border-cyan-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
              INITIATE EARTH OPTIMIZATION PROTOCOL
            </button>
          </div>
        )}
      </div>

      {/* Radial gradient burst effect */}
      {phase >= 1 && (
        <div 
          className="absolute inset-0 pointer-events-none animate-burst"
          style={{
            background: "radial-gradient(circle at center, rgba(34, 211, 238, 0.3) 0%, transparent 70%)",
          }}
        />
      )}

      <style jsx>{`
        @keyframes fade-scale-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes burst {
          from { opacity: 1; transform: scale(0); }
          to { opacity: 0; transform: scale(2); }
        }
        .animate-fade-scale-in {
          animation: fade-scale-in 0.5s ease-out forwards;
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        .animate-burst {
          animation: burst 1s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-scale-in 0.5s ease-out forwards;
        }
      `}</style>
    </SlideBase>
  );
}
