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
  EFFICACY_LAG_YEARS,
  GLOBAL_DESTRUCTIVE_ECONOMY_PCT_GDP,
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
import { AGENCIES } from "@optimitron/data/datasets/wishonia-agencies";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { AgencyBooths } from "@/components/eos-retro/AgencyBooths";
import { BudgetFrontierExhibit } from "@/components/eos-retro/BudgetFrontierExhibit";
import { CollapseClock } from "@/components/eos-retro/CollapseClock";
import { DeathCounter } from "@/components/eos-retro/DeathCounter";
import { DfdaOutcomeLabel } from "@/components/eos-retro/DfdaOutcomeLabel";
import { FourEarthsChart } from "@/components/eos-retro/FourEarthsChart";
import { HumanityManagerQueue } from "@/components/eos-retro/HumanityManagerQueue";
import { MachineDiagram } from "@/components/eos-retro/MachineDiagram";
import { OptimizedDayTimeline } from "@/components/eos-retro/OptimizedDayTimeline";
import { PolicyGradeTable } from "@/components/eos-retro/PolicyGradeTable";
import { Starfield } from "@/components/eos-retro/Starfield";
import { WishocracyBooth } from "@/components/eos-retro/WishocracyBooth";
import { agenciesLink, ROUTES, wishocracyLink } from "@/lib/routes";
import "./eos-retro.css";

const righteous = Righteous({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-eos-display",
});

const PITCH_URL =
  "https://manual.warondisease.org/knowledge/economics/eos-pitch.html";
const STUDIES_URL = "https://studies.dfda.earth";
const AUDIT_URL = "/dysfunction-tax";

