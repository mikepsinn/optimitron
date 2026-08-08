import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"

export function InstituteStats() {
  return (
    <SectionContainer bgColor="background" borderPosition="bottom" padding="sm">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-brutal-cyan border-4 border-primary p-6 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl md:text-4xl font-black text-foreground">6</div>
            <div className="text-sm font-bold uppercase text-foreground">Institutes</div>
          </div>
          <div className="bg-brutal-yellow border-4 border-primary p-6 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl md:text-4xl font-black text-foreground">2,500+</div>
            <div className="text-sm font-bold uppercase text-foreground">Active Trials</div>
          </div>
          <div className="bg-brutal-pink border-4 border-primary p-6 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl md:text-4xl font-black text-foreground">100K+</div>
            <div className="text-sm font-bold uppercase text-foreground">Researchers</div>
          </div>
          <div className="bg-brutal-cyan border-4 border-primary p-6 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl md:text-4xl font-black text-foreground">50+</div>
            <div className="text-sm font-bold uppercase text-foreground">Countries</div>
          </div>
        </div>
      </Container>
    </SectionContainer>
  )
}
