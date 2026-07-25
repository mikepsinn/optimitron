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

const N = "pk-n";

/**
 * Section 3 — The Comparison Matrix.
 *
 * The screen leads with the head-to-head sticker price (the one number a
 * procurement officer reads first), then the full fourteen-row vendor
 * comparison as a technical data sheet.
 */
export function ComparisonSheet() {
  return (
    <section className="pkb-sec pkb-grid" id="the-competing-bid">
      <div className="pkb-wrap">
        <div className="pkb-sheet">
          <div className="pkb-sheethead">
            <h2>Fig. 4 — The Competing Bid</h2>
            <p className="pkb-tag">Release No. EOS-B-001 · Sheet 4 of 4</p>
          </div>

          <p className="pkb-lede" style={{ maxWidth: "44ch" }}>
            We tried to be diplomatic about this. Then we read the performance
            review.
          </p>

          <div className="pkb-verdict">
            <p className="pkb-tag pkb-tag--hot">
              Sticker price · your government
            </p>
            <span className="pkb-huge pkb-huge--hot">
              <ParameterValue
                param={US_GOV_WASTE_PER_CAPITA_ANNUAL}
                presentation="inline"
              />
              <span className="pkb-huge-unit">per American / year</span>
            </span>
            <div className="pkb-dim">
              <span className="pkb-tag pkb-tag--hot">Their bid</span>
              <span className="pkb-dim-rule" />
              <span className="pkb-tag pkb-tag--blue">Ours</span>
            </div>
            <p className="pkb-counterbid">
              <span className="pkb-counterbid-v">
                <ParameterValue
                  className={N}
                  param={GOV_REPLACEMENT_SUITE_OPEX_PER_CITIZEN_ANNUAL}
                />
              </span>{" "}
              per citizen per year, plus dividends.
            </p>
          </div>

          <div className="pkb-matrixscroll">
            <table className="pkb-matrix">
              <caption className="sr-only">
                Vendor comparison: your government versus Earth Optimization
                Services
              </caption>
              <thead>
                <tr>
                  <th scope="col">Line item</th>
                  <th scope="col">Your Government</th>
                  <th scope="col" className="pkb-col-eos">
                    Earth Optimization Services
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">People murdered</th>
                  <td className="pkb-col-gov">
                    <ParameterValue
                      className={N}
                      display="withUnit"
                      param={WAR_DEATHS_SINCE_1900}
                    />{" "}
                    since 1900
                  </td>
                  <td className="pkb-col-eos">0</td>
                </tr>
                <tr>
                  <th scope="row">Money lost</th>
                  <td className="pkb-col-gov">
                    <ParameterValue
                      className={N}
                      param={PENTAGON_UNACCOUNTED_FUNDS}
                    />{" "}
                    misplaced (7 failed audits)
                  </td>
                  <td className="pkb-col-eos">
                    Public ledger. Every dollar tracked live.
                  </td>
                </tr>
                <tr>
                  <th scope="row">Tax code</th>
                  <td className="pkb-col-gov">
                    74,000 pages,{" "}
                    <ParameterValue
                      className={N}
                      param={US_GOV_WASTE_TAX_COMPLIANCE}
                    />
                    /year compliance
                  </td>
                  <td className="pkb-col-eos">
                    6 lines of code. Filing cost: $0.
                  </td>
                </tr>
                <tr>
                  <th scope="row">Welfare programs</th>
                  <td className="pkb-col-gov">
                    80+, each with its own forms, case workers, 45-day wait
                  </td>
                  <td className="pkb-col-eos">
                    1 for-loop. Equal split. Tomorrow morning.
                  </td>
                </tr>
                <tr>
                  <th scope="row">Decision method</th>
                  <td className="pkb-col-gov">
                    535 humans who haven&apos;t read the bill, funded by the
                    industries the bill regulates
                  </td>
                  <td className="pkb-col-eos">
                    <ParameterValue
                      className={N}
                      param={CROWD_DECISION_ACCURACY}
                    />{" "}
                    crowd accuracy vs{" "}
                    <ParameterValue
                      className={N}
                      param={EXPERT_DECISION_ACCURACY}
                    />{" "}
                    expert. Every question ships with evidence.
                  </td>
                </tr>
                <tr>
                  <th scope="row">Your input</th>
                  <td className="pkb-col-gov">
                    1 bundled vote every 2 years. Correlation with outcomes: 0%.
                  </td>
                  <td className="pkb-col-eos">
                    20 specific questions/year. Pairwise comparisons. Evidence
                    attached.
                  </td>
                </tr>
                <tr>
                  <th scope="row">Corruption surface</th>
                  <td className="pkb-col-gov">
                    <ParameterValue
                      className={N}
                      param={US_TOTAL_LOBBYING_ANNUAL}
                    />
                    /year in lobbying buys your laws
                  </td>
                  <td className="pkb-col-eos">
                    No door. You cannot take 8 billion people to lunch.
                  </td>
                </tr>
                <tr>
                  <th scope="row">Policy evidence used</th>
                  <td className="pkb-col-gov">
                    None. Drug war ran 50 years, overdoses up 1,700%, nobody
                    checked.
                  </td>
                  <td className="pkb-col-eos">
                    10,000 jurisdictions measured. Synthetic controls,
                    diff-in-diff, regression discontinuity.
                  </td>
                </tr>
                <tr>
                  <th scope="row">Disease queue</th>
                  <td className="pkb-col-gov">
                    <ParameterValue
                      className={N}
                      display="withUnit"
                      figures={3}
                      param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
                    />{" "}
                    at current rate
                  </td>
                  <td className="pkb-col-eos">
                    <ParameterValue
                      className={N}
                      display="withUnit"
                      figures={3}
                      param={DFDA_QUEUE_CLEARANCE_YEARS}
                    />{" "}
                    with 1% moved to clinical trials
                  </td>
                </tr>
                <tr>
                  <th scope="row">Time to notice you died</th>
                  <td className="pkb-col-gov">
                    Years (one week if you owed taxes)
                  </td>
                  <td className="pkb-col-eos">One day. The deposit stops.</td>
                </tr>
                <tr>
                  <th scope="row">Shuts down over disagreements</th>
                  <td className="pkb-col-gov">20+ times since 1976</td>
                  <td className="pkb-col-eos">There is no door</td>
                </tr>
                <tr>
                  <th scope="row">Audit record</th>
                  <td className="pkb-col-gov">0 of 7 passed (Pentagon)</td>
                  <td className="pkb-col-eos">
                    Real-time public ledger, continuous
                  </td>
                </tr>
                <tr>
                  <th scope="row">Budget allocation</th>
                  <td className="pkb-col-gov">
                    <ParameterValue
                      className={N}
                      display="withUnit"
                      param={
                        MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO
                      }
                    />{" "}
                    kill:cure ratio
                  </td>
                  <td className="pkb-col-eos">
                    Optimal budget calculated to maximize the two numbers
                  </td>
                </tr>
                <tr>
                  <th scope="row">Sticker price</th>
                  <td className="pkb-col-gov">
                    <ParameterValue
                      className={N}
                      param={US_GOV_WASTE_PER_CAPITA_ANNUAL}
                    />{" "}
                    per American per year
                  </td>
                  <td className="pkb-col-eos">
                    <ParameterValue
                      className={N}
                      param={GOV_REPLACEMENT_SUITE_OPEX_PER_CITIZEN_ANNUAL}
                    />{" "}
                    per citizen per year, plus dividends
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pkb-colophon">
            <p className="pkb-tag">
              Universe Optimization Services · Earth Regional Branch
            </p>
            <p className="pkb-tag pkb-tag--blue">
              Every figure sourced. Select any number for its derivation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
