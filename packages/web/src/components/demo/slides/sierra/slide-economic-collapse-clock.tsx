"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { useEffect, useState, useRef } from "react";
import {
  DESTRUCTIVE_ECONOMY_50PCT_YEAR,
} from "@optimitron/data/parameters";

/**
 * Parasitic vs productive economy — countdown to crossover with inline SVG chart.
 */

const COLLAPSE_YEAR = Math.round(DESTRUCTIVE_ECONOMY_50PCT_YEAR.value);
const NOW_YEAR = 2026;
const YEARS_LEFT = COLLAPSE_YEAR - NOW_YEAR;

// Extraction rates at collapse — from manual.warondisease.org/knowledge/economics/gdp-trajectories.html
const GDP_TRAJECTORIES_URL = "https://manual.warondisease.org/knowledge/economics/gdp-trajectories.html#two-paths";

const FAILED_STATES = [
  { name: "ARGENTINA", year: 2001, pct: 38, color: "rgb(253,224,71)" },
  { name: "YUGOSLAVIA", year: 1991, pct: 40, color: "rgb(244,114,182)" },
  { name: "SOVIET UNION", year: 1991, pct: 45, color: "rgb(34,211,238)" },
];

// Generate chart data: productive shrinks, parasitic grows
const CHART_START = 2015;
const CHART_END = 2045;
// Growth rate calibrated so parasitic hits 50% at exactly COLLAPSE_YEAR
const PARASITIC_BASE = 11.5; // % in 2020
const GROWTH_RATE = Math.pow(50 / PARASITIC_BASE, 1 / (COLLAPSE_YEAR - 2020));

function parasiticAtYear(y: number): number {
  return Math.min(PARASITIC_BASE * Math.pow(GROWTH_RATE, y - 2020), 80);
}

