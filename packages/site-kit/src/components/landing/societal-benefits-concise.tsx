"use client"

import Link from "next/link"
import { Container } from "@optimitron/neobrutalist-ui/ui/container"
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container"
import { ROICard } from "./roi-card"
import { InfiniteROICard } from "./infinite-roi-card"
import { ROUTES } from '../../lib/routes'

export default function SocietalBenefitsConcise() {
  return (
    <SectionContainer bgColor="cyan" borderPosition="bottom" padding="lg">
      <Container>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase text-center mb-8">
          💰 THE <span className="text-brutal-pink">MATH</span>
        </h2>

        <ROICard />

        <InfiniteROICard />

        {/* CTA to full research */}
        <div className="text-center mt-12">
          <Link
            href={ROUTES.research}
            className="inline-block bg-brutal-pink border-4 border-primary px-8 py-4 text-xl sm:text-2xl font-black uppercase shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all"
          >
            SEE THE FULL MATH →
          </Link>
          <p className="mt-4 font-bold text-sm">
            Charts, breakdowns, and all the nerdy details
          </p>
        </div>
      </Container>
    </SectionContainer>
  )
}
