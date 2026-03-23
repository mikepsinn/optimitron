import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { BrutalCard } from "@/components/ui/brutal-card";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { TAGLINES } from "@/lib/messaging";
import {
  GLOBAL_HALE_CURRENT,
  TREATY_PROJECTED_HALE_YEAR_15,
  TREATY_HALE_GAIN_YEAR_15,
  CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15,
  TREATY_TRAJECTORY_AVG_INCOME_YEAR_15,
  VOTE_TOKEN_POTENTIAL_VALUE,
  PRIZE_POOL_HORIZON_MULTIPLE,
  GLOBAL_COORDINATION_TARGET_SUPPORTERS,
} from "@/lib/parameters-calculations-citations";

export function HowToWinSection() {
  const haleGain = TREATY_HALE_GAIN_YEAR_15.value.toFixed(1);
  const incomeMultiplier = Math.round(
    TREATY_TRAJECTORY_AVG_INCOME_YEAR_15.value /
      CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15.value,
  );
  const targetPeople = `${(GLOBAL_COORDINATION_TARGET_SUPPORTERS.value / 1e9).toFixed(0)} billion`;

  return (
    <SectionContainer bgColor="cyan" borderPosition="both" padding="lg">
      <Container>
        <SectionHeader
          title="How to Win"
          subtitle={TAGLINES.rewardFunction}
          size="lg"
        />

        {/* The Scoreboard */}
        <BrutalCard
          bgColor="background"
          shadowSize={8}
          padding="lg"
          className="mb-8"
        >
          <div className="text-center mb-6">
            <span className="text-xs font-black px-2.5 py-1 bg-foreground text-background uppercase">
              The Scoreboard
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <p className="text-lg sm:text-xl font-black uppercase text-muted-foreground mb-2">
                Healthy Life Expectancy
              </p>
              <div className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground">
                <span className="text-muted-foreground line-through">
                  {GLOBAL_HALE_CURRENT.value}
                </span>{" "}
                <span className="text-brutal-cyan">
                  {TREATY_PROJECTED_HALE_YEAR_15.value.toFixed(1)}
                </span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-muted-foreground mt-2">
                +{haleGain} healthy years
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg sm:text-xl font-black uppercase text-muted-foreground mb-2">
                Global Median Income
              </p>
              <div className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground">
                <span className="text-muted-foreground line-through">
                  <ParameterValue
                    param={CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15}
                    className="text-muted-foreground"
                  />
                </span>{" "}
                <span className="text-brutal-cyan">
                  <ParameterValue
                    param={TREATY_TRAJECTORY_AVG_INCOME_YEAR_15}
                    className="text-brutal-cyan"
                  />
                </span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-muted-foreground mt-2">
                {incomeMultiplier}x lifetime earnings
              </p>
            </div>
          </div>
        </BrutalCard>

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
