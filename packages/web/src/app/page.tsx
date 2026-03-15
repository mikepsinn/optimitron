import type { Metadata } from "next";
import { WishocracyLandingSection } from "@/components/wishocracy/WishocracyLandingSection";
import { OutcomeExplorerTeaser } from "@/components/landing/OutcomeExplorerTeaser";
import { MythVsDataTeaser } from "@/components/landing/MythVsDataTeaser";
import { AlignmentTeaser } from "@/components/landing/AlignmentTeaser";
import { WarVsCuresChart } from "@/components/landing/WarVsCuresChart";
import { PoliticalDysfunctionTaxSection } from "@/components/landing/PoliticalDysfunctionTaxSection";
import { InvisibleGraveyardSection } from "@/components/landing/InvisibleGraveyardSection";
import { OnePercentTreatySection } from "@/components/landing/OnePercentTreatySection";
import { IncentiveAlignmentBondsSection } from "@/components/landing/IncentiveAlignmentBondsSection";
import { EarthOptimizationPrizeSection } from "@/components/landing/EarthOptimizationPrizeSection";
import { DecentralizedFDASection } from "@/components/landing/DecentralizedFDASection";
import { ImplementationPlanSection } from "@/components/landing/ImplementationPlanSection";
import { TwoFuturesSection } from "@/components/landing/TwoFuturesSection";
import { NaturalExperimentsChart } from "@/components/landing/NaturalExperimentsChart";
import { BudgetGapChart } from "@/components/landing/BudgetGapChart";
import { PersonalIncomeChart } from "@/components/landing/PersonalIncomeChart";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { CountUp } from "@/components/animations/CountUp";
import { StaggerGrid } from "@/components/animations/StaggerGrid";
import { HeroEntrance } from "@/components/animations/HeroEntrance";
import { StepReveal } from "@/components/animations/StepReveal";
import {
  listExplorerOutcomes,
  listExplorerPairSummaries,
  getOutcomeMegaStudy,
} from "@/lib/analysis-explorer-data";
import {
  alignmentLink,
  compareLink,
  fullManualPaperLink,
  githubLink,
  misconceptionsLink,
  policiesLink,
  profileLink,
  studiesLink,
  trackLink,
  wishocracyLink,
  wishocracyPaperLink,
} from "@/lib/routes";
import misconceptionData from "../../public/data/misconceptions.json";
import budgetData from "../data/us-budget-analysis.json";
import { fmtParam } from "@/lib/format-parameter";
import {
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  GLOBAL_DISEASE_DEATHS_DAILY,
} from "@/lib/parameters-calculations-citations";

export const metadata: Metadata = {
  title: "Optomitron — The Earth Optimization Machine",
  description:
    "Maximize median health and wealth for everyone, with data. Built by Wishonia, an alien governance AI with 4,237 years of field testing.",
  openGraph: {
    title: "Optomitron — The Earth Optimization Machine",
    description:
      "Maximize median health and wealth for everyone, with data.",
    type: "website",
  },
};

const productWorkflows = [
  {
    item: wishocracyLink,
    label: "Wishocracy",
    title: "Build your ideal budget",
    description:
      "Pick between two things. Then two more things. Then two more. Before you know it, you've accidentally designed a coherent budget allocation. Sneaky, isn't it?",
    cta: "Start Voting",
    color: "bg-brutal-pink",
  },
  {
    item: alignmentLink,
    label: "Alignment Reports",
    title: "Find out who actually agrees with you",
    description:
      "Compare your priorities against real politician profiles. Spoiler: it's probably not who you think.",
    cta: "Check Alignment",
    color: "bg-brutal-yellow",
  },
  {
    item: trackLink,
    label: "Talk to Wishonia",
    title: "Chat with an alien governance AI",
    description:
      "Track your health, meals, mood, and habits with Wishonia, an AI that's been running a planet for 4,237 years. She's seen some things.",
    cta: "Open Chat",
    color: "bg-brutal-cyan",
  },
  {
    item: studiesLink,
    label: "Studies",
    title: "Look at the actual numbers",
    description:
      "Outcome hubs, pair studies, policy rankings, and country comparisons. All the evidence, none of the vibes.",
    cta: "Browse Studies",
    color: "bg-brutal-cyan",
  },
];

