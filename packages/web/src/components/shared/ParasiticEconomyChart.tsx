"use client";

import { useEffect, useState } from "react";
import {
  DESTRUCTIVE_ECONOMY_50PCT_YEAR,
} from "@optimitron/data/parameters";

const COLLAPSE_YEAR = Math.round(DESTRUCTIVE_ECONOMY_50PCT_YEAR.value);
const NOW_YEAR = 2026;

const GDP_TRAJECTORIES_URL =
  "https://manual.warondisease.org/knowledge/economics/gdp-trajectories.html#two-paths";

const FAILED_STATES = [
  { name: "Argentina", pct: 38, color: "rgb(253,224,71)" },
  { name: "Yugoslavia", pct: 40, color: "rgb(244,114,182)" },
  { name: "Soviet Union", pct: 45, color: "rgb(34,211,238)" },
];

const CHART_START = 2015;
const CHART_END = 2045;
const PARASITIC_BASE = 11.5;
const GROWTH_RATE = Math.pow(50 / PARASITIC_BASE, 1 / (COLLAPSE_YEAR - 2020));

function parasiticAtYear(y: number): number {
  return Math.min(PARASITIC_BASE * Math.pow(GROWTH_RATE, y - 2020), 80);
}

const currentParasiticPct = Math.round(parasiticAtYear(NOW_YEAR) * 10) / 10;

// Chart coordinate helpers (percentage-based for CSS positioning)
function xPct(year: number): number {
  return ((year - CHART_START) / (CHART_END - CHART_START)) * 100;
}
function yPct(pct: number): number {
  return (1 - pct / 100) * 100;
}

// SVG uses a simple viewBox with generous padding for axis labels
const W = 100;
const H = 100;

function svgX(year: number): number {
  return (year - CHART_START) / (CHART_END - CHART_START) * W;
}
function svgY(pct: number): number {
  return (1 - pct / 100) * H;
}

const years = Array.from(
  { length: CHART_END - CHART_START + 1 },
  (_, i) => CHART_START + i,
);
const parasiticPath = years
  .map((yr) => `${svgX(yr).toFixed(2)},${svgY(parasiticAtYear(yr)).toFixed(2)}`)
  .join(" ");
const productivePath = years
  .map((yr) => `${svgX(yr).toFixed(2)},${svgY(100 - parasiticAtYear(yr)).toFixed(2)}`)
  .join(" ");

const YEAR_TICKS = [2015, 2020, 2025, 2030, 2035, 2040, 2045];
const PCT_TICKS = [0, 25, 50, 75, 100];

