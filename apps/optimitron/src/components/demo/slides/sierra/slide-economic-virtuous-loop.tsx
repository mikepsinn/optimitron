"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { DISEASE_BURDEN_GDP_DRAG_PCT } from "@optimitron/data/parameters";
import { useEffect, useState } from "react";

const gdpDragPct = Math.round(DISEASE_BURDEN_GDP_DRAG_PCT.value * 100);

const VIRTUOUS = [
  { emoji: "🧪", label: "CURE DISEASE" },
  { emoji: "📈", label: "UNLOCK GDP" },
  { emoji: "💰", label: "BIGGER BUDGET" },
  { emoji: "👷", label: "MORE WORKERS" },
] as const;

const VICIOUS = [
  { emoji: "💣", label: "FUND MILITARY" },
  { emoji: "☠️", label: "KILL PEOPLE" },
  { emoji: "😱", label: "PANIC" },
  { emoji: "📉", label: "LESS GDP" },
] as const;

/**
 * Render 4 labels placed around a circle with an animated SVG ring arrow.
 */
function LoopCircle({
  stations,
  color,
  dimmed,
  subtitle,
}: {
  stations: readonly { emoji: string; label: string }[];
  color: "emerald" | "red";
  dimmed?: boolean;
  subtitle: string;
}) {
  const isGreen = color === "emerald";
  const ringColor = isGreen ? "#34d399" : "#ef4444";
  const dotColor = isGreen ? "#34d399" : "#ef4444";
  const textColor = isGreen ? "text-emerald-400" : "text-red-400";
  const borderColor = isGreen ? "border-emerald-500/40" : "border-red-500/40";
  const bgColor = isGreen ? "bg-emerald-500/10" : "bg-red-500/10";

  // Positions: top, right, bottom, left (clockwise)
  const positions = [
    { top: "2%", left: "50%", transform: "translate(-50%, 0)" },
    { top: "50%", right: "0%", transform: "translate(0, -50%)" },
    { bottom: "2%", left: "50%", transform: "translate(-50%, 0)" },
    { top: "50%", left: "0%", transform: "translate(0, -50%)" },
  ];

  return (
    <div className={`flex flex-col items-center gap-2 transition-opacity duration-700 ${dimmed ? "opacity-30" : ""}`}>
      <div className={`font-pixel text-xl md:text-2xl ${textColor} uppercase tracking-widest`}>
        {isGreen ? "Virtuous Version" : "Your Species Version"}
      </div>

      <div className="relative" style={{ width: 420, height: 420 }}>
        {/* SVG ring + animated dot */}
        <svg
          viewBox="0 0 200 200"
          className="absolute inset-0 w-full h-full"
          fill="none"
        >
          {/* Circle ring */}
          <circle
            cx="100"
            cy="100"
            r="70"
            stroke={ringColor}
            strokeWidth="2"
            opacity={0.4}
          />
          {/* Arrowhead markers */}
          <defs>
            <marker
              id={`arrow-${color}`}
              markerWidth="6"
              markerHeight="6"
              refX="3"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L6,3 L0,6 Z" fill={ringColor} opacity={0.6} />
            </marker>
          </defs>
          {/* Arrow segments (4 arcs with arrowheads) */}
          {[0, 1, 2, 3].map((i) => {
            const startAngle = i * 90 - 90 + 15;
            const endAngle = i * 90 - 90 + 75;
            const r = 70;
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
                opacity={0.7}
                markerEnd={`url(#arrow-${color})`}
              />
            );
          })}
          {/* Animated traveling dot */}
          <circle r="5" fill={dotColor}>
            <animateMotion
              dur="3s"
              repeatCount="indefinite"
              path="M 100 30 A 70 70 0 0 1 170 100 A 70 70 0 0 1 100 170 A 70 70 0 0 1 30 100 A 70 70 0 0 1 100 30"
            />
          </circle>
        </svg>

        {/* Station labels at 4 positions */}
        {stations.map((s, i) => (
          <div
            key={s.label}
            className="absolute flex flex-col items-center"
            style={positions[i]}
          >
            <span className="text-3xl">{s.emoji}</span>
            <span className={`font-pixel text-base md:text-lg ${textColor} whitespace-nowrap px-2 py-1 rounded ${bgColor} border ${borderColor}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className={`font-terminal text-lg md:text-xl ${textColor}`}>
        {subtitle}
      </div>
    </div>
  );
}

export function SlideEconomicVirtuousLoop() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase(1), 500));
    timers.push(setTimeout(() => setPhase(2), 1500));
    timers.push(setTimeout(() => setPhase(3), 3500));
    timers.push(setTimeout(() => setPhase(4), 5500));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SierraSlideWrapper act={2}>
      <style jsx>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.4s ease-out forwards; }
      `}</style>

      <div className="flex flex-col items-center gap-4 w-full max-w-[1700px] mx-auto">
        {/* Title */}
        {phase >= 1 && (
          <div className="text-center fade-up">
            <h1 className="font-pixel text-2xl md:text-4xl text-emerald-400">
              🔄 THE LOOP
            </h1>
            <p className="font-pixel text-lg md:text-2xl text-red-400 mt-1">
              {gdpDragPct}% OF GLOBAL GDP LOST TO DISEASE — $15T/YEAR
            </p>
          </div>
        )}

        {/* Side-by-side loops */}
        {phase >= 2 && (
          <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-8 md:gap-16 fade-up">
            <LoopCircle
              stations={VIRTUOUS}
              color="emerald"
              dimmed={false}
              subtitle="(repeat until no disease)"
            />

            {phase >= 3 && (
              <LoopCircle
                stations={VICIOUS}
                color="red"
                dimmed={phase >= 4}
                subtitle="(repeat until no civilisation)"
              />
            )}
          </div>
        )}

        {/* Punchline */}
        {phase >= 4 && (
          <p className="font-terminal text-xl text-zinc-200 text-center fade-up">
            Same planet. Same species. Different loop.
          </p>
        )}
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideEconomicVirtuousLoop;
