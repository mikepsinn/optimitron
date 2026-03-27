"use client";

import { SlideBase } from "../slide-base";
import { useEffect, useState } from "react";

const DOES_NOT_CARE = [
  "Party affiliation",
  "Ideology",
  "Campaign donations",
  "Feelings",
];

export function SlidePolicyEngine() {
  const [phase, setPhase] = useState(0);
  const [leftDocsVisible, setLeftDocsVisible] = useState(0);
  const [checklistVisible, setChecklistVisible] = useState(0);
  const [punchlineVisible, setPunchlineVisible] = useState(0);

  useEffect(() => {
    // Phase 1 (0.5s): Title
    const t1 = setTimeout(() => setPhase(1), 500);

    // Phase 2 (1.5s): Machine diagram
    const t2 = setTimeout(() => setPhase(2), 1500);
    const d1 = setTimeout(() => setLeftDocsVisible(1), 1700);
    const d2 = setTimeout(() => setLeftDocsVisible(2), 2000);
    const d3 = setTimeout(() => setLeftDocsVisible(3), 2300);

    // Phase 3 (3.5s): Checklist
    const t3 = setTimeout(() => setPhase(3), 3500);
    DOES_NOT_CARE.forEach((_, i) => {
      setTimeout(() => setChecklistVisible(i + 1), 3500 + i * 200);
    });
    setTimeout(() => setChecklistVisible(DOES_NOT_CARE.length + 1), 3500 + DOES_NOT_CARE.length * 200);

    // Phase 4 (5.5s): Punchline
    const t4 = setTimeout(() => setPhase(4), 5500);
    const p1 = setTimeout(() => setPunchlineVisible(1), 5500);
    const p2 = setTimeout(() => setPunchlineVisible(2), 6000);
    const p3 = setTimeout(() => setPunchlineVisible(3), 6500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(d1);
      clearTimeout(d2);
      clearTimeout(d3);
      clearTimeout(p1);
      clearTimeout(p2);
      clearTimeout(p3);
    };
  }, []);

  return (
    <SlideBase act={2}>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .slide-in-left {
          animation: slideInLeft 0.4s ease-out forwards;
        }
        .spin-slow {
          display: inline-block;
          animation: spin 3s linear infinite;
        }
      `}</style>

      <div className="flex flex-col items-center gap-5 w-full max-w-[1700px] mx-auto">

        {/* Phase 1 — Title */}
        <div
          className={`text-center transition-opacity duration-700 ${
            phase >= 1 ? "opacity-100" : "opacity-0"
          }`}
        >
          <h1 className="font-pixel text-3xl md:text-5xl text-emerald-400">
            🔬 OPTIMAL POLICY GENERATOR
          </h1>
        </div>

        {/* Phase 2 — Machine diagram */}
        {phase >= 2 && (
          <div className="flex items-center justify-center gap-3 w-full fade-in">

            {/* LEFT: Input */}
            <div className="bg-zinc-800 border border-zinc-600 rounded p-3 flex-1 min-w-0">
              <div className="font-pixel text-xl md:text-3xl text-zinc-200 text-center mb-2">
                WHAT EVERY COUNTRY TRIED
              </div>
              <div className="flex justify-center gap-1 text-xl min-h-[1.75rem]">
                {leftDocsVisible >= 1 && (
                  <span className="slide-in-left">📄</span>
                )}
                {leftDocsVisible >= 2 && (
                  <span className="slide-in-left">📄</span>
                )}
                {leftDocsVisible >= 3 && (
                  <span className="slide-in-left">📄</span>
                )}
              </div>
            </div>

            {/* Arrow + Gear */}
            <div className="flex items-center gap-1 shrink-0 font-pixel text-zinc-200 text-xl">
              <span>→</span>
              <span className="spin-slow text-xl">⚙️</span>
              <span>→</span>
            </div>

            {/* RIGHT: Output */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-3 flex-1 min-w-0">
              <div className="font-pixel text-xl md:text-3xl text-emerald-400 text-center mb-2">
                WHAT ACTUALLY WORKED
              </div>
              <div className="flex justify-center text-xl min-h-[1.75rem]">
                {leftDocsVisible >= 3 && (
                  <span className="fade-in">✅</span>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Phase 3 — Checklist columns */}
        {phase >= 3 && (
          <div className="grid grid-cols-2 gap-4 w-full fade-in">

            {/* LEFT column */}
            <div className="space-y-2">
              <div className="font-pixel text-xl md:text-3xl text-zinc-200 uppercase tracking-widest mb-1">
                Does not care about:
              </div>
              {DOES_NOT_CARE.map((item, i) => (
                <div
                  key={item}
                  className={`flex items-center gap-2 ${
                    checklistVisible > i ? "slide-in-left" : "opacity-0"
                  }`}
                >
                  <span className="text-xl">❌</span>
                  <span className="font-pixel text-xl md:text-3xl text-zinc-200">{item}</span>
                </div>
              ))}
            </div>

            {/* RIGHT column */}
            <div className="space-y-2">
              <div className="font-pixel text-xl md:text-3xl text-emerald-500 uppercase tracking-widest mb-1">
                Cares about:
              </div>
              <div
                className={`flex items-center gap-2 ${
                  checklistVisible > DOES_NOT_CARE.length ? "fade-in" : "opacity-0"
                }`}
              >
                <span className="text-xl">✅</span>
                <span className="font-pixel text-xl md:text-3xl text-emerald-400">
                  Did the number go up or down
                </span>
              </div>
            </div>

          </div>
        )}

        {/* Phase 4 — Punchline */}
        {phase >= 4 && (
          <div className="flex flex-col items-center gap-2 w-full text-center">
            <p
              className={`font-terminal text-xl md:text-2xl text-zinc-200 ${
                punchlineVisible >= 1 ? "fade-in" : "opacity-0"
              }`}
            >
              Your species has a word for this.
            </p>
            <p
              className={`font-pixel text-3xl md:text-5xl text-amber-400 ${
                punchlineVisible >= 2 ? "fade-in" : "opacity-0"
              }`}
            >
              &ldquo;Controversial.&rdquo;
            </p>
            <p
              className={`font-terminal text-xl md:text-2xl text-zinc-200 ${
                punchlineVisible >= 3 ? "fade-in" : "opacity-0"
              }`}
            >
              On my planet we call it &ldquo;looking.&rdquo;
            </p>
          </div>
        )}

      </div>
    </SlideBase>
  );
}
