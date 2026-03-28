"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { CountUp } from "@/components/animations/CountUp";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { invisibleGraveyardPaperLink, dfdaSpecPaperLink } from "@/lib/routes";
import {
  fmtParam,
  EFFICACY_LAG_YEARS,
  EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL,
  CURRENT_CLINICAL_TRIAL_PARTICIPATION_RATE,
  CURRENT_TRIAL_SLOTS_AVAILABLE,
  GLOBAL_DISEASE_DEATHS_DAILY,
  DFDA_EFFICACY_LAG_ELIMINATION_ECONOMIC_VALUE,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
const graveyardStats = [
  {
    value: 95,
    suffix: "%",
    label: "Diseases Untreated",
    detail: "95% of known diseases have zero approved treatments. Not because cures are impossible. Because nobody ran the trial.",
  },
  {
    value: EFFICACY_LAG_YEARS.value,
    suffix: " years",
    label: "Post-Safety Delay",
    detail: `The FDA makes treatments wait ${EFFICACY_LAG_YEARS.value} years AFTER they have been proven safe. Just sitting there. Being safe. While people die.`,
  },
  {
    value: Math.round(EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL.value / 1e6),
    suffix: "M deaths",
    label: "Historical Efficacy Lag",
    detail: `${Math.round(EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL.value / 1e6)} million people have died waiting for treatments that were already proven safe but had not yet cleared the efficacy queue.`,
  },
  {
    value: +(CURRENT_CLINICAL_TRIAL_PARTICIPATION_RATE.value * 100).toFixed(2),
    suffix: "%",
    label: "Trial Capacity Used",
    detail: `${(CURRENT_TRIAL_SLOTS_AVAILABLE.value / 1e6).toFixed(1)} million trial slots per year. 1.08 billion willing participants. You are using ${(CURRENT_CLINICAL_TRIAL_PARTICIPATION_RATE.value * 100).toFixed(2)}% of available capacity. On my planet this would be a crime.`,
  },
];

export function InvisibleGraveyardSection() {
  return (
    <section className="bg-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-background">
            The Invisible Graveyard
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-bold">
            <ParameterValue param={GLOBAL_DISEASE_DEATHS_DAILY} /> people die every day from treatable diseases. Not untreatable.
            Treatable. You just have not gotten around to testing the treatments yet.
            At your current pace, clearing the backlog takes {Math.round(DISEASES_WITHOUT_EFFECTIVE_TREATMENT.value / NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR.value)} years.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {graveyardStats.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 0.1}>
              <div className="p-6 border-4 border-brutal-yellow bg-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-3xl sm:text-4xl font-black text-brutal-yellow mb-2">
                  <CountUp value={stat.value} suffix={stat.suffix} className="text-brutal-yellow" />
                </div>
                <h3 className="text-sm font-black text-background uppercase mb-2">
                  {stat.label}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-bold">
                  {stat.detail}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.4}>
          <div className="p-8 border-4 border-brutal-yellow bg-brutal-yellow shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-3xl sm:text-4xl font-black text-foreground mb-2">
              <ParameterValue param={{...DFDA_EFFICACY_LAG_ELIMINATION_ECONOMIC_VALUE, unit: "USD"}} />
            </div>
            <p className="text-foreground font-bold max-w-xl mx-auto mb-1">
              Economic value of lives lost to regulatory delay. At 15 new treatments
              per year, your {Math.round(DISEASES_WITHOUT_EFFECTIVE_TREATMENT.value / NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR.value)}-year queue means most of these diseases will outlive
              your civilisation. Which, given your other numbers, might not be very long.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
              <NavItemLink
                item={invisibleGraveyardPaperLink}
                variant="custom"
                external
                className="inline-flex items-center text-sm font-black text-muted-foreground uppercase hover:text-foreground transition-colors"
              >
                Read the paper &rarr;
              </NavItemLink>
              <NavItemLink
                item={dfdaSpecPaperLink}
                variant="custom"
                external
                className="inline-flex items-center text-sm font-black text-muted-foreground uppercase hover:text-foreground transition-colors"
              >
                See the solution (dFDA) &rarr;
              </NavItemLink>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
