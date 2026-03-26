"use client"

import { ImpactExplainer } from "@/components/shared/ImpactExplainer"
import { HeartPulse, TimerReset, Coins, Clock } from "lucide-react"
import {
  EFFICACY_LAG_YEARS,
  TREATY_ANNUAL_FUNDING,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  TRIAL_CAPACITY_CUMULATIVE_YEARS_20YR,
  LIFE_EXTENSION_YEARS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS,
  formatParameter,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue"
import { IMPACT_PER_VOTE } from "@/lib/impact-ledger"

import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { BrutalCard } from "@/components/ui/brutal-card"
import { StatCardGrid } from "@/components/ui/stat-card"

export default function VoteImpactSection() {
  const livesSaved = IMPACT_PER_VOTE.lives.toFixed(1)
  const sufferingYears = (IMPACT_PER_VOTE.sufferingHours / 8760).toFixed(0)
  const economicValue = `$${(IMPACT_PER_VOTE.economicValue / 1_000_000).toFixed(1)}M`
  const efficacyLag = EFFICACY_LAG_YEARS.value.toFixed(1)

  const treatyFunding = formatParameter(TREATY_ANNUAL_FUNDING)
  const trialCapacityMultiplier = Math.round(DFDA_TRIAL_CAPACITY_MULTIPLIER.value)
  const cumulativeYears = Math.round(TRIAL_CAPACITY_CUMULATIVE_YEARS_20YR.value)
  const lifeExtensionYears = Math.round(LIFE_EXTENSION_YEARS.value)
  const timelineShift = Math.round(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS.value)

  return (
    <SectionContainer bgColor="pink">
      <Container>
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase text-center text-brutal-pink-foreground">
            YOUR <span className="text-background">VOTE&apos;S</span> IMPACT
          </h2>
          <ImpactExplainer
            className="h-10 w-10 border-background bg-brutal-pink text-background hover:bg-background hover:text-brutal-pink"
            iconClassName="text-background"
            size={24}
            label="Show impact calculations"
          />
        </div>

        {/* Main Impact Card */}
        <BrutalCard bgColor="background" padding="lg" className="mb-8 text-center p-12">
          <div className="mb-6">
            <HeartPulse className="h-16 w-16 mx-auto mb-4 text-brutal-pink" />
            <div className="text-7xl sm:text-8xl md:text-9xl font-black text-brutal-pink mb-4">
              {livesSaved}
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-black uppercase mb-6">
              LIVES SAVED PER VOTE
            </div>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            <p className="text-lg sm:text-xl font-bold">
              <ParameterValue param={TREATY_ANNUAL_FUNDING} className="text-brutal-pink font-black" />/year scales trial capacity <span className="text-brutal-pink font-black">{trialCapacityMultiplier}X</span>, achieving <span className="text-brutal-pink font-black">{cumulativeYears} years</span> of progress in <span className="text-brutal-pink font-black">{lifeExtensionYears}</span>
            </p>
            <p className="text-base sm:text-lg font-bold opacity-80">
              Through a {timelineShift}-year average timeline shift: {trialCapacityMultiplier}x trial capacity + eliminating {efficacyLag}-year regulatory delays
            </p>
          </div>
        </BrutalCard>

        {/* Secondary Metrics Grid */}
        <StatCardGrid
          className="mb-8"
          columns={3}
          stats={[
            {
              value: sufferingYears,
              label: "YEARS SUFFERING PREVENTED",
              icon: TimerReset,
            },
            {
              value: economicValue,
              label: "ECONOMIC VALUE",
              icon: Coins,
            },
            {
              value: "30s",
              label: "TO VOTE",
              icon: Clock,
            },
          ]}
        />

        {/* Bottom CTA */}
        <BrutalCard bgColor="background" padding="lg" className="text-center">
          <p className="text-xl sm:text-2xl md:text-3xl font-black uppercase mb-4">
            The Best Use of 30 Seconds in Human History
          </p>
          <p className="text-base sm:text-lg font-bold max-w-2xl mx-auto">
            Thirty seconds. That&apos;s it. You&apos;ll spend longer choosing what to have for lunch, and lunch has never saved anyone&apos;s life.
          </p>
        </BrutalCard>
      </Container>
    </SectionContainer>
  )
}
