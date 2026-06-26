"use client";

import Link from "next/link";
import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { GameCTA } from "@/components/ui/game-cta";
import { CollapseCountdownTimer } from "@/components/animations/CollapseCountdownTimer";
import { LiveDeathTicker } from "@/components/animations/LiveDeathTicker";
import { CTA, POINTS } from "@/lib/messaging";
import { ROUTES } from "@/lib/routes";

export function FinalCTASection() {
  return (
    <SectionContainer bgColor="foreground" borderPosition="top" padding="lg">
      <Container className="max-w-4xl">
        <SectionHeader
          title="The Clock Is Running"
          subtitle={`Your ${POINTS} pay out when enough humans play. Otherwise they are very nice paper.`}
          size="lg"
          className="text-background [&_p]:text-background"
        />

        {/* Countdown to parasitic economy overtake */}
        <div className="mb-8">
          <CollapseCountdownTimer />
        </div>

        {/* Real-time death ticker — link to The Invisible Graveyard so the deaths aren't abstract */}
        <Link
          aria-label="Open the Invisible Graveyard"
          className="mb-8 block transition-opacity hover:opacity-90"
          href={ROUTES.plaintiffs}
        >
          <LiveDeathTicker surface="dark" />
        </Link>

        {/* CTAs */}
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
      </Container>
    </SectionContainer>
  );
}
