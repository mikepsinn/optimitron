import {
  CURRENT_DRUG_APPROVALS_PER_YEAR,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  POST_WW2_MILITARY_CUT_PCT,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TREATY_ANNUAL_FUNDING,
  US_1939_MILITARY_SPENDING_PCT_LOWER_THAN_CURRENT,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { TwoNumberDashboard } from "@/components/design-a/TwoNumberDashboard";

const HOT = "dsa-hot";

/**
 * Section 4, Product 1, as a full catalog page: item number, enormous product
 * name, the retail-price comparison as the hero, three lines of copy, the
 * two-number dashboard, then specifications below the fold. The paragraphs live
 * behind the read-the-math flap.
 */
export function OptimitronProduct() {
  return (
    <section className="dsa-product" id="the-optimitron">
      <div className="dsa-wrap">
        <div className="dsa-page-head">
          <p className="dsa-eyebrow">Section 4 / The Standard Package</p>
          <p className="dsa-folio">Item No. 4-001</p>
        </div>

        <h2 className="dsa-display dsa-product-name">The Optimitron</h2>
        <div className="dsa-product-sub">
          <p className="dsa-product-kicker">The Evidence Engine</p>
          <p className="dsa-product-tag">
            The thermostat your government never installed.
          </p>
        </div>

        {/* the hero: what it costs, what you are paying instead */}
        <div className="dsa-pricebox">
          <div className="dsa-price">
            <p className="dsa-price-label">Retail price</p>
            <p className="dsa-price-value">Included.</p>
            <p className="dsa-price-fine">The data is free.</p>
          </div>
          <div className="dsa-price dsa-price--paying">
            <p className="dsa-price-label">Currently paying</p>
            <p className="dsa-price-value">
              Whatever your representatives&rsquo; donors feel like.
            </p>
          </div>
          <div className="dsa-price dsa-price--replaces">
            <p className="dsa-price-label">Replaces</p>
            <p className="dsa-price-value">Governing by argument.</p>
          </div>
        </div>

        <ul className="dsa-threelines">
          <li>
            Your planet has 10,000 jurisdictions, each trying slightly different
            policies.
          </li>
          <li>
            Right now, you determine which is which by having politicians argue
            on television.
          </li>
          <li>
            The Optimal Policy Generator replaces the arguing with counting.
          </li>
        </ul>

        <TwoNumberDashboard />

        {/* below the fold: specifications */}
        <div className="dsa-specs">
          <h3 className="dsa-specs-title">Specifications</h3>

          <div className="dsa-spec-row">
            <p className="dsa-spec-name">Tax code</p>
            <p className="dsa-spec-before">
              74,000 pages. Filing cost per citizen: $1,200.
            </p>
            <p className="dsa-spec-arrow" aria-hidden="true">
              &rarr;
            </p>
            <p className="dsa-spec-after">6 lines. Filing cost: $0.</p>
          </div>

          <div className="dsa-spec-row">
            <p className="dsa-spec-name">Drug approval</p>
            <p className="dsa-spec-before">
              14 years, $2.6 billion per drug.{" "}
              <ParameterValue
                className={`${HOT} dsa-hot-coral`}
                display="integer"
                param={CURRENT_DRUG_APPROVALS_PER_YEAR}
              />{" "}
              approvals/year.
            </p>
            <p className="dsa-spec-arrow" aria-hidden="true">
              &rarr;
            </p>
            <p className="dsa-spec-after">
              Pragmatic trials, 90% cost reduction. 200+ approvals/year.
            </p>
          </div>

          <div className="dsa-spec-row">
            <p className="dsa-spec-name">Welfare</p>
            <p className="dsa-spec-before">
              80+ programs, 95,000 administrators.
            </p>
            <p className="dsa-spec-arrow" aria-hidden="true">
              &rarr;
            </p>
            <p className="dsa-spec-after">
              Single universal deposit, automatic.
            </p>
          </div>

          <div className="dsa-spec-row">
            <p className="dsa-spec-name">Clinical trials</p>
            <p className="dsa-spec-before">
              <ParameterValue
                className={`${HOT} dsa-hot-coral`}
                param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
              />{" "}
              kill:cure ratio.
            </p>
            <p className="dsa-spec-arrow" aria-hidden="true">
              &rarr;
            </p>
            <p className="dsa-spec-after">
              1% Treaty funds{" "}
              <ParameterValue className={HOT} param={TREATY_ANNUAL_FUNDING} />
              /year in trials.
            </p>
          </div>
        </div>

        {/* the highest-EV recommendation, as an included accessory */}
        <div className="dsa-included">
          <div className="dsa-included-head">
            <p className="dsa-included-title">
              Included: the 1% Treaty
            </p>
            <p className="dsa-eyebrow">
              Current highest-expected-value recommendation
            </p>
          </div>
          <div className="dsa-included-grid">
            <div className="dsa-stat">
              <p className="dsa-stat-value">
                <ParameterValue
                  display="integer"
                  param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
                  presentation="inline"
                />{" "}
                &rarr;{" "}
                <ParameterValue
                  display="integer"
                  param={DFDA_QUEUE_CLEARANCE_YEARS}
                  presentation="inline"
                />
              </p>
              <p className="dsa-stat-label">Disease eradication</p>
            </div>
            <div className="dsa-stat">
              <p className="dsa-stat-value">
                <ParameterValue
                  param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS}
                  presentation="inline"
                />
              </p>
              <p className="dsa-stat-label">
                The average treatment arrives sooner
              </p>
            </div>
            <div className="dsa-stat">
              <p className="dsa-stat-value">
                <ParameterValue
                  param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED}
                  presentation="inline"
                />
              </p>
              <p className="dsa-stat-label">
                People who would have died do not
              </p>
            </div>
            <div className="dsa-stat">
              <p className="dsa-stat-value">
                <ParameterValue
                  param={TREATY_ANNUAL_FUNDING}
                  presentation="inline"
                />
              </p>
              <p className="dsa-stat-label">
                1% Treaty funds, per year, in trials
              </p>
            </div>
          </div>
        </div>

        <details className="dsa-math">
          <summary>Read the math</summary>
          <div className="dsa-math-body">
            <p>
              Your planet has 10,000 jurisdictions, each trying slightly
              different policies. Some produce healthy, wealthy citizens. Others
              produce the opposite. Right now, you determine which is which by
              having politicians argue on television. The Optimal Policy
              Generator replaces the arguing with counting.
            </p>
            <p>
              It examines what every jurisdiction tried and what happened next.
              Synthetic controls, difference-in-differences, regression
              discontinuity. Not opinion. Not ideology. Measurement. Output:
              ENACT / REPLACE / REPEAL / MAINTAIN. Each recommendation scored on
              the two numbers.
            </p>
            <p>
              Its current highest-expected-value recommendation is the 1% Treaty:
              move 1% of every nation&rsquo;s weapons budget to clinical trials.
              Everyone cuts equally. Nobody is easier to invade. Disease
              eradication goes from{" "}
              <ParameterValue
                className={HOT}
                display="integer"
                param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
              />{" "}
              to{" "}
              <ParameterValue
                className={HOT}
                display="integer"
                param={DFDA_QUEUE_CLEARANCE_YEARS}
              />
              . The average treatment arrives{" "}
              <ParameterValue
                className={HOT}
                param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS}
              />{" "}
              sooner.{" "}
              <ParameterValue
                className={HOT}
                param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED}
              />{" "}
              people who would have died do not.
            </p>
            <p>
              Your governments have signed treaties banning chemical weapons (193
              countries), biological weapons (187), and landmines (164). This one
              asks them to buy 1% fewer weapons and spend the savings on figuring
              out why everyone keeps dying. Pre-WW2 military spending was{" "}
              <ParameterValue
                className={HOT}
                param={US_1939_MILITARY_SPENDING_PCT_LOWER_THAN_CURRENT}
              />{" "}
              lower than today, inflation-adjusted. They still won World War II.
              Then they cut spending{" "}
              <ParameterValue
                className={HOT}
                param={POST_WW2_MILITARY_CUT_PCT}
              />{" "}
              in two years and walked into the greatest economic expansion in
              history. One percent should be manageable.
            </p>
          </div>
        </details>

        <figure className="dsa-testimonial">
          <p className="dsa-stars" aria-hidden="true">
            &#9733;&#9733;&#9733;&#9733;&#9733;
          </p>
          <blockquote>
            &ldquo;We spent 4,000 years debating education policy. The Optimal
            Policy Generator resolved it in an afternoon. Our main regret is the
            4,000 years.&rdquo;
          </blockquote>
          <figcaption>Planet Keth-7, client since 8,000 BCE</figcaption>
        </figure>
      </div>
    </section>
  );
}
