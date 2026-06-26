"use client";

import type { ReactNode } from "react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { CountUp } from "@/components/animations/CountUp";
import { GlitchText } from "@/components/animations/GlitchText";
import { PulseGlow } from "@/components/animations/PulseGlow";
import { SkullRain, DeathsSinceViewing } from "@/components/animations/SkullRain";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { invisibleGraveyardPaperLink, dfdaSpecPaperLink } from "@/lib/routes";
import {
  EFFICACY_LAG_YEARS,
  EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL,
  CURRENT_CLINICAL_TRIAL_PARTICIPATION_RATE,
  GLOBAL_DISEASE_DEATHS_DAILY,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
const graveyardStats: { value: number; suffix: string; emoji: string; label: string; detail: ReactNode }[] = [
  {
    value: 95,
    suffix: "%",
    emoji: "🦠",
    label: "Diseases Untreated",
    detail: "Not because cures are impossible. Because nobody ran the trial.",
  },
  {
    value: EFFICACY_LAG_YEARS.value,
    suffix: " years",
    emoji: "🔒",
    label: "Years In The Cabinet",
    detail: "Proven safe. Locked in a cabinet. While you die.",
  },
  {
    value: Math.round(EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL.value / 1e6),
    suffix: "M deaths",
    emoji: "⚰️",
    label: "Dead On The Waiting List",
    detail: "Died waiting for treatments that were already ready.",
  },
  {
    value: +(CURRENT_CLINICAL_TRIAL_PARTICIPATION_RATE.value * 100).toFixed(2),
    suffix: "%",
    emoji: "🚪",
    label: "Doors Open vs. Doors Used",
    detail: "1.08 billion willing. 1.9 million slots. On my planet this would be a crime.",
  },
];

export function InvisibleGraveyardSection() {
  return (
    <section className="bg-foreground relative overflow-hidden">
      {/* Skull rain background */}
      <SkullRain className="absolute inset-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal className="text-center mb-16">
          <h2
            className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-brutal-red"
            style={{ fontFamily: "var(--v0-font-creepster), cursive" }}
          >
            <GlitchText intensity="medium">
              <span className="opacity-30 mr-2 sm:mr-4">🪦</span>
              The Invisible Graveyard
              <span className="opacity-30 ml-2 sm:ml-4">🪦</span>
            </GlitchText>
          </h2>
          <p className="mt-4 text-lg text-background max-w-2xl mx-auto font-bold">
            <ParameterValue param={GLOBAL_DISEASE_DEATHS_DAILY} /> people permanently stop every day. Not because cures don&apos;t exist.
            Because the money for finding them was busy being missiles.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {graveyardStats.map((stat, i) => {
            // Ghost peek positions — each card gets a ghost in a different spot
            const ghostPositions = [
              { emoji: "👻", pos: "-top-4 -right-3", size: "text-3xl", rotate: "rotate-12" },
              { emoji: "👻", pos: "-bottom-3 -left-4", size: "text-4xl", rotate: "-rotate-6" },
              { emoji: "👻", pos: "-top-3 -left-3", size: "text-2xl", rotate: "-rotate-12" },
              { emoji: "👻", pos: "-bottom-4 -right-3", size: "text-3xl", rotate: "rotate-6" },
            ] as const;
            const ghost = ghostPositions[i % ghostPositions.length]!;

            return (
              <ScrollReveal key={stat.label} delay={i * 0.1}>
                <PulseGlow color="rgba(220, 38, 38, 0.5)">
                <div className="relative">
                  {/* Ghost peeking from behind */}
                  <span
                    className={`absolute ${ghost.pos} ${ghost.size} ${ghost.rotate} z-0 opacity-40 animate-[ghost-bob_3s_ease-in-out_infinite]`}
                    style={{ animationDelay: `${i * 0.7}s` }}
                    aria-hidden
                  >
                    {ghost.emoji}
                  </span>
                  <div className="relative z-10 p-6 border-4 border-background bg-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl sm:text-4xl">{stat.emoji}</span>
                      <span className="text-3xl sm:text-4xl font-black text-brutal-red">
                        <CountUp value={stat.value} suffix={stat.suffix} className="text-brutal-red" />
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-background uppercase mb-2">
                      {stat.label}
                    </h3>
                    <p className="text-sm text-background leading-relaxed font-bold">
                      {stat.detail}
                    </p>
                  </div>
                </div>
                </PulseGlow>
              </ScrollReveal>
            );
          })}
        </div>

        <DeathsSinceViewing className="mb-8" />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <NavItemLink
            item={invisibleGraveyardPaperLink}
            variant="custom"
            external
            className="inline-flex items-center text-sm font-black uppercase text-background hover:underline transition-colors"
          >
            😴 Read the Receipts &rarr;
          </NavItemLink>
          <NavItemLink
            item={dfdaSpecPaperLink}
            variant="custom"
            external
            className="inline-flex items-center text-sm font-black uppercase text-background hover:underline transition-colors"
          >
            🧪 See the Solution &rarr;
          </NavItemLink>
        </div>
      </div>
    </section>
  );
}
