"use client";

import { SlideBase } from "../slide-base";
import { AnimatedCounter } from "../../animations/animated-counter";
import { GlitchText } from "../../animations/glitch-text";
import { ParticleEmitter } from "../../animations/particle-emitter";
import { GAME_PARAMS } from "@/lib/demo/parameters";
import { CUMULATIVE_MILITARY_SPENDING_FED_ERA, MONEY_PRINTER_WAR_DEATHS } from "@optimitron/data/parameters";
import { useEffect, useState } from "react";

/** Animated SVG chart showing the decline of the dollar from $1.00 → $0.04 */
function DollarDeclineChart({ progress }: { progress: number }) {
  // progress goes 100→4 as dollarScale animates down
  // We draw the full curve and reveal it progressively
  const W = 280;
  const H = 120;
  const PAD = 24;

  // Data points: year → purchasing power (approximate)
  const data: [number, number][] = [
    [1913, 1.0],
    [1920, 0.82],
    [1930, 0.95],
    [1940, 0.97],
    [1945, 0.73],
    [1950, 0.58],
    [1960, 0.48],
    [1970, 0.37],
    [1980, 0.18],
    [1990, 0.1],
    [2000, 0.07],
    [2010, 0.05],
    [2024, 0.04],
  ];

  const xMin = data[0][0];
  const xMax = data[data.length - 1][0];

  const toX = (year: number) =>
    PAD + ((year - xMin) / (xMax - xMin)) * (W - PAD * 2);
  const toY = (val: number) =>
    PAD + (1 - val) * (H - PAD * 2);

  const points = data.map(([y, v]) => `${toX(y)},${toY(v)}`).join(" ");
  const areaPoints = `${toX(xMin)},${toY(0)} ${points} ${toX(xMax)},${toY(0)}`;

  // How much of the line to reveal (100→4 maps to 0→1)
  const reveal = Math.min(1, (100 - progress) / 96);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full max-w-[300px] mx-auto"
      style={{ filter: "drop-shadow(0 0 4px rgba(239,68,68,0.3))" }}
    >
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1.0].map((v) => (
        <line
          key={v}
          x1={PAD}
          y1={toY(v)}
          x2={W - PAD}
          y2={toY(v)}
          stroke="#333"
          strokeWidth={0.5}
          strokeDasharray="2,3"
        />
      ))}

      {/* Axis labels */}
      <text x={PAD - 2} y={toY(1.0) + 3} fill="#666" fontSize={7} textAnchor="end" fontFamily="monospace">
        $1.00
      </text>
      <text x={PAD - 2} y={toY(0.5) + 3} fill="#666" fontSize={7} textAnchor="end" fontFamily="monospace">
        $0.50
      </text>
      <text x={PAD - 2} y={toY(0) + 3} fill="#666" fontSize={7} textAnchor="end" fontFamily="monospace">
        $0.00
      </text>
      <text x={toX(1913)} y={H - 4} fill="#666" fontSize={7} textAnchor="start" fontFamily="monospace">
        1913
      </text>
      <text x={toX(2024)} y={H - 4} fill="#666" fontSize={7} textAnchor="end" fontFamily="monospace">
        2024
      </text>

      {/* Area fill */}
      <polygon
        points={areaPoints}
        fill="rgba(239,68,68,0.15)"
        clipPath="url(#revealClip)"
      />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke="#ef4444"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        clipPath="url(#revealClip)"
      />

      {/* End point dot */}
      {reveal >= 0.95 && (
        <circle cx={toX(2024)} cy={toY(0.04)} r={3} fill="#ef4444">
          <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}

      {/* End label */}
      {reveal >= 0.95 && (
        <text x={toX(2024) - 4} y={toY(0.04) - 6} fill="#ef4444" fontSize={9} textAnchor="end" fontFamily="monospace" fontWeight="bold">
          $0.04
        </text>
      )}

      {/* Reveal clip */}
      <defs>
        <clipPath id="revealClip">
          <rect x={0} y={0} width={PAD + reveal * (W - PAD * 2)} height={H} />
        </clipPath>
      </defs>
    </svg>
  );
}

