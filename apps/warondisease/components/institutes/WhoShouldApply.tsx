import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { Heart, Users, FlaskConical, Microscope, Network, CheckCircle } from "lucide-react"

const targetAudiences = [
  {
    icon: Heart,
    title: "DISEASE FOUNDATIONS",
    description: "Alzheimer's, cancer, rare diseases, and other condition-specific organizations",
    color: "bg-brutal-pink",
  },
  {
    icon: Users,
    title: "PATIENT ADVOCACY",
    description: "Patient advocacy organizations and caregiver networks",
    color: "bg-brutal-cyan",
  },
  {
    icon: FlaskConical,
    title: "TRIAL NONPROFITS",
    description: "Nonprofits that run or support clinical trials or trial access",
    color: "bg-brutal-yellow",
  },
  {
    icon: Microscope,
    title: "RESEARCH CHARITIES",
    description: "Organizations focused on prevention, cures, and medical innovation",
    color: "bg-brutal-pink",
  },
  {
    icon: Network,
    title: "TRIAL NETWORKS",
    description: "Trial networks or consortia seeking better evidence of patient priorities",
    color: "bg-brutal-cyan",
  },
]

export function WhoShouldApply() {
  return (
    <SectionContainer bgColor="yellow" borderPosition="bottom" padding="lg">
      <Container>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase text-center mb-4 text-foreground">
          WHO CAN JOIN
        </h2>
        <p className="text-xl font-bold text-center text-foreground mb-12 max-w-3xl mx-auto">
          THIS PROGRAM IS DESIGNED FOR ORGANIZATIONS THAT CARE ABOUT ACCELERATING CURES
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {targetAudiences.map((audience, index) => {
            const Icon = audience.icon
            return (
              <Card
                key={index}
                className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-background"
              >
                <div className={`${audience.color} border-4 border-primary w-14 h-14 flex items-center justify-center mb-4`}>
                  <Icon className="h-7 w-7 text-foreground" />
                </div>
                <h3 className="text-lg font-black uppercase mb-2 text-foreground">{audience.title}</h3>
                <p className="font-bold text-foreground/80">{audience.description}</p>
              </Card>
            )
          })}
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 bg-foreground">
            <div className="flex items-start gap-4">
              <div className="bg-brutal-cyan border-4 border-background w-12 h-12 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-background">
                  IF YOU WORK TO REDUCE THE BURDEN OF ANY DISEASE AND ENGAGE PATIENTS, CAREGIVERS, CLINICIANS, OR SUPPORTERS — YOU ARE A GOOD CANDIDATE.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </SectionContainer>
  )
}
