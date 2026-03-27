"use client";

import { SlideBase } from "../slide-base";
import { DISEASE_BURDEN_GDP_DRAG_PCT } from "@/lib/demo/parameters";
import { useEffect, useState } from "react";

// The slide's punchline: every disease cured makes the economy bigger.
// A bigger economy funds more cures. Your species has been running the vicious version.

const VIRTUOUS_STATIONS = [
  { emoji: "🧪", label: "CURE DISEASE", color: "emerald" },
  { emoji: "📈", label: "UNLOCK GDP",   color: "amber"   },
  { emoji: "👷", label: "MORE WORKERS", color: "cyan"    },
  { emoji: "💰", label: "BIGGER BUDGET", color: "green"  },
] as const;

const VICIOUS_STATIONS = [
  { emoji: "💣", label: "FUND MILITARY" },
  { emoji: "☠️",  label: "KILL PEOPLE"  },
  { emoji: "📉", label: "LESS GDP"      },
  { emoji: "😱", label: "PANIC"         },
] as const;

// Clockwise arrows for the 2×2 grid: right → down → left → up
const ARROWS = ["→", "↓", "←", "↑"] as const;

type ColorName = (typeof VIRTUOUS_STATIONS)[number]["color"];

const STATION_COLORS: Record<ColorName, { border: string; text: string; bg: string; glow: string }> = {
  emerald: {
    border: "border-emerald-400",
    text:   "text-emerald-400",
    bg:     "bg-emerald-400/10",
    glow:   "shadow-[0_0_12px_2px_rgba(52,211,153,0.45)]",
  },
  amber: {
    border: "border-amber-400",
    text:   "text-amber-400",
    bg:     "bg-amber-400/10",
    glow:   "shadow-[0_0_12px_2px_rgba(251,191,36,0.45)]",
  },
  cyan: {
    border: "border-cyan-400",
    text:   "text-cyan-400",
    bg:     "bg-cyan-400/10",
    glow:   "shadow-[0_0_12px_2px_rgba(34,211,238,0.45)]",
  },
  green: {
    border: "border-green-400",
    text:   "text-green-400",
    bg:     "bg-green-400/10",
    glow:   "shadow-[0_0_12px_2px_rgba(74,222,128,0.45)]",
  },
};

// GDP dragged by disease — parameter is a fraction (0.13), convert to whole-number %
const gdpDragPct = Math.round(DISEASE_BURDEN_GDP_DRAG_PCT.value * 100);

