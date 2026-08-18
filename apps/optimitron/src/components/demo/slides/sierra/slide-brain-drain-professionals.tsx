"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { AnimatedCounter } from "../../animations/sierra/animated-counter";
import { GlitchText } from "../../animations/sierra/glitch-text";
import { ParticleEmitter } from "../../animations/sierra/particle-emitter";
import { WAR_DEATHS_SINCE_1900 } from "@optimitron/data/parameters";
import { useEffect, useState } from "react";

const TOTAL_DEAD = WAR_DEATHS_SINCE_1900.value; // 310M

const PROFESSIONS = [
  { emoji: "🔬", label: "SCIENTISTS & RESEARCHERS", share: 0.001, role: "Discovered things" },
  { emoji: "🩺", label: "PHYSICIANS", share: 0.003, role: "Kept people alive" },
  { emoji: "⚙️", label: "ENGINEERS", share: 0.002, role: "Built things that work" },
  { emoji: "👩‍⚕️", label: "NURSES & MIDWIVES", share: 0.004, role: "Delivered care (and babies)" },
  { emoji: "📚", label: "TEACHERS & PROFESSORS", share: 0.01, role: "Trained all of the above" },
  { emoji: "🔧", label: "SKILLED TRADESPEOPLE", share: 0.03, role: "Rebuilt what bombs destroyed" },
] as const;

const TOTAL_PROFESSIONAL_KILLED = Math.round(
  PROFESSIONS.reduce((sum, p) => sum + TOTAL_DEAD * p.share, 0),
);

