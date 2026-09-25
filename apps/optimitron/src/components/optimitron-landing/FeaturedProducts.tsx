import Link from "next/link";
import {
  DEFENSE_TAKEOVER_COST_PER_HUMAN,
  DFDA_FIRST_TREATMENTS_PER_YEAR,
  DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  GLOBAL_HALE_CURRENT,
  GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025,
  NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  TREATY_PROJECTED_HALE_YEAR_15,
  TREATY_TRAJECTORY_MEDIAN_AFTER_TAX_INCOME_YEAR_15,
  US_TOTAL_LOBBYING_ANNUAL,
  type Parameter,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { ROUTES } from "@/lib/routes";
import { DataOrb } from "./DataOrb";
import { compactUsd, wholeUsd } from "./format";
import {
  getGradedPolicySample,
  getMeasuredBudgetLines,
  getSpendingBenchmarks,
  TASK_TREE_PATH,
  getTreatySigners,
} from "./landing-data";
import {
  LandingSection,
  Tile,
  TileGrid,
  accentTextClass,
  landingButtonClass,
  landingLinkClass,
} from "./LandingSection";
import { PolicyGeneratorTile } from "./PolicyGeneratorTile";
import { TaskTreeTile } from "./TaskTreeTile";

const LOVING_TAKEOVER_FUNDING_HREF = "/tasks/loving-takeover#funding";

function DataTile() {
  return (
    <Tile note="Two centuries · 193 countries" title="Data">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-2">
        <DataOrb />
        <p className="max-w-[16rem] text-center text-sm leading-6 text-muted-foreground">
          Health, income, spending, and law for every country, every year
          there is a record
        </p>
      </div>
    </Tile>
  );
}

// Gauges run from zero to 120% of the target, so both targets sit at the
// same mark and the needle shows how far each reading has to go.
const GAUGE_TARGET_FRACTION = 1 / 1.2;

function gaugePoint(fraction: number, radius: number): [number, number] {
  const angle = Math.PI * Math.min(Math.max(fraction, 0), 1);
  return [100 - radius * Math.cos(angle), 100 - radius * Math.sin(angle)];
}

function Gauge({
  current,
  label,
  target,
}: {
  current: { param: Parameter; text?: string };
  label: string;
  target: { param: Parameter; text?: string };
}) {
  const fraction = (current.param.value / target.param.value) * GAUGE_TARGET_FRACTION;
  const [valueX, valueY] = gaugePoint(fraction, 80);
  const [tickInnerX, tickInnerY] = gaugePoint(GAUGE_TARGET_FRACTION, 66);
  const [tickOuterX, tickOuterY] = gaugePoint(GAUGE_TARGET_FRACTION, 94);

  return (
    <div className="min-w-0">
      <svg aria-hidden="true" className="block w-full max-w-[200px]" viewBox="0 0 200 108">
        <path
          className="stroke-foreground/15"
          d="M20,100 A80,80 0 0 1 180,100"
          fill="none"
          strokeWidth={12}
        />
        <path
          className="stroke-foreground"
          d={`M20,100 A80,80 0 0 1 ${valueX.toFixed(2)},${valueY.toFixed(2)}`}
          fill="none"
          strokeWidth={12}
        />
        <line
          className="stroke-brutal-cyan"
          strokeWidth={4}
          x1={tickInnerX}
          x2={tickOuterX}
          y1={tickInnerY}
          y2={tickOuterY}
        />
      </svg>
      <p className="mt-2 font-mono text-2xl font-bold tabular-nums">
        <ParameterValue param={current.param} valueOverride={current.text} />
      </p>
      <p className="mt-1 text-sm font-bold">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        2040 with the 1% Treaty:{" "}
        <ParameterValue
          className={`font-bold ${accentTextClass}`}
          param={target.param}
          valueOverride={target.text}
        />
      </p>
    </div>
  );
}

function ReadingsTile() {
  return (
    <Tile note="World" title="Readings">
      <div className="grid grid-cols-2 gap-5">
        <Gauge
          current={{ param: GLOBAL_HALE_CURRENT, text: `${GLOBAL_HALE_CURRENT.value} yrs` }}
          label="Healthy life expectancy"
          target={{ param: TREATY_PROJECTED_HALE_YEAR_15, text: `${TREATY_PROJECTED_HALE_YEAR_15.value} yrs` }}
        />
        <Gauge
          current={{
            param: GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025,
            text: wholeUsd(GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025.value),
          }}
          label="After-tax income"
          target={{
            param: TREATY_TRAJECTORY_MEDIAN_AFTER_TAX_INCOME_YEAR_15,
            text: wholeUsd(TREATY_TRAJECTORY_MEDIAN_AFTER_TAX_INCOME_YEAR_15.value),
          }}
        />
      </div>
    </Tile>
  );
}

function DiseaseQueueTile() {
  const now = STATUS_QUO_QUEUE_CLEARANCE_YEARS;
  const treaty = DFDA_QUEUE_CLEARANCE_YEARS;
  const rows = [
    { barClass: "bg-foreground", label: "Now", param: now, width: 100 },
    {
      barClass: "bg-brutal-cyan",
      label: "With the 1% Treaty",
      param: treaty,
      width: (treaty.value / now.value) * 100,
    },
  ];

  return (
    <Tile
      note={
        <>
          <ParameterValue
            param={DISEASES_WITHOUT_EFFECTIVE_TREATMENT}
            valueOverride={DISEASES_WITHOUT_EFFECTIVE_TREATMENT.value.toLocaleString("en-US")}
          />{" "}
          diseases with no effective treatment
        </>
      }
      title="Disease queue"
    >
      <p className="text-sm text-muted-foreground">Years to find a first treatment for every one</p>
      <div className="mt-4 flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span>{row.label}</span>
              <span className="font-mono text-xl font-bold tabular-nums">
                <ParameterValue
                  param={row.param}
                  valueOverride={String(Math.round(row.param.value))}
                />{" "}
                years
              </span>
            </div>
            <div aria-hidden="true" className="mt-1.5 h-3 bg-foreground/10">
              <div className={`h-full ${row.barClass}`} style={{ width: `${row.width}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-sm leading-6 text-muted-foreground">
        First treatments a year go from{" "}
        <ParameterValue
          className="font-bold text-foreground"
          param={NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR}
          display="integer"
        />{" "}
        to{" "}
        <ParameterValue
          className="font-bold text-foreground"
          param={DFDA_FIRST_TREATMENTS_PER_YEAR}
          display="integer"
        />
        . Pragmatic trials cost{" "}
        <ParameterValue
          className="font-bold text-foreground"
          param={DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT}
          valueOverride={wholeUsd(DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT.value)}
        />{" "}
        a patient. A conventional phase 3 trial costs{" "}
        <ParameterValue
          className="font-bold text-foreground"
          param={TRADITIONAL_PHASE3_COST_PER_PATIENT}
          valueOverride={wholeUsd(TRADITIONAL_PHASE3_COST_PER_PATIENT.value)}
        />{" "}
        a patient.
      </p>
      <div className="mt-auto pt-5">
        <Link className={landingLinkClass} href={ROUTES.dfda}>
          See the Decentralized FDA
        </Link>
      </div>
    </Tile>
  );
}

function BudgetGeneratorTile() {
  const benchmarks = getSpendingBenchmarks();
  const measuredLines = getMeasuredBudgetLines();

  return (
    <Tile note="US spending per person vs the cheapest country in the top quarter for results" title="Optimal Budget Generator">
      <ul className="flex flex-col gap-4">
        {benchmarks.map((row) => (
          <li key={row.field}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0">{row.field}</span>
              <span className="shrink-0 font-mono font-bold">{row.overspendRatio}×</span>
            </div>
            <div aria-hidden="true" className="relative mt-1 h-2.5 bg-foreground/35">
              <div
                className="absolute inset-y-0 left-0 bg-brutal-cyan"
                style={{ width: `${(row.bestPerCapita / row.usPerCapita) * 100}%` }}
              />
            </div>
            <p className="mt-1 font-mono text-sm tabular-nums text-muted-foreground">
              US {wholeUsd(row.usPerCapita)} ·{" "}
              <span className={accentTextClass}>
                {row.bestCountry} {wholeUsd(row.bestPerCapita)}
              </span>
            </p>
          </li>
        ))}
      </ul>
      {measuredLines.map((line) => (
        <p className="mt-5 text-sm leading-6 text-muted-foreground" key={line.name}>
          {line.name} at {line.benchmarkCountry}’s rate:{" "}
          <span className="font-mono font-bold text-foreground">
            {compactUsd(line.current)} → {compactUsd(line.optimal)}
          </span>{" "}
          a year.
        </p>
      ))}
      <div className="mt-auto pt-5">
        <Link className={landingLinkClass} href={ROUTES.obg}>
          See the whole budget
        </Link>
      </div>
    </Tile>
  );
}

function LovingTakeoverTile() {
  return (
    <Tile
      className="md:col-span-2 lg:col-span-3"
      note="Shareholder votes, pointed at welfare"
      title="The Loving Takeover"
    >
      <p className="max-w-3xl text-base leading-7">
        Recommendations do nothing until someone with power acts on them. The
        Loving Takeover buys voting shares in the companies whose lobbying
        writes government budgets, uses those votes to point the lobbying at
        the policies above, and keeps the shares.
      </p>
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <div>
          <p className="font-mono text-3xl font-bold">
            <ParameterValue
              param={US_TOTAL_LOBBYING_ANNUAL}
              valueOverride={compactUsd(US_TOTAL_LOBBYING_ANNUAL.value)}
            />
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            spent on US federal lobbying in 2024
          </p>
        </div>
        <div>
          <p className="font-mono text-3xl font-bold">0.02%</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            of ExxonMobil won Engine No. 1 three board seats in 2021
          </p>
        </div>
        <div>
          <p className="font-mono text-3xl font-bold">
            <ParameterValue
              param={DEFENSE_TAKEOVER_COST_PER_HUMAN}
              valueOverride={wholeUsd(DEFENSE_TAKEOVER_COST_PER_HUMAN.value)}
            />
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            per human buys outright control of every major Western military contractor
          </p>
        </div>
      </div>
      <div className="mt-6">
        <Link className={landingButtonClass} href={LOVING_TAKEOVER_FUNDING_HREF}>
          Fund the Loving Takeover
        </Link>
      </div>
    </Tile>
  );
}

export function FeaturedProductsSection() {
  const { policies, total } = getGradedPolicySample();

  return (
    <LandingSection
      id="products"
      title="Featured products"
    >
      <TileGrid>
        <DataTile />
        <ReadingsTile />
        <DiseaseQueueTile />
        <PolicyGeneratorTile policies={policies} total={total} />
        <BudgetGeneratorTile />
        <TaskTreeTile nodes={TASK_TREE_PATH} signers={getTreatySigners()} />
        <LovingTakeoverTile />
      </TileGrid>
    </LandingSection>
  );
}
