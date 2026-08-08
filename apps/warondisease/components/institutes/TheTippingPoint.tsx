"use client"

import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { useEffect, useState } from "react"
import { GLOBAL_REGISTERED_VOTERS } from "@/lib/parameters-calculations-citations"
import { ParameterValue } from "@/components/shared/ParameterValue"
import { MAJORITY_OF_HUMANS_ON_EARTH } from "@/lib/majority-humanity-target"

export function TheTippingPoint() {
  const [orgCount, setOrgCount] = useState(0)
  const [voteCount, setVoteCount] = useState(0)

  const TARGET = GLOBAL_REGISTERED_VOTERS.value
  const progressPercent = Math.min((voteCount / TARGET) * 100, 100)

  useEffect(() => {
    // TODO: Fetch real counts from API
    // For now using placeholder
    setOrgCount(12)
    setVoteCount(847)
  }, [])

  return (
    <SectionContainer bgColor="yellow" borderPosition="bottom" padding="lg">
      <Container>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase text-center mb-4 text-foreground">
          THE MAJORITY TARGET
        </h2>
        <p className="text-2xl sm:text-3xl font-black text-center text-foreground mb-12 max-w-3xl mx-auto">
          <ParameterValue param={MAJORITY_OF_HUMANS_ON_EARTH} /> HUMANS = THE POINT WHERE POLITICIANS START RETURNING CALLS
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          <Card className="bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-6xl sm:text-7xl font-black mb-4 text-brutal-cyan">{orgCount}</div>
            <div className="text-2xl font-black mb-2 text-foreground">ORGANIZATIONS</div>
            <div className="font-bold text-foreground">On the record</div>
          </Card>

          <Card className="bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-6xl sm:text-7xl font-black mb-4 text-brutal-pink">{voteCount.toLocaleString()}</div>
            <div className="text-2xl font-black mb-2 text-foreground">HUMANS COUNTED</div>
            <div className="font-bold text-foreground">The number goes up</div>
          </Card>
        </div>

        <div className="max-w-4xl mx-auto mb-8">
          <Card className="bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xl sm:text-2xl font-black mb-4 text-center text-foreground">
              PROGRESS TO <ParameterValue param={MAJORITY_OF_HUMANS_ON_EARTH} />
            </div>
            <div className="h-12 bg-background border-4 border-primary relative overflow-hidden">
              <div
                className="h-full bg-brutal-cyan transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-center mt-4 text-lg font-black text-foreground">
              {progressPercent.toFixed(4)}% • {(TARGET - voteCount).toLocaleString()} TO GO
            </div>
          </Card>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="bg-foreground border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-3xl sm:text-4xl font-black uppercase text-background">
              YOU CAN JOIN NOW OR EXPLAIN LATER THAT YOU WERE BUSY
            </div>
          </Card>
        </div>
      </Container>
    </SectionContainer>
  )
}
