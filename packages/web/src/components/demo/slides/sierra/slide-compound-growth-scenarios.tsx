"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { formatCurrency } from "@/lib/demo/formatters";
import {
  GLOBAL_AVG_INCOME_2025,
  TREATY_TRAJECTORY_AVG_INCOME_YEAR_15,
  WISHONIA_TRAJECTORY_AVG_INCOME_YEAR_15,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  DESTRUCTIVE_ECONOMY_50PCT_YEAR,
  TREATY_HALE_GAIN_YEAR_15,
  WISHONIA_HALE_GAIN_YEAR_15,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
} from "@optimitron/data/parameters";
import { useEffect, useState } from "react";

const statusQuoIncome = Math.round(GLOBAL_AVG_INCOME_2025.value);
const treatyIncome = Math.round(TREATY_TRAJECTORY_AVG_INCOME_YEAR_15.value);
const optimalIncome = Math.round(WISHONIA_TRAJECTORY_AVG_INCOME_YEAR_15.value);
const globalDysfunctionCostT = Math.round(POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL.value / 1e12);
const collapseYearsLeft = Math.round(DESTRUCTIVE_ECONOMY_50PCT_YEAR.value) - new Date().getFullYear();
const treatyHaleGain = Math.round(TREATY_HALE_GAIN_YEAR_15.value * 10) / 10;
const wishoniaHaleGain = Math.round(WISHONIA_HALE_GAIN_YEAR_15.value * 10) / 10;
const trialCapacityX = DFDA_TRIAL_CAPACITY_MULTIPLIER.value.toFixed(1);
const livesSavedB = (DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED.value / 1e9).toFixed(1);

const DYSFUNCTION_TAX_URL = "https://manual.warondisease.org/knowledge/appendix/political-dysfunction-tax.html";

interface BarData {
  label: string;
  detail: string;
  value: number;
  widthPct: number;
  colorBar: string;
  colorText: string;
}

const BARS: BarData[] = [
  {
    label: "😐 STATUS QUO",
    detail: `Parasitic economy overtakes productive in ${collapseYearsLeft} years`,
    value: statusQuoIncome,
    widthPct: (statusQuoIncome / optimalIncome) * 100,
    colorBar: "bg-zinc-500",
    colorText: "text-zinc-200",
  },
  {
    label: "🧪 1% TREATY",
    detail: `+${treatyHaleGain} healthy yrs · ${trialCapacityX}× trial capacity · ${livesSavedB}B lives saved`,
    value: treatyIncome,
    widthPct: (treatyIncome / optimalIncome) * 100,
    colorBar: "bg-brutal-cyan",
    colorText: "text-brutal-cyan",
  },
  {
    label: "🌍 OPTIMAL GOVERNANCE",
    detail: `+${wishoniaHaleGain} healthy yrs`,
    value: optimalIncome,
    widthPct: 100,
    colorBar: "bg-brutal-yellow",
    colorText: "text-brutal-yellow",
  },
];

export function SlideCompoundGrowthScenarios() {
  const [phase, setPhase] = useState(0);
  const [barsVisible, setBarsVisible] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setBarsVisible(1), 2000),
      setTimeout(() => setBarsVisible(2), 5000),
      setTimeout(() => setBarsVisible(3), 8000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SierraSlideWrapper act={2}>
      <div className="flex flex-col gap-4 w-full max-w-[1700px] mx-auto">
        {/* Title */}
        {phase >= 1 && (
          <h1 className="font-pixel text-xl md:text-2xl text-amber-400 text-center slide-fade-in">
            PLEASE SELECT AN EARTH
          </h1>
        )}

        {/* Bars */}
        {phase >= 2 && (
          <div className="space-y-4">
            {BARS.map((bar, i) => {
              const visible = barsVisible > i;
              const isOptimal = i === 2;
              return (
                <div
                  key={bar.label}
                  className={`bg-muted border-2 border-primary rounded p-3 md:p-4 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className={`font-pixel text-lg md:text-xl ${bar.colorText}`}>
                        {bar.label}
                      </div>
                      <div className="font-terminal text-lg md:text-xl text-zinc-400">
                        {isOptimal ? (
                          <>
                            End the ${globalDysfunctionCostT}T/yr{" "}
                            <a href={DYSFUNCTION_TAX_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-brutal-yellow">
                              Political Dysfunction Tax
                            </a>
                            {" · "}+{wishoniaHaleGain} healthy yrs
                          </>
                        ) : bar.detail}
                      </div>
                    </div>
                    <span className={`font-pixel text-xl md:text-2xl ${bar.colorText} shrink-0 ml-2`}>
                      <a href="https://manual.warondisease.org/knowledge/economics/gdp-trajectories.html" target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {formatCurrency(bar.value)} / person / yr
                      </a>
                    </span>
                  </div>
                  <div className="h-6 md:h-8 bg-zinc-800 rounded overflow-hidden">
                    <div
                      className={`h-full ${bar.colorBar} rounded bar-fill`}
                      style={{ "--target-width": `${bar.widthPct}%` } as React.CSSProperties}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-fade-in {
          animation: slide-fade-in 0.4s ease-out forwards;
        }
        @keyframes bar-fill {
          from { width: 0%; }
          to { width: var(--target-width); }
        }
        .bar-fill {
          animation: bar-fill 1.5s ease-out forwards;
        }
      `}</style>
    </SierraSlideWrapper>
  );
}
export default SlideCompoundGrowthScenarios;
