import type { Metadata } from "next";
import { WishoniaAgencyPage } from "@/components/wishonia-agency/WishoniaAgencyPage";
import { getWishoniaAgency } from "@optimitron/data";

const agency = getWishoniaAgency("dih")!;

export const metadata: Metadata = {
  title: `${agency.dName}: ${agency.replacesAgencyName} — DEPRECATED | Optimitron`,
  description: agency.tagline,
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="border-4 border-primary bg-brutal-pink p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="mb-4 text-sm font-black uppercase tracking-[0.1em] text-brutal-pink-foreground">
              Traditional RCT (What NIH Funds)
            </h3>
            <div className="space-y-3">
              {[
                { label: "Cost per patient", value: "$27,800" },
                { label: "Same trial cost", value: "$420 million" },
                { label: "Cancer patients in trials", value: "3-5%" },
                { label: "Antidepressant applicants excluded", value: "86%" },
                { label: "Scientists writing grants", value: "50-67% of time" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="border-4 border-primary bg-background p-3"
                >
                  <div className="text-xs font-black uppercase text-muted-foreground">
                    {item.label}
                  </div>
                  <div className="mt-0.5 text-sm font-black text-foreground">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-4 border-primary bg-brutal-cyan p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="mb-4 text-sm font-black uppercase tracking-[0.1em] text-foreground">
              Pragmatic Trial (What dIH Funds)
            </h3>
            <div className="space-y-3">
              {[
                { label: "Cost per patient", value: "$929 (30x cheaper)" },
                { label: "Same trial cost", value: "$14 million" },
                { label: "Patients eligible", value: "Anyone with the condition" },
                { label: "Results published", value: "100% — positive and negative" },
                { label: "Scientists writing grants", value: "0% — funding follows patients" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="border-4 border-primary bg-background p-3"
                >
                  <div className="text-xs font-black uppercase text-muted-foreground">
                    {item.label}
                  </div>
                  <div className="mt-0.5 text-sm font-black text-foreground">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold leading-relaxed">
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="border-4 border-primary bg-brutal-pink text-brutal-pink-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black">
              96.7%
            </div>
            <div className="mt-1 text-xs font-black uppercase">
              Not Clinical Trials
            </div>
            <p className="mt-3 text-xs font-bold leading-relaxed opacity-80">
              Grant administration, overhead, intramural research programmes,
              buildings, committees that review committees. $45.5 billion that
              never touches a patient.
            </p>
          </div>
          <div className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black">3.3%</div>
            <div className="mt-1 text-xs font-black uppercase">
              Actual Clinical Trials
            </div>
            <p className="mt-3 text-xs font-bold text-muted-foreground leading-relaxed">
              ~$1.55 billion funds actual trials. And those are traditional
              RCTs at $27,800/patient with 86% of applicants excluded.
            </p>
          </div>
          <div className="border-4 border-primary bg-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black text-brutal-cyan">97%</div>
            <div className="mt-1 text-xs font-black uppercase text-muted-foreground">
              dIH → Patient Subsidies
            </div>
            <p className="mt-3 text-xs font-bold text-muted-foreground leading-relaxed">
              dIH flips the ratio. 97% goes to patient subsidies for pragmatic
              trials. 3% to infrastructure. No grant committees.
            </p>
          </div>
        </div>
      </section>
    </WishoniaAgencyPage>
  );
}
