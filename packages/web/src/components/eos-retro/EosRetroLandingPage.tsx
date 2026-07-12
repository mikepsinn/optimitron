import { Righteous } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  CURRENT_TRAJECTORY_GDP_YEAR_20,
  DEFENSE_LOBBYING_ANNUAL,
  DEFENSE_TAKEOVER_COST_ACTIVIST,
  DEFENSE_TAKEOVER_COST_ACTIVIST_PCT_INVESTABLE_ASSETS,
  DESTRUCTIVE_ECONOMY_35PCT_YEAR,
  DFDA_ROI_RD_ONLY,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  GLOBAL_DESTRUCTIVE_ECONOMY_PCT_GDP,
  GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  POLITICAL_DYSFUNCTION_GLOBAL_EFFICIENCY_SCORE,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL,
  TREATY_ANNUAL_FUNDING,
  TREATY_CAMPAIGN_TOTAL_COST,
  TREATY_ROI_EXISTING_DRUGS_ONLY,
  TREATY_TRAJECTORY_GDP_YEAR_20,
  US_TOTAL_LOBBYING_ANNUAL,
  WISHONIA_TRAJECTORY_GDP_YEAR_20,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { DeathCounter } from "@/components/eos-retro/DeathCounter";
import { FlywheelDiagram } from "@/components/eos-retro/FlywheelDiagram";
import { FourEarthsChart } from "@/components/eos-retro/FourEarthsChart";
import { HumanityManagerQueue } from "@/components/eos-retro/HumanityManagerQueue";
import { Reveal } from "@/components/eos-retro/Reveal";
import { Starfield } from "@/components/eos-retro/Starfield";
import { ROUTES } from "@/lib/routes";
import "./eos-retro.css";

const righteous = Righteous({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-eos-display",
});

const PITCH_URL = "https://manual.warondisease.org/knowledge/economics/eos-pitch.html";
const STUDIES_URL = "https://studies.dfda.earth";
const AUDIT_URL = "/dysfunction-tax";

