/**
 * Section 2: The Store. Catalog front matter. Leads with the masthead and the
 * three claims as chrome-edged chips, then the two share classes as an order
 * form. The long definitional paragraphs sit behind the read-the-math flap so
 * the screen leads with a number, not a wall.
 */
export function StoreSection() {
  return (
    <section className="dsa-page dsa-store" id="the-store">
      <div className="dsa-wrap">
        <div className="dsa-page-head">
          <p className="dsa-eyebrow">Section 2 / The Store</p>
          <p className="dsa-folio">Earth Edition</p>
        </div>

        <header className="dsa-masthead">
          <p className="dsa-eyebrow dsa-masthead-sup">
            Universe Optimization Services
          </p>
          <h2 className="dsa-display dsa-masthead-name">
            <span>Earth</span>
            <span>Optimization</span>
            <span>Services</span>
          </h2>
          <div className="dsa-masthead-rule" aria-hidden="true" />
          <p className="dsa-masthead-sub">
            Same proven technology. Smaller market. More shouting.
          </p>
        </header>

        <div className="dsa-claims">
          <div className="dsa-claim">
            <p className="dsa-claim-n dsa-claim-n--turq">300+</p>
            <p>
              Universe Optimization Services has been upgrading civilizations
              since before your sun ignited. Over 300 planets optimized.
            </p>
          </div>
          <div className="dsa-claim">
            <p className="dsa-claim-n">100%</p>
            <p>
              100% satisfaction rate among clients who got started. Clients who
              did not get started are not available for comment, as they are not
              available for anything. Some are available for mining rights.
            </p>
          </div>
          <div className="dsa-claim">
            <p className="dsa-claim-n dsa-claim-n--turq">2</p>
            <p>
              Median health-adjusted life expectancy and median after-tax
              inflation-adjusted income.
            </p>
          </div>
        </div>

        <div className="dsa-shares">
          <div className="dsa-shares-head">
            <p className="dsa-eyebrow">You are the President of Earth Optimization Services</p>
            <p className="dsa-eyebrow">Order form</p>
          </div>
          <div className="dsa-shares-grid">
            <div className="dsa-share">
              <p className="dsa-share-class">Class A</p>
              <p className="dsa-share-price">Free</p>
              <p>One Class A share per human, one civic vote, free.</p>
            </div>
            <div className="dsa-share">
              <p className="dsa-share-class">Class B</p>
              <p className="dsa-share-price">Returns</p>
              <p>
                If you want returns, buy Class B shares. Money buys a share of
                the profit, not extra votes or governance.
              </p>
            </div>
          </div>
          <p className="dsa-share-note">
            One cannot buy the steering wheel, no matter how many shares you own,
            because selling the steering wheel is the problem we are solving.
          </p>
        </div>

        <details className="dsa-math">
          <summary>Read the math</summary>
          <div className="dsa-math-body">
            <p>
              Earth Optimization Services is a company that buys the companies
              that control your government, uses hundreds of years of data from
              193 countries to determine the policies and budgets that maximize
              two numbers (median health-adjusted life expectancy and median
              after-tax inflation-adjusted income), and then uses shareholder
              rights to make those companies&rsquo; lobbyists implement the
              policies that are in the best interests of their shareholders, the
              corporations&rsquo; profits, and the general welfare, making
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
            <p>
              You are the President of Earth Optimization Services. One Class A
              share per human, one civic vote, free. If you want returns, buy
              Class B shares. Money buys a share of the profit, not extra votes
              or governance. One cannot buy the steering wheel, no matter how
              many shares you own, because selling the steering wheel is the
              problem we are solving.
            </p>
          </div>
        </details>
      </div>
    </section>
  );
}
