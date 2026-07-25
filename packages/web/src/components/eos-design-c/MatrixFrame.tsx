import type { ReactNode } from "react";
import {
  CROWD_DECISION_ACCURACY,
  DFDA_QUEUE_CLEARANCE_YEARS,
  EXPERT_DECISION_ACCURACY,
  GOV_REPLACEMENT_SUITE_OPEX_PER_CITIZEN_ANNUAL,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  PENTAGON_UNACCOUNTED_FUNDS,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  US_GOV_WASTE_PER_CAPITA_ANNUAL,
  US_GOV_WASTE_TAX_COMPLIANCE,
  US_TOTAL_LOBBYING_ANNUAL,
  WAR_DEATHS_SINCE_1900,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";

const P = "dc-p";

interface Row {
  label: string;
  gov: ReactNode;
  eos: ReactNode;
}

/** Rows verbatim from the spec's SECTION 3 table. */
const ROWS: Row[] = [
  {
    label: "People murdered",
    gov: (
      <>
        <ParameterValue
          className={P}
          display="withUnit"
          param={WAR_DEATHS_SINCE_1900}
        />{" "}
        since 1900
      </>
    ),
    eos: <span className="dc-zero">0</span>,
  },
  {
    label: "Money lost",
    gov: (
      <>
        <ParameterValue className={P} param={PENTAGON_UNACCOUNTED_FUNDS} />{" "}
        misplaced (7 failed audits)
      </>
    ),
    eos: "Public ledger. Every dollar tracked live.",
  },
  {
    label: "Tax code",
    gov: (
      <>
        74,000 pages,{" "}
        <ParameterValue className={P} param={US_GOV_WASTE_TAX_COMPLIANCE} />
        /year compliance
      </>
    ),
    eos: "6 lines of code. Filing cost: $0.",
  },
  {
    label: "Welfare programs",
    gov: "80+, each with its own forms, case workers, 45-day wait",
    eos: "1 for-loop. Equal split. Tomorrow morning.",
  },
  {
    label: "Decision method",
    gov: "535 humans who haven't read the bill, funded by the industries the bill regulates",
    eos: (
      <>
        <ParameterValue
          className={P}
          figures={2}
          param={CROWD_DECISION_ACCURACY}
        />{" "}
        crowd accuracy vs{" "}
        <ParameterValue
          className={P}
          figures={2}
          param={EXPERT_DECISION_ACCURACY}
        />{" "}
        expert. Every question ships with evidence.
      </>
    ),
  },
  {
    label: "Your input",
    gov: "1 bundled vote every 2 years. Correlation with outcomes: 0%.",
    eos: "20 specific questions/year. Pairwise comparisons. Evidence attached.",
  },
  {
    label: "Corruption surface",
    gov: (
      <>
        <ParameterValue
          className={P}
          figures={2}
          param={US_TOTAL_LOBBYING_ANNUAL}
        />
        /year in lobbying buys your laws
      </>
    ),
    eos: "No door. You cannot take 8 billion people to lunch.",
  },
  {
    label: "Policy evidence used",
    gov: "None. Drug war ran 50 years, overdoses up 1,700%, nobody checked.",
    eos: "10,000 jurisdictions measured. Synthetic controls, diff-in-diff, regression discontinuity.",
  },
  {
    label: "Disease queue",
    gov: (
      <>
        <ParameterValue
          className={P}
          display="withUnit"
          param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
        />{" "}
        at current rate
      </>
    ),
    eos: (
      <>
        <ParameterValue
          className={P}
          display="withUnit"
          param={DFDA_QUEUE_CLEARANCE_YEARS}
        />{" "}
        with 1% moved to clinical trials
      </>
    ),
  },
  {
    label: "Time to notice you died",
    gov: "Years (one week if you owed taxes)",
    eos: "One day. The deposit stops.",
  },
  {
    label: "Shuts down over disagreements",
    gov: "20+ times since 1976",
    eos: "There is no door",
  },
  {
    label: "Audit record",
    gov: "0 of 7 passed (Pentagon)",
    eos: "Real-time public ledger, continuous",
  },
  {
    label: "Budget allocation",
    gov: (
      <>
        <ParameterValue
          className={P}
          display="withUnit"
          param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
        />{" "}
        kill:cure ratio
      </>
    ),
    eos: "Optimal budget calculated to maximize the two numbers",
  },
  {
    label: "Sticker price",
    gov: (
      <>
        <ParameterValue className={P} param={US_GOV_WASTE_PER_CAPITA_ANNUAL} />{" "}
        per American per year
      </>
    ),
    eos: (
      <>
        <ParameterValue
          className={P}
          param={GOV_REPLACEMENT_SUITE_OPEX_PER_CITIZEN_ANNUAL}
        />{" "}
        per citizen per year, plus dividends
      </>
    ),
  },
];

/**
 * Section 3 — The Competing Bid, drawn as the wall chart that used to hang
 * beside the periodic table: two inked columns, hand-ruled rows, one drawn
 * glyph per bidder. Stacks into labelled cards under 860px.
 */
export function MatrixFrame() {
  return (
    <section className="dc-frame" id="the-competing-bid">
      <div className="dc-wrap">
        <p className="dc-slate dc-frame-slate">
          Section 3 · The Comparison Matrix
        </p>
        <h2 className="dc-h dc-frame-title">The Competing Bid</h2>
        <p className="dc-frame-deck">
          We tried to be diplomatic about this. Then we read the performance
          review.
        </p>

        <div
          aria-label="Your Government versus Earth Optimization Services"
          className="dc-chart"
          role="table"
        >
          <div className="dc-chart-head" role="row">
            <div className="dc-chart-corner" role="columnheader" />
            <div className="dc-chart-col dc-chart-col-gov" role="columnheader">
              <DomeGlyph />
              Your Government
            </div>
            <div className="dc-chart-col dc-chart-col-eos" role="columnheader">
              <BurstGlyph />
              Earth Optimization Services
            </div>
          </div>

          {ROWS.map((row) => (
            <div className="dc-chart-row" key={row.label} role="row">
              <div className="dc-chart-label" role="rowheader">
                {row.label}
              </div>
              <div className="dc-chart-cell dc-chart-gov" role="cell">
                <span className="dc-chart-mob">Your Government</span>
                {row.gov}
              </div>
              <div className="dc-chart-cell dc-chart-eos" role="cell">
                <span className="dc-chart-mob">
                  Earth Optimization Services
                </span>
                {row.eos}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** The incumbent: a dome, drawn once. */
function DomeGlyph() {
  return (
    <svg
      aria-hidden="true"
      className="dc-chart-glyph"
      role="presentation"
      viewBox="0 0 32 32"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 27 H27" />
        <path d="M8 27 V16" />
        <path d="M16 27 V16" />
        <path d="M24 27 V16" />
        <path d="M6 16 A10 10 0 0 1 26 16" />
        <path d="M16 6 V3" />
      </g>
    </svg>
  );
}

/** The challenger: the same starburst that opens the reel. */
function BurstGlyph() {
  return (
    <svg
      aria-hidden="true"
      className="dc-chart-glyph"
      role="presentation"
      viewBox="0 0 32 32"
    >
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI * 2) / 8;
          return (
            <line
              key={i}
              x1={16 + Math.cos(a) * 6}
              y1={16 + Math.sin(a) * 6}
              x2={16 + Math.cos(a) * 14}
              y2={16 + Math.sin(a) * 14}
            />
          );
        })}
      </g>
      <circle cx="16" cy="16" fill="currentColor" r="4" />
    </svg>
  );
}
