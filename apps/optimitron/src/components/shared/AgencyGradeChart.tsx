import Link from "next/link";
import type {
  AgencyPerformance,
  AgencyGrade,
} from "@optimitron/data/datasets/agency-performance";

type Point = { year: number; value: number };
type Annotation = NonNullable<AgencyPerformance["annotations"]>[number];

const SPENDING_COLOR = "var(--foreground)";
const OUTCOME_COLOR = "var(--brutal-red)";
const OUTCOME_DASH = "7 4";

const gradeColors: Record<AgencyGrade, string> = {
  A: "bg-background text-foreground",
  B: "bg-background text-foreground",
  C: "bg-background text-foreground",
  D: "bg-background text-foreground",
  F: "bg-background text-foreground",
};

interface ChartLayout {
  width: number;
  height: number;
  /** Font size in SVG units. Each layout renders at about its own width, so a unit is about a CSS pixel. */
  font: number;
  dot: number;
  pad: { top: number; right: number; bottom: number; left: number };
}

/** Cards and phone screens: the chart renders about 300–370 px wide. */
const NARROW_LAYOUT: ChartLayout = {
  width: 360,
  height: 230,
  font: 12,
  dot: 2.5,
  pad: { top: 14, right: 46, bottom: 26, left: 50 },
};

/** The full-width chart on an agency page: about 820 px wide from the sm breakpoint. */
const WIDE_LAYOUT: ChartLayout = {
  width: 820,
  height: 380,
  font: 14,
  dot: 3.5,
  pad: { top: 34, right: 64, bottom: 32, left: 70 },
};

function niceStep(span: number, targetTicks: number): number {
  const raw = span / targetTicks;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const nice =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

/**
 * The bounds and tick values of one vertical axis. Dollar amounts always start
 * at 0. Other series start at 0 when their smallest value is at most half of
 * their largest; otherwise the axis zooms in and its labeled minimum shows that.
 */
function valueAxis(values: number[], startAtZero: boolean) {
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (startAtZero || (min >= 0 && min <= max / 2)) min = Math.min(0, min);
  if (min === max) max = min + 1;
  const step = niceStep(max - min, 4);
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let i = 0; lo + i * step <= hi + step / 2; i++) {
    ticks.push(Number((lo + i * step).toPrecision(12)));
  }
  return { lo, hi, ticks };
}

function yearTicks(minYear: number, maxYear: number): number[] {
  const span = maxYear - minYear;
  const step = span <= 12 ? 2 : span <= 30 ? 5 : span <= 60 ? 10 : 20;
  const ticks = [minYear];
  for (let year = Math.ceil((minYear + 1) / step) * step; year < maxYear; year += step) {
    if (year - minYear >= step / 2 && maxYear - year >= step / 2) ticks.push(year);
  }
  if (maxYear !== minYear) ticks.push(maxYear);
  return ticks;
}

