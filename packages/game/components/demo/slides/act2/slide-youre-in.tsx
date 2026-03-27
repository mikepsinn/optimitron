"use client";

import { SlideBase } from "../slide-base";
import { ParticleEmitter } from "../../animations/particle-emitter";
import { useEffect, useState } from "react";

const DOUBLING_NUMBERS: (string | number)[] = [2, 4, 8, 16, 32, 64, 128, "...", "4,000,000,000"];

function numberFontSize(index: number): string {
  // Progressively larger as the chain grows
  const sizes = [
    "text-xs",
    "text-xs",
    "text-xs",
    "text-sm",
    "text-sm",
    "text-base",
    "text-base",
    "text-base",
    "text-lg md:text-xl",
  ];
  return sizes[index] ?? "text-xs";
}

export function SlideYoureIn() {
  const [phase, setPhase] = useState(0);
  const [visibleNumbers, setVisibleNumbers] = useState(0);
  const [punchlineLines, setPunchlineLines] = useState(0);

  useEffect(() => {
    // Phase 1: confetti burst + banner
    const t1 = setTimeout(() => setPhase(1), 300);

    // Phase 2: doubling chain starts appearing
    const t2 = setTimeout(() => setPhase(2), 2000);

    // Phase 3: punchline text
    const t3 = setTimeout(() => setPhase(3), 5000);

    // Phase 4: action buttons
    const t4 = setTimeout(() => setPhase(4), 6500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  // Stagger the doubling numbers in at 300ms each once phase 2 starts
  useEffect(() => {
    if (phase < 2) return;

    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setVisibleNumbers(count);
      if (count >= DOUBLING_NUMBERS.length) {
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [phase]);

  // Stagger punchline lines at 500ms each once phase 3 starts
  useEffect(() => {
    if (phase < 3) return;

    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setPunchlineLines(count);
      if (count >= 3) {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [phase]);

  return (
    <SlideBase act={2}>
      {/* Confetti burst — fires immediately on phase 1 */}
      {phase >= 1 && (
        <ParticleEmitter
          emoji={["🎉", "🎊", "✨", "⭐"]}
          burst={25}
          direction="radial"
          speed={80}
          lifetime={2000}
          active={false}
        />
      )}

      <div className="flex flex-col items-center gap-6 w-full max-w-[1700px] mx-auto">
        {/* Phase 1: Banner */}
        {phase >= 1 && (
          <div className="text-center slide-fade-in">
            <div className="relative inline-block">
              <div className="vote-glow absolute inset-0 blur-lg opacity-40 rounded" />
              <h1 className="relative font-pixel text-2xl md:text-4xl text-emerald-400">
                🎉 VOTE RECORDED
              </h1>
            </div>
            <p className="font-pixel text-xs md:text-sm text-zinc-400 mt-3">
              Player #4,847 of 4,000,000,000 needed
            </p>
          </div>
        )}

        {/* Phase 2: Doubling chain */}
        {phase >= 2 && (
          <div className="w-full bg-black/40 border border-emerald-500/30 rounded p-4 slide-fade-in">
            <div className="flex flex-wrap items-center justify-center gap-1">
              {DOUBLING_NUMBERS.map((num, i) => {
                if (i >= visibleNumbers) return null;
                const isLast = i === DOUBLING_NUMBERS.length - 1;
                return (
                  <span key={i} className="flex items-center gap-1">
                    <span
                      className={`font-pixel number-pop ${numberFontSize(i)} ${
                        isLast ? "text-emerald-400" : "text-zinc-300"
                      }`}
                    >
                      {num}
                    </span>
                    {i < DOUBLING_NUMBERS.length - 1 && (
                      <span className="font-pixel text-xs text-zinc-600">→</span>
                    )}
                  </span>
                );
              })}
            </div>
            {visibleNumbers >= DOUBLING_NUMBERS.length && (
              <p className="font-pixel text-xs text-emerald-300/60 text-center mt-3 slide-fade-in">
                DOUBLINGS: 33
              </p>
            )}
          </div>
        )}

        {/* Phase 3: Punchline lines */}
        {phase >= 3 && (
          <div className="space-y-2 text-center">
            {punchlineLines >= 1 && (
              <p className="font-terminal text-sm md:text-base text-zinc-400 slide-fade-in">
                Your species invented this.
              </p>
            )}
            {punchlineLines >= 2 && (
              <p className="font-terminal text-sm md:text-base text-zinc-400 slide-fade-in">
                You call it &ldquo;going viral.&rdquo;
              </p>
            )}
            {punchlineLines >= 3 && (
              <p className="font-terminal text-base md:text-lg text-amber-400 slide-fade-in">
                We call it &ldquo;counting.&rdquo;
              </p>
            )}
          </div>
        )}

        {/* Phase 4: Decorative action buttons */}
        {phase >= 4 && (
          <div className="flex gap-4 slide-fade-in">
            <button className="border border-emerald-500/50 px-4 py-2 rounded font-pixel text-xs text-emerald-400 cursor-default">
              📋 COPY LINK
            </button>
            <button className="border border-emerald-500/50 px-4 py-2 rounded font-pixel text-xs text-emerald-400 cursor-default">
              📱 SHARE
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-fade-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .slide-fade-in {
          animation: slide-fade-in 0.4s ease-out forwards;
        }

        @keyframes number-pop {
          0% {
            opacity: 0;
            transform: scale(0.6);
          }
          60% {
            transform: scale(1.15);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .number-pop {
          animation: number-pop 0.25s ease-out forwards;
        }

        .vote-glow {
          background: #34d399;
        }
      `}</style>
    </SlideBase>
  );
}
