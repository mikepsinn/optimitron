import type { Metadata } from "next"

import Layout from "./layout"
import { ParameterValue } from "./shared/ParameterValue"
import { VoteOrShareButton } from "./shared/VoteOrShareButton"
import { Card } from "@optimitron/neobrutalist-ui/ui/card"
import { Container } from "@optimitron/neobrutalist-ui/ui/container"
import { CTASection } from "@optimitron/neobrutalist-ui/ui/cta-section"
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container"
import { StatCardGrid, type StatCardProps } from "@optimitron/neobrutalist-ui/ui/stat-card"
import { formatParameter } from "@optimitron/data/parameters/compact-format"
import {
  CURRENT_TRIAL_SLOTS_AVAILABLE,
  DFDA_ANNUAL_OPEX,
  DFDA_FIRST_TREATMENTS_PER_YEAR,
  DFDA_PATIENTS_FUNDABLE_ANNUALLY,
  DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS,
  DIH_TREASURY_TO_MEDICAL_RESEARCH_ANNUAL,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
  RECOVERY_TRIAL_COST_REDUCTION_FACTOR,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TREATY_ANNUAL_FUNDING,
  TREATY_REDUCTION_PCT,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  getCitation,
  type Parameter,
} from "@optimitron/data/parameters"
import { getSiteConfigForVariant } from "../lib/site-config"
import { VARIANTS } from "../lib/site-variant-types"

export type ResearchPageVariant = "campaign" | "survey"

const pragmaticTrialCost = formatParameter(DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT)
const queueStatusQuo = formatParameter(STATUS_QUO_QUEUE_CLEARANCE_YEARS)
const queueCompressed = formatParameter(DFDA_QUEUE_CLEARANCE_YEARS)
const livesSaved = formatParameter(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED)
const trialCapacityMultiplier = formatParameter(DFDA_TRIAL_CAPACITY_MULTIPLIER, { precision: 1 })

const headlineStats: StatCardProps[] = [
  {
    value: <ParameterValue param={DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT} />,
    label: "PRAGMATIC TRIAL COST",
    description: "Conservative per-patient estimate used in the model",
    color: "yellow",
    size: "lg",
  },
  {
    value: <ParameterValue param={TRADITIONAL_PHASE3_COST_PER_PATIENT} />,
    label: "TRADITIONAL PHASE 3 COST",
    description: "Median per-patient benchmark used for comparison",
    color: "default",
    size: "lg",
  },
  {
    value: <ParameterValue param={DFDA_TRIAL_CAPACITY_MULTIPLIER} format={{ precision: 1 }} />,
    label: "TRIAL CAPACITY",
    description: "More patients funded each year from the treaty model",
    color: "cyan",
    size: "lg",
  },
  {
    value: (
      <>
        <ParameterValue param={STATUS_QUO_QUEUE_CLEARANCE_YEARS} />
        {" -> "}
        <ParameterValue param={DFDA_QUEUE_CLEARANCE_YEARS} />
      </>
    ),
    label: "QUEUE CLEARANCE",
    description: "Modeled years to get first treatments across the current backlog",
    color: "pink",
    size: "lg",
  },
  {
    value: <ParameterValue param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED} />,
    label: "LIVES SAVED",
    description: "Modeled one-time effect of accelerating treatment timelines",
    color: "default",
    size: "lg",
  },
  {
    value: <ParameterValue param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS} />,
    label: "YEARS OF SUFFERING PREVENTED",
    description: "Expressed as DALYs averted in the model",
    color: "yellow",
    size: "lg",
  },
]

