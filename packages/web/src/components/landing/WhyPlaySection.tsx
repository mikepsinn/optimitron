"use client";

import Link from "next/link";
import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { GameCTA } from "@/components/ui/game-cta";
import { ParasiticEconomyChart } from "@/components/shared/ParasiticEconomyChart";
import { LiveDeathTicker } from "@/components/animations/LiveDeathTicker";
import { CTA } from "@/lib/messaging";
import { ROUTES } from "@/lib/routes";

export function WhyPlaySection({
  ctaHref = "#vote",
  ctaLabel = CTA.playNow,
  punchline = "Right now, doing nothing means you lose. Vote and you stop.",
  title = "What Happens If Nobody Plays",
}: {
  ctaHref?: string;
  ctaLabel?: string;
  punchline?: string;
  title?: string;
}) {
  return (
    <SectionContainer bgColor="foreground" borderPosition="both" padding="lg">
      <Container>
        <div id="stakes">
          <SectionHeader
            title={title}
            size="lg"
            className="text-background [&_p]:text-background"
          />
        </div>
      </Container>

      {/* Chart breaks out of Container for full width on mobile */}
      <div className="mb-8 px-2 sm:px-4 md:px-8">
        <ParasiticEconomyChart />
      </div>

      <Container>
        {/* Real-time counters — link to The Invisible Graveyard so the deaths aren't abstract */}
        <Link
          aria-label="Open the Invisible Graveyard"
          className="mb-8 block transition-opacity hover:opacity-90"
          href={ROUTES.plaintiffs}
        >
          <LiveDeathTicker surface="dark" />
        </Link>

        {/* Punchline */}
        <div className="text-center">
          <p className="text-xl sm:text-2xl font-black text-background mb-6">
            {punchline}
          </p>
          <GameCTA href={ctaHref} variant="primary" size="lg">
            {ctaLabel}
          </GameCTA>
        </div>
      </Container>
    </SectionContainer>
  );
}
