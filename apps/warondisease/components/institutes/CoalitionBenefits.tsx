import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { Award, FileText, Trophy, Users } from "lucide-react"

const benefits = [
  {
    icon: Award,
    title: "PUBLIC RECOGNITION",
    description: "Featured on the coalition partners page with your logo and mission",
    color: "bg-brutal-cyan",
  },
  {
    icon: FileText,
    title: "JOINT REPORTS",
    description: "Inclusion in briefings and reports using the combined global dataset",
    color: "bg-brutal-pink",
  },
  {
    icon: Trophy,
    title: "LEADERBOARDS",
    description: "Optional visibility as a top organization by verified survey responses",
    color: "bg-brutal-yellow",
  },
]

export function CoalitionBenefits() {
  return (
    <SectionContainer bgColor="pink" borderPosition="bottom" padding="lg">
      <Container>
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="bg-foreground border-4 border-primary w-14 h-14 flex items-center justify-center">
            <Users className="h-7 w-7 text-background" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase text-foreground">
            COALITION STATUS
          </h2>
        </div>
        <p className="text-xl font-bold text-center text-foreground mb-12 max-w-3xl mx-auto">
          OPT IN TO SHARED OUTPUTS AND PUBLIC RECOGNITION
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <Card
                key={index}
                className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-background"
              >
                <div className={`${benefit.color} border-4 border-primary w-16 h-16 flex items-center justify-center mb-4`}>
                  <Icon className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="text-xl font-black uppercase mb-3 text-foreground">{benefit.title}</h3>
                <p className="font-bold text-foreground/80">{benefit.description}</p>
              </Card>
            )
          })}
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 bg-foreground text-center">
            <p className="text-xl sm:text-2xl font-black text-background">
              POSITION YOUR ORGANIZATION AS A DATA-DRIVEN VOICE ON TRIAL FUNDING AND PATIENT PRIORITIES
            </p>
          </Card>
        </div>
      </Container>
    </SectionContainer>
  )
}
