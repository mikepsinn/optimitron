import { Card } from "@optimitron/neobrutalist-ui/ui/card"
import { Container } from "@optimitron/neobrutalist-ui/ui/container"
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container"

export default function PragmaticTrialCostProofSection() {
  return (
    <SectionContainer bgColor="yellow" borderPosition="bottom" padding="lg">
      <Container>
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl font-black uppercase text-center mb-12 leading-tight">
          OXFORD RECOVERY TRIAL PROVED RESEARCH CAN BE DONE FOR
        </h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 max-w-4xl mx-auto">
          <Card className="bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full md:w-auto md:flex-1">
            <div className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 text-brutal-pink">$500</div>
            <div className="font-bold uppercase text-base sm:text-lg md:text-xl">PER PATIENT IN PRAGMATIC TRIALS</div>
          </Card>

          <div className="text-3xl md:text-4xl lg:text-5xl font-black text-primary">VS</div>

          <Card className="bg-primary border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full md:w-auto md:flex-1">
            <div className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 text-primary-foreground">$41K</div>
            <div className="font-bold uppercase text-base sm:text-lg md:text-xl text-primary-foreground">
              PER PATIENT IN STANDARD TRIALS
            </div>
          </Card>
        </div>
      </Container>
    </SectionContainer>
  )
}
