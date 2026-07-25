import {
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
import { DcArrow } from "@/components/eos-design-c/DcArrow";
import { ReadTheMath } from "@/components/eos-design-c/ReadTheMath";
import { TwoNumberDials } from "@/components/eos-design-c/TwoNumberDials";

const P = "dc-p";

/**
 * Section 4, Product 1 — The Optimitron, taught rather than described.
 * Left plate draws the Optimal Policy Generator as the sensor; right plate
 * draws the Optimal Budget Generator as the target; the thermostat loop
 * between them is the tagline made literal. The two dials are the demo.
 * All prose verbatim from the spec; the long copy sits behind the
 * disclosure.
 *
 * Naming note: the spec's own "What is not on this page" list bans the
 * "Evidence Engine" label, so the card is titled The Optimitron only.
 */
export function OptimitronFrame() {
  return (
    <section className="dc-frame dc-frame-lit" id="the-optimitron">
      <div className="dc-wrap">
        <p className="dc-slate dc-frame-slate">
          Section 4 · Product 1 · The Standard Package
        </p>
        <h2 className="dc-h dc-frame-title">The Optimitron</h2>
        <p className="dc-frame-deck">
          The thermostat your government never installed.
        </p>

        <div className="dc-price">
          <div className="dc-price-cell">
            <span className="dc-slate dc-price-k">Replaces</span>
            <p className="dc-price-v">Governing by argument.</p>
          </div>
          <div className="dc-price-cell">
            <span className="dc-slate dc-price-k">Retail price</span>
            <p className="dc-price-v">Included. The data is free.</p>
          </div>
          <div className="dc-price-cell">
            <span className="dc-slate dc-price-k">Currently paying</span>
            <p className="dc-price-v">
              Whatever your representatives&apos; donors feel like.
            </p>
          </div>
        </div>

        {/* ── The two generators, drawn ─────────────────────────────── */}
        <div className="dc-panels">
          <div className="dc-plate">
            <span className="dc-slate dc-plate-cap">
              <b>Fig. 4</b> — The sensor
            </span>
            <h3 className="dc-h dc-panel-h">
              Optimal Policy Generator <span>OPG</span>
            </h3>
            <svg
              aria-hidden="true"
              className="dc-fig"
              role="presentation"
              viewBox="0 0 340 240"
            >
              <g className="dc-draw">
                {/* the 10,000 jurisdictions, sampled as a scatter */}
                {Array.from({ length: 28 }, (_, i) => {
                  const col = i % 7;
                  const row = Math.floor(i / 7);
                  return (
                    <circle
                      key={i}
                      cx={44 + col * 36}
                      cy={30 + row * 17}
                      r={4.5}
                    />
                  );
                })}
                {/* the funnel: counting, not arguing */}
                <path d="M40 108 L300 108 L206 158 L134 158 Z" />
                <path d="M170 158 V184 M164 178 L170 186 L176 178" />
              </g>
              <text className="dc-lab" x="40" y="18">
                10,000 jurisdictions
              </text>
              <text className="dc-lab" x="170" y="136" textAnchor="middle">
                Counting
              </text>
              <g className="dc-draw">
                <rect x="10" y="192" width="74" height="34" />
                <rect x="92" y="192" width="74" height="34" />
                <rect x="174" y="192" width="74" height="34" />
                <rect x="256" y="192" width="74" height="34" />
              </g>
              <text className="dc-lab" x="47" y="213" textAnchor="middle">
                Enact
              </text>
              <text className="dc-lab" x="129" y="213" textAnchor="middle">
                Replace
              </text>
              <text className="dc-lab" x="211" y="213" textAnchor="middle">
                Repeal
              </text>
              <text className="dc-lab" x="293" y="213" textAnchor="middle">
                Maintain
              </text>
            </svg>
            <p className="dc-narr">
              Synthetic controls, difference-in-differences, regression
              discontinuity. Not opinion. Not ideology. Measurement.
            </p>
          </div>

          <div className="dc-plate">
            <span className="dc-slate dc-plate-cap">
              <b>Fig. 5</b> — The target
            </span>
            <h3 className="dc-h dc-panel-h">
              Optimal Budget Generator <span>OBG</span>
            </h3>
            <svg
              aria-hidden="true"
              className="dc-fig"
              role="presentation"
              viewBox="0 0 340 240"
            >
              {/* the weapons budget, with the one percent sliced off */}
              <rect x="20" y="34" width="290" height="46" fill="#a9aea6" />
              <rect x="20" y="34" width="14" height="46" fill="#e0523a" />
              <g className="dc-draw">
                <rect x="20" y="34" width="290" height="46" />
                <path d="M27 92 C40 140 120 150 152 168 M139 158 L154 169 L136 172" />
              </g>
              <text className="dc-lab" x="20" y="26">
                Every nation&apos;s weapons budget
              </text>
              <text className="dc-lab-sm" x="20" y="98">
                1%
              </text>
              {/* the beaker it lands in, with the one percent settled in it */}
              <rect x="150" y="206" width="104" height="19" fill="#0e9aa0" />
              <g className="dc-draw">
                <path d="M168 158 H236 L236 176 L268 226 H136 L168 176 Z" />
              </g>
              <text className="dc-lab" x="202" y="150" textAnchor="middle">
                Clinical trials
              </text>
              <text className="dc-lab-big" x="202" y="200" textAnchor="middle">
                1%
              </text>
            </svg>
            <p className="dc-narr">
              Everyone cuts equally. Nobody is easier to invade. That one
              percent is{" "}
              <ParameterValue className={P} param={TREATY_ANNUAL_FUNDING} />
              /year in trials.
            </p>
          </div>
        </div>

        {/* ── The thermostat loop, literal ──────────────────────────── */}
        <div className="dc-plate">
          <span className="dc-slate dc-plate-cap">
            <b>Fig. 6</b> — Why it is a thermostat
          </span>
          <div className="dc-flow">
            <div className="dc-node dc-node-start">Set the two numbers</div>
            <DcArrow />
            <div className="dc-node">Budget and policy change</div>
            <DcArrow />
            <div className="dc-node">The planet</div>
            <DcArrow />
            <div className="dc-node">Measure what happened</div>
            <DcArrow />
            <div className="dc-node dc-node-out">Adjust, then repeat</div>
          </div>
        </div>

        {/* ── The demo: the two numbers ─────────────────────────────── */}
        <div className="dc-plate">
          <span className="dc-slate dc-plate-cap">
            <b>Fig. 7</b> — The two numbers, live
          </span>
          <TwoNumberDials />
        </div>

        {/* ── The comparator ────────────────────────────────────────── */}
        <div className="dc-plate">
          <span className="dc-slate dc-plate-cap">
            <b>Fig. 8</b> — Four policies, before and after
          </span>
          <div className="dc-comp">
            <ComparatorRow
              after="6 lines. Filing cost per citizen: $0."
              before="74,000 pages. Filing cost per citizen: $1,200."
              name="Tax code"
            />
            <ComparatorRow
              after="Pragmatic trials, 90% cost reduction. 200+ approvals/year."
              before="14 years, $2.6 billion per drug. 50 approvals/year."
              name="Drug approval"
            />
            <ComparatorRow
              after="Single universal deposit, automatic."
              before="80+ programs, 95,000 administrators."
              name="Welfare"
            />
            <ComparatorRow
              after={
                <>
                  1% Treaty funds{" "}
                  <ParameterValue className={P} param={TREATY_ANNUAL_FUNDING} />
                  /year in trials.
                </>
              }
              before={
                <>
                  <ParameterValue
                    className={P}
                    display="withUnit"
                    param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
                  />{" "}
                  kill:cure ratio.
                </>
              }
              name="Clinical trials"
            />
          </div>
        </div>

        {/* ── The headline drop ─────────────────────────────────────── */}
        <div className="dc-drop">
          <div className="dc-drop-cell">
            <span className="dc-slate dc-drop-k">
              Disease eradication, today
            </span>
            <div className="dc-drop-v">
              <ParameterValue
                className={P}
                display="withUnit"
                param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
                presentation="inline"
              />
            </div>
          </div>
          <div className="dc-drop-mid">
            <DcArrow />
          </div>
          <div className="dc-drop-cell dc-drop-cell-good">
            <span className="dc-slate dc-drop-k">With 1% moved to trials</span>
            <div className="dc-drop-v">
              <ParameterValue
                className={P}
                display="withUnit"
                param={DFDA_QUEUE_CLEARANCE_YEARS}
                presentation="inline"
              />
            </div>
          </div>
        </div>

        <p className="dc-narr" style={{ marginTop: "1rem" }}>
          The average treatment arrives{" "}
          <ParameterValue
            className={P}
            display="withUnit"
            param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS}
          />{" "}
          sooner.{" "}
          <ParameterValue
            className={P}
            param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED}
          />{" "}
          people who would have died do not.
        </p>

        <ReadTheMath>
          <p>
            Your planet has 10,000 jurisdictions, each trying slightly different
            policies. Some produce healthy, wealthy citizens. Others produce the
            opposite. Right now, you determine which is which by having
            politicians argue on television. The Optimal Policy Generator
            replaces the arguing with counting.
          </p>
          <p>
            It examines what every jurisdiction tried and what happened next.
            Synthetic controls, difference-in-differences, regression
            discontinuity. Not opinion. Not ideology. Measurement. Output: ENACT
            / REPLACE / REPEAL / MAINTAIN. Each recommendation scored on the two
            numbers.
          </p>
          <p>
            Its current highest-expected-value recommendation is the 1% Treaty:
            move 1% of every nation&apos;s weapons budget to clinical trials.
            Everyone cuts equally. Nobody is easier to invade. Disease
            eradication goes from{" "}
            <ParameterValue
              className={P}
              display="withUnit"
              param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
            />{" "}
            to{" "}
            <ParameterValue
              className={P}
              display="withUnit"
              param={DFDA_QUEUE_CLEARANCE_YEARS}
            />
            . The average treatment arrives{" "}
            <ParameterValue
              className={P}
              display="withUnit"
              param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS}
            />{" "}
            sooner.{" "}
            <ParameterValue
              className={P}
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
              className={P}
              param={US_1939_MILITARY_SPENDING_PCT_LOWER_THAN_CURRENT}
            />{" "}
            lower than today, inflation-adjusted. They still won World War II.
            Then they cut spending{" "}
            <ParameterValue className={P} param={POST_WW2_MILITARY_CUT_PCT} /> in
            two years and walked into the greatest economic expansion in
            history. One percent should be manageable.
          </p>
        </ReadTheMath>

        <blockquote className="dc-testi">
          <p>
            &ldquo;We spent 4,000 years debating education policy. The Optimal
            Policy Generator resolved it in an afternoon. Our main regret is the
            4,000 years.&rdquo;
          </p>
          <cite>Planet Keth-7, client since 8,000 BCE</cite>
        </blockquote>
      </div>
    </section>
  );
}

function ComparatorRow({
  after,
  before,
  name,
}: {
  after: React.ReactNode;
  before: React.ReactNode;
  name: string;
}) {
  return (
    <div className="dc-comp-row">
      <div className="dc-comp-name">{name}</div>
      <div className="dc-comp-swap">
        <span className="dc-before">{before}</span>
        <svg
          aria-hidden="true"
          className="dc-arrow"
          role="presentation"
          viewBox="0 0 34 12"
        >
          <path
            className="dc-draw"
            d="M2 7.6 C9 4.8 16 8.6 25.5 6 M20 1.8 L26.5 6 L20 10.2"
          />
        </svg>
        <span className="dc-after">{after}</span>
      </div>
    </div>
  );
}
