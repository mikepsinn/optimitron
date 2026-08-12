"use client"

import { Card } from "@optimitron/neobrutalist-ui/ui/card"
import { Container } from "@optimitron/neobrutalist-ui/ui/container"
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container"
import { VoteOrShareButton } from "../shared/VoteOrShareButton"
import { Clock, MessageSquare, Shield } from "lucide-react"

/**
 * Survey Hero Section - Ultra-neutral for nervous nonprofits
 *
 * This is the hero section shown ONLY on the survey variant (trialabundancesurvey.org).
 * Language is intentionally neutral, research-focused, and devoid of movement/advocacy framing.
 */
export default function SurveyHeroSection() {
  return (
    <SectionContainer bgColor="background" borderPosition="bottom" padding="lg" className="relative py-12 md:py-20 lg:py-28">
      <Container>
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Title */}
          <h1 className="text-4xl font-black uppercase sm:text-5xl md:text-6xl lg:text-7xl mb-6">
            GLOBAL CLINICAL TRIAL{" "}
            <span className="text-brutal-pink">ABUNDANCE SURVEY</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl font-bold mb-8 max-w-3xl mx-auto">
            Research measuring public opinion on resource allocation between military spending and medical research
          </p>

          {/* Key Info Cards */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Card className="bg-brutal-cyan border-4 border-primary py-4 px-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-2deg] hover:rotate-0 hover:scale-105 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 cursor-pointer w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] flex flex-col items-center">
              <MessageSquare className="w-12 h-12 stroke-[3px]" />
              <div className="text-3xl font-black leading-none">2 QUESTIONS</div>
              <div className="text-sm font-bold">Brief survey</div>
            </Card>

            <Card className="bg-brutal-yellow border-4 border-primary py-4 px-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[1deg] hover:rotate-0 hover:scale-105 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 cursor-pointer w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] flex flex-col items-center">
              <Clock className="w-12 h-12 stroke-[3px]" />
              <div className="text-3xl font-black leading-none">30 SECONDS</div>
              <div className="text-sm font-bold">Time to complete</div>
            </Card>

            <Card className="bg-brutal-pink border-4 border-primary py-4 px-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-1deg] hover:rotate-0 hover:scale-105 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 cursor-pointer w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] flex flex-col items-center">
              <Shield className="w-12 h-12 stroke-[3px]" />
              <div className="text-3xl font-black leading-none">ANONYMOUS</div>
              <div className="text-sm font-bold">Your privacy protected</div>
            </Card>
          </div>

          {/* CTA Button - After Key Info */}
          <div className="mb-12">
            <VoteOrShareButton
              variant="hero"
              size="lg"
              className="!shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:!shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
              forceText="Take the Survey Now"
              onClick={(e: React.MouseEvent) => {
                const target = e.currentTarget as HTMLAnchorElement
                if (window.location.pathname === "/" && target.getAttribute("href") === "/#vote") {
                  e.preventDefault()
                  document.getElementById("vote")?.scrollIntoView({ behavior: "smooth" })
                }
              }}
            />
          </div>

          {/* Context & Impact Data */}
          <Card className="bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-left mb-8">
            <h2 className="text-2xl font-black uppercase mb-6 text-center">RESEARCH CONTEXT</h2>

            {/* Impact Statistics Grid */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-brutal-cyan border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-2xl font-black text-primary mb-1">10 YEARS</div>
                <div className="text-sm font-bold">Current regulatory delay for new treatments</div>
              </div>
              <div className="text-center p-4 bg-brutal-pink border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-2xl font-black text-white mb-1">98% CHEAPER</div>
                <div className="text-sm font-bold text-white">Pragmatic trials vs. traditional trials</div>
              </div>
              <div className="text-center p-4 bg-brutal-yellow border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-2xl font-black text-primary mb-1">MILLIONS</div>
                <div className="text-sm font-bold">Lives that could be saved annually</div>
              </div>
            </div>

            {/* What You'll Do */}
            <div className="space-y-3 text-base">
              <p>
                <strong>What you'll do:</strong> You'll see how humanity currently allocates resources,
                then indicate your preferred allocation between military spending and clinical trials.
              </p>
              <p>
                <strong>Why it matters:</strong> Your anonymous response contributes to quantifying
                global public opinion on this resource allocation question.
              </p>
            </div>
          </Card>
        </div>
      </Container>
    </SectionContainer>
  )
}
