"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import {
  WAR_TOTAL_COST_SINCE_1900,
  WAR_COUNTERFACTUAL_LOST_GDP_GLOBAL,
  DEMOCIDE_TOTAL_20TH_CENTURY,
  fmtParam,
} from "@optimitron/data/parameters";
import { useEffect, useState } from "react";

const warTotalCost = fmtParam(WAR_TOTAL_COST_SINCE_1900);
const lostGdp = fmtParam(WAR_COUNTERFACTUAL_LOST_GDP_GLOBAL);
const democide = fmtParam(DEMOCIDE_TOTAL_20TH_CENTURY);

const STATIONS = [
  { emoji: "💣", label: "BOMB CITY" },
  { emoji: "🏚️", label: "FACTORIES STOP" },
  { emoji: "🏃", label: "WORKERS FLEE" },
  { emoji: "📕", label: "CHILDREN MISS SCHOOL" },
  { emoji: "❌", label: "NO ENGINEERS" },
  { emoji: "🔄", label: "NO REBUILDING" },
] as const;

export function SlideWarCompoundingLosses() {
  const [phase, setPhase] = useState(0);
  const [revealedStations, setRevealedStations] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: title
    timers.push(setTimeout(() => setPhase(1), 400));

    // Reveal stations one at a time
    STATIONS.forEach((_, i) => {
      timers.push(setTimeout(() => setRevealedStations(i + 1), 1200 + i * 800));
    });

    // Phase 2: center stats after all stations
    timers.push(setTimeout(() => setPhase(2), 1200 + STATIONS.length * 800 + 600));

    // Phase 3: punchline
    timers.push(setTimeout(() => setPhase(3), 1200 + STATIONS.length * 800 + 2000));

    return () => timers.forEach(clearTimeout);
  }, []);

  const ringColor = "#ef4444";
  const r = 70;

  return (
    <SierraSlideWrapper act={1}>
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .station-pop { animation: fade-in 0.5s ease-out forwards; }
        .fade-up { animation: fade-up 0.5s ease-out forwards; }
      `}</style>

      <div className="flex flex-col items-center gap-4 w-full max-w-[1600px] mx-auto">
        {/* Title */}
        {phase >= 1 && (
          <div className="text-center fade-up">
            <h1 className="font-pixel text-2xl md:text-4xl text-red-400">
              🔄 COMPOUND DESTRUCTION
            </h1>
            <p className="font-pixel text-base md:text-xl text-red-400/70 mt-1">
              ONE BOMB. ONE HUNDRED AND TWENTY-FOUR YEARS. STILL COMPOUNDING.
            </p>
          </div>
        )}

        {/* Circular flow */}
        <div className="relative" style={{ width: 460, height: 460 }}>
          {/* SVG ring */}
          <svg
            viewBox="0 0 200 200"
            className="absolute inset-0 w-full h-full"
            fill="none"
          >
            <circle
              cx="100"
              cy="100"
              r={r}
              stroke={ringColor}
              strokeWidth="2"
              opacity={0.3}
            />
            <defs>
              <marker
                id="arrow-destruction"
                markerWidth="6"
                markerHeight="6"
                refX="3"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L6,3 L0,6 Z" fill={ringColor} opacity={0.6} />
              </marker>
            </defs>
            {/* 6 arc segments with arrowheads */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const startAngle = i * 60 - 90 + 10;
              const endAngle = i * 60 - 90 + 50;
              const x1 = 100 + r * Math.cos((startAngle * Math.PI) / 180);
              const y1 = 100 + r * Math.sin((startAngle * Math.PI) / 180);
              const x2 = 100 + r * Math.cos((endAngle * Math.PI) / 180);
              const y2 = 100 + r * Math.sin((endAngle * Math.PI) / 180);
              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                  stroke={ringColor}
                  strokeWidth="2.5"
                  opacity={revealedStations > i ? 0.7 : 0.15}
                  markerEnd="url(#arrow-destruction)"
                  style={{ transition: "opacity 0.5s ease" }}
                />
              );
            })}
            {/* Animated traveling dot — visible once all stations revealed */}
            {revealedStations >= STATIONS.length && (
              <circle r="5" fill={ringColor}>
                <animateMotion
                  dur="4s"
                  repeatCount="indefinite"
                  path={`M 100 ${100 - r} ${[1, 2, 3, 4, 5]
                    .map((i) => {
                      const angle = i * 60 - 90;
                      const x = 100 + r * Math.cos((angle * Math.PI) / 180);
                      const y = 100 + r * Math.sin((angle * Math.PI) / 180);
                      return `A ${r} ${r} 0 0 1 ${x} ${y}`;
                    })
                    .join(" ")} A ${r} ${r} 0 0 1 100 ${100 - r}`}
                />
              </circle>
            )}
          </svg>

          {/* Station labels at 6 positions around the circle */}
          {STATIONS.map((s, i) => {
            const angle = i * 60 - 90;
            const labelR = 105; // px from center in the 200-unit viewBox
            const cx = 50 + (labelR / 200) * 100 * Math.cos((angle * Math.PI) / 180);
            const cy = 50 + (labelR / 200) * 100 * Math.sin((angle * Math.PI) / 180);

            if (revealedStations <= i) return null;

            return (
              <div
                key={s.label}
                className="absolute flex flex-col items-center station-pop"
                style={{
                  left: `${cx}%`,
                  top: `${cy}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <span className="text-2xl md:text-3xl">{s.emoji}</span>
                <span className="font-pixel text-xs md:text-sm text-red-400 whitespace-nowrap px-2 py-1 rounded bg-red-500/10 border border-red-500/40">
                  {s.label}
                </span>
              </div>
            );
          })}

          {/* Center stats */}
          {phase >= 2 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center fade-up bg-black/80 rounded-lg px-4 py-3">
                <div className="font-pixel text-2xl md:text-3xl text-red-400">
                  {warTotalCost}
                </div>
                <div className="font-pixel text-xs md:text-sm text-red-400/70 mt-1">
                  TOTAL LOSSES SINCE 1900
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom stats */}
        {phase >= 3 && (
          <div className="text-center fade-up space-y-2">
            <div className="font-pixel text-lg md:text-2xl text-red-400">
              {democide} MURDERED BY THEIR OWN GOVERNMENTS
            </div>
            <div className="font-pixel text-base md:text-xl text-amber-400">
              {lostGdp}/YEAR IN OUTPUT THAT DOES NOT EXIST
            </div>
            <div className="font-pixel text-base md:text-lg text-zinc-400 mt-2">
              Compound interest on destruction works exactly like compound interest on investment. Except backwards.
            </div>
          </div>
        )}
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideWarCompoundingLosses;
