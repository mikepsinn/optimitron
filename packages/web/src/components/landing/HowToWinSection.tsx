import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { HumanityScoreboard } from "@/components/shared/HumanityScoreboard";
import { TAGLINES, POINT, PRIZE_OUTCOMES } from "@/lib/messaging";
import { TwoOutcomes } from "@/components/prize/TwoOutcomes";
import {
  PRIZE_POOL_HORIZON_MULTIPLE,
  GLOBAL_COORDINATION_TARGET_SUPPORTERS,
} from "@optimitron/data/parameters";

export function HowToWinSection() {
  return (
    <SectionContainer bgColor="cyan" borderPosition="both" padding="lg">
      <Container>
        <SectionHeader
          title="How to Win"
          subtitle="Make humanity healthier and wealthier. Increase 2 numbers That's the whole game!"
          size="lg"
        />

        {/* Humanity's Scoreboard — reusable component */}
        <div className="mb-8">
          <HumanityScoreboard />
        </div>

        {/* The awareness insight */}
        <div className="text-center mb-8 max-w-3xl mx-auto">
          <p className="text-xl sm:text-2xl font-black">
            {TAGLINES.pluralisticIgnorance}
          </p>
        </div>

        {/* Win/Lose outcomes */}
        <div className="mb-8">
          <TwoOutcomes
            fail={{
              title: PRIZE_OUTCOMES.failTitle,
              metric: <><ParameterValue param={PRIZE_POOL_HORIZON_MULTIPLE} />x RETURN</>,
              description: "Depositors split the pool. Still beats a retirement account.",
            }}
            success={{
              title: PRIZE_OUTCOMES.successTitle,
              metric: "PRIZE POOL SPLIT",
              description: <>{POINT} holders get paid from the prize pool. Plus: everyone lives in a world with diseases cured.</>,
            }}
          />
        </div>

        {/* Punchline */}
        <div className="text-center">
          <p className="text-xl sm:text-2xl font-black">
            {TAGLINES.everyPlayerWins}
          </p>
        </div>
      </Container>
    </SectionContainer>
  );
}
