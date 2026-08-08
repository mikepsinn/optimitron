"use client"

import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import {
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
} from "@/lib/parameters-calculations-citations"
import { getParameterValue } from "@/lib/format-parameter"
import { ParameterValue } from "@/components/shared/ParameterValue"

// Raw value for text display
const spendingRatioRaw = getParameterValue(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO, "round")

export function TheBrutalTruth() {
  return (
    <SectionContainer bgColor="red" borderPosition="bottom" padding="lg">
      <Container>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase text-center mb-12 text-background">
          THE BRUTAL TRUTH
        </h2>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          <Card className="bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-5xl sm:text-6xl md:text-7xl font-black mb-4 text-foreground">
              <ParameterValue param={GLOBAL_MILITARY_SPENDING_ANNUAL_2024} format={{ precision: 2 }} />
            </div>
            <div className="text-2xl font-black mb-2 text-foreground">MILITARY SPENDING</div>
            <div className="font-bold text-foreground">Ending life</div>
          </Card>

          <Card className="bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-5xl sm:text-6xl md:text-7xl font-black mb-4 text-foreground">
              <ParameterValue param={GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL} />
            </div>
            <div className="text-2xl font-black mb-2 text-foreground">CLINICAL TRIALS</div>
            <div className="font-bold text-foreground">Testing which medicines work</div>
          </Card>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="bg-foreground border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-5xl sm:text-6xl md:text-7xl font-black text-brutal-pink mb-4">
              <ParameterValue param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO} />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-background">
              HUMANITY SPENDS {spendingRatioRaw}× MORE ON WEAPONS THAN CURING DISEASES
            </div>
          </Card>
        </div>
      </Container>
    </SectionContainer>
  )
}
