"use client"

import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import {
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  RECOVERY_TRIAL_COST_PER_PATIENT,
  RECOVERY_TRIAL_COST_REDUCTION_FACTOR,
  TREATY_ANNUAL_FUNDING,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  DFDA_QUEUE_CLEARANCE_YEARS,
} from "@/lib/parameters-calculations-citations"
import { getParameterValue } from "@/lib/format-parameter"
import { ParameterValue } from "@/components/shared/ParameterValue"

export function CapacityMultiplierProof() {
  const costReductionRaw = getParameterValue(RECOVERY_TRIAL_COST_REDUCTION_FACTOR, "round")
  const capacityMultiplierRaw = getParameterValue(DFDA_TRIAL_CAPACITY_MULTIPLIER, "round")
  const statusQuoYears = getParameterValue(STATUS_QUO_QUEUE_CLEARANCE_YEARS, "round")
  const dfdaYears = getParameterValue(DFDA_QUEUE_CLEARANCE_YEARS, "round")

  return (
    <SectionContainer bgColor="cyan" borderPosition="bottom" padding="lg">
      <Container>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase text-center mb-12 text-foreground">
          1% OF MILITARY BUDGETS = {capacityMultiplierRaw}X MORE CLINICAL TRIALS
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-5xl sm:text-6xl font-black mb-4 text-brutal-pink">
              <ParameterValue param={TRADITIONAL_PHASE3_COST_PER_PATIENT} />
            </div>
            <div className="text-xl font-black mb-2 text-foreground">TRADITIONAL TRIAL</div>
            <div className="font-bold text-foreground">Cost per patient (Phase 3)</div>
          </Card>

          <Card className="bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-5xl sm:text-6xl font-black mb-4 text-brutal-yellow">
              <ParameterValue param={RECOVERY_TRIAL_COST_PER_PATIENT} />
            </div>
            <div className="text-xl font-black mb-2 text-foreground">PRAGMATIC TRIAL</div>
            <div className="font-bold text-foreground">{costReductionRaw}X cheaper (Oxford RECOVERY proved it)</div>
          </Card>

          <Card className="bg-foreground border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-5xl sm:text-6xl font-black mb-4 text-background">
              <ParameterValue param={DFDA_TRIAL_CAPACITY_MULTIPLIER} />
            </div>
            <div className="text-xl font-black mb-2 text-background">MORE CAPACITY</div>
            <div className="font-bold text-background">
              With <ParameterValue param={TREATY_ANNUAL_FUNDING} /> (1% of <ParameterValue param={GLOBAL_MILITARY_SPENDING_ANNUAL_2024} /> military)
            </div>
          </Card>
        </div>

        <div className="mt-12 max-w-4xl mx-auto">
          <Card className="bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-4xl sm:text-5xl font-black mb-4 text-foreground">
              {statusQuoYears} YEARS &rarr; {dfdaYears} YEARS
            </div>
            <div className="text-xl font-bold text-foreground">
              TREATMENTS FOR YOUR DISEASE DISCOVERED DECADES FASTER
            </div>
          </Card>
        </div>
      </Container>
    </SectionContainer>
  )
}
