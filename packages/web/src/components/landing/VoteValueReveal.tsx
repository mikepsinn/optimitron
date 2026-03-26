"use client";

import { Container } from "@/components/ui/container";
import { SectionContainer } from "@/components/ui/section-container";
import { BrutalCard } from "@/components/ui/brutal-card";
import { GameCTA } from "@/components/ui/game-cta";
import { ArcadeTag } from "@/components/ui/arcade-tag";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { CollapseCountdownTimer } from "@/components/animations/CollapseCountdownTimer";
import { VOTE_VALUE, CTA } from "@/lib/messaging";
import {
  VOTE_TOKEN_POTENTIAL_VALUE,
  PRIZE_POOL_ANNUAL_RETURN,
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  TREATY_HALE_GAIN_YEAR_15,
  SHARING_BREAKEVEN_ONE_IN_TREATY,
} from "@optimitron/data/parameters";

export function VoteValueReveal() {
  return (
    <SectionContainer bgColor="pink" borderPosition="bottom" padding="lg">
      <Container>
        {/* Part A — The Big Number */}
        <div className="text-center mb-12">
          <ArcadeTag className="mb-4">{VOTE_VALUE.heading}</ArcadeTag>
          <div className="text-6xl sm:text-7xl md:text-8xl font-black text-brutal-pink-foreground mb-4">
            <ParameterValue
              param={VOTE_TOKEN_POTENTIAL_VALUE}
              className="text-brutal-pink-foreground"
            />
            +
          </div>
          <p className="text-xl sm:text-2xl font-black text-brutal-pink-foreground uppercase mb-4">
            Per VOTE Point
          </p>
          <p className="text-base sm:text-lg font-bold text-background max-w-2xl mx-auto">
            {VOTE_VALUE.subheading}
          </p>
        </div>

        {/* Part B — Two Outcomes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
          <BrutalCard bgColor="yellow" shadowSize={8} padding="lg">
            <h3 className="text-xl font-black uppercase text-foreground mb-3">
              {VOTE_VALUE.failHeading}
            </h3>
            <div className="text-4xl font-black text-foreground mb-3">
              <ParameterValue
                param={PRIZE_POOL_ANNUAL_RETURN}
                className="text-foreground"
              />{" "}
              Annual
            </div>
            <p className="text-sm font-bold text-foreground leading-relaxed">
              Depositors get{" "}
              <ParameterValue
                param={PRIZE_POOL_ANNUAL_RETURN}
                className="text-foreground font-black"
              />{" "}
              {VOTE_VALUE.failBody}
            </p>
          </BrutalCard>

          <BrutalCard bgColor="cyan" shadowSize={8} padding="lg">
            <h3 className="text-xl font-black uppercase text-foreground mb-3">
              {VOTE_VALUE.successHeading}
            </h3>
            <div className="text-4xl font-black text-foreground mb-3">
              <ParameterValue
                param={TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA}
                className="text-foreground"
              />
            </div>
            <p className="text-sm font-bold text-foreground leading-relaxed">
              Everyone gains{" "}
              <ParameterValue
                param={TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA}
                className="text-foreground font-black"
              />{" "}
              lifetime income.{" "}
              <ParameterValue
                param={TREATY_HALE_GAIN_YEAR_15}
                className="text-foreground font-black"
              />{" "}
              more years of healthy life. {VOTE_VALUE.successBody}
            </p>
          </BrutalCard>
        </div>

        {/* Break-even callout */}
        <BrutalCard
          bgColor="background"
          shadowSize={8}
          padding="md"
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <p className="text-lg sm:text-xl font-black text-foreground">
            {VOTE_VALUE.breakEvenPrefix}{" "}
            <ParameterValue
              param={{ ...SHARING_BREAKEVEN_ONE_IN_TREATY, unit: "" }}
              className="text-brutal-pink font-black"
            />
            . {VOTE_VALUE.breakEvenSuffix}
          </p>
        </BrutalCard>

        {/* Part C — The Deadline */}
        <BrutalCard
          bgColor="foreground"
          shadowSize={8}
          padding="lg"
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h3 className="text-2xl sm:text-3xl font-black uppercase text-brutal-red mb-6">
            {VOTE_VALUE.deadlineHeading}
          </h3>
          <CollapseCountdownTimer size="md" showLabel={false} className="mb-6" />
          <p className="text-sm font-bold text-background leading-relaxed mb-4">
            {VOTE_VALUE.deadlineBody}
          </p>
          <p className="text-base font-black text-brutal-red italic">
            {VOTE_VALUE.deadlineQuip}
          </p>
        </BrutalCard>

        {/* Part D — The Flywheel */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h3 className="text-2xl sm:text-3xl font-black uppercase text-brutal-pink-foreground mb-4">
            {VOTE_VALUE.flywheelHeading}
          </h3>
          <p className="text-base sm:text-lg font-bold text-background leading-relaxed mb-4">
            {VOTE_VALUE.flywheelDescription}
          </p>
          <p className="text-lg font-black text-brutal-pink-foreground italic">
            {VOTE_VALUE.shopkeeperQuip}
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <GameCTA href="/prize" variant="secondary" size="lg">
            {CTA.seeTheMath}
          </GameCTA>
          <GameCTA href="#vote" variant="outline" size="lg">
            {CTA.earnPoints}
          </GameCTA>
        </div>
      </Container>
    </SectionContainer>
  );
}
