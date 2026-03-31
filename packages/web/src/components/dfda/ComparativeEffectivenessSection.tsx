"use client";

/**
 * ComparativeEffectivenessSection — matches dih-neobrutalist design exactly.
 * Uses hardcoded sample data instead of live API. Links to dfda.earth.
 */

import { useState } from "react";
import { AlertCircle } from "lucide-react";

interface SideEffect {
  name: string;
  percentage: number;
}

interface Treatment {
  name: string;
  effectiveness: number;
  trials: number;
  participants: number;
  sideEffects: SideEffect[];
}

const SAMPLE_DATA: Record<string, Treatment[]> = {
  "High Cholesterol": [
    { name: "Atorvastatin 20mg", effectiveness: 85, trials: 42, participants: 48500, sideEffects: [{ name: "Muscle Pain", percentage: 8.2 }, { name: "Headache", percentage: 3.8 }] },
    { name: "Rosuvastatin 10mg", effectiveness: 82, trials: 38, participants: 41200, sideEffects: [{ name: "Muscle Pain", percentage: 7.1 }, { name: "Nausea", percentage: 2.4 }] },
    { name: "Ezetimibe 10mg", effectiveness: 68, trials: 24, participants: 19800, sideEffects: [{ name: "Diarrhea", percentage: 4.1 }] },
  ],
  Depression: [
    { name: "Sertraline 50mg", effectiveness: 71, trials: 56, participants: 62300, sideEffects: [{ name: "Nausea", percentage: 12.4 }, { name: "Insomnia", percentage: 8.1 }] },
    { name: "Escitalopram 10mg", effectiveness: 69, trials: 48, participants: 51200, sideEffects: [{ name: "Headache", percentage: 9.2 }, { name: "Fatigue", percentage: 6.3 }] },
    { name: "Cognitive Behavioral Therapy", effectiveness: 65, trials: 31, participants: 28900, sideEffects: [] },
  ],
  "ADHD": [
    { name: "Methylphenidate ER", effectiveness: 78, trials: 44, participants: 38700, sideEffects: [{ name: "Appetite Loss", percentage: 15.2 }, { name: "Insomnia", percentage: 11.3 }] },
    { name: "Lisdexamfetamine", effectiveness: 76, trials: 36, participants: 31400, sideEffects: [{ name: "Appetite Loss", percentage: 13.8 }, { name: "Dry Mouth", percentage: 8.4 }] },
  ],
};

const CONDITIONS = Object.keys(SAMPLE_DATA);

export function ComparativeEffectivenessSection() {
  const [selected, setSelected] = useState(CONDITIONS[0]);
  const treatments = SAMPLE_DATA[selected] ?? [];

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-brutal-pink border-b-4 border-primary">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-4xl font-black uppercase sm:text-5xl md:text-6xl lg:text-7xl text-brutal-pink-foreground">
            TREATMENT RANKINGS
          </h2>
        </div>
        <div className="mx-auto mt-8 max-w-4xl">
          <div className="rounded-lg border bg-background shadow-sm">
            {/* Header */}
            <div className="flex flex-col gap-4 items-center p-6">
              <div className="text-center w-full">
                <h3 className="text-xl font-semibold text-center">Interventions by Condition</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Ranked by effectiveness based on clinical trials and real-world evidence
                </p>
              </div>

              {/* Condition pills */}
              <div className="w-full flex flex-wrap gap-2 justify-center">
                {CONDITIONS.map((condition) => (
                  <button
                    key={condition}
                    onClick={() => setSelected(condition)}
                    className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                      selected === condition
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-input hover:bg-muted"
                    }`}
                  >
                    {condition}
                  </button>
                ))}
              </div>
            </div>

            {/* Treatment cards */}
            <div className="p-6 min-h-[400px] space-y-6">
              {treatments.map((intervention, index) => (
                <div key={index} className="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{intervention.name}</h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{intervention.effectiveness}%</div>
                        <p className="text-xs text-muted-foreground">Effectiveness</p>
                      </div>
                    </div>
                    <div className="relative h-2 w-full bg-muted rounded-full mb-4">
                      <div
                        className="absolute top-0 left-0 h-full bg-primary rounded-full"
                        style={{ width: `${intervention.effectiveness}%` }}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm">
                      <p className="text-muted-foreground">
                        Based on {intervention.trials} trials with {intervention.participants.toLocaleString()} participants
                      </p>
                      <div className="flex flex-wrap gap-2 items-center">
                        {intervention.sideEffects.map((effect, effectIndex) => (
                          <div
                            key={effectIndex}
                            className="rounded-full bg-brutal-yellow px-2 py-1 text-xs font-medium text-brutal-yellow-foreground flex items-center"
                          >
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {effect.name}: {effect.percentage}%
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <a
                        href={`https://dfda.earth/conditions/${selected.toLowerCase().replace(/\s+/g, '-')}/treatments/${intervention.name.toLowerCase().replace(/\s+/g, '-')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-full bg-brutal-cyan px-3 py-1 text-xs font-medium text-brutal-cyan-foreground border border-brutal-cyan hover:opacity-80 transition-colors"
                      >
                        More Details
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex justify-between p-6 border-t">
              <a
                href="https://dfda.earth"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Explore More Conditions on dfda.earth →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
