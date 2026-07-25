import {
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  GLOBAL_AVG_INCOME_2025,
  NIH_CLINICAL_TRIALS_SPENDING_PCT,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  POLITICAL_DYSFUNCTION_TAX_PER_HOUSEHOLD_OF_FOUR_ANNUAL,
  POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  WAR_COUNTERFACTUAL_GDP_PER_CAPITA,
  WAR_COUNTERFACTUAL_INCOME_MULTIPLE,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";

const N = "pk-n";
const AUDIT_URL = "/dysfunction-tax";

/**
 * The end of Section 1 (The Bill) and the pivot into the press kit.
 *
 * Section 1 keeps the spec's dark, dense, humourless register: the charge
 * sheet runs to the end, the Political Dysfunction Tax lands as the screen's
 * one enormous number, and the love line closes it. Then the chrome
 * changeover strip and the release masthead: courtroom, door, 1962.
 */
export function BillTailAndPivot() {
  return (
    <>
      <section className="pkb-bill" id="the-bill">
        <div className="pkb-wrap">
          <div className="pkb-billhead">
            <p className="pkb-tag">Section 1 · The Bill</p>
            <p className="pkb-tag">Continued · Counts 8 through 10</p>
          </div>

          <div className="pkb-charge">
            <p>
              They maintain 74,000 pages of tax code. They run 80+ overlapping
              welfare programs. The NIH directs only{" "}
              <ParameterValue
                className={N}
                figures={2}
                param={NIH_CLINICAL_TRIALS_SPENDING_PCT}
              />{" "}
              of its budget to clinical trials; the rest studies disease without
              testing cures.{" "}
              <ParameterValue
                className={N}
                param={DISEASES_WITHOUT_EFFECTIVE_TREATMENT}
              />{" "}
              diseases have zero approved treatments. At the current discovery
              rate, clearing the queue takes{" "}
              <ParameterValue
                className={N}
                display="integer"
                param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
              />{" "}
              years.
            </p>
            <p>
              Singapore spends roughly a quarter of what the US spends per
              capita on healthcare. Singaporeans live about seven years longer.
              193 countries, hundreds of years of policy data. The experiments
              already ran. Nobody checked the results.
            </p>
            <p>
              Had these governments been properly aligned to maximize health and
              wealth since 1900, the average human would earn{" "}
              <ParameterValue
                className={N}
                param={WAR_COUNTERFACTUAL_GDP_PER_CAPITA}
              />{" "}
              a year instead of{" "}
              <ParameterValue className={N} param={GLOBAL_AVG_INCOME_2025} />.
              That is{" "}
              <ParameterValue
                className={N}
                param={WAR_COUNTERFACTUAL_INCOME_MULTIPLE}
              />{" "}
              times richer.
            </p>
          </div>

          <div className="pkb-billnum">
            <p className="pkb-tag pkb-tag--hot">
              Exhibit A · Annual cost of not checking
            </p>
            <span className="pkb-huge">
              <ParameterValue
                param={POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL}
                presentation="inline"
              />
              <span className="pkb-huge-unit">per year</span>
            </span>
            <p className="pkb-legend">
              <strong>The Political Dysfunction Tax.</strong> The annual cost of
              not checking.{" "}
              <ParameterValue
                className={N}
                param={POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL}
              />{" "}
              per person per year.{" "}
              <ParameterValue
                className={N}
                param={POLITICAL_DYSFUNCTION_TAX_PER_HOUSEHOLD_OF_FOUR_ANNUAL}
              />{" "}
              per household of four.
            </p>
            <a className="pkb-billlink" href={AUDIT_URL}>
              Read the full forensic audit →
            </a>
          </div>

          <div className="pkb-love">
            <p>
              I love you very much and I do not want you and everyone you have
              ever loved to be slowly tortured and brutally murdered by horrible
              diseases.
            </p>
            <p>That is why this store exists.</p>
          </div>
        </div>
      </section>

      {/* The changeover: dark, chrome, daylight. */}
      <div className="pkb-changeover" aria-hidden="true" />
      <div className="pkb-ruler" aria-hidden="true" />

      <section className="pkb-pivot pkb-grid" id="the-pivot">
        <div className="pkb-wrap">
          <div className="pkb-release">
            <p className="pkb-tag pkb-tag--blue">
              Universe Optimization Services · Earth Regional Branch
            </p>
            <p className="pkb-tag">Release No. EOS-B-001 · Sheet 1 of 4</p>
          </div>

          <div className="pkb-pivotgrid">
            <div className="pkb-masthead">
              <div className="pkb-roundel">
                <span>
                  U O S
                  <br />
                  EARTH
                  <br />
                  BRANCH
                </span>
              </div>
              <p className="pkb-marque">Press Kit</p>
              <div className="pkb-callouts">
                <div className="pkb-callout">
                  <span className="pkb-callout-k">Document class</span>
                  <span className="pkb-callout-v">For immediate release</span>
                </div>
                <div className="pkb-callout">
                  <span className="pkb-callout-k">Prepared for</span>
                  <span className="pkb-callout-v">The President of EOS</span>
                </div>
                <div className="pkb-callout">
                  <span className="pkb-callout-k">Prior clients</span>
                  <span className="pkb-callout-v">300 planets</span>
                </div>
              </div>
            </div>

            <div>
              <p className="pkb-tag pkb-tag--blue">Eligibility screening</p>
              <p className="pkb-pivot-q">
                Has your species developed nuclear weapons, antibiotics, and the
                internet, and then pointed two of those three at each other?
              </p>
              <p className="pkb-pivot-a">
                You may be <em>eligible</em> for optimization.
              </p>
              <div className="pkb-dim">
                <span className="pkb-tag">Section 1 ends</span>
                <span className="pkb-dim-rule" />
                <span className="pkb-tag pkb-tag--blue">Catalog begins</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
