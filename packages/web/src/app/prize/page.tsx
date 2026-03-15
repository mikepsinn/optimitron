import type { Metadata } from "next";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import {
  earthOptimizationPrizePaperLink,
  incentiveAlignmentBondsPaperLink,
  transparencyLink,
  wishocracyLink,
  alignmentLink,
} from "@/lib/routes";
import { PrizeDeposit } from "@/components/prize/PrizeDeposit";

export const metadata: Metadata = {
  title: "Earth Optimization Prize | Optomitron",
  description:
    "A standing market where greed does the coordination. Buy Incentive Alignment Bonds to fund implementations that measurably improve health and income. Wishocratic allocation ensures your money goes where evidence points.",
};

const mechanismSteps = [
  {
    number: 1,
    label: "You Buy Bonds",
    description:
      "Purchase Incentive Alignment Bonds via the smart contract. Your bond amount IS your identity and your allocation power. No accounts, no registration — just capital in escrow with an attractive return profile either way.",
    detail: "Bond-as-identity eliminates sybil attacks. Fake accounts have zero funds to allocate. Your purchase moves your money, not anyone else's. Fail scenario: ~4x return. Succeed scenario: 272%/yr revenue share.",
    color: "bg-brutal-pink",
    textColor: "text-white",
    subTextColor: "text-white/70",
    detailColor: "text-white/50",
  },
  {
    number: 2,
    label: "Outcomes Are Measured",
    description:
      "Oracles report two terminal metrics: median healthy life years and median real after-tax income. When both cross pre-published thresholds in adopting jurisdictions — verified by peer-reviewed study — the pool unlocks.",
    detail: "Health gets 50%. Income gets 50%. No opinion metrics. No vibes. Just the two numbers that actually measure whether human lives are getting better.",
    color: "bg-brutal-yellow",
    textColor: "text-black",
    subTextColor: "text-black/70",
    detailColor: "text-black/50",
  },
  {
    number: 3,
    label: "Implementers Claim",
    description:
      "Teams that produced outcomes register with evidence: Hypercert attestations on the AT Protocol, Storacha CIDs linking to verifiable data, legislative records, trial results.",
    detail: "Every claim is content-addressed and auditable. If you can't prove it, you don't get paid. Evidence is linked via the same Hypercert infrastructure used for alignment scoring.",
    color: "bg-brutal-cyan",
    textColor: "text-black",
    subTextColor: "text-black/70",
    detailColor: "text-black/50",
  },
  {
    number: 4,
    label: "You Allocate (Wishocratic)",
    description:
      "You're shown random pairs of implementers with their evidence. For each pair, you split your share based on who you think contributed more. Enough random pairs across enough bondholders and the allocations converge on a stable distribution.",
    detail: "The pairwise comparison IS the ranking rule. No judges, no committees, no pre-specified scoring formula. Each bondholder is choosing where their dollars go based on evidence.",
    color: "bg-brutal-cyan",
    textColor: "text-black",
    subTextColor: "text-black/70",
    detailColor: "text-black/50",
  },
  {
    number: 5,
    label: "Funds Distribute",
    description:
      "Smart contracts distribute funds to implementers proportional to the aggregated Wishocratic allocation weights. Retroactive rewards for verified outcomes — implementers get paid for results, not promises.",
    detail: "Bonded disputes protect the process. Challengers post a bond to dispute allocations. Losing side pays escalation costs, so frivolous disputes are expensive but genuine ones get resolved.",
    color: "bg-brutal-pink",
    textColor: "text-white",
    subTextColor: "text-white/70",
    detailColor: "text-white/50",
  },
];

const whatYouFund = [
  {
    icon: "🧬",
    title: "Pragmatic Clinical Trials",
    description:
      "Current FDA trials cost $41,000 per patient. Pragmatic trials cost $929. The Earth Optimization Plan would generate evidence 44x faster at 2% of the cost.",
    impact: "102M lives saved from regulatory delay since 1962",
  },
  {
    icon: "🗳️",
    title: "Preference Infrastructure",
    description:
      "Wishocracy collects citizen budget preferences via pairwise comparison. Eigenvector decomposition produces stable weights from as few as 10 comparisons.",
    impact: "412 participants, 0.08 consistency ratio",
  },
  {
    icon: "🏛️",
    title: "Alignment Scoring",
    description:
      "Compare politician voting records against citizen preferences. Publish scores as verifiable Hypercerts. Fund aligned politicians via Incentive Alignment Bonds.",
    impact: "6 politicians scored, all attestations on IPFS",
  },
  {
    icon: "📊",
    title: "Cross-Jurisdiction Analysis",
    description:
      "Optimocracy treats every jurisdiction as a natural experiment. Compare spending levels, policies, and outcomes across 100+ countries to find what actually works.",
    impact: "1,027 analysis pages generated",
  },
];

