import type { Metadata } from "next";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import {
  earthOptimizationPrizePaperLink,
  transparencyLink,
  wishocracyLink,
  alignmentLink,
} from "@/lib/routes";
import { PrizeDeposit } from "@/components/prize/PrizeDeposit";

export const metadata: Metadata = {
  title: "Earth Optimization Prize | Optomitron",
  description:
    "Outcome-based escrow for governance reforms. Donate to fund implementations that measurably improve health and income. Wishocratic allocation ensures your money goes where evidence points.",
};

const mechanismSteps = [
  {
    number: 1,
    label: "You Deposit",
    description:
      "Deposit $WISH tokens into the Prize Pool smart contract. Your deposit amount IS your identity and your voting power. No accounts, no registration — just money in escrow.",
    detail: "Deposit-as-identity eliminates sybil attacks. Fake accounts have zero funds to allocate. Your deposit moves your money, not anyone else's.",
    color: "bg-pink-100",
  },
  {
    number: 2,
    label: "Outcomes Are Measured",
    description:
      "Oracles report two terminal metrics: median healthy life years and median real after-tax income. When both cross pre-published thresholds in adopting jurisdictions — verified by peer-reviewed study — the pool unlocks.",
    detail: "Health gets 50%. Income gets 50%. No opinion metrics. No vibes. Just the two numbers that actually measure whether human lives are getting better.",
    color: "bg-yellow-100",
  },
  {
    number: 3,
    label: "Implementers Claim",
    description:
      "Teams that produced outcomes register with evidence: Hypercert attestations on the AT Protocol, Storacha CIDs linking to verifiable data, legislative records, trial results.",
    detail: "Every claim is content-addressed and auditable. If you can't prove it, you don't get paid. Evidence is linked via the same Hypercert infrastructure used for alignment scoring.",
    color: "bg-emerald-100",
  },
  {
    number: 4,
    label: "You Allocate (Wishocratic)",
    description:
      "You're shown random pairs of implementers with their evidence. For each pair, you split your share based on who you think contributed more. Enough random pairs across enough donors and the allocations converge on a stable distribution.",
    detail: "The pairwise comparison IS the ranking rule. No judges, no committees, no pre-specified scoring formula. Each contributor is a buyer choosing where their dollars go based on evidence.",
    color: "bg-cyan-100",
  },
  {
    number: 5,
    label: "Funds Distribute",
    description:
      "Smart contracts distribute $WISH to implementers proportional to the aggregated Wishocratic allocation weights. Retroactive rewards for verified outcomes — implementers get paid for results, not promises.",
    detail: "Bonded disputes protect the process. Challengers post a bond to dispute allocations. Losing side pays escalation costs, so frivolous disputes are expensive but genuine ones get resolved.",
    color: "bg-purple-100",
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

const contractDetails = [
  {
    label: "Contract",
    value: "PrizePool.sol",
    detail: "Outcome-based escrow with Wishocratic allocation",
  },
  {
    label: "Token",
    value: "$WISH (ERC-20)",
    detail: "0.5% transaction tax funds UBI + prize pools",
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
    value: "Deposit-as-Identity",
    detail: "Your allocation power = your deposit. No fake accounts.",
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
          <p className="text-sm font-black uppercase tracking-[0.2em] text-pink-600">
            Earth Optimization Prize
          </p>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-black">
            Fund What Works. Get Paid When It Does.
          </h1>
          <p className="text-lg text-black/80 leading-relaxed font-medium">
            Your species spends $101 trillion per year on governance and gets
            results that would embarrass a moderately competent spreadsheet. This
            is an outcome-based escrow: money goes in, stays locked until health
            and income actually improve, then donors decide who contributed most
            via Wishocratic pairwise comparison.
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
            href="#donate"
            className="inline-flex items-center justify-center border-4 border-black bg-pink-500 px-8 py-3 text-sm font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Donate to the Prize Pool
          </a>
          <NavItemLink
            item={earthOptimizationPrizePaperLink}
            variant="custom"
            external
            className="inline-flex items-center justify-center border-4 border-black bg-white px-8 py-3 text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Read the Paper
          </NavItemLink>
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
                <h3 className="text-xl font-black uppercase text-black">
                  {step.label}
                </h3>
                <p className="mt-2 text-sm font-medium text-black/70">
                  {step.description}
                </p>
                <p className="mt-3 text-xs font-bold text-black/50 leading-relaxed">
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What You Fund */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-6">
          What You&apos;re Funding
        </h2>
        <p className="text-sm font-medium text-black/60 mb-6 max-w-3xl">
          The Earth Optimization Plan v1 is the starting benchmark. Any team can
          submit a v2 that beats it on cost per DALY averted. Currently the bar
          is $0.177/DALY risk-adjusted. Your species spends $50,000+ per DALY on
          most interventions. The gap is obscene.
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
              <div className="border-2 border-black bg-emerald-100 px-3 py-1.5 inline-block">
                <span className="text-xs font-black uppercase text-black">
                  {item.impact}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Donate Section */}
      <section id="donate" className="mb-16">
        <div className="border-4 border-black bg-pink-100 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black uppercase text-black mb-4">
            Deposit to the Prize Pool
          </h2>
          <p className="text-sm font-medium text-black/70 mb-6 max-w-2xl">
            Deposits are held in the PrizePool smart contract until outcome
            thresholds are met. Your deposit amount determines your Wishocratic
            allocation power — you decide which implementers get paid, weighted
            by how much you put in.
          </p>
          <PrizeDeposit />
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
            <div className="mt-2 text-2xl font-black text-emerald-600">
              OPEN
            </div>
          </div>
          <div className="border-4 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-black/60">
              Total Deposits
            </div>
            <div className="mt-2 text-2xl font-black text-black">$0</div>
            <div className="text-[10px] font-bold text-black/40">
              Accepting deposits
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
      <section className="card bg-pink-100 border-pink-500 text-center">
        <h2 className="text-2xl font-black text-black mb-3 uppercase">
          The Bar Is Low
        </h2>
        <p className="text-black/60 mb-6 font-medium max-w-2xl mx-auto leading-relaxed">
          The current cost of governance dysfunction is $101 trillion per year.
          The Earth Optimization Plan costs roughly $0.177 per DALY averted.
          Your species is leaving a 282,000x improvement on the table. On my
          planet we would find this embarrassing. Here it seems to be called
          &ldquo;politics.&rdquo;
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
