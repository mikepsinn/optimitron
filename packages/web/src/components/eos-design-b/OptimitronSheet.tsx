import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS,
  POST_WW2_MILITARY_CUT_PCT,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  US_1939_MILITARY_SPENDING_PCT_LOWER_THAN_CURRENT,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { PolicyComparator } from "@/components/eos-design-b/PolicyComparator";
import { TwoNumberDashboard } from "@/components/eos-design-b/TwoNumberDashboard";

const N = "pk-n";

/**
 * Section 4, Product 1 — The Optimitron, at data-journalism scale.
 *
 * The two-number dashboard is the section: two enormous counters that run
 * from today's measured value to the treaty-trajectory target. The policy
 * comparator sits under it as the working demo. All four prose paragraphs
 * from the spec live behind "read the math".
 */
export function OptimitronSheet() {
  return (
    <section className="pkb-sec" id="the-optimitron">
      <div className="pkb-wrap">
        <div className="pkb-sheet">
          <div className="pkb-sheethead">
            <h2>Fig. 3 — Product 1: The Optimitron</h2>
            <p className="pkb-tag">Release No. EOS-B-001 · Sheet 3 of 4</p>
          </div>

          <div className="pkb-prodhead">
            <p className="pkb-tag pkb-tag--blue">The Evidence Engine</p>
            <p className="pkb-prodname">The Optimitron</p>
            <p className="pkb-prodtag">
              The thermostat your government never installed.
            </p>
            <table className="pkb-spec">
              <tbody>
                <tr>
                  <th scope="row">Replaces</th>
                  <td>Governing by argument.</td>
                </tr>
                <tr>
                  <th scope="row">Retail price</th>
                  <td>Included. The data is free.</td>
                </tr>
                <tr>
                  <th scope="row">Currently paying</th>
                  <td>
                    Whatever your representatives&apos; donors feel like.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="pkb-tag pkb-tag--hot" style={{ marginBottom: "1rem" }}>
            Center display · The two numbers everything is scored on
          </p>
          <TwoNumberDashboard />

          <p
            className="pkb-tag pkb-tag--blue"
            style={{ marginTop: "clamp(2.5rem, 6vw, 4rem)" }}
          >
            Policy comparator · Select a line to open the measurement
          </p>
          <PolicyComparator />

          <div className="pkb-callouts" style={{ marginTop: "2rem" }}>
            <div className="pkb-callout">
              <span className="pkb-callout-k">
                Disease queue, current rate
              </span>
              <span className="pkb-callout-v">
                <ParameterValue
                  className={N}
                  display="integer"
                  param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
                />{" "}
                years
              </span>
            </div>
            <div className="pkb-callout">
              <span className="pkb-callout-k">
                Disease queue, 1% Treaty rate
              </span>
              <span className="pkb-callout-v">
                <ParameterValue
                  className={N}
                  display="integer"
                  param={DFDA_QUEUE_CLEARANCE_YEARS}
                />{" "}
                years
              </span>
            </div>
            <div className="pkb-callout">
              <span className="pkb-callout-k">
                People who would have died and do not
              </span>
              <span className="pkb-callout-v">
                <ParameterValue
                  className={N}
                  param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED}
                />
              </span>
            </div>
          </div>

          <details className="pkb-math">
            <summary>Read the math · how the recommendation is made</summary>
            <div className="pkb-mathbody">
              <p>
                Your planet has 10,000 jurisdictions, each trying slightly
                different policies. Some produce healthy, wealthy citizens.
                Others produce the opposite. Right now, you determine which is
                which by having politicians argue on television. The Optimal
                Policy Generator replaces the arguing with counting.
              </p>
              <p>
                It examines what every jurisdiction tried and what happened
                next. Synthetic controls, difference-in-differences, regression
                discontinuity. Not opinion. Not ideology. Measurement. Output:
                ENACT / REPLACE / REPEAL / MAINTAIN. Each recommendation scored
                on the two numbers.
              </p>
              <p>
                Its current highest-expected-value recommendation is the 1%
                Treaty: move 1% of every nation&apos;s weapons budget to
                clinical trials. Everyone cuts equally. Nobody is easier to
                invade. Disease eradication goes from{" "}
                <ParameterValue
                  className={N}
                  display="integer"
                  param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
                />{" "}
                to{" "}
                <ParameterValue
                  className={N}
                  display="integer"
                  param={DFDA_QUEUE_CLEARANCE_YEARS}
                />
                . The average treatment arrives{" "}
                <ParameterValue
                  className={N}
                  param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS}
                />{" "}
                sooner.{" "}
                <ParameterValue
                  className={N}
                  param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED}
                />{" "}
                people who would have died do not.
              </p>
              <p>
                Your governments have signed treaties banning chemical weapons
                (193 countries), biological weapons (187), and landmines (164).
                This one asks them to buy 1% fewer weapons and spend the savings
                on figuring out why everyone keeps dying. Pre-WW2 military
                spending was{" "}
                <ParameterValue
                  className={N}
                  param={US_1939_MILITARY_SPENDING_PCT_LOWER_THAN_CURRENT}
                />{" "}
                lower than today, inflation-adjusted. They still won World War
                II. Then they cut spending{" "}
                <ParameterValue
                  className={N}
                  param={POST_WW2_MILITARY_CUT_PCT}
                />{" "}
                in two years and walked into the greatest economic expansion in
                history. One percent should be manageable.
              </p>
            </div>
          </details>

          <div className="pkb-quote">
            <p>
              &ldquo;We spent 4,000 years debating education policy. The Optimal
              Policy Generator resolved it in an afternoon. Our main regret is
              the 4,000 years.&rdquo;
            </p>
            <cite>Planet Keth-7, client since 8,000 BCE</cite>
          </div>
        </div>
      </div>
    </section>
  );
}
