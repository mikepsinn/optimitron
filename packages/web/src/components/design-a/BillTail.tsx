import {
  GLOBAL_AVG_INCOME_2025,
  NIH_CLINICAL_TRIALS_SPENDING_PCT,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  POLITICAL_DYSFUNCTION_TAX_PER_HOUSEHOLD_OF_FOUR_ANNUAL,
  POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL,
  SINGAPORE_LIFE_EXPECTANCY,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  US_LIFE_EXPECTANCY_2023,
  WAR_COUNTERFACTUAL_GDP_PER_CAPITA,
  WAR_COUNTERFACTUAL_INCOME_MULTIPLE,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { DeathTicker } from "@/components/design-a/DeathTicker";

const HOT = "dsa-hot";

const SINGAPORE_US_LIFE_EXPECTANCY_GAP_YEARS = Math.round(
  SINGAPORE_LIFE_EXPECTANCY.value - US_LIFE_EXPECTANCY_2023.value,
);

/**
 * The closing run of Section 1. Stays dark, dense, humourless: the last counts
 * of the charge sheet, the Political Dysfunction Tax at full size, and the love
 * line. The brightness starts in the next component, not this one.
 */
export function BillTail() {
  return (
    <section className="dsa-bill" id="the-bill">
      <div className="dsa-wrap">
        <div className="dsa-bill-head">
          <p className="dsa-eyebrow">Section 1 / The Bill</p>
          <DeathTicker />
        </div>

        <div className="dsa-charge">
          <p>
            They maintain 74,000 pages of tax code. They run 80+ overlapping
            welfare programs. The NIH directs only{" "}
            <ParameterValue
              className={`${HOT} dsa-hot-coral`}
              figures={2}
              param={NIH_CLINICAL_TRIALS_SPENDING_PCT}
            />{" "}
            of its budget to clinical trials; the rest studies disease without
            testing cures.{" "}
            <ParameterValue
              className={`${HOT} dsa-hot-coral`}
              param={DISEASES_WITHOUT_EFFECTIVE_TREATMENT}
            />{" "}
            diseases have zero approved treatments. At the current discovery
            rate, clearing the queue takes{" "}
            <ParameterValue
              className={`${HOT} dsa-hot-coral`}
              display="integer"
              param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
            />{" "}
            years.
          </p>
          <p>
            Singapore spends roughly a quarter of what the US spends per capita
            on healthcare. Singaporeans live about{" "}
            <ParameterValue
              className={`${HOT} dsa-hot-coral`}
              param={SINGAPORE_LIFE_EXPECTANCY}
              valueOverride={`${SINGAPORE_US_LIFE_EXPECTANCY_GAP_YEARS} years`}
            />{" "}
            longer. 193 countries, hundreds of years of policy data. The
            experiments already ran. Nobody checked the results.
          </p>
          <p>
            Had these governments been properly aligned to maximize health and
            wealth since 1900, the average human would earn{" "}
            <ParameterValue
              className={`${HOT} dsa-hot-coral`}
              param={WAR_COUNTERFACTUAL_GDP_PER_CAPITA}
            />{" "}
            a year instead of{" "}
            <ParameterValue
              className={`${HOT} dsa-hot-coral`}
              param={GLOBAL_AVG_INCOME_2025}
            />
            . That is{" "}
            <ParameterValue
              className={`${HOT} dsa-hot-coral`}
              param={WAR_COUNTERFACTUAL_INCOME_MULTIPLE}
            />{" "}
            times richer.
          </p>
        </div>

        <div className="dsa-giant">
          <p className="dsa-giant-value">
            <ParameterValue
              param={POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL}
              presentation="inline"
            />
            <span className="dsa-per">/year</span>
          </p>
          <p className="dsa-giant-caption">
            <b>The Political Dysfunction Tax.</b> The annual cost of not
            checking.{" "}
            <ParameterValue
              className={HOT}
              param={POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL}
            />{" "}
            per person per year.{" "}
            <ParameterValue
              className={HOT}
              param={POLITICAL_DYSFUNCTION_TAX_PER_HOUSEHOLD_OF_FOUR_ANNUAL}
            />{" "}
            per household of four.
          </p>
          <a className="dsa-billlink" href="/dysfunction-tax">
            Read the full forensic audit &rarr;
          </a>
        </div>

        <div className="dsa-love">
          <p>
            I love you very much and I do not want you and everyone you have
            ever loved to be slowly tortured and brutally murdered by horrible
            diseases.
          </p>
          <p>That is why this store exists.</p>
        </div>
      </div>
    </section>
  );
}
