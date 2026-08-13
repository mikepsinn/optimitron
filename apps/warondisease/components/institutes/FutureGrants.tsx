import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { Coins, Target, Lightbulb, Clock } from "lucide-react"

export function FutureGrants() {
  return (
    <SectionContainer bgColor="cyan" borderPosition="bottom" padding="lg">
      <Container>
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="bg-foreground border-4 border-primary w-14 h-14 flex items-center justify-center">
            <Coins className="h-7 w-7 text-background" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase text-foreground">
            FUTURE GRANTS
          </h2>
        </div>
        <p className="text-lg sm:text-xl font-bold text-center text-foreground mb-4 max-w-3xl mx-auto">
          ELIGIBILITY FOR PERFORMANCE-BASED FUNDING
        </p>
        <div className="flex justify-center mb-12">
          <span className="bg-brutal-yellow border-4 border-primary px-4 py-2 font-black uppercase text-foreground">
            PLANNED
          </span>
        </div>

        <div className="max-w-4xl mx-auto mb-12">
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 bg-background">
            <h3 className="text-2xl font-black uppercase mb-6 text-foreground text-center">
              CLINICAL TRIAL ABUNDANCE INITIATIVE FUND
            </h3>
            <p className="text-lg font-bold text-foreground/80 text-center mb-8">
              A dedicated fund being designed to provide performance-based grants to organizations that:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-brutal-pink border-4 border-primary w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <Target className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <h4 className="text-lg font-black uppercase text-foreground mb-1">GENERATE RESPONSES</h4>
                  <p className="font-bold text-foreground/80">
                    Collect high-quality survey responses from your community
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-brutal-yellow border-4 border-primary w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <h4 className="text-lg font-black uppercase text-foreground mb-1">USE THE DATA</h4>
                  <p className="font-bold text-foreground/80">
                    Advance clinical trial access and funding with the results
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-brutal-yellow">
            <div className="flex items-start gap-4">
              <div className="bg-foreground border-4 border-primary w-12 h-12 flex items-center justify-center flex-shrink-0">
                <Clock className="h-6 w-6 text-background" />
              </div>
              <div>
                <p className="text-lg font-black text-foreground">
                  DETAILS AND TIMING DEPEND ON DISCUSSIONS WITH MAJOR PHILANTHROPIC AND INSTITUTIONAL PARTNERS.
                </p>
                <p className="text-lg font-bold text-foreground mt-2">
                  EARLY PARTNER INSTITUTES WILL HELP SHAPE THE FUND'S DESIGN.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </SectionContainer>
  )
}
