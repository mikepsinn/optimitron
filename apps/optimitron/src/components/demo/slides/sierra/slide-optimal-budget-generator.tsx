"use client";

import { useEffect, useState } from "react";
import { SierraSlideWrapper } from "./SierraSlideWrapper";
import {
  HEALTH_SYSTEM_COMPARISON,
  EDUCATION_COMPARISON,
} from "@optimitron/data/datasets/international-comparisons";
import {
  US_MILITARY_SPENDING_2024_ANNUAL,
  US_GOV_WASTE_MILITARY_OVERSPEND,
  HEALTHCARE_VS_MILITARY_MULTIPLIER_RATIO,
} from "@optimitron/data/parameters";

/* ── Pull real data from international comparisons ───────────────── */

const usa = HEALTH_SYSTEM_COMPARISON.find((c) => c.iso3 === "USA")!;
const sgp = HEALTH_SYSTEM_COMPARISON.find((c) => c.iso3 === "SGP")!;

const usaEdu = EDUCATION_COMPARISON.find((c) => c.iso3 === "USA")!;
const sgpEdu = EDUCATION_COMPARISON.find((c) => c.iso3 === "SGP")!;

const healthOverspendRatio = (usa.healthSpendingPerCapita / sgp.healthSpendingPerCapita).toFixed(1);
const lifeExpGap = (sgp.lifeExpectancy - usa.lifeExpectancy).toFixed(1);

const usMilitary = Math.round(US_MILITARY_SPENDING_2024_ANNUAL.value / 1e9);
const milDeterrence = Math.round(
  (US_MILITARY_SPENDING_2024_ANNUAL.value - US_GOV_WASTE_MILITARY_OVERSPEND.value) / 1e9
);
const milOverspendRatio = (US_MILITARY_SPENDING_2024_ANNUAL.value /
  (US_MILITARY_SPENDING_2024_ANNUAL.value - US_GOV_WASTE_MILITARY_OVERSPEND.value)).toFixed(1);
const milMultiplier = HEALTHCARE_VS_MILITARY_MULTIPLIER_RATIO.value.toFixed(0);

const eduPisaGap = sgpEdu.pisaScoreMath - usaEdu.pisaScoreMath;
const eduSpendRatio = (usaEdu.educationSpendingPctGDP / sgpEdu.educationSpendingPctGDP).toFixed(1);

/* ── Row definitions ─────────────────────────────────────────────── */

interface BudgetRow {
  emoji: string;
  label: string;
  usaSpend: string;
  usaOutcome: string;
  benchmarkCountry: string;
  benchmarkFlag: string;
  benchmarkSpend: string;
  benchmarkOutcome: string;
  overspend: string;
}

const ROWS: BudgetRow[] = [
  {
    emoji: "🏥",
    label: "Healthcare",
    usaSpend: `$${(usa.healthSpendingPerCapita / 1000).toFixed(1)}K/person`,
    usaOutcome: `${usa.lifeExpectancy} yrs life exp`,
    benchmarkCountry: "Singapore",
    benchmarkFlag: "🇸🇬",
    benchmarkSpend: `$${(sgp.healthSpendingPerCapita / 1000).toFixed(1)}K/person`,
    benchmarkOutcome: `${sgp.lifeExpectancy} yrs life exp`,
    overspend: `${healthOverspendRatio}×`,
  },
  {
    emoji: "⚔️",
    label: "Military",
    usaSpend: `$${usMilitary}B`,
    usaOutcome: `0.6× econ multiplier`,
    benchmarkCountry: "Deterrence",
    benchmarkFlag: "🛡️",
    benchmarkSpend: `$${milDeterrence}B`,
    benchmarkOutcome: `realloc → ${milMultiplier}× ROI`,
    overspend: `${milOverspendRatio}×`,
  },
  {
    emoji: "📚",
    label: "Education",
    usaSpend: `${usaEdu.educationSpendingPctGDP}% GDP`,
    usaOutcome: `PISA math: ${usaEdu.pisaScoreMath}`,
    benchmarkCountry: "Singapore",
    benchmarkFlag: "🇸🇬",
    benchmarkSpend: `${sgpEdu.educationSpendingPctGDP}% GDP`,
    benchmarkOutcome: `PISA math: ${sgpEdu.pisaScoreMath}`,
    overspend: `${eduSpendRatio}×`,
  },
];

/* ── Animation timing ────────────────────────────────────────────── */

const ROW_STAGGER_MS = 600;
const PHASE_1_MS = 500;
const PHASE_2_MS = 1500;
const PHASE_3_MS = PHASE_2_MS + ROWS.length * ROW_STAGGER_MS + 500;
const PHASE_4_MS = PHASE_3_MS + 1500;

