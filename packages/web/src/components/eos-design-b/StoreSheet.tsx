import { GLOBAL_POPULATION_2024 } from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";

/**
 * Section 2 — The Store.
 *
 * Press-kit treatment: the screen leads with the share register (one Class A
 * share per human, so the enormous number is the human population), the short
 * verbatim paragraphs run as figure legend and provenance note, and the long
 * definition paragraph sits behind "read the math".
 */
export function StoreSheet() {
  return (
    <section className="pkb-sec pkb-grid" id="the-store">
      <div className="pkb-wrap">
        <div className="pkb-sheet">
          <div className="pkb-sheethead">
            <h2>Fig. 2 — The Store</h2>
            <p className="pkb-tag">Release No. EOS-B-001 · Sheet 2 of 4</p>
          </div>

          <div className="pkb-storegrid">
            <div>
              <p className="pkb-tag pkb-tag--blue">
                Class A shares outstanding
              </p>
              <span className="pkb-huge">
                <ParameterValue
                  param={GLOBAL_POPULATION_2024}
                  presentation="inline"
                />
                <span className="pkb-huge-unit">humans</span>
              </span>
              <div className="pkb-dim">
                <span className="pkb-tag">1 human</span>
                <span className="pkb-dim-rule" />
                <span className="pkb-tag pkb-tag--blue">1 share · 1 vote</span>
              </div>
              <p className="pkb-legend" style={{ marginTop: "1.4rem" }}>
                You are the President of Earth Optimization Services. One Class
                A share per human, one civic vote, free. If you want returns,
                buy Class B shares. Money buys a share of the profit, not extra
                votes or governance. One cannot buy the steering wheel, no
                matter how many shares you own, because selling the steering
                wheel is the problem we are solving.
              </p>
            </div>

            <div>
              <p className="pkb-lede">
                Universe Optimization Services has been upgrading civilizations
                since before your sun ignited. Over 300 planets optimized. 100%
                satisfaction rate among clients who got started.
              </p>
              <p
                className="pkb-legend"
                style={{ marginTop: "1.1rem", maxWidth: "40ch" }}
              >
                Clients who did not get started are not available for comment,
                as they are not available for anything. Some are available for
                mining rights.
              </p>
              <div className="pkb-callouts" style={{ marginTop: "1.75rem" }}>
                <div className="pkb-callout">
                  <span className="pkb-callout-k">Regional branch</span>
                  <span className="pkb-callout-v">
                    Earth Optimization Services
                  </span>
                </div>
                <div className="pkb-callout">
                  <span className="pkb-callout-k">Technology</span>
                  <span className="pkb-callout-v">Same proven technology</span>
                </div>
                <div className="pkb-callout">
                  <span className="pkb-callout-k">Market</span>
                  <span className="pkb-callout-v">
                    Smaller market. More shouting.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <details className="pkb-math">
            <summary>Read the math · what the company actually does</summary>
            <div className="pkb-mathbody">
              <p>
                Earth Optimization Services is a company that buys the companies
                that control your government, uses hundreds of years of data
                from 193 countries to determine the policies and budgets that
                maximize two numbers (median health-adjusted life expectancy and
                median after-tax inflation-adjusted income), and then uses
                shareholder rights to make those companies&apos; lobbyists
                implement the policies that are in the best interests of their
                shareholders, the corporations&apos; profits, and the general
                welfare, making everyone richer and significantly less dead.
              </p>
              <p>
                Earth Optimization Services is our regional branch. Same proven
                technology. Smaller market. More shouting.
              </p>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
