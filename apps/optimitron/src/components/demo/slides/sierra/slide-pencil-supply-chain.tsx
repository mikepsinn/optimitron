"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { useEffect, useState } from "react";

/**
 * Supply chain nodes — each represents a link in the pencil's creation.
 * Positioned radially around the central pencil.
 */
const SUPPLY_CHAIN = [
  { emoji: "🪵", label: "WOOD", location: "Washington", angle: 220 },
  { emoji: "🪚", label: "SAW", location: "Oregon", angle: 260 },
  { emoji: "⚙️", label: "STEEL", location: "Pennsylvania", angle: 300 },
  { emoji: "⛏️", label: "IRON ORE", location: "Minnesota", angle: 340 },
  { emoji: "✏️", label: "GRAPHITE", location: "South America", angle: 20 },
  { emoji: "🌿", label: "RUBBER", location: "Malaya", angle: 60 },
  { emoji: "🔧", label: "BRASS", location: "???", angle: 100 },
  { emoji: "🎨", label: "PAINT", location: "???", angle: 140 },
] as const;

export function SlidePencilSupplyChain() {
  const [phase, setPhase] = useState(0);
  const [nodesVisible, setNodesVisible] = useState(0);
  const [cooperatingCount, setCooperatingCount] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: Title
    timers.push(setTimeout(() => setPhase(1), 400));
    // Phase 2: Central pencil
    timers.push(setTimeout(() => setPhase(2), 1200));
    // Phase 3: Supply chain nodes appear one by one
    timers.push(setTimeout(() => setPhase(3), 2000));
    // Phase 4: Counter + punchline
    timers.push(setTimeout(() => setPhase(4), 6000));
    // Phase 5: Final line
    timers.push(setTimeout(() => setPhase(5), 8500));

    return () => timers.forEach(clearTimeout);
  }, []);

  // Stagger supply chain nodes appearing
  useEffect(() => {
    if (phase < 3) return;
    const interval = setInterval(() => {
      setNodesVisible((prev) => {
        if (prev >= SUPPLY_CHAIN.length) {
          clearInterval(interval);
          return SUPPLY_CHAIN.length;
        }
        return prev + 1;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [phase]);

  // Count up "strangers cooperating"
  useEffect(() => {
    if (phase < 4) return;
    const target = 100_000;
    const steps = 60;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      // Exponential ease-out for dramatic ramp
      const progress = 1 - Math.pow(1 - step / steps, 3);
      setCooperatingCount(Math.round(target * progress));
      if (step >= steps) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <SierraSlideWrapper act={2}>
      <style jsx>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.5s ease-out forwards; }
        @keyframes node-appear {
          from { opacity: 0; transform: scale(0.3); }
          to   { opacity: 1; transform: scale(1); }
        }
        .node-appear { animation: node-appear 0.4s ease-out forwards; }
        @keyframes line-draw {
          from { stroke-dashoffset: 200; }
          to   { stroke-dashoffset: 0; }
        }
        .line-draw {
          stroke-dasharray: 200;
          animation: line-draw 0.6s ease-out forwards;
        }
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.4)); }
          50%      { filter: drop-shadow(0 0 16px rgba(251, 191, 36, 0.8)); }
        }
        .pencil-glow { animation: pulse-glow 2s ease-in-out infinite; }
        @keyframes count-pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.05); }
        }
        .count-pulse { animation: count-pulse 0.8s ease-in-out infinite; }
      `}</style>

      <div className="flex flex-col items-center justify-center gap-4 w-full max-w-[1700px] mx-auto">
        {/* Title */}
        {phase >= 1 && (
          <h1 className="font-pixel text-2xl md:text-4xl text-amber-400 text-center fade-up">
            I, PENCIL
          </h1>
        )}

        {/* Central supply chain diagram */}
        {phase >= 2 && (
          <div className="relative fade-up" style={{ width: 600, height: 400 }}>
            {/* SVG lines from center to nodes */}
            <svg
              className="absolute inset-0 pointer-events-none"
              viewBox="0 0 600 400"
              fill="none"
            >
              {SUPPLY_CHAIN.slice(0, nodesVisible).map((node, i) => {
                const rad = (node.angle * Math.PI) / 180;
                const cx = 300;
                const cy = 190;
                const radius = 160;
                const nx = cx + Math.cos(rad) * radius;
                const ny = cy + Math.sin(rad) * radius;
                return (
                  <line
                    key={i}
                    x1={cx}
                    y1={cy}
                    x2={nx}
                    y2={ny}
                    stroke="#fbbf24"
                    strokeWidth={1.5}
                    opacity={0.5}
                    className="line-draw"
                    style={{ animationDelay: `${i * 100}ms` }}
                  />
                );
              })}
            </svg>

            {/* Central pencil */}
            <div
              className="absolute pencil-glow flex items-center justify-center"
              style={{
                left: "50%",
                top: "47%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <span className="text-6xl md:text-7xl">✏️</span>
            </div>

            {/* Supply chain nodes */}
            {SUPPLY_CHAIN.slice(0, nodesVisible).map((node, i) => {
              const rad = (node.angle * Math.PI) / 180;
              const radius = 160;
              const nx = 300 + Math.cos(rad) * radius;
              const ny = 190 + Math.sin(rad) * radius;
              return (
                <div
                  key={i}
                  className="absolute node-appear flex flex-col items-center"
                  style={{
                    left: nx,
                    top: ny,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <span className="text-2xl md:text-3xl">{node.emoji}</span>
                  <span className="font-pixel text-xs md:text-sm text-amber-400 whitespace-nowrap">
                    {node.label}
                  </span>
                  <span className="font-terminal text-xs text-zinc-400 whitespace-nowrap">
                    {node.location}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Strangers cooperating counter */}
        {phase >= 4 && (
          <div className="flex flex-col items-center gap-3 fade-up">
            <div className="bg-black/40 border border-amber-500/30 rounded-lg px-8 py-3 text-center">
              <div className="font-pixel text-lg md:text-xl text-zinc-300 mb-1">
                STRANGERS COOPERATING
              </div>
              <div className="font-pixel text-3xl md:text-4xl text-amber-400 count-pulse">
                {cooperatingCount.toLocaleString()}
              </div>
            </div>

            <div className="flex gap-8 text-center">
              <div>
                <div className="font-pixel text-sm text-zinc-400">CENTRAL PLANNER</div>
                <div className="font-pixel text-xl text-red-400">NONE</div>
              </div>
              <div>
                <div className="font-pixel text-sm text-zinc-400">MASTER MIND</div>
                <div className="font-pixel text-xl text-red-400">NONE</div>
              </div>
              <div>
                <div className="font-pixel text-sm text-zinc-400">COST</div>
                <div className="font-pixel text-xl text-emerald-400">$0.25</div>
              </div>
            </div>
          </div>
        )}

        {/* Punchline */}
        {phase >= 5 && (
          <p className="font-pixel text-xl md:text-2xl text-amber-300 text-center fade-up">
            THE PRICE SYSTEM DID IT.
          </p>
        )}
      </div>
    </SierraSlideWrapper>
  );
}
export default SlidePencilSupplyChain;
