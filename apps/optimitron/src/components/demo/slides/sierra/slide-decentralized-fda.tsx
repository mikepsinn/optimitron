"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { useEffect, useState } from "react";

/**
 * Simplified "Outcome Label" — like a nutrition label for treatments.
 * Based on dih-neobrutalist OutcomeLabel component.
 */
const OUTCOME_LABEL = {
  treatment: "Atorvastatin 20mg",
  tag: "Lipid-lowering agent",
  outcomes: [
    { name: "LDL Cholesterol", change: -43, detail: "-69 mg/dL", positive: true },
    { name: "Cardiovascular Risk", change: -36, detail: "-4.2%", positive: true },
    { name: "HDL Cholesterol", change: 5, detail: "+2.3 mg/dL", positive: true },
  ],
  sideEffects: [
    { name: "Muscle Pain", pct: 8.2 },
    { name: "Liver Enzymes", pct: 1.2 },
  ],
  source: "42 trials, 48,500 participants",
};

/**
 * Simplified treatment rankings for a condition.
 * Based on dih-neobrutalist TreatmentRankings/InterventionCard.
 */
const TREATMENT_RANKINGS = [
  { rank: 1, name: "Atorvastatin 20mg", effectiveness: 87, safety: 92, confidence: 95 },
  { rank: 2, name: "Rosuvastatin 10mg", effectiveness: 84, safety: 89, confidence: 91 },
  { rank: 3, name: "Ezetimibe 10mg", effectiveness: 62, safety: 96, confidence: 88 },
];

export function SlideDecentralizedFda() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase(1), 500));
    timers.push(setTimeout(() => setPhase(2), 1500));
    timers.push(setTimeout(() => setPhase(3), 3500));
    timers.push(setTimeout(() => setPhase(4), 6000));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SierraSlideWrapper act={2} className="text-emerald-400">
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fade-in 0.4s ease-out forwards; }
        @keyframes bar-fill {
          from { width: 0; }
        }
        .bar-fill { animation: bar-fill 0.8s ease-out forwards; }
      `}</style>

      <div className="flex flex-col items-center justify-center gap-4 w-full max-w-[1700px] mx-auto">
        {/* Title */}
        {phase >= 1 && (
          <h1 className="font-pixel text-3xl md:text-5xl text-cyan-400 text-center fade-in">
            THE DECENTRALIZED FDA
          </h1>
        )}

        {/* Two panels side by side */}
        {phase >= 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full fade-in">
            {/* LEFT — Outcome Label */}
            <div className="bg-zinc-900/80 border border-cyan-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-pixel text-xl md:text-2xl text-cyan-400">
                  OUTCOME LABEL
                </div>
                <div className="font-terminal text-base text-zinc-400 bg-cyan-500/10 px-2 py-1 rounded">
                  {OUTCOME_LABEL.tag}
                </div>
              </div>

              <div className="font-pixel text-lg md:text-2xl text-zinc-200 mb-3">
                {OUTCOME_LABEL.treatment}
              </div>

              {/* Outcomes with bars */}
              <div className="space-y-3 mb-3">
                {OUTCOME_LABEL.outcomes.map((o) => (
                  <div key={o.name} className="flex items-center gap-3">
                    <span className="font-terminal text-base md:text-lg text-zinc-300 w-[160px] shrink-0">{o.name}</span>
                    <div className="flex-1 h-4 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full bar-fill"
                        style={{ width: `${Math.abs(o.change)}%` }}
                      />
                    </div>
                    <span className="font-pixel text-base md:text-lg text-emerald-400 w-[70px] text-right">
                      {o.change > 0 ? "+" : ""}{o.change}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Side effects */}
              <div className="border-t border-zinc-700 pt-2 mb-2">
                <div className="font-terminal text-base text-zinc-400 mb-1">SIDE EFFECTS</div>
                <div className="flex gap-4">
                  {OUTCOME_LABEL.sideEffects.map((se) => (
                    <div key={se.name} className="flex items-center gap-1">
                      <span className="font-terminal text-base md:text-lg text-zinc-300">{se.name}:</span>
                      <span className="font-pixel text-base md:text-lg text-amber-400">{se.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="font-terminal text-base text-zinc-500">
                {OUTCOME_LABEL.source}
              </div>
            </div>

            {/* RIGHT — Treatment Rankings */}
            <div className="bg-zinc-900/80 border border-cyan-500/30 rounded-lg p-4">
              <div className="font-pixel text-xl md:text-2xl text-cyan-400 mb-2">
                TREATMENT RANKINGS
              </div>
              <div className="font-terminal text-base md:text-lg text-zinc-400 mb-3">
                High Cholesterol — ranked by effectiveness
              </div>

              <div className="space-y-3">
                {TREATMENT_RANKINGS.map((t) => (
                  <div
                    key={t.rank}
                    className={`flex items-center gap-3 p-3 rounded border ${
                      t.rank === 1
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-zinc-800/50 border-zinc-700/30"
                    }`}
                  >
                    <div className={`font-pixel text-xl w-9 h-9 rounded-full flex items-center justify-center ${
                      t.rank === 1 ? "bg-emerald-400 text-zinc-900" : "bg-zinc-700 text-zinc-300"
                    }`}>
                      {t.rank}
                    </div>
                    <div className="flex-1">
                      <div className="font-pixel text-base md:text-xl text-zinc-200">{t.name}</div>
                      <div className="flex gap-3 mt-1">
                        <span className="font-terminal text-base text-emerald-400">{t.effectiveness}% effective</span>
                        <span className="font-terminal text-base text-cyan-400">{t.safety}% safe</span>
                        <span className="font-terminal text-base text-zinc-400">{t.confidence}% confidence</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Contrast callout */}
        {phase >= 3 && (
          <div className="text-center fade-in space-y-1">
            <div className="font-terminal text-lg md:text-xl text-zinc-400">
              Your drugs have 40-page inserts written by lawyers having seizures.
            </div>
            <div className="font-terminal text-xl md:text-2xl text-cyan-300">
              These tell you what actually happens when real humans take a drug.
            </div>
          </div>
        )}

        {/* Kicker stat */}
        {phase >= 4 && (
          <div className="font-pixel text-2xl md:text-4xl text-cyan-300 text-center fade-in">
            44x cheaper. 12.3x more capacity. Zero queue.
          </div>
        )}
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideDecentralizedFda;
