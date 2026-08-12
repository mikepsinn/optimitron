import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { Share2, BarChart3, X } from "lucide-react"

export function WhatPartnerInstituteMeans() {
  return (
    <SectionContainer bgColor="background" borderPosition="bottom" padding="lg">
      <Container>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase text-center mb-4 text-foreground">
          WHAT "PARTNER INSTITUTE" MEANS
        </h2>
        <p className="text-xl font-bold text-center text-foreground/80 mb-12 max-w-3xl mx-auto">
          A SIMPLE DESIGNATION FOR ORGANIZATIONS JOINING THE COALITION
        </p>

        <div className="max-w-4xl mx-auto mb-12">
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 bg-brutal-cyan">
            <h3 className="text-2xl font-black uppercase mb-6 text-foreground text-center">
              A PARTNER INSTITUTE IS:
            </h3>
            <p className="text-lg font-bold text-foreground mb-6 text-center">
              Any nonprofit, foundation, or research group that:
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-4 bg-background border-4 border-primary p-4">
                <div className="bg-brutal-pink border-4 border-primary w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <Share2 className="h-5 w-5 text-foreground" />
                </div>
                <p className="text-lg font-bold text-foreground">
                  Hosts or promotes the Global Clinical Trial Abundance Survey to its community
                </p>
              </div>
              <div className="flex items-start gap-4 bg-background border-4 border-primary p-4">
                <div className="bg-brutal-yellow border-4 border-primary w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-5 w-5 text-foreground" />
                </div>
                <p className="text-lg font-bold text-foreground">
                  Uses the resulting data to advocate for better clinical trial funding and access
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-background">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-brutal-cyan border-4 border-primary w-10 h-10 flex items-center justify-center">
                <X className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="text-xl font-black uppercase text-foreground">NO SEPARATE ENTITY</h3>
            </div>
            <p className="font-bold text-foreground/80">
              There is no separate legal entity to join. You remain fully independent.
            </p>
          </Card>

          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-background">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-brutal-pink border-4 border-primary w-10 h-10 flex items-center justify-center">
                <X className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="text-xl font-black uppercase text-foreground">NO MEMBERSHIP FEE</h3>
            </div>
            <p className="font-bold text-foreground/80">
              Free to join. No hidden costs. No ongoing financial commitment.
            </p>
          </Card>
        </div>

        <div className="max-w-4xl mx-auto mt-8">
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-brutal-yellow text-center">
            <p className="text-lg sm:text-xl font-black uppercase text-foreground">
              THE DESIGNATION SIMPLY REFLECTS PARTICIPATION IN THE SURVEY COALITION AND ACCESS TO ITS TOOLS AND OUTPUTS
            </p>
          </Card>
        </div>
      </Container>
    </SectionContainer>
  )
}
