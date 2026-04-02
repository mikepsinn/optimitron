import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowToWinSection } from "@/components/landing/HowToWinSection";
import { HowToPlaySection } from "@/components/landing/HowToPlaySection";
import { WhyPlaySection } from "@/components/landing/WhyPlaySection";
import { LandingFAQSection } from "@/components/landing/LandingFAQSection";
import { TLDRSection } from "@/components/landing/TLDRSection";
import TreatyVoteSection from "@/components/landing/TreatyVoteSection";
import { InvisibleGraveyardSection } from "@/components/landing/InvisibleGraveyardSection";
import { DecentralizedFDASection } from "@/components/landing/DecentralizedFDASection";
import { WishocracyPreview } from "@/components/landing/WishocracyPreview";
import { TwoFuturesSection } from "@/components/landing/TwoFuturesSection";
import { OnePercentTreatySection } from "@/components/landing/OnePercentTreatySection";
import { PoliticalDysfunctionTaxSection } from "@/components/landing/PoliticalDysfunctionTaxSection";
import { OptimizedGovernancePreview } from "@/components/landing/OptimizedGovernancePreview";
import { GovernmentReportCardPreview } from "@/components/landing/GovernmentReportCardPreview";
import { PoliticianScorecardTable } from "@/components/shared/PoliticianScorecardTable";
import {
  POLITICIAN_SCORECARDS,
  SYSTEM_WIDE_MILITARY_TO_TRIALS_RATIO,
} from "@optimitron/data/datasets/us-politician-scorecards";
import { OutcomeLabelsSection } from "@/components/dfda/OutcomeLabelsSection";
import { ComparativeEffectivenessSection } from "@/components/dfda/ComparativeEffectivenessSection";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { SectionContainer } from "@/components/ui/section-container";
import { SectionHeader } from "@/components/ui/section-header";
import { Container } from "@/components/ui/container";
import { CTASection } from "@/components/ui/cta-section";
import {
  alignmentLink,
  prizeLink,
  ROUTES,
  opgLink,
  obgLink,
  trackLink,
  wishocracyLink,
  scoreboardLink,
  toolsLink,
  governmentsLink,
  politicianLeaderboardLink,
  agenciesLink,
  demoLink,
  iabLink,
} from "@/lib/routes";
import { GameCTA } from "@/components/ui/game-cta";
import { DemoVideoSection } from "@/components/landing/DemoVideoSection";
import { OptimalPolicyPreview } from "@/components/landing/OptimalPolicyPreview";
import { OptimalBudgetPreview } from "@/components/landing/OptimalBudgetPreview";
import { CTA, TAGLINES } from "@/lib/messaging";
import {
  DESTRUCTIVE_ECONOMY_35PCT_YEAR,
  VOTE_TOKEN_VALUE,
  GLOBAL_COORDINATION_TARGET_SUPPORTERS,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
export const metadata: Metadata = {
  title: "Optimitron — The Earth Optimization Game",
  description: `${TAGLINES.gameObjective} ${TAGLINES.everyPlayerWins}`,
  openGraph: {
    title: "Optimitron — The Earth Optimization Game",
    description: TAGLINES.gameObjective,
    type: "website",
  },
};

/** Each card uses the NavItem as the single source of truth for title + description. */
const productWorkflows: { item: typeof prizeLink; cta: string; color: string; textColor: string }[] = [
  { item: prizeLink, cta: CTA.playTheGame, color: "bg-brutal-pink", textColor: "text-brutal-pink-foreground" },
  { item: scoreboardLink, cta: CTA.viewScoreboard, color: "bg-brutal-cyan", textColor: "text-brutal-cyan-foreground" },
  { item: wishocracyLink, cta: CTA.startVoting, color: "bg-brutal-yellow", textColor: "text-brutal-yellow-foreground" },
  { item: alignmentLink, cta: CTA.checkAlignment, color: "bg-brutal-cyan", textColor: "text-brutal-cyan-foreground" },
  { item: trackLink, cta: CTA.openChat, color: "bg-brutal-cyan", textColor: "text-brutal-cyan-foreground" },
  { item: opgLink, cta: "See Policy Grades", color: "bg-brutal-cyan", textColor: "text-brutal-cyan-foreground" },
  { item: obgLink, cta: "See Budget Analysis", color: "bg-brutal-red", textColor: "text-brutal-red-foreground" },
  { item: governmentsLink, cta: "See Report Cards", color: "bg-brutal-red", textColor: "text-brutal-red-foreground" },
  { item: iabLink, cta: "Learn More", color: "bg-brutal-yellow", textColor: "text-brutal-yellow-foreground" },
  { item: demoLink, cta: "Watch Demo", color: "bg-brutal-cyan", textColor: "text-brutal-cyan-foreground" },
];

export default function Home() {
  return (
    <div>
      {/* ── 1. Hero — Game name + objective ── */}
      <HeroSection />

      {/* ── 1b. Demo Video — show don't tell ── */}
      <DemoVideoSection />

      {/* ── 2. TLDR — It's 2 buttons, tell your friends, done ── */}
      <TLDRSection />

      {/* ── 3. Vote — The core game action ── */}
      <TreatyVoteSection />

      {/* ── 3. How to Win — Scoreboard + win/lose conditions ── */}
      <HowToWinSection />

      {/* ── 4. How to Play — 4-step player journey ── */}
      <HowToPlaySection />

      {/* ── 5. What Happens If Nobody Plays — Stakes ── */}
      <WhyPlaySection />

      {/* ── ARC 1: Money & Policy Evidence ── */}

      {/* ── 6. The $101T Dysfunction Tax ── */}
      <PoliticalDysfunctionTaxSection />

      {/* ── 7. The Evidence — policies graded A-F ── */}
      <OptimalPolicyPreview />

      {/* ── 8. The Evidence — budgets: 4× overspend ── */}
      <OptimalBudgetPreview />

      {/* ── 9. The Solution — 1% Treaty ── */}
      <OnePercentTreatySection />

      {/* ── 10. Wishocracy — allocate your budget ── */}
      <WishocracyPreview />

      {/* ── ARC 2: Health & Treatment ── */}

      {/* ── 11. The Health Crisis — Invisible Graveyard ── */}
      <InvisibleGraveyardSection />

      {/* ── 12. The Tool — Decentralized FDA ── */}
      <DecentralizedFDASection />

      {/* ── 12b. Outcome Labels — what dFDA actually produces ── */}
      <OutcomeLabelsSection />

      {/* ── 12c. Treatment Rankings — ranked by what works ── */}
      <ComparativeEffectivenessSection />

      {/* ── 10. Two Futures — Wishonia vs Moronia ── */}
      <TwoFuturesSection />

      {/* ── 13. Government Report Cards — mini leaderboard ── */}
      <GovernmentReportCardPreview />

      {/* ── 14. Politician Leaderboard — mini table ── */}
      <SectionContainer bgColor="foreground" borderPosition="top" padding="lg">
        <Container>
          <SectionHeader
            title="Politician Leaderboard"
            subtitle="How your representatives actually vote vs what you actually wanted. The receipts."
            size="lg"
          />
          <PoliticianScorecardTable
            scorecards={POLITICIAN_SCORECARDS.map((p) => ({
              bioguideId: p.id.toUpperCase(),
              name: p.name,
              party: p.party,
              state: p.district ?? "",
              chamber: p.chamber ?? "",
              militaryDollarsVotedFor: p.destructiveDollarsVotedFor,
              clinicalTrialDollarsVotedFor: p.clinicalTrialDollarsVotedFor,
              ratio: p.militaryToTrialsRatio,
            }))}
            systemWideRatio={SYSTEM_WIDE_MILITARY_TO_TRIALS_RATIO}
            limit={5}
          />
          <div className="mt-8 text-center">
            <GameCTA href="/governments/US/politicians" variant="cyan">
              See All Politicians
            </GameCTA>
          </div>
        </Container>
      </SectionContainer>

      {/* ── 15. Optimized Governance — agency grid ── */}
      <OptimizedGovernancePreview />

      {/* ── 16. Select Mode — Other game modes ── */}
      <SectionContainer bgColor="background" borderPosition="none" padding="lg">
        <Container>
          <SectionHeader
            title="Select Mode"
            subtitle="On my planet, governance takes four minutes a week. Pick a mode."
            size="lg"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {productWorkflows.map((workflow) => (
              <div
                key={workflow.item.href}
                className={`p-6 border-4 border-primary ${workflow.color} ${workflow.textColor} shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all`}
              >
                <div className="text-xs font-black px-2.5 py-1 bg-foreground text-background inline-block self-start mb-4 uppercase">
                  {workflow.item.emoji} {workflow.item.label}
                </div>
                <p className="text-base sm:text-lg leading-relaxed font-bold flex-grow">
                  {workflow.item.description}
                </p>
                <NavItemLink
                  item={workflow.item}
                  variant="custom"
                  className="mt-6 inline-flex items-center text-sm font-black uppercase hover:opacity-70 transition-colors"
                >
                  {workflow.cta} &rarr;
                </NavItemLink>
              </div>
            ))}
          </div>
          {/* Armory link */}
          <div className="mt-8 text-center">
            <NavItemLink
              item={toolsLink}
              variant="custom"
              className="text-lg font-black text-foreground uppercase hover:text-brutal-pink transition-colors"
            >
              Want more tools? Visit The Armory &rarr;
            </NavItemLink>
          </div>
        </Container>
      </SectionContainer>

      {/* ── 7. Frequently Asked Objections ── */}
      <LandingFAQSection />

      {/* ── 8. Final CTA ── */}
      <CTASection
        heading="The Clock Is Running"
        description={<>The parasitic economy hits 35% of GDP by <ParameterValue param={DESTRUCTIVE_ECONOMY_35PCT_YEAR} display="integer" />. Your VOTE points are worth <ParameterValue param={VOTE_TOKEN_VALUE} display="withUnit" /> if <ParameterValue param={GLOBAL_COORDINATION_TARGET_SUPPORTERS} figures={1} /> people play. Worth nothing if they don&apos;t.</>}
        bgColor="yellow"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <GameCTA href="#vote" variant="primary">
            {CTA.playNow}
          </GameCTA>
          <GameCTA href="/prize" variant="secondary">
            {CTA.seeTheMath}
          </GameCTA>
          <GameCTA href={ROUTES.wishocracy} variant="cyan">
            {CTA.expressPreferences}
          </GameCTA>
        </div>
      </CTASection>
    </div>
  );
}
