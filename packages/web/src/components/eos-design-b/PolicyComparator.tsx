"use client";

import { useState, type ReactNode } from "react";
import {
  CURRENT_DRUG_APPROVALS_PER_YEAR,
  DRUG_DISCOVERY_TO_APPROVAL_YEARS,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  PHARMA_DRUG_DEVELOPMENT_COST_CURRENT,
  TREATY_ANNUAL_FUNDING,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";

const N = "pk-n";

interface Row {
  name: string;
  before: ReactNode;
  after: ReactNode;
}

const ROWS: Row[] = [
  {
    name: "Tax code",
    before: "74,000 pages. Filing cost per citizen: $1,200.",
    after: "6 lines. Filing cost per citizen: $0.",
  },
  {
    name: "Drug approval",
    before: (
      <>
        <ParameterValue className={N} param={DRUG_DISCOVERY_TO_APPROVAL_YEARS} />{" "}
        years,{" "}
        <ParameterValue
          className={N}
          display="withUnit"
          param={PHARMA_DRUG_DEVELOPMENT_COST_CURRENT}
        />{" "}
        per drug.{" "}
        <ParameterValue className={N} param={CURRENT_DRUG_APPROVALS_PER_YEAR} />{" "}
        approvals/year.
      </>
    ),
    after: "Pragmatic trials, 90% cost reduction. 200+ approvals/year.",
  },
  {
    name: "Welfare",
    before: "80+ programs, 95,000 administrators.",
    after: "Single universal deposit, automatic.",
  },
  {
    name: "Clinical trials",
    before: (
      <>
        <ParameterValue
          className={N}
          display="integer"
          param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
        />{" "}
        kill:cure ratio
      </>
    ),
    after: (
      <>
        1% Treaty funds{" "}
        <ParameterValue className={N} param={TREATY_ANNUAL_FUNDING} />
        /year in trials
      </>
    ),
  },
];

/**
 * The Optimal Policy Generator's comparator: four policies, each with the
 * measured before and the recommended after. Click a row to open it.
 */
export function PolicyComparator() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="pkb-policygrid">
      {ROWS.map((row, index) => {
        const isOpen = open === index;
        const panelId = `pkb-policy-${index}`;
        return (
          <div className="pkb-policy" key={row.name}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? null : index)}
            >
              <span className="pkb-policy-no">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="pkb-policy-name">{row.name}</span>
              <span className="pkb-policy-sign" aria-hidden="true">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && (
              <div className="pkb-policy-body" id={panelId}>
                <div className="pkb-ba">
                  <span className="pkb-ba-k">Currently paying</span>
                  <span className="pkb-ba-v">{row.before}</span>
                </div>
                <span className="pkb-arrow" aria-hidden="true">
                  →
                </span>
                <div className="pkb-ba pkb-ba--after">
                  <span className="pkb-ba-k">Recommendation</span>
                  <span className="pkb-ba-v">{row.after}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
