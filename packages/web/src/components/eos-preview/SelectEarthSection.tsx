import {
  CURRENT_TRAJECTORY_GDP_YEAR_20,
  DISEASE_BURDEN_GDP_DRAG_PCT,
  GLOBAL_DESTRUCTIVE_ECONOMY_PCT_GDP,
  TREATY_TRAJECTORY_CAGR_YEAR_20,
  TREATY_TRAJECTORY_GDP_YEAR_20,
  TREATY_VS_CURRENT_MEDIAN_INCOME_MULTIPLIER_YEAR_20,
  WISHONIA_TRAJECTORY_CAGR_YEAR_20,
  WISHONIA_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_20,
  WISHONIA_TRAJECTORY_GDP_YEAR_20,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { FourEarthsPreview } from "@/components/eos-preview/FourEarthsPreview";
import { Reveal } from "@/components/eos-preview/Reveal";

const N = "eos-num";

/**
 * SECTION 7: PLEASE SELECT AN EARTH. A chooser, not a forecast: the visitor's
 * own number diverges across four Earths. Copy verbatim from the spec.
 */
export function SelectEarthSection() {
  return (
    <section className="eos-section eos-r2" id="select-earth" style={{ background: "var(--eos-bg)" }}>
      <div className="eos-container">
        <Reveal className="eos-catalog-head">
          <p className="eos-eyebrow">Section 7</p>
          <h2 className="eos-catalog-title">Please Select an Earth</h2>
          <p className="eos-catalog-deck">
            You are selecting which Earth happens. Doing nothing selects the
            red line.
          </p>
        </Reveal>

        <Reveal>
          <div className="eos-panel">
            <FourEarthsPreview />
          </div>
          <p
            style={{
              marginTop: "0.9rem",
              fontFamily: "var(--eos-font-mono)",
              fontSize: "0.75rem",
              color: "var(--eos-ink-muted)",
            }}
          >
            Whole-Earth output at 2045: Fantasy Baseline{" "}
            <ParameterValue param={CURRENT_TRAJECTORY_GDP_YEAR_20} presentation="inline" />
            {"; "}1% Treaty (
            <ParameterValue
              figures={2}
              param={TREATY_TRAJECTORY_CAGR_YEAR_20}
              presentation="inline"
            />{" "}
            CAGR){" "}
            <ParameterValue param={TREATY_TRAJECTORY_GDP_YEAR_20} presentation="inline" />
            {"; "}Optimal Governance (
            <ParameterValue
              figures={2}
              param={WISHONIA_TRAJECTORY_CAGR_YEAR_20}
              presentation="inline"
            />{" "}
            CAGR){" "}
            <ParameterValue param={WISHONIA_TRAJECTORY_GDP_YEAR_20} presentation="inline" />
            .
          </p>
        </Reveal>

        <Reveal>
          <div className="eos-prose" style={{ maxWidth: "72ch", margin: "2.5rem auto 0" }}>
            <p>
              Your economists project steady 2.5% growth. This requires twenty
              consecutive years of nothing going wrong. Your species has never
              achieved this, because your largest economic sector is destroying
              things, and destroying things is a growth industry.
            </p>
            <p>
              The red line is what is actually happening. Your destructive
              economy is already{" "}
              <ParameterValue
                className={N}
                param={GLOBAL_DESTRUCTIVE_ECONOMY_PCT_GDP}
              />{" "}
              of GDP and growing faster than everything else. The civilizations
              that ran this experiment before you crossed a similar threshold on
              the way down.
            </p>
            <p>
              The blue line is the 1% Treaty: move 1% of the weapons budget to
              clinical trials. The average person ends up{" "}
              <ParameterValue
                className={N}
                display="withUnit"
                param={TREATY_VS_CURRENT_MEDIAN_INCOME_MULTIPLIER_YEAR_20}
              />{" "}
              richer. The gold line is what happens if you install every product
              you just saw. The gap between these lines is the measured cost of
              human stupidity, priced annually, compounded over twenty years.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div
            style={{
              display: "grid",
              gap: "1.25rem",
              marginTop: "2.5rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 24rem), 1fr))",
            }}
          >
            <div className="eos-panel-soft">
              <p className="eos-eyebrow" style={{ marginBottom: "0.75rem" }}>
                The downside
              </p>
              <div className="eos-prose">
                <p>
                  You own shares of the companies that currently control your
                  government. They have paid dividends through every war and
                  recession in living memory. The floor is &ldquo;you
                  accidentally bought an ETF with no fees.&rdquo;
                </p>
              </div>
            </div>
            <div className="eos-panel-soft">
              <p className="eos-eyebrow" style={{ marginBottom: "0.75rem" }}>
                The upside
              </p>
              <div className="eos-prose">
                <p>
                  Most products on your planet come with one benefit. A toaster
                  makes toast. A car moves you from the place you do not want to
                  be to the place you do not want to go. This product has the
                  unusual property of making nearly everything else you own more
                  valuable at the same time. The economy gets{" "}
                  <ParameterValue
                    className={N}
                    display="withUnit"
                    param={WISHONIA_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_20}
                  />{" "}
                  larger by year 20. The companies you own capture that growth.
                  Your taxes fall. Your other investments rise. Disease stops
                  eating{" "}
                  <ParameterValue
                    className={N}
                    param={DISEASE_BURDEN_GDP_DRAG_PCT}
                  />{" "}
                  of GDP. You live longer to enjoy it.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