export function SlideOptimalBudgetGenerator() {
  const [phase, setPhase] = useState(0);
  const [visibleRows, setVisibleRows] = useState(0);
  const [flashingCurrentRow, setFlashingCurrentRow] = useState<number | null>(null);
  const [flashingBenchmarkRow, setFlashingBenchmarkRow] = useState<number | null>(null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase(1), PHASE_1_MS));

    ROWS.forEach((_, i) => {
      const rowDelay = PHASE_2_MS + i * ROW_STAGGER_MS;
      timers.push(
        setTimeout(() => {
          setPhase((p) => Math.max(p, 2));
          setVisibleRows(i + 1);
          setFlashingCurrentRow(i);
          timers.push(
            setTimeout(() => {
              setFlashingCurrentRow(null);
              setFlashingBenchmarkRow(i);
              timers.push(setTimeout(() => setFlashingBenchmarkRow(null), 300));
            }, 300)
          );
        }, rowDelay)
      );
    });

    timers.push(setTimeout(() => setPhase(3), PHASE_3_MS));
    timers.push(setTimeout(() => setPhase(4), PHASE_4_MS));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SierraSlideWrapper act={2}>
      <style jsx>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeSlideUp 0.4s ease-out forwards; }

        @keyframes flashRed {
          0%, 100% { background-color: transparent; }
          50%      { background-color: rgba(239, 68, 68, 0.18); }
        }
        .flash-red { animation: flashRed 0.3s ease-out; }

        @keyframes flashGreen {
          0%, 100% { background-color: transparent; }
          50%      { background-color: rgba(16, 185, 129, 0.18); }
        }
        .flash-green { animation: flashGreen 0.3s ease-out; }

        @keyframes gentlePulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.6; }
        }
        .gentle-pulse { animation: gentlePulse 1.8s ease-in-out infinite; }
      `}</style>

      <div className="flex flex-col items-center justify-center gap-5 max-w-[1700px] mx-auto w-full">
        {/* Phase 1: Title */}
        {phase >= 1 && (
          <div className="text-center fade-in">
            <h1 className="font-pixel text-3xl md:text-5xl text-amber-400">
              💰 OPTIMAL BUDGET GENERATOR
            </h1>
          </div>
        )}

        {/* Phase 2: Comparison table */}
        {phase >= 2 && (
          <div className="w-full bg-black/40 border border-zinc-700 rounded fade-in">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_2fr_2fr_0.8fr] gap-2 px-3 pt-3 pb-2 border-b border-zinc-800">
              <div />
              <div className="font-pixel text-lg md:text-2xl text-red-400 text-center">
                🇺🇸 USA (CURRENT)
              </div>
              <div className="font-pixel text-lg md:text-2xl text-emerald-400 text-center">
                CHEAPEST HIGH PERFORMER
              </div>
              <div className="font-pixel text-lg md:text-2xl text-amber-400 text-center">
                OVERSPEND
              </div>
            </div>

            {/* Data rows */}
            <div className="divide-y divide-zinc-800">
              {ROWS.map((row, i) => {
                if (i >= visibleRows) return null;
                const isFlashingCurrent = flashingCurrentRow === i;
                const isFlashingBenchmark = flashingBenchmarkRow === i;

                return (
                  <div
                    key={row.label}
                    className="grid grid-cols-[1fr_2fr_2fr_0.8fr] gap-2 px-3 py-2 items-center fade-in"
                  >
                    {/* Category */}
                    <div className="font-pixel text-lg md:text-2xl text-zinc-200">
                      {row.emoji} {row.label}
                    </div>

                    {/* USA current */}
                    <div
                      className={`text-center rounded px-1 py-1 ${isFlashingCurrent ? "flash-red" : ""}`}
                    >
                      <div className="font-pixel text-lg md:text-2xl text-red-400">
                        {row.usaSpend}
                      </div>
                      <div className="font-pixel text-sm md:text-lg text-zinc-400">
                        {row.usaOutcome}
                      </div>
                    </div>

                    {/* Benchmark */}
                    <div
                      className={`text-center rounded px-1 py-1 ${isFlashingBenchmark ? "flash-green" : ""}`}
                    >
                      <div className="font-pixel text-lg md:text-2xl text-emerald-400">
                        {row.benchmarkFlag} {row.benchmarkSpend}
                      </div>
                      <div className="font-pixel text-sm md:text-lg text-emerald-400/80">
                        {row.benchmarkOutcome}
                      </div>
                    </div>

                    {/* Overspend ratio */}
                    <div className="text-center">
                      <span className="font-pixel text-xl md:text-3xl text-red-400">
                        {row.overspend}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Phase 3: Summary — the punchline */}
            {phase >= 3 && (
              <div className="border-t-2 border-amber-500/50 px-3 pt-3 pb-3 mt-1 fade-in">
                <div className="grid grid-cols-[1fr_2fr_2fr_0.8fr] gap-2 items-center">
                  <div className="font-pixel text-lg md:text-2xl text-zinc-200">
                    PATTERN:
                  </div>
                  <div className="text-center">
                    <span className="font-pixel text-lg md:text-2xl text-red-400">
                      more money, worse outcomes
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="font-pixel text-lg md:text-2xl text-emerald-400 gentle-pulse">
                      less money, better outcomes
                    </span>
                  </div>
                  <div />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Phase 4: Subtitle */}
        {phase >= 4 && (
          <p className="font-terminal text-xl md:text-2xl text-zinc-300 text-center fade-in max-w-[1200px]">
            Identifies the highest-performing, lowest-spending countries to map the efficient frontier of public policy.
          </p>
        )}
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideOptimalBudgetGenerator;
