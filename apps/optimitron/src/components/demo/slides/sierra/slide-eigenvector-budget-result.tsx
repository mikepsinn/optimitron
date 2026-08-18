"use client";

import { useEffect, useState } from "react";
import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { US_WISHOCRATIC_ITEMS } from "@optimitron/data/datasets/us-wishocratic-items";

// Realistic citizen allocation based on survey data, ROI evidence, and revealed preferences.
// Healthcare/education dominate when people are asked directly (Gallup, Pew).
// Military drops from ~50% of discretionary to ~10% when citizens allocate.
// Public goods with high ROI (infrastructure, R&D) get more than status quo.
const ITEMS = [
  { ...US_WISHOCRATIC_ITEMS.PRAGMATIC_CLINICAL_TRIALS, pct: 18, color: "#34d399" },
  { ...US_WISHOCRATIC_ITEMS.EARLY_CHILDHOOD_EDUCATION, pct: 16, color: "#22d3ee" },
  { ...US_WISHOCRATIC_ITEMS.ADDICTION_TREATMENT, pct: 12, color: "#60a5fa" },
  { ...US_WISHOCRATIC_ITEMS.UNIVERSAL_BASIC_INCOME, pct: 11, color: "#a78bfa" },
  { ...US_WISHOCRATIC_ITEMS.CYBERSECURITY, pct: 10, color: "#f59e0b" },
  { ...US_WISHOCRATIC_ITEMS.POLICING_VIOLENT_CRIME, pct: 10, color: "#fb923c" },
  { ...US_WISHOCRATIC_ITEMS.MILITARY_OPERATIONS, pct: 9, color: "#f87171" },
  { ...US_WISHOCRATIC_ITEMS.NUCLEAR_WEAPONS_MODERNIZATION, pct: 6, color: "#ef4444" },
  { ...US_WISHOCRATIC_ITEMS.DRUG_WAR, pct: 5, color: "#dc2626" },
  { ...US_WISHOCRATIC_ITEMS.VIOLENT_CRIME_INCARCERATION, pct: 3, color: "#b91c1c" },
];

// Build pie chart segments
function buildPieSegments(items: typeof ITEMS) {
  const segments: { startAngle: number; endAngle: number; color: string }[] = [];
  let cumulative = 0;
  for (const item of items) {
    const startAngle = (cumulative / 100) * 360;
    cumulative += item.pct;
    const endAngle = (cumulative / 100) * 360;
    segments.push({ startAngle, endAngle, color: item.color });
  }
  return segments;
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

const PIE_SEGMENTS = buildPieSegments(ITEMS);

export function SlideEigenvectorBudgetResult() {
  const [phase, setPhase] = useState(0);
  const [visibleSegments, setVisibleSegments] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase(1), 500));
    timers.push(setTimeout(() => setPhase(2), 1500));

    // Stagger pie segments
    ITEMS.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleSegments(i + 1), 1500 + i * 200));
    });

    timers.push(setTimeout(() => setPhase(3), 1500 + ITEMS.length * 200 + 500));
    timers.push(setTimeout(() => setPhase(4), 1500 + ITEMS.length * 200 + 2000));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SierraSlideWrapper act={2}>
      <style jsx>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeSlideUp 0.5s ease-out forwards; }
      `}</style>

      <div className="flex flex-col items-center justify-center gap-4 max-w-[1700px] mx-auto w-full">
        {/* Title */}
        {phase >= 1 && (
          <div className="text-center fade-in">
            <h1 className="font-pixel text-2xl md:text-4xl text-emerald-400">
              📊 CITIZEN-DIRECTED BUDGET
            </h1>
            <div className="font-terminal text-xl md:text-2xl text-zinc-200 mt-1">
              What happens when you actually ask 8 billion people
            </div>
          </div>
        )}

        {/* Pie chart + Legend side by side */}
        {phase >= 2 && (
          <div className="w-full flex flex-col md:flex-row items-center gap-6 fade-in">
            {/* Pie chart */}
            <div className="shrink-0">
              <svg viewBox="0 0 200 200" width="280" height="280">
                {PIE_SEGMENTS.slice(0, visibleSegments).map((seg, i) => (
                  <path
                    key={i}
                    d={describeArc(100, 100, 95, seg.startAngle, seg.endAngle)}
                    fill={seg.color}
                    stroke="black"
                    strokeWidth="1.5"
                    className="transition-opacity duration-300"
                  />
                ))}
                {/* Center hole for donut effect */}
                <circle cx="100" cy="100" r="40" fill="black" />
                <text x="100" y="96" textAnchor="middle" className="font-pixel" fill="#34d399" fontSize="12">
                  YOUR
                </text>
                <text x="100" y="112" textAnchor="middle" className="font-pixel" fill="#34d399" fontSize="12">
                  BUDGET
                </text>
              </svg>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-1.5">
              {ITEMS.slice(0, visibleSegments).map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 shrink-0 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xl md:text-2xl">{item.icon}</span>
                  <span className="font-pixel text-lg md:text-xl text-zinc-200 flex-1">
                    {item.name}
                  </span>
                  <span className="font-pixel text-lg md:text-xl text-zinc-300">
                    {item.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observation */}
        {phase >= 3 && (
          <div className="w-full bg-black/40 border border-emerald-500/30 rounded p-4 fade-in text-center">
            <div className="font-pixel text-xl md:text-2xl text-emerald-400">
              When you ask people what they want, cures beat bombs.
            </div>
            <div className="font-pixel text-xl md:text-2xl text-zinc-200 mt-1">
              Nobody has ever asked.
            </div>
          </div>
        )}

        {/* Punchline */}
        {phase >= 4 && (
          <p className="font-terminal text-xl md:text-3xl text-zinc-200 italic text-center fade-in">
            You just did in 2 minutes what your legislature fails to do in 2 years.
          </p>
        )}
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideEigenvectorBudgetResult;
