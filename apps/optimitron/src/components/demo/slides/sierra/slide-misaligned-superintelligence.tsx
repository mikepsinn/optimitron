"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { GlitchText } from "../../animations/sierra/glitch-text";
import { ParticleEmitter } from "../../animations/sierra/particle-emitter";
import { useEffect, useState } from "react";

const bootLines = [
  { text: "🖥️ SYSTEM: GOVERNMENT.EXE v1776", delay: 300 },
  { text: "🤖 TYPE: COLLECTIVE SUPERINTELLIGENCE", delay: 800 },
  { text: "💰 CONTROLS: $50 TRILLION / 8 BILLION LIVES", delay: 1300 },
];

const corruptedLines = [
  { text: "→ 💰 CAMPAIGN CONTRIBUTIONS", delay: 7500 },
  { text: "→ 🏦 WEALTH EXTRACTION", delay: 8500 },
];

export function SlideMisalignedSuperintelligence() {
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
    setTimeout(() => setShowObjective(true), 3300);

    // Phase 3: Corruption
    setTimeout(() => {
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
    }, 6300);
    setTimeout(() => setShowCorruption(true), 6700);

    corruptedLines.forEach((line, i) => {
      setTimeout(() => setVisibleCorrupt(i + 1), line.delay);
    });

    // Phase 4: Warning
    setTimeout(() => setShowWarning(true), 10000);
  }, []);

  return (
    <SierraSlideWrapper act={1} className="text-green-500">
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

      <div
        className={`w-full max-w-[1700px] mx-auto p-4 md:p-6 relative transition-transform duration-100 ${
          shaking ? "animate-[screen-shake_0.5s_ease-in-out]" : ""
        }`}
      >

            {/* Boot text */}
            <div className="font-terminal text-2xl md:text-3xl space-y-2">
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
                <div className="font-terminal text-2xl md:text-3xl space-y-1">
                  <div
                    className={`font-pixel text-2xl md:text-3xl mb-2 ${
                      showCorruption ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    BUILT TO PROMOTE GENERAL WELFARE:
                  </div>

                  {/* Original objectives */}
                  <div
                    className={`transition-all duration-500 ${
                      showCorruption
                        ? "line-through decoration-red-500 decoration-2 text-green-400"
                        : "text-green-400"
                    }`}
                  >
                    ❤️ MAXIMISE MEDIAN HEALTHY LIFE YEARS
                  </div>
                  <div
                    className={`transition-all duration-500 ${
                      showCorruption
                        ? "line-through decoration-red-500 decoration-2 text-green-400"
                        : "text-green-400"
                    }`}
                  >
                    💎 MAXIMISE MEDIAN INCOME
                  </div>

                  {/* Status line */}
                  <div className="flex items-center gap-3 mt-3">
                    <span
                      className={`font-pixel text-2xl ${
                        showCorruption ? "text-red-400" : "text-green-400"
                      }`}
                    >
                      STATUS:
                    </span>
                    <span
                      className={`font-pixel text-2xl ${
                        showCorruption ? "text-red-400" : "text-green-400"
                      }`}
                    >
                      {showCorruption ? (
                        <>
                          ⚠️ <GlitchText text="MISALIGNED" intensity="high" />
                        </>
                      ) : (
                        "✅ ACTIVE"
                      )}
                    </span>
                  </div>
                </div>

                {/* Corrupted objectives */}
                {showCorruption && (
                  <div className="mt-4 pt-3 border-t border-red-500/30 font-terminal text-2xl md:text-3xl space-y-1">
                    <div className="font-pixel text-2xl md:text-3xl text-red-400 mb-2">
                      IT ACTUALLY OPTIMISES FOR:
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

            {/* Blinking cursor — only before corruption */}
            {!showCorruption && (
              <div className="mt-4 font-terminal text-green-400">
                <span className="animate-[sierra-blink_1s_step-end_infinite]">
                  _
                </span>
              </div>
            )}
      </div>

      {/* Bottom warning */}
      {showWarning && (
        <div className="absolute bottom-8 left-0 right-0 text-center animate-[fade-in_0.5s_ease-out]">
        </div>
      )}
    </SierraSlideWrapper>
  );
}
export default SlideMisalignedSuperintelligence;
