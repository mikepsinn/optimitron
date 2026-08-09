import Layout from "../../components/layout"
import { Card } from "@/components/ui/card"
import { StatCardGrid, type StatCardProps } from "@/components/ui/stat-card"
import { CTASection } from "@/components/ui/cta-section"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { Users, TrendingUp, Globe, Heart } from "lucide-react"
import { ParameterValue } from "@/components/shared/ParameterValue"
import { VoteOrShareButton } from "@/components/shared/VoteOrShareButton"
import { getSiteConfig } from "@/lib/site-config"
import {
  RECOVERY_TRIAL_COST_REDUCTION_FACTOR,
  GLOBAL_DISEASE_DEATHS_DAILY,
  CURRENT_DISEASE_PATIENTS_GLOBAL,
  PEACE_DIVIDEND_ANNUAL_SOCIETAL_BENEFIT,
  DFDA_NET_SAVINGS_RD_ONLY_ANNUAL,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  DFDA_QUEUE_CLEARANCE_YEARS,
} from "@/lib/parameters-calculations-citations"
import { MESSAGING } from "@/lib/messaging"

// Use centralized messaging for timeline shift values
const { timelineShift } = MESSAGING.impact

export default function AboutPage() {
  const config = getSiteConfig()
  const showPoliticalContent = config.showPoliticalContent
  return (
    <Layout>
      {/* Hero Section */}
      <SectionContainer bgColor="foreground" borderPosition="none" padding="lg">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black uppercase leading-none mb-8">
                ABOUT
                <br />
                <span className="text-brutal-yellow">{config.name}</span>
              </h1>
              <p className="text-lg sm:text-xl font-bold mb-8">
                {showPoliticalContent ? (
                  <>{config.title.toUpperCase()} IS A GLOBAL CAMPAIGN TO MAKE SUFFERING OPTIONAL
                  BY ACCELERATING CURES THROUGH UBIQUITOUS PRAGMATIC CLINICAL TRIALS.</>
                ) : (
                  <>{config.title.toUpperCase()} IS A GLOBAL RESEARCH INITIATIVE TO
                  ACCELERATE MEDICAL PROGRESS THROUGH PRAGMATIC CLINICAL TRIALS.</>
                )}
              </p>
            </div>
            <div className="relative">
              <div className="bg-brutal-cyan border-4 border-background p-8 shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] transform -rotate-2">
                <div className="text-4xl sm:text-5xl md:text-6xl font-black mb-4">
                  <ParameterValue param={RECOVERY_TRIAL_COST_REDUCTION_FACTOR} />
                </div>
                <div className="font-bold uppercase">MORE EFFICIENT THAN TRADITIONAL TRIALS</div>
              </div>
            </div>
          </div>
        </Container>
      </SectionContainer>

      {/* Stats Section */}
      <SectionContainer bgColor="yellow" borderPosition="none" padding="lg">
        <Container>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase text-center mb-16">THE IMPACT</h2>
          <StatCardGrid
            columns={4}
            stats={[
              { icon: Globe, value: timelineShift.livesSaved, label: "LIVES SAVED", hover: true },
              {
                icon: TrendingUp,
                value: <ParameterValue param={RECOVERY_TRIAL_COST_REDUCTION_FACTOR} />,
                label: "COST REDUCTION",
                hover: true,
              },
              {
                icon: Heart,
                value: <ParameterValue param={GLOBAL_DISEASE_DEATHS_DAILY} />,
                label: "DAILY DEATHS",
                hover: true,
              },
              {
                icon: Users,
                value: <ParameterValue param={CURRENT_DISEASE_PATIENTS_GLOBAL} />,
                label: "PEOPLE SUFFERING",
                hover: true,
              },
            ] as StatCardProps[]}
          />
        </Container>
      </SectionContainer>

      {/* Leadership Section */}
      {/*
      <SectionContainer bgColor="background" borderPosition="none" padding="lg">
        <Container>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase text-center mb-16">TEAM</h2>
          <div className="max-w-2xl mx-auto">
            <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="relative">
                <img src="/professional-headshot.png" alt="Mike P. Sinn" className="w-full h-64 object-cover" />
                <div className="absolute bottom-4 left-4 bg-brutal-pink border-2 border-foreground px-3 py-1">
                  <span className="font-black uppercase text-xs text-brutal-pink-foreground">INTERIM DIRECTOR</span>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl sm:text-3xl font-black uppercase mb-4">MIKE SINN</h3>
              </div>
            </Card>
          </div>
        </Container>
      </SectionContainer>
      */}

      {/* Mission Section */}
      <SectionContainer bgColor="foreground" borderPosition="none" padding="lg">
        <Container>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase text-center mb-16">
            OUR <span className="text-brutal-cyan">MISSION</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {([
              {
                title: "R&D SAVINGS",
                description: (
                  <>
                    PRAGMATIC TRIALS COST <ParameterValue param={RECOVERY_TRIAL_COST_REDUCTION_FACTOR} /> LESS,
                    SAVING <ParameterValue param={DFDA_NET_SAVINGS_RD_ONLY_ANNUAL} /> ANNUALLY IN MEDICAL RESEARCH.
                  </>
                ),
                color: "bg-brutal-pink",
              },
              {
                title: "TIMELINE SHIFT",
                description: (
                  <>
                    INCREASING TRIAL CAPACITY{" "}
                    <ParameterValue param={DFDA_TRIAL_CAPACITY_MULTIPLIER} format={{ precision: 1 }} />{" "}
                    COMPRESSES THE DISEASE ERADICATION TIMELINE FROM{" "}
                    <ParameterValue param={STATUS_QUO_QUEUE_CLEARANCE_YEARS} format={{ precision: 0 }} /> YEARS
                    TO <ParameterValue param={DFDA_QUEUE_CLEARANCE_YEARS} format={{ precision: 0 }} /> YEARS.
                  </>
                ),
                color: "bg-brutal-cyan",
              },
              // Peace dividend & global security only shown on political/advocacy variants
              ...(showPoliticalContent ? [
                {
                  title: "PEACE DIVIDEND",
                  description: (
                    <>
                      REDUCING GLOBAL CONFLICT BY 1% SAVES{" "}
                      <ParameterValue param={PEACE_DIVIDEND_ANNUAL_SOCIETAL_BENEFIT} /> ANNUALLY IN DIRECT AND
                      INDIRECT COSTS.
                    </>
                  ),
                  color: "bg-brutal-yellow",
                },
                {
                  title: "GLOBAL SECURITY",
                  description: "EVERYONE GETS 1% MORE SECURITY WITH FEWER NUCLEAR WEAPONS POINTED AT THEM.",
                  color: "bg-brutal-yellow",
                },
              ] : []),
            ]).map((value, index) => (
              <Card
                key={index}
                className={`${value.color} border-4 border-background p-8 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:translate-x-2 hover:translate-y-2 hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all`}
              >
                <h3 className="text-xl sm:text-2xl font-black uppercase mb-4 text-foreground">{value.title}</h3>
                <p className="font-bold text-sm sm:text-base text-foreground">{value.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </SectionContainer>

      {/* CTA Section */}
      <CTASection
        bgColor="pink"
        heading={showPoliticalContent ? (
          <>
            READY TO
            <br />
            <span className="text-foreground">ERADICATE DISEASE?</span>
          </>
        ) : (
          <>
            TAKE THE
            <br />
            <span className="text-foreground">SURVEY</span>
          </>
        )}
      >
        <VoteOrShareButton
          variant="default"
          size="xl"
          className="bg-foreground text-background border-4 border-foreground hover:bg-background hover:text-foreground px-8 sm:px-12"
        />
      </CTASection>
    </Layout>
  )
}
