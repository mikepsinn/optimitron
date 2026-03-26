import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { BrutalCard } from "@/components/ui/brutal-card";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { HumanityScoreboard } from "@/components/shared/HumanityScoreboard";
import { GovernmentLeaderboard } from "@/components/shared/GovernmentLeaderboard";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { governmentsLink } from "@/lib/routes";
import { TAGLINES } from "@/lib/messaging";
import {
  VOTE_TOKEN_POTENTIAL_VALUE,
  PRIZE_POOL_HORIZON_MULTIPLE,
  GLOBAL_COORDINATION_TARGET_SUPPORTERS,
} from "@optimitron/data/parameters";

export function HowToWinSection() {
  const targetPeople = `${(GLOBAL_COORDINATION_TARGET_SUPPORTERS.value / 1e9).toFixed(0)} billion`;

  return (
    <SectionContainer bgColor="cyan" borderPosition="both" padding="lg">
      <Container>
        <SectionHeader
          title="How to Win"
          subtitle="Live longer. Earn more. Two numbers on a Scoreboard. That's the whole game."
          size="lg"
        />

        {/* Humanity's Scoreboard — reusable component */}
        <div className="mb-8">
          <HumanityScoreboard />
        </div>

        {/* Country leaderboard preview */}
        <div className="mb-6">
          <p className="text-lg sm:text-xl font-black text-foreground uppercase mb-4 text-center">
            Where Does Your Country Rank?
          </p>
          <GovernmentLeaderboard limit={5} compact />
          <div className="mt-3 text-center">
            <NavItemLink
              item={governmentsLink}
              variant="custom"
              className="text-base font-black text-foreground uppercase hover:text-brutal-pink transition-colors"
            >
              See all government scoreboards &rarr;
            </NavItemLink>
          </div>
        </div>

        {/* The awareness insight */}
        <div className="text-center mb-8 max-w-3xl mx-auto">
          <p className="text-xl sm:text-2xl font-black text-foreground">
            {TAGLINES.pluralisticIgnorance} Get {targetPeople} to show they want
            this and it becomes unstoppable.
          </p>
        </div>

        {/* Win/Lose outcomes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <BrutalCard bgColor="background" shadowSize={8} padding="lg">
            <h3 className="text-2xl sm:text-3xl font-black uppercase text-foreground mb-3">
              If Targets Are Hit
            </h3>
            <p className="text-lg sm:text-xl font-bold text-foreground">
              VOTE holders get paid. Each point worth{" "}
              <ParameterValue
                param={VOTE_TOKEN_POTENTIAL_VALUE}
                className="text-brutal-pink font-black"
              />
              +. Plus: everyone lives in a world with diseases cured.
            </p>
          </BrutalCard>

          <BrutalCard bgColor="yellow" shadowSize={8} padding="lg">
            <h3 className="text-2xl sm:text-3xl font-black uppercase text-foreground mb-3">
              If Targets Are Missed
            </h3>
            <p className="text-lg sm:text-xl font-bold text-foreground">
              Depositors split the pool.{" "}
              <span className="text-brutal-pink font-black">
                {PRIZE_POOL_HORIZON_MULTIPLE.value.toFixed(1)}x
              </span>{" "}
              return. Still beats a retirement account.
            </p>
          </BrutalCard>
        </div>

        {/* Punchline */}
        <div className="text-center">
          <p className="text-xl sm:text-2xl font-black text-foreground">
            {TAGLINES.everyPlayerWins}
          </p>
        </div>
      </Container>
    </SectionContainer>
  );
}
