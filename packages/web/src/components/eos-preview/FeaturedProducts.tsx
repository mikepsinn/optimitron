import Link from "next/link";
import type { ReactNode } from "react";
import {
  CROWD_DECISION_ACCURACY,
  DEFENSE_TAKEOVER_COST_ACTIVIST,
  DEFENSE_TAKEOVER_COST_ACTIVIST_PCT_INVESTABLE_ASSETS,
  DEFENSE_TAKEOVER_COST_TOTAL,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS,
  EXPERT_DECISION_ACCURACY,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  NUCLEAR_WINTER_SPARE_APOCALYPSES,
  POST_WW2_MILITARY_CUT_PCT,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TREATY_ANNUAL_FUNDING,
  TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15,
  US_1939_MILITARY_SPENDING_PCT_LOWER_THAN_CURRENT,
  US_TOTAL_LOBBYING_ANNUAL,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { BudgetSlider } from "@/components/eos-preview/BudgetSlider";
import { Reveal } from "@/components/eos-preview/Reveal";
import { TransformationCards } from "@/components/eos-preview/TransformationCards";
import { TwoNumberDashboard } from "@/components/eos-preview/TwoNumberDashboard";
import { ROUTES } from "@/lib/routes";

const N = "eos-num";

function Product({
  kicker,
  name,
  tagline,
  prices,
  children,
}: {
  kicker: string;
  name: string;
  tagline: string;
  prices: { label: string; value: ReactNode; tone?: "good" | "bad" }[];
  children: ReactNode;
}) {
  return (
    <Reveal>
      <article className="eos-product">
        <p className="eos-product-kicker">{kicker}</p>
        <h3 className="eos-product-name">{name}</h3>
        <p className="eos-product-tagline">{tagline}</p>
        <dl className="eos-pricegrid" data-cols={prices.length === 2 ? "2" : undefined}>
          {prices.map((p) => (
            <div className="eos-pricechip" data-tone={p.tone} key={p.label}>
              <dt>{p.label}</dt>
              <dd>{p.value}</dd>
            </div>
          ))}
        </dl>
        {children}
      </article>
    </Reveal>
  );
}

function Testimonial({ quote, source }: { quote: string; source: string }) {
  return (
    <blockquote className="eos-testimonial">
      <p>&ldquo;{quote}&rdquo;</p>
      <cite>({source})</cite>
    </blockquote>
  );
}

/**
 * SECTION 4: FEATURED PRODUCTS. Copy verbatim from the spec. The spec's
 * "(The Evidence Engine)" parenthetical on Product 1 and the "Evidence
 * Engine" wording inside the Product 4 testimonial are replaced with the
 * Optimal Policy Generator naming per the spec's own binding
 * "WHAT IS NOT ON THIS PAGE" list ("No 'Evidence Engine' naming").
 */
export function FeaturedProducts() {
  return (
    <section className="eos-section eos-r2" id="products">
      <div className="eos-container">
        <Reveal className="eos-catalog-head">
          <p className="eos-eyebrow">Section 4</p>
          <h2 className="eos-catalog-title">The Standard Package</h2>
        </Reveal>

        <Reveal>
          <div className="eos-prose" style={{ maxWidth: "72ch", margin: "0 auto" }}>
            <p>
              The decentralized TODO list for humanity is the product. The root
              task is Optimize Earth. Everything below is a subtask. Each task
              has a calculated expected value in health and wealth. You can fund
              any task (pledge money; it executes when enough people commit,
              like a group purchase) or do it yourself.
            </p>
            <p>
              Every civilization gets the same products. We tried offering
              customization. It turns out every planet has the same problems.
              They all think theirs are unique. They are not. The variables
              change. The dysfunction is identical.
            </p>
            <p>
              Each product replaces one government function with something that
              works. The code is included. The data is public. You build it.
            </p>
          </div>
        </Reveal>

        {/* ── PRODUCT 1: THE OPTIMITRON ─────────────────────── */}
        <Product
          kicker="Product 1"
          name="The Optimitron"
          tagline="The thermostat your government never installed."
          prices={[
            { label: "Replaces", value: "Governing by argument." },
            {
              label: "Retail price",
              value: "Included. The data is free.",
              tone: "good",
            },
            {
              label: "Currently paying",
              value: "Whatever your representatives' donors feel like.",
              tone: "bad",
            },
          ]}
        >
          <div className="eos-prose" style={{ marginTop: "1.75rem" }}>
            <p>
              Your planet has 10,000 jurisdictions, each trying slightly
              different policies. Some produce healthy, wealthy citizens.
              Others produce the opposite. Right now, you determine which is
              which by having politicians argue on television. The Optimal
              Policy Generator replaces the arguing with counting.
            </p>
            <p>
              It examines what every jurisdiction tried and what happened next.
              Synthetic controls, difference-in-differences, regression
              discontinuity. Not opinion. Not ideology. Measurement. Output:
              ENACT / REPLACE / REPEAL / MAINTAIN. Each recommendation scored on
              the two numbers.
            </p>
            <p>
              Its current highest-expected-value recommendation is the 1%
              Treaty: move 1% of every nation&apos;s weapons budget to clinical
              trials. Everyone cuts equally. Nobody is easier to invade. Disease
              eradication goes from{" "}
              <ParameterValue
                className={N}
                display="withUnit"
                param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
              />{" "}
              to{" "}
              <ParameterValue
                className={N}
                display="withUnit"
                param={DFDA_QUEUE_CLEARANCE_YEARS}
              />
              . The average treatment arrives{" "}
              <ParameterValue
                className={N}
                display="withUnit"
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
              <ParameterValue className={N} param={POST_WW2_MILITARY_CUT_PCT} />{" "}
              in two years and walked into the greatest economic expansion in
              history. One percent should be manageable.
            </p>
          </div>

          <TwoNumberDashboard />

          {/* Policy comparator: 4 example policies, click to expand.
              Row figures are the spec's own illustrative copy. */}
          <div style={{ marginTop: "0.5rem" }}>
            <details className="eos-expander">
              <summary>
                <span className="eos-expander-title">Tax code</span>
                <span className="eos-expander-sub">74,000 pages → 6 lines</span>
              </summary>
              <p className="eos-expander-body">
                74,000 pages → 6 lines. Filing cost per citizen: $1,200 → $0.
              </p>
            </details>
            <details className="eos-expander">
              <summary>
                <span className="eos-expander-title">Drug approval</span>
                <span className="eos-expander-sub">
                  14 years → pragmatic trials
                </span>
              </summary>
              <p className="eos-expander-body">
                14 years, $2.6 billion per drug → pragmatic trials, 90% cost
                reduction. 50 approvals/year → 200+.
              </p>
            </details>
            <details className="eos-expander">
              <summary>
                <span className="eos-expander-title">Welfare</span>
                <span className="eos-expander-sub">
                  80+ programs → one deposit
                </span>
              </summary>
              <p className="eos-expander-body">
                80+ programs, 95,000 administrators → single universal deposit,
                automatic.
              </p>
            </details>
            <details className="eos-expander">
              <summary>
                <span className="eos-expander-title">Clinical trials</span>
                <span className="eos-expander-sub">kill:cure ratio → funded</span>
              </summary>
              <p className="eos-expander-body">
                <ParameterValue
                  className={N}
                  display="withUnit"
                  param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
                />{" "}
                kill:cure ratio → 1% Treaty funds{" "}
                <ParameterValue className={N} param={TREATY_ANNUAL_FUNDING} />
                /year in trials.
              </p>
            </details>
          </div>

          <Testimonial
            quote="We spent 4,000 years debating education policy. The Optimal Policy Generator resolved it in an afternoon. Our main regret is the 4,000 years."
            source="Planet Keth-7, client since 8,000 BCE"
          />
        </Product>

        {/* ── PRODUCT 2: THE OPTIMAL BUDGET GENERATOR ───────── */}
        <Product
          kicker="Featured Product 2"
          name="The Optimal Budget Generator"
          tagline="The point where each additional dollar does less good than spending it somewhere else."
          prices={[
            { label: "Replaces", value: "Whatever the lobbyists negotiated." },
            { label: "Retail price", value: "Included.", tone: "good" },
            {
              label: "Currently paying",
              value: "Whatever the lobbyists negotiated.",
              tone: "bad",
            },
          ]}
        >
          <div className="eos-prose" style={{ marginTop: "1.75rem" }}>
            <p>
              The Optimal Budget Generator calculates the optimal spending level
              for every budget line in every jurisdiction on Earth: the point
              where each additional dollar produces less health or wealth than
              spending it somewhere else.
            </p>
            <p>
              The current largest misallocation: clinical trial funding sits at
              roughly 1% of its optimal level. The money that should be finding
              cures is sitting in the weapons budget, where it purchases the
              ability to end civilization{" "}
              <ParameterValue
                className={N}
                display="integer"
                param={NUCLEAR_WINTER_OVERKILL_FACTOR}
              />{" "}
              times. You can only end civilization once. The other{" "}
              <ParameterValue
                className={N}
                display="integer"
                param={NUCLEAR_WINTER_SPARE_APOCALYPSES}
              />{" "}
              endings are in storage, costing money, doing nothing.
            </p>
            <p>
              You do not need new money. You need to stop losing the money you
              have.
            </p>
            <p>
              Output: an optimal budget for every jurisdiction on Earth, updated
              continuously, scored on the two numbers. Hand it to a lobbyist.
              The lobbyist hands it to Congress. The math does the selling.
            </p>
          </div>

          <div className="eos-datacards" data-cols="5" style={{ marginTop: "2rem" }}>
            <div className="eos-datacard">
              <div className="eos-datacard-value">
                <ParameterValue param={TREATY_ANNUAL_FUNDING} presentation="inline" />
                /year
              </div>
              <div className="eos-datacard-label">1% Treaty annual funding</div>
            </div>
            <div className="eos-datacard">
              <div className="eos-datacard-value">
                <ParameterValue
                  display="withUnit"
                  param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
                  presentation="inline"
                />
              </div>
              <div className="eos-datacard-label">Trial capacity increase</div>
            </div>
            <div className="eos-datacard">
              <div className="eos-datacard-value">
                <ParameterValue
                  display="integer"
                  param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
                  presentation="inline"
                />
                {" → "}
                <ParameterValue
                  display="integer"
                  param={DFDA_QUEUE_CLEARANCE_YEARS}
                  presentation="inline"
                />{" "}
                yrs
              </div>
              <div className="eos-datacard-label">Disease queue</div>
            </div>
            <div className="eos-datacard">
              <div className="eos-datacard-value">
                <ParameterValue
                  display="withUnit"
                  param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS}
                  presentation="inline"
                />
              </div>
              <div className="eos-datacard-label">
                Average treatment arrives sooner
              </div>
            </div>
            <div className="eos-datacard">
              <div className="eos-datacard-value">
                <ParameterValue
                  param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED}
                  presentation="inline"
                />
              </div>
              <div className="eos-datacard-label">Lives saved</div>
            </div>
          </div>

          <div className="eos-prose" style={{ marginTop: "2rem" }}>
            <p>
              The percentage can go up. It never goes down. The treaty creates a
              class of wealthy humans (bondholders) whose bank accounts grow
              every time a war ends, a disease is eradicated, or a child who
              would have died gets to grow up. For the first time in history,
              the absence of war and disease is more profitable than their
              existence.
            </p>
          </div>

          <Testimonial
            quote="We kept 11,000 warheads for 200 years after we only needed 50. Then we moved 1% to clinical trials and cured our last disease in 22 years. The warheads did not notice they were missing."
            source="The Yennari Collective, optimized 340 years ago"
          />

          <div style={{ marginTop: "1.75rem", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            <Link className="eos-btn" href={ROUTES.treaty}>
              Read the full treaty text
            </Link>
            <a
              className="eos-btn eos-btn-solid"
              href="https://warondisease.org"
              rel="noopener noreferrer"
              target="_blank"
            >
              Sign the Treaty at warondisease.org
            </a>
          </div>
        </Product>

        {/* ── PRODUCT 3: THE DECENTRALIZED TODO LIST ────────── */}
        <Product
          kicker="Featured Product 3"
          name="The Decentralized TODO List for Humanity"
          tagline="Every task ranked by expected value in health and wealth. Yours is in here."
          prices={[
            { label: "Replaces", value: "Nobody is doing this." },
            {
              label: "Retail price",
              value: "Free to use. Pays to complete.",
              tone: "good",
            },
            {
              label: "Currently paying",
              value: "Nobody is doing this.",
              tone: "bad",
            },
          ]}
        >
          <div className="eos-prose" style={{ marginTop: "1.75rem" }}>
            <p>
              Every product in this catalog produces tasks. The 1% Treaty needs
              signatures. The Decentralized FDA needs trial participants. The
              Wishocracy needs votes. The code needs engineers. The campaigns
              need organizers. Right now, these tasks are scattered across
              websites, inboxes, and good intentions. Nobody knows which task
              has the highest expected value or who could complete it at the
              lowest cost.
            </p>
            <p>
              The TODO list computes both. It calculates the expected value of
              every action (signatures, code contributions, trial enrollment,
              lobbying visits, social shares) in health and wealth, and
              identifies the lowest-cost actor for each one. Your doctor is the
              lowest-cost actor for enrolling patients. Your senator&apos;s
              constituent is the lowest-cost actor for a lobbying visit. You are
              the lowest-cost actor for something, and the machine knows what it
              is.
            </p>
            <p>
              If you sign up, you get your own subtask: Optimize [Your
              Name]&apos;s Life. If you add your organization, it gets one too:
              Optimize [Your Organization]. These nest under the root. The whole
              thing is one tree, from &ldquo;Optimize Earth&rdquo; down to
              &ldquo;take your medication.&rdquo;
            </p>
            <p>
              In the long run, governments become irrelevant. AI agents execute
              the TODO list directly. The optimal policies and budgets get
              implemented because the math is public and the agents do not need
              to be lobbied. Until then, we lobby.
            </p>
          </div>

          {/* Terminal readout: the spec's illustrative "real day".
              allow-hardcoded: spec-verbatim example list, not parameters. */}
          <div className="eos-terminal" style={{ marginTop: "2rem" }}>
            <div className="eos-terminal-title">
              optimize-earth · ranked by expected value
            </div>
            {[
              ["1.", "Sign the 1% Treaty publicly", "(36 seconds)", "EV: $4,200"],
              ["2.", "Share this page with 3 contacts", "(2 minutes)", "EV: $890"],
              [
                "3.",
                "Take night meds",
                "(30 seconds)",
                "EV: $12 (health maintenance)",
              ],
              [
                "4.",
                "Apply for the Survival and Flourishing Fund grant",
                "(2.5h)",
                "EV: $47,000",
              ],
              [
                "5.",
                "File shareholder proposal at [company]",
                "(4h)",
                "EV: $2.1M",
              ],
              [
                "6.",
                "Enroll 10 patients in depression outcome tracking",
                "(1h)",
                "EV: $34,000",
              ],
            ].map(([rank, task, time, ev]) => (
              <div className="eos-term-row" key={rank}>
                <span className="eos-term-rank">{rank}</span>
                <span className="eos-term-task">{task}</span>
                <span className="eos-term-time">{time}</span>
                <span className="eos-term-ev">{ev}</span>
              </div>
            ))}
          </div>

          <div className="eos-prose" style={{ marginTop: "1.5rem" }}>
            <p>
              Every task has a price, a time estimate, and a person best
              positioned to do it. The TODO list is live at optimitron.com/tasks.
            </p>
          </div>

          <div style={{ marginTop: "1.75rem" }}>
            <Link className="eos-btn eos-btn-solid" href={ROUTES.tasks}>
              Browse the TODO list
            </Link>
          </div>
        </Product>

        {/* ── PRODUCT 4: THE LOVING TAKEOVER ────────────────── */}
        <Product
          kicker="Featured Product 4"
          name="The Loving Takeover"
          tagline="Buy the companies that control your government. Hand their lobbyists an optimal budget."
          prices={[
            {
              label: "Replaces",
              value: "Moral persuasion (9,000 years, zero results).",
            },
            {
              label: "Retail price",
              value: (
                <>
                  <ParameterValue
                    param={DEFENSE_TAKEOVER_COST_TOTAL}
                    presentation="inline"
                  />{" "}
                  for the full takeover.
                </>
              ),
              tone: "good",
            },
            {
              label: "You receive",
              value:
                "Voting shares in the companies whose lobbying writes your laws.",
            },
          ]}
        >
          <div className="eos-prose" style={{ marginTop: "1.75rem" }}>
            <p>
              The companies that build your weapons are, by any rational
              accounting, bad at being companies. They pay their best engineers
              to shrink the economy they sell into. Their shareholders get the
              same diseases as everyone else. Their CEO&apos;s mother has
              Parkinson&apos;s, and there is no trial because the money that
              would have funded it is currently a missile. They are spending
              money to make themselves poorer, sicker, and eventually dead. This
              is not an adversary. This is a company in need of better
              management.
            </p>
            <p>
              You buy shares. Shares come with voting rights. Voting rights let
              you hand the lobbyists an optimal budget calculated by the Optimal
              Budget Generator to maximize health and wealth. The engineers
              switch from guidance systems to surgical robots. Same math. Fewer
              craters. The shareholders get appreciation in a{" "}
              <ParameterValue
                className={N}
                display="withUnit"
                param={TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15}
              />
              -larger economy. The CEO&apos;s mother gets her Parkinson&apos;s
              trial. The lobbyists get a raise. Nobody loses anything. The
              previous arrangement was losing money for everyone in it
              simultaneously, which is harder than it sounds.
            </p>
          </div>

          <div className="eos-panel-soft" style={{ marginTop: "2rem" }}>
            <p className="eos-eyebrow" style={{ marginBottom: "0.75rem" }}>
              Proof of concept
            </p>
            <div className="eos-prose">
              <p>
                In 2021, twelve people with $12.5 million and 0.02% of
                ExxonMobil won three seats on its board. Vanguard and BlackRock,
                who own roughly 60%, voted with them. The argument was: your
                strategy is destroying the value of the people who own this
                company. Board seats across the military-industrial complex cost{" "}
                <ParameterValue
                  className={N}
                  param={DEFENSE_TAKEOVER_COST_ACTIVIST}
                />{" "}
                (
                <ParameterValue
                  className={N}
                  figures={2}
                  param={DEFENSE_TAKEOVER_COST_ACTIVIST_PCT_INVESTABLE_ASSETS}
                />{" "}
                of the money invested on Earth).
              </p>
            </div>
          </div>

          <blockquote
            className="eos-pivot-q"
            style={{
              marginTop: "2.5rem",
              marginBottom: "0.5rem",
              fontSize: "clamp(1.3rem, 3vw, 2rem)",
              textAlign: "center",
            }}
          >
            We tried moral persuasion for 9,000 years. Then we tried paying
            them. Took six months.
          </blockquote>

          <TransformationCards />

          <Testimonial
            quote="We spent 4,000 years debating education policy. The Optimal Policy Generator resolved it in an afternoon. Our main regret is the 4,000 years."
            source="Planet Keth-7, client since 8,000 BCE"
          />
        </Product>

        {/* ── PRODUCT 5: THE WISHOCRACY ─────────────────────── */}
        <Product
          kicker="Featured Product 5"
          name="The Wishocracy"
          tagline="Ask-the-audience, not phone-a-friend."
          prices={[
            {
              label: "Replaces",
              value: "535 purchased intermediaries and their donors.",
            },
            { label: "Retail price", value: "Free.", tone: "good" },
            {
              label: "Currently paying",
              value: (
                <>
                  <ParameterValue
                    figures={2}
                    param={US_TOTAL_LOBBYING_ANNUAL}
                    presentation="inline"
                  />
                  /year in lobbying, plus whatever the laws the donors write
                  afterward cost you.
                </>
              ),
              tone: "bad",
            },
          ]}
        >
          <div className="eos-prose" style={{ marginTop: "1.75rem" }}>
            <p>
              Your current system: you elect representatives. The
              representatives are purchased by industries. The industries write
              the laws. The laws benefit the industries. You pay for this. You
              call it &ldquo;democracy.&rdquo; On my planet, we call it an odd
              thing to volunteer for.
            </p>
            <p>
              On <em>Who Wants to Be a Millionaire</em>, the studio audience
              picked the right answer{" "}
              <ParameterValue
                className={N}
                figures={2}
                param={CROWD_DECISION_ACCURACY}
              />{" "}
              of the time. The expert?{" "}
              <ParameterValue
                className={N}
                figures={2}
                param={EXPERT_DECISION_ACCURACY}
              />
              . Your entire government is phone-a-friend. This is
              ask-the-audience.
            </p>
          </div>

          <div style={{ marginTop: "2rem" }}>
            <BudgetSlider />
          </div>

          <div className="eos-prose" style={{ marginTop: "2rem" }}>
            <p>
              Eighty percent of treaty funds go through the Wishocracy and
              cannot be touched by any individual. The other twenty percent goes
              through traditional channels and will be partially stolen. This is
              budgeted for. It is still cheaper than what you have now, where
              the percentage stolen is higher and also classified.
            </p>
          </div>

          <div className="eos-table-scroll" style={{ marginTop: "2rem" }}>
            <table className="eos-table">
              <thead>
                <tr>
                  <th />
                  <th>Phone-a-Friend (Congress)</th>
                  <th>Ask-the-Audience (Wishocracy)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Accuracy</td>
                  <td>
                    <ParameterValue
                      figures={2}
                      param={EXPERT_DECISION_ACCURACY}
                      presentation="inline"
                    />
                  </td>
                  <td>
                    <ParameterValue
                      figures={2}
                      param={CROWD_DECISION_ACCURACY}
                      presentation="inline"
                    />
                  </td>
                </tr>
                <tr>
                  <td>Cost</td>
                  <td>
                    <ParameterValue
                      figures={2}
                      param={US_TOTAL_LOBBYING_ANNUAL}
                      presentation="inline"
                    />
                    /yr in lobbying
                  </td>
                  <td>$0</td>
                </tr>
                <tr>
                  <td>Corruptible</td>
                  <td>Yes</td>
                  <td>No door. You cannot take 8 billion people to lunch.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Testimonial
            quote="Our representatives argued about healthcare allocation for 60 years. We switched to direct allocation. The citizens funded the same research the representatives had been blocking. The representatives became life coaches. The career transition was seamless."
            source="Long-term client, Local Group"
          />
        </Product>
      </div>
    </section>
  );
}
