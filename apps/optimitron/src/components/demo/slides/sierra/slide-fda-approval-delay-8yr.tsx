"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { AnimatedCounter } from "../../animations/sierra/animated-counter";
import { useEffect, useState } from "react";

const CHECKLIST = [
  { label: "Discovered", checked: true },
  { label: "Tested", checked: true },
  { label: "Proven safe", checked: true },
  { label: "Proven effective", checked: true },
  { label: "Approved (estimated: 2034)", checked: false },
];

export function SlideFdaApprovalDelay8yr() {
  const [phase, setPhase] = useState(0);
  const [visibleItems, setVisibleItems] = useState(0);

  useEffect(() => {
    // Phase 1 (0.5s): Title / waiting room header
    setTimeout(() => setPhase(1), 500);
    // Phase 2 (1.5s): Checklist items begin appearing
    setTimeout(() => setPhase(2), 1500);
    // Phase 3 (4s): Death counter
    setTimeout(() => setPhase(3), 4000);
    // Phase 4 (6s): Punchline ratio
    setTimeout(() => setPhase(4), 6000);
    // Phase 5 (7.5s): Lifeguard quote
    setTimeout(() => setPhase(5), 7500);
  }, []);

  useEffect(() => {
    if (phase < 2) return;
    // Stagger checklist items 300ms apart
    CHECKLIST.forEach((_, i) => {
      setTimeout(() => setVisibleItems(i + 1), i * 300);
    });
  }, [phase]);

  return (
    <SierraSlideWrapper act={2}>
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-red {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        .pulse-red {
          animation: pulse-red 1.2s ease-in-out infinite;
        }
      `}</style>

      <div className="w-full max-w-[1700px] mx-auto flex flex-col items-center justify-center gap-5">

        {/* Phase 1 — Waiting room header */}
        <div
          className={`w-full text-center transition-opacity duration-700 ${
            phase >= 1 ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="font-pixel text-2xl md:text-4xl text-red-400">
            🏥 FDA WAITING ROOM
          </div>
          <div className="font-pixel text-xl md:text-2xl text-red-500 mt-1 tracking-widest">
            TICKET #4,847 — ESTIMATED WAIT: 8.2 YEARS
          </div>
          <div className="text-xl mt-2 tracking-widest">
            🪑🪑🪑🪑🪑🪑🪑🪑🪑
          </div>
        </div>

        {/* Phase 2 — Checklist */}
        {phase >= 2 && (
          <div className="w-full space-y-2">
            {CHECKLIST.map((item, i) => (
              <div
                key={item.label}
                className={`bg-black/40 border border-zinc-700 p-3 rounded flex items-center gap-3 ${
                  i < visibleItems ? "fade-in" : "opacity-0"
                } ${
                  !item.checked && i < visibleItems ? "border-red-500/50 bg-red-500/5" : ""
                }`}
              >
                <span
                  className={`font-pixel text-xl ${
                    item.checked ? "text-emerald-400" : "pulse-red text-red-500"
                  }`}
                >
                  {item.checked ? "✅" : "⬜"}
                </span>
                <span
                  className={`font-pixel text-xl md:text-2xl ${
                    item.checked ? "text-zinc-300" : "pulse-red text-red-400"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Phase 3 — Death counter */}
        <div
          className={`w-full text-center transition-opacity duration-700 ${
            phase >= 3 ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="font-terminal text-xl md:text-2xl text-zinc-200 uppercase tracking-widest mb-1">
            Patients who died waiting:
          </div>
          <div className="relative inline-block">
            <AnimatedCounter
              end={102_000_000}
              duration={2500}
              format="number"
              easing="easeOut"
              className="font-pixel text-3xl md:text-5xl text-red-500"
            />
            <div className="absolute inset-0 blur-3xl bg-red-500/20 -z-10" />
          </div>
        </div>

        {/* Phase 4 — Punchline ratio */}
        <div
          className={`w-full transition-opacity duration-700 ${
            phase >= 4 ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="bg-red-500/10 border border-red-500/30 rounded p-4 space-y-3">
            <div className="flex justify-between items-baseline gap-4">
              <span className="font-pixel text-xl text-zinc-200">
                People saved from bad drugs:
              </span>
              <span className="font-pixel text-xl text-zinc-200 shrink-0">
                1
              </span>
            </div>
            <div className="flex justify-between items-baseline gap-4">
              <span className="font-pixel text-xl text-zinc-200">
                People killed waiting for safe ones:
              </span>
              <span className="font-pixel text-3xl md:text-5xl text-red-500 shrink-0">
                3,070
              </span>
            </div>
          </div>
        </div>

        {/* Phase 5 — Lifeguard quote */}
        <div
          className={`w-full text-center transition-opacity duration-700 ${
            phase >= 5 ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="font-terminal text-xl md:text-2xl text-zinc-200 italic">
            &ldquo;A lifeguard who confirms the life preserver floats, then
            locks it in a cabinet for years.&rdquo;
          </p>
        </div>

      </div>
    </SierraSlideWrapper>
  );
}
export default SlideFdaApprovalDelay8yr;