const requiredFunctions = [
  { id: 1, name: "Reallocation Wedge", description: "Redirect 1% of military spending ($22B) to clinical trials" },
  { id: 2, name: "Medical Throughput", description: "Expand trial capacity from 1.9M to 23.4M patients/yr" },
  { id: 3, name: "Regulatory-Delay Removal", description: "Eliminate 8.2 years of post-safety efficacy waiting" },
  { id: 4, name: "Preference Aggregation", description: "Collect citizen priorities via pairwise comparison (RAPPA)" },
  { id: 5, name: "Alignment Scoring", description: "Score politicians against citizen preferences, publish as Hypercerts" },
  { id: 6, name: "Campaign Automation", description: "Route funds to high-alignment candidates via smart contracts" },
  { id: 7, name: "Cross-Jurisdiction Analysis", description: "Compare spending, policies, and outcomes across 100+ countries" },
  { id: 8, name: "Outcome Labels", description: "Generate effectiveness ratings for every treatment from real-world data" },
  { id: 9, name: "Budget Optimisation", description: "Find optimal spending levels using diminishing-returns modeling" },
  { id: 10, name: "Policy Impact Scoring", description: "Rank policies by causal impact on median health + income" },
];

const bountyStages = [
  {
    stage: "01",
    label: "Specification",
    description: "Publish the plan. Define metrics. Set thresholds. This is done.",
    status: "Complete",
    statusColor: "bg-brutal-cyan",
  },
  {
    stage: "02",
    label: "Pilot",
    description: "Run in one jurisdiction. Prove the model works. Collect real outcome data.",
    status: "In Progress",
    statusColor: "bg-brutal-yellow",
  },
  {
    stage: "03",
    label: "Adoption",
    description: "Scale to multiple jurisdictions. Compound evidence. Cross-jurisdiction comparison validates.",
    status: "Pending",
    statusColor: "bg-white",
  },
  {
    stage: "04",
    label: "Outcome Perpetuity",
    description: "Metrics cross thresholds. Pool unlocks. Implementers get paid. Protocol persists.",
    status: "Pending",
    statusColor: "bg-white",
  },
];

const contractDetails = [
  {
    label: "Contract",
    value: "PrizePool.sol",
    detail: "Outcome-based escrow with Wishocratic allocation",
  },
{
    label: "Health Metric",
    value: "Median Healthy Life Years",
    detail: "50% of pool — verified by peer-reviewed study",
  },
  {
    label: "Income Metric",
    value: "Median Real After-Tax Income",
    detail: "50% of pool — verified by quasi-experimental design",
  },
  {
    label: "Sybil Resistance",
    value: "Bond-as-Identity",
    detail: "Your allocation power = your investment. No fake accounts.",
  },
  {
    label: "Dispute Resolution",
    value: "Bonded Challenges",
    detail: "Post a bond to dispute. Losers pay escalation costs.",
  },
];

