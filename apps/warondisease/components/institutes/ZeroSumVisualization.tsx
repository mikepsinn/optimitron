import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import {
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
} from "@/lib/parameters-calculations-citations"
import { formatParameter } from "@/lib/format-parameter"

// Derived values from parameters
const spendingRatio = formatParameter(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO)
const militarySpending = formatParameter(GLOBAL_MILITARY_SPENDING_ANNUAL_2024)

export function ZeroSumVisualization() {
  return (
    <SectionContainer bgColor="red" borderPosition="bottom" padding="lg">
      <Container>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase text-center mb-12 text-foreground">
          STOP FIGHTING FOR SCRAPS. GROW THE PIE.
        </h2>

        {/* Today vs Future */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 bg-background">
            <h3 className="text-3xl font-black uppercase mb-6 text-center text-foreground">TODAY</h3>
            <div className="text-center mb-6">
              <div className="text-6xl font-black text-brutal-pink mb-2">$50B</div>
              <div className="text-xl font-bold text-foreground">EVERYONE COMPETING</div>
            </div>
            <div className="text-center text-lg font-bold text-foreground">
              Your grant win = their grant loss
            </div>
          </Card>

          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 bg-brutal-cyan">
            <h3 className="text-3xl font-black uppercase mb-6 text-center text-foreground">WITH 1% TREATY</h3>
            <div className="text-center mb-6">
              <div className="text-6xl font-black text-foreground mb-2">$77B+</div>
              <div className="text-xl font-bold text-foreground">EVERYONE WINNING</div>
            </div>
            <div className="text-center text-lg font-bold text-foreground">
              Grow pie 1.54X → all diseases get more
            </div>
          </Card>
        </div>

        {/* The Real Problem */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 bg-background">
            <div className="grid md:grid-cols-2 gap-8 text-center">
              <div>
                <div className="text-6xl font-black text-foreground mb-2">{spendingRatio}</div>
                <div className="text-lg font-bold text-foreground">
                  Military vs. trials
                </div>
              </div>
              <div>
                <div className="text-6xl font-black text-foreground mb-2">{militarySpending}</div>
                <div className="text-lg font-bold text-foreground">
                  Annual military budgets
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </SectionContainer>
  )
}
