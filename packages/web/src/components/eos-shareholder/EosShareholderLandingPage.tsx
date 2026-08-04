import {
  ANNUAL_TERRORISM_DEATH_RISK_DENOMINATOR,
  DEFENSE_TAKEOVER_COST_ACTIVIST_PCT_INVESTABLE_ASSETS,
  GLOBAL_POPULATION_2024,
  GLOBAL_WARHEAD_COUNT,
  INFLUENCE_ACTIVIST_STAKE_FRACTION,
  NUCLEAR_WINTER_WARHEAD_THRESHOLD,
} from "@optimitron/data/parameters";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  OwnershipLoop,
  StatusQuoEvidence,
} from "@/components/eos-shareholder/EosEvidenceVisuals";
import { EosScenarioExplorer } from "@/components/eos-shareholder/EosScenarioExplorer";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { defaultButtonClassName } from "@/components/ui/default-button";
import { ROUTES } from "@/lib/routes";

const sectionClassName = "border-t border-foreground";
const sectionInnerClassName =
  "mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24";
const eyebrowClassName =
  "text-xs font-black uppercase tracking-[0.18em] text-muted-foreground";
const sectionHeadingClassName =
  "mt-4 max-w-4xl text-4xl font-black leading-[0.95] tracking-[-0.04em] sm:text-6xl";
const bodyClassName = "text-base font-semibold leading-8 sm:text-lg";
const mutedBodyClassName = `${bodyClassName} text-muted-foreground`;

function ArrowItem({ children }: { children: ReactNode }) {
  return (
    <li className="grid grid-cols-[1.25rem_1fr] gap-2">
      <span aria-hidden="true" className="font-black">
        →
      </span>
      <span>{children}</span>
    </li>
  );
}

function RiskBlock({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="grid gap-5 border-t-2 border-foreground py-8 md:grid-cols-[7rem_1fr] md:gap-10">
      <p
        aria-hidden="true"
        className="font-mono text-6xl font-black leading-none text-muted-foreground"
      >
        {number}
      </p>
      <div>
        <h3 className="text-2xl font-black tracking-tight sm:text-3xl">
          {title}
        </h3>
        <div className={`mt-4 max-w-3xl space-y-4 ${mutedBodyClassName}`}>
          {children}
        </div>
      </div>
    </article>
  );
}

function ShareClass({
  id,
  label,
  title,
  children,
}: {
  id: string;
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <article
      className="scroll-mt-8 border-t-2 border-foreground py-8 first:border-t-0 first:pt-0 lg:border-l-2 lg:border-t-0 lg:px-8 lg:py-0 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0"
      id={id}
    >
      <p className={eyebrowClassName}>{label}</p>
      <h3 className="mt-3 text-3xl font-black tracking-tight">{title}</h3>
      <div className={`mt-5 space-y-4 ${mutedBodyClassName}`}>{children}</div>
    </article>
  );
}

