"use client";

import { formatWish, useTreasuryData } from "@/hooks/useTreasuryData";
import { WISHOCRATIC_ITEMS, type WishocraticItemId } from "@/lib/wishocracy-data";

const BAR_COLORS = [
  "bg-brutal-pink",
  "bg-brutal-cyan",
  "bg-brutal-yellow",
  "bg-green-400",
  "bg-purple-400",
  "bg-orange-400",
  "bg-blue-400",
  "bg-rose-400",
  "bg-emerald-400",
  "bg-amber-400",
  "bg-violet-400",
  "bg-teal-400",
];

/**
 * Demo Wishocratic allocations (shown when no real community data is available).
 * Roughly mirrors what an informed electorate might produce.
 */
const DEMO_ALLOCATIONS: { categoryId: WishocraticItemId; percentage: number }[] = [
  { categoryId: "UNIVERSAL_BASIC_INCOME", percentage: 18.2 },
  { categoryId: "PRAGMATIC_CLINICAL_TRIALS", percentage: 14.5 },
  { categoryId: "EARLY_CHILDHOOD_EDUCATION", percentage: 12.8 },
  { categoryId: "ADDICTION_TREATMENT", percentage: 11.3 },
  { categoryId: "CYBERSECURITY", percentage: 8.7 },
  { categoryId: "POLICING_VIOLENT_CRIME", percentage: 7.9 },
];

export function TreasuryAllocationViz() {
  const { ubiPendingBalance, citizenCount, taxRateBps, isDemo } =
    useTreasuryData();

  const citizenCountNum = Number(citizenCount);
  const taxPct = (Number(taxRateBps) / 100).toFixed(1);

  // Use demo allocations for now (will be replaced with on-chain reads)
  const allocations = DEMO_ALLOCATIONS;
  const maxPct = allocations[0]?.percentage ?? 1;

  return (
    <section className="mb-16">
      <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-6">
        How It Works
      </h2>

      <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        {/* Flow diagram */}
        <div className="flex flex-col md:flex-row items-stretch gap-0 mb-6">
          <div className="flex-1 border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-4 text-center">
            <div className="text-xs font-black uppercase mb-1">
              Step 1
            </div>
            <div className="text-sm font-black">
              Every $WISH Transfer
            </div>
            <div className="text-xs mt-1">
              {taxPct}% transaction tax
            </div>
          </div>
          <div className="flex items-center justify-center px-2 py-1 md:py-0">
            <span className="text-2xl font-black rotate-90 md:rotate-0">
              &rarr;
            </span>
          </div>
          <div className="flex-1 border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-4 text-center">
            <div className="text-xs font-black uppercase mb-1">
              Step 2
            </div>
            <div className="text-sm font-black">
              Wishocratic Treasury
            </div>
            <div className="text-xs mt-1">
              {formatWish(ubiPendingBalance)} $WISH &mdash; citizen-directed
            </div>
          </div>
          <div className="flex items-center justify-center px-2 py-1 md:py-0">
            <span className="text-2xl font-black rotate-90 md:rotate-0">
              &rarr;
            </span>
          </div>
          <div className="flex-1 border-4 border-primary bg-brutal-pink text-brutal-pink-foreground p-4 text-center">
            <div className="text-xs font-black uppercase mb-1">
              Step 3
            </div>
            <div className="text-sm font-black">
              Category Recipients
            </div>
            <div className="text-xs mt-1">
              {citizenCountNum > 0
                ? `${citizenCountNum.toLocaleString()} citizens directing allocation`
                : "Vote to direct funds"}
            </div>
          </div>
        </div>

        {/* Wishocratic allocation breakdown */}
        <div className="border-4 border-primary bg-muted p-5 mb-6">
          <h3 className="font-black uppercase text-foreground text-sm mb-4">
            Citizen-Directed Allocation
          </h3>
          <div className="space-y-3">
            {allocations.map((item, index) => {
              const cat = WISHOCRATIC_ITEMS[item.categoryId];
              const barWidth = Math.max((item.percentage / maxPct) * 100, 2);
              const color = BAR_COLORS[index % BAR_COLORS.length]!;

              return (
                <div key={item.categoryId}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.1em] text-foreground">
                      {cat.icon} {cat.name}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-5 w-full overflow-hidden border border-primary bg-background">
                    <div
                      className={`h-full ${color} border-r border-primary transition-all duration-300`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] font-bold text-muted-foreground mt-3">
            Weights derived from citizen pairwise comparisons via eigenvector aggregation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Wishocratic UBI */}
          <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-5">
            <h3 className="font-black uppercase text-sm mb-3">
              UBI Is a Category, Not a Guarantee
            </h3>
            <p className="text-xs font-bold leading-relaxed">
              Universal Basic Income competes alongside clinical trials,
              education, and every other category. Citizens decide how much goes
              to direct cash vs public goods through pairwise comparisons. If
              they collectively allocate 18% to UBI, 18% of the tax goes to
              equal per-citizen distribution via World ID.
            </p>
          </div>

          {/* Politician funding note */}
          <div className="border-4 border-primary bg-brutal-pink text-brutal-pink-foreground p-5">
            <h3 className="font-black uppercase text-sm mb-3">
              Politician Funding? That&apos;s IABs.
            </h3>
            <p className="text-xs font-bold leading-relaxed">
              Aligned politicians are funded through the Incentive Alignment
              Bond mechanism &mdash; 10% of IAB revenue flows to the political
              incentive layer. $WISH tax and IABs are completely separate
              systems. No outcomes? No funding. Simple.
            </p>
          </div>
        </div>

        {isDemo && (
          <p className="text-[10px] font-bold text-muted-foreground mt-4 text-center">
            Illustrative data &mdash; contracts not yet deployed
          </p>
        )}
      </div>
    </section>
  );
}