export function ParasiticEconomyChart() {
  const [countdownStr, setCountdownStr] = useState("");

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

  const crossXPct = xPct(COLLAPSE_YEAR);
  const nowXPct = xPct(NOW_YEAR);

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 w-full bg-black p-4 sm:p-6 md:p-8 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      {/* Countdown */}
      <div className="text-center">
        <h3 className="font-pixel text-xl sm:text-2xl md:text-4xl text-brutal-red uppercase">
          Countdown to Collapse
        </h3>
        <div
          className="font-pixel text-2xl sm:text-3xl md:text-5xl text-background mt-2 tabular-nums tracking-wider"
          data-volatile="collapse countdown"
        >
          {countdownStr}
        </div>
      </div>

      {/* Explainer */}
      <p className="text-xs sm:text-sm md:text-base font-bold text-center max-w-2xl" style={{ color: "rgb(161,161,170)" }}>
        The parasitic economy — military, cybercrime, fraud, and regulatory overhead — is currently{" "}
        <span className="text-brutal-red font-black">{currentParasiticPct}%</span> of global GDP
        and growing exponentially. Every civilisation that crossed 35–45% collapsed.
        At current rates, productive and parasitic lines cross in{" "}
        <span className="text-background font-black">{COLLAPSE_YEAR}</span>.
        This isn&apos;t a prediction. It&apos;s compound interest.
      </p>

      {/* Chart area: Y-axis labels + plot + X-axis labels, all HTML-positioned */}
      <div className="w-full">
        <div className="flex w-full">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between shrink-0 pr-1 sm:pr-2" style={{ width: "2.5rem" }}>
            {PCT_TICKS.slice().reverse().map((pct) => (
              <span
                key={pct}
                className="text-[10px] sm:text-xs font-bold text-right leading-none"
                style={{ color: "rgb(161,161,170)" }}
              >
                {pct}%
              </span>
            ))}
          </div>

          {/* Plot area */}
          <div className="flex-1 relative">
            {/* SVG — lines and grid only */}
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full block"
              style={{ aspectRatio: "5 / 3" }}
              preserveAspectRatio="none"
            >
              {/* Grid lines */}
              {PCT_TICKS.map((pct) => (
                <line
                  key={pct}
                  x1={0}
                  y1={svgY(pct)}
                  x2={W}
                  y2={svgY(pct)}
                  stroke="rgb(63,63,70)"
                  strokeWidth={0.3}
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              {/* Failed state dashed lines */}
              {FAILED_STATES.map((fs) => (
                <line
                  key={fs.name}
                  x1={0}
                  y1={svgY(fs.pct)}
                  x2={W}
                  y2={svgY(fs.pct)}
                  stroke={fs.color}
                  strokeWidth={0.5}
                  strokeDasharray="2,2"
                  opacity={0.5}
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              {/* Now vertical line */}
              <line
                x1={svgX(NOW_YEAR)}
                y1={0}
                x2={svgX(NOW_YEAR)}
                y2={H}
                stroke="rgb(161,161,170)"
                strokeWidth={0.5}
                strokeDasharray="2,3"
                vectorEffect="non-scaling-stroke"
              />

              {/* Crossover vertical line */}
              <line
                x1={svgX(COLLAPSE_YEAR)}
                y1={0}
                x2={svgX(COLLAPSE_YEAR)}
                y2={H}
                stroke="rgb(253,224,71)"
                strokeWidth={1}
                strokeDasharray="3,3"
                vectorEffect="non-scaling-stroke"
              />

              {/* Productive line */}
              <polyline
                points={productivePath}
                fill="none"
                stroke="rgb(34,211,238)"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
              {/* Parasitic line */}
              <polyline
                points={parasiticPath}
                fill="none"
                stroke="rgb(239,68,68)"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />

              {/* Crossover dot */}
              <circle
                cx={svgX(COLLAPSE_YEAR)}
                cy={svgY(50)}
                r={3}
                fill="rgb(253,224,71)"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* HTML overlay labels — responsive text that doesn't scale with SVG */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Failed state labels */}
              {FAILED_STATES.map((fs, i) => {
                const onRight = i % 2 === 0;
                return (
                  <a
                    key={fs.name}
                    href={GDP_TRAJECTORIES_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pointer-events-auto absolute text-[9px] sm:text-[11px] md:text-xs font-bold whitespace-nowrap leading-none hover:underline"
                    style={{
                      color: fs.color,
                      top: `${yPct(fs.pct)}%`,
                      transform: "translateY(-100%)",
                      ...(onRight
                        ? { right: "4px" }
                        : { left: "4px" }),
                    }}
                  >
                    <span className="bg-black/80 px-1 py-0.5 rounded-sm">
                      {fs.name} ({fs.pct}%)
                    </span>
                  </a>
                );
              })}

              {/* NOW label */}
              <span
                className="absolute text-[10px] sm:text-xs font-bold"
                style={{
                  color: "rgb(161,161,170)",
                  left: `${nowXPct}%`,
                  top: 0,
                  transform: "translate(-50%, -100%)",
                }}
              >
                NOW
              </span>

              {/* Collapse year label */}
              <span
                className="absolute text-[10px] sm:text-xs md:text-sm font-black"
                style={{
                  color: "rgb(253,224,71)",
                  left: `${crossXPct}%`,
                  top: 0,
                  transform: "translate(-50%, -100%)",
                }}
              >
                {COLLAPSE_YEAR}
              </span>
            </div>
          </div>
        </div>

        {/* X-axis year labels */}
        <div className="flex justify-between pl-10" style={{ marginTop: "2px" }}>
          {YEAR_TICKS.map((yr) => (
            <span
              key={yr}
              className="text-[10px] sm:text-xs font-bold"
              style={{ color: "rgb(161,161,170)" }}
            >
              {yr}
            </span>
          ))}
        </div>
      </div>

      {/* Legend — HTML, fully responsive */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-1">
        <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold" style={{ color: "rgb(34,211,238)" }}>
          <span className="inline-block w-3 h-1 rounded-sm" style={{ background: "rgb(34,211,238)" }} />
          Productive Economy
        </span>
        <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold" style={{ color: "rgb(239,68,68)" }}>
          <span className="inline-block w-3 h-1 rounded-sm" style={{ background: "rgb(239,68,68)" }} />
          Parasitic Economy
        </span>
        <span className="text-[10px] sm:text-xs font-bold italic" style={{ color: "rgb(161,161,170)" }}>
          % of GDP
        </span>
      </div>
    </div>
  );
}