/** A single CRT monitor frame with scanlines */
function CRTMonitor({
  label,
  labelColor,
  glowColor,
  children,
  delay = 0,
}: {
  label: string;
  labelColor: string;
  glowColor: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const [visible, setVisible] = useState(delay === 0);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  return (
    <div
      className={`transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Monitor bezel */}
      <div
        className="bg-zinc-800 border-2 border-zinc-600 rounded-lg p-1"
        style={{ boxShadow: `0 0 20px ${glowColor}` }}
      >
        {/* Screen */}
        <div className="bg-black border border-zinc-700 rounded p-3 md:p-4 relative overflow-hidden flex flex-col items-center">
          {/* Scanlines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)",
            }}
          />

          {/* CRT glow */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              background: `radial-gradient(ellipse at center, ${glowColor}, transparent 70%)`,
            }}
          />

          {/* Content (numbers first) */}
          <div className="relative z-10">{children}</div>

          {/* Label */}
          {label && (
            <div
              className="font-pixel text-2xl mt-2 tracking-wider"
              style={{ color: labelColor }}
            >
              {label}
            </div>
          )}
        </div>
      </div>

      {/* Mini stand */}
      <div className="flex justify-center">
        <div className="w-8 h-2 bg-zinc-700 rounded-b" />
      </div>
    </div>
  );
}

export function SlideMisalignedProof() {
  const [dollarScale, setDollarScale] = useState(100);

  useEffect(() => {
    // Animate dollar shrink
    const shrinkInterval = setInterval(() => {
      setDollarScale((prev) => {
        if (prev <= 4) {
          clearInterval(shrinkInterval);
          return 4;
        }
        return prev - 2;
      });
    }, 60);

    return () => clearInterval(shrinkInterval);
  }, []);

  return (
    <SlideBase act={1} className="text-red-500">
      {/* Skull particles */}
      <ParticleEmitter
        emoji={["💀"]}
        rate={1}
        direction="up"
        speed={15}
        lifetime={4000}
        fadeOut
        className="opacity-15"
      />

      <div className="w-full max-w-[1700px] mx-auto space-y-6">
        {/* Alert bar — top */}
        <div className="bg-black border-2 border-red-500/40 rounded p-3 text-center animate-pulse">
          <GlitchText
            text="⚠️ ALERT!!! SUPERINTELLIGENT ENTITY MISALIGNED ⚠️"
            className="font-pixel text-xl md:text-2xl text-red-500"
            intensity="medium"
          />
        </div>

        {/* Title */}
        <div className="text-center">
          <div className="font-pixel text-xl text-red-400 tracking-widest">
            FAILURE ANALYSIS
          </div>
        </div>

        {/* Three monitors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Monitor 1: "$170T printed on weapons and wars since 1913" */}
          <CRTMonitor
            label=""
            labelColor="#f59e0b"
            glowColor="rgba(245,158,11,0.15)"
            delay={0}
          >
            <div className="text-center">
              <div className="font-pixel text-3xl md:text-4xl text-amber-400">
                <AnimatedCounter
                  end={CUMULATIVE_MILITARY_SPENDING_FED_ERA.value}
                  duration={3000}
                  format="currency"
                  decimals={0}
                />
              </div>
              <div className="font-pixel text-2xl text-amber-400 mt-2">
                PRINTED ON WEAPONS AND WARS
              </div>
              <div className="font-pixel text-2xl text-amber-400 mt-1">
                SINCE 1913
              </div>
              <div className="text-3xl mt-3">🚀💣🔫✈️</div>
            </div>
          </CRTMonitor>

          {/* Monitor 2: "97% purchasing power destroyed since 1913" */}
          <CRTMonitor
            label=""
            labelColor="#ef4444"
            glowColor="rgba(239,68,68,0.15)"
            delay={300}
          >
            <div className="text-center w-full">
              <div className="font-pixel text-3xl md:text-4xl text-red-400">
                {GAME_PARAMS.dollarPurchasingPowerLost}%
              </div>
              <div className="font-pixel text-2xl text-red-400 mt-1">
                PURCHASING POWER DESTROYED
              </div>
              <DollarDeclineChart progress={dollarScale} />
            </div>
          </CRTMonitor>

          {/* Monitor 3: "97M humans killed in unpopular wars no one voted for" */}
          <CRTMonitor
            label=""
            labelColor="#dc2626"
            glowColor="rgba(220,38,38,0.15)"
            delay={600}
          >
            <div className="text-center">
              <div className="font-pixel text-3xl md:text-4xl text-red-500">
                <AnimatedCounter
                  end={MONEY_PRINTER_WAR_DEATHS.value}
                  duration={3000}
                  format="number"
                />
              </div>
              <div className="font-pixel text-2xl text-red-400 mt-2">
                HUMANS KILLED IN UNPOPULAR WARS
              </div>
              <div className="font-pixel text-2xl text-red-400 mt-1 animate-pulse">
                NO ONE VOTED FOR
              </div>
              <div className="text-3xl mt-3">⚰️💀⚰️💀⚰️</div>
            </div>
          </CRTMonitor>
        </div>

      </div>
    </SlideBase>
  );
}
