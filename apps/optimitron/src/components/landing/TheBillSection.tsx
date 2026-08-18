"use client";

import {
  GLOBAL_ANNUAL_DEATHS_CURABLE_DISEASES,
  GLOBAL_WARHEAD_COUNT,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  NUCLEAR_WINTER_WARHEAD_THRESHOLD,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL,
} from "@optimitron/data/parameters";
import { GiantNumber } from "@/components/invest/GiantNumber";
import { WarheadGrid } from "@/components/invest/WarheadGrid";
import { ParameterValue } from "@/components/shared/ParameterValue";

/**
 * The bill, immediately after the hero: what the current arrangement costs,
 * one fact per screen. Lifted from the /invest status-quo chapter so both
 * pages state the charge the same way.
 *
 * Client component because GiantNumber takes `format` callbacks, which a
 * server component cannot hand across the boundary.
 */
export function TheBillSection() {
  return (
    <div id="the-bill">
      <GiantNumber
        caption={
          <>
            nuclear warheads, when about{" "}
            <ParameterValue
              className="font-black"
              param={NUCLEAR_WINTER_WARHEAD_THRESHOLD}
            />{" "}
            is enough to end civilization. You are paying to keep the rest.
          </>
        }
        eyebrow="Your governments own"
        format={(n) => Math.round(n).toLocaleString("en-US")}
        source={GLOBAL_WARHEAD_COUNT}
        value={GLOBAL_WARHEAD_COUNT.value}
      />

      <WarheadGrid />

      <GiantNumber
        caption="apocalypses worth of capacity, for a planet that can only be ended once."
        eyebrow="Which comes to"
        format={(n) => Math.round(n).toLocaleString("en-US")}
        source={NUCLEAR_WINTER_OVERKILL_FACTOR}
        value={NUCLEAR_WINTER_OVERKILL_FACTOR.value}
      />

      <GiantNumber
        caption="people die every year of disease and aging, while the money that could have cured them buys the spares."
        eyebrow="Meanwhile"
        format={(n) => Math.round(n).toLocaleString("en-US")}
        source={GLOBAL_ANNUAL_DEATHS_CURABLE_DISEASES}
        value={GLOBAL_ANNUAL_DEATHS_CURABLE_DISEASES.value}
      />

      <GiantNumber
        caption={
          <>
            more spent on killing people than on curing them. Your share of the
            difference is{" "}
            <ParameterValue
              className="font-black"
              param={POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL}
            />
            .
          </>
        }
        eyebrow="A ratio of"
        format={(n) => `${Math.round(n)}×`}
        source={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
        value={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value}
      />

      <GiantNumber
        caption="a year, the gap between the welfare you paid for and the welfare you got. This is the bill. The rest of this page is what we do about it."
        eyebrow="All of it adds up to"
        format={(n) => `$${Math.round(n / 1e12)}T`}
        source={POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL}
        value={POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL.value}
      />
    </div>
  );
}
