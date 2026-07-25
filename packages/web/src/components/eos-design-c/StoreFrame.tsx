import { DcArrow } from "@/components/eos-design-c/DcArrow";
import { ReadTheMath } from "@/components/eos-design-c/ReadTheMath";

/**
 * Section 2 — The Store. The pitchman is already talking, so the screen
 * leads with the mechanism drawn as FIG. 1 and lets the narrator's lines
 * sit beside the illustrations. The 100-word definition of the company is
 * the only long paragraph, and it lives behind the disclosure.
 *
 * All prose verbatim from the spec's SECTION 2 copy block.
 */
export function StoreFrame() {
  return (
    <section className="dc-frame" id="the-store">
      <div className="dc-wrap">
        <p className="dc-slate dc-frame-slate">Section 2 · The Store</p>
        <h2 className="dc-h dc-frame-title">The Store</h2>
        <p className="dc-frame-deck">
          Earth Optimization Services is our regional branch. Same proven
          technology. Smaller market. More shouting.
        </p>

        <div className="dc-plate">
          <span className="dc-slate dc-plate-cap">
            <b>Fig. 1</b> — What Earth Optimization Services does
          </span>

          <div className="dc-flow">
            <div className="dc-node dc-node-start">You</div>
            <DcArrow />
            <div className="dc-node">
              Buy the companies that control your government
            </div>
            <DcArrow />
            <div className="dc-node">Shareholder rights</div>
            <DcArrow />
            <div className="dc-node">Their lobbyists</div>
            <DcArrow />
            <div className="dc-node">The policies that maximize two numbers</div>
          </div>

          <div className="dc-conn" aria-hidden="true">
            <svg viewBox="0 0 34 16" role="presentation">
              <path className="dc-draw" d="M1 8 H25" markerEnd="url(#dc-head)" />
            </svg>
          </div>

          <div className="dc-outs">
            <div className="dc-node dc-node-out">
              Median health-adjusted life expectancy ↑
            </div>
            <div className="dc-node dc-node-out">
              Median after-tax inflation-adjusted income ↑
            </div>
          </div>
        </div>

        <div className="dc-cols">
          <div className="dc-plate">
            <span className="dc-slate dc-plate-cap">
              <b>Fig. 2</b> — The installed base
            </span>
            <div className="dc-side">
              <svg
                aria-hidden="true"
                className="dc-side-fig"
                role="presentation"
                viewBox="0 0 200 120"
              >
                <g className="dc-draw">
                  {Array.from({ length: 18 }, (_, i) => {
                    const col = i % 6;
                    const row = Math.floor(i / 6);
                    return (
                      <circle
                        key={i}
                        cx={22 + col * 31}
                        cy={22 + row * 32}
                        r={10}
                      />
                    );
                  })}
                  <path d="M8 106 H192" />
                </g>
                <text className="dc-lab" x="8" y="120">
                  300+ optimized
                </text>
              </svg>
              <p className="dc-say">
                Universe Optimization Services has been upgrading civilizations
                since before your sun ignited. Over 300 planets optimized. 100%
                satisfaction rate among clients who got started. Clients who did
                not get started are not available for comment, as they are not
                available for anything. Some are available for mining rights.
              </p>
            </div>
          </div>

          <div className="dc-plate">
            <span className="dc-slate dc-plate-cap">
              <b>Fig. 3</b> — The steering wheel
            </span>
            <div className="dc-side">
              <svg
                aria-hidden="true"
                className="dc-side-fig"
                role="presentation"
                viewBox="0 0 200 140"
              >
                <g className="dc-draw">
                  <circle cx="86" cy="70" r="52" />
                  <circle cx="86" cy="70" r="16" />
                  <path d="M86 18 V54" />
                  <path d="M41 96 L72 78" />
                  <path d="M131 96 L100 78" />
                  <path d="M138 44 L176 22" />
                  <path d="M176 22 L192 34 L158 56 Z" />
                </g>
                <text className="dc-lab" x="150" y="86" textAnchor="middle">
                  Not
                </text>
                <text className="dc-lab" x="150" y="100" textAnchor="middle">
                  for sale
                </text>
              </svg>
              <p className="dc-say">
                You are the President of Earth Optimization Services. One Class A
                share per human, one civic vote, free. If you want returns, buy
                Class B shares. Money buys a share of the profit, not extra votes
                or governance. One cannot buy the steering wheel, no matter how
                many shares you own, because selling the steering wheel is the
                problem we are solving.
              </p>
            </div>
          </div>
        </div>

        <ReadTheMath label="Read the full description">
          <p>
            Earth Optimization Services is a company that buys the companies
            that control your government, uses hundreds of years of data from
            193 countries to determine the policies and budgets that maximize
            two numbers (median health-adjusted life expectancy and median
            after-tax inflation-adjusted income), and then uses shareholder
            rights to make those companies&apos; lobbyists implement the
            policies that are in the best interests of their shareholders, the
            corporations&apos; profits, and the general welfare, making everyone
            richer and significantly less dead.
          </p>
        </ReadTheMath>
      </div>
    </section>
  );
}
