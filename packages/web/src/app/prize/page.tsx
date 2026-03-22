import type { Metadata } from "next";
import { Suspense } from "react";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { fmtParam } from "@/lib/format-parameter";
import {
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL,
  GLOBAL_DISEASE_DEATHS_DAILY,
  PRIZE_POOL_15YR_MULTIPLE,
  PRIZE_POOL_ANNUAL_RETURN,
} from "@/lib/parameters-calculations-citations";
import {
  earthOptimizationPrizePaperLink,
  contractsSourceLink,
  wishocracyLink,
  scoreboardLink,
} from "@/lib/routes";
import { VoterPrizeTreasuryDeposit } from "@/components/prize/VoterPrizeTreasuryDeposit";
import { CitizenDashboardWrapper } from "@/components/prize/CitizenDashboardWrapper";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "The Earth Optimization Game | Optimitron",
  description:
    "Redirect Earth's resources from the things making you poorest and deadest to the things that make you healthiest and wealthiest. The only way to lose is to not play.",
};

const dysfunctionTaxFormatted = fmtParam(POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL);
const deathsPerDayFormatted = fmtParam(GLOBAL_DISEASE_DEATHS_DAILY);
const poolMultiple = fmtParam(PRIZE_POOL_15YR_MULTIPLE);
const poolReturn = fmtParam(PRIZE_POOL_ANNUAL_RETURN);

const trustBadges = [
  { label: "Zero Team Allocation", detail: "100% to pool" },
  { label: "No Pre-Sale", detail: "Same price for everyone" },
  { label: "Fully On-Chain", detail: "Every tx auditable" },
  { label: "No Admin Keys", detail: "Contract controls distribution" },
  { label: "You Win Either Way", detail: `Fail: ~${poolMultiple} · Succeed: vote-proportional share` },
];

const mechanismSteps = [
  {
    number: 1,
    label: "Depositors Fund the Pool",
    description:
      `Deposit USDC into the VoterPrizeTreasury smart contract. Your principal goes into the Wishocratic fund (${poolReturn} annually). You get PRIZE shares — your claim on the pool. If the plan fails after 15 years, you claim principal + ~${poolMultiple} growth. Zero downside.`,
    detail: `Depositors also get a referral link. If they recruit voters, they earn VOTE points too — upside in BOTH outcomes. But depositing alone guarantees the ~${poolMultiple} floor.`,
    color: "bg-brutal-pink",
    textColor: "text-brutal-pink-foreground",
    subTextColor: "text-background",
    detailColor: "text-muted-foreground",
  },
  {
    number: 2,
    label: "Recruiters Prove Demand",
    description:
      "Anyone with a referral link can recruit. Share the link. Every person who verifies their support for the 1% Treaty through World ID is a verified vote attributed to you. You earn 1 VOTE point per verified voter. No deposit required.",
    detail: "World ID prevents duplicate votes. Each verified preference is on-chain. You're not selling anything — you're proving demand that already exists. The referral link attributes that proof to you.",
    color: "bg-brutal-yellow",
    textColor: "text-foreground",
    subTextColor: "text-foreground",
    detailColor: "text-muted-foreground",
  },
  {
    number: 3,
    label: "Outcomes Determine Payouts",
    description:
      `Thresholds met? VOTE holders claim proportional shares of the prize pool — the more voters you recruited, the bigger your cut. Thresholds not met after 15 years? PRIZE holders (depositors) claim principal + ~${poolMultiple} growth.`,
    detail: "Depositors win on failure (yield floor). Recruiters win on success (prize share). Depositors who also recruit win either way. The contract handles everything — no judges, no committees.",
    color: "bg-brutal-cyan",
    textColor: "text-foreground",
    subTextColor: "text-foreground",
    detailColor: "text-muted-foreground",
  },
];