export function EosShareholderLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-foreground">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-foreground pb-5">
            <p className={eyebrowClassName}>Earth Optimization Services</p>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.12em]">
              Shareholder thesis / Earth
            </p>
          </div>

          <div className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end lg:py-20">
            <div>
              <h1 className="max-w-5xl text-5xl font-black leading-[0.88] tracking-[-0.055em] sm:text-7xl lg:text-[6.4rem]">
                Your planet may be eligible for optimization.
              </h1>
            </div>
            <p className="border-l-2 border-foreground pl-5 text-sm font-bold leading-6">
              A shareholder case for making governments spend less on ending
              civilization and more on keeping their employers alive.
            </p>
          </div>

          <nav
            aria-label="Choose how you want to participate"
            className="grid border-y-2 border-foreground md:grid-cols-2"
          >
            <a
              className="group grid min-h-40 gap-5 p-6 hover:bg-foreground hover:text-background md:border-r-2 md:border-foreground"
              href="#class-a"
            >
              <span className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground group-hover:text-background/65">
                Citizen / planned Class A
              </span>
              <span className="self-end text-3xl font-black tracking-tight">
                Help govern it. <span aria-hidden="true">↓</span>
              </span>
            </a>
            <a
              className="group grid min-h-40 gap-5 border-t-2 border-foreground p-6 hover:bg-foreground hover:text-background md:border-t-0"
              href="#class-b"
            >
              <span className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground group-hover:text-background/65">
                Investor / planned Class B
              </span>
              <span className="self-end text-3xl font-black tracking-tight">
                Evaluate the economic thesis. <span aria-hidden="true">↓</span>
              </span>
            </a>
          </nav>
        </div>
      </header>

      <StatusQuoEvidence />

      <section>
        <div className={sectionInnerClassName}>
          <p className={eyebrowClassName}>What we optimize</p>
          <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
            <div className="space-y-6">
              <p className="text-3xl font-black leading-tight tracking-[-0.025em] sm:text-5xl">
                Earth Optimization Services buys shares in the companies that
                influence your government, then uses evidence and shareholder
                power to push public policy toward the general welfare.
              </p>
              <p className={mutedBodyClassName}>
                The scientific target is deliberately boring enough to measure
                and important enough to organize a civilization around.
              </p>
            </div>
            <ol className="border-y-2 border-foreground text-xl font-black">
              <li className="border-b border-foreground py-6">
                <span className="mr-3 font-mono text-sm text-muted-foreground">
                  01
                </span>
                Maximize median health-adjusted life expectancy.
              </li>
              <li className="py-6">
                <span className="mr-3 font-mono text-sm text-muted-foreground">
                  02
                </span>
                Maximize median after-tax, inflation-adjusted income.
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className={sectionClassName} id="shareholder-case">
        <div className={sectionInnerClassName}>
          <p className={eyebrowClassName}>The universal-owner problem</p>
          <h2 className={sectionHeadingClassName}>
            A dead planet is bad for the portfolio.
          </h2>
          <div className={`mt-8 max-w-3xl space-y-5 ${mutedBodyClassName}`}>
            <p>
              The people who quietly own the world&apos;s balance sheet are not
              governments. They are the giant asset managers and index funds
              behind retirement accounts and major corporate boards.
            </p>
            <p>
              Fidelity, Vanguard, and their peers are universal owners: they
              hold a slice of almost every major company. Their fiduciary job is
              to maximize long-term returns. Governments that overspend on
              weapons and underspend on survival expose those portfolios to
              three enormous, mostly unpriced risks.
            </p>
          </div>

          <OwnershipLoop />

          <details className="mt-10 border-2 border-foreground">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-5 p-5 text-lg font-black uppercase tracking-[0.06em] marker:hidden hover:bg-foreground hover:text-background [&::-webkit-details-marker]:hidden">
              Read the three portfolio risks
              <span aria-hidden="true" className="font-mono text-2xl">
                +
              </span>
            </summary>
            <div className="border-t-2 border-foreground px-5">
              <RiskBlock number="01" title="Nuclear apocalypse risk">
                <p>
                  It takes roughly{" "}
                  <ParameterValue
                    param={NUCLEAR_WINTER_WARHEAD_THRESHOLD}
                    valueOverride="100 nuclear weapons"
                  />{" "}
                  to trigger a regional-scale nuclear winter severe enough to
                  collapse the global food system. Humanity has{" "}
                  <ParameterValue
                    param={GLOBAL_WARHEAD_COUNT}
                    valueOverride="12,241"
                  />
                  .
                </p>
                <p className="text-foreground">
                  In that scenario, every stock, bond, and real-estate holding
                  on Earth is worth the same amount: zero. There is no
                  diversification against a dead planet. Preventing nuclear war
                  is the most basic hedge a rational shareholder can buy.
                </p>
              </RiskBlock>

              <RiskBlock
                number="02"
                title="Systemic drag from preventable disease"
              >
                <p>
                  Chronic and infectious diseases impose direct healthcare costs
                  and massive indirect costs through lost productivity and
                  shortened lives. Disease will eventually kill nearly every
                  human; the annual risk of dying from terrorism is about one in{" "}
                  <ParameterValue
                    param={ANNUAL_TERRORISM_DEATH_RISK_DENOMINATOR}
                    valueOverride="30 million"
                  />
                  .
                </p>
                <p>
                  For owners of the whole market, every dollar burned on
                  avoidable healthcare, every worker pushed out of the labor
                  force, and every cure left untested reduces long-run output
                  and long-run returns.
                </p>
                <ul className="space-y-2 text-foreground">
                  <ArrowItem>Reduce healthcare burdens.</ArrowItem>
                  <ArrowItem>Expand the healthy workforce.</ArrowItem>
                  <ArrowItem>
                    Compound global output and innovation for decades.
                  </ArrowItem>
                </ul>
                <p className="text-foreground">
                  That is good business for anyone who owns everything.
                </p>
              </RiskBlock>

              <RiskBlock number="03" title="Misallocated trillions">
                <p>
                  When governments sink tens of trillions into mass-murder
                  capacity instead of resilience, research, infrastructure, and
                  human capital, they are effectively shorting the future cash
                  flows of the companies these funds own.
                </p>
                <p className="text-foreground">That is a bad investment.</p>
              </RiskBlock>
            </div>
          </details>
        </div>
      </section>

      <section className="border-t border-foreground bg-foreground text-background">
        <div className={sectionInnerClassName}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-background/65">
            The correction
          </p>
          <h2 className="mt-4 max-w-5xl text-4xl font-black leading-[0.95] tracking-[-0.04em] sm:text-6xl">
            This is not charity. It is portfolio optimization at the level of
            the planet.
          </h2>
          <p className="mt-8 max-w-3xl text-lg font-semibold leading-8 text-background/75">
            Earth Optimization Services coordinates strategically significant
            stakes across key companies. The model estimates that taking{" "}
            <ParameterValue
              className="text-background decoration-background/40"
              param={INFLUENCE_ACTIVIST_STAKE_FRACTION}
              presentation="inline"
              valueOverride="5%"
            />{" "}
            activist stakes across major Western defense companies would use
            only about{" "}
            <ParameterValue
              className="text-background decoration-background/40"
              figures={2}
              param={DEFENSE_TAKEOVER_COST_ACTIVIST_PCT_INVESTABLE_ASSETS}
              presentation="inline"
            />{" "}
            of global investable assets. Influence comes from the argument and
            coordinated votes—not pretending one small fund owns the economy.
          </p>

          <ul className="mt-10 grid border-y border-background/45 md:grid-cols-3">
            <li className="py-6 md:border-r md:border-background/45 md:pr-6">
              <p className="font-mono text-xs font-bold text-background/55">
                01 / ORGANIZE
              </p>
              <p className="mt-3 text-lg font-black leading-7">
                Unite shareholders around one thesis: long-term GDP, health, and
                civilizational stability maximize long-term returns.
              </p>
            </li>
            <li className="border-t border-background/45 py-6 md:border-r md:border-t-0 md:px-6">
              <p className="font-mono text-xs font-bold text-background/55">
                02 / MOVE
              </p>
              <p className="mt-3 text-lg font-black leading-7">
                Push boards to redirect lobbying, capital expenditure, and
                R&amp;D from civilization-scale risks toward cures, resilience,
                and safety.
              </p>
            </li>
            <li className="border-t border-background/45 py-6 md:border-t-0 md:pl-6">
              <p className="font-mono text-xs font-bold text-background/55">
                03 / PROVE
              </p>
              <p className="mt-3 text-lg font-black leading-7">
                Publish a transparent Optimitron that quantifies which budgets
                and policies produce the most health and median income per
                dollar.
              </p>
            </li>
          </ul>
        </div>
      </section>

      <section className={sectionClassName} id="governance">
        <div className={sectionInnerClassName}>
          <p className={eyebrowClassName}>Planned governance and investment</p>
          <h2 className={sectionHeadingClassName}>
            You are the President of Earth Optimization Services.
          </h2>
          <p className={`mt-8 max-w-3xl ${mutedBodyClassName}`}>
            Because you are probably very busy, you also have approximately{" "}
            <ParameterValue
              param={GLOBAL_POPULATION_2024}
              valueOverride="eight billion"
            />{" "}
            Assistant Presidents—every participating citizen on Earth. Every
            person who joins steps into governance, not merely another product
            account. The design goal is the largest, most participatory company
            in human history.
          </p>

          <div className="mt-14 grid gap-8 border-y-2 border-foreground py-10 lg:grid-cols-2 lg:gap-0">
            <ShareClass
              id="class-a"
              label="Planned / one human / one vote"
              title="Class A Voting Shares"
            >
              <p>
                Earth Optimization Services plans to issue one Class A voting
                share as a free gift to each participating human. Class A is for
                governance, not economic preference.
              </p>
              <p className="text-foreground">
                EOS plans to require one act before the share activates:
                complete your first wishocratic allocation in Wishonia. Your
                first allocation is proof of intent—make one concrete resource
                choice before your voting power goes live.
              </p>
              <ol className="grid border-y border-foreground text-sm font-black sm:grid-cols-3">
                <li className="py-3 sm:border-r sm:border-foreground sm:pr-3">
                  1. Sign up
                </li>
                <li className="border-t border-foreground py-3 sm:border-r sm:border-t-0 sm:border-foreground sm:px-3">
                  2. Allocate
                </li>
                <li className="border-t border-foreground py-3 sm:border-t-0 sm:pl-3">
                  3. Vote
                </li>
              </ol>
              <Link className={defaultButtonClassName} href={ROUTES.wishocracy}>
                Make your first allocation
              </Link>
            </ShareClass>

            <ShareClass
              id="class-b"
              label="Economics / no governance"
              title="Class B Economic Shares"
            >
              <p>
                Earth Optimization Services plans to issue Class B shares
                without governance power. They are intended to capture economic
                returns through diversified positions in companies whose
                lobbying, campaign finance, and regulatory influence shape
                public policy.
              </p>
              <p className="text-foreground">
                Think mutual fund or ETF mechanics, pointed deliberately at the
                firms capable of changing the incentives around government.
              </p>
              <Link className={defaultButtonClassName} href={ROUTES.fund}>
                Review investment information
              </Link>
            </ShareClass>
          </div>

          <p className="mt-6 border border-foreground p-4 text-xs font-black uppercase leading-5 tracking-[0.08em]">
            EOS plans to issue these shares. This page explains the intended
            structure; it is not a current public offering or investment advice.
            Securities can lose value. Accredited investors can request formal
            materials on the funding page.
          </p>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className={sectionInnerClassName}>
          <p className={eyebrowClassName}>Risk / reward profile</p>
          <h2 className={sectionHeadingClassName}>
            The investment thesis does not require a campaign win. The upside
            begins if government gets less stupid.
          </h2>

          <div className="mt-10 grid border-y-2 border-foreground lg:grid-cols-2">
            <article className="py-7 lg:border-r-2 lg:border-foreground lg:pr-8">
              <p className={eyebrowClassName}>If EOS fails</p>
              <h3 className="mt-3 text-2xl font-black">
                The intended portfolio still owns companies.
              </h3>
              <p className={`mt-4 ${mutedBodyClassName}`}>
                It can underperform, lose value, or fail. Diversification is not
                a guarantee disguised as a downside case.
              </p>
            </article>
            <article className="border-t-2 border-foreground py-7 lg:border-t-0 lg:pl-8">
              <p className={eyebrowClassName}>If the thesis works</p>
              <h3 className="mt-3 text-2xl font-black">
                A healthier, harder-to-annihilate economy compounds.
              </h3>
              <Link
                className="mt-5 inline-block text-sm font-black uppercase underline decoration-2 underline-offset-4"
                href={ROUTES.treaty}
              >
                Read the 1% Treaty model
              </Link>
            </article>
          </div>

          <EosScenarioExplorer />
        </div>
      </section>

      <section className={sectionClassName} id="optimitron">
        <div className={sectionInnerClassName}>
          <p className={eyebrowClassName}>The Optimitron</p>
          <h2 className={sectionHeadingClassName}>
            Outcome-based governance. No ideology required.
          </h2>
          <p className={`mt-8 max-w-4xl ${mutedBodyClassName}`}>
            The Optimitron compares roughly a century of policy and budget
            experiments, simulates alternatives, and finds the configurations
            that produced the most health and median income per dollar. EOS then
            uses shareholder influence to put the best-supported choices into
            practice.
          </p>

          <div className="mt-12">
            <ol className="grid border-l border-t border-foreground sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  "01",
                  "Measure",
                  "Median healthy life expectancy and real after-tax income.",
                ],
                [
                  "02",
                  "Learn",
                  "Compare what changed those outcomes across place and time.",
                ],
                [
                  "03",
                  "Act",
                  "Use ownership and political influence on the best evidence.",
                ],
                [
                  "04",
                  "Improve",
                  "Measure the result, update the model, and run the loop again.",
                ],
              ].map(([number, title, body], index) => (
                <li
                  className="relative min-h-52 border-b border-r border-foreground p-5"
                  key={number}
                >
                  <span className="font-mono text-xs font-bold text-muted-foreground">
                    {number}
                  </span>
                  <span className="mt-10 block text-3xl font-black">
                    {title}
                  </span>
                  <span className="mt-4 block font-semibold leading-6 text-muted-foreground">
                    {body}
                  </span>
                  {index < 3 ? (
                    <span
                      aria-hidden="true"
                      className="absolute right-4 top-4 font-mono text-xl font-black"
                    >
                      →
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
            <p className="border-x border-b border-foreground px-5 py-4 text-center font-mono text-xs font-black uppercase tracking-[0.14em]">
              Real outcomes return to step 01 ↺
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-foreground bg-foreground text-background">
        <div className={sectionInnerClassName}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-background/65">
            Your governance share
          </p>
          <h2 className="mt-4 max-w-5xl text-4xl font-black leading-[0.95] tracking-[-0.04em] sm:text-6xl">
            Sign-up is a click. A governance share should require a choice.
          </h2>
          <p className="mt-7 max-w-3xl text-lg font-semibold leading-8 text-background/75">
            Complete your first wishocratic allocation to show how you want
            resources allocated. EOS plans for that act—not passive
            registration—to activate the Class A voting share.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-12 items-center justify-center border border-background bg-background px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-foreground hover:bg-foreground hover:text-background"
              href={ROUTES.wishocracy}
            >
              Make your first allocation
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center border border-background bg-foreground px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-background hover:bg-background hover:text-foreground"
              href={ROUTES.fund}
            >
              Review the economic thesis
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
