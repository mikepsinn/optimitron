import type { Metadata } from "next";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import {
  moneyLink,
  prizeLink,
  wishocracyLink,
} from "@/lib/routes";

export const metadata: Metadata = {
  title: "Your Central Bank Is a Bug | Optomitron",
  description:
    "Twelve unelected humans control money creation with no mandate to optimize for median health or income. An algorithmic central bank would fix this. Here's how.",
};

const historicalCycles = [
  {
    era: "Rome, 3rd Century",
    event: "Silver content in denarius reduced from 95% to 5%",
    result: "1,000% price increases. Empire fragments. Diocletian blames merchants.",
    color: "bg-brutal-pink",
    textColor: "text-white",
    detailColor: "text-white/60",
  },
  {
    era: "France, 1790s",
    event: "National Assembly prints assignats backed by seized church land",
    result: "13,000% hyperinflation in five years. Revolution eats its children. Napoleon shows up.",
    color: "bg-brutal-yellow",
    textColor: "text-black",
    detailColor: "text-black/60",
  },
  {
    era: "Weimar Germany, 1920s",
    event: "Reichsbank prints marks to pay war reparations",
    result: "29,500% monthly inflation. Life savings buy a loaf of bread. Scapegoating begins.",
    color: "bg-brutal-cyan",
    textColor: "text-black",
    detailColor: "text-black/60",
  },
  {
    era: "United States, 1913–Present",
    event: "Federal Reserve created. Dollar immediately used to fund WWI without popular consent.",
    result: "Dollar loses 96% of value. 97 million deaths across six wars funded by money printing. $170 trillion in cumulative military spending.",
    color: "bg-brutal-pink",
    textColor: "text-white",
    detailColor: "text-white/60",
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
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-black">
            Your Central Bank Is a Bug, Not a Feature
          </h1>
          <p className="text-lg text-black/80 leading-relaxed font-medium">
            Twelve unelected humans in a building in Washington control the
            creation of money for 330 million people. Their mandate is
            &ldquo;maximum employment&rdquo; and &ldquo;stable prices.&rdquo;
            Neither metric measures whether anyone is actually healthier or
            wealthier. This has been the arrangement since 1913. It has not
            gone well.
          </p>
          <p className="text-black/60 font-medium leading-relaxed">
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
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-4">
          The Pattern (2,000 Years, Same Bug)
        </h2>
        <p className="text-sm font-medium text-black/60 mb-6 max-w-3xl">
          Your species has run this exact experiment at least four times. Each
          time: a government gains the ability to create money, uses it to fund
          wars, the currency collapses, and the population suffers. Then you do
          it again. I find this genuinely fascinating.
        </p>
        <div className="space-y-4">
          {historicalCycles.map((cycle) => (
            <div
              key={cycle.era}
              className={`border-4 border-black ${cycle.color} p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
            >
              <div className={`text-xs font-black uppercase tracking-[0.15em] ${cycle.detailColor}`}>
                {cycle.era}
              </div>
              <h3 className={`text-lg font-black ${cycle.textColor} mt-1`}>
                {cycle.event}
              </h3>
              <p className={`text-sm font-medium mt-2 ${cycle.detailColor}`}>
                {cycle.result}
              </p>
            </div>
          ))}
        </div>
        <div className="border-4 border-black bg-white p-6 mt-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm text-black/70 font-medium leading-relaxed">
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
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-4">
          What Happened in 1971
        </h2>
        <p className="text-sm font-medium text-black/60 mb-6 max-w-3xl">
          Nixon severed the dollar from gold. Before that, the money printer
          had a constraint. After that, it didn&apos;t. The results are — and I
          cannot stress this enough — exactly what you&apos;d expect.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-4 border-black bg-brutal-cyan p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase text-black mb-4 text-sm tracking-[0.1em]">
              Before 1971 (Gold-Anchored)
            </h3>
            <div className="space-y-3">
              {beforeAfter1971.before.map((item) => (
                <div key={item.label} className="border-2 border-black bg-white p-3">
                  <div className="text-xs font-black uppercase text-black/50">
                    {item.label}
                  </div>
                  <div className="text-sm font-black text-black mt-0.5">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-4 border-black bg-brutal-pink p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase text-white mb-4 text-sm tracking-[0.1em]">
              After 1971 (Fiat Currency)
            </h3>
            <div className="space-y-3">
              {beforeAfter1971.after.map((item) => (
                <div key={item.label} className="border-2 border-black bg-white/10 p-3">
                  <div className="text-xs font-black uppercase text-white/50">
                    {item.label}
                  </div>
                  <div className="text-sm font-black text-white mt-0.5">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="border-4 border-black bg-brutal-yellow p-6 mt-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm text-black/70 font-medium leading-relaxed">
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
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-4">
          The Cantillon Effect (Who Actually Gets the Money)
        </h2>
        <p className="text-sm font-medium text-black/60 mb-6 max-w-3xl">
          When new money is created, it doesn&apos;t appear evenly in
          everyone&apos;s bank accounts. It enters through banks and government
          contractors. By the time it reaches you, prices have already risen.
          This is not a side effect. It is the mechanism.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-4 border-black bg-brutal-pink p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black text-white">~$4T</div>
            <div className="text-xs font-black uppercase text-white/70 mt-1">
              Fed Created (2020)
            </div>
            <p className="text-xs font-medium text-white/50 mt-3 leading-relaxed">
              The Federal Reserve created approximately $4 trillion in new
              money during 2020. It went to banks and financial institutions
              first.
            </p>
          </div>
          <div className="border-4 border-black bg-brutal-yellow p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black text-black">$4T</div>
            <div className="text-xs font-black uppercase text-black/60 mt-1">
              Top 1% Gained (2020)
            </div>
            <p className="text-xs font-medium text-black/50 mt-3 leading-relaxed">
              The top 1% gained exactly $4 trillion in net worth during the
              same period. 90% of gains came from stocks. The bottom 50% owns
              one-third of equity markets.
            </p>
          </div>
          <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black text-black">$0</div>
            <div className="text-xs font-black uppercase text-black/60 mt-1">
              You Got
            </div>
            <p className="text-xs font-medium text-black/50 mt-3 leading-relaxed">
              You got higher grocery prices. The money was &ldquo;for the
              economy.&rdquo; The economy is a graph that goes up when rich
              people get richer. You are not the economy.
            </p>
          </div>
        </div>
      </section>

      {/* 604:1 */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-4">
          604 : 1
        </h2>
        <p className="text-sm font-medium text-black/60 mb-6 max-w-3xl">
          This is the ratio of global military spending to government-funded
          clinical trials. Your species spends $2.72 trillion per year on
          weapons and $4.5 billion on testing whether medicines work. I will
          let you sit with that.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-4 border-black bg-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-4xl font-black text-brutal-pink">$2.72T</div>
            <div className="text-xs font-black uppercase text-white/60 mt-2">
              Annual Military Spending
            </div>
            <p className="text-xs font-medium text-white/40 mt-3 leading-relaxed">
              ~40 million top-talent humans building weapons. Military captures
              3–3.4% of global GDP. Every year. Without anyone voting on it.
            </p>
          </div>
          <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-4xl font-black text-black">$4.5B</div>
            <div className="text-xs font-black uppercase text-black/60 mt-2">
              Annual Clinical Trials
            </div>
            <p className="text-xs font-medium text-black/40 mt-3 leading-relaxed">
              ~1 million humans doing medical research. 0.065% of GDP. The
              financial sector alone — people who move numbers between
              spreadsheets — captures 8% of GDP. 123 times more.
            </p>
          </div>
        </div>
        <div className="border-4 border-black bg-brutal-yellow p-6 mt-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm text-black/70 font-medium leading-relaxed">
            &ldquo;Just print more money for medicine&rdquo; doesn&apos;t work.
            When the central bank inflates the overall money supply by 50%,
            military budgets also rise 50%. The ratio stays at 604:1. Real
            resources — brains, factories, hours — are unchanged. Only nominal
            numbers inflate. You cannot print your way out of misallocation.
            You have to actually change what the system optimises for.
          </p>
        </div>
      </section>

      {/* The Dual Mandate Problem */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-4">
          The Dual Mandate Problem
        </h2>
        <p className="text-sm font-medium text-black/60 mb-6 max-w-3xl">
          The Federal Reserve has two official targets. Neither measures
          whether human lives are actually getting better. This is like
          optimising a hospital for &ldquo;maximum bed occupancy&rdquo; and
          &ldquo;stable thermometer readings&rdquo; instead of &ldquo;patients
          getting healthier.&rdquo;
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border-4 border-black bg-brutal-pink p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase text-white mb-4 text-sm tracking-[0.1em]">
              Current Mandate (What They Optimise For)
            </h3>
            <div className="space-y-4">
              {dualMandateComparison.current.map((item) => (
                <div key={item.target} className="border-2 border-white/20 p-4">
                  <div className="text-sm font-black text-white">
                    {item.target}
                  </div>
                  <p className="text-xs font-medium text-white/60 mt-2 leading-relaxed">
                    {item.critique}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="border-4 border-black bg-brutal-cyan p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase text-black mb-4 text-sm tracking-[0.1em]">
              Proposed Mandate (What Should Be Optimised)
            </h3>
            <div className="space-y-4">
              {dualMandateComparison.proposed.map((item) => (
                <div key={item.target} className="border-2 border-black p-4 bg-white">
                  <div className="text-sm font-black text-black">
                    {item.target}
                  </div>
                  <p className="text-xs font-medium text-black/60 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Algorithmic Replacement */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-4">
          The Algorithmic Replacement
        </h2>
        <p className="text-sm font-medium text-black/60 mb-6 max-w-3xl">
          Since 2009, the technology to replace a central bank with a
          decentralised ledger has existed. An eleven-year-old on my planet
          implemented one for a science fair. It got third place. The judges
          thought it was &ldquo;a bit obvious.&rdquo;
        </p>
        <div className="space-y-4">
          <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 bg-black text-white flex items-center justify-center text-xs font-black shrink-0">
                01
              </span>
              <div>
                <h3 className="font-black uppercase text-black text-sm">
                  Replace the committee with a formula
                </h3>
                <p className="text-sm text-black/60 font-medium mt-1">
                  Monetary policy decisions currently depend on twelve humans
                  interpreting ambiguous economic signals in a conference room.
                  An algorithm targeting median real after-tax income and median
                  healthy life years produces deterministic, auditable,
                  non-lobbied output. No conference room required.
                </p>
              </div>
            </div>
          </div>
          <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 bg-black text-white flex items-center justify-center text-xs font-black shrink-0">
                02
              </span>
              <div>
                <h3 className="font-black uppercase text-black text-sm">
                  Make the ledger public and self-checking
                </h3>
                <p className="text-sm text-black/60 font-medium mt-1">
                  No single institution can unilaterally create money. A
                  decentralised network verifies every transaction. Your species
                  spent 17,000 hours in formal education and zero of them
                  explaining where money comes from. The algorithm doesn&apos;t
                  rely on ignorance to function.
                </p>
              </div>
            </div>
          </div>
          <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 bg-black text-white flex items-center justify-center text-xs font-black shrink-0">
                03
              </span>
              <div>
                <h3 className="font-black uppercase text-black text-sm">
                  Measure what matters, continuously
                </h3>
                <p className="text-sm text-black/60 font-medium mt-1">
                  Feed real-time data on median income and health outcomes into
                  the monetary policy algorithm. If median real income falls,
                  the system adjusts. If healthy life years stall, the system
                  adjusts. No waiting for quarterly reports. No political
                  pressure. Just optimisation against the two numbers that
                  actually tell you if things are getting better.
                </p>
              </div>
            </div>
          </div>
          <div className="border-4 border-black bg-brutal-yellow p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 bg-black text-white flex items-center justify-center text-xs font-black shrink-0">
                04
              </span>
              <div>
                <h3 className="font-black uppercase text-black text-sm">
                  Let citizens set allocation priorities
                </h3>
                <p className="text-sm text-black/70 font-medium mt-1">
                  Wishocratic pairwise comparison determines how public goods
                  funding is distributed. Five minutes per citizen. Eigenvector
                  decomposition. Stable weights from as few as ten comparisons.
                  Politicians become unnecessary for resource allocation. They
                  can do something else. Perhaps learn a trade.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why You Don't Know This */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-4">
          Why You Don&apos;t Know This
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase text-black mb-3 text-sm">
              Education
            </h3>
            <p className="text-sm text-black/60 font-medium leading-relaxed">
              17,000 hours of formal education for a typical bachelor&apos;s
              degree. Hours explaining how the Federal Reserve creates money:
              zero. Time spent on the recorder: weeks. Time on mitochondria:
              an entire semester.
            </p>
          </div>
          <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase text-black mb-3 text-sm">
              Institutional Capture
            </h3>
            <p className="text-sm text-black/60 font-medium leading-relaxed">
              Banks endow economics university chairs. The Federal Reserve
              funds economic research. Economists rotate between the Fed,
              universities, and Wall Street. Alternative explanations are
              punished. The system studies itself and concludes it is necessary.
            </p>
          </div>
          <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase text-black mb-3 text-sm">
              Fake Credibility
            </h3>
            <p className="text-sm text-black/60 font-medium leading-relaxed">
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
      <section className="card bg-brutal-pink border-black text-center">
        <h2 className="text-2xl font-black text-white mb-3 uppercase">
          Replace the Building With an Algorithm
        </h2>
        <p className="text-white/80 mb-6 font-medium max-w-2xl mx-auto leading-relaxed">
          The current system: twelve unelected humans in a building, optimising
          for &ldquo;employment&rdquo; and &ldquo;price stability&rdquo; while
          purchasing power falls 93% and wars consume $170 trillion. The
          alternative: an algorithm that optimises for median income and
          healthy life years, with transparent rules that no one can override in
          a closed-door meeting. Your species has the technology. Since 2009.
          The building is the only thing in the way.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <NavItemLink
            item={moneyLink}
            variant="custom"
            className="inline-flex items-center justify-center gap-2 bg-black px-6 py-3 text-sm font-black text-white uppercase border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            See How $WISH Works
          </NavItemLink>
          <NavItemLink
            item={prizeLink}
            variant="custom"
            className="inline-flex items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-black text-black uppercase border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Fund Outcomes
          </NavItemLink>
          <NavItemLink
            item={wishocracyLink}
            variant="custom"
            className="inline-flex items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-black text-black uppercase border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Set Your Priorities
          </NavItemLink>
        </div>
      </section>
    </div>
  );
}
