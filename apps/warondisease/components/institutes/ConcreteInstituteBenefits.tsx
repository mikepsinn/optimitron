import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { ParameterValue } from "@/components/shared/ParameterValue"
import { MAJORITY_OF_HUMANS_ON_EARTH } from "@/lib/majority-humanity-target"
import { DFDA_TRIAL_CAPACITY_MULTIPLIER } from "@/lib/parameters-calculations-citations"

export function ConcreteInstituteBenefits() {
  return (
    <SectionContainer bgColor="yellow" borderPosition="bottom" padding="lg">
      <Container>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase text-center mb-12 text-foreground">
          WHAT YOU GET
        </h2>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 bg-background text-center">
            <div className="text-5xl sm:text-6xl font-black mb-4 text-brutal-cyan">
              <ParameterValue param={DFDA_TRIAL_CAPACITY_MULTIPLIER} showPopover={false} />
            </div>
            <div className="text-xl font-black mb-2 text-foreground">MORE TRIALS</div>
            <div className="font-bold text-foreground">For YOUR disease</div>
          </Card>

          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 bg-background text-center">
            <div className="text-5xl sm:text-6xl font-black mb-4 text-brutal-pink">
              <ParameterValue param={MAJORITY_OF_HUMANS_ON_EARTH} />
            </div>
            <div className="text-xl font-black mb-2 text-foreground">HUMANS REACHED</div>
            <div className="font-bold text-foreground">The number where "I'll look into it" stops working</div>
          </Card>

          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 bg-background text-center">
            <div className="text-5xl sm:text-6xl font-black mb-4 text-brutal-yellow">2 MIN</div>
            <div className="text-xl font-black mb-2 text-foreground">IMPLEMENTATION</div>
            <div className="font-bold text-foreground">Copy-paste embed code</div>
          </Card>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 bg-foreground text-background text-center">
            <div className="text-3xl sm:text-4xl font-black uppercase">
              2 MINUTES OF WORK = TREATMENTS DECADES SOONER 
            </div>
          </Card>
        </div>
      </Container>
    </SectionContainer>
  )
}