export default function PrizePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-16">
        <div className="max-w-3xl space-y-5">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-brutal-pink">
            Earth Optimization Prize
          </p>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-black">
            Buy Bonds. Fund What Works. Get Paid When It Does.
          </h1>
          <p className="text-lg text-black/80 leading-relaxed font-medium">
            Not a donation. A financial instrument. Incentive Alignment Bonds ARE
            the prize pool — one mechanism where your investment funds governance
            reforms and your return depends on whether they work. Fail? ~4x return
            from the dominant assurance contract. Succeed? Revenue share on
            trillions in per-capita income gains.
          </p>
          <p className="text-black/60 font-medium leading-relaxed">
            No judges. No committees. No grant applications. Just evidence,
            pairwise comparisons, and smart contracts. Implementers fund work up
            front, produce auditable outcomes, and get paid for results they can
            prove — only after the outcomes exist.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <a
            href="#invest"
            className="inline-flex items-center justify-center border-4 border-black bg-brutal-pink px-8 py-3 text-sm font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Buy Bonds
          </a>
          <NavItemLink
            item={earthOptimizationPrizePaperLink}
            variant="custom"
            external
            className="inline-flex items-center justify-center border-4 border-black bg-white px-8 py-3 text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Read the Paper
          </NavItemLink>
          <NavItemLink
            item={incentiveAlignmentBondsPaperLink}
            variant="custom"
            external
            className="inline-flex items-center justify-center border-4 border-black bg-white px-8 py-3 text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Incentive Alignment Bonds Paper
          </NavItemLink>
        </div>
      </section>

      {/* Why This Is Rational */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-6">
          Why This Is Rational
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="border-4 border-black bg-brutal-yellow p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-black/50 mb-2">
              Per-Capita Income Gain
            </div>
            <div className="text-2xl font-black text-black">
              $14.9M–$52.1M
            </div>
            <p className="text-xs font-medium text-black/60 mt-2">
              Across adopting jurisdictions, based on health-GDP multiplier
              and regulatory delay removal.
            </p>
          </div>
          <div className="border-4 border-black bg-brutal-cyan p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-black/50 mb-2">
              Break-Even Probability Shift
            </div>
            <div className="text-2xl font-black text-black">
              0.0067%
            </div>
            <p className="text-xs font-medium text-black/60 mt-2">
              The probability the plan needs to increase success odds by for
              the expected value of your bond to exceed your investment.
            </p>
          </div>
          <div className="border-4 border-black bg-brutal-pink p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-black/50 mb-2 text-white/70">
              Dominant Assurance Contract
            </div>
            <div className="text-2xl font-black text-white">
              Win Either Way
            </div>
            <p className="text-xs font-medium text-white/60 mt-2">
              Plan fails? ~4x return on your bond. Plan succeeds? Revenue share
              on civilisational-scale welfare gains. No scenario where you
              &ldquo;just lose your money.&rdquo;
            </p>
          </div>
        </div>
        <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm text-black/70 font-medium leading-relaxed">
            On my planet, this took about twelve seconds to explain. The expected
            value calculation is straightforward: even a tiny probability shift on
            trillions of dollars in welfare gains makes a bond purchase
            positive-EV. You don&apos;t need to believe the plan will work. You just
            need to believe it&apos;s not literally impossible. The math does the rest.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-8">
          How It Works
        </h2>
        <div className="space-y-0">
          {mechanismSteps.map((step, index) => (
            <div key={step.label} className="flex gap-6">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 border-4 border-black ${step.color} flex items-center justify-center font-black text-lg shrink-0`}
                >
                  {step.number}
                </div>
                {index < mechanismSteps.length - 1 && (
                  <div className="w-1 flex-1 bg-black" />
                )}
              </div>
              <div
                className={`flex-1 border-4 border-black ${step.color} p-6 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
              >
                <h3 className={`text-xl font-black uppercase ${step.textColor}`}>
                  {step.label}
                </h3>
                <p className={`mt-2 text-sm font-medium ${step.subTextColor}`}>
                  {step.description}
                </p>
                <p className={`mt-3 text-xs font-bold ${step.detailColor} leading-relaxed`}>
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 10 Required Functions */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-4">
          10 Required Functions (v1 Benchmark)
        </h2>
        <p className="text-sm font-medium text-black/60 mb-6 max-w-3xl">
          The Earth Optimization Plan v1 defines ten functions that must be
          operational for outcome thresholds to be achievable. Any team can
          submit a v2 that beats it on cost per DALY averted. Currently the bar
          is $0.177/DALY risk-adjusted.
        </p>
        <div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black text-white">
                <th className="px-4 py-3 text-left font-black uppercase text-xs">#</th>
                <th className="px-4 py-3 text-left font-black uppercase text-xs">Function</th>
                <th className="px-4 py-3 text-left font-black uppercase text-xs hidden md:table-cell">Description</th>
              </tr>
            </thead>
            <tbody>
              {requiredFunctions.map((fn) => (
                <tr key={fn.id} className="border-t-2 border-black/10">
                  <td className="px-4 py-3 font-black text-brutal-pink">{fn.id}</td>
                  <td className="px-4 py-3 font-black text-black">{fn.name}</td>
                  <td className="px-4 py-3 text-black/60 font-medium hidden md:table-cell">{fn.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* How Money Moves — 4-stage bounty */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-6">
          How Money Moves
        </h2>
        <p className="text-sm font-medium text-black/60 mb-6 max-w-3xl">
          Bond purchases flow through four stages. Money doesn&apos;t move until
          outcomes exist. Implementers get paid for results, not proposals.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {bountyStages.map((item) => (
            <div
              key={item.stage}
              className="border-4 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 bg-black text-white flex items-center justify-center text-xs font-black">
                  {item.stage}
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black ${item.statusColor}`}>
                  {item.status}
                </span>
              </div>
              <h3 className="font-black text-black uppercase text-sm mb-2">
                {item.label}
              </h3>
              <p className="text-xs text-black/60 font-medium leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* What You Fund */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-6">
          What Your Bonds Fund
        </h2>
        <p className="text-sm font-medium text-black/60 mb-6 max-w-3xl">
          The Earth Optimization Plan v1 is the starting benchmark. Any team can
          submit a v2 that beats it on cost per DALY averted. Your species
          spends $50,000+ per DALY on most interventions. The gap is obscene.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {whatYouFund.map((item) => (
            <div
              key={item.title}
              className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="text-black font-black uppercase mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-black/60 font-medium leading-relaxed mb-3">
                {item.description}
              </p>
              <div className="border-2 border-black bg-brutal-cyan px-3 py-1.5 inline-block">
                <span className="text-xs font-black uppercase text-black">
                  {item.impact}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Invest Section */}
      <section id="invest" className="mb-16">
        <div className="border-4 border-black bg-brutal-pink p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black uppercase text-white mb-4">
            Buy Incentive Alignment Bonds
          </h2>
          <p className="text-sm font-medium text-white/70 mb-6 max-w-2xl">
            Bonds are held in the PrizePool smart contract until outcome
            thresholds are met. Your bond amount determines your Wishocratic
            allocation power — you decide which implementers get paid, weighted
            by how much you invested.
          </p>
          <PrizeDeposit />
        </div>
      </section>

      {/* Anti-Capture */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-6">
          Anti-Capture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-4 border-black bg-brutal-yellow p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase text-black mb-3">
              Replacement Rule
            </h3>
            <p className="text-sm text-black/70 font-medium leading-relaxed">
              Any team can submit a v2 plan that beats v1 on cost per DALY
              averted. The current benchmark is $0.177/DALY risk-adjusted. If
              you can do it cheaper and prove it, the protocol switches to your
              plan. No incumbency advantage. No moat. Just results.
            </p>
          </div>
          <div className="border-4 border-black bg-brutal-cyan p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase text-black mb-3">
              Outcome Perpetuity &gt; Extraction
            </h3>
            <p className="text-sm text-black/70 font-medium leading-relaxed">
              The prize pool persists as long as outcomes persist. It&apos;s not a
              one-time payout — it&apos;s a standing market. As long as someone is
              producing measurable improvements in health and income, the bonds
              keep distributing. Extraction stops when outcomes stop.
            </p>
          </div>
        </div>
        <div className="border-4 border-black bg-white p-6 mt-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="font-black uppercase text-black mb-2">
            The Protocol Itself Is Replaceable
          </h3>
          <p className="text-sm text-black/70 font-medium leading-relaxed">
            If someone builds a better coordination mechanism than Incentive Alignment Bonds +
            Wishocratic allocation, the protocol should be replaced by it. The
            goal is outcome maximisation, not protocol preservation. On my
            planet, we replaced the governance protocol three times in four
            thousand years. Each time it was mildly inconvenient and
            comprehensively worth it.
          </p>
        </div>
      </section>

      {/* Pool Status */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-6">
          Pool Status
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="border-4 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-black/60">
              Status
            </div>
            <div className="mt-2 text-2xl font-black text-brutal-cyan">
              OPEN
            </div>
          </div>
          <div className="border-4 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-black/60">
              Total Invested
            </div>
            <div className="mt-2 text-2xl font-black text-black">$0</div>
            <div className="text-[10px] font-bold text-black/40">
              Accepting bond purchases
            </div>
          </div>
          <div className="border-4 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-black/60">
              Health Threshold
            </div>
            <div className="mt-2 text-2xl font-black text-black">1%</div>
            <div className="text-[10px] font-bold text-black/40">
              Median healthy life years improvement
            </div>
          </div>
          <div className="border-4 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-black/60">
              Income Threshold
            </div>
            <div className="mt-2 text-2xl font-black text-black">0.5%</div>
            <div className="text-[10px] font-bold text-black/40">
              Median real after-tax income improvement
            </div>
          </div>
        </div>
      </section>

      {/* Smart Contract Details */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-6">
          Contract Architecture
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contractDetails.map((item) => (
            <div
              key={item.label}
              className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="text-xs font-black uppercase tracking-[0.2em] text-black/50">
                {item.label}
              </div>
              <div className="mt-1 text-sm font-black text-black">
                {item.value}
              </div>
              <div className="mt-2 text-xs font-medium text-black/60">
                {item.detail}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="card bg-brutal-pink border-black text-center">
        <h2 className="text-2xl font-black text-white mb-3 uppercase">
          The Bar Is Low
        </h2>
        <p className="text-white/80 mb-6 font-medium max-w-2xl mx-auto leading-relaxed">
          The current cost of governance dysfunction is $101 trillion per year.
          The Earth Optimization Plan costs roughly $0.177 per DALY averted.
          Your species is leaving a 282,000x improvement on the table. The
          break-even probability shift is 0.0067%. You don&apos;t need to be
          altruistic. You just need to be numerate.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <NavItemLink
            item={wishocracyLink}
            variant="custom"
            className="inline-flex items-center justify-center gap-2 bg-black px-6 py-3 text-sm font-black text-white uppercase border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Express Your Preferences
          </NavItemLink>
          <NavItemLink
            item={alignmentLink}
            variant="custom"
            className="inline-flex items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-black text-black uppercase border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Score Your Politicians
          </NavItemLink>
          <NavItemLink
            item={transparencyLink}
            variant="custom"
            className="inline-flex items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-black text-black uppercase border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Verify Everything
          </NavItemLink>
        </div>
      </section>
    </div>
  );
}
