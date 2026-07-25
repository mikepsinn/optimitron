import {
  ANNUAL_TERRORISM_DEATH_RISK_DENOMINATOR,
  CUMULATIVE_MILITARY_SPENDING_FED_ERA,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  GLOBAL_AVG_INCOME_2025,
  GLOBAL_GOVERNMENT_EXPENSE_ANNUAL,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  NIH_CLINICAL_TRIALS_SPENDING_PCT,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  PENTAGON_UNACCOUNTED_CLINICAL_TRIAL_YEARS,
  PENTAGON_UNACCOUNTED_FUNDS,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  POLITICAL_DYSFUNCTION_TAX_PER_HOUSEHOLD_OF_FOUR_ANNUAL,
  POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL,
  SINGAPORE_LIFE_EXPECTANCY,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  US_LIFE_EXPECTANCY_2023,
  WAR_CHILDREN_KILLED_SINCE_1900,
  WAR_COUNTERFACTUAL_GDP_PER_CAPITA,
  WAR_COUNTERFACTUAL_INCOME_MULTIPLE,
  WAR_DEATHS_SINCE_1900,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { BillDeathCounter } from "@/components/eos-preview/BillDeathCounter";

const N = "eos-num";

// Links to the full forensic audit of the Political Dysfunction Tax.
const AUDIT_URL = "/dysfunction-tax";

const SINGAPORE_US_LIFE_EXPECTANCY_GAP_YEARS = Math.round(
  SINGAPORE_LIFE_EXPECTANCY.value - US_LIFE_EXPECTANCY_2023.value,
); // 7

export function BillSection() {
  return (
    <>
      <section className="eos-section eos-r1" id="the-bill">
        <div className="eos-container">
          <div className="eos-bill-counter">
            <BillDeathCounter />
          </div>

          <header className="eos-bill-head">
            <p className="eos-bill-title">Section 1 · The Bill</p>
          </header>

          {/* ── The Job Description ─────────────────────────── */}
          <div className="eos-charge">
            <h2 className="eos-charge-h">The Job Description</h2>
            <p>
              Humanity pays its governments{" "}
              <ParameterValue
                className={N}
                param={GLOBAL_GOVERNMENT_EXPENSE_ANNUAL}
              />{" "}
              per year. The job: maximize two numbers. Median healthy life years
              (the age at which the median person is still healthy) and median
              after-tax inflation-adjusted income (not GDP per capita, which
              looks great when three billionaires move into your city while
              everyone else&apos;s rent doubles). Everything important a
              government does eventually makes people healthier or wealthier. If
              it doesn&apos;t do either, it wasn&apos;t important.
            </p>
            <p>
              They do not measure either number. They do not check whether the
              policies they spend trillions on are working. When you check, this
              is what you find.
            </p>
          </div>

          {/* ── The Performance Review ──────────────────────── */}
          <div className="eos-charge">
            <h2 className="eos-charge-h">The Performance Review</h2>
            <p>
              Since 1913, these governments printed{" "}
              <ParameterValue
                className={N}
                param={CUMULATIVE_MILITARY_SPENDING_FED_ERA}
              />{" "}
              and used it to murder{" "}
              <ParameterValue className={N} param={WAR_DEATHS_SINCE_1900} />{" "}
              humans. Among the dead: approximately 930,000 physicians, 310,000
              scientists, 620,000 engineers, 1.24 million nurses, 3.1 million
              teachers, and{" "}
              <ParameterValue
                className={N}
                param={WAR_CHILDREN_KILLED_SINCE_1900}
              />{" "}
              children who will never grow up to replace them.
            </p>
            <p>
              They spend{" "}
              <ParameterValue
                className={N}
                display="integer"
                param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
              />{" "}
              dollars on the capacity to kill people for every one dollar spent
              on clinical trials that might cure what is actually going to kill
              you. Your chance of being killed by a terrorist: 1 in{" "}
              <ParameterValue
                className={N}
                figures={2}
                param={ANNUAL_TERRORISM_DEATH_RISK_DENOMINATOR}
              />
              . Your chance of dying of a disease: approximately 100%. The budget
              does not reflect this.
            </p>
            <p>
              They possess nuclear weapons sufficient to end civilization{" "}
              <ParameterValue
                className={N}
                display="integer"
                param={NUCLEAR_WINTER_OVERKILL_FACTOR}
              />{" "}
              times. They have not cured Alzheimer&apos;s once.
            </p>
            <p>
              The Pentagon &ldquo;misplaced&rdquo;{" "}
              <ParameterValue className={N} param={PENTAGON_UNACCOUNTED_FUNDS} />,
              failed seven consecutive audits trying to find it, then requested
              additional trillions without explanation or apology. That money
              could have funded{" "}
              <ParameterValue
                className={N}
                display="integer"
                param={PENTAGON_UNACCOUNTED_CLINICAL_TRIAL_YEARS}
              />{" "}
              years of clinical trials.
            </p>
            <p>
              They spent over one trillion dollars across fifty years
              imprisoning their own citizens for the crime of choosing what to
              put in their own bodies. The result: a 1,700% increase in overdose
              deaths and drug use higher than when they started. Nobody checked.
              The spending continued.
            </p>
            <p>
              Princeton studied 1,779 policy decisions over 20 years.
              Correlation between what ordinary voters want and what becomes law:
              zero percent. When economic elites want something: 78% of the time.
              Your democracy correlates with your preferences the way a coin flip
              correlates with your breakfast.
            </p>
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
              Singapore spends roughly a quarter of what the US spends per capita
              on healthcare. Singaporeans live about{" "}
              <ParameterValue
                className={N}
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

          {/* ── The number ──────────────────────────────────── */}
          <div className="eos-giant">
            <div className="eos-giant-value">
              <ParameterValue
                param={POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL}
              />
              <span className="eos-per">/year</span>
            </div>
            <p className="eos-giant-caption">
              <span className="eos-label">The Political Dysfunction Tax.</span>{" "}
              The annual cost of not checking.{" "}
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
            <a className="eos-billlink" href={AUDIT_URL}>
              Read the full forensic audit →
            </a>
          </div>

          {/* ── The love line (verbatim, canonical) ─────────── */}
          <div className="eos-love">
            <p>
              I love you very much and I do not want you and everyone you have
              ever loved to be slowly tortured and brutally murdered by horrible
              diseases.
            </p>
            <p>That is why this store exists.</p>
          </div>
        </div>
      </section>

      {/* ── The pivot: Register 1 → Register 2 ─────────────── */}
      <div className="eos-pivot">
        <div className="eos-container">
          <p className="eos-pivot-eyebrow">Earth Optimization Services</p>
          <p className="eos-pivot-q">
            Has your species developed nuclear weapons, antibiotics, and the
            internet, and then pointed two of those three at each other?
          </p>
          <p className="eos-pivot-a">You may be eligible for optimization.</p>
        </div>
      </div>
    </>
  );
}
