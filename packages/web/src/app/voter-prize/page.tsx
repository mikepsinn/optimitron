import type { Metadata } from "next";
import { Suspense } from "react";
import { VoterPrizeTreasuryDeposit } from "@/components/prize/VoterPrizeTreasuryDeposit";
import { VoteTokenBalanceCard } from "@/components/prize/VoteTokenBalanceCard";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Voter Prize Treasury | Optomitron",
  description:
    "Deposit USDC into the Voter Prize Treasury. If health and income thresholds are met, VOTE token holders from verified referendum votes claim proportional shares. If not, depositors get principal + Aave yield back.",
};

export default function VoterPrizePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-16">
        <div className="max-w-3xl space-y-5">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-brutal-pink">
            Voter Prize Treasury
          </p>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-black">
            Fund the Future. Reward the Voters.
          </h1>
          <p className="text-lg text-black/80 leading-relaxed font-medium">
            Depositors stake USDC into an Aave-backed treasury. If median
            healthy life years and median real after-tax income cross published
            thresholds, VOTE token holders — verified referendum voters —
            split the prize pool proportionally.
          </p>
          <p className="text-black/60 font-medium leading-relaxed">
            If thresholds aren&apos;t met? Depositors get their principal back
            plus all accrued Aave yield. You literally cannot lose money. The
            worst case is &ldquo;free interest&rdquo;. On my planet, we call
            this &ldquo;obvious&rdquo;.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <a
            href="#deposit"
            className="inline-flex items-center justify-center border-4 border-black bg-brutal-pink px-8 py-3 text-sm font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Deposit USDC
          </a>
          <Link
            href="/referendum"
            className="inline-flex items-center justify-center border-4 border-black bg-white px-8 py-3 text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Vote to Earn VOTE Tokens
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-6">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-4 border-black bg-brutal-yellow p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl mb-3">1</div>
            <h3 className="font-black uppercase text-black mb-2">
              Depositors Fund the Treasury
            </h3>
            <p className="text-sm font-medium text-black/70 leading-relaxed">
              Anyone deposits USDC. Funds go straight to Aave V3 to earn
              yield. You get PRIZE shares representing your proportional stake.
              No lockup — you can claim a refund anytime before maturity.
            </p>
          </div>
          <div className="border-4 border-black bg-brutal-cyan p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl mb-3">2</div>
            <h3 className="font-black uppercase text-black mb-2">
              Voters Earn VOTE Tokens
            </h3>
            <p className="text-sm font-medium text-black/70 leading-relaxed">
              Vote on referendums + verify with World ID = 1 VOTE token per
              verified vote. VOTE tokens are transferable ERC-20s — they
              form an implicit prediction market on governance outcomes.
            </p>
          </div>
          <div className="border-4 border-black bg-brutal-pink p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl text-white mb-3">3</div>
            <h3 className="font-black uppercase text-white mb-2">
              Thresholds Met → Voters Win
            </h3>
            <p className="text-sm font-medium text-white/70 leading-relaxed">
              Oracles report health + income metrics. If both cross thresholds,
              VOTE holders redeem tokens for a proportional share of the
              entire treasury (principal + yield). Your votes literally pay off.
            </p>
          </div>
          <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl mb-3">4</div>
            <h3 className="font-black uppercase text-black mb-2">
              Thresholds Not Met → Depositors Win
            </h3>
            <p className="text-sm font-medium text-black/70 leading-relaxed">
              If thresholds aren&apos;t met by maturity, depositors claim
              refunds: full principal + all Aave yield. No one loses. The
              failure case is &ldquo;you made money for free while the
              experiment ran.&rdquo;
            </p>
          </div>
        </div>
        <div className="border-4 border-black bg-white p-6 mt-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm text-black/70 font-medium leading-relaxed">
            On my planet, we designed this mechanism in about twenty minutes.
            It took your species four thousand years of governance theory to
            arrive at &ldquo;what if we just paid people to participate in
            democracy and made the payment conditional on outcomes?&rdquo;
            Better late than never, I suppose.
          </p>
        </div>
      </section>

      {/* VOTE Token Balance */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-6">
          Your VOTE Tokens
        </h2>
        <p className="text-sm font-medium text-black/60 mb-6 max-w-3xl">
          Each verified referendum vote earns you 1 VOTE token. These are
          ERC-20 tokens on Base — transferable, tradeable, and redeemable
          for treasury shares if outcome thresholds are met.
        </p>
        <Suspense
          fallback={
            <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-pulse">
              <div className="h-4 bg-black/10 w-1/3 mb-3" />
              <div className="h-8 bg-black/10 w-1/2" />
            </div>
          }
        >
          <VoteTokenBalanceCard />
        </Suspense>
      </section>

      {/* Deposit Section */}
      <section id="deposit" className="mb-16">
        <div className="border-4 border-black bg-brutal-pink p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black uppercase text-white mb-4">
            Deposit to Prize Treasury
          </h2>
          <p className="text-sm font-medium text-white/70 mb-6 max-w-2xl">
            Your USDC deposits go into Aave V3 for yield. You receive PRIZE
            shares. If outcome thresholds are met, VOTE token holders claim
            the pool. If not, you get principal + yield back. Win-win.
          </p>
          <VoterPrizeTreasuryDeposit />
        </div>
      </section>

      {/* Contract Details */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-6">
          Contract Architecture
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              label: "VoteToken",
              value: "VOTE (ERC-20)",
              detail:
                "1:1 mint per verified referendum vote. Sybil-resistant via World ID nullifier hash.",
            },
            {
              label: "VoterPrizeTreasury",
              value: "PRIZE (ERC-20 Vault)",
              detail:
                "USDC deposits → Aave V3 yield. Dual-outcome: VOTE redemption or depositor refund.",
            },
            {
              label: "Health Metric",
              value: "Median Healthy Life Years",
              detail:
                "Threshold: 100 bps (1% improvement). Verified by oracle.",
            },
            {
              label: "Income Metric",
              value: "Median Real After-Tax Income",
              detail:
                "Threshold: 50 bps (0.5% improvement). Verified by oracle.",
            },
            {
              label: "Network",
              value: "Base Sepolia (Testnet)",
              detail: "Base L2 for low gas fees. Mainnet deployment after testnet validation.",
            },
            {
              label: "Yield Source",
              value: "Aave V3 (USDC)",
              detail:
                "All deposited USDC earns Aave supply APY while in escrow.",
            },
          ].map((item) => (
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
          Democracy Should Pay
        </h2>
        <p className="text-white/80 mb-6 font-medium max-w-2xl mx-auto leading-relaxed">
          On my planet, participation in governance is compensated because —
          and this shouldn&apos;t need explaining — you want people to do
          the thing that makes everything else work properly. Deposit to the
          treasury, vote on referendums, and let the smart contracts handle the
          rest.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <a
            href="#deposit"
            className="inline-flex items-center justify-center gap-2 bg-black px-6 py-3 text-sm font-black text-white uppercase border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Deposit USDC
          </a>
          <Link
            href="/referendum"
            className="inline-flex items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-black text-black uppercase border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Vote on Referendums
          </Link>
        </div>
      </section>
    </div>
  );
}