const contractDetails = [
  {
    label: "Contract",
    value: "VoterPrizeTreasury.sol",
    detail: "Dominant assurance pool with Wishocratic fund yield and VOTE point rewards",
  },
  {
    label: "Health Metric",
    value: "Median Healthy Life Years",
    detail: "50% weight — verified by peer-reviewed study",
  },
  {
    label: "Income Metric",
    value: "Median Real After-Tax Income",
    detail: "50% weight — verified by quasi-experimental design",
  },
  {
    label: "Sybil Resistance",
    value: "World ID + Referral Links",
    detail: "One verified vote per person. VOTE points go to the referrer.",
  },
  {
    label: "Fail-Safe",
    value: "Dominant Assurance",
    detail: `15yr maturity. Thresholds not met = PRIZE holders claim principal + ~${poolMultiple} growth.`,
  },
];

export default function PrizePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Section 1: Hero */}
      <section className="mb-16">
        <div className="max-w-3xl space-y-5">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-brutal-pink">
            The Earth Optimization Game
          </p>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground">
            The Only Way to Lose Is to Not Play.
          </h1>
          <p className="text-lg text-foreground leading-relaxed font-bold">
            The objective: redirect Earth&apos;s resources from the things making
            you poorest and deadest to the things that make you healthiest and
            wealthiest. This is a dominant assurance contract — depositors
            cannot lose. Plan fails? ~{poolMultiple} back from {poolReturn} annual
            growth. Plan succeeds? VOTE point holders split the pool. Everyone&apos;s
            income increases by{" "}
            {`${fmtParam({...TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA, unit: "USD"})}–${fmtParam({...WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA, unit: "USD"})}`}{" "}
            per capita lifetime.
          </p>
          <p className="text-muted-foreground font-bold leading-relaxed mt-3">
            Two ways in. <strong>Have capital?</strong> Deposit USDC, get PRIZE
            shares, earn the yield floor. <strong>Have a network?</strong>{" "}
            Share a referral link, recruit verified voters for the 1% Treaty,
            earn VOTE points — one per verified voter. Prize share proportional
            to voters you brought in. No deposit required.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="border-4 border-primary bg-brutal-pink p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs font-black uppercase text-background mb-2">
                If the Plan Fails (Depositors)
              </div>
              <div className="text-xl font-black text-brutal-pink-foreground">
                ~{poolMultiple} Return
              </div>
              <p className="text-xs font-bold text-muted-foreground mt-1">
                Dominant assurance: your principal + 15 years of Wishocratic fund returns ({poolReturn} annually).
                You literally cannot lose money. The worst case
                is getting richer.
              </p>
            </div>
            <div className="border-4 border-primary bg-brutal-cyan p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs font-black uppercase text-muted-foreground mb-2">
                If the Plan Succeeds (Everyone)
              </div>
              <div className="text-xl font-black text-foreground">
                {fmtParam({...TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA, unit: "USD"})}+ Income Gain
              </div>
              <p className="text-xs font-bold text-muted-foreground mt-1">
                Everyone gets richer. Not metaphorically. The maths is very
                clear on this point. Recruiters also get a cut, because
                apparently your species needs personal incentives to save itself.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <a
            href="#invest"
            className="inline-flex items-center justify-center border-4 border-primary bg-brutal-pink px-8 py-3 text-sm font-black uppercase text-brutal-pink-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
          >
            Deposit to Prize
          </a>
          <NavItemLink
            item={earthOptimizationPrizePaperLink}
            variant="custom"
            external
            className="inline-flex items-center justify-center border-4 border-primary bg-background px-8 py-3 text-sm font-black uppercase text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
          >
            Read the Paper
          </NavItemLink>
        </div>
      </section>

      {/* Section 2: Deposit CTA + Trust Badges */}
      <section id="invest" className="mb-16">
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {trustBadges.map((badge) => (
            <div
              key={badge.label}
              className="border-4 border-primary bg-background px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="text-xs font-black uppercase text-foreground">
                {badge.label}
              </div>
              <div className="text-[10px] font-bold text-muted-foreground">
                {badge.detail}
              </div>
            </div>
          ))}
        </div>
        <div className="border-4 border-primary bg-brutal-pink p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black uppercase text-brutal-pink-foreground mb-4">
            Deposit — Fund the Prize Pool
          </h2>
          <p className="text-sm font-bold text-background mb-6 max-w-2xl">
            Your deposit goes into the Wishocratic fund ({poolReturn} annually). You get PRIZE shares —
            your claim on the pool. Plan fails? ~{poolMultiple} back.
            You also get a referral link — recruit verified voters to earn
            VOTE points for success-scenario upside too.
          </p>
          <VoterPrizeTreasuryDeposit />
        </div>
        <div className="border-4 border-primary border-t-0 bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm text-foreground font-bold leading-relaxed">
            On my planet, financial instruments don&apos;t need trust disclaimers
            because we eliminated the kind of person who makes them necessary.
            You lot still have those people. So here&apos;s the fine print: there
            isn&apos;t any. It&apos;s all on-chain.
          </p>
          <NavItemLink
            item={contractsSourceLink}
            variant="custom"
            external
            className="inline-flex items-center mt-3 text-xs font-black text-brutal-pink uppercase hover:text-foreground transition-colors"
          >
            View the smart contracts on GitHub &rarr;
          </NavItemLink>
        </div>
      </section>

      {/* Section 3: The Math */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-6">
          The Math
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="border-4 border-primary bg-brutal-yellow p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-muted-foreground mb-2">
              Per-Capita Income Gain
            </div>
            <div className="text-2xl font-black text-foreground">
              {`${fmtParam({...TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA, unit: "USD"})}–${fmtParam({...WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA, unit: "USD"})}`}
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-2">
              Across adopting jurisdictions, based on health-GDP multiplier
              and regulatory delay removal.
            </p>
          </div>
          <div className="border-4 border-primary bg-brutal-cyan p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-muted-foreground mb-2">
              Break-Even Probability Shift
            </div>
            <div className="text-2xl font-black text-foreground">
              0.0067%
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-2">
              The probability the plan needs to increase success odds by for
              the expected value of your bond to exceed your investment.
            </p>
          </div>
          <div className="border-4 border-primary bg-brutal-pink p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-muted-foreground mb-2 text-background">
              Dominant Assurance Contract
            </div>
            <div className="text-2xl font-black text-brutal-pink-foreground">
              Win Either Way
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-2">
              Plan fails? ~{poolMultiple} return from Wishocratic fund. Plan succeeds?
              Prize share proportional to verified voters you recruited.
              No scenario where you &ldquo;just lose your money.&rdquo;
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border-4 border-primary bg-brutal-red p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-brutal-red-foreground mb-3">
              Cost of Doing Nothing
            </div>
            <ul className="space-y-3">
              <li className="text-sm font-bold text-brutal-red-foreground">
                <span className="font-black">{dysfunctionTaxFormatted}/person/year</span>{" "}
                — political dysfunction tax you&apos;re already paying
              </li>
              <li className="text-sm font-bold text-brutal-red-foreground">
                <span className="font-black">{fmtParam({...POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL, unit: "USD"})}/yr</span>{" "}
                — global waste from misaligned governance
              </li>
              <li className="text-sm font-bold text-brutal-red-foreground">
                <span className="font-black">{deathsPerDayFormatted} deaths/day</span>{" "}
                — preventable, if anyone was paying attention
              </li>
            </ul>
          </div>
          <div className="border-4 border-primary bg-brutal-cyan p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-foreground mb-3">
              Cost of Doing Something
            </div>
            <ul className="space-y-3">
              <li className="text-sm font-bold text-foreground">
                <span className="font-black">Your deposit amount</span>{" "}
                — that&apos;s it. That&apos;s the cost.
              </li>
              <li className="text-sm font-bold text-foreground">
                <span className="font-black">0.0067% break-even</span>{" "}
                — probability shift needed for positive expected value
              </li>
              <li className="text-sm font-bold text-foreground">
                <span className="font-black">Worst case: ~{poolMultiple} back</span>{" "}
                — dominant assurance contract if the plan fails
              </li>
              <li className="text-sm font-bold text-foreground">
                <span className="font-black">Best case: prize share</span>{" "}
                — proportional to verified voters you recruited
              </li>
            </ul>
          </div>
        </div>
        <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm text-foreground font-bold leading-relaxed">
            On my planet, this took about twelve seconds to explain. You are
            currently paying {dysfunctionTaxFormatted} per year for the privilege
            of your government being terrible. The break-even requires a 0.0067%
            chance of that changing. You don&apos;t need to believe the plan will
            work. You just need to believe it&apos;s not literally impossible. The
            math does the rest.
          </p>
        </div>
      </section>

      {/* Section 4: How It Works */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-8">
          How It Works
        </h2>
        <div className="space-y-0">
          {mechanismSteps.map((step, index) => (
            <div key={step.label} className="flex gap-6">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 border-4 border-primary ${step.color} flex items-center justify-center font-black text-lg shrink-0`}
                >
                  {step.number}
                </div>
                {index < mechanismSteps.length - 1 && (
                  <div className="w-1 flex-1 bg-foreground" />
                )}
              </div>
              <div
                className={`flex-1 border-4 border-primary ${step.color} p-6 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
              >
                <h3 className={`text-xl font-black uppercase ${step.textColor}`}>
                  {step.label}
                </h3>
                <p className={`mt-2 text-sm font-bold ${step.subTextColor}`}>
                  {step.description}
                </p>
                <p className={`mt-3 text-xs font-bold ${step.detailColor} leading-relaxed`}>
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="border-4 border-primary bg-brutal-yellow p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xs font-black uppercase text-muted-foreground mb-1">Depositor Path</p>
            <p className="text-sm font-bold text-foreground">
              Deposit USDC → PRIZE shares → Wishocratic fund → ~{poolMultiple} floor if plan fails
            </p>
          </div>
          <div className="border-4 border-primary bg-brutal-cyan p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xs font-black uppercase text-muted-foreground mb-1">Recruiter Path</p>
            <p className="text-sm font-bold text-foreground">
              Get referral link → Recruit voters → World ID verify → VOTE points → Prize share if plan succeeds
            </p>
          </div>
        </div>
      </section>

      {/* Section 5: The Two Numbers */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-6">
          The Only Two Numbers That Matter
        </h2>
        <p className="text-sm font-bold text-muted-foreground mb-6 max-w-3xl">
          GDP measures how much money moved around. A country could score
          brilliantly because everyone&apos;s buying coffins. Here&apos;s what
          actually determines whether VOTE holders get paid.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-4 border-primary bg-brutal-cyan p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-black text-foreground mb-3 uppercase">
              Median Healthy Life Years
            </h3>
            <p className="text-sm text-foreground leading-relaxed font-bold">
              Not &ldquo;are you alive&rdquo; but &ldquo;are you alive and can you
              open a jar without crying.&rdquo; Median, not mean — one billionaire
              living to 120 doesn&apos;t mean your healthcare works.
            </p>
          </div>
          <div className="border-4 border-primary bg-brutal-yellow p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-black text-foreground mb-3 uppercase">
              Median Real After-Tax Income
            </h3>
            <p className="text-sm text-foreground leading-relaxed font-bold">
              What can a normal person actually buy after the government&apos;s had
              its go at their paycheque? Not GDP — that counts arms dealing and
              divorce lawyers. This counts &ldquo;can you feed your kids.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Section 6: Citizen Dashboard */}
      <section id="dashboard" className="mb-16">
        <Suspense>
          <CitizenDashboardWrapper />
        </Suspense>
      </section>

      {/* Section 6: Technical Details (Accordion) */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-6">
          Technical Details
        </h2>
        <Accordion type="multiple" className="border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {/* Panel 1: Trust & Transparency */}
          <AccordionItem value="trust" className="border-b-4 border-primary last:border-b-0">
            <AccordionTrigger className="px-6 py-4 text-sm font-black uppercase tracking-wide text-foreground hover:no-underline hover:bg-muted">
              Trust &amp; Transparency
            </AccordionTrigger>
            <AccordionContent className="px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="border-4 border-primary bg-brutal-yellow p-4">
                  <h4 className="font-black uppercase text-foreground text-xs mb-2">
                    Zero Insider Advantage
                  </h4>
                  <p className="text-xs text-foreground font-bold leading-relaxed">
                    No team allocation. No founder tokens. No pre-sale. No admin
                    keys. Your $100 gets exactly the same terms as $100,000.
                  </p>
                </div>
                <div className="border-4 border-primary bg-brutal-cyan p-4">
                  <h4 className="font-black uppercase text-foreground text-xs mb-2">
                    Fully On-Chain
                  </h4>
                  <p className="text-xs text-foreground font-bold leading-relaxed">
                    Every deposit, every VOTE mint, every metric update — all
                    on-chain. No committees. No discretion. Just smart contracts
                    doing arithmetic. Code is open source on GitHub.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Panel 4: Contract Architecture */}
          <AccordionItem value="contracts" className="border-b-4 border-primary last:border-b-0">
            <AccordionTrigger className="px-6 py-4 text-sm font-black uppercase tracking-wide text-foreground hover:no-underline hover:bg-muted">
              Contract Architecture
            </AccordionTrigger>
            <AccordionContent className="px-6">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {contractDetails.map((item) => (
                  <div
                    key={item.label}
                    className="border-4 border-primary bg-background p-3"
                  >
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      {item.label}
                    </div>
                    <div className="mt-1 text-sm font-black text-foreground">
                      {item.value}
                    </div>
                    <div className="mt-1 text-xs font-bold text-muted-foreground">
                      {item.detail}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <NavItemLink
                  item={contractsSourceLink}
                  variant="custom"
                  external
                  className="inline-flex items-center text-xs font-black text-brutal-pink uppercase hover:text-foreground transition-colors"
                >
                  VoterPrizeTreasury.sol, VoteToken.sol — full source on GitHub &rarr;
                </NavItemLink>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Section 8: Pool Status + Final CTA */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-6">
          Pool Status
        </h2>
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="border-4 border-primary bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-muted-foreground">
              Status
            </div>
            <div className="mt-2 text-2xl font-black text-brutal-cyan">
              OPEN
            </div>
          </div>
          <div className="border-4 border-primary bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-muted-foreground">
              Total Deposited
            </div>
            <div className="mt-2 text-2xl font-black text-foreground">$0</div>
            <div className="text-[10px] font-bold text-muted-foreground">
              Accepting deposits
            </div>
          </div>
          <div className="border-4 border-primary bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-muted-foreground">
              Health Threshold
            </div>
            <div className="mt-2 text-2xl font-black text-foreground">1%</div>
            <div className="text-[10px] font-bold text-muted-foreground">
              Median healthy life years improvement
            </div>
          </div>
          <div className="border-4 border-primary bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-muted-foreground">
              Income Threshold
            </div>
            <div className="mt-2 text-2xl font-black text-foreground">0.5%</div>
            <div className="text-[10px] font-bold text-muted-foreground">
              Median real after-tax income improvement
            </div>
          </div>
        </div>
        <div className="card bg-brutal-pink border-primary text-center">
          <h2 className="text-2xl font-black text-brutal-pink-foreground mb-3 uppercase">
            The Bar Is Low
          </h2>
          <p className="text-background mb-6 font-bold max-w-2xl mx-auto leading-relaxed">
            The current cost of governance dysfunction is {fmtParam({...POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL, unit: "USD"})} per year.
            The break-even probability shift is 0.0067%. You don&apos;t need to be
            altruistic. You just need to be numerate.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="#invest"
              className="inline-flex items-center justify-center gap-2 bg-foreground px-6 py-3 text-sm font-black text-background uppercase border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            >
              Deposit to Prize
            </a>
            <NavItemLink
              item={wishocracyLink}
              variant="custom"
              className="inline-flex items-center justify-center gap-2 bg-background px-6 py-3 text-sm font-black text-foreground uppercase border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            >
              Express Your Preferences
            </NavItemLink>
          </div>
        </div>
      </section>
    </div>
  );
}
