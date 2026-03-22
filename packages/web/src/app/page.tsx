import type { Metadata } from "next";
import { OnePercentTreatySection } from "@/components/landing/OnePercentTreatySection";
import { TwoFuturesSection } from "@/components/landing/TwoFuturesSection";
import { LandingProblemSection } from "@/components/landing/LandingProblemSection";
import { LandingPrizeOffer } from "@/components/landing/LandingPrizeOffer";
import { LandingFAQSection } from "@/components/landing/LandingFAQSection";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { CountUp } from "@/components/animations/CountUp";
import { StaggerGrid } from "@/components/animations/StaggerGrid";
import { HeroEntrance } from "@/components/animations/HeroEntrance";
import { SectionContainer } from "@/components/ui/section-container";
import { SectionHeader } from "@/components/ui/section-header";
import { Container } from "@/components/ui/container";
import { CTASection } from "@/components/ui/cta-section";
import {
  listExplorerOutcomes,
  listExplorerPairSummaries,
} from "@/lib/analysis-explorer-data";
import {
  alignmentLink,
  prizeLink,
  profileLink,
  studiesLink,
  trackLink,
  wishocracyLink,
  misconceptionsLink,
  scoreboardLink,
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
    item: prizeLink,
    label: "Game",
    title: "Play the Earth Optimization Game",
    description:
      "Deposit USDC. Recruit verified voters. Earn VOTE points. The only way to lose is to not play.",
    cta: "Join the Game",
    color: "bg-brutal-pink",
  },
  {
    item: scoreboardLink,
    label: "Scoreboard",
    title: "Humanity's Scoreboard",
    description:
      "Live game metrics: health, income, pool size, verified participants. The coalition size, visible to everyone.",
    cta: "View Scoreboard",
    color: "bg-brutal-cyan",
  },
  {
    item: wishocracyLink,
    label: "Wishocracy",
    title: "Build your ideal budget",
    description:
      "Pick between two things. Then two more. Before you know it, you've designed a coherent budget. Sneaky, isn't it?",
    cta: "Start Voting",
    color: "bg-brutal-yellow",
  },
  {
    item: alignmentLink,
    label: "Alignment",
    title: "Who actually agrees with you?",
    description:
      "Compare your priorities against real politician voting records. Spoiler: it's not who you think.",
    cta: "Check Alignment",
    color: "bg-brutal-cyan",
  },
  {
    item: trackLink,
    label: "Wishonia",
    title: "Chat with an alien governance AI",
    description:
      "Track health, meals, mood, and habits with an AI that's been running a planet for 4,237 years.",
    cta: "Open Chat",
    color: "bg-brutal-cyan",
  },
  {
    item: studiesLink,
    label: "Studies",
    title: "Look at the actual numbers",
    description:
      "Outcome hubs, pair studies, policy rankings, country comparisons. All evidence, no vibes.",
    cta: "Browse Studies",
    color: "bg-brutal-yellow",
  },
  {
    item: misconceptionsLink,
    label: "Myth vs Data",
    title: "Things your government got wrong",
    description:
      "War on Drugs, healthcare spending, abstinence education — graded against real data.",
    cta: "See the Myths",
    color: "bg-brutal-pink",
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
                <span className="font-black text-brutal-red">
                  {fmtParam({...POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL, unit: "USD"})} a year
                </span>{" "}
                in dysfunction and let{" "}
                <span className="font-black text-brutal-pink">
                  {fmtParam({...GLOBAL_DISEASE_DEATHS_DAILY, unit: ""})} people die daily
                </span>{" "}
                from treatable diseases. I made a spreadsheet. You&apos;re welcome.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="/prize#invest"
                  className="px-8 py-3.5 bg-brutal-pink text-brutal-pink-foreground font-black uppercase text-lg border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                >
                  Fund the Referendum
                </a>
                <a
                  href="#win-either-way"
                  className="px-8 py-3.5 bg-brutal-yellow text-foreground font-black uppercase text-lg border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                >
                  See Why It Can&apos;t Lose
                </a>
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

      {/* ── 2. The Cost of Doing Nothing ── */}
      <LandingProblemSection />

      {/* ── 3. The 1% Treaty ── */}
      <OnePercentTreatySection />

      {/* ── 4. Win Either Way (Prize Offer) ── */}
      <div id="win-either-way">
        <LandingPrizeOffer />
      </div>

      {/* ── 5. Two Futures ── */}
      <TwoFuturesSection />

      {/* ── 6. Frequently Asked Objections ── */}
      <LandingFAQSection />

      {/* ── 7. The Receipts ── */}
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

      {/* ── 8. Things You Can Do + Final CTA ── */}
      <SectionContainer bgColor="background" borderPosition="none" padding="lg">
        <Container>
          <ScrollReveal>
            <SectionHeader
              title="Things You Can Do Right Now Instead of Arguing Online"
              subtitle="On my planet, governance takes four minutes a week. Try one of these."
              size="lg"
            />
          </ScrollReveal>
          <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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

      <CTASection
        heading="Right Then. Shall We Get On With It?"
        description="I've done the research. I've built the tools. I've written you a manual. At this point I genuinely cannot make it easier."
        bgColor="yellow"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/prize#invest"
            className="px-8 py-3 bg-brutal-pink text-brutal-pink-foreground font-black uppercase border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            Fund the Referendum
          </a>
          <NavItemLink
            item={wishocracyLink}
            variant="custom"
            className="px-8 py-3 bg-foreground text-background font-black uppercase border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            Express Your Preferences
          </NavItemLink>
        </div>
      </CTASection>
    </div>
  );
}