const mathSteps = [
  {
    step: "Treaty slice of military spending",
    value: <ParameterValue param={TREATY_ANNUAL_FUNDING} />,
    detail: (
      <>
        The model starts from <ParameterValue param={GLOBAL_MILITARY_SPENDING_ANNUAL_2024} /> in annual global
        military spending.
      </>
    ),
  },
  {
    step: "Funding allocated to trials",
    value: <ParameterValue param={DIH_TREASURY_TO_MEDICAL_RESEARCH_ANNUAL} />,
    detail: "That is the annual slice routed into pragmatic clinical trials.",
  },
  {
    step: "Platform operating cost",
    value: <ParameterValue param={DFDA_ANNUAL_OPEX} />,
    detail: "Annual operating cost is small relative to total trial funding.",
  },
  {
    step: "Patients fundable each year",
    value: (
      <>
        <ParameterValue param={DFDA_PATIENTS_FUNDABLE_ANNUALLY} />
        {"/year"}
      </>
    ),
    detail: (
      <>
        <ParameterValue param={DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT} /> per patient funds roughly{" "}
        <ParameterValue param={DFDA_PATIENTS_FUNDABLE_ANNUALLY} /> annual slots.
      </>
    ),
  },
  {
    step: "Current global slots today",
    value: (
      <>
        <ParameterValue param={CURRENT_TRIAL_SLOTS_AVAILABLE} />
        {"/year"}
      </>
    ),
    detail: (
      <>
        That is why the model lands at{" "}
        <ParameterValue param={DFDA_TRIAL_CAPACITY_MULTIPLIER} format={{ precision: 1 }} /> more capacity.
      </>
    ),
  },
]

const sourceCards = [
  makeSourceCard(
    GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
    "Base spending input for the treaty funding calculation."
  ),
  makeSourceCard(
    DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
    "Conservative pragmatic-trial cost assumption used in the model."
  ),
  makeSourceCard(
    TRADITIONAL_PHASE3_COST_PER_PATIENT,
    "Traditional per-patient comparison point used for the cost gap."
  ),
  makeSourceCard(
    NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
    "Current first-treatment rate used to derive the backlog."
  ),
  makeSourceCard(
    CURRENT_TRIAL_SLOTS_AVAILABLE,
    "Current annual trial-participant capacity used in the capacity calculation."
  ),
  makeSourceCard(
    DFDA_QUEUE_CLEARANCE_YEARS,
    "Calculated model output showing the compressed queue under expanded capacity."
  ),
]

export function generateCampaignResearchMetadata(): Metadata {
  const canonicalBaseUrl = getSiteConfigForVariant(VARIANTS.WAR_ON_DISEASE).baseUrl

  return {
    title: `Research: ${trialCapacityMultiplier} More Clinical Trial Capacity`,
    description: `Using the parameters in our economic model: pragmatic trials at ${pragmaticTrialCost} per patient turn 1% of military spending into ${trialCapacityMultiplier} more trial capacity, compress the treatment queue from ${queueStatusQuo} years to ${queueCompressed}, and model ${livesSaved} lives saved.`,
    alternates: {
      canonical: `${canonicalBaseUrl}/research`,
    },
    openGraph: {
      title: `Research: ${trialCapacityMultiplier} More Clinical Trial Capacity`,
      description: `${pragmaticTrialCost} pragmatic trials, ${queueStatusQuo} -> ${queueCompressed} backlog compression, ${livesSaved} lives saved.`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `Research: ${trialCapacityMultiplier} More Clinical Trial Capacity`,
      description: `${pragmaticTrialCost} pragmatic trials, ${queueStatusQuo} -> ${queueCompressed} backlog compression, ${livesSaved} lives saved.`,
    },
  }
}

