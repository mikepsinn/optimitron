import { Container } from "@optimitron/neobrutalist-ui/ui/container"
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container"

export default function SolutionBridgeSection() {
  return (
    <SectionContainer bgColor="pink" borderPosition="bottom" padding="lg">
      <Container>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase text-center text-white leading-tight">
          WE CAN SOLVE BOTH OF THESE PROBLEMS SIMULTANEOUSLY
        </h2>
      </Container>
    </SectionContainer>
  )
}
