import {
  GLOBAL_AVG_INCOME_2025,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  POLITICAL_DYSFUNCTION_TAX_PER_HOUSEHOLD_OF_FOUR_ANNUAL,
  POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL,
  SINGAPORE_LIFE_EXPECTANCY,
  US_LIFE_EXPECTANCY_2023,
  WAR_COUNTERFACTUAL_GDP_PER_CAPITA,
  WAR_COUNTERFACTUAL_INCOME_MULTIPLE,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { DeathTicker } from "@/components/eos-design-c/DeathTicker";

const N = "dc-num";

/** The Singapore gap, derived rather than typed. */
const SINGAPORE_GAP_YEARS = Math.round(
  SINGAPORE_LIFE_EXPECTANCY.value - US_LIFE_EXPECTANCY_2023.value,
);

/**
 * The closing counts of Section 1: the last two charges, the Political
 * Dysfunction Tax at full size, and the love line. Dark, dense, clinical,
 * no ornament — the register the pivot is about to break.
 */
export function BillFinale() {
  return (
    <section className="dc-bill" id="the-bill">
      <div className="dc-wrap">
        <div className="dc-bill-top">
          <p className="dc-slate dc-bill-slate">Section 1 · The Bill</p>
          <DeathTicker />
        </div>

        <div className="dc-charge">
          <p>
            Singapore spends roughly a quarter of what the US spends per capita
            on healthcare. Singaporeans live about{" "}
            <ParameterValue
              className={N}
              param={SINGAPORE_LIFE_EXPECTANCY}
              valueOverride={`${SINGAPORE_GAP_YEARS} years`}
            />{" "}
            longer. 193 countries, hundreds of years of policy data. The
            experiments already ran. Nobody checked the results.
          </p>
          <p>
            Had these governments been properly aligned to maximize health and
            wealth since 1900, the average human would earn{" "}
            <ParameterValue
              className={N}
              param={WAR_COUNTERFACTUAL_GDP_PER_CAPITA}
            />{" "}
            a year instead of{" "}
            <ParameterValue className={N} param={GLOBAL_AVG_INCOME_2025} />. That
            is{" "}
            <ParameterValue
              className={N}
              param={WAR_COUNTERFACTUAL_INCOME_MULTIPLE}
            />{" "}
            times richer.
          </p>
        </div>

        <div className="dc-giant">
          <div className="dc-giant-value">
            <ParameterValue
              param={POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL}
              presentation="inline"
            />
            <span className="dc-per">/year</span>
          </div>
          <p className="dc-giant-cap">
            <b>The Political Dysfunction Tax.</b> The annual cost of not
            checking.{" "}
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
          <a className="dc-audit" href="/dysfunction-tax">
            Read the full forensic audit →
          </a>
        </div>

        <div className="dc-love">
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
