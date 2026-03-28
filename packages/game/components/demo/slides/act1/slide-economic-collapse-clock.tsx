"use client";

import { SlideBase } from "../slide-base";
import { useEffect, useState, useRef } from "react";

/**
 * A civilization health meter that drains in real time.
 * Parasitic economy eats the productive one like a progress bar being consumed.
 * Failed states flash as milestones. Screen progressively deteriorates.
 */

const FAILED_STATES = [
  { name: "SOMALIA", year: 1991, pct: 12 },
  { name: "SOVIET UNION", year: 1991, pct: 15 },
  { name: "LIBYA", year: 2011, pct: 18 },
  { name: "VENEZUELA", year: 2017, pct: 22 },
  { name: "EARTH", year: 2040, pct: 50 },
];

// Key milestones on the timeline
const TIMELINE = [
  { year: 2020, parasiticPct: 11.5, event: "NOW: 11.5% parasitic" },
  { year: 2027, parasiticPct: 15, event: "Soviet collapse ratio" },
  { year: 2033, parasiticPct: 25, event: "Talent flees to crime" },
  { year: 2040, parasiticPct: 50, event: "COLLAPSE THRESHOLD" },
];

export function SlideEconomicCollapseClock() {
  const [phase, setPhase] = useState(0);
  const [parasiticPct, setParasiticPct] = useState(11.5);
  const [glitchIntensity, setGlitchIntensity] = useState(0);
  const [flashState, setFlashState] = useState("");
  const [screenCrack, setScreenCrack] = useState(0);
  const animRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase(1), 500));
    timers.push(setTimeout(() => setPhase(2), 2000));

    // Start the parasitic economy growing
    timers.push(setTimeout(() => {
      setPhase(3);
      animRef.current = setInterval(() => {
        setParasiticPct((prev) => {
          const next = prev + 0.4;
          // Update glitch intensity as it grows
          setGlitchIntensity(Math.min((next - 11.5) / 40, 1));
          // Screen cracks at thresholds
          if (next > 15 && screenCrack < 1) setScreenCrack(1);
          if (next > 25 && screenCrack < 2) setScreenCrack(2);
          if (next > 40 && screenCrack < 3) setScreenCrack(3);
          // Flash failed state names
          for (const fs of FAILED_STATES) {
            if (prev < fs.pct && next >= fs.pct) {
              setFlashState(fs.name);
              setTimeout(() => setFlashState(""), 1500);
            }
          }
          if (next >= 55) {
            clearInterval(animRef.current);
            return 55;
          }
          return next;
        });
      }, 80);
    }, 3000));

    return () => {
      timers.forEach(clearTimeout);
      if (animRef.current) clearInterval(animRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const healthPct = Math.max(0, 100 - parasiticPct);
  const isCollapsed = parasiticPct >= 50;

  return (
    <SlideBase act={1}>
      <style jsx>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.4s ease-out forwards; }

        @keyframes flash-red {
          0%, 100% { background: transparent; }
          10%, 30%, 50% { background: rgba(239, 68, 68, 0.15); }
          20%, 40% { background: transparent; }
        }
        .flash-red { animation: flash-red 0.6s ease-out; }

        @keyframes state-flash {
          0% { opacity: 0; transform: scale(0.5); }
          20% { opacity: 1; transform: scale(1.2); }
          80% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.8); }
        }
        .state-flash { animation: state-flash 1.5s ease-out forwards; }

        @keyframes screen-shake {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-2px, 1px); }
          20% { transform: translate(2px, -1px); }
          30% { transform: translate(-1px, 2px); }
          40% { transform: translate(1px, -2px); }
          50% { transform: translate(-2px, -1px); }
        }

        @keyframes static-noise {
          0% { opacity: 0; }
          5% { opacity: 0.08; }
          10% { opacity: 0; }
          50% { opacity: 0; }
          55% { opacity: 0.05; }
          60% { opacity: 0; }
        }

        @keyframes skull-drift {
          0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.3; }
          100% { transform: translateY(-60px) rotate(15deg); opacity: 0; }
        }

        @keyframes collapse-text {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .collapse-pulse { animation: collapse-text 0.5s ease-in-out infinite; }
      `}</style>

      {/* Fullscreen glitch overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          animation: glitchIntensity > 0.3 ? `screen-shake ${0.5 / glitchIntensity}s linear infinite` : "none",
        }}
      />

      {/* Static noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,${glitchIntensity * 0.03}) 2px, rgba(255,255,255,${glitchIntensity * 0.03}) 4px)`,
          animation: glitchIntensity > 0.2 ? "static-noise 0.3s step-end infinite" : "none",
        }}
      />

      {/* Failed state flash overlay */}
      {flashState && (
        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
          <div className="state-flash font-pixel text-5xl md:text-7xl text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]">
            {flashState}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-4 w-full max-w-[1700px] mx-auto relative z-10">
        {/* Title */}
        {phase >= 1 && (
          <h1 className="font-pixel text-2xl md:text-4xl text-amber-400 text-center fade-up">
            CIVILIZATION HEALTH MONITOR
          </h1>
        )}

        {/* Giant health bar — the centerpiece */}
        {phase >= 2 && (
          <div className="w-full fade-up">
            {/* Labels */}
            <div className="flex justify-between mb-1">
              <span className="font-pixel text-sm text-emerald-400">PRODUCTIVE ECONOMY</span>
              <span className="font-pixel text-sm text-red-400">PARASITIC ECONOMY</span>
            </div>

            {/* The bar itself */}
            <div className="relative h-16 bg-zinc-900 border-2 border-amber-500/50 rounded overflow-hidden">
              {/* Green (productive) — shrinks from left */}
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 to-emerald-500 transition-all duration-200"
                style={{ width: `${healthPct}%` }}
              />
              {/* Red (parasitic) — grows from right */}
              <div
                className="absolute inset-y-0 right-0 bg-gradient-to-l from-red-600 to-red-500 transition-all duration-200"
                style={{ width: `${parasiticPct}%` }}
              />

              {/* Milestone markers */}
              {FAILED_STATES.slice(0, -1).map((fs) => (
                <div
                  key={fs.name}
                  className="absolute top-0 bottom-0 flex flex-col items-center justify-end"
                  style={{ right: `${100 - fs.pct}%` }}
                >
                  <div className="w-px h-full bg-amber-500/30" />
                  <div className="absolute -bottom-6 font-pixel text-xs text-amber-400 whitespace-nowrap">
                    {fs.pct}% {fs.name}
                  </div>
                </div>
              ))}

              {/* Center percentage */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`font-pixel text-2xl md:text-3xl drop-shadow-lg ${
                  isCollapsed ? "text-red-300 collapse-pulse" : "text-white"
                }`}>
                  {parasiticPct.toFixed(1)}% PARASITIC
                </span>
              </div>
            </div>

            {/* Below-bar: skulls drift up as parasitic grows */}
            <div className="relative h-8 mt-1 overflow-hidden">
              {parasiticPct > 15 && Array.from({ length: Math.min(Math.floor((parasiticPct - 15) / 3), 12) }).map((_, i) => (
                <span
                  key={i}
                  className="absolute text-lg"
                  style={{
                    right: `${10 + i * 7}%`,
                    bottom: 0,
                    animation: `skull-drift 2s ease-out ${i * 0.3}s infinite`,
                  }}
                >
                  💀
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timeline events */}
        {phase >= 2 && (
          <div className="w-full grid grid-cols-4 gap-2 fade-up">
            {TIMELINE.map((t) => {
              const isPast = parasiticPct >= t.parasiticPct;
              const isCurrent = Math.abs(parasiticPct - t.parasiticPct) < 3;
              return (
                <div
                  key={t.year}
                  className={`text-center p-2 rounded border transition-all duration-300 ${
                    isPast
                      ? "bg-red-500/20 border-red-500/50"
                      : isCurrent
                        ? "bg-amber-500/20 border-amber-500/50 animate-pulse"
                        : "bg-zinc-900/50 border-zinc-700/30"
                  }`}
                >
                  <div className={`font-pixel text-lg ${isPast ? "text-red-400" : "text-zinc-400"}`}>
                    {t.year}
                  </div>
                  <div className={`font-pixel text-sm ${isPast ? "text-red-300" : "text-zinc-500"}`}>
                    {t.parasiticPct}%
                  </div>
                  <div className={`font-terminal text-xs ${isPast ? "text-red-200" : "text-zinc-500"}`}>
                    {t.event}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Real failed states comparison */}
        {phase >= 3 && parasiticPct > 20 && (
          <div className="font-terminal text-base text-zinc-400 text-center fade-up">
            Soviet Union collapsed at 15%.
            You are approaching their ratio with better technology and no plan.
          </div>
        )}

        {/* COLLAPSE state */}
        {isCollapsed && (
          <div className="text-center fade-up">
            <div className="font-pixel text-4xl md:text-5xl text-red-500 collapse-pulse">
              SYSTEM FAILURE
            </div>
            <div className="font-terminal text-lg text-red-300 mt-1">
              Production becomes irrational. Parasitism becomes the only means of survival.
            </div>
          </div>
        )}
      </div>
    </SlideBase>
  );
}
