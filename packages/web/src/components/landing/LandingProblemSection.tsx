import {
  fmtParam,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL,
  GLOBAL_DISEASE_DEATHS_DAILY,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL,
  EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL,
  EFFICACY_LAG_YEARS,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
const milToTrialsRatio = Math.round(
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value /
    GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL.value,
);

/**
 * Landing section 2: "The Cost of Doing Nothing"
 *
 * Merges PoliticalDysfunctionTaxSection (financial cost) + InvisibleGraveyardSection
 * (human cost) into a single two-column problem amplification section.
 */
export function LandingProblemSection() {
  return (
    <section className="bg-foreground">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight text-background sm:text-4xl md:text-5xl">
            The Cost of Doing Nothing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-bold text-muted-foreground">
            Your governments spend{" "}
            {fmtParam({ ...GLOBAL_MILITARY_SPENDING_ANNUAL_2024, unit: "USD" })}{" "}
            per year on weapons and{" "}
            {fmtParam({
              ...GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL,
              unit: "USD",
            })}{" "}
            on testing medicines. That&apos;s a{" "}
            <span className="text-brutal-yellow font-black">
              {milToTrialsRatio.toLocaleString()}:1
            </span>{" "}
            ratio. On my planet, we call this a configuration error.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Financial Cost */}
          <div className="border-4 border-brutal-yellow bg-foreground p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 inline-block border-4 border-primary bg-brutal-red px-3 py-1">
              <span className="text-xs font-black uppercase text-brutal-red-foreground">
                Financial Cost
              </span>
            </div>
            <div className="space-y-6">
              <div>
                <div className="text-3xl font-black text-brutal-yellow">
                  {fmtParam({
                    ...POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
                    unit: "USD",
                  })}
                  /yr
                </div>
                <p className="mt-1 text-sm font-bold text-muted-foreground">
                  Global political dysfunction tax — what misaligned governance
                  costs in wasted resources, perverse incentives, and missed
                  opportunities.
                </p>
              </div>
              <div>
                <div className="text-2xl font-black text-brutal-yellow">
                  {fmtParam(POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL)}
                  /person
                </div>
                <p className="mt-1 text-sm font-bold text-muted-foreground">
                  That&apos;s your share. You are paying this whether you know
                  it or not.
                </p>
              </div>
            </div>
          </div>

          {/* Human Cost */}
          <div className="border-4 border-brutal-yellow bg-foreground p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 inline-block border-4 border-primary bg-brutal-yellow px-3 py-1">
              <span className="text-xs font-black uppercase text-foreground">
                Human Cost
              </span>
            </div>
            <div className="space-y-6">
              <div>
                <div className="text-3xl font-black text-brutal-yellow">
                  <ParameterValue param={GLOBAL_DISEASE_DEATHS_DAILY} /> deaths/day
                </div>
                <p className="mt-1 text-sm font-bold text-muted-foreground">
                  Preventable. Treatable. Ignored. Every day your regulatory
                  system fails to clear the backlog.
                </p>
              </div>
              <div>
                <div className="text-2xl font-black text-brutal-yellow">
                  {fmtParam({
                    ...EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL,
                    unit: "deaths",
                  })}
                </div>
                <p className="mt-1 text-sm font-bold text-muted-foreground">
                  People who died waiting for treatments that were already
                  proven safe — stuck in{" "}
                  {fmtParam(EFFICACY_LAG_YEARS)} of
                  efficacy testing. Just sitting there. Being safe.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="border-4 border-brutal-yellow bg-brutal-yellow p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-center text-sm font-bold text-foreground">
              On my planet, when a system kills{" "}
              {fmtParam({...GLOBAL_DISEASE_DEATHS_DAILY, unit: ""})} people a day and costs{" "}
              {fmtParam({
                ...POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
                unit: "USD",
              })}{" "}
              a year, we don&apos;t call it &ldquo;politics.&rdquo; We call it a
              bug. And we fix it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
