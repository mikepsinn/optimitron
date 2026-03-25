import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowToWinSection } from "@/components/landing/HowToWinSection";
import { HowToPlaySection } from "@/components/landing/HowToPlaySection";
import { WhyPlaySection } from "@/components/landing/WhyPlaySection";
import { LandingFAQSection } from "@/components/landing/LandingFAQSection";
import { TLDRSection } from "@/components/landing/TLDRSection";
import TreatyVoteSection from "@/components/landing/TreatyVoteSection";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { SectionContainer } from "@/components/ui/section-container";
import { SectionHeader } from "@/components/ui/section-header";
import { Container } from "@/components/ui/container";
import { CTASection } from "@/components/ui/cta-section";
import {
  alignmentLink,
  prizeLink,
  ROUTES,
  studiesLink,
  trackLink,
  wishocracyLink,
  misconceptionsLink,
  scoreboardLink,
  toolsLink,
} from "@/lib/routes";
import { GameCTA } from "@/components/ui/game-cta";
import { CTA, TAGLINES } from "@/lib/messaging";
import { fmtParam } from "@/lib/format-parameter";
import {
  DESTRUCTIVE_ECONOMY_35PCT_YEAR,
  VOTE_TOKEN_POTENTIAL_VALUE,
  GLOBAL_COORDINATION_TARGET_SUPPORTERS,
} from "@/lib/parameters-calculations-citations";

export const metadata: Metadata = {
  title: "Optimitron — The Earth Optimization Game",
  description: `${TAGLINES.gameObjective} ${TAGLINES.everyPlayerWins}`,
  openGraph: {
    title: "Optimitron — The Earth Optimization Game",
    description: TAGLINES.gameObjective,
    type: "website",
  },
};

const productWorkflows = [
  {
    item: prizeLink,
    label: "GAME",
    title: "PLAY THE EARTH OPTIMIZATION GAME",
    description:
      "DEPOSIT USDC. RECRUIT VERIFIED VOTERS. EARN VOTE POINTS. THE ONLY WAY TO LOSE IS TO NOT PLAY.",
    cta: CTA.playTheGame,
    color: "neon-box-pink border-arcade-pink",
    textColor: "neon-pink",
  },
  {
    item: scoreboardLink,
    label: "SCOREBOARD",
    title: "HUMANITY'S SCOREBOARD",
    description:
      "LIVE GAME METRICS: HEALTH, INCOME, POOL SIZE, VERIFIED PARTICIPANTS. THE COALITION SIZE, VISIBLE TO EVERYONE.",
    cta: CTA.viewScoreboard,
    color: "neon-box-cyan border-arcade-cyan",
    textColor: "neon-cyan",
  },
  {
    item: wishocracyLink,
    label: "WISHOCRACY",
    title: "BUILD YOUR IDEAL BUDGET",
    description:
      "PICK BETWEEN TWO THINGS. THEN TWO MORE. BEFORE YOU KNOW IT, YOU'VE DESIGNED A COHERENT BUDGET. SNEAKY, ISN'T IT?",
    cta: CTA.startVoting,
    color: "neon-box-yellow border-arcade-yellow",
    textColor: "neon-yellow",
  },
  {
    item: alignmentLink,
    label: "ALIGNMENT",
    title: "WHO ACTUALLY AGREES WITH YOU?",
    description:
      "COMPARE YOUR PRIORITIES AGAINST REAL POLITICIAN VOTING RECORDS. SPOILER: IT'S NOT WHO YOU THINK.",
    cta: CTA.checkAlignment,
    color: "neon-box-green border-arcade-green",
    textColor: "neon-green",
  },
  {
    item: trackLink,
    label: "WISHONIA",
    title: "CHAT WITH AN ALIEN",
    description:
      "TRACK HEALTH, MEALS, MOOD, AND HABITS WITH AN ALIEN WHO'S BEEN RUNNING A PLANET FOR 4,237 YEARS.",
    cta: CTA.openChat,
    color: "neon-box-cyan border-arcade-cyan",
    textColor: "neon-cyan",
  },
  {
    item: studiesLink,
    label: "STUDIES",
    title: "LOOK AT THE ACTUAL NUMBERS",
    description:
      "OUTCOME HUBS, PAIR STUDIES, POLICY RANKINGS, COUNTRY COMPARISONS. ALL EVIDENCE, NO VIBES.",
    cta: CTA.browseStudies,
    color: "neon-box-yellow border-arcade-yellow",
    textColor: "neon-yellow",
  },
  {
    item: misconceptionsLink,
    label: "MYTH VS DATA",
    title: "THINGS YOUR GOVERNMENT GOT WRONG",
    description:
      "WAR ON DRUGS, HEALTHCARE SPENDING, ABSTINENCE EDUCATION — GRADED AGAINST REAL DATA.",
    cta: CTA.seeTheMmyths,
    color: "neon-box-pink border-arcade-pink",
    textColor: "neon-pink",
  },
];

export default function Home() {
  return (
    <div>
      {/* ── 1. Hero — Game name + objective ── */}
      <HeroSection />

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

      {/* ── 6. Select Mode — Other game modes ── */}
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
                key={workflow.title}
                className={`p-6 border-2 bg-background ${workflow.color} flex flex-col hover:scale-[1.02] transition-all`}
              >
                <div className="text-[8px] font-black px-2.5 py-1 bg-arcade-green text-black inline-block self-start mb-4 uppercase">
                  ► {workflow.label}
                </div>
                <h3 className={`text-xs sm:text-sm font-black mb-3 ${workflow.textColor}`}>
                  {workflow.title}
                </h3>
                <p className="text-[8px] sm:text-[9px] text-arcade-green leading-relaxed font-bold flex-grow">
                  {workflow.description}
                </p>
                <NavItemLink
                  item={workflow.item}
                  variant="custom"
                  className="mt-6 inline-flex items-center text-[9px] font-black text-arcade-cyan uppercase hover:text-arcade-pink transition-colors"
                >
                  {workflow.cta} ►
                </NavItemLink>
              </div>
            ))}
          </div>
          {/* Armory link */}
          <div className="mt-8 text-center">
            <NavItemLink
              item={toolsLink}
              variant="custom"
              className="text-[10px] font-black text-arcade-yellow uppercase hover:text-arcade-pink transition-colors insert-coin"
            >
              ► WANT MORE TOOLS? VISIT THE ARMORY ◄
            </NavItemLink>
          </div>
        </Container>
      </SectionContainer>

      {/* ── 7. Frequently Asked Objections ── */}
      <LandingFAQSection />

      {/* ── 8. Final CTA ── */}
      <CTASection
        heading="The Clock Is Running"
        description={`The parasitic economy hits 35% of GDP by ${Math.round(DESTRUCTIVE_ECONOMY_35PCT_YEAR.value)}. Your VOTE points are worth ${fmtParam(VOTE_TOKEN_POTENTIAL_VALUE)} if ${(GLOBAL_COORDINATION_TARGET_SUPPORTERS.value / 1e9).toFixed(0)} billion people play. Worth nothing if they don't.`}
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
