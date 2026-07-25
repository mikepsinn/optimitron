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

const HOT = "dsa-hot";

type Row = { label: string; them: ReactNode; us: ReactNode };

const ROWS: Row[] = [
  {
    label: "People murdered",
    them: (
      <>
        <ParameterValue
          className={`${HOT} dsa-hot-coral`}
          param={WAR_DEATHS_SINCE_1900}
        />{" "}
        since 1900
      </>
    ),
    us: "0",
  },
  {
    label: "Money lost",
    them: (
      <>
        <ParameterValue
          className={`${HOT} dsa-hot-coral`}
          param={PENTAGON_UNACCOUNTED_FUNDS}
        />{" "}
        misplaced (7 failed audits)
      </>
    ),
    us: "Public ledger. Every dollar tracked live.",
  },
  {
    label: "Tax code",
    them: (
      <>
        74,000 pages,{" "}
        <ParameterValue
          className={`${HOT} dsa-hot-coral`}
          param={US_GOV_WASTE_TAX_COMPLIANCE}
        />
        /year compliance
      </>
    ),
    us: "6 lines of code. Filing cost: $0.",
  },
  {
    label: "Welfare programs",
    them: "80+, each with its own forms, case workers, 45-day wait",
    us: "1 for-loop. Equal split. Tomorrow morning.",
  },
  {
    label: "Decision method",
    them: "535 humans who haven't read the bill, funded by the industries the bill regulates",
    us: (
      <>
        <ParameterValue className={HOT} param={CROWD_DECISION_ACCURACY} /> crowd
        accuracy vs{" "}
        <ParameterValue className={HOT} param={EXPERT_DECISION_ACCURACY} />{" "}
        expert. Every question ships with evidence.
      </>
    ),
  },
  {
    label: "Your input",
    them: "1 bundled vote every 2 years. Correlation with outcomes: 0%.",
    us: "20 specific questions/year. Pairwise comparisons. Evidence attached.",
  },
  {
    label: "Corruption surface",
    them: (
      <>
        <ParameterValue
          className={`${HOT} dsa-hot-coral`}
          param={US_TOTAL_LOBBYING_ANNUAL}
        />
        /year in lobbying buys your laws
      </>
    ),
    us: "No door. You cannot take 8 billion people to lunch.",
  },
  {
    label: "Policy evidence used",
    them: "None. Drug war ran 50 years, overdoses up 1,700%, nobody checked.",
    us: "10,000 jurisdictions measured. Synthetic controls, diff-in-diff, regression discontinuity.",
  },
  {
    label: "Disease queue",
    them: (
      <>
        <ParameterValue
          className={`${HOT} dsa-hot-coral`}
          display="integer"
          param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
        />{" "}
        at current rate
      </>
    ),
    us: (
      <>
        <ParameterValue
          className={HOT}
          display="integer"
          param={DFDA_QUEUE_CLEARANCE_YEARS}
        />{" "}
        with 1% moved to clinical trials
      </>
    ),
  },
  {
    label: "Time to notice you died",
    them: "Years (one week if you owed taxes)",
    us: "One day. The deposit stops.",
  },
  {
    label: "Shuts down over disagreements",
    them: "20+ times since 1976",
    us: "There is no door",
  },
  {
    label: "Audit record",
    them: "0 of 7 passed (Pentagon)",
    us: "Real-time public ledger, continuous",
  },
  {
    label: "Budget allocation",
    them: (
      <>
        <ParameterValue
          className={`${HOT} dsa-hot-coral`}
          param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
        />{" "}
        kill:cure ratio
      </>
    ),
    us: "Optimal budget calculated to maximize the two numbers",
  },
  {
    label: "Sticker price",
    them: (
      <>
        <ParameterValue
          className={`${HOT} dsa-hot-coral`}
          param={US_GOV_WASTE_PER_CAPITA_ANNUAL}
        />{" "}
        per American per year
      </>
    ),
    us: (
      <>
        <ParameterValue
          className={HOT}
          param={GOV_REPLACEMENT_SUITE_OPEX_PER_CITIZEN_ANNUAL}
        />{" "}
        per citizen per year, plus dividends
      </>
    ),
  },
];

/**
 * Section 3, in catalog language: the vendor comparison chart every mail-order
 * brochure runs on the page before the order form. Two columns, fourteen rows,
 * no commentary. On narrow screens each row becomes its own labelled card.
 */
export function ComparisonMatrix() {
  return (
    <section className="dsa-page dsa-page--deep" id="the-competing-bid">
      <div className="dsa-wrap">
        <div className="dsa-page-head">
          <p className="dsa-eyebrow">Section 3 / The Competing Bid</p>
          <p className="dsa-folio">Vendor comparison</p>
        </div>

        <header className="dsa-matrix-head">
          <h2 className="dsa-display dsa-matrix-title">The Competing Bid</h2>
          <p className="dsa-matrix-dek">
            We tried to be diplomatic about this. Then we read the performance
            review.
          </p>
        </header>

        <div className="dsa-matrix">
          <div className="dsa-matrix-cols" aria-hidden="true">
            <p className="dsa-matrix-col">Specification</p>
            <p className="dsa-matrix-col dsa-matrix-col--them">
              Your Government
            </p>
            <p className="dsa-matrix-col dsa-matrix-col--us">
              Earth Optimization Services
            </p>
          </div>
          <div className="dsa-matrix-body">
            {ROWS.map((row) => (
              <div className="dsa-matrix-row" key={row.label}>
                <p className="dsa-matrix-cell dsa-matrix-cell--label">
                  {row.label}
                </p>
                <p className="dsa-matrix-cell dsa-matrix-cell--them">
                  {row.them}
                </p>
                <p className="dsa-matrix-cell dsa-matrix-cell--us">{row.us}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="dsa-foot">
          <p className="dsa-eyebrow">
            Universe Optimization Services &middot; Earth Branch
          </p>
          <p className="dsa-eyebrow">Earth Edition</p>
        </div>
      </div>
    </section>
  );
}
