import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { Shield, Scale, Heart } from "lucide-react"

export function SafeForCharities() {
  return (
    <SectionContainer bgColor="pink" borderPosition="bottom" padding="lg">
      <Container>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase text-center mb-4 text-foreground">
          SAFE FOR 501(c)(3) ORGANIZATIONS
        </h2>
        <p className="text-xl font-bold text-center text-foreground mb-12 max-w-3xl mx-auto">
          NONPARTISAN, EDUCATIONAL, AND COMPLIANT BY DESIGN
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-background">
            <div className="bg-brutal-cyan border-4 border-primary w-16 h-16 flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-foreground" />
            </div>
            <h3 className="text-xl font-black uppercase mb-3 text-foreground">NONPARTISAN</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-brutal-cyan font-black">✓</span>
                <span className="font-bold text-foreground">No candidate endorsements</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brutal-cyan font-black">✓</span>
                <span className="font-bold text-foreground">No party affiliations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brutal-cyan font-black">✓</span>
                <span className="font-bold text-foreground">No PAC or campaign contributions</span>
              </li>
            </ul>
          </Card>

          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-background">
            <div className="bg-brutal-yellow border-4 border-primary w-16 h-16 flex items-center justify-center mb-4">
              <Scale className="h-8 w-8 text-foreground" />
            </div>
            <h3 className="text-xl font-black uppercase mb-3 text-foreground">EDUCATIONAL</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-brutal-yellow font-black">✓</span>
                <span className="font-bold text-foreground">Descriptive data only</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brutal-yellow font-black">✓</span>
                <span className="font-bold text-foreground">You choose how to use findings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brutal-yellow font-black">✓</span>
                <span className="font-bold text-foreground">Supports your advocacy</span>
              </li>
            </ul>
          </Card>

          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-background">
            <div className="bg-brutal-pink border-4 border-primary w-16 h-16 flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-foreground" />
            </div>
            <h3 className="text-xl font-black uppercase mb-3 text-foreground">NO COMPETITION</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-brutal-pink font-black">✓</span>
                <span className="font-bold text-foreground">We don't fundraise from your traffic</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brutal-pink font-black">✓</span>
                <span className="font-bold text-foreground">Donate button goes to YOU</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brutal-pink font-black">✓</span>
                <span className="font-bold text-foreground">Join list button goes to YOU</span>
              </li>
            </ul>
          </Card>
        </div>

        <div className="mt-12 max-w-4xl mx-auto">
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-background text-center">
            <p className="text-lg font-black uppercase text-foreground">
              LEGAL FAQ MEMO AVAILABLE FOR YOUR COUNSEL AND BOARD
            </p>
          </Card>
        </div>
      </Container>
    </SectionContainer>
  )
}
