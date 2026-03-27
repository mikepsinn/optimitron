"use client";

import { useEffect, useState } from "react";
import { SlideBase } from "../slide-base";
import { GlitchText } from "../../animations/glitch-text";

const PERSONS = [
  { label: "PERSON 1", thought: "I want to redirect resources to cures instead of explosions" },
  { label: "PERSON 2", thought: "I want to fund clinical trials not bombs" },
  { label: "PERSON 3", thought: "I want my taxes to cure disease" },
  { label: "PERSON 4", thought: "I want health spending over military spending" },
  { label: "PERSON 5", thought: "I want to invest in cures not wars" },
  { label: "PERSON 6", thought: "I want treatments not weapons" },
  { label: "...", thought: "" },
  { label: "PERSON 8,000,000,000", thought: "I want cures over explosions" },
];

const PHASE_1_DELAY = 500;
const PHASE_2_START = 1000;
const ROW_STAGGER = 400;
const PHASE_3_DELAY = PHASE_2_START + PERSONS.length * ROW_STAGGER + 200;

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

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SlideBase act={2}>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes checkmark-pop {
          0% { opacity: 0; transform: scale(0.5); }
          60% { transform: scale(1.3); }
          100% { opacity: 1; transform: scale(1); }
        }
        .row-enter { animation: fadeIn 0.3s ease-out forwards; }
        .checkmark-pop { animation: checkmark-pop 0.4s ease-out forwards; }
      `}</style>

      <div className="flex flex-col items-center justify-center gap-4 max-w-[1700px] mx-auto w-full">
        {/* Bug report header */}
        {phase >= 1 && (
          <div className="w-full bg-zinc-900 border border-green-500/50 rounded-lg overflow-hidden row-enter">
            <div className="bg-green-500/10 border-b border-green-500/30 px-4 py-2 flex items-center gap-2">
              <span className="text-3xl">🐛</span>
              <span className="font-terminal text-2xl md:text-4xl text-green-400">
                BUG: pluralistic_ignorance
              </span>
            </div>
            <div className="px-4 py-2 flex gap-6">
              <span className="font-terminal text-lg md:text-2xl text-zinc-200">
                FILED: <span className="text-zinc-200">1965</span>
              </span>
              <span className="font-terminal text-lg md:text-2xl text-zinc-200">
                SEVERITY: <span className="text-red-400 animate-pulse">EXTINCTION</span>
              </span>
              <span className="font-terminal text-lg md:text-2xl text-zinc-200">
                ASSIGNEE: <span className="text-zinc-200">nobody</span>
              </span>
            </div>
          </div>
        )}

        {/* Person rows — each thinks they're alone */}
        {phase >= 2 && (
          <div className="w-full space-y-1.5">
            {PERSONS.slice(0, visibleRows).map((person, i) => {
              const isEllipsis = person.label === "...";
              const isRevealed = phase >= 3;
              const isLast = i === PERSONS.length - 1;

              if (isEllipsis) {
                return (
                  <div key={i} className="font-terminal text-xl text-zinc-500 pl-4 row-enter">
                    &nbsp;&nbsp;&nbsp;...
                  </div>
                );
              }

              return (
                <div
                  key={i}
                  className={`flex items-start gap-2 px-3 py-1 rounded row-enter ${
                    isLast ? "border border-green-500/20 bg-green-500/5" : ""
                  }`}
                >
                  <span className="text-xl md:text-2xl shrink-0">👤</span>
                  {isRevealed && (
                    <span className="checkmark-pop text-green-400 text-xl shrink-0 mt-0.5">✓</span>
                  )}
                  <div className="font-terminal text-lg md:text-xl">
                    <span className="text-zinc-200">{person.label}: </span>
                    <span className="text-green-400">&quot;{person.thought}&quot;</span>
                    <br />
                    <span className="text-zinc-500 text-base md:text-lg">
                      {isRevealed ? (
                        <GlitchText
                          text="(thinks: EVERYONE agrees)"
                          intensity="high"
                          active={phase === 3}
                          color="#4ade80"
                        />
                      ) : (
                        "(thinks: nobody else agrees, so this is crazy)"
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SlideBase>
  );
}
