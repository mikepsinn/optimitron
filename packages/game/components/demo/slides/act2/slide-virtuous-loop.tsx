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
            <h1 className="font-pixel text-2xl md:text-4xl text-emerald-400 uppercase">
              🔄 THE LOOP
            </h1>
            <p className="font-pixel text-xl md:text-3xl text-red-400 mt-1">
              {gdpDragPct}% OF GLOBAL GDP LOST TO DISEASE — $15T/YEAR
            </p>
          </div>
        )}

        {/* ── Phase 2: Virtuous loop ── */}
        {phase >= 2 && (
          <div className="fade-up w-full max-w-5xl mx-auto">
            <p className="font-pixel text-xl text-emerald-400 text-center mb-3 uppercase tracking-widest">
              The Virtuous Version
            </p>

            <div className={`relative transition-all duration-700 ${phase >= 4 ? "pulse-glow" : ""}`}>
              {/* Row 1: station 0 → arrow → station 1 */}
              <div className="flex items-center justify-center gap-2">
                {(() => {
                  const s = VIRTUOUS_STATIONS[0];
                  const c = STATION_COLORS[s.color];
                  const isActive = activeStation === 0;
                  return (
                    <div className={`border-2 rounded px-6 py-2 text-center transition-all duration-500 ${c.bg} ${c.border} ${isActive ? `${c.glow} scale-105` : "opacity-60"}`}>
                      <span className="text-3xl mr-2">{s.emoji}</span>
                      <span className={`font-pixel text-2xl ${c.text}`}>{s.label}</span>
                    </div>
                  );
                })()}
                <span className="font-pixel text-4xl md:text-5xl text-emerald-400">→</span>
                {(() => {
                  const s = VIRTUOUS_STATIONS[1];
                  const c = STATION_COLORS[s.color];
                  const isActive = activeStation === 1;
                  return (
                    <div className={`border-2 rounded px-6 py-2 text-center transition-all duration-500 ${c.bg} ${c.border} ${isActive ? `${c.glow} scale-105` : "opacity-60"}`}>
                      <span className="text-3xl mr-2">{s.emoji}</span>
                      <span className={`font-pixel text-2xl ${c.text}`}>{s.label}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Vertical arrows: ↑ on left, ↓ on right */}
              <div className="flex justify-between px-16 md:px-24 py-1">
                <span className="font-pixel text-4xl md:text-5xl text-cyan-400">↑</span>
                <span className="font-pixel text-4xl md:text-5xl text-amber-400">↓</span>
              </div>

              {/* Row 2: station 2 ← arrow ← station 3 */}
              <div className="flex items-center justify-center gap-2">
                {(() => {
                  const s = VIRTUOUS_STATIONS[2];
                  const c = STATION_COLORS[s.color];
                  const isActive = activeStation === 2;
                  return (
                    <div className={`border-2 rounded px-6 py-2 text-center transition-all duration-500 ${c.bg} ${c.border} ${isActive ? `${c.glow} scale-105` : "opacity-60"}`}>
                      <span className="text-3xl mr-2">{s.emoji}</span>
                      <span className={`font-pixel text-2xl ${c.text}`}>{s.label}</span>
                    </div>
                  );
                })()}
                <span className="font-pixel text-4xl md:text-5xl text-green-400">←</span>
                {(() => {
                  const s = VIRTUOUS_STATIONS[3];
                  const c = STATION_COLORS[s.color];
                  const isActive = activeStation === 3;
                  return (
                    <div className={`border-2 rounded px-6 py-2 text-center transition-all duration-500 ${c.bg} ${c.border} ${isActive ? `${c.glow} scale-105` : "opacity-60"}`}>
                      <span className="text-3xl mr-2">{s.emoji}</span>
                      <span className={`font-pixel text-2xl ${c.text}`}>{s.label}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Marble dot */}
              <div className="marble" aria-hidden />
            </div>

            {cycleComplete && (
              <p className="font-terminal text-xl text-emerald-400 text-center mt-2 fade-up">
                (repeat until no disease)
              </p>
            )}
          </div>
        )}

        {/* ── Phase 3: Vicious loop ── */}
        {phase >= 3 && (
          <div className={`fade-up w-full max-w-5xl mx-auto ${phase >= 4 ? "dim" : ""}`}>
            <p className="font-pixel text-xl text-red-400 text-center mb-3 uppercase tracking-widest">
              Your Species Version:
            </p>

            {/* Row 1 */}
            <div className="flex items-center justify-center gap-2">
              <div className="border border-red-900/60 rounded px-6 py-2 text-center bg-red-950/20">
                <span className="text-3xl mr-2">{VICIOUS_STATIONS[0].emoji}</span>
                <span className="font-pixel text-2xl text-red-500">{VICIOUS_STATIONS[0].label}</span>
              </div>
              <span className="font-pixel text-4xl md:text-5xl text-red-600">→</span>
              <div className="border border-red-900/60 rounded px-6 py-2 text-center bg-red-950/20">
                <span className="text-3xl mr-2">{VICIOUS_STATIONS[1].emoji}</span>
                <span className="font-pixel text-2xl text-red-500">{VICIOUS_STATIONS[1].label}</span>
              </div>
            </div>

            {/* Vertical arrows */}
            <div className="flex justify-between px-16 md:px-24 py-1">
              <span className="font-pixel text-4xl md:text-5xl text-red-800">↑</span>
              <span className="font-pixel text-4xl md:text-5xl text-red-600">↓</span>
            </div>

            {/* Row 2 */}
            <div className="flex items-center justify-center gap-2">
              <div className="border border-red-900/60 rounded px-6 py-2 text-center bg-red-950/20">
                <span className="text-3xl mr-2">{VICIOUS_STATIONS[2].emoji}</span>
                <span className="font-pixel text-2xl text-red-500">{VICIOUS_STATIONS[2].label}</span>
              </div>
              <span className="font-pixel text-4xl md:text-5xl text-red-800">←</span>
              <div className="border border-red-900/60 rounded px-6 py-2 text-center bg-red-950/20">
                <span className="text-3xl mr-2">{VICIOUS_STATIONS[3].emoji}</span>
                <span className="font-pixel text-2xl text-red-500">{VICIOUS_STATIONS[3].label}</span>
              </div>
            </div>

            <p className="font-terminal text-xl text-red-400 text-center mt-2">
              (repeat until no civilisation)
            </p>
          </div>
        )}

        {/* ── Phase 4: Punchline ── */}
        {phase >= 4 && (
          <p className="font-terminal text-xl text-zinc-200 text-center fade-up">
            Same planet. Same species. Different loop.
          </p>
        )}

      </div>
    </SlideBase>
  );
}
