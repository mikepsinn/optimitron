import { Suspense, type ReactNode } from "react";
import {
  BED_NETS_COST_PER_DALY,
  CURRENT_TRIAL_SLOTS_AVAILABLE,
  DFDA_ANNUAL_TRIAL_FUNDING,
  DFDA_PATIENTS_FUNDABLE_ANNUALLY,
  DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS,
  DFDA_TRIAL_CAPACITY_TREATMENT_ACCELERATION_YEARS,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  EFFICACY_LAG_YEARS,
  GLOBAL_DISEASE_DEATHS_DAILY,
  GLOBAL_REGISTERED_VOTERS,
  GLOBAL_WARHEAD_COUNT,
  NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  NUCLEAR_WINTER_WARHEAD_THRESHOLD,
  STATUS_QUO_AVG_YEARS_TO_FIRST_TREATMENT,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  TREATY_EXPECTED_VS_BED_NETS_MULTIPLIER,
  TREATY_REDUCTION_PCT,
  type Parameter,
} from "@optimitron/data/parameters";
import { ChaplinReference } from "@/components/donate/ChaplinReference";
import { DonationImpactCalculator } from "@/components/donate/DonationImpactCalculator";
import { WaysToGiveCard } from "@/components/donate/WaysToGiveCard";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { getRouteMetadata } from "@/lib/metadata";
import { donateLink } from "@/lib/routes";

export const metadata = getRouteMetadata(donateLink);

const HOURS_PER_YEAR = 24 * 365;
const SUFFERING_YEARS_VALUE =
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS.value / HOURS_PER_YEAR;
const SUFFERING_YEARS_PARAM: Parameter = {
  ...DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS,
  value: SUFFERING_YEARS_VALUE,
  unit: "years",
  displayName: "Years of suffering and disability prevented",
  description:
    "DFDA trial capacity plus efficacy lag suffering burden, converted from hours to years.",
};

interface Step {
  n: number;
  headline: ReactNode;
  body: ReactNode;
}

