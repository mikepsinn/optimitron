"use client";

import { SlideBase } from "../slide-base";
import { useEffect, useState } from "react";
import { useDemoStore } from "@/lib/demo/store";
import { PALETTE_SEMANTIC, type PaletteMode } from "@/lib/demo/palette";

type Action = "ENACT" | "MAINTAIN" | "REPLACE" | "REPEAL";
type EvidenceGrade = "A" | "B" | "C" | "D" | "F";

interface PolicyRow {
  policy: string;
  health: number; // years gained/lost
  income: number; // pp/yr change
  grade: EvidenceGrade;
  action: Action;
  detail?: string; // current → target for REPLACE
}

// Based on OPG test fixtures and paper examples
const POLICIES: PolicyRow[] = [
  { policy: "🇵🇹 Drug Decriminalization", health: 0.25, income: 0.03, grade: "A", action: "ENACT" },
  { policy: "🏥 Universal Healthcare", health: 0.40, income: 0.05, grade: "A", action: "MAINTAIN" },
  { policy: "🚬 Tobacco Tax", health: 0.25, income: -0.02, grade: "A", action: "REPLACE", detail: "$1.41→$2.50" },
  { policy: "⚔️  War on Drugs", health: -0.15, income: -0.01, grade: "F", action: "REPEAL" },
  { policy: "🏦 Quantitative Easing", health: 0.0, income: -0.03, grade: "D", action: "REPEAL" },
];

const ROW_STAGGER_MS = 500;
const PHASE_1_MS = 500;
const PHASE_2_MS = 1500;
const PHASE_3_START_MS = PHASE_2_MS + 400;
const PHASE_4_MS = PHASE_3_START_MS + POLICIES.length * ROW_STAGGER_MS + 800;

function actionIcon(action: Action): string {
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

function formatEffect(value: number, unit: string): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}${unit}`;
}

type Palette = (typeof PALETTE_SEMANTIC)[PaletteMode];

function effectColor(
  value: number,
  palette: Palette,
): string {
  if (value > 0) return palette.success;
  if (value < 0) return palette.danger;
  return palette.muted;
}

function gradeColor(
  grade: EvidenceGrade,
  palette: Palette,
): string {
  switch (grade) {
    case "A":
      return palette.success;
    case "B":
      return palette.primary;
    case "C":
      return palette.accent;
    case "D":
      return palette.danger;
    case "F":
      return palette.danger;
  }
}

export function SlideOptimalPolicyGenerator() {
  const [phase, setPhase] = useState(0);
  const [visibleRows, setVisibleRows] = useState(0);
  const { palette: paletteMode } = useDemoStore();
  const palette = PALETTE_SEMANTIC[paletteMode];

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

  function actionColor(action: Action): string {
    switch (action) {
      case "ENACT":
      case "MAINTAIN":
        return palette.success;
      case "REPLACE":
        return palette.accent;
      case "REPEAL":
        return palette.danger;
    }
  }

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
          <h1
            className="font-pixel text-3xl md:text-5xl"
            style={{ color: palette.success }}
          >
            🔬 OPTIMAL POLICY GENERATOR
          </h1>
        </div>

        {/* Phase 2+ — Table */}
        {phase >= 2 && (
          <div
            className="w-full rounded fade-in"
            style={{
              backgroundColor: "rgba(0,0,0,0.4)",
              border: `1px solid ${palette.border}`,
            }}
          >

            {/* Column headers */}
            <div
              className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 px-4 pt-3 pb-2"
              style={{ borderBottom: `1px solid ${palette.border}` }}
            >
              <div className="font-pixel text-lg md:text-2xl uppercase tracking-widest" style={{ color: palette.muted }}>
                Policy
              </div>
              <div className="font-pixel text-lg md:text-2xl uppercase tracking-widest text-center w-28 md:w-36" style={{ color: palette.muted }}>
                Health
              </div>
              <div className="font-pixel text-lg md:text-2xl uppercase tracking-widest text-center w-28 md:w-36" style={{ color: palette.muted }}>
                Income
              </div>
              <div className="font-pixel text-lg md:text-2xl uppercase tracking-widest text-center w-16 md:w-24" style={{ color: palette.muted }}>
                Grade
              </div>
              <div className="font-pixel text-lg md:text-2xl uppercase tracking-widest text-center w-32 md:w-44" style={{ color: palette.muted }}>
                Action
              </div>
            </div>

            {/* Data rows */}
            <div>
              {POLICIES.map((row, i) => {
                if (i >= visibleRows) return null;

                return (
                  <div
                    key={row.policy}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 px-4 py-3 items-center fade-in"
                    style={{ borderBottom: i < POLICIES.length - 1 ? `1px solid ${palette.border}20` : undefined }}
                  >
                    {/* Policy name + detail */}
                    <div>
                      <div className="font-pixel text-lg md:text-2xl" style={{ color: palette.foreground }}>
                        {row.policy}
                      </div>
                      {row.detail && (
                        <div className="font-terminal text-sm md:text-base mt-0.5" style={{ color: palette.muted }}>
                          {row.detail}
                        </div>
                      )}
                    </div>

                    {/* Health effect */}
                    <div className="text-center w-28 md:w-36">
                      <span
                        className="font-pixel text-lg md:text-2xl"
                        style={{ color: effectColor(row.health, palette) }}
                      >
                        {formatEffect(row.health, " yrs")}
                      </span>
                    </div>

                    {/* Income effect */}
                    <div className="text-center w-28 md:w-36">
                      <span
                        className="font-pixel text-lg md:text-2xl"
                        style={{ color: effectColor(row.income, palette) }}
                      >
                        {formatEffect(row.income, " pp")}
                      </span>
                    </div>

                    {/* Evidence grade */}
                    <div className="text-center w-16 md:w-24">
                      <span
                        className="font-pixel text-xl md:text-3xl font-bold"
                        style={{ color: gradeColor(row.grade, palette) }}
                      >
                        {row.grade}
                      </span>
                    </div>

                    {/* Action badge */}
                    <div className="flex justify-center w-32 md:w-44">
                      <span
                        className="font-pixel text-lg md:text-2xl px-2 py-0.5 rounded border"
                        style={{
                          color: actionColor(row.action),
                          borderColor: actionColor(row.action),
                          backgroundColor: `${actionColor(row.action)}15`,
                        }}
                      >
                        {actionIcon(row.action)} {row.action}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend — appears after all rows */}
            {phase >= 3 && visibleRows >= POLICIES.length && (
              <div className="px-4 py-2 fade-in" style={{ borderTop: `1px solid ${palette.border}20` }}>
                <span className="font-terminal text-base md:text-lg" style={{ color: palette.muted }}>
                  Health = healthy life-years gained · Income = income growth pp/yr · Grade = A-F evidence strength
                </span>
              </div>
            )}
          </div>
        )}

        {/* Phase 4 — Punchline */}
        {phase >= 4 && (
          <p
            className="font-terminal text-2xl md:text-4xl text-center fade-in gentle-pulse"
            style={{ color: palette.foreground }}
          >
            Ranked by what actually happened. Not by who donated.
          </p>
        )}

      </div>
    </SlideBase>
  );
}
