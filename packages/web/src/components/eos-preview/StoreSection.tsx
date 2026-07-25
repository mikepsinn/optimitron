import { Reveal } from "@/components/eos-preview/Reveal";

/**
 * Section 2 — The Store. The cheerful pitchman arrives. First time the
 * visitor sees EOS as a product. Copy is verbatim from the spec
 * (eos-landing-page.qmd §SECTION 2); no parameters render here.
 */
export function StoreSection() {
  return (
    <section className="eos-section eos-r2 eos-store" id="the-store">
      <div className="eos-container">
        <Reveal className="eos-catalog-head">
          <p className="eos-eyebrow">Section 2</p>
          <h2 className="eos-catalog-title">The Store</h2>
        </Reveal>

        <Reveal className="eos-store-body">
          <p className="eos-store-lede">
            Earth Optimization Services is a company that buys the companies
            that control your government, uses hundreds of years of data from
            193 countries to determine the policies and budgets that maximize
            two numbers (median health-adjusted life expectancy and median
            after-tax inflation-adjusted income), and then uses shareholder
            rights to make those companies&apos; lobbyists implement the
            policies that are in the best interests of their shareholders, the
            corporations&apos; profits, and the general welfare, making
            everyone richer and significantly less dead.
          </p>
          <p>
            Universe Optimization Services has been upgrading civilizations
            since before your sun ignited. Over 300 planets optimized. 100%
            satisfaction rate among clients who got started. Clients who did
            not get started are not available for comment, as they are not
            available for anything. Some are available for mining rights.
          </p>
          <p>
            Earth Optimization Services is our regional branch. Same proven
            technology. Smaller market. More shouting.
          </p>
          <p className="eos-store-keys">
            You are the President of Earth Optimization Services. One Class A
            share per human, one civic vote, free. If you want returns, buy
            Class B shares. Money buys a share of the profit, not extra votes
            or governance. One cannot buy the steering wheel, no matter how
            many shares you own, because selling the steering wheel is the
            problem we are solving.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