const STEPS: Step[] = [
  {
    n: 1,
    headline: (
      <>
        Earth approves about{" "}
        <ParameterValue
          param={NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR}
          figures={2}
        />{" "}
        new treatments per year.
      </>
    ),
    body: "That is the throughput of every drug regulator on the planet, combined.",
  },
  {
    n: 2,
    headline: (
      <>
        Earth has about{" "}
        <ParameterValue
          param={DISEASES_WITHOUT_EFFECTIVE_TREATMENT}
          figures={3}
        />{" "}
        known diseases with no treatment.
      </>
    ),
    body: "Mostly rare diseases. People are alive today who will die before their disease ever gets a first trial.",
  },
  {
    n: 3,
    headline: (
      <>
        At the current rate, the average untreated disease waits{" "}
        <ParameterValue
          param={STATUS_QUO_AVG_YEARS_TO_FIRST_TREATMENT}
          figures={3}
        />{" "}
        years for its first treatment.
      </>
    ),
    body: (
      <>
        The full queue takes{" "}
        <ParameterValue param={STATUS_QUO_QUEUE_CLEARANCE_YEARS} figures={3} />{" "}
        years to clear (the last disease in line). People alive today will die
        of diseases their grandchildren&apos;s grandchildren still won&apos;t
        have a treatment for.
      </>
    ),
  },
  {
    n: 4,
    headline: (
      <>
        The bottleneck is trial slots:{" "}
        <ParameterValue param={CURRENT_TRIAL_SLOTS_AVAILABLE} figures={2} /> per
        year worldwide.
      </>
    ),
    body: (
      <>
        At about{" "}
        <ParameterValue
          param={{ ...TRADITIONAL_PHASE3_COST_PER_PATIENT, unit: "USD" }}
          figures={2}
        />{" "}
        per patient. Most of that cost is on-site monitoring, not science.
      </>
    ),
  },
  {
    n: 5,
    headline: (
      <>
        Pragmatic decentralized trials cost{" "}
        <ParameterValue
          param={{ ...DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT, unit: "USD" }}
          figures={3}
        />{" "}
        per patient — about 44× cheaper.
      </>
    ),
    body: "Same statistical power, real-world data, no on-site visits. The technology exists. The regulators do not run it.",
  },
  {
    n: 6,
    headline: (
      <>
        <ParameterValue
          param={{ ...DFDA_ANNUAL_TRIAL_FUNDING, unit: "USD" }}
          figures={3}
        />
        /year funds{" "}
        <ParameterValue param={DFDA_PATIENTS_FUNDABLE_ANNUALLY} figures={3} />{" "}
        trial patients —{" "}
        <ParameterValue
          param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
          display="withUnit"
          figures={3}
        />{" "}
        current global capacity.
      </>
    ),
    body: "12× the trials, 12× the disease coverage per year, on the same pool of compounds.",
  },
  {
    n: 7,
    headline: (
      <>
        The current queue compresses from{" "}
        <ParameterValue param={STATUS_QUO_QUEUE_CLEARANCE_YEARS} figures={3} />{" "}
        years to{" "}
        <ParameterValue param={DFDA_QUEUE_CLEARANCE_YEARS} figures={3} /> years.
      </>
    ),
    body: (
      <>
        Average disease gets its first treatment{" "}
        <ParameterValue
          param={DFDA_TRIAL_CAPACITY_TREATMENT_ACCELERATION_YEARS}
          figures={3}
        />{" "}
        years sooner. Add{" "}
        <ParameterValue param={EFFICACY_LAG_YEARS} figures={2} /> years of
        removed FDA efficacy lag →{" "}
        <ParameterValue
          param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS}
          figures={3}
        />{" "}
        years sooner.
      </>
    ),
  },
  {
    n: 8,
    headline: (
      <>
        <ParameterValue param={GLOBAL_DISEASE_DEATHS_DAILY} figures={3} />{" "}
        people die from disease every day.
      </>
    ),
    body: (
      <>
        Across the full acceleration window, that is{" "}
        <ParameterValue
          param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED}
          figures={3}
        />{" "}
        deaths prevented and{" "}
        <ParameterValue param={SUFFERING_YEARS_PARAM} figures={3} /> years of
        suffering and disability prevented.
      </>
    ),
  },
  {
    n: 9,
    headline: (
      <>
        Funding source:{" "}
        <ParameterValue
          param={TREATY_REDUCTION_PCT}
          display="withUnit"
          figures={2}
        />{" "}
        of global military spending.
      </>
    ),
    body: (
      <>
        Earth owns <ParameterValue param={GLOBAL_WARHEAD_COUNT} figures={3} />{" "}
        nuclear warheads.{" "}
        <ParameterValue param={NUCLEAR_WINTER_WARHEAD_THRESHOLD} figures={2} />{" "}
        is enough for nuclear winter. We have{" "}
        <ParameterValue param={NUCLEAR_WINTER_OVERKILL_FACTOR} figures={3} />{" "}
        apocalypses&apos; worth of weapons. Keep 121. Spend the other one curing
        every disease.
      </>
    ),
  },
  {
    n: 10,
    headline: (
      <>
        To pass the treaty: a majority of humans vote yes —{" "}
        <ParameterValue param={GLOBAL_REGISTERED_VOTERS} figures={3} /> people.
      </>
    ),
    body: "At $2 per voter that is an $8 billion campaign — less than the U.S. spends on military bands.",
  },
  {
    n: 11,
    headline: <>$8B campaign ÷ 10.7B lives = 75¢ per life.</>,
    body: (
      <>
        $0.014 per healthy life-year. Bed nets — currently the most
        cost-effective charity on Earth — are{" "}
        <ParameterValue
          param={BED_NETS_COST_PER_DALY}
          display="withUnit"
          figures={2}
        />
        . This is{" "}
        <ParameterValue
          param={TREATY_EXPECTED_VS_BED_NETS_MULTIPLIER}
          figures={3}
        />
        × better. If it works.
      </>
    ),
  },
];

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="sr-only">Buy human life</h1>

        <Suspense
          fallback={
            <div className="border border-black p-6 text-sm">
              Loading calculator…
            </div>
          }
        >
          <DonationImpactCalculator />
        </Suspense>

        <section id="how-this-is-calculated" className="mt-16 scroll-mt-8">
          <h2 className="border-b border-black pb-3 text-2xl font-semibold">
            How this is calculated
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-700">
            Click any number for the source equation, citation, and confidence
            interval.
          </p>

          <ol className="mt-6 space-y-6">
            {STEPS.map((step) => (
              <li key={step.n} className="border border-black p-5 sm:p-6">
                <div className="flex items-baseline gap-4">
                  <span className="text-3xl font-semibold tabular-nums sm:text-4xl">
                    {step.n}
                  </span>
                  <h3 className="text-xl font-semibold leading-snug sm:text-2xl">
                    {step.headline}
                  </h3>
                </div>
                <p className="mt-3 max-w-3xl text-base leading-7 text-neutral-700 sm:ml-12">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-10">
          <WaysToGiveCard />
        </div>

        <div className="mt-12">
          <ChaplinReference />
        </div>
      </div>
    </div>
  );
}