function Section({
  children,
  id,
  title,
  deck,
}: {
  children: ReactNode;
  id: string;
  title: string;
  deck?: ReactNode;
}) {
  return (
    <section className="er-section" id={id}>
      <div className="er-container">
        <h2 className="er-display text-4xl sm:text-5xl md:text-6xl">{title}</h2>
        {deck ? <p className="er-body mt-5 max-w-3xl text-lg">{deck}</p> : null}
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

function Exhibit({
  children,
  id,
  letter,
  title,
  intro,
  stepInsideHref,
  stepInsideLabel,
}: {
  children: ReactNode;
  id: string;
  letter: string;
  title: string;
  intro?: ReactNode;
  stepInsideHref: string;
  stepInsideLabel: string;
}) {
  return (
    <div className="er-exhibit" id={id}>
      <h3 className="er-exhibit-title">
        Exhibit {letter} · <em>{title}</em>
      </h3>
      {intro ? <p className="er-body mt-4 max-w-3xl">{intro}</p> : null}
      <div className="mt-6">{children}</div>
      <p className="mt-6">
        <Link className="er-link er-mono text-sm" href={stepInsideHref}>
          {stepInsideLabel}
        </Link>
      </p>
    </div>
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
      <p className="er-caption mt-3">{label}</p>
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
    <svg aria-hidden="true" className="er-atom h-14 w-14" viewBox="0 0 64 64">
      <g fill="none" stroke="var(--er-cream-muted)" strokeWidth="1.2">
        <ellipse cx="32" cy="32" rx="28" ry="11" />
        <ellipse cx="32" cy="32" rx="28" ry="11" transform="rotate(60 32 32)" />
        <ellipse
          cx="32"
          cy="32"
          rx="28"
          ry="11"
          transform="rotate(120 32 32)"
        />
      </g>
      <circle cx="32" cy="32" fill="var(--er-gold)" r="3.5" />
      <circle cx="60" cy="32" fill="var(--er-cyan)" r="2" />
      <circle cx="18" cy="8" fill="var(--er-orange)" r="2" />
    </svg>
  );
}

const PAVILIONS = [
  {
    emoji: AGENCIES.dcbo.emoji,
    name: AGENCIES.dcbo.dName,
    desc: AGENCIES.dcbo.tagline,
    anchor: "#exhibit-opg",
  },
  {
    emoji: AGENCIES.domb.emoji,
    name: AGENCIES.domb.dName,
    desc: AGENCIES.domb.tagline,
    anchor: "#exhibit-obg",
  },
  {
    emoji: wishocracyLink.emoji ?? "🗳️",
    name: wishocracyLink.label,
    desc: wishocracyLink.tagline ?? "",
    anchor: "#exhibit-wishocracy",
  },
  {
    emoji: AGENCIES.dfda.emoji,
    name: AGENCIES.dfda.dName,
    desc: AGENCIES.dfda.tagline,
    anchor: "#exhibit-dfda",
  },
  {
    emoji: agenciesLink.emoji ?? "🏛️",
    name: "The Department Store",
    desc: agenciesLink.tagline ?? "",
    anchor: "#exhibit-agencies",
  },
  {
    emoji: "🧠",
    name: "The Human Optimization System",
    desc: "The same engine, pointed at one human: you.",
    anchor: "#exhibit-you",
  },
];

export function EosRetroLandingPage() {
  return (
    <div className={`eos-retro ${righteous.variable}`}>
      <DeathCounter />

      {/* ── 1 · Hero ─────────────────────────────────────────── */}
      <header className="er-hero">
        <Starfield />
        <div className="er-container relative flex flex-1 flex-col">
          <div
            className="flex items-center justify-between gap-4 border-b py-5"
            style={{ borderColor: "var(--er-line)" }}
          >
            <p className="er-kicker">Earth Optimization Services</p>
            <AtomOrnament />
          </div>

          <div className="flex flex-1 flex-col justify-center py-8">
            <h1
              className="er-display er-hero-headline max-w-5xl"
              style={{ fontSize: "clamp(2.1rem, 5vw, 4rem)" }}
            >
              Live on a planet without <em>war</em> and <strong>disease</strong>
              .
            </h1>
            <p className="er-body mt-6 max-w-2xl text-lg">
              Now accepting applications. Earth Optimization Services has
              upgraded over 300 planets. Yours is next.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a className="er-btn er-btn-solid" href="#exhibits">
                Tour the machine
              </a>
            </div>
          </div>

          <p className="pb-6 text-center">
            <a
              aria-label="Continue to the exhibits"
              className="er-down"
              href="#exhibits"
            >
              ▼
            </a>
          </p>
        </div>
      </header>

      {/* ── 2 · The Exhibits ─────────────────────────────────── */}
      <Section
        deck="Six pavilions from the government of the future, running on real data. Pick a booth or walk the hall in order. The gift shop comes at the end, as is traditional."
        id="exhibits"
        title="The exhibits"
      >
        <div className="er-pavilion-grid">
          {PAVILIONS.map((p) => (
            <a className="er-pavilion" href={p.anchor} key={p.anchor}>
              <div aria-hidden="true" className="er-pavilion-emoji">
                {p.emoji}
              </div>
              <div className="er-pavilion-name">{p.name}</div>
              <div className="er-pavilion-desc">{p.desc}</div>
            </a>
          ))}
        </div>

        <Exhibit
          id="exhibit-opg"
          intro={AGENCIES.dcbo.wishoniaQuote}
          letter="A"
          stepInsideHref={ROUTES.opg}
          stepInsideLabel="Step inside the Policy Generator"
          title="Laws graded like homework"
        >
          <PolicyGradeTable />
        </Exhibit>

        <Exhibit
          id="exhibit-obg"
          intro={AGENCIES.domb.wishoniaQuote}
          letter="B"
          stepInsideHref={ROUTES.obg}
          stepInsideLabel="Step inside the Budget Generator"
          title="The budget, solved like an equation"
        >
          <BudgetFrontierExhibit />
        </Exhibit>

        <Exhibit
          id="exhibit-wishocracy"
          intro="Your legislature allocates your money by seniority and donor gratitude. Wishocracy asks the eight billion owners instead: two options, one handle. This booth is live. Drag it."
          letter="C"
          stepInsideHref={ROUTES.vote}
          stepInsideLabel="Step inside and cast the vote that counts"
          title="The ninety-second legislature"
        >
          <WishocracyBooth />
        </Exhibit>

        <Exhibit
          id="exhibit-dfda"
          intro={
            <>
              Earth&apos;s current system makes a treatment wait{" "}
              <ParameterValue figures={2} param={EFFICACY_LAG_YEARS} /> years
              after it is proven safe. Just sitting there. Being safe. The
              replacement is a label that updates as fast as the data arrives.
            </>
          }
          letter="D"
          stepInsideHref={ROUTES.dfda}
          stepInsideLabel="Step inside the Decentralized FDA"
          title="Medicine without the waiting room"
        >
          <DfdaOutcomeLabel />
        </Exhibit>

        <Exhibit
          id="exhibit-agencies"
          intro="Every federal agency you have heard of, rebuilt as code you can read in one sitting. Each booth shows what the old way costs and the lines that replace it."
          letter="E"
          stepInsideHref={ROUTES.agencies}
          stepInsideLabel="Step inside the department store"
          title="The department store"
        >
          <AgencyBooths />
        </Exhibit>

        <div className="er-exhibit" id="exhibit-you">
          <h3 className="er-exhibit-title">
            Exhibit F · <em>The Human Optimization System</em>
          </h3>
          <p className="er-body mt-4 max-w-3xl">
            The same engine, pointed at one human: you.
          </p>
          <div className="mt-6 grid gap-10 lg:grid-cols-2">
            <HumanityManagerQueue />
            <div>
              <p className="er-body text-lg">
                Every human on Earth is a president of Earth Optimization
                Services. The machine computes your highest-value next action,
                from taking your medication to redirecting{" "}
                <ParameterValue param={TREATY_ANNUAL_FUNDING} />, with the same
                arithmetic. It is running today. Connect any AI assistant to the
                MCP server and ask it what you should do next.
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
          </div>
        </div>
      </Section>

      {/* ── 3 · A Day in the Optimized Life ──────────────────── */}
      <section className="er-section er-day" id="day">
        <div className="er-container">
          <h2 className="er-day-title text-4xl sm:text-5xl md:text-6xl">
            A day in the optimized life
          </h2>
          <p className="er-day-deck mt-5 max-w-3xl">
            Year twelve after the upgrade. An ordinary Tuesday.
          </p>
          <div className="mt-10">
            <OptimizedDayTimeline />
          </div>
        </div>
      </section>

      {/* ── 4a · The Collapse Clock ──────────────────────────── */}
      <Section
        deck="You have now seen the future on offer. Here is the schedule if you decline."
        id="collapse"
        title="The collapse clock"
      >
        <CollapseClock />
      </Section>

      {/* ── 4b · The Political Dysfunction Tax ───────────────── */}
      <Section id="the-tax" title="The political dysfunction tax">
        <div className="er-giant">
          <ParameterValue
            param={POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL}
          />
          <span style={{ fontSize: "0.32em", color: "var(--er-cream-muted)" }}>
            /year
          </span>
        </div>
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
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <StatCard
            color="var(--er-cyan)"
            label="Your share, per person"
            sub="Withheld annually. No statement mailed."
            value={
              <ParameterValue
                param={POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL}
              />
            }
          />
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
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-6">
          <Link className="er-link er-mono text-sm" href={AUDIT_URL}>
            Read the full forensic audit
          </Link>
          <p className="er-mono text-sm" style={{ color: "var(--er-gold)" }}>
            The good news: miscalibration is fixable. That is what calibration
            means.
          </p>
        </div>
      </Section>

      {/* ── 5 · Someone Already Ran The Experiment ───────────── */}
      <Section
        deck="The machine making you poorer and deader is publicly traded. Twelve people already proved you can buy the controls."
        id="experiment"
        title="Someone already ran the experiment"
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="er-panel er-ticked h-full p-7">
            <p className="er-card-title">Engine No. 1 · 2021</p>
            <p className="er-body mt-4 text-lg">
              In 2021, twelve people with <strong>$12.5 million</strong> and{" "}
              <strong>0.02%</strong> of{" "}
              {/* // allow-hardcoded: Engine No. 1 historical facts (WSJ, May 2021), one-off citation */}
              ExxonMobil won <strong>three seats</strong> on its board. Vanguard
              and BlackRock, who own roughly <strong>60%</strong>, voted with
              them. The argument was: your strategy is destroying the value of
              the people who own this company.
            </p>
          </div>
          <div className="er-panel-soft h-full p-7">
            <p className="er-card-title">What laws cost, retail</p>
            <div className="er-pricelist mt-4">
              <PriceRow
                label="Military policy, bought annually"
                value={<ParameterValue param={DEFENSE_LOBBYING_ANNUAL} />}
              />
              <PriceRow
                label="All of it: every sector, every committee"
                value={
                  <>
                    <ParameterValue
                      figures={2}
                      param={US_TOTAL_LOBBYING_ANNUAL}
                    />
                    /yr
                  </>
                }
              />
              <PriceRow
                label="Board seats across the military-industrial complex"
                value={
                  <ParameterValue param={DEFENSE_TAKEOVER_COST_ACTIVIST} />
                }
              />
            </div>
            <p className="er-body mt-4 text-sm">
              That last number is{" "}
              <ParameterValue
                figures={2}
                param={DEFENSE_TAKEOVER_COST_ACTIVIST_PCT_INVESTABLE_ASSETS}
              />{" "}
              of the money on Earth. These numbers buy your laws. They are also,
              in capital markets terms, very small numbers.
            </p>
          </div>
        </div>
        <p className="er-body mt-10 max-w-3xl text-lg">
          Warren Buffett got rich doing one boring thing repeatedly: buy a badly
          managed company cheap, install better management, pocket the gap. This
          is the same trade, run on governance instead of management, against
          the whole economy instead of one company. BlackRock and Vanguard own
          both sides of every trade on the market, so they only make money when
          the entire economy grows, and the thing that decides how fast the
          economy grows is governance. Show them the arithmetic and their votes
          arrive with it.{" "}
          <strong>
            You are not picking winners. You are fixing the room they all sit
            in.
          </strong>
        </p>
        <blockquote
          className="er-display mx-auto mt-14 max-w-4xl text-center text-2xl sm:text-3xl"
          style={{ color: "var(--er-gold)" }}
        >
          We tried moral persuasion for 9,000 years. Then we tried paying them.
          Took six months.
        </blockquote>
      </Section>

      {/* ── 5b · The Machine ─────────────────────────────────── */}
      <Section
        deck="Left to right: your money becomes better laws. The return conveyor at the bottom is what makes it a machine and not a charity."
        id="machine"
        title="Money goes in. Better laws come out."
      >
        <MachineDiagram />
        <div className="er-body mt-10 grid max-w-5xl gap-x-10 gap-y-6 text-base md:grid-cols-2">
          <p>
            Your money buys shares of the companies whose lobbying writes the
            budget. The floor is: you own real companies with real earnings,
            bought at market price.
          </p>
          <p>
            Shares become board seats: letters the board is legally required to
            read, votes the index funds are legally required to cast in their
            portfolio&apos;s interest.
          </p>
          <p>
            Board seats redirect the lobbying. The pitch to Lockheed&apos;s
            board is not disarmament. It is: make the same weapons, sell them to
            the same government, and stop needing a war to justify the invoice.
          </p>
          <p>
            Redirected lobbying changes policy. Better policy grows the economy,
            and a bigger economy makes every share worth more, including yours.
            The machine funds its own next turn. You kick it once.
          </p>
        </div>
      </Section>

      {/* ── 6 · Your Money, Twenty Years, Four Ways ──────────── */}
      <Section
        id="four-earths"
        title="Type your net worth. Watch twenty years happen to it."
      >
        <div className="er-panel p-5 sm:p-8">
          <FourEarthsChart />
        </div>
        <p className="er-body mt-8 max-w-3xl">
          The red line is not a prophecy. It is the current trend line,
          extended, using growth rates already measured: the destructive economy
          runs at <ParameterValue param={GLOBAL_DESTRUCTIVE_ECONOMY_PCT_GDP} />{" "}
          of world output today and crosses 35% around{" "}
          <ParameterValue
            display="integer"
            param={DESTRUCTIVE_ECONOMY_35PCT_YEAR}
          />
          . Whole-Earth output at 2045:{" "}
          <ParameterValue param={CURRENT_TRAJECTORY_GDP_YEAR_20} /> if the luck
          holds, <ParameterValue param={TREATY_TRAJECTORY_GDP_YEAR_20} /> with
          the 1% redirect,{" "}
          <ParameterValue param={WISHONIA_TRAJECTORY_GDP_YEAR_20} /> once the
          stupidity stops.
        </p>
        <p className="er-mono mt-6 text-sm" style={{ color: "var(--er-gold)" }}>
          Every decision is locally sensible. The aggregate output does not have
          to be extinction.
        </p>
      </Section>

      {/* ── 7 · The Deal ─────────────────────────────────────── */}
      <Section id="the-deal" title="The deal: get rich fixing the room">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <p className="er-body text-lg">
              Earth Optimization Services Inc. is a Delaware public benefit
              corporation. Investors receive non-voting equity: a share of the
              profit, never the steering wheel.
            </p>
            <p className="er-body">
              Concentrated power has a terrible track record. Every genocide and
              every unjust war was started by a small group that had the power
              to start one; none was ever started by a public vote. So the
              decisions here get made one civic vote per human, and those votes
              are not for sale. You cannot buy the steering wheel, no matter how
              many shares you own.
            </p>
            <div className="er-panel-soft p-6">
              <p className="er-card-title">The floor</p>
              <p className="er-body mt-3">
                Part of every dollar buys shares of public companies at market
                price. Part funds the campaign that makes them worth more. The
                floor is the portfolio: real companies, real earnings, dividend
                histories through every war and recession in living memory. The
                exact split lives in the offering documents.
              </p>
            </div>
            <div className="er-panel-soft p-6">
              <p className="er-card-title">The upside</p>
              <p className="er-body mt-3">
                Win one board fight and three things happen: the stock goes up,
                which funds the next fight; the redirected lobbying gets better
                policy passed, which grows the whole economy; and a bigger
                economy makes every company worth more, including the ones
                already in the portfolio. Each feeds the other two. The model
                pricing all of it is public.
              </p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="er-panel er-ticked p-6">
              <p className="er-card-title">The arithmetic</p>
              <div className="er-pricelist mt-3">
                <PriceRow
                  label="Total campaign cost, worst case"
                  value={
                    <ParameterValue
                      figures={1}
                      param={TREATY_CAMPAIGN_TOTAL_COST}
                    />
                  }
                />
                <PriceRow
                  label="Unlocked every year the treaty holds"
                  value={<ParameterValue param={TREATY_ANNUAL_FUNDING} />}
                />
                <PriceRow
                  label="Trial capacity per research dollar"
                  value={
                    <ParameterValue
                      display="withUnit"
                      param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
                    />
                  }
                />
                <PriceRow
                  label="Return, trial savings alone"
                  value={
                    <>
                      <ParameterValue
                        display="integer"
                        param={DFDA_ROI_RD_ONLY}
                      />
                      x
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
            <p
              className="er-body text-sm"
              style={{ color: "var(--er-cream-muted)" }}
            >
              All returns are projections from a published model, not
              guarantees. The model, its 670 parameters, and every derivation
              chain are public. Equity is illiquid until an exit or listing; do
              not invest money you need. Full terms are in the offering
              documents.
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
        </div>
      </Section>

      {/* ── 8 · Your Move ────────────────────────────────────── */}
      <Section id="your-move" title="Your move">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="er-panel er-ticked flex h-full flex-col p-6">
            <p className="er-card-title">Invest</p>
            <p className="er-body mt-3 flex-1">
              Non-voting equity in the machine you just toured.
            </p>
            <a className="er-btn mt-6" href="#the-deal">
              Reread the deal
            </a>
          </div>
          <div className="er-panel er-ticked flex h-full flex-col p-6">
            <p className="er-card-title">Build</p>
            <p className="er-body mt-3 flex-1">
              Every module needs engineers, researchers, lawyers, organizers.
              The Earth Optimization Prize pays cash for completed work.
            </p>
            <Link className="er-btn mt-6" href={ROUTES.tasks}>
              Claim a task
            </Link>
          </div>
          <div className="er-panel er-ticked flex h-full flex-col p-6">
            <p className="er-card-title">Spread</p>
            <p className="er-body mt-3 flex-1">
              You have a phone. Every person who sees this page brings the
              timeline forward.
            </p>
            <Link className="er-btn mt-6" href={ROUTES.vote}>
              Vote, then share it
            </Link>
          </div>
        </div>
      </Section>

      {/* ── Footer closer ────────────────────────────────────── */}
      <footer className="er-section">
        <div className="er-container text-center">
          <p className="er-body mx-auto max-w-2xl text-lg">
            The disease coming for someone you love almost certainly has no cure
            yet. This is how one gets found.
          </p>
          <p
            className="er-body mx-auto mt-6 max-w-2xl text-sm"
            style={{ color: "var(--er-cream-muted)" }}
          >
            I love you very much and I do not want you and everyone you have
            ever loved to be slowly tortured and brutally murdered by horrible
            diseases.
          </p>
          <p className="er-kicker mt-12">
            Earth Optimization Services · A Wishonia production · Your
            application was accepted at birth
          </p>
        </div>
      </footer>
    </div>
  );
}