function Section({
  children,
  id,
  kicker,
  title,
  deck,
}: {
  children: ReactNode;
  id: string;
  kicker: string;
  title: string;
  deck?: ReactNode;
}) {
  return (
    <section className="er-section" id={id}>
      <div className="er-container">
        <Reveal>
          <p className="er-kicker">{kicker}</p>
          <h2 className="er-display mt-4 text-4xl sm:text-5xl md:text-6xl">
            {title}
          </h2>
          {deck ? (
            <p className="er-body mt-5 max-w-3xl text-lg">{deck}</p>
          ) : null}
        </Reveal>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

function StatCard({
  value,
  label,
  sub,
  color,
}: {
  value: ReactNode;
  label: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="er-panel er-ticked p-6">
      <div className="er-stat-value" style={{ color }}>
        {value}
      </div>
      <p className="er-kicker mt-3">{label}</p>
      <p className="er-body mt-2 text-sm">{sub}</p>
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="er-price-row">
      <span className="er-body">{label}</span>
      <span aria-hidden="true" className="er-price-dots" />
      <span
        className="er-mono text-right font-bold"
        style={{ color: "var(--er-gold)" }}
      >
        {value}
      </span>
    </div>
  );
}

function AtomOrnament() {
  return (
    <svg
      aria-hidden="true"
      className="er-atom h-14 w-14"
      viewBox="0 0 64 64"
    >
      <g fill="none" stroke="var(--er-cream-muted)" strokeWidth="1.2">
        <ellipse cx="32" cy="32" rx="28" ry="11" />
        <ellipse cx="32" cy="32" rx="28" ry="11" transform="rotate(60 32 32)" />
        <ellipse cx="32" cy="32" rx="28" ry="11" transform="rotate(120 32 32)" />
      </g>
      <circle cx="32" cy="32" fill="var(--er-gold)" r="3.5" />
      <circle cx="60" cy="32" fill="var(--er-cyan)" r="2" />
      <circle cx="18" cy="8" fill="var(--er-orange)" r="2" />
    </svg>
  );
}

export function EosRetroLandingPage() {
  return (
    <div className={`eos-retro ${righteous.variable}`}>
      <DeathCounter />

      {/* ── 1 · Hero ─────────────────────────────────────────── */}
      <header className="er-hero">
        <Starfield />
        <div className="er-container relative flex flex-1 flex-col">
          <div className="flex items-center justify-between gap-4 border-b py-5" style={{ borderColor: "var(--er-line)" }}>
            <p className="er-kicker">Earth Optimization Services</p>
            <AtomOrnament />
          </div>

          <div className="flex flex-1 flex-col justify-center py-8">
            <p className="er-kicker">A civilization upgrade, presented by Wishonia</p>
            <h1
              className="er-display er-hero-headline mt-5 max-w-5xl"
              style={{ fontSize: "clamp(2.1rem, 5vw, 4rem)" }}
            >
              Buy the machine that&apos;s making you <em>poorer and deader</em>.
              Reprogram it to make you <strong>healthier and wealthier</strong>.
            </h1>
            <p className="er-body mt-6 max-w-2xl text-lg">
              Earth Optimization Services has been upgrading civilizations
              since before your sun ignited. Over 300 planets optimized. Yours
              is next.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a className="er-btn er-btn-solid" href="#the-tax">
                See what you&apos;re buying
              </a>
              <a className="er-btn" href="#the-deal">
                I have money and want to help
              </a>
            </div>
          </div>

          <p className="er-kicker pb-6 text-center">
            ▼ The tour takes 4 minutes. The status quo takes{" "}
            <ParameterValue
              param={POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL}
              presentation="inline"
            />{" "}
            a year.
          </p>
        </div>
      </header>

      {/* ── 2 · The Political Dysfunction Tax ────────────────── */}
      <Section id="the-tax" kicker="Pavilion 01 · The invoice" title="The political dysfunction tax">
        <Reveal>
          <div className="er-giant">
            <ParameterValue
              param={POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL}
            />
            <span style={{ fontSize: "0.32em", color: "var(--er-cream-muted)" }}>
              /year
            </span>
          </div>
        </Reveal>
        <Reveal delayMs={100}>
          <p className="er-body mt-8 max-w-3xl text-lg">
            This is not the national debt. This is not the deficit. This is the
            annual cost of having a government that optimizes for the wrong
            things. It spends{" "}
            <ParameterValue
              display="integer"
              param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
            />
            x more on the capacity to kill people than on the research to save
            them. Not taken from you in taxes. Taken from you in a future that
            doesn&apos;t arrive.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <Reveal delayMs={0}>
            <StatCard
              color="var(--er-cyan)"
              label="Your share, per person"
              sub="Withheld annually. No statement mailed."
              value={
                <ParameterValue param={POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL} />
              }
            />
          </Reveal>
          <Reveal delayMs={120}>
            <StatCard
              color="var(--er-orange)"
              label="Value per dollar of government"
              sub="A vending machine at this hit rate gets unplugged."
              value={
                <ParameterValue
                  param={POLITICAL_DYSFUNCTION_GLOBAL_EFFICIENCY_SCORE}
                  valueOverride="52 cents"
                />
              }
            />
          </Reveal>
          <Reveal delayMs={240}>
            <StatCard
              color="var(--er-gold)"
              label="Kill capacity vs. cure testing"
              sub="Dollars spent on weapons capacity for every government dollar testing cures."
              value={
                <>
                  <ParameterValue
                    display="integer"
                    param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
                  />
                  :1
                </>
              }
            />
          </Reveal>
        </div>
        <Reveal>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-6">
            <Link className="er-link er-mono text-sm" href={AUDIT_URL}>
              Read the full forensic audit
            </Link>
            <p className="er-mono text-sm" style={{ color: "var(--er-gold)" }}>
              The good news: miscalibration is fixable. That is what
              calibration means.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* ── 3 · Someone Already Ran The Experiment ───────────── */}
      <Section
        id="experiment"
        kicker="Pavilion 02 · The precedent"
        title="Someone already ran the experiment"
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="er-panel er-ticked h-full p-7">
              <p className="er-kicker">Engine No. 1 · 2021</p>
              <p className="er-body mt-4 text-lg">
                In 2021, twelve people with{" "}
                <strong>$12.5 million</strong> and <strong>0.02%</strong> of
                ExxonMobil won <strong>three seats</strong> on its board.
                Vanguard and BlackRock, who own roughly{" "}
                <strong>60%</strong>, voted with them. The argument was: your
                strategy is destroying the value of the people who own this
                company.
              </p>
            </div>
          </Reveal>
          <Reveal delayMs={120}>
            <div className="er-panel-soft h-full p-7">
              <p className="er-kicker">The rate card</p>
              <div className="er-pricelist mt-4">
                <PriceRow
                  label="Military policy, bought annually"
                  value={<ParameterValue param={DEFENSE_LOBBYING_ANNUAL} />}
                />
                <PriceRow
                  label="All of it: every sector, every committee"
                  value={
                    <>
                      <ParameterValue figures={2} param={US_TOTAL_LOBBYING_ANNUAL} />
                      /yr
                    </>
                  }
                />
                <PriceRow
                  label="Board seats across the military-industrial complex"
                  value={<ParameterValue param={DEFENSE_TAKEOVER_COST_ACTIVIST} />}
                />
              </div>
              <p className="er-body mt-4 text-sm">
                That last number is{" "}
                <ParameterValue
                  figures={2}
                  param={DEFENSE_TAKEOVER_COST_ACTIVIST_PCT_INVESTABLE_ASSETS}
                />{" "}
                of the money on Earth. These numbers buy your laws. They are
                also, in capital markets terms, very small numbers.
              </p>
            </div>
          </Reveal>
        </div>
        <Reveal>
          <p className="er-body mt-10 max-w-3xl text-lg">
            Warren Buffett got rich doing one boring thing repeatedly: buy a
            badly managed company cheap, install better management, pocket the
            gap. This is the same trade, run on governance instead of
            management, against the whole economy instead of one company.
            BlackRock and Vanguard own both sides of every trade on the
            market, so they only make money when the entire economy grows, and
            the thing that decides how fast the economy grows is governance.
            Show them the arithmetic and their votes arrive with it.{" "}
            <strong>
              You are not picking winners. You are fixing the room they all
              sit in.
            </strong>
          </p>
        </Reveal>
        <Reveal>
          <blockquote
            className="er-display mx-auto mt-14 max-w-4xl text-center text-2xl sm:text-3xl"
            style={{ color: "var(--er-gold)" }}
          >
            We tried moral persuasion for 9,000 years. Then we tried paying
            them. Took six months.
          </blockquote>
        </Reveal>
      </Section>

      {/* ── 4 · Four Earths ──────────────────────────────────── */}
      <Section
        deck={
          <>
            Everyone knows the government is bad. Nobody has priced the upside
            of it being better. Below: the four Earths on offer, priced in
            your money. Prefilled with Earth&apos;s median after-tax income,{" "}
            <ParameterValue figures={4} param={GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025} />{" "}
            a year. If that looks low to you, congratulations: you are ahead
            of 4 billion people.
          </>
        }
        id="four-earths"
        kicker="Pavilion 03 · Please select an Earth"
        title="Four Earths"
      >
        <Reveal>
          <div className="er-panel p-5 sm:p-8">
            <FourEarthsChart />
          </div>
        </Reveal>
        <Reveal>
          <p className="er-body mt-8 max-w-3xl">
            The red line is not a prophecy. It is the current trend line,
            extended, using growth rates already measured: the destructive
            economy runs at{" "}
            <ParameterValue param={GLOBAL_DESTRUCTIVE_ECONOMY_PCT_GDP} /> of
            world output today and crosses 35% around{" "}
            <ParameterValue display="integer" param={DESTRUCTIVE_ECONOMY_35PCT_YEAR} />
            . Whole-Earth output at 2045:{" "}
            <ParameterValue param={CURRENT_TRAJECTORY_GDP_YEAR_20} /> if the
            luck holds, <ParameterValue param={TREATY_TRAJECTORY_GDP_YEAR_20} />{" "}
            with the 1% redirect,{" "}
            <ParameterValue param={WISHONIA_TRAJECTORY_GDP_YEAR_20} /> once the
            stupidity stops.
          </p>
          <p
            className="er-mono mt-6 text-sm"
            style={{ color: "var(--er-gold)" }}
          >
            Every decision is locally sensible. The aggregate output does not
            have to be extinction.
          </p>
        </Reveal>
      </Section>

      {/* ── 5 · The Machine ──────────────────────────────────── */}
      <Section id="machine" kicker="Pavilion 04 · The flywheel" title="The machine">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <FlywheelDiagram />
          </Reveal>
          <Reveal delayMs={120}>
            <ol className="er-body space-y-6 text-base">
              <li>
                <span className="er-mono" style={{ color: "var(--er-gold)" }}>
                  01
                </span>{" "}
                Your money buys shares of the companies whose lobbying writes
                the budget. The floor is: you own real companies with real
                earnings, bought at market price.
              </li>
              <li>
                <span className="er-mono" style={{ color: "var(--er-gold)" }}>
                  02
                </span>{" "}
                Shares become board seats: letters the board is legally
                required to read, votes the index funds are legally required
                to cast in their portfolio&apos;s interest.
              </li>
              <li>
                <span className="er-mono" style={{ color: "var(--er-gold)" }}>
                  03
                </span>{" "}
                Board seats redirect the lobbying. The pitch to
                Lockheed&apos;s board is not disarmament. It is: make the same
                weapons, sell them to the same government, and stop needing a
                war to justify the invoice.
              </li>
              <li>
                <span className="er-mono" style={{ color: "var(--er-gold)" }}>
                  04
                </span>{" "}
                Redirected lobbying changes policy. Changed policy improves
                outcomes: health up, income up, economy bigger.
              </li>
              <li>
                <span className="er-mono" style={{ color: "var(--er-gold)" }}>
                  05
                </span>{" "}
                A bigger economy makes every share worth more, including
                yours. The wheel funds its own next turn. You kick it once.
              </li>
            </ol>
          </Reveal>
        </div>
      </Section>

      {/* ── 6 · Your Humanity Manager ────────────────────────── */}
      <Section
        deck="The same engine that reallocates government budgets runs a human day."
        id="manager"
        kicker="Pavilion 05 · Proof of life"
        title="Your humanity manager"
      >
        <div className="grid gap-10 lg:grid-cols-2">
          <Reveal>
            <HumanityManagerQueue />
          </Reveal>
          <Reveal delayMs={120}>
            <div>
              <p className="er-body text-lg">
                Every human on Earth is a president of Earth Optimization
                Services. The machine computes your highest-value next action,
                from taking your medication to redirecting{" "}
                <ParameterValue param={TREATY_ANNUAL_FUNDING} />, with the same
                arithmetic. It is running today. Connect any AI assistant to
                the MCP server and ask it what you should do next.
              </p>
              <p className="er-body mt-6">
                The health engine already generated outcome labels from 12
                million datapoints contributed by 10,000 people. The rankings
                are public at{" "}
                <a
                  className="er-link"
                  href={STUDIES_URL}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  studies.dfda.earth
                </a>
                .
              </p>
              <div className="mt-8">
                <Link className="er-btn" href={ROUTES.mcp}>
                  Ask the machine what to do next
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ── 7 · The Deal ─────────────────────────────────────── */}
      <Section id="the-deal" kicker="Pavilion 06 · The paperwork" title="The deal">
        <div className="grid gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="space-y-6">
              <p className="er-body text-lg">
                Earth Optimization Services Inc is a Delaware public benefit
                corporation. Investors receive non-voting equity: a share of
                the profit, never the steering wheel.
              </p>
              <p className="er-body">
                Concentrated power has a terrible track record. Every genocide
                and every unjust war was started by a small group that had the
                power to start one; none was ever started by a public vote. So
                the decisions here get made one civic vote per human, and
                those votes are not for sale. You cannot buy the steering
                wheel, no matter how many shares you own.
              </p>
              <div className="er-panel-soft p-6">
                <p className="er-kicker">The floor</p>
                <p className="er-body mt-3">
                  Part of every dollar buys shares of public companies at
                  market price. Part funds the campaign that makes them worth
                  more. The floor is the portfolio: real companies, real
                  earnings, dividend histories through every war and recession
                  in living memory. The exact split lives in the offering
                  documents.
                </p>
              </div>
              <div className="er-panel-soft p-6">
                <p className="er-kicker">The upside</p>
                <p className="er-body mt-3">
                  Win one board fight and three things happen: the stock goes
                  up, which funds the next fight; the redirected lobbying gets
                  better policy passed, which grows the whole economy; and a
                  bigger economy makes every company worth more, including the
                  ones already in the portfolio. Each feeds the other two. The
                  model pricing all of it is public.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delayMs={120}>
            <div className="space-y-6">
              <div className="er-panel er-ticked p-6">
                <p className="er-kicker">What the first money buys</p>
                <div className="er-pricelist mt-3">
                  <PriceRow label="Proof budget: form the company, buy the first positions, send the first letters" value="$500K" />
                  <PriceRow label="Target: 18 to 24 months of lean runway and the first campaign proof" value="$1M" />
                  <PriceRow label="Oxygen: reserve, cleaner compliance, parallel campaigns" value="$2M" />
                </div>
                <p className="er-body mt-3 text-sm">
                  Not, under any circumstances, a head office with a water
                  feature.
                </p>
              </div>
              <div className="er-panel er-ticked p-6">
                <p className="er-kicker">The arithmetic</p>
                <div className="er-pricelist mt-3">
                  <PriceRow
                    label="Total campaign cost, worst case"
                    value={<ParameterValue figures={1} param={TREATY_CAMPAIGN_TOTAL_COST} />}
                  />
                  <PriceRow
                    label="Unlocked every year the treaty holds"
                    value={<ParameterValue param={TREATY_ANNUAL_FUNDING} />}
                  />
                  <PriceRow
                    label="Trial capacity per research dollar"
                    value={<ParameterValue display="withUnit" param={DFDA_TRIAL_CAPACITY_MULTIPLIER} />}
                  />
                  <PriceRow
                    label="Return, trial savings alone"
                    value={
                      <>
                        <ParameterValue display="integer" param={DFDA_ROI_RD_ONLY} />x
                      </>
                    }
                  />
                  <PriceRow
                    label="Return, existing drugs alone"
                    value={
                      <>
                        <ParameterValue param={TREATY_ROI_EXISTING_DRUGS_ONLY} />
                        :1
                      </>
                    }
                  />
                </div>
              </div>
              <p className="er-body text-sm" style={{ color: "var(--er-cream-muted)" }}>
                All returns are projections from a published model, not
                guarantees. The model, its 670 parameters, and every
                derivation chain are public. Equity is illiquid until an exit
                or listing; do not invest money you need. Full terms are in
                the offering documents.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link className="er-btn er-btn-solid" href={ROUTES.fund}>
                  Request the offering documents
                </Link>
                <a
                  className="er-link er-mono text-sm"
                  href={PITCH_URL}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Who the hell is telling you all this →
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ── 8 · Your Move ────────────────────────────────────── */}
      <Section id="your-move" kicker="Pavilion 07 · Choose one of three" title="Your move">
        <div className="grid gap-5 md:grid-cols-3">
          <Reveal>
            <div className="er-panel er-ticked flex h-full flex-col p-6">
              <p className="er-kicker">Invest</p>
              <p className="er-body mt-3 flex-1">
                Non-voting equity in the machine you just toured. The deal is
                one pavilion up.
              </p>
              <a className="er-btn mt-6" href="#the-deal">
                Reread the deal
              </a>
            </div>
          </Reveal>
          <Reveal delayMs={120}>
            <div className="er-panel er-ticked flex h-full flex-col p-6">
              <p className="er-kicker">Build</p>
              <p className="er-body mt-3 flex-1">
                Every module needs engineers, researchers, lawyers,
                organizers. The Earth Optimization Prize pays cash for
                completed work.
              </p>
              <Link className="er-btn mt-6" href={ROUTES.tasks}>
                Claim a task
              </Link>
            </div>
          </Reveal>
          <Reveal delayMs={240}>
            <div className="er-panel er-ticked flex h-full flex-col p-6">
              <p className="er-kicker">Spread</p>
              <p className="er-body mt-3 flex-1">
                You have a phone. Every person who sees this page brings the
                timeline forward.
              </p>
              <Link className="er-btn mt-6" href={ROUTES.vote}>
                Vote, then share it
              </Link>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ── Footer closer ────────────────────────────────────── */}
      <footer className="er-section">
        <div className="er-container text-center">
          <Reveal>
            <p className="er-body mx-auto max-w-2xl text-lg">
              The disease coming for someone you love almost certainly has no
              cure yet. This is how one gets found.
            </p>
            <p
              className="er-body mx-auto mt-6 max-w-2xl text-sm"
              style={{ color: "var(--er-cream-muted)" }}
            >
              I love you very much and I do not want you and everyone you have
              ever loved to be slowly tortured and brutally murdered by
              horrible diseases.
            </p>
            <p className="er-kicker mt-12">
              Earth Optimization Services · A Wishonia production · Your
              application was accepted at birth
            </p>
          </Reveal>
        </div>
      </footer>
    </div>
  );
}