function formatUsd(value: number): string {
  const abs = Math.abs(value);
  const scaled = (n: number, suffix: string) => `$${Number(n.toPrecision(3)).toLocaleString("en-US")}${suffix}`;
  if (abs >= 1e12) return scaled(value / 1e12, "T");
  if (abs >= 1e9) return scaled(value / 1e9, "B");
  if (abs >= 1e6) return scaled(value / 1e6, "M");
  if (abs >= 1e3) return scaled(value / 1e3, "K");
  return `$${value.toLocaleString("en-US")}`;
}

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatValue(value: number): string {
  return Math.abs(value) >= 10_000
    ? compactNumber.format(value)
    : value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function LineSwatch({ color, dashed }: { color: string; dashed?: boolean }) {
  return (
    <svg width="24" height="10" className="shrink-0" aria-hidden="true">
      <line
        x1="2"
        y1="5"
        x2="22"
        y2="5"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={dashed ? "5 3" : undefined}
      />
    </svg>
  );
}

function ChartLegend({
  spendingLabel,
  outcomeLabel,
  className,
}: {
  spendingLabel: string;
  outcomeLabel: string;
  className: string;
}) {
  return (
    <div className={`flex flex-col gap-1 font-bold text-foreground ${className}`}>
      <span className="flex items-start gap-1.5">
        <LineSwatch color={SPENDING_COLOR} />
        <span>
          {spendingLabel} <span className="text-muted-foreground">· left axis</span>
        </span>
      </span>
      <span className="flex items-start gap-1.5">
        <LineSwatch color={OUTCOME_COLOR} dashed />
        <span>
          {outcomeLabel} <span className="text-muted-foreground">· right axis</span>
        </span>
      </span>
    </div>
  );
}

interface SeriesChartProps {
  spend: Point[];
  outcome: Point[];
  annotations: Annotation[];
  layout: ChartLayout;
  ariaLabel: string;
  className?: string;
}

function SeriesChart({ spend, outcome, annotations, layout, ariaLabel, className }: SeriesChartProps) {
  const { width: W, height: H, font, dot } = layout;
  const years = [...spend, ...outcome].map((p) => p.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const visibleAnnotations = annotations
    .filter((a) => a.year >= minYear && a.year <= maxYear)
    .sort((a, b) => a.year - b.year);
  // Event years print in two rows above the plot.
  const pad = {
    ...layout.pad,
    top: visibleAnnotations.length > 0 ? Math.max(layout.pad.top, 2 * font + 10) : layout.pad.top,
  };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const xScale = (year: number) => pad.left + ((year - minYear) / (maxYear - minYear || 1)) * plotW;
  // Year labels are centered and about 2.6 font sizes wide; keep only labels that clear their neighbors.
  const minLabelGap = 3.2 * font;
  const yearLabels = yearTicks(minYear, maxYear).filter(
    (year) =>
      year === minYear ||
      year === maxYear ||
      (xScale(year) - xScale(minYear) >= minLabelGap && xScale(maxYear) - xScale(year) >= minLabelGap),
  );

  const spendAxis = valueAxis(spend.map((p) => p.value), true);
  const outcomeAxis = valueAxis(outcome.map((p) => p.value), false);
  const yScale = (axis: { lo: number; hi: number }, value: number) =>
    pad.top + plotH - ((value - axis.lo) / (axis.hi - axis.lo)) * plotH;

  const path = (points: Point[], axis: { lo: number; hi: number }) =>
    points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.year)} ${yScale(axis, p.value)}`)
      .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`w-full ${className ?? ""}`}
      role="img"
      aria-label={ariaLabel}
    >
      {/* Horizontal grid at the spending ticks */}
      {spendAxis.ticks.map((tick) => (
        <line
          key={`grid-${tick}`}
          x1={pad.left}
          y1={yScale(spendAxis, tick)}
          x2={pad.left + plotW}
          y2={yScale(spendAxis, tick)}
          stroke="currentColor"
          strokeOpacity={0.12}
        />
      ))}

      {/* Event markers; the list under the chart explains each year */}
      {visibleAnnotations.map((ann, i) => {
        const x = xScale(ann.year);
        return (
          <g key={`ann-${ann.year}-${i}`}>
            <line
              x1={x}
              y1={pad.top}
              x2={x}
              y2={pad.top + plotH}
              stroke={OUTCOME_COLOR}
              strokeOpacity={0.45}
              strokeDasharray="2 3"
            />
            <text
              x={x}
              y={pad.top - 6 - (i % 2) * (font + 2)}
              textAnchor="middle"
              fontSize={font - 2}
              className="fill-brutal-red font-bold"
            >
              {ann.year}
            </text>
          </g>
        );
      })}

      {/* Left axis: spending */}
      {spendAxis.ticks.map((tick) => (
        <text
          key={`left-${tick}`}
          x={pad.left - 6}
          y={yScale(spendAxis, tick)}
          dy="0.35em"
          textAnchor="end"
          fontSize={font}
          className="fill-foreground font-bold"
        >
          {formatUsd(tick)}
        </text>
      ))}

      {/* Right axis: outcome */}
      {outcomeAxis.ticks.map((tick) => (
        <text
          key={`right-${tick}`}
          x={pad.left + plotW + 6}
          y={yScale(outcomeAxis, tick)}
          dy="0.35em"
          textAnchor="start"
          fontSize={font}
          className="fill-brutal-red font-bold"
        >
          {formatValue(tick)}
        </text>
      ))}

      {/* Bottom axis: years */}
      <line
        x1={pad.left}
        y1={pad.top + plotH}
        x2={pad.left + plotW}
        y2={pad.top + plotH}
        stroke="currentColor"
        strokeOpacity={0.4}
      />
      {yearLabels.map((year) => (
        <text
          key={`year-${year}`}
          x={xScale(year)}
          y={H - 6}
          textAnchor="middle"
          fontSize={font}
          className="fill-muted-foreground font-bold"
        >
          {year}
        </text>
      ))}

      <path
        d={path(spend, spendAxis)}
        fill="none"
        stroke={SPENDING_COLOR}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={path(outcome, outcomeAxis)}
        fill="none"
        stroke={OUTCOME_COLOR}
        strokeWidth={2.5}
        strokeDasharray={OUTCOME_DASH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* A dot at every data point, so gaps between measured years stay visible */}
      {spend.map((p) => (
        <circle
          key={`spend-${p.year}`}
          cx={xScale(p.year)}
          cy={yScale(spendAxis, p.value)}
          r={dot}
          fill={SPENDING_COLOR}
        />
      ))}
      {outcome.map((p) => (
        <circle
          key={`outcome-${p.year}`}
          cx={xScale(p.year)}
          cy={yScale(outcomeAxis, p.value)}
          r={dot}
          fill={OUTCOME_COLOR}
        />
      ))}
    </svg>
  );
}

function describeSeries(label: string, points: Point[], format: (value: number) => string): string {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return label;
  return `${label}: ${format(first.value)} in ${first.year}, ${format(last.value)} in ${last.year}`;
}

function DataTable({ agency }: { agency: AgencyPerformance }) {
  const years = [
    ...new Set([
      ...agency.spendingTimeSeries.map((p) => p.year),
      ...agency.outcomes.flatMap((o) => o.data.map((p) => p.year)),
    ]),
  ].sort((a, b) => a - b);
  const valueIn = (points: Point[], year: number) => points.find((p) => p.year === year)?.value;

  return (
    <details className="mt-4 text-sm">
      <summary className="cursor-pointer font-black uppercase text-foreground">
        Show the numbers
      </summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-left font-bold">
          <thead>
            <tr className="border-b border-foreground/30">
              <th className="py-1 pr-4">Year</th>
              <th className="py-1 pr-4">{agency.spendingLabel}</th>
              {agency.outcomes.map((o) => (
                <th key={o.label} className="py-1 pr-4">
                  {o.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {years.map((year) => {
              const spend = valueIn(agency.spendingTimeSeries, year);
              return (
                <tr key={year} className="border-b border-foreground/10">
                  <td className="py-1 pr-4">{year}</td>
                  <td className="py-1 pr-4">{spend === undefined ? "–" : formatUsd(spend)}</td>
                  {agency.outcomes.map((o) => {
                    const value = valueIn(o.data, year);
                    return (
                      <td key={o.label} className="py-1 pr-4">
                        {value === undefined ? "–" : value.toLocaleString("en-US")}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}

interface AgencyGradeChartProps {
  agency: AgencyPerformance;
  /**
   * "card": one chart for the primary outcome, sized for a grid card.
   * "full": one full-width chart per outcome, the annotated events, and the data table.
   */
  variant?: "card" | "full";
  /** Make the card a link to the agency's full report. */
  href?: string;
}

export function AgencyGradeChart({ agency, variant = "card", href }: AgencyGradeChartProps) {
  const spend = agency.spendingTimeSeries;
  const outcomes = (variant === "full" ? agency.outcomes : agency.outcomes.slice(0, 1)).filter(
    (o) => o.data.length >= 2,
  );
  if (spend.length < 2 || outcomes.length === 0) return null;

  const isFull = variant === "full";
  const chartedYears = [spend, ...outcomes.map((o) => o.data)].flat().map((p) => p.year);
  const firstYear = Math.min(...chartedYears);
  const lastYear = Math.max(...chartedYears);
  // Only events inside the charted years; each one has a marker on the chart.
  const annotations = (agency.annotations ?? [])
    .filter((a) => a.year >= firstYear && a.year <= lastYear)
    .sort((a, b) => a.year - b.year);

  const content = (
    <div className="border-y border-foreground/30 bg-background py-4">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-grow">
          <h4 className="truncate text-sm font-black uppercase text-foreground">
            {agency.emoji} {agency.agencyName}
          </h4>
          <p className="truncate text-xs font-bold text-muted-foreground">{agency.mission}</p>
        </div>
        <div
          className={`ml-2 flex h-10 w-10 shrink-0 items-center justify-center border border-foreground/30 ${gradeColors[agency.grade]} text-xl font-black`}
        >
          {agency.grade}
        </div>
      </div>

      {outcomes.map((outcome) => {
        const ariaLabel = `${agency.agencyName}. ${describeSeries(agency.spendingLabel, spend, formatUsd)}. ${describeSeries(outcome.label, outcome.data, (v) => v.toLocaleString("en-US"))}.`;
        return (
          <div key={outcome.label} className={isFull ? "mb-6" : undefined}>
            <ChartLegend
              spendingLabel={agency.spendingLabel}
              outcomeLabel={`${outcome.emoji} ${outcome.label}`}
              className={isFull ? "mb-2 text-sm" : "mb-2 text-xs"}
            />
            {isFull ? (
              <>
                <SeriesChart
                  spend={spend}
                  outcome={outcome.data}
                  annotations={annotations}
                  layout={WIDE_LAYOUT}
                  ariaLabel={ariaLabel}
                  className="hidden sm:block"
                />
                <SeriesChart
                  spend={spend}
                  outcome={outcome.data}
                  annotations={annotations}
                  layout={NARROW_LAYOUT}
                  ariaLabel={ariaLabel}
                  className="sm:hidden"
                />
              </>
            ) : (
              <SeriesChart
                spend={spend}
                outcome={outcome.data}
                annotations={[]}
                layout={NARROW_LAYOUT}
                ariaLabel={ariaLabel}
              />
            )}
          </div>
        );
      })}

      {/* Events marked on the charts */}
      {isFull && annotations.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {annotations.map((ann, i) => (
            <p key={`${ann.year}-${i}`} className="text-sm font-bold leading-snug text-muted-foreground">
              <span className="font-black text-brutal-red">{ann.year}</span>{" "}
              {ann.url ? (
                <a
                  href={ann.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  {ann.label} ↗
                </a>
              ) : (
                ann.label
              )}
            </p>
          ))}
        </div>
      )}

      <p className="mt-3 text-sm font-bold leading-relaxed text-muted-foreground">
        {agency.gradeRationale}
      </p>

      {isFull && <DataTable agency={agency} />}

      {href && (
        <p className="mt-3 text-sm font-black uppercase text-foreground">Open full report →</p>
      )}
    </div>
  );

  return href ? (
    <Link
      href={href}
      className="block transition-transform hover:translate-x-[-2px] hover:translate-y-[-2px]"
    >
      {content}
    </Link>
  ) : (
    content
  );
}
