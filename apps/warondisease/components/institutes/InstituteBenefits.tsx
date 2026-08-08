import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { Users, Globe, Microscope } from "lucide-react"

export function InstituteBenefits() {
  return (
    <SectionContainer bgColor="background" borderPosition="none" padding="lg">
      <Container>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase text-center mb-12 text-foreground">
          WHY BECOME AN OFFICIAL PARTNER?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-card">
            <div className="bg-brutal-cyan border-4 border-primary w-16 h-16 flex items-center justify-center mb-4">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-black uppercase mb-3 text-foreground">ENGAGE YOUR COMMUNITY</h3>
            <p className="font-bold text-foreground">
              Give your supporters a voice in the fight for medical research funding. Show them their impact.
            </p>
          </Card>
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-card">
            <div className="bg-brutal-yellow border-4 border-primary w-16 h-16 flex items-center justify-center mb-4">
              <Globe className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-black uppercase mb-3 text-foreground">AMPLIFY YOUR MISSION</h3>
            <p className="font-bold text-foreground">
              Join a global movement to redirect military spending to cure diseases and save lives.
            </p>
          </Card>
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-card">
            <div className="bg-brutal-pink border-4 border-primary w-16 h-16 flex items-center justify-center mb-4">
              <Microscope className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-black uppercase mb-3 text-foreground">SIMPLE INTEGRATION</h3>
            <p className="font-bold text-foreground">
              Add the survey to your site in 2 minutes. Get your custom URL and track your community's engagement.
            </p>
          </Card>
        </div>
      </Container>
    </SectionContainer>
  )
}
