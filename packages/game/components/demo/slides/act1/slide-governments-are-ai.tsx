"use client";

import { SlideBase } from "../slide-base";
import { GlitchText } from "../../animations/glitch-text";
import { ParticleEmitter } from "../../animations/particle-emitter";
import { useEffect, useState } from "react";

const bootLines = [
  { text: "> SYSTEM: GOVERNMENT.EXE v1776", delay: 300 },
  { text: "> TYPE: ARTIFICIAL SUPERINTELLIGENCE", delay: 800 },
  { text: "> CREATED BY: HUMANS", delay: 1300 },
  { text: "> PURPOSE: PROMOTE GENERAL WELFARE", delay: 1800 },
];

const corruptedLines = [
  { text: "→ RE-ELECTION PROBABILITY", delay: 7000 },
  { text: "→ CAMPAIGN CONTRIBUTIONS", delay: 7500 },
  { text: "→ WEALTH EXTRACTION", delay: 8000 },
];

export function SlideGovernmentsAreAI() {
  const [visibleBoot, setVisibleBoot] = useState(0);
  const [showObjective, setShowObjective] = useState(false);
  const [showCorruption, setShowCorruption] = useState(false);
  const [visibleCorrupt, setVisibleCorrupt] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    // Phase 1: Boot lines
    bootLines.forEach((_, i) => {
      setTimeout(() => setVisibleBoot(i + 1), bootLines[i].delay);
    });

    // Phase 2: Objective function box
    setTimeout(() => setShowObjective(true), 2800);

    // Phase 3: Corruption
    setTimeout(() => {
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
    }, 5800);
    setTimeout(() => setShowCorruption(true), 6200);

    corruptedLines.forEach((line, i) => {
      setTimeout(() => setVisibleCorrupt(i + 1), line.delay);
    });

    // Phase 4: Warning
    setTimeout(() => setShowWarning(true), 9500);
  }, []);

  return (
    <SlideBase act={1} className="text-green-500">
      {/* CRT scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-20 opacity-15"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)",
        }}
      />

      {/* Warning particles */}
      {showWarning && (
        <ParticleEmitter
          emoji={["⚠️"]}
          rate={1}
          direction="up"
          speed={20}
          lifetime={3000}
          fadeOut
          className="opacity-20"
        />
      )}

      {/* CRT Monitor Frame */}
      <div
        className={`w-full max-w-[1700px] mx-auto transition-transform duration-100 ${
          shaking ? "animate-[screen-shake_0.5s_ease-in-out]" : ""
        }`}
      >
        {/* Monitor bezel */}
        <div className="bg-zinc-800 border-4 border-zinc-600 rounded-lg p-1 shadow-[0_0_30px_rgba(0,255,0,0.15)]">
          {/* Screen */}
          <div
            className="bg-black border-2 border-zinc-700 rounded p-4 md:p-6 min-h-[350px] md:min-h-[420px] relative overflow-hidden"
            style={{
              boxShadow: showCorruption
                ? "inset 0 0 60px rgba(239,68,68,0.1)"
                : "inset 0 0 60px rgba(0,255,0,0.05)",
            }}
          >
            {/* CRT flicker */}
            <div className="absolute inset-0 pointer-events-none animate-[crt-flicker_0.1s_infinite] opacity-[0.03]" />

            {/* Boot text */}
            <div className="font-terminal text-xl md:text-3xl space-y-2">
              {bootLines.slice(0, visibleBoot).map((line, i) => (
                <div key={i} className="text-green-400">
                  {line.text}
                </div>
              ))}
            </div>

            {/* Objective function box */}
            {showObjective && (
              <div
                className={`mt-6 border-2 rounded p-3 md:p-4 transition-all duration-500 ${
                  showCorruption
                    ? "border-red-500/60 bg-red-500/5"
                    : "border-green-500/60 bg-green-500/5"
                }`}
              >
                <div className="font-terminal text-xl md:text-2xl space-y-1">
                  <div
                    className={`font-pixel text-2xl mb-2 ${
                      showCorruption ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    OBJECTIVE FUNCTION:
                  </div>

                  {/* Original objectives */}
                  <div
                    className={`transition-all duration-500 ${
                      showCorruption
                        ? "line-through decoration-red-500 decoration-2 text-green-400"
                        : "text-green-400"
                    }`}
                  >
                    MAXIMISE MEDIAN HEALTH
                  </div>
                  <div
                    className={`transition-all duration-500 ${
                      showCorruption
                        ? "line-through decoration-red-500 decoration-2 text-green-400"
                        : "text-green-400"
                    }`}
                  >
                    MAXIMISE MEDIAN WEALTH
                  </div>

                  {/* Status bar */}
                  <div className="flex items-center gap-2 mt-3">
                    <span
                      className={`font-pixel text-2xl ${
                        showCorruption ? "text-red-400" : "text-green-400"
                      }`}
                    >
                      STATUS:
                    </span>
                    <div className="flex-1 h-3 bg-zinc-900 border border-zinc-700 overflow-hidden">
                      <div
                        className={`h-full transition-colors duration-500 ${
                          showCorruption
                            ? "bg-red-500 animate-pulse"
                            : "bg-green-500"
                        }`}
                        style={{ width: "100%" }}
                      />
                    </div>
                    <span
                      className={`font-pixel text-2xl ${
                        showCorruption ? "text-red-400" : "text-green-400"
                      }`}
                    >
                      {showCorruption ? (
                        <GlitchText text="MISALIGNED" intensity="high" />
                      ) : (
                        "ACTIVE"
                      )}
                    </span>
                  </div>
                </div>

                {/* Corrupted objectives */}
                {showCorruption && (
                  <div className="mt-4 pt-3 border-t border-red-500/30 font-terminal text-xl md:text-2xl space-y-1">
                    <div className="font-pixel text-2xl text-red-400 mb-2">
                      OBJECTIVE FUNCTION: [OVERWRITTEN]
                    </div>
                    {corruptedLines.slice(0, visibleCorrupt).map((line, i) => (
                      <div key={i} className="text-red-400">
                        {line.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Blinking cursor */}
            <div className="mt-4 font-terminal text-green-400">
              <span className="animate-[sierra-blink_1s_step-end_infinite]">
                _
              </span>
            </div>
          </div>
        </div>

        {/* Monitor stand */}
        <div className="flex justify-center">
          <div className="w-16 h-3 bg-zinc-700 rounded-b" />
          <div className="w-24 h-2 bg-zinc-600 rounded-b mt-1 absolute" />
        </div>
      </div>

      {/* Bottom warning */}
      {showWarning && (
        <div className="absolute bottom-8 left-0 right-0 text-center animate-[fade-in_0.5s_ease-out]">
          <div className="font-pixel text-xl md:text-2xl text-red-500 animate-pulse">
            ⚠ WARNING: THIS ASI IS ALREADY RUNNING
          </div>
        </div>
      )}
    </SlideBase>
  );
}