export function generateSurveyResearchMetadata(): Metadata {
  const canonicalBaseUrl = getSiteConfigForVariant(VARIANTS.SURVEY).baseUrl
  const title = "Research Methodology and Data Sources"
  const description =
    "How the Global Clinical Trial Abundance Survey is designed, and the evidence behind pragmatic clinical trials."

  return {
    title,
    description,
    alternates: {
      canonical: `${canonicalBaseUrl}/research`,
    },
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export function ResearchPage({ variant }: { variant: ResearchPageVariant }) {

  // Survey variant: stripped-down methodology page — no advocacy, no military ROI, no quadrillions
  if (variant === "survey") {
    return (
      <Layout>
        <div className="min-h-screen bg-background">
          {/* Neutral Hero */}
          <SectionContainer bgColor="foreground" borderPosition="bottom" padding="lg">
            <Container size="md">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase text-center mb-6">
                METHODOLOGY &<br />
                <span className="text-brutal-cyan">DATA SOURCES</span>
              </h1>
              <p className="text-lg sm:text-xl font-bold text-center max-w-2xl mx-auto">
                How we designed the survey and the peer-reviewed evidence behind pragmatic clinical trials.
              </p>
            </Container>
          </SectionContainer>

          {/* Pragmatic Trials Evidence */}
          <SectionContainer bgColor="background" borderPosition="none" padding="lg">
            <Container size="md" className="space-y-8">
              <h2 className="text-3xl md:text-4xl font-black uppercase text-center mb-8">
                WHAT ARE <span className="text-brutal-pink">PRAGMATIC TRIALS?</span>
              </h2>
              <Card className="p-8 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="space-y-6 text-lg leading-relaxed">
                  <p>
                    Pragmatic clinical trials test treatments in{" "}
                    <span className="font-black">real-world healthcare settings</span> using existing
                    medical records and routine care, rather than creating expensive artificial research
                    environments.
                  </p>
                  <p>
                    The landmark{" "}
                    <span className="font-black text-brutal-pink">RECOVERY trial</span> at Oxford
                    University demonstrated this approach at scale: it enrolled 40,000+ patients across
                    176 NHS hospitals, identified effective COVID-19 treatments months ahead of
                    traditional trials, and did so at{" "}
                    <ParameterValue param={RECOVERY_TRIAL_COST_REDUCTION_FACTOR} className="font-black" />{" "}
                    <span className="font-black">lower cost</span> per patient.
                  </p>
                  <p>
                    RECOVERY is estimated to have saved over{" "}
                    <span className="font-black">1 million lives</span> worldwide by rapidly
                    identifying that dexamethasone reduces COVID mortality by one-third.
                  </p>
                </div>
              </Card>

              <h2 className="text-3xl md:text-4xl font-black uppercase text-center mb-8 pt-8">
                TIMELINE <span className="text-brutal-pink">COMPRESSION</span>
              </h2>
              <Card className="p-8 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-brutal-yellow">
                <div className="space-y-4 text-lg leading-relaxed">
                  <p>
                    At the current rate of ~15 diseases per year receiving a first effective treatment,
                    finding treatments for all ~6,650 currently untreatable diseases would take an
                    estimated{" "}
                    <ParameterValue
                      param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
                      format={{ precision: 0 }}
                      className="font-black"
                    />{" "}
                    <span className="font-black">years</span>.
                  </p>
                  <p>
                    Scaling pragmatic trials with additional funding would increase clinical trial
                    capacity by{" "}
                    <ParameterValue
                      param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
                      format={{ precision: 1 }}
                      className="font-black text-brutal-pink"
                    />, compressing that timeline to approximately{" "}
                    <ParameterValue
                      param={DFDA_QUEUE_CLEARANCE_YEARS}
                      format={{ precision: 0 }}
                      className="font-black text-brutal-pink"
                    />{" "}
                    <span className="font-black text-brutal-pink">years</span>.
                  </p>
                </div>
              </Card>

              <h2 className="text-3xl md:text-4xl font-black uppercase text-center mb-8 pt-8">
                KEY <span className="text-brutal-pink">FINDINGS</span>
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    stat: <ParameterValue param={RECOVERY_TRIAL_COST_REDUCTION_FACTOR} />,
                    label: "COST REDUCTION",
                    detail:
                      "Pragmatic trials cost a fraction of traditional trials by using existing healthcare infrastructure.",
                    color: "bg-brutal-cyan",
                  },
                  {
                    stat: (
                      <ParameterValue param={DFDA_TRIAL_CAPACITY_MULTIPLIER} format={{ precision: 1 }} />
                    ),
                    label: "CAPACITY INCREASE",
                    detail: (
                      <>
                        Scaling pragmatic trials compresses the disease eradication timeline from{" "}
                        <ParameterValue param={STATUS_QUO_QUEUE_CLEARANCE_YEARS} format={{ precision: 0 }} />{" "}
                        years to{" "}
                        <ParameterValue param={DFDA_QUEUE_CLEARANCE_YEARS} format={{ precision: 0 }} /> years.
                      </>
                    ),
                    color: "bg-brutal-yellow",
                  },
                  {
                    stat: "1M+",
                    label: "LIVES SAVED (RECOVERY)",
                    detail:
                      "RECOVERY's identification of dexamethasone as an effective treatment saved over 1 million lives globally.",
                    color: "bg-brutal-pink",
                  },
                  {
                    stat: "MONTHS",
                    label: "VS. YEARS",
                    detail:
                      "Pragmatic designs deliver actionable results in months, while traditional trials can take 5-10 years.",
                    color: "bg-brutal-cyan",
                  },
                ].map((item, i) => (
                  <Card
                    key={i}
                    className={`${item.color} border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
                  >
                    <div className="text-3xl sm:text-4xl font-black mb-1">{item.stat}</div>
                    <div className="text-sm font-black uppercase mb-3">{item.label}</div>
                    <p className="text-sm font-bold">{item.detail}</p>
                  </Card>
                ))}
              </div>

              <h2 className="text-3xl md:text-4xl font-black uppercase text-center mb-8 pt-8">
                <span className="text-brutal-pink">SOURCES</span>
              </h2>
              <Card className="p-8 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <ul className="space-y-4 text-base leading-relaxed">
                  <li>
                    <span className="font-black">RECOVERY Trial</span> — Horby, P. et al. (2021).
                    Dexamethasone in Hospitalized Patients with Covid-19. <em>New England Journal of Medicine</em>, 384(8), 693-704.
                  </li>
                  <li>
                    <span className="font-black">Trial Cost Analysis</span> — Martin, L. et al. (2017).
                    How much do clinical trials cost? <em>Nature Reviews Drug Discovery</em>, 16(6), 381-382.
                  </li>
                  <li>
                    <span className="font-black">Pragmatic Trial Design</span> — Ford, I. & Norrie, J. (2016).
                    Pragmatic Trials. <em>New England Journal of Medicine</em>, 375(5), 454-463.
                  </li>
                  <li>
                    <span className="font-black">RECOVERY Impact</span> — Wellcome Trust (2022).
                    The RECOVERY trial: one of the most important clinical trials ever run.
                  </li>
                </ul>
              </Card>
            </Container>
          </SectionContainer>

          {/* CTA */}
          <CTASection
            bgColor="yellow"
            heading={
              <>
                TAKE THE
                <br />
                <span className="text-foreground">SURVEY</span>
              </>
            }
          >
            <VoteOrShareButton
              variant="default"
              size="xl"
              className="bg-foreground text-background border-4 border-foreground hover:bg-background hover:text-foreground px-8 sm:px-12"
            />
          </CTASection>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <SectionContainer bgColor="yellow" borderPosition="bottom" padding="lg">
          <Container size="xl">
            <div className="max-w-5xl">
              <p className="text-sm font-black uppercase tracking-[0.2em] mb-4">Research & Evidence</p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-none mb-6">
                The research page only needs six numbers
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl font-bold max-w-4xl">
                In the current model, pragmatic trials at <ParameterValue param={DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT} /> per patient turn{" "}
                <ParameterValue param={TREATY_REDUCTION_PCT} /> of global military spending into{" "}
                <ParameterValue param={DFDA_TRIAL_CAPACITY_MULTIPLIER} format={{ precision: 1 }} /> more clinical-trial
                capacity, raise first treatments from{" "}
                <ParameterValue param={NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR} />/year to{" "}
                <ParameterValue param={DFDA_FIRST_TREATMENTS_PER_YEAR} />/year, and compress the modeled queue from{" "}
                <ParameterValue param={STATUS_QUO_QUEUE_CLEARANCE_YEARS} /> years to{" "}
                <ParameterValue param={DFDA_QUEUE_CLEARANCE_YEARS} />.
              </p>
            </div>
          </Container>
        </SectionContainer>

        <SectionContainer bgColor="pink" borderPosition="bottom" padding="lg">
          <Container size="xl">
            <StatCardGrid stats={headlineStats} columns={3} />
          </Container>
        </SectionContainer>

        <SectionContainer bgColor="background" borderPosition="bottom" padding="lg">
          <Container size="xl">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="p-6 sm:p-8 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-background gap-8">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black uppercase mb-3">
                    How <ParameterValue param={TREATY_REDUCTION_PCT} /> becomes{" "}
                    <ParameterValue param={DFDA_TRIAL_CAPACITY_MULTIPLIER} format={{ precision: 1 }} /> more trial
                    capacity
                  </h2>
                  <p className="text-base sm:text-lg">This is the full funding-to-capacity chain.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {mathSteps.map((item, index) => (
                    <Card
                      key={item.step}
                      className="p-5 border-4 border-primary shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-brutal-cyan gap-3"
                    >
                      <div className="text-xs font-black uppercase tracking-[0.2em]">Step {index + 1}</div>
                      <div className="text-3xl sm:text-4xl font-black">{item.value}</div>
                      <div className="text-sm font-black uppercase">{item.step}</div>
                      <p className="text-sm">{item.detail}</p>
                    </Card>
                  ))}
                </div>
              </Card>

              <Card className="p-6 sm:p-8 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-brutal-yellow gap-6">
                <div>
                  <div className="text-sm font-black uppercase tracking-[0.2em] mb-2">Cost difference</div>
                  <div className="text-4xl sm:text-5xl font-black mb-3">
                    <ParameterValue param={TRADITIONAL_PHASE3_COST_PER_PATIENT} />
                    {" -> "}
                    <ParameterValue param={DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT} />
                  </div>
                  <p className="text-base sm:text-lg">
                    These two per-patient cost assumptions drive the capacity model.
                  </p>
                </div>
                <div className="border-t-4 border-primary pt-6">
                  <div className="text-sm font-black uppercase tracking-[0.2em] mb-2">Capacity result</div>
                  <div className="text-4xl sm:text-5xl font-black mb-3">
                    <ParameterValue param={DFDA_TRIAL_CAPACITY_MULTIPLIER} format={{ precision: 1 }} />
                  </div>
                  <p className="text-base sm:text-lg">
                    Roughly <ParameterValue param={DFDA_PATIENTS_FUNDABLE_ANNUALLY} />
                    /year funded versus <ParameterValue param={CURRENT_TRIAL_SLOTS_AVAILABLE} />
                    /year today.
                  </p>
                </div>
              </Card>
            </div>
          </Container>
        </SectionContainer>

        <SectionContainer bgColor="cyan" borderPosition="bottom" padding="lg">
          <Container size="xl">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <Card className="p-6 sm:p-8 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-background gap-6">
                <div>
                  <div className="text-sm font-black uppercase tracking-[0.2em] mb-2">Queue compression</div>
                  <div className="text-5xl sm:text-6xl font-black mb-3">
                    <ParameterValue param={STATUS_QUO_QUEUE_CLEARANCE_YEARS} />
                    {" -> "}
                    <ParameterValue param={DFDA_QUEUE_CLEARANCE_YEARS} />
                  </div>
                  <p className="text-base sm:text-lg">
                    At the current rate of <ParameterValue param={NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR} /> first
                    treatments per year, the untreated-disease queue clears in about{" "}
                    <ParameterValue param={STATUS_QUO_QUEUE_CLEARANCE_YEARS} /> years. With{" "}
                    <ParameterValue param={DFDA_TRIAL_CAPACITY_MULTIPLIER} format={{ precision: 1 }} /> more capacity,
                    the model raises that rate to <ParameterValue param={DFDA_FIRST_TREATMENTS_PER_YEAR} />
                    /year and cuts the queue to <ParameterValue param={DFDA_QUEUE_CLEARANCE_YEARS} /> years.
                  </p>
                </div>
              </Card>

              <div className="grid gap-6 md:grid-cols-3">
                <Card className="p-6 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-brutal-pink text-white gap-3">
                  <div className="text-4xl sm:text-5xl font-black">
                    <ParameterValue param={NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR} />
                    {" -> "}
                    <ParameterValue param={DFDA_FIRST_TREATMENTS_PER_YEAR} />
                  </div>
                  <div className="text-sm font-black uppercase">First treatments per year</div>
                  <p className="text-sm">Modeled increase in diseases receiving a first effective treatment each year.</p>
                </Card>
                <Card className="p-6 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-background gap-3">
                  <div className="text-4xl sm:text-5xl font-black">
                    <ParameterValue param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED} />
                  </div>
                  <div className="text-sm font-black uppercase">Lives saved</div>
                  <p className="text-sm">One-time modelled effect of cures arriving earlier across the backlog.</p>
                </Card>
                <Card className="p-6 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-brutal-yellow gap-3">
                  <div className="text-4xl sm:text-5xl font-black">
                    <ParameterValue param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS} />
                  </div>
                  <div className="text-sm font-black uppercase">DALYs averted</div>
                  <p className="text-sm">This is the model&apos;s answer to years of suffering prevented.</p>
                </Card>
              </div>
            </div>

            <Card className="mt-8 p-6 sm:p-8 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-foreground text-background gap-4">
              <div className="text-sm font-black uppercase tracking-[0.2em]">Human impact</div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-black">
                <ParameterValue
                  param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS}
                  format={{ precision: 2 }}
                />
                {" hours"}
              </div>
              <p className="text-base sm:text-lg max-w-4xl">
                In the same model, the combined capacity expansion plus efficacy-lag removal shifts treatment timelines
                by <ParameterValue param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS} /> years on average and avoids{" "}
                <ParameterValue
                  param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS}
                  format={{ precision: 2 }}
                />{" "}
                hours of suffering. That is the plain language version of the{" "}
                <ParameterValue param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS} /> DALYs figure.
              </p>
            </Card>
          </Container>
        </SectionContainer>

        <SectionContainer bgColor="background" borderPosition="bottom" padding="lg">
          <Container size="xl">
            <div className="max-w-4xl mb-8">
              <h2 className="text-3xl md:text-4xl font-black uppercase mb-3">Source trail</h2>
              <p className="text-base sm:text-lg">
                These are the source links and calculation links behind the main claims on this page.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {sourceCards.map((source) => (
                <Card
                  key={`${source.title}-${source.href}`}
                  className="p-6 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-background gap-4"
                >
                  <div className="text-sm font-black uppercase tracking-[0.2em]">{source.kicker}</div>
                  <h3 className="text-xl font-black uppercase">{source.title}</h3>
                  <p className="text-sm font-bold">{source.note}</p>
                  {source.href ? (
                    <a
                      href={source.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-primary text-primary-foreground px-4 py-3 text-sm font-black uppercase border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      View source
                    </a>
                  ) : (
                    <div className="text-sm font-bold">No external URL is attached to this item.</div>
                  )}
                </Card>
              ))}
            </div>
          </Container>
        </SectionContainer>

        <SectionContainer bgColor="yellow" borderPosition="none" padding="lg">
          <Container size="md" className="text-center">
            <h2 className="text-3xl md:text-4xl font-black uppercase mb-4">If the math is right, act on it</h2>
            <p className="text-lg md:text-xl font-bold mb-8">
              The case is straightforward: cheap pragmatic trials plus the treaty reallocation move the cure timeline by
              centuries.
            </p>
            <VoteOrShareButton
              variant="default"
              size="xl"
              className="px-12 py-6 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px]"
            />
          </Container>
        </SectionContainer>
      </div>
    </Layout>
  )
}

function makeSourceCard(param: Parameter, note: string) {
  const citation = getCitation(param)

  return {
    kicker: citation ? "Published source" : "Calculation",
    title: citation?.title || param.displayName || param.parameterName || "Source",
    href: citation?.URL || param.sourceUrl || param.calculationsUrl || param.manualPageUrl,
    note,
  }
}
