import type { Metadata } from "next";
import { WishoniaAgencyPage } from "@/components/wishonia-agency/WishoniaAgencyPage";
import { SimpleComparisonGrid } from "@/components/ui/simple-comparison";
import { AGENCIES } from "@optimitron/data/datasets/wishonia-agencies";

const agency = AGENCIES.dih;

const trialComparison = {
  traditional: [
    { label: "Cost per patient", value: "$27,800" },
    { label: "Same trial cost", value: "$420 million" },
    { label: "Cancer patients in trials", value: "3-5%" },
    { label: "Antidepressant applicants excluded", value: "86%" },
    { label: "Scientists writing grants", value: "50-67% of time" },
  ],
  pragmatic: [
    { label: "Cost per patient", value: "$929 (30x cheaper)" },
    { label: "Same trial cost", value: "$14 million" },
    { label: "Patients eligible", value: "Anyone with the condition" },
    { label: "Results published", value: "100% — positive and negative" },
    { label: "Scientists writing grants", value: "0% — funding follows patients" },
  ],
};

export const metadata: Metadata = {
  title: `${agency.dName}: ${agency.replacesAgencyName} — DEPRECATED | Optimitron`,
  description: agency.description,
};

export default function DIhPage() {
  return (
    <WishoniaAgencyPage agency={agency}>
      {/* Traditional vs Pragmatic Trials */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
          The Same Money, 30x More Science
        </h2>
        <p className="mb-6 max-w-3xl text-sm font-bold text-muted-foreground">
          The ADAPTABLE trial proved this isn&apos;t theoretical. 15,076
          patients. $14 million. $929 per patient. A traditional RCT of the
          same question would have cost $420 million.
        </p>
        <SimpleComparisonGrid
          columns={[
            {
              title: "Traditional RCT (What NIH Funds)",
              items: trialComparison.traditional,
            },
            {
              title: "Pragmatic Trial (What dIH Funds)",
              items: trialComparison.pragmatic,
            },
          ]}
        />
        <div className="mt-6 border-l border-foreground/30 pl-4">
          <p className="text-sm font-bold leading-relaxed text-muted-foreground">
            At $929 per patient instead of $27,800, the NIH&apos;s $47 billion
            could enrol 50 million patients per year in pragmatic trials instead
            of 1.9 million in traditional ones. That&apos;s not an incremental
            improvement. That&apos;s the difference between discovering ten cures
            a decade and discovering three hundred.
          </p>
        </div>
      </section>

      {/* Where The Money Actually Goes */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
          Where the $47 Billion Actually Goes
        </h2>
        <div className="grid grid-cols-1 gap-6 border-y border-foreground/30 py-6 md:grid-cols-3">
          <div>
            <div className="text-3xl font-black">
              96.7%
            </div>
            <div className="mt-1 text-xs font-black uppercase text-muted-foreground">
              Not Clinical Trials
            </div>
            <p className="mt-3 text-xs font-bold leading-relaxed text-muted-foreground">
              Grant administration, overhead, buildings, and committees that
              review committees that review other committees. It&apos;s like a
              fire department that spends 97% of its budget on the building
              and 3% on water. $45.5 billion that never touches a patient.
            </p>
          </div>
          <div>
            <div className="text-3xl font-black">3.3%</div>
            <div className="mt-1 text-xs font-black uppercase">
              Actual Clinical Trials
            </div>
            <p className="mt-3 text-xs font-bold text-muted-foreground leading-relaxed">
              ~$1.55 billion funds actual trials. And those are traditional
              RCTs at $27,800/patient with 86% of applicants excluded.
            </p>
          </div>
          <div>
            <div className="text-3xl font-black text-foreground">97%</div>
            <div className="mt-1 text-xs font-black uppercase text-muted-foreground">
              dIH → Patient Subsidies
            </div>
            <p className="mt-3 text-xs font-bold leading-relaxed text-muted-foreground">
              dIH flips the ratio. 97% to patients. 3% to infrastructure.
              No grant committees. No scientists spending half their careers
              writing applications to ask permission to do science.
            </p>
          </div>
        </div>
      </section>
    </WishoniaAgencyPage>
  );
}
