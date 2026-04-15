import {
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { BrutalCard } from "@/components/ui/brutal-card";

export function TaskTreatyImpactCard() {
  return (
    <BrutalCard bgColor="yellow" padding="lg">
      <div className="space-y-4">
        <p className="text-xs font-black uppercase tracking-[0.18em]">
          If signed
        </p>
        <p className="text-3xl font-black uppercase leading-tight sm:text-4xl">
          Clinical trial capacity ×{" "}
          <ParameterValue
            param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
            className="underline decoration-dotted underline-offset-4"
          />
        </p>
        <p className="text-sm font-bold leading-relaxed">
          Redirect 1% of US military spending ($8.86B/yr of $886B) into pragmatic
          clinical trials at $929/patient. Funds 23.4M patient-years vs. 1.9M today.
          Compresses the 443-year queue of 6,650 untreated diseases down to 36 years.
          Preventable deaths averted across the compressed timeline:{" "}
          <ParameterValue
            param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED}
            className="underline decoration-dotted underline-offset-4"
          />.
        </p>
        <a
          href="https://manual.warondisease.org/knowledge/economics/1-pct-treaty-impact.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block border-2 border-foreground bg-background px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px]"
        >
          Full derivation →
        </a>
      </div>
    </BrutalCard>
  );
}
