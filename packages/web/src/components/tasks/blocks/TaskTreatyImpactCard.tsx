import {
  CURRENT_TRIAL_SLOTS_AVAILABLE,
  DFDA_PATIENTS_FUNDABLE_ANNUALLY,
  DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TREATY_ANNUAL_FUNDING,
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
          Redirect 1% of military spending (
          <ParameterValue param={TREATY_ANNUAL_FUNDING} />/yr) into pragmatic
          clinical trials at{" "}
          <ParameterValue param={DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT} />
          /patient. Funds{" "}
          <ParameterValue param={DFDA_PATIENTS_FUNDABLE_ANNUALLY} />{" "}
          patient-years vs.{" "}
          <ParameterValue param={CURRENT_TRIAL_SLOTS_AVAILABLE} /> today.
          Compresses the{" "}
          <ParameterValue param={STATUS_QUO_QUEUE_CLEARANCE_YEARS} />-year
          queue of{" "}
          <ParameterValue param={DISEASES_WITHOUT_EFFECTIVE_TREATMENT} />{" "}
          untreated diseases down to{" "}
          <ParameterValue param={DFDA_QUEUE_CLEARANCE_YEARS} /> years.
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
          className="inline-block border-2 border-foreground bg-background px-3 py-1 text-xs font-black uppercase shadow-none hover:bg-foreground hover:text-background"
        >
          Full derivation →
        </a>
      </div>
    </BrutalCard>
  );
}
