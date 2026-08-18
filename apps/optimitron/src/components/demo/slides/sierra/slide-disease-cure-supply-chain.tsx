"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { useEffect, useState } from "react";

interface SupplyNode {
  emoji: string;
  city: string;
  role: string;
  x: number;
  y: number;
}

// Positions inset from edges so labels don't clip (10-90% range)
const SUPPLY_NODES: SupplyNode[] = [
  { emoji: "👩‍🔬", city: "Lagos",    role: "cheaper trial design",  x: 12, y: 18 },
  { emoji: "🤝",   city: "Brussels", role: "passed the directive",   x: 80, y: 14 },
  { emoji: "📱",   city: "Manila",   role: "recruited 1M voters",    x: 10, y: 62 },
  { emoji: "💰",   city: "New York", role: "funded the campaign",    x: 85, y: 58 },
  { emoji: "🏛️",  city: "Delhi",    role: "voted yes",              x: 28, y: 85 },
  { emoji: "🏥",   city: "Dhaka",    role: "enrolled in the trial",  x: 72, y: 85 },
];

export function SlideDiseaseCureSupplyChain() {
  const [phase, setPhase] = useState<number>(0);
  const [visibleNodes, setVisibleNodes] = useState<number>(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase(1), 500));
    timers.push(setTimeout(() => setPhase(2), 1000));
    timers.push(setTimeout(() => setPhase(3), 2000));
    SUPPLY_NODES.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleNodes(i + 1), 2000 + i * 1200));
    });
    timers.push(setTimeout(() => setPhase(4), 10000));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SierraSlideWrapper act={2}>
      <div className="flex flex-col items-center w-full h-full max-w-[1700px] mx-auto">

        {/* Title */}
        <h1
          className="font-pixel text-3xl md:text-5xl text-amber-400 text-center mt-4 mb-2 transition-opacity duration-500"
          style={{ opacity: phase >= 1 ? 1 : 0 }}
        >
          🧪 I, CURED DISEASE
        </h1>

        {/* SVG network — takes most of the space */}
        <div
          className="relative w-full flex-1 min-h-0 transition-opacity duration-500"
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
                y2="45%"
                stroke="rgba(245, 158, 11, 0.5)"
                strokeWidth="2"
                className="draw-line"
              />
            ))}
          </svg>

          {/* Center test tube */}
          <div
            className="absolute text-6xl md:text-8xl"
            style={{
              left: "50%",
              top: "45%",
              transform: "translate(-50%, -50%)",
              filter: "drop-shadow(0 0 16px rgba(245, 158, 11, 0.8))",
            }}
          >
            🧪
          </div>

          {/* Supply chain nodes */}
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
              <div className="text-4xl md:text-5xl">{node.emoji}</div>
              <div className="font-pixel text-xl md:text-2xl text-white whitespace-nowrap">
                {node.city}
              </div>
              <div className="font-pixel text-lg md:text-xl text-zinc-300 whitespace-nowrap">
                {node.role}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom stats — always visible area */}
        <div
          className="w-full text-center pb-4 space-y-2 transition-opacity duration-500"
          style={{ opacity: phase >= 4 ? 1 : 0 }}
        >
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-1">
            <span className="font-terminal text-2xl md:text-3xl text-zinc-300">
              People who know each other: <span className="font-pixel text-2xl md:text-3xl text-amber-400">none</span>
            </span>
            <span className="font-terminal text-2xl md:text-3xl text-zinc-300">
              Orders given: <span className="font-pixel text-2xl md:text-3xl text-amber-400">zero</span>
            </span>
          </div>
          <div className="font-pixel text-2xl md:text-4xl text-amber-400">
            Method: everyone wanted money. Result: cured disease.
          </div>
        </div>

      </div>

      <style jsx>{`
        @keyframes draw-line {
          from { stroke-dasharray: 300; stroke-dashoffset: 300; }
          to { stroke-dasharray: 300; stroke-dashoffset: 0; }
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
    </SierraSlideWrapper>
  );
}
export default SlideDiseaseCureSupplyChain;