export function SlideEconomicCollapseClock() {
  const [phase, setPhase] = useState(0);
  const [parasiticPct, setParasiticPct] = useState(11.5);
  const [flashState, setFlashState] = useState("");
  const [countdownStr, setCountdownStr] = useState("");
  const animRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const flashedRef = useRef(new Set<string>());

  const glitchIntensity = Math.min((parasiticPct - 11.5) / 40, 1);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase(1), 500));
    timers.push(setTimeout(() => setPhase(2), 1500));

    // Start animations
    timers.push(setTimeout(() => {
      setPhase(3);

      // Parasitic bar growth — no flashes here, they're on fixed timers below
      animRef.current = setInterval(() => {
        setParasiticPct((prev) => {
          const next = prev + 0.4;
          if (next >= 50) {
            clearInterval(animRef.current);
            return 50;
          }
          return next;
        });
      }, 80);

    }, 2500));

    // Flash failed states on fixed timers to match narration (~8-12s in)
    const stateFlashes = [
      { name: "ARGENTINA", pct: 38, delay: 8000 },
      { name: "YUGOSLAVIA", pct: 40, delay: 9500 },
      { name: "SOVIET UNION", pct: 45, delay: 11000 },
    ];
    for (const sf of stateFlashes) {
      timers.push(setTimeout(() => {
        setFlashState(`${sf.name} — ${sf.pct}%`);
        setTimeout(() => setFlashState(""), 1200);
      }, sf.delay));
    }

    return () => {
      timers.forEach(clearTimeout);
      if (animRef.current) clearInterval(animRef.current);
    };
  }, []);

  // Real-time countdown to collapse year
  useEffect(() => {
    const target = new Date(`${COLLAPSE_YEAR}-01-01T00:00:00Z`).getTime();
    function tick() {
      const diff = Math.max(0, target - Date.now());
      const s = Math.floor(diff / 1000);
      const yrs = Math.floor(s / (365.25 * 86400));
      const days = Math.floor((s % (365.25 * 86400)) / 86400);
      const hrs = Math.floor((s % 86400) / 3600);
      const mins = Math.floor((s % 3600) / 60);
      const secs = s % 60;
      setCountdownStr(
        `${yrs}y ${String(days).padStart(3, "0")}d ${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
      );
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const healthPct = Math.max(0, 100 - parasiticPct);

  // SVG chart dimensions
  const W = 600;
  const H = 200;
  const pad = { l: 40, r: 10, t: 10, b: 30 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;

  function x(year: number) {
    return pad.l + ((year - CHART_START) / (CHART_END - CHART_START)) * cw;
  }
  function y(pct: number) {
    return pad.t + (1 - pct / 100) * ch;
  }

  // Build line paths
  const years = Array.from({ length: CHART_END - CHART_START + 1 }, (_, i) => CHART_START + i);
  const parasiticPath = years.map((yr) => `${x(yr)},${y(parasiticAtYear(yr))}`).join(" ");
  const productivePath = years.map((yr) => `${x(yr)},${y(100 - parasiticAtYear(yr))}`).join(" ");

  // Crossover point
  const crossX = x(COLLAPSE_YEAR);
  const crossY = y(50);

  return (
    <SierraSlideWrapper act={1} className="overflow-hidden">
      <style jsx>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.4s ease-out forwards; }
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
        }
        @keyframes draw-line {
          from { stroke-dashoffset: 2000; }
          to { stroke-dashoffset: 0; }
        }
        .line-draw {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: draw-line 4s ease-out forwards;
        }
        .line-draw-delayed {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: draw-line 4s ease-out 0.3s forwards;
        }
      `}</style>

      {/* Glitch overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-30 overflow-hidden"
        style={{
          animation: glitchIntensity > 0.5 ? `screen-shake ${0.5 / glitchIntensity}s linear infinite` : "none",
        }}
      />

      {/* Failed state flash overlay */}
      {flashState && (
        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
          <div
            className="state-flash font-pixel text-5xl md:text-7xl"
            style={{
              color: FAILED_STATES.find((fs) => flashState.startsWith(fs.name))?.color ?? "rgb(239,68,68)",
              filter: `drop-shadow(0 0 30px ${FAILED_STATES.find((fs) => flashState.startsWith(fs.name))?.color ?? "rgb(239,68,68)"})`,
            }}
          >
            {flashState}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-4 w-full max-w-[1700px] mx-auto relative z-10">
        {/* Countdown title */}
        {phase >= 1 && (
          <div className="text-center fade-up">
            <h1 className="font-pixel text-2xl md:text-4xl text-brutal-red">
              COUNTDOWN TO COLLAPSE
            </h1>
            <div className="font-pixel text-3xl md:text-5xl text-brutal-yellow mt-2 tabular-nums tracking-wider">
              {countdownStr}
            </div>
          </div>
        )}

        {/* Health bar */}
        {phase >= 2 && (
          <div className="w-full fade-up">
            <div className="flex justify-between mb-1">
              <span className="font-pixel text-sm text-brutal-cyan">🏗️ PRODUCTIVE ECONOMY</span>
              <span className="font-pixel text-sm text-brutal-red">PARASITIC ECONOMY 💀</span>
            </div>
            <div className="relative h-16 bg-zinc-900 border-2 border-primary rounded overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-brutal-cyan transition-all duration-200 flex items-center overflow-hidden"
                style={{ width: `${healthPct}%` }}
              >
                <span className="whitespace-nowrap pl-2 text-4xl opacity-80">🏥🏫🔬🏭👷🌾</span>
              </div>
              <div
                className="absolute inset-y-0 right-0 bg-brutal-red transition-all duration-200 flex items-center justify-end overflow-hidden"
                style={{ width: `${parasiticPct}%` }}
              >
                <span className="whitespace-nowrap pr-2 text-4xl opacity-80">💣🦹‍♂️🤖🕵️💀🏴‍☠️</span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-pixel text-2xl md:text-3xl text-foreground drop-shadow-lg">
                  {parasiticPct.toFixed(1)}% PARASITIC
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Crossover line chart */}
        {phase >= 2 && (
          <div className="w-full fade-up">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((pct) => (
                <g key={pct}>
                  <line x1={pad.l} y1={y(pct)} x2={W - pad.r} y2={y(pct)} stroke="rgb(63,63,70)" strokeWidth={0.5} />
                  <text x={pad.l - 4} y={y(pct) + 4} textAnchor="end" fill="rgb(161,161,170)" fontSize={10} fontFamily="monospace">
                    {pct}%
                  </text>
                </g>
              ))}
              {/* Year labels */}
              {[2015, 2020, 2025, 2030, 2035, 2040, 2045].map((yr) => (
                <text key={yr} x={x(yr)} y={H - 5} textAnchor="middle" fill="rgb(161,161,170)" fontSize={10} fontFamily="monospace">
                  {yr}
                </text>
              ))}

              {/* Failed state collapse lines — each with its own color */}
              {FAILED_STATES.map((fs, i) => {
                const onRight = i % 2 === 0;
                return (
                  <g key={fs.name}>
                    <line
                      x1={pad.l}
                      y1={y(fs.pct)}
                      x2={W - pad.r}
                      y2={y(fs.pct)}
                      stroke={fs.color}
                      strokeWidth={0.5}
                      strokeDasharray="3,3"
                      opacity={0.5}
                    />
                    <a href={GDP_TRAJECTORIES_URL} target="_blank" rel="noopener noreferrer">
                      <text
                        x={onRight ? W - pad.r - 2 : pad.l + 4}
                        y={y(fs.pct) - 3}
                        textAnchor={onRight ? "end" : "start"}
                        fill={fs.color}
                        fontSize={8}
                        fontFamily="monospace"
                        opacity={0.8}
                        style={{ cursor: "pointer" }}
                      >
                        {fs.name} ({fs.pct}%)
                      </text>
                    </a>
                  </g>
                );
              })}

              {/* Productive line — animated draw */}
              <polyline points={productivePath} fill="none" stroke="rgb(34,211,238)" strokeWidth={2.5} className="line-draw" />
              {/* Parasitic line — animated draw, slightly delayed */}
              <polyline points={parasiticPath} fill="none" stroke="rgb(239,68,68)" strokeWidth={2.5} className="line-draw-delayed" />

              {/* Crossover marker */}
              <line x1={crossX} y1={pad.t} x2={crossX} y2={H - pad.b} stroke="rgb(253,224,71)" strokeWidth={1.5} strokeDasharray="4,4" />
              <circle cx={crossX} cy={crossY} r={5} fill="rgb(253,224,71)" />
              <text x={crossX} y={pad.t - 2} textAnchor="middle" fill="rgb(253,224,71)" fontSize={11} fontWeight="bold" fontFamily="monospace">
                {COLLAPSE_YEAR} ☠️
              </text>

              {/* Now marker */}
              <line x1={x(NOW_YEAR)} y1={pad.t} x2={x(NOW_YEAR)} y2={H - pad.b} stroke="rgb(161,161,170)" strokeWidth={1} strokeDasharray="2,3" />
              <text x={x(NOW_YEAR)} y={H - pad.b + 22} textAnchor="middle" fill="rgb(161,161,170)" fontSize={10} fontFamily="monospace">
                NOW
              </text>

              {/* Legend */}
              <rect x={pad.l + 8} y={pad.t + 4} width={10} height={3} fill="rgb(34,211,238)" />
              <text x={pad.l + 22} y={pad.t + 9} fill="rgb(34,211,238)" fontSize={9} fontFamily="monospace">Productive</text>
              <rect x={pad.l + 8} y={pad.t + 16} width={10} height={3} fill="rgb(239,68,68)" />
              <text x={pad.l + 22} y={pad.t + 21} fill="rgb(239,68,68)" fontSize={9} fontFamily="monospace">Parasitic</text>
            </svg>
          </div>
        )}
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideEconomicCollapseClock;
