import { usBudgetAnalysis } from "@/data/us-budget-analysis";

/**
 * The Optimal Budget Generator exhibit: the health-spending efficient
 * frontier as a static SVG (adapted from landing/EfficientFrontierChart,
 * re-plotted against the current generated data shape and the eos-retro
 * palette), plus the flagship current-vs-optimal bar from the military
 * category. Server component; zero client JS.
 */

interface Decile {
  decile: number;
  spending: number;
  outcome: number;
}

interface FrontierCategory {
  outcomeName: string;
  deciles: Decile[];
}

interface BudgetCategory {
  id?: string;
  name: string;
  currentSpendingRealPerCapita: number;
  optimalSpendingPerCapita: number;
  gapPercent: number;
  recommendation: string;
  evidenceSource: string;
}

const WIDTH = 720;
const HEIGHT = 330;
const PAD = { top: 26, right: 26, bottom: 48, left: 60 };

function fmtDollars(v: number): string {
  return v >= 1000 ? `$${(v / 1000).toFixed(1).replace(/\.0$/, "")}K` : `$${Math.round(v)}`;
}

export function BudgetFrontierExhibit() {
  const frontier = (
    usBudgetAnalysis as unknown as {
      efficientFrontier: {
        categories: Record<string, FrontierCategory>;
        totals: {
          usCurrentTotalPerCapita: number;
          efficientFrontierTotalPerCapita: number;
          ratio: number;
        };
      };
    }
  ).efficientFrontier;
  const health = frontier.categories["health"];
  const totals = frontier.totals;
  const military = (usBudgetAnalysis.categories as unknown as BudgetCategory[]).find(
    (c) => c.id === "military",
  );

  if (!health || !military) return null;

  const points = health.deciles.map((d) => ({ x: d.spending, y: d.outcome }));
  const first = points[0];
  if (!first) return null;
  const xMax = Math.max(...points.map((p) => p.x)) * 1.08;
  const yMin = Math.min(...points.map((p) => p.y)) - 1;
  const yMax = Math.max(...points.map((p) => p.y)) + 1;

  const xScale = (v: number) =>
    PAD.left + (v / xMax) * (WIDTH - PAD.left - PAD.right);
  const yScale = (v: number) =>
    HEIGHT - PAD.bottom - ((v - yMin) / (yMax - yMin)) * (HEIGHT - PAD.top - PAD.bottom);

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xScale(p.x).toFixed(1)},${yScale(p.y).toFixed(1)}`)
    .join(" ");

  const peak = points.reduce((best, p) => (p.y > best.y ? p : best), first);
  const last = points[points.length - 1] ?? first;

  const xTicks = [0, 2000, 4000, 6000, 8000, 10000].filter((v) => v <= xMax);
  const yTicks: number[] = [];
  for (let v = Math.ceil(yMin); v <= yMax; v += 2) yTicks.push(v);

  const barMax = military.currentSpendingRealPerCapita;
  const currentPct = 100;
  const optimalPct = (military.optimalSpendingPerCapita / barMax) * 100;

  return (
    <div className="er-panel er-ticked p-5 sm:p-7">
      <div className="er-table-scroll">
        <div style={{ minWidth: "36rem" }}>
      <svg
        aria-label={`Health spending per person against ${health.outcomeName.toLowerCase()}, OECD spending deciles`}
        className="h-auto w-full"
        role="img"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      >
        {yTicks.map((v) => (
          <g key={`y-${v}`}>
            <line
              className="er-chart-grid"
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={yScale(v)}
              y2={yScale(v)}
            />
            <text className="er-chart-tick" textAnchor="end" x={PAD.left - 8} y={yScale(v) + 4}>
              {v}
            </text>
          </g>
        ))}
        {xTicks.map((v) => (
          <text
            className="er-chart-tick"
            key={`x-${v}`}
            textAnchor="middle"
            x={xScale(v)}
            y={HEIGHT - PAD.bottom + 18}
          >
            {fmtDollars(v)}
          </text>
        ))}

        <path className="er-chart-line" d={linePath} />
        {points.map((p) => (
          <circle
            cx={xScale(p.x)}
            cy={yScale(p.y)}
            fill="var(--er-cream-soft)"
            key={p.x}
            r={3.5}
          />
        ))}

        {/* The frontier: most life per dollar. */}
        <circle
          cx={xScale(peak.x)}
          cy={yScale(peak.y)}
          fill="var(--er-gold)"
          r={6}
          stroke="var(--er-bg)"
          strokeWidth={2}
        />
        <text
          className="er-chart-note"
          fill="var(--er-gold)"
          textAnchor="middle"
          x={xScale(peak.x)}
          y={yScale(peak.y) - 14}
        >
          the frontier: {peak.y} yrs at {fmtDollars(peak.x)}
        </text>

        {/* The overspend zone: more money, less life. */}
        <circle
          cx={xScale(last.x)}
          cy={yScale(last.y)}
          fill="var(--er-orange)"
          r={6}
          stroke="var(--er-bg)"
          strokeWidth={2}
        />
        <text
          className="er-chart-note"
          fill="var(--er-orange)"
          textAnchor="end"
          x={xScale(last.x) + 8}
          y={yScale(last.y) + 24}
        >
          {fmtDollars(last.x)} buys {last.y} yrs
        </text>

        <text
          className="er-chart-tick"
          textAnchor="middle"
          x={(PAD.left + WIDTH - PAD.right) / 2}
          y={HEIGHT - 8}
        >
          health spending per person (USD PPP)
        </text>
        <text
          className="er-chart-tick"
          textAnchor="middle"
          transform={`rotate(-90, 14, ${HEIGHT / 2})`}
          x={14}
          y={HEIGHT / 2}
        >
          {health.outcomeName.toLowerCase()} (yrs)
        </text>
      </svg>
        </div>
      </div>

      <p className="er-caption mt-3">
        Fig. 2 · OECD countries grouped into ten health-spending deciles.
        Past the gold point, every extra dollar buys less life. The dot on
        the far right is the decile the United States lives in.
      </p>

      <div className="mt-8 border-t pt-6" style={{ borderColor: "var(--er-line)" }}>
        <p className="er-card-title">{military.name}: what you pay vs the efficient floor</p>
        <div className="mt-3">
          <div className="er-bar-row">
            <span className="er-caption">Current, per person</span>
            <div className="er-bar-track">
              <div
                className="er-bar-fill"
                style={{ width: `${currentPct}%`, background: "var(--er-orange)" }}
              />
            </div>
            <span className="er-mono text-sm" style={{ color: "var(--er-orange)" }}>
              {fmtDollars(military.currentSpendingRealPerCapita)}
            </span>
          </div>
          <div className="er-bar-row">
            <span className="er-caption">Efficient floor</span>
            <div className="er-bar-track">
              <div
                className="er-bar-fill"
                style={{ width: `${optimalPct}%`, background: "var(--er-gold)" }}
              />
            </div>
            <span className="er-mono text-sm" style={{ color: "var(--er-gold)" }}>
              {fmtDollars(military.optimalSpendingPerCapita)}
            </span>
          </div>
        </div>
        <p className="er-caption mt-2">
          Source: {military.evidenceSource}. The generator&apos;s verdict:{" "}
          {military.recommendation.replace(/_/g, " ")}, closing{" "}
          {military.gapPercent.toFixed(0)}% of the gap.
        </p>
      </div>

      <p className="er-body mt-6 text-sm">
        Run every category this way and the whole government costs{" "}
        <span className="er-mono" style={{ color: "var(--er-gold)" }}>
          {fmtDollars(totals.efficientFrontierTotalPerCapita)}
        </span>{" "}
        per person instead of{" "}
        <span className="er-mono" style={{ color: "var(--er-orange)" }}>
          {fmtDollars(totals.usCurrentTotalPerCapita)}
        </span>
        , for equal or better outcomes. A {totals.ratio.toFixed(1)}x markup,
        currently billed to you.
      </p>
    </div>
  );
}
