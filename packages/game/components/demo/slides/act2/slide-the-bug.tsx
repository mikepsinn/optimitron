"use client";

import { useEffect, useState } from "react";
import { SlideBase } from "../slide-base";
import { GlitchText } from "../../animations/glitch-text";

const PERSONS = [
  "PERSON 1",
  "PERSON 2",
  "PERSON 3",
  "PERSON 4",
  "...",
  "PERSON 8,000,000,000",
];

// Phase timing (ms)
const PHASE_1_DELAY = 500;
const PHASE_2_START = 1000;
const ROW_STAGGER = 500;
const PHASE_3_DELAY = PHASE_2_START + PERSONS.length * ROW_STAGGER + 200;
const PHASE_4_DELAY = PHASE_3_DELAY + 1500;

export function SlideTheBug() {
  const [phase, setPhase] = useState(0);
  const [visibleRows, setVisibleRows] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase(1), PHASE_1_DELAY));

    PERSONS.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setPhase((p) => Math.max(p, 2));
          setVisibleRows(i + 1);
        }, PHASE_2_START + i * ROW_STAGGER)
      );
    });

    timers.push(setTimeout(() => setPhase(3), PHASE_3_DELAY));
    timers.push(setTimeout(() => setPhase(4), PHASE_4_DELAY));

    return () => timers.forEach(clearTimeout);
  }, []);

  const statsVisible = phase >= 4;

  return (
    <SlideBase act={2}>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes checkmark-pop {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          60% {
            transform: scale(1.3);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .row-enter {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .checkmark-pop {
          animation: checkmark-pop 0.4s ease-out forwards;
        }
        .stats-panel {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>

      <div className="flex flex-col items-center justify-center gap-5 max-w-[1700px] mx-auto w-full">
        {/* Phase 1: Bug report header */}
        {phase >= 1 && (
          <div className="w-full bg-zinc-900 border border-green-500/50 rounded-lg overflow-hidden row-enter">
            <div className="bg-green-500/10 border-b border-green-500/30 px-4 py-2 flex items-center gap-2">
              <span className="text-3xl">🐛</span>
              <span className="font-terminal text-3xl md:text-5xl text-green-400">
                BUG: pluralistic_ignorance
              </span>
            </div>
            <div className="px-4 py-2 flex gap-6">
              <span className="font-terminal text-xl md:text-3xl text-zinc-200">
                FILED:{" "}
                <span className="text-zinc-200">1965</span>
              </span>
              <span className="font-terminal text-xl md:text-3xl text-zinc-200">
                SEVERITY:{" "}
                <span className="text-red-400 animate-pulse">EXTINCTION</span>
              </span>
              <span className="font-terminal text-xl md:text-3xl text-zinc-200">
                ASSIGNEE:{" "}
                <span className="text-zinc-200">nobody</span>
              </span>
            </div>
          </div>
        )}

        {/* Phase 2: Person rows */}
        {phase >= 2 && (
          <div className="w-full space-y-1">
            {PERSONS.slice(0, visibleRows).map((label, i) => {
              const isEllipsis = label === "...";
              const isRevealed = phase >= 3;
              const isLast = i === PERSONS.length - 1;

              if (isEllipsis) {
                return (
                  <div
                    key={i}
                    className="font-terminal text-xl text-zinc-300 pl-4 row-enter"
                  >
                    &nbsp;&nbsp;&nbsp;...
                  </div>
                );
              }

              return (
                <div
                  key={i}
                  className={`flex items-baseline gap-2 px-3 py-1 rounded row-enter ${
                    isLast ? "border border-green-500/20 bg-green-500/5" : ""
                  }`}
                >
                  <span className="font-terminal text-xl md:text-3xl text-zinc-200 shrink-0 w-6">
                    👤
                  </span>
                  {isRevealed && (
                    <span className="checkmark-pop text-green-400 text-xl shrink-0">
                      ✓
                    </span>
                  )}
                  <span className="font-terminal text-xl md:text-3xl text-zinc-200 shrink-0">
                    {label}:
                  </span>
                  <span className="font-terminal text-xl md:text-3xl text-green-400">
                    &quot;I want this&quot;
                  </span>
                  <span className="font-terminal text-xl md:text-3xl text-zinc-300 ml-1">
                    {isRevealed ? (
                      <GlitchText
                        text="(thinks: EVERYONE)"
                        intensity="high"
                        active={phase === 3}
                        color="#4ade80"
                      />
                    ) : (
                      "(thinks: only me)"
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Phase 4: Stats panel */}
        {statsVisible && (
          <div className="w-full bg-black/40 border border-green-500/30 rounded p-4 stats-panel">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <div className="font-pixel text-xl md:text-3xl text-zinc-200">
                  YEAR DISCOVERED
                </div>
                <div className="font-pixel text-xl md:text-3xl text-foreground">
                  1965
                </div>
              </div>
              <div>
                <div className="font-pixel text-xl md:text-3xl text-zinc-200">
                  YEARS SINCE
                </div>
                <div className="font-pixel text-xl md:text-3xl text-foreground">
                  61
                </div>
              </div>
              <div>
                <div className="font-pixel text-xl md:text-3xl text-zinc-200">STATUS</div>
                <div className="font-pixel text-xl md:text-3xl text-red-400 animate-pulse">
                  still governing you
                </div>
              </div>
              <div>
                <div className="font-pixel text-xl md:text-3xl text-zinc-200">
                  PATCH AVAILABLE
                </div>
                <div className="font-pixel text-xl md:text-3xl text-green-400 animate-pulse">
                  yes
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Punchline */}
        {statsVisible && (
          <p className="font-terminal text-xl md:text-2xl text-zinc-200 text-center italic stats-panel">
            8 billion people waiting for permission to want what they already
            want.
            <br />
            <span className="text-zinc-200">
              The dumbest reason a civilisation has ever continued dying.
            </span>
          </p>
        )}
      </div>
    </SlideBase>
  );
}
