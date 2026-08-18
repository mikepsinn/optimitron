import { DESTRUCTIVE_ECONOMY_50PCT_YEAR } from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { CollapseCountdown } from "@/components/eos-retro/CollapseCountdown";

/**
 * The crossover chart: parasitic share of the economy against the
 * productive share, with the collapse thresholds of states that already
 * ran the experiment. Adapted from demo/slides/sierra/
 * slide-economic-collapse-clock.tsx with the Sierra chrome (glitch
 * overlays, screen shake, flash cards) stripped. The chart SVG is static
 * and server-rendered; only the countdown ticks.
 */

const COLLAPSE_YEAR = Math.round(DESTRUCTIVE_ECONOMY_50PCT_YEAR.value);

// Extraction shares at collapse for historical failed states, from
// manual.warondisease.org/knowledge/economics/gdp-trajectories.html#two-paths
// (same source and values as the harvest slide). // allow-hardcoded: cited historical thresholds
const FAILED_STATES = [
  { name: "Argentina 2001", pct: 38 },
  { name: "Yugoslavia 1991", pct: 40 },
  { name: "Soviet Union 1991", pct: 45 },
];

const GDP_TRAJECTORIES_URL =
  "https://manual.warondisease.org/knowledge/economics/gdp-trajectories.html#two-paths";

const CHART_START = 2015;
const CHART_END = 2045;
const NOW_YEAR = 2026;
// Growth rate calibrated so the parasitic share hits 50% at COLLAPSE_YEAR,
// matching the harvest slide's calibration. // allow-hardcoded: 11.5% 2020 base from gdp-trajectories
const PARASITIC_BASE = 11.5;
const GROWTH_RATE = Math.pow(50 / PARASITIC_BASE, 1 / (COLLAPSE_YEAR - 2020));

function parasiticAtYear(y: number): number {
  return Math.min(PARASITIC_BASE * Math.pow(GROWTH_RATE, y - 2020), 80);
}

const W = 720;
const H = 300;
const PAD = { left: 52, right: 24, top: 26, bottom: 34 };

function x(year: number): number {
  return PAD.left + ((year - CHART_START) / (CHART_END - CHART_START)) * (W - PAD.left - PAD.right);
}

function y(pct: number): number {
  return PAD.top + (1 - pct / 100) * (H - PAD.top - PAD.bottom);
}

export function CollapseClock() {
  const years = Array.from(
    { length: CHART_END - CHART_START + 1 },
    (_, i) => CHART_START + i,
  );
  const parasiticPath = years
    .map((yr) => `${x(yr).toFixed(1)},${y(parasiticAtYear(yr)).toFixed(1)}`)
    .join(" ");
  const productivePath = years
    .map((yr) => `${x(yr).toFixed(1)},${y(100 - parasiticAtYear(yr)).toFixed(1)}`)
    .join(" ");

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="er-giant">
            <ParameterValue display="integer" param={DESTRUCTIVE_ECONOMY_50PCT_YEAR} />
          </div>
          <p className="er-caption mt-2">
            The year the parasitic half of the economy outweighs the
            productive half, at growth rates already measured.
          </p>
          <CollapseCountdown targetYear={COLLAPSE_YEAR} />
        </div>
        <div className="er-panel-soft max-w-sm p-5">
          <p className="er-caption">
            States that reached these extraction loads, and what happened
            next:
          </p>
          <div className="er-pricelist mt-2">
            {FAILED_STATES.map((fs) => (
              <div className="er-price-row" key={fs.name} style={{ paddingBlock: "0.5rem" }}>
                <span className="er-body text-sm">{fs.name}</span>
                <span aria-hidden="true" className="er-price-dots" />
                <span className="er-mono text-sm" style={{ color: "var(--er-orange)" }}>
                  {fs.pct}%
                </span>
              </div>
            ))}
          </div>
          <a
            className="er-link er-mono mt-3 inline-block text-xs"
            href={GDP_TRAJECTORIES_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            The trajectory math
          </a>
        </div>
      </div>

      <div className="er-panel er-ticked mt-8 p-5 sm:p-7">
        <div className="er-table-scroll">
        <div style={{ minWidth: "36rem" }}>
        <svg
          aria-label="Productive vs parasitic share of world output, 2015 to 2045"
          className="h-auto w-full"
          role="img"
          viewBox={`0 0 ${W} ${H}`}
        >
          {[0, 25, 50, 75, 100].map((pct) => (
            <g key={pct}>
              <line className="er-chart-grid" x1={PAD.left} x2={W - PAD.right} y1={y(pct)} y2={y(pct)} />
              <text className="er-chart-tick" textAnchor="end" x={PAD.left - 8} y={y(pct) + 4}>
                {pct}%
              </text>
            </g>
          ))}
          {[2015, 2025, 2035, 2045].map((yr) => (
            <text className="er-chart-tick" key={yr} textAnchor="middle" x={x(yr)} y={H - 8}>
              {yr}
            </text>
          ))}

          {FAILED_STATES.map((fs) => (
            <line
              key={fs.name}
              stroke="var(--er-line-strong)"
              strokeDasharray="3 4"
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(fs.pct)}
              y2={y(fs.pct)}
            />
          ))}

          <polyline fill="none" points={productivePath} stroke="var(--er-cyan)" strokeWidth={2.5} />
          <polyline fill="none" points={parasiticPath} stroke="var(--er-red)" strokeWidth={2.5} />

          <line
            stroke="var(--er-gold)"
            strokeDasharray="4 4"
            x1={x(COLLAPSE_YEAR)}
            x2={x(COLLAPSE_YEAR)}
            y1={PAD.top}
            y2={H - PAD.bottom}
          />
          <circle cx={x(COLLAPSE_YEAR)} cy={y(50)} fill="var(--er-gold)" r={5} />
          <text
            className="er-chart-note"
            fill="var(--er-gold)"
            textAnchor="middle"
            x={x(COLLAPSE_YEAR)}
            y={PAD.top - 8}
          >
            crossover
          </text>

          <line
            stroke="var(--er-cream-muted)"
            strokeDasharray="2 4"
            x1={x(NOW_YEAR)}
            x2={x(NOW_YEAR)}
            y1={PAD.top}
            y2={H - PAD.bottom}
          />
          <text className="er-chart-tick" textAnchor="middle" x={x(NOW_YEAR)} y={PAD.top - 8}>
            now
          </text>

          <text className="er-chart-note" fill="var(--er-cyan)" x={PAD.left + 8} y={y(64)}>
            productive economy
          </text>
          <text className="er-chart-note" fill="var(--er-red)" x={PAD.left + 8} y={y(22)}>
            parasitic economy
          </text>
        </svg>
        </div>
        </div>
        <p className="er-caption mt-3">
          Fig. 3 · Share of world output, 2015 to 2045. The red line is war,
          fraud, cybercrime, and enforced waste, growing at its measured
          rate. Dotted thresholds, bottom to top: Argentina at 38%,
          Yugoslavia at 40%, the Soviet Union at 45%. No country has crossed
          them and kept its government.
        </p>
      </div>
    </div>
  );
}
