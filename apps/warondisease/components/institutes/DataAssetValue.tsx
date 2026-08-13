import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { FileText, PieChart, Presentation } from "lucide-react"
import { ParameterValue } from "@/components/shared/ParameterValue"
import { MAJORITY_OF_HUMANS_ON_EARTH } from "@/lib/majority-humanity-target"

export function DataAssetValue() {
  return (
    <SectionContainer bgColor="foreground" borderPosition="bottom" padding="lg">
      <Container>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase text-center mb-4">
          THE DATA ASSET YOU GET
        </h2>
        <p className="text-xl font-bold text-center mb-12 max-w-3xl mx-auto">
          EVIDENCE YOU CAN USE IN GRANTS, POLICY BRIEFS, AND DONOR REPORTS
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] p-6 bg-brutal-cyan">
            <div className="bg-background border-4 border-primary w-16 h-16 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-foreground" />
            </div>
            <h3 className="text-xl font-black uppercase mb-3 text-foreground">GRANT APPLICATIONS</h3>
            <p className="font-bold text-foreground mb-4">
              "72% of our community wants public clinical trial funding at least doubled"
            </p>
            <p className="text-sm font-bold text-foreground">
              → Drop into grant proposals to demonstrate community support
            </p>
          </Card>

          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] p-6 bg-brutal-pink">
            <div className="bg-background border-4 border-primary w-16 h-16 flex items-center justify-center mb-4">
              <Presentation className="h-8 w-8 text-foreground" />
            </div>
            <h3 className="text-xl font-black uppercase mb-3 text-foreground">POLICY TESTIMONY</h3>
            <p className="font-bold text-foreground mb-4">
              "Our 10,000 verified respondents support redirecting 1% of military budgets to trials"
            </p>
            <p className="text-sm font-bold text-foreground">
              → Strengthen advocacy with hard numbers, not anecdotes
            </p>
          </Card>

          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] p-6 bg-brutal-yellow">
            <div className="bg-background border-4 border-primary w-16 h-16 flex items-center justify-center mb-4">
              <PieChart className="h-8 w-8 text-foreground" />
            </div>
            <h3 className="text-xl font-black uppercase mb-3 text-foreground">DONOR REPORTS</h3>
            <p className="font-bold text-foreground mb-4">
              &quot;Show supporters: &apos;Your voice joined{" "}
              <ParameterValue param={MAJORITY_OF_HUMANS_ON_EARTH} /> humans demanding trial abundance&apos;&quot;
            </p>
            <p className="text-sm font-bold text-foreground">
              → Prove the gap between "I care about this" and "I did something about it" is 2 minutes
            </p>
          </Card>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] p-8 bg-background text-center">
            <p className="text-2xl sm:text-3xl font-black uppercase text-foreground">
              YOUR DASHBOARD: EXPORTABLE CHARTS, SEGMENTED BY COUNTRY + DEMOGRAPHICS
            </p>
          </Card>
        </div>
      </Container>
    </SectionContainer>
  )
}
