import {
  GLOBAL_WARHEAD_COUNT,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  NUCLEAR_WINTER_WARHEAD_THRESHOLD,
  POLITICAL_DYSFUNCTION_GLOBAL_HEALTH_OPPORTUNITY_COST,
  POLITICAL_DYSFUNCTION_GLOBAL_LEAD_OPPORTUNITY_COST,
  POLITICAL_DYSFUNCTION_GLOBAL_MIGRATION_OPPORTUNITY_COST,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  POLITICAL_DYSFUNCTION_GLOBAL_SCIENCE_OPPORTUNITY_COST,
  type Parameter,
} from "@optimitron/data/parameters";
import { WarheadField } from "@/components/invest/WarheadGrid";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { compactUsd } from "./format";
import { LandingSection, alarmTextClass } from "./LandingSection";
import { LiveBillTickers } from "./LiveBillTickers";

const RECEIPT_LINES: ReadonlyArray<readonly [label: string, param: Parameter]> = [
  ["Cures, delayed by regulation", POLITICAL_DYSFUNCTION_GLOBAL_HEALTH_OPPORTUNITY_COST],
  ["Research, funded by essay", POLITICAL_DYSFUNCTION_GLOBAL_SCIENCE_OPPORTUNITY_COST],
  ["Lead, left in the paint", POLITICAL_DYSFUNCTION_GLOBAL_LEAD_OPPORTUNITY_COST],
  ["Workers, kept where they were born", POLITICAL_DYSFUNCTION_GLOBAL_MIGRATION_OPPORTUNITY_COST],
];

// Torn-paper bottom edge for the receipt.
const RECEIPT_EDGE = `polygon(0 0,100% 0,100% calc(100% - 10px),${Array.from(
  { length: 25 },
  (_, index) => {
    const x = 100 - index * 4;
    return `${x - 2}% 100%,${x - 4}% calc(100% - 10px)`;
  },
).join(",")},0 100%)`;

function DysfunctionReceipt() {
  const total = POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL;
  return (
    <div className="drop-shadow-[0_18px_24px_rgba(0,0,0,0.18)]">
      <figure
        aria-label="Itemized political dysfunction tax"
        className="bg-card px-6 pb-10 pt-6 font-mono text-sm text-card-foreground"
        style={{ clipPath: RECEIPT_EDGE }}
      >
        <p className="text-center font-bold uppercase tracking-[0.12em]">
          Your current governments
        </p>
        <p className="mt-1 text-center uppercase text-muted-foreground">
          Political dysfunction tax · per year
        </p>
        <table className="mt-5 w-full border-t border-dashed border-foreground/40">
          <tbody>
            {RECEIPT_LINES.map(([label, param]) => (
              <tr key={label}>
                <td className="py-1.5 pr-4 uppercase">{label}</td>
                <td className="py-1.5 text-right font-bold">
                  <ParameterValue param={param} valueOverride={compactUsd(param.value)} />
                </td>
              </tr>
            ))}
            <tr className="border-t border-dashed border-foreground/40">
              <td className="pb-1 pt-3 font-bold uppercase">Total, per year</td>
              <td className={`pb-1 pt-3 text-right font-bold ${alarmTextClass}`}>
                <ParameterValue param={total} valueOverride={compactUsd(total.value)} />
              </td>
            </tr>
          </tbody>
        </table>
        <p className="mt-6 border-t border-dashed border-foreground/40 pt-4 text-center uppercase tracking-[0.1em]">
          Thank you for not asking
        </p>
        <div
          aria-hidden="true"
          className="mx-auto mt-3 h-6 w-3/4 bg-[repeating-linear-gradient(90deg,var(--foreground)_0_2px,transparent_2px_4px,var(--foreground)_4px_5px,transparent_5px_9px,var(--foreground)_9px_12px,transparent_12px_14px)]"
        />
      </figure>
    </div>
  );
}

export function StatementSection() {
  const total = POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL;
  return (
    <LandingSection
      id="statement"
      note="Political dysfunction tax: what bad policy costs, every year"
      title="Your current provider’s statement"
    >
      <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">
            Bad policy costs Earth{" "}
            <ParameterValue className={alarmTextClass} param={total} /> a year.
          </p>
          <div className="mt-8">
            <LiveBillTickers />
          </div>
        </div>
        <DysfunctionReceipt />
      </div>
      <div className="mt-12 border-t border-foreground/15 pt-6">
        <WarheadField />
        <ul className="mt-4 flex flex-col gap-2 text-sm leading-6 text-muted-foreground lg:flex-row lg:flex-wrap lg:justify-between lg:gap-x-8">
          <li>
            <ParameterValue
              className="font-bold text-foreground"
              param={GLOBAL_WARHEAD_COUNT}
              valueOverride={Math.round(GLOBAL_WARHEAD_COUNT.value).toLocaleString("en-US")}
            />{" "}
            nuclear warheads, one square each
          </li>
          <li>
            <ParameterValue
              className="font-bold text-foreground"
              param={NUCLEAR_WINTER_WARHEAD_THRESHOLD}
            />{" "}
            are enough to end civilization
          </li>
          <li>
            <ParameterValue
              className="font-bold text-foreground"
              display="integer"
              param={NUCLEAR_WINTER_OVERKILL_FACTOR}
            />{" "}
            apocalypses’ worth, for a planet that can only end once
          </li>
          <li>
            Spent on killing for every dollar on curing:{" "}
            <ParameterValue
              className="font-bold text-foreground"
              display="integer"
              param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
              valueOverride={`$${Math.round(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value)}`}
            />
          </li>
        </ul>
      </div>
    </LandingSection>
  );
}
