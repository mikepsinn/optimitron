import Link from "next/link";
import {
  DFDA_ROI_RD_ONLY,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  TREATY_ANNUAL_FUNDING,
  TREATY_CAMPAIGN_TOTAL_COST,
  TREATY_ROI_EXISTING_DRUGS_ONLY,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { Reveal } from "@/components/eos-preview/Reveal";
import { ROUTES } from "@/lib/routes";

/**
 * SECTION 10: YOUR MOVE. One participation path among three, in the spec's
 * order: buy Class B, claim your free Class A, fund or do a task. Copy
 * verbatim; securities disclosure always visible.
 */
export function YourMoveSection() {
  return (
    <section className="eos-section eos-r2" id="your-move" style={{ background: "var(--eos-bg)" }}>
      <div className="eos-container">
        <Reveal className="eos-catalog-head">
          <p className="eos-eyebrow">Section 10</p>
          <h2 className="eos-catalog-title">For Investors</h2>
        </Reveal>

        <Reveal>
          <div
            style={{
              display: "grid",
              gap: "1.25rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 24rem), 1fr))",
            }}
          >
            <div className="eos-panel-soft">
              <p className="eos-eyebrow" style={{ marginBottom: "0.75rem" }}>
                The Structure
              </p>
              <div className="eos-prose">
                <p>
                  Earth Optimization Services is a holding company. Investors
                  receive revenue share from the portfolio&apos;s performance.
                  You do not receive governance rights, board seats, or
                  influence over strategy. This is deliberate. You cannot buy
                  the steering wheel, no matter how many shares you own, because
                  selling the steering wheel is the problem we are solving.
                </p>
              </div>
            </div>
            <div className="eos-panel-soft">
              <p className="eos-eyebrow" style={{ marginBottom: "0.75rem" }}>
                The Floor
              </p>
              <div className="eos-prose">
                <p>
                  If the campaign fails entirely, part of every dollar is still
                  sitting in shares of military and pharmaceutical companies
                  purchased at market price. That part comes back when the
                  portfolio liquidates; the part that funded the campaign is
                  spent. The exact split lives in the offering documents. The
                  floor is: you accidentally bought an ETF. These companies have
                  paid dividends through every war and recession in living
                  memory.
                </p>
              </div>
            </div>
            <div className="eos-panel-soft">
              <p className="eos-eyebrow" style={{ marginBottom: "0.75rem" }}>
                The Upside
              </p>
              <div className="eos-prose">
                <p>
                  Most products on your planet come with one benefit. A toaster
                  makes toast. A car moves you from the place you do not want to
                  be to the place you do not want to go. This product has the
                  unusual property of making nearly everything else you own more
                  valuable at the same time, because the same act that ends war
                  and disease happens to end the thing that has been eating your
                  economy alive since before you invented accounting.
                </p>
                <p>
                  If the campaign works, value compounds across the economy
                  simultaneously: the companies capture the growth, your tax
                  burden falls, your other investments rise, medical costs
                  disappear from your budget, and you live longer to enjoy it.
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="eos-datacards" data-cols="5" style={{ marginTop: "2rem" }}>
            <div className="eos-datacard">
              <div className="eos-datacard-value">
                <ParameterValue
                  display="integer"
                  param={DFDA_ROI_RD_ONLY}
                  presentation="inline"
                />
                x
              </div>
              <div className="eos-datacard-label">
                Treaty ROI (R&amp;D savings only)
              </div>
            </div>
            <div className="eos-datacard">
              <div className="eos-datacard-value">
                <ParameterValue
                  param={TREATY_ROI_EXISTING_DRUGS_ONLY}
                  presentation="inline"
                />
                :1
              </div>
              <div className="eos-datacard-label">
                Treaty ROI (existing drugs + efficacy lag)
              </div>
            </div>
            <div className="eos-datacard">
              <div className="eos-datacard-value">
                <ParameterValue
                  figures={1}
                  param={TREATY_CAMPAIGN_TOTAL_COST}
                  presentation="inline"
                />
              </div>
              <div className="eos-datacard-label">Campaign cost</div>
            </div>
            <div className="eos-datacard">
              <div className="eos-datacard-value">
                <ParameterValue param={TREATY_ANNUAL_FUNDING} presentation="inline" />
              </div>
              <div className="eos-datacard-label">
                Annual treaty funding generated
              </div>
            </div>
            <div className="eos-datacard">
              <div className="eos-datacard-value">
                <ParameterValue
                  display="withUnit"
                  param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
                  presentation="inline"
                />
              </div>
              <div className="eos-datacard-label">Trial capacity multiplier</div>
            </div>
          </div>
          <p
            style={{
              marginTop: "1rem",
              fontSize: "0.85rem",
              lineHeight: 1.6,
              color: "var(--eos-ink-muted)",
              maxWidth: "76ch",
            }}
          >
            Historical public health ROI: smallpox eradication 280:1, childhood
            vaccination 13:1, Human Genome Project $1T economic impact. These
            are context for the scale of returns public health interventions
            have produced, not predictions for this investment.
          </p>
        </Reveal>

        <Reveal>
          <div className="eos-disclosure" style={{ marginTop: "2rem" }}>
            <p style={{ margin: 0 }}>
              <strong style={{ color: "var(--eos-ink)" }}>DISCLOSURE.</strong>{" "}
              All returns are projections from a published model, not
              guarantees. The model, its parameters, and every derivation chain
              are public. Earth Optimization Services equity is offered under
              Reg D 506(c) to verified accredited investors only. Equity is
              illiquid until an exit or listing; do not invest money you need.
              Full terms are in the Private Placement Memorandum, available upon
              request and verification of accredited investor status.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="eos-paths">
            <div className="eos-path-card">
              <p className="eos-path-num">Path 1</p>
              <p className="eos-path-title">Buy Class B Shares</p>
              <div className="eos-prose" style={{ marginTop: "0.9rem" }}>
                <p>
                  Revenue share from the portfolio&apos;s performance. Never the
                  steering wheel.
                </p>
              </div>
              {/* TODO: destination undefined in the spec (PPM request flow);
                  candidate is ROUTES.fund. Mike decides. */}
              <a className="eos-btn eos-btn-solid" href="#" style={{ marginTop: "1.25rem" }}>
                Request the PPM
              </a>
            </div>
            <div className="eos-path-card">
              <p className="eos-path-num">Path 2</p>
              <p className="eos-path-title">Claim Your Class A Share</p>
              <div className="eos-prose" style={{ marginTop: "0.9rem" }}>
                <p>
                  You are the President of Earth Optimization Services. Your
                  Class A share is free. One civic vote per human. Not for sale.
                </p>
              </div>
              {/* TODO: destination undefined in the spec (sign-up flow);
                  candidate is ROUTES.join. Mike decides. */}
              <a className="eos-btn" href="#" style={{ marginTop: "1.25rem" }}>
                Sign Up and Claim Your Share
              </a>
            </div>
            <div className="eos-path-card">
              <p className="eos-path-num">Path 3</p>
              <p className="eos-path-title">Fund or Do a Task</p>
              <div className="eos-prose" style={{ marginTop: "0.9rem" }}>
                <p>
                  The decentralized TODO list for humanity is live. Every task
                  has an expected value in health and wealth. Pledge money to
                  fund a task (it executes when enough people commit) or do it
                  yourself.
                </p>
              </div>
              <Link className="eos-btn" href={ROUTES.tasks} style={{ marginTop: "1.25rem" }}>
                Browse the TODO List
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
