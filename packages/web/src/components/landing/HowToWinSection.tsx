"use client";

import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { HumanityScoreboard } from "@/components/shared/HumanityScoreboard";
import { GlobalProgressCard } from "@/components/dashboard/GlobalProgressCard";
import { GameCTA } from "@/components/ui/game-cta";

export function HowToWinSection() {
  return (
    <SectionContainer bgColor="cyan" borderPosition="both" padding="lg">
      <Container>
        <SectionHeader
          title="How to Win"
          subtitle="Two numbers. That's the whole game."
          size="lg"
        />

        {/* Humanity's Scoreboard */}
        <div className="mb-8">
          <HumanityScoreboard />
        </div>

        {/* Tipping point progress */}
        <GlobalProgressCard progress={{ current: 0.1, target: 3.5 }} />

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <GameCTA href="/tasks/win-earth-optimization-prize" variant="primary">
            Work the Top Task
          </GameCTA>
          <GameCTA href="/scoreboard" variant="secondary">
            View Full Scoreboard
          </GameCTA>
          <GameCTA href="/prize" variant="secondary">
            See the Prize Math
          </GameCTA>
        </div>
      </Container>
    </SectionContainer>
  );
}