export function SlideBrainDrainProfessionals() {
  const [phase, setPhase] = useState(0);
  const [visibleRows, setVisibleRows] = useState(0);
  const [showTotal, setShowTotal] = useState(false);
  const [showPunchline, setShowPunchline] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: title
    timers.push(setTimeout(() => setPhase(1), 400));

    // Reveal rows one at a time
    PROFESSIONS.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleRows(i + 1), 1200 + i * 900));
    });

    // Total row
    const totalDelay = 1200 + PROFESSIONS.length * 900 + 600;
    timers.push(setTimeout(() => setShowTotal(true), totalDelay));

    // Punchline
    timers.push(setTimeout(() => setShowPunchline(true), totalDelay + 1500));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SierraSlideWrapper act={1} className="text-red-500">
      <ParticleEmitter
        emoji={["🔬", "🩺", "⚙️", "📚", "🔧"]}
        rate={1.5}
        direction="up"
        speed={12}
        lifetime={5000}
        fadeOut
        className="opacity-10"
      />

      <div className="w-full max-w-[1700px] mx-auto space-y-4">
        {/* Title */}
        {phase >= 1 && (
          <div className="text-center">
            <GlitchText
              text="THE BRAIN DRAIN"
              className="font-pixel text-3xl md:text-4xl text-red-500"
              intensity="medium"
            />
            <div className="font-terminal text-lg text-zinc-400 mt-1">
              310 million dead. Here is what was inside the number.
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-black/40 border border-red-500/30 rounded overflow-hidden">
          {/* Header */}
          <div className="hidden items-center gap-3 border-b border-zinc-700 bg-zinc-900/60 px-4 py-2 md:flex">
            <div className="w-8 shrink-0" />
            <div className="w-56 shrink-0">
              <span className="font-pixel text-sm text-zinc-500">PROFESSION</span>
            </div>
            <div className="w-20 shrink-0 text-right">
              <span className="font-pixel text-sm text-zinc-500">SHARE</span>
            </div>
            <div className="w-36 shrink-0 text-right">
              <span className="font-pixel text-sm text-zinc-500">KILLED</span>
            </div>
            <div className="flex-1">
              <span className="font-pixel text-sm text-zinc-500">WHAT THEY WOULD HAVE DONE</span>
            </div>
          </div>

          {/* Rows */}
          {PROFESSIONS.map((p, i) => {
            const killed = Math.round(TOTAL_DEAD * p.share);
            return (
              <div
                key={p.label}
                className={`grid grid-cols-[2rem,minmax(0,1fr)] gap-3 border-b border-zinc-800/50 px-4 py-3 transition-all duration-500 md:flex md:items-center md:py-2 ${
                  i < visibleRows
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-8"
                }`}
              >
                <div className="w-8 shrink-0 text-xl text-center">{p.emoji}</div>
                <div className="min-w-0 md:w-56 md:shrink-0">
                  <span className="block max-w-full break-words font-pixel text-sm leading-tight text-zinc-200 md:text-base">
                    {p.label}
                  </span>
                  <div className="mt-2 grid grid-cols-2 gap-3 md:hidden">
                    <div>
                      <div className="font-pixel text-[10px] text-zinc-500">SHARE</div>
                      <div className="font-pixel text-sm text-zinc-400">
                        ~{(p.share * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="font-pixel text-[10px] text-zinc-500">KILLED</div>
                      <div className="font-pixel text-base text-red-400">
                        {i < visibleRows ? (
                          <AnimatedCounter
                            end={killed}
                            duration={1200}
                            format="number"
                          />
                        ) : (
                          "0"
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 md:hidden">
                    <span className="font-pixel text-xs italic text-zinc-500">
                      {p.role}
                    </span>
                  </div>
                </div>
                <div className="hidden w-20 shrink-0 text-right md:block">
                  <span className="font-pixel text-base text-zinc-400">
                    ~{(p.share * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="hidden w-36 shrink-0 text-right md:block">
                  <span className="font-pixel text-lg text-red-400">
                    {i < visibleRows ? (
                      <AnimatedCounter
                        end={killed}
                        duration={1200}
                        format="number"
                      />
                    ) : (
                      "0"
                    )}
                  </span>
                </div>
                <div className="hidden flex-1 md:block">
                  <span className="font-pixel text-sm text-zinc-500 italic">
                    {p.role}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Total row */}
          <div
            className={`grid grid-cols-[2rem,minmax(0,1fr)] gap-3 border-t border-red-500/40 bg-red-500/10 px-4 py-3 transition-all duration-700 md:flex md:items-center ${
              showTotal
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="w-8 shrink-0 text-xl text-center">💀</div>
            <div className="min-w-0 md:w-56 md:shrink-0">
              <span className="block max-w-full break-words font-pixel text-sm leading-tight text-red-400 md:text-base">
                TOTAL PROFESSIONAL CLASS
              </span>
              <div className="mt-2 grid grid-cols-2 gap-3 md:hidden">
                <div>
                  <div className="font-pixel text-[10px] text-red-300">SHARE</div>
                  <div className="font-pixel text-sm text-red-400">~5%</div>
                </div>
                <div>
                  <div className="font-pixel text-[10px] text-red-300">KILLED</div>
                  <div className="font-pixel text-lg text-red-500">
                    {showTotal ? (
                      <AnimatedCounter
                        end={TOTAL_PROFESSIONAL_KILLED}
                        duration={1800}
                        format="number"
                      />
                    ) : (
                      "0"
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-2 md:hidden">
                <span className="font-pixel text-xs italic text-red-400">
                  Made civilization function
                </span>
              </div>
            </div>
            <div className="hidden w-20 shrink-0 text-right md:block">
              <span className="font-pixel text-base text-red-400">~5%</span>
            </div>
            <div className="hidden w-36 shrink-0 text-right md:block">
              <span className="font-pixel text-xl text-red-500">
                {showTotal ? (
                  <AnimatedCounter
                    end={TOTAL_PROFESSIONAL_KILLED}
                    duration={1800}
                    format="number"
                  />
                ) : (
                  "0"
                )}
              </span>
            </div>
            <div className="hidden flex-1 md:block">
              <span className="font-pixel text-sm text-red-400 italic">
                Made civilization function
              </span>
            </div>
          </div>
        </div>

        {/* Punchline */}
        <div
          className={`text-center space-y-2 transition-all duration-700 ${
            showPunchline ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="font-pixel text-lg md:text-xl text-amber-400">
            ALEXANDER FLEMING SURVIVED WWI. ONE SCIENTIST. ONE ACCIDENT.
          </div>
          <div className="font-pixel text-lg md:text-xl text-background">
            PENICILLIN. ONE BILLION LIVES SAVED.
          </div>
          <div className="font-pixel text-lg md:text-xl text-red-500 animate-pulse mt-2">
            YOU KILLED 310,000 OTHERS WHO NEVER GOT THE CHANCE.
          </div>
        </div>
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideBrainDrainProfessionals;