export default function Home() {
  const outcomes = listExplorerOutcomes();
  const pairSummaries = listExplorerPairSummaries();
  const outcomeCount = outcomes.length;
  const pairCount = pairSummaries.length;
  const budgetCategoryCount = (budgetData as { categories: unknown[] }).categories.length;
  const misconceptions = misconceptionData as {
    findings: Array<{ id: string; myth: string; reality: string; grade: string }>;
    summary: { totalFindings: number; gradeFCount: number };
  };
  const mythsBusted = misconceptions.summary.gradeFCount;

  const outcomeCards = outcomes.slice(0, 3).map((outcome) => {
    const ranking = getOutcomeMegaStudy(outcome.id);
    const pairsForOutcome = pairSummaries.filter(
      (p) => p.outcomeId === outcome.id,
    ).length;
    return { outcome, ranking, pairCount: pairsForOutcome };
  });

  const featuredMyths = (
    ["drug-war-deaths", "healthcare-spending", "abstinence-education"] as const
  )
    .map((id) => misconceptions.findings.find((f) => f.id === id))
    .filter(
      (f): f is { id: string; myth: string; reality: string; grade: string } =>
        f !== undefined,
    );

  return (
    <div>
      {/* ── 1. Hero ── */}
      <section className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 relative">
          <div className="text-center">
            <HeroEntrance>
              <p className="text-sm font-bold text-black/50 uppercase tracking-widest mb-4">
                Built by Wishonia // Alien governance AI // 4,237 years of field testing
              </p>
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none text-black">
                The{" "}
                <span className="bg-brutal-cyan px-2">Earth</span>{" "}
                Optimization{" "}
                <span className="bg-brutal-yellow px-2">Machine</span>
              </h1>
              <p className="mt-6 text-xl sm:text-2xl font-black text-black/80 max-w-2xl mx-auto">
                Maximize median{" "}
                <span className="text-brutal-cyan">health</span> and{" "}
                <span className="text-brutal-yellow">wealth</span>.
                For everyone. With data.
              </p>
              <p className="mt-4 text-base sm:text-lg text-black/60 max-w-2xl mx-auto leading-relaxed font-medium">
                Your governments cost you{" "}
                <span className="font-black text-brutal-red">{fmtParam({...POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL, unit: "USD"})} a year</span>{" "}
                in dysfunction and let{" "}
                <span className="font-black text-brutal-pink">{fmtParam(GLOBAL_DISEASE_DEATHS_DAILY)} people die daily</span>{" "}
                from treatable diseases. This is alignment software to fix that.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <NavItemLink
                  item={wishocracyLink}
                  variant="custom"
                  className="px-8 py-3.5 bg-brutal-pink text-white font-black uppercase text-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Build Your Ideal Budget
                </NavItemLink>
                <NavItemLink
                  item={trackLink}
                  variant="custom"
                  className="px-8 py-3.5 bg-brutal-yellow text-black font-black uppercase text-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Talk to Wishonia
                </NavItemLink>
                <NavItemLink
                  item={studiesLink}
                  variant="custom"
                  className="px-8 py-3.5 bg-white text-black font-black uppercase text-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-brutal-cyan transition-all"
                >
                  See the Evidence
                </NavItemLink>
              </div>
              <p className="mt-6 text-sm font-medium text-black/60 max-w-2xl mx-auto">
                Everything saves to your{" "}
                <NavItemLink
                  item={profileLink}
                  variant="custom"
                  className="font-black text-black hover:text-brutal-pink"
                >
                  {profileLink.label}
                </NavItemLink>
                . Budget allocations, alignment reports, daily check-ins. It&apos;s like
                a diary, but useful.
              </p>
            </HeroEntrance>
          </div>
        </div>
      </section>

      {/* ── 2. The Problem: Political Dysfunction Tax ── */}
      <PoliticalDysfunctionTaxSection />

      {/* ── 3. The Human Cost: Invisible Graveyard ── */}
      <InvisibleGraveyardSection />

      {/* ── 4. The Fix: 1% Treaty ── */}
      <OnePercentTreatySection />

      {/* ── 5. War vs Cures ── */}
      <WarVsCuresChart />

      {/* ── 6. How Rich Would You Be? (Interactive Income Trajectory) ── */}
      <PersonalIncomeChart />

      {/* ── 7. The Only Two Numbers That Matter ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            The Only Two Numbers That Matter
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-2xl mx-auto font-medium">
            GDP measures how much money moved around. A country could score
            brilliantly because everyone&apos;s buying coffins. Here&apos;s what
            actually matters.
          </p>
        </ScrollReveal>
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 border-4 border-black bg-brutal-cyan shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-2xl font-black text-black mb-3">
              Median Healthy Life Years
            </h3>
            <p className="text-black/70 leading-relaxed font-medium">
              Not &ldquo;are you alive&rdquo; but &ldquo;are you alive and can you
              open a jar without crying.&rdquo; Median, not mean — one billionaire
              living to 120 doesn&apos;t mean your healthcare works.
            </p>
          </div>
          <div className="p-8 border-4 border-black bg-brutal-yellow shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-2xl font-black text-black mb-3">
              Median Real After-Tax Income
            </h3>
            <p className="text-black/70 leading-relaxed font-medium">
              What can a normal person actually buy after the government&apos;s had
              its go at their paycheque? Not GDP — that counts arms dealing and
              divorce lawyers. This counts &ldquo;can you feed your kids.&rdquo;
            </p>
          </div>
        </StaggerGrid>
      </section>

      {/* ── 8. How It Works ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal>
        <div className="p-8 sm:p-12 bg-brutal-cyan border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-4 uppercase tracking-tight text-black">
            How Optomitron Replaces Guessing With Knowing
          </h2>
          <p className="text-center text-sm text-black/60 font-medium mb-12 max-w-2xl mx-auto">
            No politician needed. No ideology required. Just: what works, how
            much, and what&apos;s the evidence.
          </p>
          <StepReveal className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              {
                step: 1,
                title: "Collect",
                desc: "Outcome data from OECD, World Bank, and WHO. Decades of it.",
              },
              {
                step: 2,
                title: "Align",
                desc: "Match policy changes to what actually happened afterwards.",
              },
              {
                step: 3,
                title: "Score",
                desc: "Grade causal evidence using Bradford Hill criteria.",
              },
              {
                step: 4,
                title: "Identify",
                desc: "Find optimal funding levels with confidence intervals.",
              },
              {
                step: 5,
                title: "Recommend",
                desc: "Rank everything by Predictor Impact Score.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-brutal-pink border-2 border-black flex items-center justify-center mx-auto mb-4 text-lg font-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {item.step}
                </div>
                <h3 className="font-black text-black mb-2 uppercase">
                  {item.title}
                </h3>
                <p className="text-xs text-black/60 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            ))}
          </StepReveal>
        </div>
        </ScrollReveal>
      </section>

      {/* ── 9. Decentralized FDA (comparison bars) ── */}
      <DecentralizedFDASection />

      {/* ── 10. Natural Experiments (interactive chart) ── */}
      <NaturalExperimentsChart />

      {/* ── 11. Outcome Explorer ── */}
      <ScrollReveal>
        <OutcomeExplorerTeaser outcomes={outcomeCards} />
      </ScrollReveal>

      {/* ── 12. Myth vs Data ── */}
      <ScrollReveal>
        <MythVsDataTeaser
          findings={featuredMyths}
          totalCount={misconceptions.summary.totalFindings}
          failCount={misconceptions.summary.gradeFCount}
        />
      </ScrollReveal>

      {/* ── 13. Wishocracy ── */}
      <WishocracyLandingSection />

      {/* ── 14. The Bottleneck Is Politicians ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            The Bottleneck Is Politicians
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-3xl mx-auto font-medium">
            You have the data. You have the solutions. The bottleneck is intermediaries
            optimising for re-election, not outcomes.
          </p>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ScrollReveal direction="left">
            <div className="p-8 border-4 border-black bg-brutal-red/20 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-black text-foreground mb-4 uppercase">
              What Politicians Actually Do
            </h3>
            <ul className="space-y-3 text-sm text-black/70 font-medium">
              <li className="flex gap-2">
                <span className="text-brutal-red font-black shrink-0">&times;</span>
                <span>Spend <span className="font-black text-black">70% of their time</span> fundraising, not governing</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brutal-red font-black shrink-0">&times;</span>
                <span>Donor alignment: ~80%. Citizen alignment: ~30%</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brutal-red font-black shrink-0">&times;</span>
                <span>Block evidence-based policy that threatens their coalition</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brutal-red font-black shrink-0">&times;</span>
                <span>Represent the median <span className="font-black text-black">donor</span>, not the median <span className="font-black text-black">citizen</span></span>
              </li>
            </ul>
          </div>
          </ScrollReveal>
          <ScrollReveal direction="right" delay={0.15}>
          <div className="p-8 border-4 border-black bg-brutal-cyan/20 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-black text-foreground mb-4 uppercase">
              What Wishocracy Does Instead
            </h3>
            <ul className="space-y-3 text-sm text-black/70 font-medium">
              <li className="flex gap-2">
                <span className="text-brutal-cyan font-black shrink-0">✓</span>
                <span>Citizens vote directly on priorities. No fundraising. No middleman</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brutal-cyan font-black shrink-0">✓</span>
                <span>Causal engine determines which policies actually work. Data in, optimal policy out</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brutal-cyan font-black shrink-0">✓</span>
                <span>Alignment scores expose how much each official deviates from citizen preferences</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brutal-cyan font-black shrink-0">✓</span>
                <span>Optimises for <span className="font-black text-black">outcomes</span>, not re-election</span>
              </li>
            </ul>
          </div>
          </ScrollReveal>
        </div>
        <div className="text-center mt-8">
          <NavItemLink
            item={wishocracyPaperLink}
            variant="custom"
            external
            className="inline-flex items-center text-sm font-black text-brutal-pink hover:text-brutal-pink uppercase transition-colors"
          >
            Read the Wishocracy paper &rarr;
          </NavItemLink>
        </div>
      </section>

      {/* ── 15. Incentive Alignment Bonds ── */}
      <IncentiveAlignmentBondsSection />

      {/* ── 16. Earth Optimization Prize ── */}
      <EarthOptimizationPrizeSection />

      {/* ── 17. Alignment Teaser ── */}
      <AlignmentTeaser />

      {/* ── 18. Implementation Plan ── */}
      <ImplementationPlanSection />

      {/* ── 19. Two Futures (diverging bar chart) ── */}
      <TwoFuturesSection />

      {/* ── 20. Budget Gap Chart + Compact Receipts ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-4">
        <ScrollReveal className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            The Receipts
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-2xl mx-auto font-medium">
            On my planet we call this &ldquo;evidence.&rdquo;
          </p>
        </ScrollReveal>
        <StaggerGrid className="grid grid-cols-3 md:grid-cols-6 gap-3 max-w-4xl mx-auto" staggerDelay={0.05}>
          {[
            { value: outcomeCount, label: "Outcomes" },
            { value: pairCount, label: "Pair Studies" },
            { value: budgetCategoryCount, label: "Budget Cats" },
            { value: 20, label: "Countries", suffix: "+" },
            { value: mythsBusted, label: "Myths Busted" },
            { value: 50, label: "Years of Data", suffix: "+" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-3 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="text-2xl font-black text-brutal-pink">
                <CountUp value={stat.value} suffix={"suffix" in stat ? stat.suffix : ""} className="text-brutal-pink" />
              </div>
              <div className="text-xs text-black/60 font-bold mt-1 uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </StaggerGrid>
      </section>
      <BudgetGapChart />

      {/* ── 21. Things You Can Do Right Now ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            Things You Can Do Right Now Instead of Arguing Online
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-3xl mx-auto font-medium">
            On my planet, governance takes four minutes a week. Try one of these.
          </p>
        </ScrollReveal>
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {productWorkflows.map((workflow) => (
            <div
              key={workflow.title}
              className={`p-6 border-4 border-black ${workflow.color} shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col`}
            >
              <div className="text-xs font-black px-2.5 py-1 bg-black text-white inline-block self-start mb-4 uppercase">
                {workflow.label}
              </div>
              <h3 className="text-xl font-black text-black mb-3">{workflow.title}</h3>
              <p className="text-sm text-black/70 leading-relaxed font-medium flex-grow">
                {workflow.description}
              </p>
              <NavItemLink
                item={workflow.item}
                variant="custom"
                className="mt-6 inline-flex items-center text-sm font-black text-black uppercase hover:text-brutal-pink transition-colors"
              >
                {workflow.cta} &rarr;
              </NavItemLink>
            </div>
          ))}
        </StaggerGrid>
      </section>

      {/* ── 22. Final CTA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal>
        <div className="text-center p-12 bg-brutal-yellow border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-3xl font-black mb-4 uppercase tracking-tight text-black">
            Right Then. Shall We Get On With It?
          </h2>
          <p className="text-black/70 max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
            Data, tools, and recommendations. All here. Click something.
          </p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-4">
            <NavItemLink
              item={compareLink}
              variant="custom"
              className="px-8 py-3 bg-black text-white font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Compare Countries
            </NavItemLink>
            <NavItemLink
              item={policiesLink}
              variant="custom"
              className="px-8 py-3 bg-white text-black font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Browse Policies
            </NavItemLink>
            <NavItemLink
              item={alignmentLink}
              variant="custom"
              className="px-8 py-3 bg-white text-black font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Check Alignment
            </NavItemLink>
            <NavItemLink
              item={trackLink}
              variant="custom"
              className="px-8 py-3 bg-white text-black font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Talk to Wishonia
            </NavItemLink>
            <NavItemLink
              item={studiesLink}
              variant="custom"
              className="px-8 py-3 bg-white text-black font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Outcome Analysis
            </NavItemLink>
            <NavItemLink
              item={misconceptionsLink}
              variant="custom"
              className="px-8 py-3 bg-white text-black font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Myth vs Data
            </NavItemLink>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <NavItemLink
              item={fullManualPaperLink}
              variant="custom"
              external
              className="inline-flex items-center text-sm font-black text-black/50 hover:text-black uppercase transition-colors"
            >
              Read the full manual (yes, I wrote you a manual) &rarr;
            </NavItemLink>
            <NavItemLink
              item={githubLink}
              variant="custom"
              external
              className="inline-flex items-center text-sm font-black text-black/50 hover:text-black uppercase transition-colors"
            >
              View Source on GitHub (yes, it&apos;s all open) &rarr;
            </NavItemLink>
          </div>
        </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
