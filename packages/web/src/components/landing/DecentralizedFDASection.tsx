import { NavItemLink } from "@/components/navigation/NavItemLink";
import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { dfdaSpecPaperLink } from "@/lib/routes";
import {
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  CURRENT_TRIAL_SLOTS_AVAILABLE,
  DFDA_PATIENTS_FUNDABLE_ANNUALLY,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
  EFFICACY_LAG_YEARS,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import type { ReactNode } from "react";

const rows: { metric: string; current: ReactNode; dfda: ReactNode; improvement: string }[] = [
  {
    metric: "Cost per Patient",
    current: <ParameterValue param={TRADITIONAL_PHASE3_COST_PER_PATIENT} display="withUnit" />,
    dfda: <ParameterValue param={DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT} display="withUnit" />,
    improvement: "44x cheaper",
  },
  {
    metric: "Annual Capacity",
    current: <><ParameterValue param={{ ...CURRENT_TRIAL_SLOTS_AVAILABLE, value: CURRENT_TRIAL_SLOTS_AVAILABLE.value / 1e6, unit: "" }} figures={2} />M/yr</>,
    dfda: <><ParameterValue param={{ ...DFDA_PATIENTS_FUNDABLE_ANNUALLY, value: DFDA_PATIENTS_FUNDABLE_ANNUALLY.value / 1e6, unit: "" }} figures={2} />M/yr</>,
    improvement: "12x more",
  },
  {
    metric: "Queue to Test All Treatments",
    current: <><ParameterValue param={{ ...DISEASES_WITHOUT_EFFECTIVE_TREATMENT, value: Math.round(DISEASES_WITHOUT_EFFECTIVE_TREATMENT.value / NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR.value), unit: "" }} display="integer" /> years</>,
    dfda: <><ParameterValue param={DFDA_QUEUE_CLEARANCE_YEARS} display="integer" /> years</>,
    improvement: "12x faster",
  },
];

export function DecentralizedFDASection() {
  return (
    <SectionContainer bgColor="background" borderPosition="both" padding="md">
      <Container>
        <SectionHeader
          title="Your Decentralized FDA"
          subtitle={<>Your FDA makes treatments wait <ParameterValue param={EFFICACY_LAG_YEARS} /> AFTER they&apos;ve been proven safe. Just sitting there. Being safe. While people die. This replaces the queue with maths.</>}
          size="lg"
        />

        {/* Comparison table */}
        <div className="border border-foreground bg-background text-foreground overflow-x-auto max-w-4xl mx-auto mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-foreground">
                <th className="p-3 text-left text-xs font-black uppercase text-muted-foreground">
                  Metric
                </th>
                <th className="p-3 text-left text-xs font-black uppercase text-foreground">
                  Current System
                </th>
                <th className="p-3 text-left text-xs font-black uppercase text-foreground">
                  dFDA
                </th>
                <th className="p-3 text-right text-xs font-black uppercase text-muted-foreground">
                  Improvement
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.metric}
                  className="border-b border-foreground last:border-b-0"
                >
                  <td className="p-3 font-black text-sm uppercase text-foreground">
                    {row.metric}
                  </td>
                  <td className="p-3 font-bold text-sm text-foreground">
                    {row.current}
                  </td>
                  <td className="p-3 font-bold text-sm text-foreground">
                    {row.dfda}
                  </td>
                  <td className="p-3 text-right font-black text-sm text-foreground">
                    {row.improvement}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stage descriptions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto mb-8">
          <div className="p-4 border border-foreground bg-background text-foreground">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black px-2 py-0.5 border border-foreground bg-background text-foreground">
                Stage 1
              </span>
              <span className="text-xs font-black">~$1/patient</span>
            </div>
            <p className="text-sm font-bold">
              Real-world evidence from existing data — prescriptions, wearables, lab results. Pattern recognition, not recruitment.
            </p>
          </div>
          <div className="p-4 border border-foreground bg-background text-foreground">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black px-2 py-0.5 border border-foreground bg-background text-foreground">
                Stage 2
              </span>
              <span className="text-xs font-black">~<ParameterValue param={DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT} /></span>
            </div>
            <p className="text-sm font-bold">
              Pragmatic trials in routine care. Same doctors, same clinics, real patients. Rigorous evidence at human scale.
            </p>
          </div>
        </div>

        {/* Bottom link */}
        <div className="text-center">
          <p className="text-sm font-bold mb-3">
            Every treatment gets an Outcome Label — effectiveness, side effects, optimal dosage — from millions of real patients.
          </p>
          <NavItemLink
            item={dfdaSpecPaperLink}
            variant="custom"
            external
            className="inline-flex items-center text-sm font-black uppercase hover:underline transition-colors"
          >
            Read the dFDA spec &rarr;
          </NavItemLink>
        </div>
      </Container>
    </SectionContainer>
  );
}
