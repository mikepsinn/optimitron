"use client";

import { useId, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DESTRUCTIVE_ECONOMY_35PCT_YEAR,
  GDP_BASELINE_GROWTH_RATE,
  GLOBAL_CYBERCRIME_CAGR,
  GLOBAL_DESTRUCTIVE_ECONOMY_PCT_GDP,
  GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025,
  GLOBAL_POPULATION_2024,
  TREATY_TRAJECTORY_CAGR_YEAR_20,
  WISHONIA_TRAJECTORY_CAGR_YEAR_20,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";

/**
 * SECTION 7 chart: the visitor's own number run through the four scenario
 * growth paths, 2025 to 2045. Adapted from eos-retro/FourEarthsChart with
 * the spec's Section 7 line names and annotations; every growth rate comes
 * from the parameter registry. Chart colors are literal hex mirroring the
 * .eos-preview tokens because SVG attributes cannot resolve CSS variables.
 */
const COLORS = {
  collapse: "#ff5c50", // --eos-bill-accent
  fantasy: "#8b8981", // --eos-ink-muted
  treaty: "#6fd3d0", // --eos-cyan
  optimal: "#f2c14e", // --eos-gold
  grid: "rgba(243, 241, 236, 0.08)",
  axis: "rgba(243, 241, 236, 0.42)",
};

const BASE_YEAR = 2025;
const YEARS = 20;

const G_BASE = GDP_BASELINE_GROWTH_RATE.value;
const G_TREATY = TREATY_TRAJECTORY_CAGR_YEAR_20.value;
const G_OPTIMAL = WISHONIA_TRAJECTORY_CAGR_YEAR_20.value;
const G_DESTRUCTIVE = GLOBAL_CYBERCRIME_CAGR.value;
const RATIO_0 = GLOBAL_DESTRUCTIVE_ECONOMY_PCT_GDP.value;
const YEAR_35PCT = Math.round(DESTRUCTIVE_ECONOMY_35PCT_YEAR.value);

const DEFAULT_INPUT = Math.round(GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025.value);

/** Destructive-economy share of output at year t, growth rates as measured. */
function extractionShare(t: number): number {
  return Math.min(1, RATIO_0 * Math.pow((1 + G_DESTRUCTIVE) / (1 + G_BASE), t));
}

/** Trend extended: baseline growth minus the compounding extraction load. */
function collapseIndex(t: number): number {
  return Math.max(
    0,
    (Math.pow(1 + G_BASE, t) * (1 - extractionShare(t))) / (1 - RATIO_0),
  );
}

const fantasyIndex = (t: number) => Math.pow(1 + G_BASE, t);
const treatyIndex = (t: number) => Math.pow(1 + G_TREATY, t);
const optimalIndex = (t: number) => Math.pow(1 + G_OPTIMAL, t);

/** Y-axis cap: a hair above the treaty endpoint; optimal exits the frame. */
const CAP_INDEX = treatyIndex(YEARS) * 1.18;
const OPTIMAL_EXIT_T = Math.log(CAP_INDEX) / Math.log(1 + G_OPTIMAL);

/** Approximate plot-area box as % of the chart container, for annotations. */
const PLOT = { left: 9, width: 88, top: 5, height: 78 };

function xPct(t: number): number {
  return PLOT.left + (t / YEARS) * PLOT.width;
}

function yPct(index: number): number {
  return PLOT.top + (1 - Math.min(index, CAP_INDEX) / CAP_INDEX) * PLOT.height;
}

/** ~3 significant figures without scientific notation. */
function fmtScaled(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 100) return Math.round(v).toLocaleString("en-US");
  if (abs >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

function fmtMoney(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${fmtScaled(n / 1e12)}T`;
  if (abs >= 1e9) return `$${fmtScaled(n / 1e9)}B`;
  if (abs >= 1e6) return `$${fmtScaled(n / 1e6)}M`;
  if (abs >= 1e4) return `$${Math.round(n / 1e3)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

function analogueForShare(share: number): string | null {
  if (share >= 0.5) return "Somalia";
  if (share >= 0.35) return "Venezuela";
  if (share >= 0.25) return "the Soviet Union";
  return null;
}

interface EarthPoint {
  year: number;
  collapse: number;
  fantasy: number;
  treaty: number;
  optimal: number;
  hedge: [number, number];
  share: number;
}

const SERIES_META = [
  {
    key: "collapse",
    name: "Collapse",
    note: "the current trend line, extended",
    color: COLORS.collapse,
  },
  {
    key: "fantasy",
    name: "Fantasy Baseline",
    note: "requires 20 consecutive lucky years",
    color: COLORS.fantasy,
  },
  {
    key: "treaty",
    name: "1% Treaty",
    note: "move 1% of the weapons budget to trials",
    color: COLORS.treaty,
  },
  {
    key: "optimal",
    name: "Optimal Governance",
    note: "full optimization",
    color: COLORS.optimal,
  },
] as const;

function EarthTooltip({
  active,
  payload,
  label,
  mode,
}: {
  active?: boolean;
  payload?: { payload?: EarthPoint }[];
  label?: number;
  mode: "income" | "networth";
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  const suffix = mode === "income" ? "/yr" : "";
  const analogue = analogueForShare(point.share);

  return (
    <div
      style={{
        background: "rgba(8, 9, 12, 0.96)",
        border: "1px solid rgba(243, 241, 236, 0.42)",
        padding: "0.6rem 0.75rem",
        fontFamily: "var(--eos-font-mono)",
        fontSize: "0.72rem",
        lineHeight: 1.7,
        color: "#f3f1ec",
      }}
    >
      <div style={{ letterSpacing: "0.2em" }}>{label}</div>
      {SERIES_META.map((s) => (
        <div key={s.key}>
          <span style={{ color: s.color }}>■</span> {s.name}: your projected{" "}
          {mode === "income" ? "income" : "net worth"} {fmtMoney(point[s.key])}
          {suffix}
        </div>
      ))}
      <div style={{ color: "#8b8981", maxWidth: "16rem", whiteSpace: "normal" }}>
        Extraction load: {Math.round(point.share * 100)}% of output.
        {analogue ? ` Historical precedent at this load: ${analogue}.` : ""}
      </div>
    </div>
  );
}

export function FourEarthsPreview() {
  const [mode, setMode] = useState<"income" | "networth">("income");
  const [input, setInput] = useState<number>(Number.NaN);
  const inputId = useId();

  const touched = Number.isFinite(input);
  const usingDefault = !(touched && input > 0);
  const amount = usingDefault ? DEFAULT_INPUT : input;
  const suffixMode = usingDefault ? "income" : mode;

  const data = useMemo<EarthPoint[]>(
    () =>
      Array.from({ length: YEARS + 1 }, (_, t) => {
        const collapse = amount * collapseIndex(t);
        const treaty = amount * treatyIndex(t);
        return {
          year: BASE_YEAR + t,
          collapse,
          fantasy: amount * fantasyIndex(t),
          treaty,
          optimal: amount * optimalIndex(t),
          hedge: [collapse, treaty] as [number, number],
          share: extractionShare(t),
        };
      }),
    [amount],
  );

  const cap = amount * CAP_INDEX;

  // Annotation positions are scale-invariant: indices only, no dollars.
  const hedgeMid = (treatyIndex(15) + collapseIndex(15)) / 2;
  const gapMid = (treatyIndex(9) + collapseIndex(9)) / 2;

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span
            aria-hidden="true"
            style={{
              color: "var(--eos-gold)",
              fontFamily: "var(--eos-font-mono)",
              fontSize: "1.6rem",
            }}
          >
            $
          </span>
          <input
            aria-label="Enter your net worth or annual income, in dollars"
            className="eos-input"
            id={inputId}
            inputMode="numeric"
            min={0}
            onChange={(e) => setInput(e.target.valueAsNumber)}
            placeholder="your number"
            step={100}
            type="number"
            value={Number.isFinite(input) ? input : ""}
          />
        </div>
        <div style={{ display: "flex" }}>
          <button
            className="eos-toggle"
            data-active={mode === "networth"}
            onClick={() => setMode("networth")}
            type="button"
          >
            Net worth
          </button>
          <button
            className="eos-toggle"
            data-active={mode === "income"}
            onClick={() => setMode("income")}
            style={{ borderLeft: "none" }}
            type="button"
          >
            Annual income
          </button>
        </div>
      </div>

      {usingDefault ? (
        <p
          style={{
            textAlign: "center",
            fontSize: "0.85rem",
            color: "var(--eos-ink-muted)",
            marginBottom: "1.5rem",
          }}
        >
          {touched
            ? "The chart needs a number above zero, so it is running "
            : "Until you type, the chart runs "}
          Earth&apos;s median after-tax income:{" "}
          <ParameterValue
            figures={4}
            param={GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025}
            presentation="inline"
          />{" "}
          a year.
          {touched ? null : (
            <>
              {" "}
              If your number is bigger, congratulations: you are ahead of half
              of Earth&apos;s{" "}
              <ParameterValue
                figures={1}
                param={GLOBAL_POPULATION_2024}
                presentation="inline"
              />{" "}
              people.
            </>
          )}
        </p>
      ) : (
        <div style={{ marginBottom: "1.5rem" }} />
      )}

      <div
        style={{
          display: "grid",
          gap: "0.5rem",
          marginBottom: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 15rem), 1fr))",
          fontFamily: "var(--eos-font-mono)",
          fontSize: "0.72rem",
        }}
      >
        {SERIES_META.map((s) => (
          <div key={s.key} style={{ color: "var(--eos-ink-soft)" }}>
            <span
              aria-hidden="true"
              style={{
                display: "inline-block",
                width: 18,
                height: 3,
                background: s.color,
                marginRight: 8,
                verticalAlign: "middle",
              }}
            />
            <span
              style={{
                color: s.color,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              {s.name}
            </span>{" "}
            <span style={{ color: "var(--eos-ink-muted)" }}>{s.note}</span>
          </div>
        ))}
      </div>

      <div className="relative" style={{ position: "relative", height: "min(60vh, 440px)" }}>
        <ResponsiveContainer
          height="100%"
          initialDimension={{ height: 440, width: 800 }}
          width="100%"
        >
          <ComposedChart data={data} margin={{ bottom: 4, left: 4, right: 12, top: 8 }}>
            <CartesianGrid stroke={COLORS.grid} vertical={false} />
            <XAxis
              axisLine={{ stroke: COLORS.axis }}
              dataKey="year"
              stroke={COLORS.axis}
              tick={{ fill: COLORS.axis, fontSize: 11, fontFamily: "monospace" }}
              tickLine={false}
              ticks={[2025, 2030, 2035, 2040, 2045]}
            />
            <YAxis
              allowDataOverflow
              axisLine={{ stroke: COLORS.axis }}
              domain={[0, cap]}
              stroke={COLORS.axis}
              tick={{ fill: COLORS.axis, fontSize: 11, fontFamily: "monospace" }}
              tickFormatter={fmtMoney}
              tickLine={false}
              width={64}
            />
            <Tooltip
              content={<EarthTooltip mode={suffixMode} />}
              cursor={{ stroke: COLORS.axis, strokeDasharray: "3 3" }}
            />
            <Area
              dataKey="hedge"
              fill={COLORS.treaty}
              fillOpacity={0.08}
              isAnimationActive={false}
              stroke="none"
              type="monotone"
            />
            <Line
              dataKey="fantasy"
              dot={false}
              isAnimationActive={false}
              stroke={COLORS.fantasy}
              strokeDasharray="6 6"
              strokeWidth={2}
              type="monotone"
            />
            <Line
              dataKey="treaty"
              dot={false}
              isAnimationActive={false}
              stroke={COLORS.treaty}
              strokeWidth={2.5}
              type="monotone"
            />
            <Line
              dataKey="optimal"
              dot={false}
              isAnimationActive={false}
              stroke={COLORS.optimal}
              strokeWidth={2.5}
              type="monotone"
            />
            <Line
              dataKey="collapse"
              dot={false}
              isAnimationActive={false}
              stroke={COLORS.collapse}
              strokeWidth={2.5}
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>

        <div
          className="eos-chart-annotation"
          style={{ left: `${xPct(OPTIMAL_EXIT_T) + 3}%`, top: `${PLOT.top + 4}%` }}
        >
          optimal leaves the chart in {BASE_YEAR + Math.ceil(OPTIMAL_EXIT_T)}
        </div>
        <div
          className="eos-chart-annotation"
          style={{ left: `${xPct(15)}%`, top: `${yPct(hedgeMid)}%` }}
        >
          the hedge
        </div>
        <div
          className="eos-chart-annotation"
          style={{ left: `${xPct(9)}%`, top: `${yPct(gapMid) - 8}%` }}
        >
          the gap: human stupidity, priced annually
        </div>
      </div>

      <p
        style={{
          marginTop: "0.9rem",
          fontFamily: "var(--eos-font-mono)",
          fontSize: "0.72rem",
          color: "var(--eos-ink-muted)",
        }}
      >
        Doing nothing selects the red line. Extraction load crosses 35% of
        output around {YEAR_35PCT}. Hover any year for your projected number
        under each Earth.
      </p>
    </div>
  );
}