export function SlideVirtuousLoop() {
  const [phase,         setPhase]         = useState(0);
  const [activeStation, setActiveStation] = useState(0);
  const [cycleComplete, setCycleComplete] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1 — title
    timers.push(setTimeout(() => setPhase(1), 500));

    // Phase 2 — virtuous loop appears, stations light up sequentially
    timers.push(setTimeout(() => setPhase(2), 1500));
    VIRTUOUS_STATIONS.forEach((_, i) => {
      timers.push(
        setTimeout(() => setActiveStation(i), 1500 + i * 800)
      );
    });

    // After one full cycle: show "(repeat until no disease)"
    timers.push(setTimeout(() => setCycleComplete(true), 1500 + VIRTUOUS_STATIONS.length * 800 + 300));

    // Phase 3 — vicious loop
    timers.push(setTimeout(() => setPhase(3), 5000));

    // Phase 4 — virtuous pulses brighter, vicious dims + punchline
    timers.push(setTimeout(() => setPhase(4), 7000));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SlideBase act={2}>
      <style jsx>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .fade-up { animation: fade-up 0.4s ease-out forwards; }

        /* Marble dot that travels around the virtuous loop */
        @keyframes marble-travel {
          0%   { top:  8%; left: 25%; }
          25%  { top:  8%; left: 75%; }
          50%  { top: 75%; left: 75%; }
          75%  { top: 75%; left: 25%; }
          100% { top:  8%; left: 25%; }
        }
        .marble {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 8px 3px rgba(52,211,153,0.7);
          animation: marble-travel 3.2s linear infinite;
          pointer-events: none;
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 1;   }
          50%       { opacity: 0.6; }
        }
        .pulse-glow { animation: pulse-glow 1.8s ease-in-out infinite; }

        .dim { opacity: 0.35; }
      `}</style>

      <div className="flex flex-col items-center gap-4 w-full max-w-[1700px] mx-auto">

        {/* ── Phase 1: Title ── */}
        {phase >= 1 && (
          <div className="text-center fade-up">
            <h1 className="font-pixel text-lg md:text-2xl text-emerald-400 uppercase">
              🔄 THE LOOP
            </h1>
            <p className="font-pixel text-sm md:text-base text-red-400 mt-1">
              {gdpDragPct}% OF GLOBAL GDP LOST TO DISEASE — $15T/YEAR
            </p>
          </div>
        )}

        {/* ── Phase 2: Virtuous loop ── */}
        {phase >= 2 && (
          <div className="fade-up w-full">
            <p className="font-pixel text-xs text-emerald-400/70 text-center mb-2 uppercase tracking-widest">
              The Virtuous Version
            </p>

            {/* 2×2 grid with marble overlay */}
            <div className="relative">
              <div className={`grid grid-cols-2 gap-3 transition-all duration-700 ${phase >= 4 ? "pulse-glow" : ""}`}>
                {VIRTUOUS_STATIONS.map((station, i) => {
                  const c = STATION_COLORS[station.color];
                  const isActive = activeStation === i;
                  return (
                    <div
                      key={station.label}
                      className={`
                        relative border-2 rounded p-3 text-center transition-all duration-500
                        ${c.bg} ${c.border}
                        ${isActive ? `${c.glow} scale-105` : "opacity-60"}
                      `}
                    >
                      <div className="text-2xl md:text-3xl mb-1">{station.emoji}</div>
                      <div className={`font-pixel text-xs ${c.text}`}>{station.label}</div>
                      {/* Arrow to next station */}
                      <span
                        className={`
                          absolute font-pixel text-base text-zinc-500
                          ${i === 0 ? "-right-3 top-1/2 -translate-y-1/2"  : ""}
                          ${i === 1 ? "-bottom-3 left-1/2 -translate-x-1/2": ""}
                          ${i === 2 ? "-left-3  top-1/2 -translate-y-1/2"  : ""}
                          ${i === 3 ? "-top-3   left-1/2 -translate-x-1/2" : ""}
                        `}
                        aria-hidden
                      >
                        {ARROWS[i]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Marble dot */}
              <div className="marble" aria-hidden />
            </div>

            {cycleComplete && (
              <p className="font-terminal text-xs text-emerald-400 text-center mt-2 fade-up">
                (repeat until no disease)
              </p>
            )}
          </div>
        )}

        {/* ── Phase 3: Vicious loop ── */}
        {phase >= 3 && (
          <div className={`fade-up w-full ${phase >= 4 ? "dim" : ""}`}>
            <p className="font-pixel text-xs text-red-400 text-center mb-2 uppercase tracking-widest">
              Your Species Version:
            </p>

            <div className="grid grid-cols-2 gap-2">
              {VICIOUS_STATIONS.map((station, i) => (
                <div
                  key={station.label}
                  className="relative border border-red-900/60 rounded p-2 text-center bg-red-950/20"
                >
                  <div className="text-xl mb-0.5">{station.emoji}</div>
                  <div className="font-pixel text-xs text-red-500">{station.label}</div>
                  <span
                    className={`
                      absolute font-pixel text-sm text-red-800
                      ${i === 0 ? "-right-2.5 top-1/2 -translate-y-1/2"  : ""}
                      ${i === 1 ? "-bottom-2.5 left-1/2 -translate-x-1/2": ""}
                      ${i === 2 ? "-left-2.5  top-1/2 -translate-y-1/2"  : ""}
                      ${i === 3 ? "-top-2.5   left-1/2 -translate-x-1/2" : ""}
                    `}
                    aria-hidden
                  >
                    {ARROWS[i]}
                  </span>
                </div>
              ))}
            </div>

            <p className="font-terminal text-xs text-red-400/60 text-center mt-2">
              (repeat until no civilisation)
            </p>
          </div>
        )}

        {/* ── Phase 4: Punchline ── */}
        {phase >= 4 && (
          <p className="font-terminal text-sm text-zinc-400 text-center fade-up">
            Same planet. Same species. Different loop.
          </p>
        )}

      </div>
    </SlideBase>
  );
}
