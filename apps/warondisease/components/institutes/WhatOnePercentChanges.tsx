import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import {
  TREATY_ANNUAL_FUNDING,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS,
} from "@/lib/parameters-calculations-citations"
import { formatParameter } from "@/lib/format-parameter"

// Format parameter values for display
const annualFunding = formatParameter(TREATY_ANNUAL_FUNDING)
const livesSaved = formatParameter(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED)
const trialMultiplier = formatParameter(DFDA_TRIAL_CAPACITY_MULTIPLIER)
const timelineShift = Math.round(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS.value)

export function WhatOnePercentChanges() {
  return (
    <SectionContainer bgColor="cyan" borderPosition="bottom" padding="lg">
      <Container>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase text-center mb-4 text-foreground">
          WHAT 1% CHANGES
        </h2>
        <p className="text-2xl sm:text-3xl font-black text-center text-foreground mb-12 max-w-3xl mx-auto">
          REDIRECTING 1% OF MILITARY BUDGETS = {annualFunding}/YEAR
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-6xl sm:text-7xl font-black mb-4 text-brutal-pink">{livesSaved}</div>
            <div className="text-2xl font-black mb-2 text-foreground">LIVES SAVED</div>
            <div className="font-bold text-foreground">From {timelineShift}-year timeline shift</div>
          </Card>

          <Card className="bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-6xl sm:text-7xl font-black mb-4 text-brutal-yellow">{trialMultiplier}</div>
            <div className="text-2xl font-black mb-2 text-foreground">MORE TRIALS</div>
            <div className="font-bold text-foreground">Annual capacity increase</div>
          </Card>

          <Card className="bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-6xl sm:text-7xl font-black mb-4 text-brutal-cyan">{timelineShift}</div>
            <div className="text-2xl font-black mb-2 text-foreground">YEARS</div>
            <div className="font-bold text-foreground">Average timeline shift</div>
          </Card>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="bg-foreground border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-3xl sm:text-4xl md:text-5xl font-black uppercase text-background">
              COST-DOMINANT INTERVENTION
            </div>
            <div className="text-xl sm:text-2xl font-bold text-background/90 mt-4">
              Reduces costs while improving outcomes
            </div>
          </Card>
        </div>
      </Container>
    </SectionContainer>
  )
}
