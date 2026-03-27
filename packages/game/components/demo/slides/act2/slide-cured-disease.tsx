"use client";

import { SlideBase } from "../slide-base";
import { useEffect, useState } from "react";

interface SupplyNode {
  emoji: string;
  city: string;
  role: string;
  x: number;
  y: number;
}

const SUPPLY_NODES: SupplyNode[] = [
  { emoji: "👩‍🔬", city: "Lagos",    role: "cheaper trial design",  x: 15, y: 25 },
  { emoji: "🤝",   city: "Brussels", role: "passed the directive",   x: 85, y: 20 },
  { emoji: "📱",   city: "Manila",   role: "recruited 1M voters",    x: 10, y: 70 },
  { emoji: "💰",   city: "New York", role: "funded the campaign",    x: 90, y: 65 },
  { emoji: "🏛️",  city: "Delhi",    role: "voted yes",              x: 25, y: 90 },
  { emoji: "🏥",   city: "Dhaka",    role: "enrolled in the trial",  x: 75, y: 90 },
];

const STATS = [
  { label: "People cooperating:",    value: "millions", color: "text-emerald-400" },
  { label: "People who know each other:", value: "none",     color: "text-zinc-400" },
  { label: "Central coordinator:",   value: "none",     color: "text-zinc-400" },
  { label: "Orders given:",          value: "zero",     color: "text-zinc-400" },
];

export function SlideCuredDisease() {
  const [phase, setPhase] = useState<number>(0);
  const [visibleNodes, setVisibleNodes] = useState<number>(0);
  const [visibleStats, setVisibleStats] = useState<number>(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: title
    timers.push(setTimeout(() => setPhase(1), 500));
    // Phase 2: center test tube
    timers.push(setTimeout(() => setPhase(2), 1000));
    // Phase 3: nodes one at a time (1.2s stagger starting at 2s)
    timers.push(setTimeout(() => setPhase(3), 2000));
    SUPPLY_NODES.forEach((_, i) => {
      timers.push(
        setTimeout(() => setVisibleNodes(i + 1), 2000 + i * 1200)
      );
    });
    // Phase 4: stats panel (10s)
    timers.push(setTimeout(() => setPhase(4), 10000));
    STATS.forEach((_, i) => {
      timers.push(
        setTimeout(() => setVisibleStats(i + 1), 10000 + i * 200)
      );
    });
    // Phase 5: punchline (12s)
    timers.push(setTimeout(() => setPhase(5), 12000));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SlideBase act={2}>
      <div className="flex flex-col items-center gap-3 w-full max-w-[1700px] mx-auto">

        {/* Phase 1 — Title */}
        <h1
          className="font-pixel text-xl md:text-3xl text-amber-400 text-center transition-opacity duration-500"
          style={{ opacity: phase >= 1 ? 1 : 0 }}
        >
          🧪 I, CURED DISEASE
        </h1>

        {/* Phase 2/3 — SVG network */}
        <div
          className="relative w-full aspect-video bg-black/40 border border-amber-500/30 rounded overflow-hidden transition-opacity duration-500"
          style={{ opacity: phase >= 2 ? 1 : 0 }}
        >
          {/* SVG lines */}
          <svg className="absolute inset-0 w-full h-full">
            {SUPPLY_NODES.slice(0, visibleNodes).map((node, i) => (
              <line
                key={i}
                x1={`${node.x}%`}
                y1={`${node.y}%`}
                x2="50%"
                y2="50%"
                stroke="rgba(245, 158, 11, 0.4)"
                strokeWidth="1.5"
                className="draw-line"
              />
            ))}
          </svg>

          {/* Center glow + test tube */}
          <div
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
            }}
          >
            <div
              className="text-5xl md:text-7xl"
              style={{
                filter: "drop-shadow(0 0 12px rgba(245, 158, 11, 0.8))",
              }}
            >
              🧪
            </div>
          </div>

          {/* Supply chain node labels */}
          {SUPPLY_NODES.slice(0, visibleNodes).map((node, i) => (
            <div
              key={i}
              className="absolute fade-in text-center"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="text-2xl md:text-3xl">{node.emoji}</div>
              <div className="font-pixel text-sm md:text-base text-foreground whitespace-nowrap">
                {node.city}
              </div>
              <div className="font-pixel text-xs md:text-sm text-zinc-400 whitespace-nowrap">
                {node.role}
              </div>
            </div>
          ))}
        </div>

        {/* Phase 4 — Stats panel */}
        <div
          className="w-full bg-black/40 border border-zinc-700 rounded p-4 transition-opacity duration-500"
          style={{ opacity: phase >= 4 ? 1 : 0 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {STATS.slice(0, visibleStats).map((stat, i) => (
              <div key={i} className="flex items-center gap-2 fade-in">
                <span className="font-terminal text-base md:text-lg text-zinc-400">
                  {stat.label}
                </span>
                <span className={`font-pixel text-base md:text-lg ${stat.color}`}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Phase 5 — Punchline */}
        <div
          className="text-center space-y-1 transition-opacity duration-500"
          style={{ opacity: phase >= 5 ? 1 : 0 }}
        >
          <div className="font-terminal text-base md:text-lg text-zinc-400">
            Method: everyone wanted money.
          </div>
          <div className="font-pixel text-xl md:text-3xl text-amber-400">
            Result: cured disease.
          </div>
        </div>

      </div>

      <style jsx>{`
        @keyframes draw-line {
          from {
            stroke-dasharray: 300;
            stroke-dashoffset: 300;
          }
          to {
            stroke-dasharray: 300;
            stroke-dashoffset: 0;
          }
        }
        .draw-line {
          animation: draw-line 0.6s ease-out forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
    </SlideBase>
  );
}
