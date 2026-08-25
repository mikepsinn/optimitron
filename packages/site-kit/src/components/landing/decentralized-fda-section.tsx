import { Card } from "@optimitron/neobrutalist-ui/ui/card";
import { Container } from "@optimitron/neobrutalist-ui/ui/container";
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container";
import { Search, BarChart3, ShoppingCart, Star } from "lucide-react";

interface DecentralizedFDASectionProps {
  mode?: "default" | "medical-freedom";
}

export default function DecentralizedFDASection({
  mode = "default",
}: DecentralizedFDASectionProps) {
  const medicalFreedom = mode === "medical-freedom";
  const features = [
    {
      icon: Search,
      title: "Search Any Treatment",
      description: medicalFreedom
        ? "Find drugs, supplements, diets, and devices ranked by evidence from real-world outcomes"
        : "Find drugs, supplements, diets, devices - everything ranked by real-world effectiveness",
      color: "bg-brutal-yellow",
    },
    {
      icon: BarChart3,
      title: "See Real Outcomes",
      description: medicalFreedom
        ? "Not marketing claims. Pooled patient outcomes show what helped, what harmed, and for whom"
        : "Not marketing claims. Actual data from millions of real patients showing what works",
      color: "bg-brutal-cyan",
    },
    {
      icon: ShoppingCart,
      title: medicalFreedom
        ? "Contribute to Evidence"
        : "Join Trials Instantly",
      description: medicalFreedom
        ? "When you and your clinician choose a treatment, standardized outcomes can strengthen the public evidence base"
        : "One-click enrollment in pragmatic trials. Get paid to test treatments while helping humanity",
      color: "bg-brutal-pink",
    },
    {
      icon: Star,
      title: "Consumer Reports for Drugs",
      description:
        "Transparent rankings based on effectiveness, side effects, and cost-effectiveness",
      color: "bg-brutal-yellow",
    },
  ];

  const howItWorks = [
    {
      number: "1",
      title: "YOU SEARCH",
      description: medicalFreedom
        ? 'Enter "migraine." See preventive drugs, devices, supplements, and behavior changes ranked by evidence.'
        : "Enter your condition. Get a ranked list of every treatment ever tested.",
      color: "bg-brutal-yellow",
    },
    {
      number: "2",
      title: "YOU COMPARE",
      description: medicalFreedom
        ? "Compare monthly migraine days, side effects, cost, and which patients improved."
        : "See side-by-side outcomes: LDL reduction, survival rates, quality of life - actual numbers, not promises.",
      color: "bg-brutal-cyan",
    },
    {
      number: "3",
      title: "YOU DECIDE",
      description: medicalFreedom
        ? "Choose with your clinician. Record the same outcomes at follow-up so the pooled evidence improves."
        : "Choose based on data, not marketing budgets. Your body, your choice, informed by millions of data points.",
      color: "bg-brutal-pink",
    },
  ];

  return (
    <SectionContainer
      id="decentralized-fda-section"
      bgColor="background"
      borderPosition="bottom"
      padding="lg"
      className="py-12 md:py-24 lg:py-32"
    >
      <Container>
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black uppercase sm:text-5xl md:text-6xl lg:text-7xl mb-6">
            A DECENTRALIZED{" "}
            <span className="text-brutal-pink">
              FRAMEWORK FOR DRUG ASSESSMENT
            </span>
          </h2>
          <p className="text-xl sm:text-2xl md:text-3xl font-black uppercase mb-4">
            CONSUMER REPORTS FOR DRUGS
          </p>
          <p className="text-lg sm:text-xl font-bold max-w-3xl mx-auto">
            {medicalFreedom
              ? "Connect treatment access to standardized, public outcomes so every patient decision can improve the next one."
              : "A decentralized framework for drug assessment integrated into standard healthcare could both radically improve safety and allow patients to effortlessly participate in pragmatic decentralized clinical trials."}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className={`${feature.color} border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-transform`}
              >
                <Icon className="h-12 w-12 mb-4" strokeWidth={3} />
                <h4 className="text-xl font-black uppercase mb-2">
                  {feature.title}
                </h4>
                <p className="font-bold">{feature.description}</p>
              </Card>
            );
          })}
        </div>

        {/* How It Works */}
        <Card className="bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-12">
          <h3 className="text-2xl sm:text-3xl font-black uppercase text-center mb-8">
            {medicalFreedom
              ? "ONE EXAMPLE: MIGRAINE"
              : "HOW IT WORKS (FOR PATIENTS)"}
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center">
                <div
                  className={`${step.color} border-4 border-primary w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
                >
                  <span className="text-3xl font-black">{step.number}</span>
                </div>
                <h4 className="text-xl font-black uppercase mb-2">
                  {step.title}
                </h4>
                <p className="font-bold text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* The Numbers */}
        {!medicalFreedom && (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-brutal-yellow border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
              <div className="text-4xl sm:text-5xl font-black mb-2">82X</div>
              <div className="font-black uppercase text-lg mb-2">CHEAPER</div>
              <div className="font-bold text-sm mb-3">
                $500/patient (Oxford RECOVERY) vs $48K (traditional trials)
              </div>
            </Card>
            <Card className="bg-brutal-cyan border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
              <div className="text-4xl sm:text-5xl font-black mb-2">
                2 YEARS
              </div>
              <div className="font-black uppercase text-lg mb-2">NOT 17</div>
              <div className="font-bold text-sm">
                Time to get life-saving treatments to patients who need them now
              </div>
            </Card>
            <Card className="bg-brutal-pink border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
              <div className="text-4xl sm:text-5xl font-black mb-2 text-brutal-pink-foreground">
                $50B
              </div>
              <div className="font-black uppercase text-lg mb-2 text-brutal-pink-foreground">
                SAVED
              </div>
              <div className="font-bold text-sm text-brutal-pink-foreground">
                Annual R&amp;D cost savings from decentralized pragmatic trials
              </div>
            </Card>
          </div>
        )}
      </Container>
    </SectionContainer>
  );
}
