import type { Metadata } from "next";
import { fmtParam } from "@/lib/format-parameter";
import {
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL,
  CUMULATIVE_MILITARY_SPENDING_FED_ERA,
  MONEY_PRINTER_WAR_DEATHS,
} from "@/lib/parameters-calculations-citations";
import { GameCTA } from "@/components/ui/game-cta";

const milToTrialsRatio = Math.round(
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value /
    GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL.value,
);

export const metadata: Metadata = {
  title: "Your Central Bank Is a Bug | Optimitron",
  description:
    "Twelve unelected humans control money creation with no mandate to optimize for median health or income. The fix: fixed supply, transaction tax, equal distribution. No central bank needed.",
};

const historicalCycles = [
  {
    era: "Rome, 3rd Century",
    event: "Silver content in denarius reduced from 95% to 5%",
    result: "1,000% price increases. Empire fragments. Diocletian blames merchants.",
    color: "bg-brutal-pink",
    textColor: "text-brutal-pink-foreground",
    detailColor: "text-muted-foreground",
  },
  {
    era: "France, 1790s",
    event: "National Assembly prints assignats backed by seized church land",
    result: "13,000% hyperinflation in five years. Revolution eats its children. Napoleon shows up.",
    color: "bg-brutal-yellow",
    textColor: "text-foreground",
    detailColor: "text-muted-foreground",
  },
  {
    era: "Weimar Germany, 1920s",
    event: "Reichsbank prints marks to pay war reparations",
    result: "29,500% monthly inflation. Life savings buy a loaf of bread. Scapegoating begins.",
    color: "bg-brutal-cyan",
    textColor: "text-foreground",
    detailColor: "text-muted-foreground",
  },
  {
    era: "United States, 1913–Present",
    event: "Federal Reserve created. Dollar immediately used to fund WWI without popular consent.",
    result: `Dollar loses 96% of value. ${fmtParam(MONEY_PRINTER_WAR_DEATHS)} across six wars funded by money printing. ${fmtParam({...CUMULATIVE_MILITARY_SPENDING_FED_ERA, unit: "USD"})} in cumulative military spending.`,
    color: "bg-brutal-pink",
    textColor: "text-brutal-pink-foreground",
    detailColor: "text-muted-foreground",
  },
];

const beforeAfter1971 = {
  before: [
    { label: "Median income growth", value: "~3%/yr" },
    { label: "Homeownership", value: "44% → 62% in one generation" },
    { label: "Income inequality", value: "Fell to century lows" },
    { label: "One paycheck bought", value: "House, car, vacation, retirement" },
  ],
  after: [
    { label: "Median income growth", value: "0.6%/yr (80% decline)" },
    { label: "Productivity vs wages", value: "246% vs 115% (131% gap)" },
    { label: "Dollar purchasing power", value: "4 cents of 1913 value" },
    { label: "Dual-income households", value: "Required by 2011 for same standard" },
  ],
};

const dualMandateComparison = {
  current: [
    {
      target: "Maximum Employment",
      critique: "Any employment. Doesn't measure whether jobs produce enough to live on. A population of full-time workers who can't afford rent counts as success.",
    },
    {
      target: "Stable Prices (2% Inflation)",
      critique: "Officially eroding purchasing power by 2% annually. Over 54 years: 93% loss. They call this 'stability.' On my planet, we call this 'theft with a spreadsheet.'",
    },
  ],
  proposed: [
    {
      target: "Median Real After-Tax Income",
      description: "Not GDP. Not average income. Median. The number that tells you how the actual middle person is doing, not how the billionaires are pulling the average up.",
    },
    {
      target: "Median Healthy Life Years",
      description: "Not just 'alive.' Healthy. Years of functional, disease-free life. Because adding ten years of bedridden existence to the statistics is not an achievement.",
    },
  ],
};

