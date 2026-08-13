import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { Sliders, Eye, ThumbsUp } from "lucide-react"

export function WhatTheSurveyMeasures() {
  return (
    <SectionContainer bgColor="background" borderPosition="bottom" padding="lg">
      <Container>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase text-center mb-4 text-foreground">
          WHAT THE SURVEY ASKS
        </h2>
        <p className="text-xl font-bold text-center text-foreground mb-12 max-w-3xl mx-auto">
          A 2-MINUTE EDUCATIONAL SURVEY ON PUBLIC HEALTH FUNDING PRIORITIES
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-card">
            <div className="bg-brutal-cyan border-4 border-primary w-16 h-16 flex items-center justify-center mb-4">
              <Sliders className="h-8 w-8 text-foreground" />
            </div>
            <h3 className="text-xl font-black uppercase mb-3 text-foreground">1. PRIORITY PREFERENCES</h3>
            <p className="font-bold text-foreground">
              Interactive slider: How would you allocate resources between current budget categories?
            </p>
          </Card>

          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-card">
            <div className="bg-brutal-pink border-4 border-primary w-16 h-16 flex items-center justify-center mb-4">
              <Eye className="h-8 w-8 text-foreground" />
            </div>
            <h3 className="text-xl font-black uppercase mb-3 text-foreground">2. EDUCATIONAL CONTEXT</h3>
            <p className="font-bold text-foreground">
              Shows actual data: Current spending ratio between defense and medical research funding globally
            </p>
          </Card>

          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-card">
            <div className="bg-brutal-yellow border-4 border-primary w-16 h-16 flex items-center justify-center mb-4">
              <ThumbsUp className="h-8 w-8 text-foreground" />
            </div>
            <h3 className="text-xl font-black uppercase mb-3 text-foreground">3. OPINION QUESTION</h3>
            <p className="font-bold text-foreground">
              "Would you support international cooperation to increase clinical trial funding?"
            </p>
          </Card>
        </div>

        <div className="mt-12 max-w-4xl mx-auto">
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-brutal-yellow text-center">
            <p className="text-xl font-black uppercase text-foreground">
              YOUR DASHBOARD: COMMUNITY RESPONSES + PREFERRED RESOURCE ALLOCATION DATA
            </p>
          </Card>
        </div>
      </Container>
    </SectionContainer>
  )
}
