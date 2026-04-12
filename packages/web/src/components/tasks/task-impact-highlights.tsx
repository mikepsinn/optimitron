"use client";

import {
  DFDA_DIRECT_FUNDING_COST_PER_DALY,
  DFDA_DIRECT_FUNDING_QUEUE_CLEARANCE_NPV,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS,
  EVENTUALLY_AVOIDABLE_DALY_PCT,
  GLOBAL_ANNUAL_DALY_BURDEN,
  TREATY_ANNUAL_FUNDING,
  TREATY_HALE_GAIN_YEAR_15,
  TREATY_PERSONAL_UPSIDE_BLEND,
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  type Parameter,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { isTreatyParentTaskKey, isTreatySignerTaskKey } from "@/lib/tasks/task-keys";

interface HighlightRow {
  label: string;
  param: Parameter;
  display?: "auto" | "integer" | "withUnit";
}

const TREATY_HIGHLIGHTS: HighlightRow[] = [
  { label: "Annual funding redirected", param: TREATY_ANNUAL_FUNDING, display: "withUnit" },
  { label: "Disease cure acceleration", param: DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS, display: "withUnit" },
  { label: "Trial capacity multiplier", param: DFDA_TRIAL_CAPACITY_MULTIPLIER, display: "withUnit" },
  { label: "Total healthy years saved", param: DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS, display: "withUnit" },
  { label: "Total lives saved", param: DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED, display: "withUnit" },
  { label: "Total economic value", param: DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE, display: "withUnit" },
  { label: "Global annual disease burden", param: GLOBAL_ANNUAL_DALY_BURDEN, display: "withUnit" },
  { label: "Eventually avoidable share", param: EVENTUALLY_AVOIDABLE_DALY_PCT, display: "withUnit" },
];

const DFDA_HIGHLIGHTS: HighlightRow[] = [
  { label: "Direct funding required (NPV)", param: DFDA_DIRECT_FUNDING_QUEUE_CLEARANCE_NPV, display: "withUnit" },
  { label: "Cost per healthy year", param: DFDA_DIRECT_FUNDING_COST_PER_DALY, display: "withUnit" },
  { label: "Disease cure acceleration", param: DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS, display: "withUnit" },
  { label: "Trial capacity multiplier", param: DFDA_TRIAL_CAPACITY_MULTIPLIER, display: "withUnit" },
  { label: "Total healthy years saved", param: DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS, display: "withUnit" },
  { label: "Total lives saved", param: DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED, display: "withUnit" },
  { label: "Total economic value", param: DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE, display: "withUnit" },
];

function getHighlights(taskKey: string | null | undefined): HighlightRow[] | null {
  if (!taskKey) return null;
  if (isTreatyParentTaskKey(taskKey)) return TREATY_HIGHLIGHTS;
  if (taskKey === "program:dfda:create") return DFDA_HIGHLIGHTS;
  if (isTreatySignerTaskKey(taskKey)) return TREATY_HIGHLIGHTS;
  return null;
}

function showsTreatyPersonalUpside(taskKey: string | null | undefined): boolean {
  if (!taskKey) return false;
  return (
    isTreatyParentTaskKey(taskKey) ||
    taskKey === "program:dfda:create" ||
    isTreatySignerTaskKey(taskKey)
  );
}

export function TaskImpactHighlights({ taskKey }: { taskKey: string | null | undefined }) {
  const highlights = getHighlights(taskKey);
  if (!highlights) return null;

  return (
    <div className="space-y-4">
      {showsTreatyPersonalUpside(taskKey) ? (
        <div className="border-4 border-brutal-green bg-brutal-green/10 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brutal-green">
            Your Personal Upside
          </p>
          <p className="mt-2 text-2xl font-black">
            <ParameterValue param={TREATY_PERSONAL_UPSIDE_BLEND} display="withUnit" />
          </p>
          <p className="mt-2 text-sm font-bold text-muted-foreground">
            Per-person lifetime gain if this passes:{" "}
            <ParameterValue param={TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA} display="withUnit" />{" "}
            in income plus{" "}
            <ParameterValue param={TREATY_HALE_GAIN_YEAR_15} display="withUnit" />{" "}
            of extra healthy life.
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-brutal-pink">
          Key Impact Parameters
        </h3>
        <p className="text-xs font-bold text-muted-foreground">
          Click any value for the full calculation, formula, confidence interval, and sources.
        </p>
        <dl className="grid gap-2 sm:grid-cols-2">
          {highlights.map((row) => (
            <div
              key={row.param.parameterName}
              className="flex items-baseline justify-between gap-3 border-2 border-foreground bg-muted/20 px-3 py-2"
            >
              <dt className="text-xs font-bold uppercase text-muted-foreground">{row.label}</dt>
              <dd className="text-sm font-black">
                <ParameterValue param={row.param} display={row.display ?? "withUnit"} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