export default function FederalReservePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-16">
        <div className="max-w-3xl space-y-5">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-brutal-pink">
            Algorithmic Central Bank
          </p>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground">
            Your Central Bank Is a Bug, Not a Feature
          </h1>
          <p className="text-lg text-foreground leading-relaxed font-bold">
            Twelve unelected humans in a building in Washington control the
            creation of money for 330 million people. Their mandate is
            &ldquo;maximum employment&rdquo; and &ldquo;stable prices.&rdquo;
            Neither metric measures whether anyone is actually healthier or
            wealthier. This has been the arrangement since 1913. It has not
            gone well.
          </p>
          <p className="text-muted-foreground font-bold leading-relaxed">
            On my planet, we replaced our central bankers with an algorithm in
            year six. The algorithm optimises for two things: median real
            after-tax income and median healthy life years. It does not fund
            wars. It does not have a building. It takes about four minutes a
            week.
          </p>
        </div>
      </section>

      {/* The Pattern */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-4">
          The Pattern (2,000 Years, Same Bug)
        </h2>
        <p className="text-sm font-bold text-muted-foreground mb-6 max-w-3xl">
          Your species has run this exact experiment at least four times. Each
          time: a government gains the ability to create money, uses it to fund
          wars, the currency collapses, and the population suffers. Then you do
          it again. I find this genuinely fascinating.
        </p>
        <div className="space-y-4">
          {historicalCycles.map((cycle) => (
            <div
              key={cycle.era}
              className={`border-4 border-primary ${cycle.color} p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
            >
              <div className={`text-xs font-black uppercase tracking-[0.15em] ${cycle.detailColor}`}>
                {cycle.era}
              </div>
              <h3 className={`text-lg font-black ${cycle.textColor} mt-1`}>
                {cycle.event}
              </h3>
              <p className={`text-sm font-bold mt-2 ${cycle.detailColor}`}>
                {cycle.result}
              </p>
            </div>
          ))}
        </div>
        <div className="border-4 border-primary bg-background p-6 mt-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm text-foreground font-bold leading-relaxed">
            Every major war exceeding one million deaths required abandoning
            gold convertibility. Wars fought entirely under the gold standard
            — like the Spanish-American War of 1898 — lasted ten weeks. When
            governments can&apos;t print money, they can&apos;t afford
            prolonged wars. This is not a coincidence. It&apos;s a constraint
            your species keeps removing.
          </p>
        </div>
      </section>

      {/* What Happened in 1971 */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-4">
          What Happened in 1971
        </h2>
        <p className="text-sm font-bold text-muted-foreground mb-6 max-w-3xl">
          Nixon severed the dollar from gold. Before that, the money printer
          had a constraint. After that, it didn&apos;t. The results are — and I
          cannot stress this enough — exactly what you&apos;d expect.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-4 border-primary bg-brutal-cyan p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase text-foreground mb-4 text-sm tracking-[0.1em]">
              Before 1971 (Gold-Anchored)
            </h3>
            <div className="space-y-3">
              {beforeAfter1971.before.map((item) => (
                <div key={item.label} className="border-4 border-primary bg-background p-3">
                  <div className="text-xs font-black uppercase text-muted-foreground">
                    {item.label}
                  </div>
                  <div className="text-sm font-black text-foreground mt-0.5">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-4 border-primary bg-brutal-pink p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase text-brutal-pink-foreground mb-4 text-sm tracking-[0.1em]">
              After 1971 (Fiat Currency)
            </h3>
            <div className="space-y-3">
              {beforeAfter1971.after.map((item) => (
                <div key={item.label} className="border-4 border-primary bg-background p-3">
                  <div className="text-xs font-black uppercase text-muted-foreground">
                    {item.label}
                  </div>
                  <div className="text-sm font-black text-foreground mt-0.5">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="border-4 border-primary bg-brutal-yellow p-6 mt-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm text-foreground font-bold leading-relaxed">
            Median wages measured in gold equivalent have lost 93% of their
            value since 1971. Your species doubled its workforce — from 50% of
            families with both spouses working in 1967 to near-universal
            dual-income by 2011 — and household income rose ten percentage
            points. You added an entire second job and got almost nothing.
          </p>
        </div>
      </section>

      {/* The Cantillon Effect */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-4">
          The Cantillon Effect (Who Actually Gets the Money)
        </h2>
        <p className="text-sm font-bold text-muted-foreground mb-6 max-w-3xl">
          When new money is created, it doesn&apos;t appear evenly in
          everyone&apos;s bank accounts. It enters through banks and government
          contractors. By the time it reaches you, prices have already risen.
          This is not a side effect. It is the mechanism.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-4 border-primary bg-brutal-pink p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black text-brutal-pink-foreground">~$4T</div>
            <div className="text-xs font-black uppercase text-background mt-1">
              Fed Created (2020)
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-3 leading-relaxed">
              The Federal Reserve created approximately $4 trillion in new
              money during 2020. It went to banks and financial institutions
              first.
            </p>
          </div>
          <div className="border-4 border-primary bg-brutal-yellow p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black text-foreground">$4T</div>
            <div className="text-xs font-black uppercase text-muted-foreground mt-1">
              Top 1% Gained (2020)
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-3 leading-relaxed">
              The top 1% gained exactly $4 trillion in net worth during the
              same period. 90% of gains came from stocks. The bottom 50% owns
              one-third of equity markets.
            </p>
          </div>
          <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black text-foreground">$0</div>
            <div className="text-xs font-black uppercase text-muted-foreground mt-1">
              You Got
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-3 leading-relaxed">
              You got higher grocery prices. The money was &ldquo;for the
              economy.&rdquo; The economy is a graph that goes up when rich
              people get richer. You are not the economy.
            </p>
          </div>
        </div>
      </section>

      {/* How Money Should Flow */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-4">
          How Money Should Flow
        </h2>
        <p className="text-sm font-bold text-muted-foreground mb-6 max-w-3xl">
          Your current system prints new money and gives it to banks first.
          The Wishonian system doesn&apos;t print money at all. The supply is
          fixed. The treasury is funded by a 0.5% transaction tax on existing
          money. The comparison is not &ldquo;who gets new money first?&rdquo;
          but &ldquo;why are you creating new money at all?&rdquo;
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div className="border-4 border-primary bg-brutal-pink p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase text-brutal-pink-foreground mb-4 text-sm tracking-[0.1em]">
              Current System (Print &amp; Trickle)
            </h3>
            <div className="space-y-2">
              {[
                'Fed prints $4T in new money',
                'Banks and financial institutions get it first',
                'They buy assets — stocks, bonds, real estate',
                'Asset prices inflate before wages adjust',
                'Rich get richer (they own the assets)',
                'Eventually some trickles to the real economy',
                'You get higher grocery prices',
              ].map((step, i) => (
                <div key={step} className="flex items-start gap-2">
                  <span className="text-xs font-black text-muted-foreground mt-0.5 shrink-0">
                    {i + 1}.
                  </span>
                  <span className="text-sm font-bold text-background">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-4 border-primary bg-brutal-cyan p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase text-foreground mb-4 text-sm tracking-[0.1em]">
              Wishonian System (Fixed Supply)
            </h3>
            <div className="space-y-2">
              {[
                'Fixed supply. No new money is ever created.',
                '0.5% transaction tax funds the treasury automatically',
                'Treasury distributes equally to every verified citizen',
                'Productivity gains make goods cheaper over time',
                'Your money buys more without anyone printing anything',
                'Price signals stay clean — 0% inflation',
                'You get richer by the economy getting better. Not by a printer.',
              ].map((step, i) => (
                <div key={step} className="flex items-start gap-2">
                  <span className="text-xs font-black text-muted-foreground mt-0.5 shrink-0">
                    {i + 1}.
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="border-4 border-primary bg-brutal-yellow p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm text-foreground font-bold leading-relaxed">
            The Cantillon effect doesn&apos;t just disappear — it becomes
            impossible. There is no new money to distribute unfairly. The
            treasury is funded by a tax on existing transactions, split equally
            among citizens. Wealth grows from productivity, not from proximity
            to a printer. This is not a radical idea. It is, in fact, the
            obvious idea that your species has been avoiding for 111 years
            because the people closest to the printer would prefer you didn&apos;t
            think about it.
          </p>
        </div>
      </section>

      {/* Military-to-Trials Ratio */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-4">
          {milToTrialsRatio} : 1
        </h2>
        <p className="text-sm font-bold text-muted-foreground mb-6 max-w-3xl">
          This is the ratio of global military spending to government-funded
          clinical trials. Your species spends {fmtParam({...GLOBAL_MILITARY_SPENDING_ANNUAL_2024, unit: "USD"})}{" "}
          per year on weapons and {fmtParam({...GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL, unit: "USD"})}{" "}
          on testing whether medicines work. I will let you sit with that.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-4 border-primary bg-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-4xl font-black text-brutal-pink">$2.72T</div>
            <div className="text-xs font-black uppercase text-muted-foreground mt-2">
              Annual Military Spending
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-3 leading-relaxed">
              ~40 million top-talent humans building weapons. Military captures
              3–3.4% of global GDP. Every year. Without anyone voting on it.
            </p>
          </div>
          <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-4xl font-black text-foreground">$4.5B</div>
            <div className="text-xs font-black uppercase text-muted-foreground mt-2">
              Annual Clinical Trials
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-3 leading-relaxed">
              ~1 million humans doing medical research. 0.065% of GDP. The
              financial sector alone — people who move numbers between
              spreadsheets — captures 8% of GDP. 123 times more.
            </p>
          </div>
        </div>
        <div className="border-4 border-primary bg-brutal-yellow p-6 mt-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm text-foreground font-bold leading-relaxed">
            &ldquo;Just print more money for medicine&rdquo; doesn&apos;t work.
            When the central bank inflates the overall money supply by 50%,
            military budgets also rise 50%. The ratio stays at {milToTrialsRatio}:1. Real
            resources — brains, factories, hours — are unchanged. Only nominal
            numbers inflate. You cannot print your way out of misallocation.
            You have to actually change what the system optimises for.
          </p>
        </div>
      </section>

      {/* The Dual Mandate Problem */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-4">
          The Dual Mandate Problem
        </h2>
        <p className="text-sm font-bold text-muted-foreground mb-6 max-w-3xl">
          The Federal Reserve has two official targets. Neither measures
          whether human lives are actually getting better. This is like
          optimising a hospital for &ldquo;maximum bed occupancy&rdquo; and
          &ldquo;stable thermometer readings&rdquo; instead of &ldquo;patients
          getting healthier.&rdquo;
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border-4 border-primary bg-brutal-pink p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase text-brutal-pink-foreground mb-4 text-sm tracking-[0.1em]">
              Current Mandate (What They Optimise For)
            </h3>
            <div className="space-y-4">
              {dualMandateComparison.current.map((item) => (
                <div key={item.target} className="border-2 border-border p-4">
                  <div className="text-sm font-black text-brutal-pink-foreground">
                    {item.target}
                  </div>
                  <p className="text-xs font-bold text-muted-foreground mt-2 leading-relaxed">
                    {item.critique}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="border-4 border-primary bg-brutal-cyan p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase text-foreground mb-4 text-sm tracking-[0.1em]">
              Proposed Mandate (What Should Be Optimised)
            </h3>
            <div className="space-y-4">
              {dualMandateComparison.proposed.map((item) => (
                <div key={item.target} className="border-4 border-primary p-4 bg-background">
                  <div className="text-sm font-black text-foreground">
                    {item.target}
                  </div>
                  <p className="text-xs font-bold text-muted-foreground mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Fix Is Simpler Than You Think */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-4">
          The Fix Is Simpler Than You Think
        </h2>
        <p className="text-sm font-bold text-muted-foreground mb-6 max-w-3xl">
          You don&apos;t need a better central bank. You don&apos;t need a
          smarter algorithm controlling the money supply. You need no one
          controlling the money supply. The answer isn&apos;t &ldquo;replace
          the committee with a formula.&rdquo; It&apos;s &ldquo;remove the
          need for both.&rdquo;
        </p>
        <div className="space-y-4">
          <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-xs font-black shrink-0">
                01
              </span>
              <div>
                <h3 className="font-black uppercase text-foreground text-sm">
                  Fixed supply — no one can print money. Ever.
                </h3>
                <p className="text-sm text-muted-foreground font-bold mt-1">
                  Not a committee. Not an algorithm. Not a government. The total
                  supply of $WISH is set once at deployment and never changes.
                  It is written into the contract and enforced by mathematics.
                  There is no meeting where someone decides to create more.
                  There is no meeting at all.
                </p>
              </div>
            </div>
          </div>
          <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-xs font-black shrink-0">
                02
              </span>
              <div>
                <h3 className="font-black uppercase text-foreground text-sm">
                  Transaction tax replaces income tax
                </h3>
                <p className="text-sm text-muted-foreground font-bold mt-1">
                  0.5% on every transfer, collected automatically by the
                  protocol. No IRS. No filing. No 74,000-page tax code. No
                  83,000 employees interpreting it. No evasion. No offshore
                  accounts. Just a line of code that executes every time money
                  moves.
                </p>
              </div>
            </div>
          </div>
          <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-xs font-black shrink-0">
                03
              </span>
              <div>
                <h3 className="font-black uppercase text-foreground text-sm">
                  Treasury distributes equally
                </h3>
                <p className="text-sm text-muted-foreground font-bold mt-1">
                  Tax revenue goes to every verified citizen in equal shares.
                  No Cantillon effect. No first-mover advantage. No bankers
                  standing closer to the printer. Smart contracts enforce equal
                  per-citizen splits. Anyone can trigger distribution. The code
                  is the only middleman, and you can read it.
                </p>
              </div>
            </div>
          </div>
          <div className="border-4 border-primary bg-brutal-yellow p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-xs font-black shrink-0">
                04
              </span>
              <div>
                <h3 className="font-black uppercase text-foreground text-sm">
                  Productivity is the only wealth creation
                </h3>
                <p className="text-sm text-foreground font-bold mt-1">
                  When the economy produces more goods with the same fixed money
                  supply, prices fall. Your money buys more. That&apos;s how
                  wealth should grow — from making things, not printing things.
                  Gentle deflation rewards savers, punishes nobody, and makes
                  the causal inference engine&apos;s job dramatically easier
                  because 0% inflation means price signals are clean.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why You Don't Know This */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-4">
          Why You Don&apos;t Know This
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase text-foreground mb-3 text-sm">
              Education
            </h3>
            <p className="text-sm text-muted-foreground font-bold leading-relaxed">
              17,000 hours of formal education for a typical bachelor&apos;s
              degree. Hours explaining how the Federal Reserve creates money:
              zero. Time spent on the recorder: weeks. Time on mitochondria:
              an entire semester.
            </p>
          </div>
          <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase text-foreground mb-3 text-sm">
              Institutional Capture
            </h3>
            <p className="text-sm text-muted-foreground font-bold leading-relaxed">
              Banks endow economics university chairs. The Federal Reserve
              funds economic research. Economists rotate between the Fed,
              universities, and Wall Street. Alternative explanations are
              punished. The system studies itself and concludes it is necessary.
            </p>
          </div>
          <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase text-foreground mb-3 text-sm">
              Fake Credibility
            </h3>
            <p className="text-sm text-muted-foreground font-bold leading-relaxed">
              In 1968, Sweden&apos;s central bank created a prize using Alfred
              Nobel&apos;s name. He was dead and could not object. The Nobel
              Prize website admits it is not a Nobel Prize. The Nobel family
              called it a &ldquo;PR coup by economists.&rdquo; The authority is
              manufactured.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="card bg-brutal-pink border-primary text-center">
        <h2 className="text-2xl font-black text-brutal-pink-foreground mb-3 uppercase">
          Replace the Building With Nothing
        </h2>
        <p className="text-background mb-6 font-bold max-w-2xl mx-auto leading-relaxed">
          The current system: twelve unelected humans in a building, printing
          money and hoping it trickles down, while purchasing power falls 93%
          and wars consume {fmtParam({...CUMULATIVE_MILITARY_SPENDING_FED_ERA, unit: "USD"})}. The
          alternative: fixed supply, automatic transaction tax, equal
          distribution. The algorithm is the market. The money supply is fixed.
          The tax is automatic. The distribution is equal. There is nothing
          left to manage.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <GameCTA href="/money" variant="secondary">See How $WISH Works</GameCTA>
          <GameCTA href="/prize" variant="outline">Play the Game</GameCTA>
          <GameCTA href="/wishocracy" variant="outline">Set Your Priorities</GameCTA>
        </div>
      </section>
    </div>
  );
}
