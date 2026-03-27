"use client";

import { SlideBase } from "../slide-base";
import { useEffect, useState } from "react";

interface PolicyRow {
  policy: string;
  ccs: number;
  action: "ENACT" | "MAINTAIN" | "REPLACE" | "REPEAL";
}

const POLICIES: PolicyRow[] = [
  { policy: "🇵🇹 Drug Decriminalization", ccs: 0.87, action: "ENACT" },
  { policy: "🏥 Universal Healthcare",    ccs: 0.82, action: "MAINTAIN" },
  { policy: "📚 School Choice Programs",  ccs: 0.64, action: "REPLACE" },
  { policy: "⚔️  War on Drugs",           ccs: 0.12, action: "REPEAL" },
  { policy: "🏦 Quantitative Easing",     ccs: 0.19, action: "REPEAL" },
];

const ROW_STAGGER_MS = 500;
const PHASE_1_MS = 500;
const PHASE_2_MS = 1500;
const PHASE_3_START_MS = PHASE_2_MS + 400;
const PHASE_4_MS = PHASE_3_START_MS + POLICIES.length * ROW_STAGGER_MS + 800;

function actionColor(action: PolicyRow["action"]): string {
  switch (action) {
    case "ENACT":
    case "MAINTAIN":
      return "text-emerald-400";
    case "REPLACE":
      return "text-amber-400";
    case "REPEAL":
      return "text-red-400";
  }
}

function actionBadgeBg(action: PolicyRow["action"]): string {
  switch (action) {
    case "ENACT":
    case "MAINTAIN":
      return "bg-emerald-950 border border-emerald-700";
    case "REPLACE":
      return "bg-amber-950 border border-amber-700";
    case "REPEAL":
      return "bg-red-950 border border-red-800";
  }
}

function actionIcon(action: PolicyRow["action"]): string {
  switch (action) {
    case "ENACT":
    case "MAINTAIN":
      return "✅";
    case "REPLACE":
      return "🔄";
    case "REPEAL":
      return "❌";
  }
}

export function SlidePolicyEngine() {
  const [phase, setPhase] = useState(0);
  const [visibleRows, setVisibleRows] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase(1), PHASE_1_MS));
    timers.push(setTimeout(() => setPhase(2), PHASE_2_MS));

    POLICIES.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setPhase((p) => Math.max(p, 3));
          setVisibleRows(i + 1);
        }, PHASE_3_START_MS + i * ROW_STAGGER_MS)
      );
    });

    timers.push(setTimeout(() => setPhase(4), PHASE_4_MS));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SlideBase act={2}>
      <style jsx>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeSlideUp 0.4s ease-out forwards;
        }
        @keyframes gentlePulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
        .gentle-pulse {
          animation: gentlePulse 2s ease-in-out infinite;
        }
      `}</style>

      <div className="flex flex-col items-center gap-5 w-full max-w-[1700px] mx-auto">

        {/* Phase 1 — Title */}
        <div
          className={`text-center transition-opacity duration-700 ${
            phase >= 1 ? "opacity-100" : "opacity-0"
          }`}
        >
          <h1 className="font-pixel text-3xl md:text-5xl text-emerald-400">
            🔬 OPTIMAL POLICY GENERATOR
          </h1>
        </div>

        {/* Phase 2+ — Table */}
        {phase >= 2 && (
          <div className="w-full bg-black/40 border border-zinc-700 rounded fade-in">

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 pt-3 pb-2 border-b border-zinc-700">
              <div className="font-pixel text-xl md:text-3xl text-zinc-400 uppercase tracking-widest">
                POLICY
              </div>
              <div className="font-pixel text-xl md:text-3xl text-zinc-400 uppercase tracking-widest text-center w-28 md:w-40">
                EVIDENCE
              </div>
              <div className="font-pixel text-xl md:text-3xl text-zinc-400 uppercase tracking-widest text-center w-32 md:w-44">
                ACTION
              </div>
            </div>

            {/* Data rows */}
            <div className="divide-y divide-zinc-800">
              {POLICIES.map((row, i) => {
                if (i >= visibleRows) return null;

                return (
                  <div
                    key={row.policy}
                    className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-3 items-center fade-in"
                  >
                    {/* Policy name */}
                    <div className="font-pixel text-xl md:text-3xl text-zinc-100">
                      {row.policy}
                    </div>

                    {/* CCS score */}
                    <div className="text-center w-28 md:w-40">
                      <span className={`font-pixel text-xl md:text-3xl ${actionColor(row.action)}`}>
                        {row.ccs.toFixed(2)}
                      </span>
                    </div>

                    {/* Action badge */}
                    <div className="flex justify-center w-32 md:w-44">
                      <span
                        className={`font-pixel text-xl md:text-3xl px-2 py-0.5 rounded ${actionColor(row.action)} ${actionBadgeBg(row.action)}`}
                      >
                        {actionIcon(row.action)} {row.action}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CCS label — appears after all rows */}
            {phase >= 3 && visibleRows >= POLICIES.length && (
              <div className="border-t border-zinc-800 px-4 py-2 fade-in">
                <span className="font-terminal text-xl text-zinc-500">
                  CCS = Causal Confidence Score
                </span>
              </div>
            )}
          </div>
        )}

        {/* Phase 4 — Punchline */}
        {phase >= 4 && (
          <p className="font-terminal text-2xl md:text-4xl text-zinc-200 text-center fade-in gentle-pulse">
            Ranked by what actually happened. Not by who donated.
          </p>
        )}

      </div>
    </SlideBase>
  );
}
