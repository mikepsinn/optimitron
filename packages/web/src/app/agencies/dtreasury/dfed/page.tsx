import Link from "next/link";
import { WishoniaAgencyPage } from "@/components/wishonia-agency/WishoniaAgencyPage";
import { SimpleComparisonGrid } from "@/components/ui/simple-comparison";
import { AGENCIES } from "@optimitron/data/datasets/wishonia-agencies";
import {
  fmtParam,
  CUMULATIVE_MILITARY_SPENDING_FED_ERA,
  WAR_DEATHS_SINCE_1900,
} from "@optimitron/data/parameters";
import { federalReserveLink, ROUTES } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

export const metadata = getRouteMetadata(federalReserveLink);

const agency = AGENCIES.dfed;

const historicalCycles = [
  {
    era: "Rome, 3rd Century",
    event: "Silver content in denarius reduced from 95% to 5%",
    result:
      "1,000% price increases. Empire fragments. Diocletian blames merchants.",
    color: "bg-background",
    textColor: "text-foreground",
  },
  {
    era: "France, 1790s",
    event: "National Assembly prints assignats backed by seized church land",
    result:
      "13,000% hyperinflation in five years. Revolution eats its children. Napoleon shows up.",
    color: "bg-background",
    textColor: "text-foreground",
  },
  {
    era: "Weimar Germany, 1920s",
    event: "Reichsbank prints marks to pay war reparations",
    result:
      "29,500% monthly inflation. Life savings buy a loaf of bread. Scapegoating begins.",
    color: "bg-background",
    textColor: "text-foreground",
  },
  {
    era: "United States, 1913–Present",
    event:
      "Federal Reserve created. Dollar immediately used to fund WWI without popular consent.",
    result: `Dollar loses 96% of value. ${fmtParam(WAR_DEATHS_SINCE_1900)} war and conflict deaths since 1900. ${fmtParam({ ...CUMULATIVE_MILITARY_SPENDING_FED_ERA, unit: "USD" })} in cumulative military spending.`,
    color: "bg-background",
    textColor: "text-foreground",
  },
];

const beforeAfter1971 = {
  before: [
    { label: "Median income growth", value: "~3%/yr" },
    { label: "Homeownership", value: "44% → 62% in one generation" },
    { label: "Income inequality", value: "Fell to century lows" },
    {
      label: "One paycheck bought",
      value: "House, car, vacation, retirement",
    },
  ],
  after: [
    { label: "Median income growth", value: "0.6%/yr (80% decline)" },
    { label: "Productivity vs wages", value: "246% vs 115% (131% gap)" },
    { label: "Dollar purchasing power", value: "4 cents of 1913 value" },
    {
      label: "Dual-income households",
      value: "Required by 2011 for same standard",
    },
  ],
};

export default function DTreasuryDfedPage() {
  return (
    <WishoniaAgencyPage agency={agency}>
      {/* Back link */}
      <div className="mb-8">
        <Link
          href={ROUTES.dtreasury}
          className="text-sm font-black uppercase text-foreground hover:underline"
        >
          &larr; Back to dTreasury
        </Link>
      </div>

      {/* Fixed-supply alternative */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
          The Alternative: Fixed Supply, Zero Inflation
        </h2>
        <div className="mb-6 border-l border-foreground/30 pl-4">
          <p className="text-sm text-foreground font-bold leading-relaxed mb-4">
            Wishes have a fixed supply set once at deployment. No minting. No
            central bank. No algorithm deciding how much to print. Your
            central banks created $13 trillion since 2020. Wishes create
            exactly zero, ever.
          </p>
          <p className="text-sm text-muted-foreground font-bold leading-relaxed">
            Productivity gains manifest as gentle deflation — same money, more
            goods, everyone&apos;s purchasing power rises. The total supply is
            set once in the constructor and enforced by the contract. No entity
            can create more. This is not monetary policy. This is the absence
            of monetary policy. Which, based on your track record, is a
            significant upgrade.
          </p>
        </div>
      </section>

      {/* The Pattern */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
          The Pattern (2,000 Years, Same Bug)
        </h2>
        <p className="mb-6 max-w-3xl text-sm font-bold text-muted-foreground">
          Your species has run this exact experiment at least four times. Each
          time: a government gains the ability to create money, uses it to fund
          wars, the currency collapses, and the population suffers. Then you do
          it again.
        </p>
        <div className="divide-y divide-foreground/20 border-y border-foreground/30">
          {historicalCycles.map((cycle) => (
            <div
              key={cycle.era}
              className="py-5"
            >
              <div className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">
                {cycle.era}
              </div>
              <h3 className="mt-1 text-lg font-black text-foreground">
                {cycle.event}
              </h3>
              <p className="mt-2 text-sm font-bold text-muted-foreground">
                {cycle.result}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* What Happened in 1971 */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
          What Happened in 1971
        </h2>
        <p className="mb-6 max-w-3xl text-sm font-bold text-muted-foreground">
          Nixon severed the dollar from gold. Before that, the money printer had
          a constraint. After that, it didn&apos;t.
        </p>
        <SimpleComparisonGrid
          columns={[
            {
              title: "Before 1971 (Gold-Anchored)",
              items: beforeAfter1971.before,
            },
            { title: "After 1971 (Fiat Currency)", items: beforeAfter1971.after },
          ]}
        />
        <div className="mt-6 border-l border-foreground/30 pl-4">
          <p className="text-sm font-bold leading-relaxed text-muted-foreground">
            Median wages measured in gold equivalent have lost 93% of their
            value since 1971. Your species doubled its workforce and household
            income rose ten percentage points. You added an entire second job
            and got almost nothing.
          </p>
        </div>
      </section>

      {/* The Cantillon Effect */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
          The Cantillon Effect
        </h2>
        <p className="mb-6 max-w-3xl text-sm font-bold text-muted-foreground">
          When new money is created, it doesn&apos;t appear evenly. It enters
          through banks and government contractors. By the time it reaches you,
          prices have already risen.
        </p>
        <div className="grid grid-cols-1 gap-6 border-y border-foreground/30 py-6 md:grid-cols-3">
          <div>
            <div className="text-3xl font-black">
              ~$4T
            </div>
            <div className="mt-1 text-xs font-black uppercase text-muted-foreground">
              Fed Created (2020)
            </div>
          </div>
          <div>
            <div className="text-3xl font-black">$4T</div>
            <div className="mt-1 text-xs font-black uppercase text-muted-foreground">
              Top 1% Gained (2020)
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-foreground">$0</div>
            <div className="mt-1 text-xs font-black uppercase text-muted-foreground">
              You Got
            </div>
            <p className="mt-3 text-xs font-bold text-muted-foreground">
              You got higher grocery prices.
            </p>
          </div>
        </div>
      </section>
    </WishoniaAgencyPage>
  );
}
