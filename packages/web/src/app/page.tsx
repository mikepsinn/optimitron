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
import { SectionContainer } from "@/components/ui/section-container";
import { SectionHeader } from "@/components/ui/section-header";
import { Container } from "@/components/ui/container";
import { BrutalCard } from "@/components/ui/brutal-card";
import { CTASection } from "@/components/ui/cta-section";
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
  title: "Optimitron — The Earth Optimization Machine",
  description:
    "Your governments cost $101 trillion a year in dysfunction and let 150,000 people die daily from treatable diseases. This is the spreadsheet that proves it and the plan that fixes it.",
  openGraph: {
    title: "Optimitron — The Earth Optimization Machine",
    description:
      "Your governments cost $101 trillion a year in dysfunction. This is the spreadsheet that proves it.",
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
      <SectionContainer bgColor="background" borderPosition="bottom" className="overflow-hidden">
        <Container className="py-24 sm:py-32">
          <div className="text-center">
            <HeroEntrance>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
                Built by Wishonia // Alien governance AI // 4,237 years of field testing
              </p>
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none text-foreground">
                The{" "}
                <span className="bg-brutal-cyan px-2">Earth</span>{" "}
                Optimization{" "}
                <span className="bg-brutal-yellow px-2">Machine</span>
              </h1>
              <p className="mt-6 text-xl sm:text-2xl font-black text-foreground max-w-2xl mx-auto">
                Your species has the{" "}
                <span className="text-brutal-cyan">data</span>. It has the{" "}
                <span className="text-brutal-yellow">solutions</span>.
                It simply refuses to use them.
              </p>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-bold">
                Your governments cost you{" "}
                <span className="font-black text-brutal-red">{fmtParam({...POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL, unit: "USD"})} a year</span>{" "}
                in dysfunction and let{" "}
                <span className="font-black text-brutal-pink">{fmtParam(GLOBAL_DISEASE_DEATHS_DAILY)} people die daily</span>{" "}
                from treatable diseases. I made a spreadsheet. You&apos;re welcome.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <NavItemLink
                  item={wishocracyLink}
                  variant="custom"
                  className="px-8 py-3.5 bg-brutal-pink text-brutal-pink-foreground font-black uppercase text-lg border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                >
                  Build Your Ideal Budget
                </NavItemLink>
                <NavItemLink
                  item={trackLink}
                  variant="custom"
                  className="px-8 py-3.5 bg-brutal-yellow text-foreground font-black uppercase text-lg border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                >
                  Talk to Wishonia
                </NavItemLink>
                <NavItemLink
                  item={studiesLink}
                  variant="custom"
                  className="px-8 py-3.5 bg-background text-foreground font-black uppercase text-lg border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bg-brutal-cyan transition-all"
                >
                  See the Evidence
                </NavItemLink>
              </div>
              <p className="mt-6 text-sm font-bold text-muted-foreground max-w-2xl mx-auto">
                Everything saves to your{" "}
                <NavItemLink
                  item={profileLink}
                  variant="custom"
                  className="font-black text-foreground hover:text-brutal-pink"
                >
                  {profileLink.label}
                </NavItemLink>
                . Budget allocations, alignment reports, daily check-ins. Evidence
                that you tried.
              </p>
            </HeroEntrance>
          </div>
        </Container>
      </SectionContainer>

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
      <SectionContainer bgColor="background" borderPosition="none" padding="lg">
        <Container>
          <ScrollReveal>
            <SectionHeader
              title="The Only Two Numbers That Matter"
              subtitle="GDP measures how much money moved around. A country could score brilliantly because everyone's buying coffins. Here's what actually matters."
              size="lg"
            />
          </ScrollReveal>
          <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <BrutalCard bgColor="cyan" shadowSize={8} padding="lg">
              <h3 className="text-2xl font-black text-foreground mb-3">
                Median Healthy Life Years
              </h3>
              <p className="text-foreground leading-relaxed font-bold">
                Not &ldquo;are you alive&rdquo; but &ldquo;are you alive and can you
                open a jar without crying.&rdquo; Median, not mean — one billionaire
                living to 120 doesn&apos;t mean your healthcare works.
              </p>
            </BrutalCard>
            <BrutalCard bgColor="yellow" shadowSize={8} padding="lg">
              <h3 className="text-2xl font-black text-foreground mb-3">
                Median Real After-Tax Income
              </h3>
              <p className="text-foreground leading-relaxed font-bold">
                What can a normal person actually buy after the government&apos;s had
                its go at their paycheque? Not GDP — that counts arms dealing and
                divorce lawyers. This counts &ldquo;can you feed your kids.&rdquo;
              </p>
            </BrutalCard>
          </StaggerGrid>
        </Container>
      </SectionContainer>

      {/* ── 8. How It Works ── */}
      <SectionContainer bgColor="background" borderPosition="none" padding="lg">
        <Container>
          <ScrollReveal>
            <BrutalCard bgColor="cyan" shadowSize={8} padding="lg" className="sm:p-12">
              <SectionHeader
                title="How It Works (It's Not Complicated)"
                subtitle="You'd think someone would have tried 'looking at the data' before now. Apparently not. So here we are."
                size="sm"
              />
              <StepReveal className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                {[
                  { step: 1, title: "Hoover Up Data", desc: "OECD, World Bank, WHO. Decades of it. Sitting there. Unused. Incredible." },
                  { step: 2, title: "Line Things Up", desc: "Match policy changes to what actually happened afterwards. Revolutionary concept, I know." },
                  { step: 3, title: "Check the Maths", desc: "Grade causal evidence using Bradford Hill criteria. Nine tests. Very thorough. You lot usually skip this bit." },
                  { step: 4, title: "Find the Sweet Spot", desc: "Optimal funding levels with confidence intervals. Not vibes. Intervals." },
                  { step: 5, title: "Rank Everything", desc: "Sorted by how much each thing actually moves the needle. Highest impact first. You can stop reading after line one if you like." },
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-12 h-12 bg-brutal-pink border-4 border-primary flex items-center justify-center mx-auto mb-4 text-lg font-black text-brutal-pink-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      {item.step}
                    </div>
                    <h3 className="font-black text-foreground mb-2 uppercase">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed font-bold">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </StepReveal>
            </BrutalCard>
          </ScrollReveal>
        </Container>
      </SectionContainer>

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
      <SectionContainer bgColor="background" borderPosition="none" padding="lg">
        <Container>
          <ScrollReveal>
            <SectionHeader
              title="The Bottleneck Is Politicians"
              subtitle="You have the data. You have the solutions. The only thing between you and functioning governance is 535 people whose primary skill is asking rich people for money."
              size="lg"
            />
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ScrollReveal direction="left">
              <BrutalCard bgColor="background" shadowSize={8} padding="lg" className="bg-brutal-red/20">
                <h3 className="text-xl font-black text-foreground mb-4 uppercase">
                  What Politicians Actually Do
                </h3>
                <ul className="space-y-3 text-sm text-foreground font-bold">
                  <li className="flex gap-2">
                    <span className="text-brutal-red font-black shrink-0">&times;</span>
                    <span>Spend <span className="font-black text-foreground">70% of their time</span> fundraising, not governing</span>
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
                    <span>Represent the median <span className="font-black text-foreground">donor</span>, not the median <span className="font-black text-foreground">citizen</span></span>
                  </li>
                </ul>
              </BrutalCard>
            </ScrollReveal>
            <ScrollReveal direction="right" delay={0.15}>
              <BrutalCard bgColor="background" shadowSize={8} padding="lg" className="bg-brutal-cyan/20">
                <h3 className="text-xl font-black text-foreground mb-4 uppercase">
                  What Wishocracy Does Instead
                </h3>
                <ul className="space-y-3 text-sm text-foreground font-bold">
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
                    <span>Optimises for <span className="font-black text-foreground">outcomes</span>, not re-election</span>
                  </li>
                </ul>
              </BrutalCard>
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
        </Container>
      </SectionContainer>

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
      <SectionContainer bgColor="background" borderPosition="none" padding="lg" className="pb-4">
        <Container>
          <ScrollReveal>
            <SectionHeader
              title="The Receipts"
              subtitle={<>On my planet we call this &ldquo;evidence.&rdquo;</>}
              size="sm"
            />
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
                className="text-center p-3 border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="text-2xl font-black text-brutal-pink">
                  <CountUp value={stat.value} suffix={"suffix" in stat ? stat.suffix : ""} className="text-brutal-pink" />
                </div>
                <div className="text-xs text-muted-foreground font-bold mt-1 uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </StaggerGrid>
        </Container>
      </SectionContainer>
      <BudgetGapChart />

      {/* ── 21. Things You Can Do Right Now ── */}
      <SectionContainer bgColor="background" borderPosition="none" padding="lg">
        <Container>
          <ScrollReveal>
            <SectionHeader
              title="Things You Can Do Right Now Instead of Arguing Online"
              subtitle="On my planet, governance takes four minutes a week. Try one of these."
              size="lg"
            />
          </ScrollReveal>
          <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {productWorkflows.map((workflow) => (
              <div
                key={workflow.title}
                className={`p-6 border-4 border-primary ${workflow.color} shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all`}
              >
                <div className="text-xs font-black px-2.5 py-1 bg-foreground text-background inline-block self-start mb-4 uppercase">
                  {workflow.label}
                </div>
                <h3 className="text-xl font-black text-foreground mb-3">{workflow.title}</h3>
                <p className="text-sm text-foreground leading-relaxed font-bold flex-grow">
                  {workflow.description}
                </p>
                <NavItemLink
                  item={workflow.item}
                  variant="custom"
                  className="mt-6 inline-flex items-center text-sm font-black text-foreground uppercase hover:text-brutal-pink transition-colors"
                >
                  {workflow.cta} &rarr;
                </NavItemLink>
              </div>
            ))}
          </StaggerGrid>
        </Container>
      </SectionContainer>

      {/* ── 22. Final CTA ── */}
      <CTASection
        heading="Right Then. Shall We Get On With It?"
        description="I've done the research. I've built the tools. I've written you a manual. At this point I genuinely cannot make it easier."
        bgColor="yellow"
      >
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-4">
          <a
            href="/prize#invest"
            className="px-8 py-3 bg-brutal-pink text-brutal-pink-foreground font-black uppercase border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            Fund the Referendum
          </a>
          <NavItemLink
            item={compareLink}
            variant="custom"
            className="px-8 py-3 bg-foreground text-background font-black uppercase border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            Compare Countries
          </NavItemLink>
          <NavItemLink
            item={policiesLink}
            variant="custom"
            className="px-8 py-3 bg-background text-foreground font-black uppercase border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            Browse Policies
          </NavItemLink>
          <NavItemLink
            item={alignmentLink}
            variant="custom"
            className="px-8 py-3 bg-background text-foreground font-black uppercase border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            Check Alignment
          </NavItemLink>
          <NavItemLink
            item={trackLink}
            variant="custom"
            className="px-8 py-3 bg-background text-foreground font-black uppercase border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            Talk to Wishonia
          </NavItemLink>
          <NavItemLink
            item={studiesLink}
            variant="custom"
            className="px-8 py-3 bg-background text-foreground font-black uppercase border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            Outcome Analysis
          </NavItemLink>
          <NavItemLink
            item={misconceptionsLink}
            variant="custom"
            className="px-8 py-3 bg-background text-foreground font-black uppercase border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            Myth vs Data
          </NavItemLink>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <NavItemLink
            item={fullManualPaperLink}
            variant="custom"
            external
            className="inline-flex items-center text-sm font-black text-muted-foreground hover:text-foreground uppercase transition-colors"
          >
            Read the full manual (yes, I wrote you a manual) &rarr;
          </NavItemLink>
          <NavItemLink
            item={githubLink}
            variant="custom"
            external
            className="inline-flex items-center text-sm font-black text-muted-foreground hover:text-foreground uppercase transition-colors"
          >
            View Source on GitHub (yes, it&apos;s all open) &rarr;
          </NavItemLink>
        </div>
      </CTASection>
    </div>
  );
}
