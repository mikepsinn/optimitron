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
import { Reveal } from "@/components/eos-preview/Reveal";

/** One matrix row: the row label, and the two competing bids. */
interface Row {
  label: string;
  gov: ReactNode;
  eos: ReactNode;
}

const PARAM = "eos-num";

const ROWS: Row[] = [
  {
    label: "People murdered",
    gov: (
      <>
        <ParameterValue
          className={PARAM}
          display="withUnit"
          param={WAR_DEATHS_SINCE_1900}
        />{" "}
        since 1900
      </>
    ),
    eos: <span className="eos-col-eos-zero">0</span>,
  },
  {
    label: "Money lost",
    gov: (
      <>
        <ParameterValue className={PARAM} param={PENTAGON_UNACCOUNTED_FUNDS} />{" "}
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
        <ParameterValue className={PARAM} param={US_GOV_WASTE_TAX_COMPLIANCE} />
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
          className={PARAM}
          figures={2}
          param={CROWD_DECISION_ACCURACY}
        />{" "}
        crowd accuracy vs{" "}
        <ParameterValue
          className={PARAM}
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
          className={PARAM}
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
          className={PARAM}
          display="withUnit"
          param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
        />{" "}
        at current rate
      </>
    ),
    eos: (
      <>
        <ParameterValue
          className={PARAM}
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
          className={PARAM}
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
        <ParameterValue
          className={PARAM}
          param={US_GOV_WASTE_PER_CAPITA_ANNUAL}
        />{" "}
        per American per year
      </>
    ),
    eos: (
      <>
        <ParameterValue
          className={PARAM}
          param={GOV_REPLACEMENT_SUITE_OPEX_PER_CITIZEN_ANNUAL}
        />{" "}
        per citizen per year, plus dividends
      </>
    ),
  },
];

export function ComparisonMatrix() {
  return (
    <section className="eos-section eos-r2" id="comparison">
      <div className="eos-container">
        <Reveal className="eos-catalog-head">
          <p className="eos-eyebrow">Section 3</p>
          <h2 className="eos-catalog-title">The Competing Bid</h2>
          <p className="eos-catalog-deck">
            We tried to be diplomatic about this. Then we read the performance
            review.
          </p>
        </Reveal>

        <Reveal>
          <div className="eos-matrix" role="table" aria-label="Your Government versus Earth Optimization Services">
            <div className="eos-matrix-row eos-matrix-head" role="row">
              <div className="eos-cell eos-cell-label" role="columnheader" />
              <div className="eos-cell eos-col-gov" role="columnheader">
                Your Government
              </div>
              <div className="eos-cell eos-col-eos" role="columnheader">
                Earth Optimization Services
              </div>
            </div>

            {ROWS.map((row) => (
              <div className="eos-matrix-row" key={row.label} role="row">
                <div className="eos-cell eos-cell-label" role="rowheader">
                  {row.label}
                </div>
                <div className="eos-cell eos-col-gov" role="cell">
                  <span className="eos-cell-mobilehead">Your Government</span>
                  {row.gov}
                </div>
                <div className="eos-cell eos-col-eos" role="cell">
                  <span className="eos-cell-mobilehead">
                    Earth Optimization Services
                  </span>
                  {row.eos}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
