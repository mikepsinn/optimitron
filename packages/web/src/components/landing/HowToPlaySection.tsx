import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { BrutalCard } from "@/components/ui/brutal-card";
import { GameCTA } from "@/components/ui/game-cta";
import { Stat } from "@/components/ui/stat";
import {
  fmtParam,
  VOTE_TOKEN_POTENTIAL_VALUE,
  PRIZE_POOL_HORIZON_MULTIPLE,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  TREATY_CAMPAIGN_VOTING_BLOC_TARGET,
} from "@optimitron/data/parameters";
import { CTA, TAGLINES } from "@/lib/messaging";
import { ROUTES } from "@/lib/routes";
const steps = [
  {
    number: "1",
    title: "Vote & Allocate",
    body: "Answer the question. Tell us where you'd spend the money. 2 minutes. You're a player now.",
    color: "pink" as const,
    ctas: [
      { label: CTA.answerTheQuestion, href: "#vote" },
      { label: CTA.makeAllocation, href: ROUTES.wishocracy },
    ],
  },
  {
    number: "2",
    title: "Get Your Link",
    body: "Sign in and get your referral URL. Every verified voter you bring in earns you 1 VOTE point.",
    color: "cyan" as const,
    ctas: [{ label: "Sign In", href: "#vote" }],
  },
  {
    number: "3",
    title: "Play With Friends",
    body: `Share your link with 2 friends. They each share with 2 more. 28 rounds of this = ${Math.round(TREATY_CAMPAIGN_VOTING_BLOC_TARGET.value / 1e6)}M people = tipping point. Each VOTE point worth ${fmtParam(VOTE_TOKEN_POTENTIAL_VALUE)}+ if targets are hit.`,
    color: "yellow" as const,
    ctas: [],
  },
  {
    number: "4",
    title: "Deposit",
    body: `Put money in the prize fund. If the plan works, VOTE holders get paid. If it doesn't, you get ${PRIZE_POOL_HORIZON_MULTIPLE.value.toFixed(1)}x back. You literally cannot lose your principal.`,
    color: "pink" as const,
    ctas: [{ label: CTA.insertCoin, href: "/prize" }],
  },
];

export function HowToPlaySection() {
  return (
    <SectionContainer bgColor="background" borderPosition="both" padding="lg">
      <Container>
        <div id="rules">
          <SectionHeader
            title="How to Play"
            subtitle={TAGLINES.awarenessBarrier}
            size="lg"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {steps.map((step) => (
            <BrutalCard
              key={step.number}
              bgColor={step.color}
              shadowSize={8}
              padding="lg"
            >
              <div className="flex items-start gap-4">
                <span className="text-5xl font-black text-foreground leading-none shrink-0">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black uppercase text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-lg sm:text-xl font-bold text-foreground leading-relaxed">
                    {step.body}
                  </p>
                  {step.ctas.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {step.ctas.map((cta) => (
                        <GameCTA
                          key={cta.label}
                          href={cta.href}
                          variant="secondary"
                          size="sm"
                        >
                          {cta.label}
                        </GameCTA>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </BrutalCard>
          ))}
        </div>

        {/* Bottom stat */}
        <div className="text-center p-6 border-4 border-primary bg-brutal-cyan shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-4xl sm:text-5xl font-black text-foreground mb-2">
            <Stat param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED} />{" "}
            Lives Saved
          </div>
          <p className="text-lg sm:text-xl font-bold text-foreground">
            That&apos;s what happens when enough people know.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <GameCTA href="#vote" variant="primary" size="lg">
            {CTA.startPlaying}
          </GameCTA>
          <GameCTA href="/prize" variant="secondary" size="lg">
            {CTA.seeTheMath}
          </GameCTA>
          <GameCTA href="/tools" variant="cyan" size="lg">
            {CTA.browseArmory}
          </GameCTA>
        </div>
      </Container>
    </SectionContainer>
  );
}
