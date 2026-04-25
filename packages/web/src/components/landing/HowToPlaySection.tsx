import type { ReactNode } from "react";
import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { BrutalCard } from "@/components/ui/brutal-card";
import { GameCTA } from "@/components/ui/game-cta";
import { ParameterValue } from "@/components/shared/ParameterValue";
import {
  PRIZE_POOL_HORIZON_MULTIPLE,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
} from "@optimitron/data/parameters";
import { MAJORITY_OF_HUMANS_ON_EARTH } from "@/lib/majority-humanity-target";
import { CTA, TAGLINES, POINT, POINTS, REFERRAL } from "@/lib/messaging";
import { ROUTES } from "@/lib/routes";
const steps: { number: string; title: string; body: ReactNode; color: "pink" | "cyan" | "yellow"; ctas: { label: string; href: string }[] }[] = [
  {
    number: "1",
    title: "Vote & Allocate",
    body: "Answer the question. Tell us where you'd spend the money. 2 minutes. You're a player now.",
    color: "pink",
    ctas: [
      { label: CTA.answerTheQuestion, href: "#vote" },
      { label: CTA.makeAllocation, href: ROUTES.wishocracy },
    ],
  },
  {
    number: "2",
    title: "Get Your Link",
    body: `Sign in and get your referral URL. ${REFERRAL.earnOne}`,
    color: "cyan",
    ctas: [{ label: "Sign In", href: "#vote" }],
  },
  {
    number: "3",
    title: "Play With Friends",
    body: <>Share your link with 2 friends. They each share with 2 more. 32 rounds of this reaches <ParameterValue param={MAJORITY_OF_HUMANS_ON_EARTH} display="withUnit" />. Each {POINT} is your share of the prize pool if targets are hit.</>,
    color: "yellow",
    ctas: [],
  },
  {
    number: "4",
    title: "Deposit",
    body: <>{POINT} holders get paid if the plan works. Put money in the prize fund — if it doesn&apos;t work, projected return is <ParameterValue param={PRIZE_POOL_HORIZON_MULTIPLE} figures={2} />x (based on VC-sector diversification). All figures are projections, not guarantees.</>,
    color: "pink",
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
                <span className="text-5xl font-black leading-none shrink-0">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black uppercase mb-2">
                    {step.title}
                  </h3>
                  <p className="text-lg sm:text-xl font-bold leading-relaxed">
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
        <div className="text-center p-6 border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-4xl sm:text-5xl font-black mb-2">
            <ParameterValue param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED} />{" "}
            Lives Saved
          </div>
          <p className="text-lg sm:text-xl font-bold">
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
