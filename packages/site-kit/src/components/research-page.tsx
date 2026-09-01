import type { Metadata } from "next"
import Link from "next/link"
import type { ReactNode } from "react"

import Layout from "./layout"
import { ParameterValue } from "./shared/ParameterValue"
import { VoteOrShareButton } from "./shared/VoteOrShareButton"
import { Button } from "@optimitron/neobrutalist-ui/ui/button"
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
  GLOBAL_CLINICAL_TRIALS_SPENDING_ANNUAL,
  GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  GLOBAL_POPULATION_2024,
  MILITARY_TO_CLINICAL_TRIALS_SPENDING_RATIO,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
  RECOVERY_TRIAL_COST_PER_PATIENT,
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

const SIPRI_2024_MILITARY_SPENDING_USD = 2_718_000_000_000
const SURVEY_MAJORITY_SHARE = 0.51
const GOVERNMENT_TRIAL_SHARE_OF_MILITARY_PCT =
  (GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL.value / SIPRI_2024_MILITARY_SPENDING_USD) * 100
const RECOVERY_DAYS_TO_DEXAMETHASONE = Math.round(
  (Date.UTC(2020, 5, 16) - Date.UTC(2020, 2, 19)) / (24 * 60 * 60 * 1000)
)
const surveyMajorityTarget: Parameter = {
  ...GLOBAL_POPULATION_2024,
  value: GLOBAL_POPULATION_2024.value * SURVEY_MAJORITY_SHARE,
  parameterName: "SURVEY_MAJORITY_RESPONSE_TARGET",
  displayName: "51% global response threshold",
  description: "Current global-population parameter multiplied by 51%.",
  sourceType: "calculated",
  formula: "GLOBAL_POPULATION_2024 × 51%",
  inputs: ["GLOBAL_POPULATION_2024"],
  computeExpr: "GLOBAL_POPULATION_2024 * 0.51",
}
const pivotalTrialMedianCostPerParticipant: Parameter = {
  ...TRADITIONAL_PHASE3_COST_PER_PATIENT,
  value: 41_413,
  parameterName: "PIVOTAL_TRIAL_MEDIAN_COST_PER_PARTICIPANT",
  displayName: "Pivotal trial median cost per participant",
  description:
    "Median estimated cost per enrolled participant across 225 pivotal trials supporting US drug approvals from 2015 through 2017.",
  sourceRef: undefined,
  sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7295430/",
  calculationsUrl: undefined,
  manualPageUrl: undefined,
  manualPageTitle: undefined,
  confidenceInterval: undefined,
}
const embeddedPragmaticTrialMedianCostPerParticipant: Parameter = {
  ...DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  value: 97,
  parameterName: "EMBEDDED_PRAGMATIC_TRIAL_MEDIAN_COST_PER_PARTICIPANT",
  displayName: "Embedded pragmatic trial median cost per participant",
  description:
    "Median research cost per randomized participant among 64 embedded pragmatic trials with available cost data.",
  sourceRef: undefined,
  sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6508852/",
  calculationsUrl: undefined,
  manualPageUrl: undefined,
  manualPageTitle: undefined,
  confidenceInterval: undefined,
}
const governmentTrialSpendingRange = GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL.confidenceInterval
  ?.map((value) =>
    formatParameter({
      ...GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL,
      value,
    })
  )
  .join("–")

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
  const title = "Clinical Trial Evidence and Data Sources"
  const description =
    "Peer-reviewed evidence for pragmatic trials and the assumptions behind the Global Clinical Trial Abundance Survey's capacity model."

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
  if (variant === "survey") {
    return <SurveyResearchPage />
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
                  <p className="text-sm">One-time modeled effect of cures arriving earlier across the backlog.</p>
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

function SurveyResearchPage() {
  const coordinationActors = [
    ["Patients", "Ask about eligible trials, contribute outcomes, and identify unanswered treatment questions."],
    ["Physicians", "Offer eligible patients trial participation through routine care."],
    ["Health systems", "Embed randomization and outcome collection in clinical workflows and records."],
    ["Researchers", "Publish reusable protocols, interoperable measures, and transparent analyses."],
    ["Foundations", "Fund shared trial infrastructure and questions that lack commercial incentives."],
    ["Insurers", "Support routine-care trial participation and evidence generation for covered treatments."],
    ["Treatment developers", "Supply interventions and support comparative studies, including low-margin uses."],
    ["Politicians", "Propose access, funding, privacy, and interoperability reforms."],
    ["Governments", "Fund public trial networks and coordinate standards across borders."],
  ]
  const coordinationConditions = [
    "One verified response per person",
    "Transparent methodology",
    "Country-level results",
    "Representative-sample reporting kept separate from self-selected participation",
    "Clear translations",
    "Published recruitment sources",
    "Protection of respondent privacy",
    "Concrete follow-up paths for patients, physicians, organizations, funders, and governments",
  ]
  const coordinationChain = [
    "Verified preferences",
    "Common knowledge and political mandate",
    "Trial-access and funding reforms",
    "More physician-embedded pragmatic trials",
    "Faster evidence",
    "Earlier adoption of effective treatments",
    "Reduced disease burden",
  ]

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <SectionContainer bgColor="foreground" borderPosition="bottom" padding="lg">
          <Container size="xl">
            <div className="mx-auto max-w-5xl text-center text-background">
              <p className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-brutal-cyan">
                Independent research initiative
              </p>
              <h1 className="mb-6 text-4xl font-black uppercase leading-none sm:text-5xl md:text-6xl">
                Evidence behind the
                <br />
                <span className="text-brutal-pink">Trial Abundance Survey</span>
              </h1>
              <p className="mx-auto max-w-3xl text-lg font-bold sm:text-xl">
                The three-question survey stays brief. This page separates observed evidence from estimates, model
                projections, and a coordination hypothesis about what verified public preferences could change.
              </p>
            </div>
          </Container>
        </SectionContainer>

        <SectionContainer bgColor="background" borderPosition="bottom" padding="lg">
          <Container size="xl">
            <div className="mb-8 max-w-4xl">
              <h2 className="mb-3 text-3xl font-black uppercase md:text-4xl">How to read the claims</h2>
              <p className="text-lg font-bold">
                The label on each claim matters. A published observation is not the same thing as an estimated global
                denominator, a model output, or a forecast about collective action.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <EvidenceTypeCard
                label="Observed evidence"
                color="bg-brutal-cyan"
                description="Dates, trial results, designs, and study findings reported by the cited institutions or papers."
              />
              <EvidenceTypeCard
                label="Estimate"
                color="bg-brutal-yellow"
                description="A best current approximation used where no complete global accounting exists."
              />
              <EvidenceTypeCard
                label="Model projection"
                color="bg-background"
                description="A calculated scenario that depends on explicit inputs and assumptions."
              />
              <EvidenceTypeCard
                label="Coordination hypothesis"
                color="bg-brutal-pink text-white"
                description="A plausible pathway to test, not an observed survey result or an automatic policy effect."
              />
            </div>
          </Container>
        </SectionContainer>

        <SectionContainer bgColor="yellow" borderPosition="bottom" padding="lg">
          <Container size="xl">
            <div className="mb-8 max-w-4xl">
              <p className="mb-3 text-sm font-black uppercase tracking-[0.2em]">Observed input + model estimate</p>
              <h2 className="mb-4 text-3xl font-black uppercase md:text-5xl">Government spending context</h2>
              <p className="text-lg font-bold">
                The survey&apos;s allocation question compares two categories of government spending. It does not
                compare military spending with all public and private medical research.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <ResearchStatCard
                label="Observed: military spending"
                value={
                  <a
                    href="https://www.sipri.org/publications/2025/sipri-fact-sheets/trends-world-military-expenditure-2024"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-4 underline-offset-4"
                  >
                    $2.718T
                  </a>
                }
                detail="SIPRI's estimate of world military expenditure in 2024."
                color="bg-background"
              />
              <ResearchStatCard
                label="Estimate: government trials"
                value={
                  <ParameterValue
                    param={GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL}
                    valueOverride="$4.5B"
                    className="font-black"
                  />
                }
                detail={`Current annual model estimate; uncertainty range ${governmentTrialSpendingRange}.`}
                color="bg-brutal-cyan"
              />
              <ResearchStatCard
                label="Calculated share"
                value={`${GOVERNMENT_TRIAL_SHARE_OF_MILITARY_PCT.toFixed(3)}%`}
                detail="$4.5 billion as a share of SIPRI's $2.718 trillion estimate."
                color="bg-background"
              />
              <ResearchStatCard
                label="Calculated ratio"
                value={
                  <ParameterValue
                    param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
                    format={{ precision: 0 }}
                    className="font-black"
                  />
                }
                detail="About $604 in military spending for every $1 in government clinical-trial spending."
                color="bg-brutal-pink text-white"
              />
            </div>

            <Card className="mt-8 gap-5 border-4 border-primary bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-8">
              <h3 className="text-2xl font-black uppercase">What the denominator does—and does not—mean</h3>
              <div className="space-y-4 text-base font-bold leading-relaxed sm:text-lg">
                <p>
                  This is explicitly a{" "}
                  <span className="font-black text-brutal-pink">government-to-government comparison</span>: global
                  military expenditure versus estimated government spending on interventional clinical trials.
                </p>
                <p>
                  No authoritative organization publishes a complete global accounting of government spending on
                  interventional trials across every country. The{" "}
                  <ParameterValue param={GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL} valueOverride="$4.5B" />{" "}
                  denominator is therefore an estimate, not an observed world total. The current model uses a{" "}
                  {governmentTrialSpendingRange} uncertainty range.
                </p>
                <p>
                  Including private pharmaceutical trial spending and other non-government funding produces a
                  substantially smaller comparison. The current all-trials estimate is{" "}
                  <ParameterValue param={GLOBAL_CLINICAL_TRIALS_SPENDING_ANNUAL} />, which yields about{" "}
                  <ParameterValue param={MILITARY_TO_CLINICAL_TRIALS_SPENDING_RATIO} format={{ precision: 0 }} />. That
                  broader ratio answers a different question from the survey&apos;s public-budget comparison.
                </p>
              </div>
            </Card>
          </Container>
        </SectionContainer>

        <SectionContainer bgColor="background" borderPosition="bottom" padding="lg">
          <Container size="xl">
            <div className="mb-8 max-w-4xl">
              <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-brutal-pink">Observed evidence</p>
              <h2 className="mb-4 text-3xl font-black uppercase md:text-5xl">What RECOVERY demonstrated</h2>
              <p className="text-lg font-bold">
                RECOVERY used a simple adaptive design embedded in routine NHS care. Existing clinical workflows and
                routinely collected data reduced additional burden while preserving randomized comparisons.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              <ResearchStatCard
                label="First patient"
                value="19 MAR 2020"
                detail="Oxford reports that RECOVERY recruited its first patient nine days after the protocol was drafted."
                color="bg-brutal-cyan"
              />
              <ResearchStatCard
                label="Dexamethasone result"
                value="16 JUN 2020"
                detail="The trial announced the first treatment shown to reduce COVID-19 mortality."
                color="bg-brutal-yellow"
              />
              <ResearchStatCard
                label="Elapsed time"
                value={`${RECOVERY_DAYS_TO_DEXAMETHASONE} DAYS`}
                detail="Calendar days from the first recruited patient to the dexamethasone announcement."
                color="bg-background"
              />
              <ResearchStatCard
                label="First 100 days"
                value="3 TREATMENTS"
                detail="Actionable results for hydroxychloroquine, dexamethasone, and lopinavir-ritonavir."
                color="bg-brutal-pink text-white"
              />
            </div>

            <Card className="mt-8 gap-6 border-4 border-primary bg-brutal-cyan p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-8">
              <div>
                <p className="mb-2 text-sm font-black uppercase tracking-[0.2em]">Cost evidence</p>
                <h3 className="text-2xl font-black uppercase sm:text-3xl">
                  Large potential, not one universal multiplier
                </h3>
              </div>
              <div className="grid gap-4">
                <ComparisonRow
                  label="RECOVERY estimate"
                  value={<ParameterValue param={RECOVERY_TRIAL_COST_PER_PATIENT} className="font-black" />}
                  detail="Approximate per-participant estimate for one unusually streamlined emergency platform trial."
                />
                <ComparisonRow
                  label="Pivotal approval trials"
                  value={
                    <ParameterValue
                      param={pivotalTrialMedianCostPerParticipant}
                      valueOverride="$41,413"
                      className="font-black"
                    />
                  }
                  detail="Peer-reviewed median estimate per participant across 225 pivotal trials supporting drug approvals."
                />
                <ComparisonRow
                  label="Embedded pragmatic trials"
                  value={
                    <ParameterValue
                      param={embeddedPragmaticTrialMedianCostPerParticipant}
                      valueOverride="$97"
                      className="font-black"
                    />
                  }
                  detail="Median research cost per randomized participant among 64 trials with available cost data."
                />
              </div>
              <p className="text-base font-bold leading-relaxed sm:text-lg">
                Dividing the pivotal-trial median by the RECOVERY estimate produces the familiar approximately{" "}
                <ParameterValue param={RECOVERY_TRIAL_COST_REDUCTION_FACTOR} className="font-black" /> comparison. It is
                a RECOVERY-versus-pivotal-trial comparison, not a guaranteed saving for every pragmatic trial. The
                studies cover heterogeneous interventions, health systems, accounting methods, and trial designs.
                Together they show major cost potential, not a universal multiplier.
              </p>
              <p className="text-sm font-bold">
                Sources: Oxford&apos;s{" "}
                <a
                  href="https://www.ndm.ox.ac.uk/covid-19/covid-research/drug-trials-recovery"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-2 underline-offset-2"
                >
                  RECOVERY account
                </a>
                , the{" "}
                <a
                  href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7295430/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-2 underline-offset-2"
                >
                  pivotal-trial cost study
                </a>
                , and the{" "}
                <a
                  href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6508852/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-2 underline-offset-2"
                >
                  embedded pragmatic-trial review
                </a>
                .
              </p>
            </Card>
          </Container>
        </SectionContainer>

        <SectionContainer bgColor="cyan" borderPosition="bottom" padding="lg">
          <Container size="xl">
            <div className="mb-8 max-w-4xl">
              <p className="mb-3 text-sm font-black uppercase tracking-[0.2em]">
                Model projection—not an observed outcome
              </p>
              <h2 className="mb-4 text-3xl font-black uppercase md:text-5xl">How the capacity scenario is built</h2>
              <p className="text-lg font-bold">
                The model uses a deliberately conservative pragmatic-trial cost input rather than treating
                RECOVERY&apos;s emergency result as universally reproducible. Its outputs change when the inputs change.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <ResearchStatCard
                label="Central cost input"
                value={<ParameterValue param={DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT} className="font-black" />}
                detail="Per participant, with an uncertainty interval informed by embedded-trial evidence and more complex trials."
                color="bg-background"
              />
              <ResearchStatCard
                label="Projected capacity"
                value={
                  <ParameterValue
                    param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
                    format={{ precision: 1 }}
                    className="font-black"
                  />
                }
                detail="Scenario output at the model's trial-funding level, not an observed global expansion."
                color="bg-brutal-yellow"
              />
              <ResearchStatCard
                label="Projected queue"
                value={
                  <>
                    <ParameterValue param={STATUS_QUO_QUEUE_CLEARANCE_YEARS} format={{ precision: 0 }} />
                    {" → "}
                    <ParameterValue param={DFDA_QUEUE_CLEARANCE_YEARS} format={{ precision: 0 }} />
                    {" years"}
                  </>
                }
                detail="Modeled treatment-research queue under current versus expanded capacity assumptions."
                color="bg-brutal-pink text-white"
              />
            </div>
          </Container>
        </SectionContainer>

        <SectionContainer bgColor="background" borderPosition="bottom" padding="lg">
          <Container size="xl">
            <div className="mb-8 max-w-5xl">
              <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-brutal-pink">
                Coordination hypothesis—not an observed survey result
              </p>
              <h2 className="mb-4 text-3xl font-black uppercase md:text-5xl">What could a global majority change?</h2>
              <p className="text-lg font-bold">
                A verified majority would not enact a law by itself. It could create an election-scale public mandate
                and coordination event that institutions can respond to independently.
              </p>
            </div>

            <Card className="mb-8 gap-5 border-4 border-primary bg-brutal-yellow p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-8">
              <div className="grid gap-6 lg:grid-cols-[0.65fr_1.35fr] lg:items-center">
                <div>
                  <p className="text-6xl font-black sm:text-7xl">51%</p>
                  <p className="mt-2 text-3xl font-black">
                    <ParameterValue param={surveyMajorityTarget} format={{ precision: 2 }} />
                  </p>
                  <p className="mt-2 text-sm font-black uppercase">people at the current checked-in population input</p>
                </div>
                <div className="space-y-4 text-base font-bold leading-relaxed sm:text-lg">
                  <p>
                    The current global-population parameter is <ParameterValue param={GLOBAL_POPULATION_2024} />.
                    Multiplying it by 51% gives 4.08 billion people—about 4.1 billion. As the population input rises
                    above 8.2 billion, the same rule is about 4.2 billion; the target is calculated instead of frozen to
                    a stale headcount.
                  </p>
                  <p>
                    Public verification could reduce pluralistic ignorance: people may privately support a reform while
                    incorrectly believing that most others do not. Country-level, auditable results could make dispersed
                    preferences common knowledge and give decision-makers a visible mandate to answer.
                  </p>
                </div>
              </div>
            </Card>

            <h3 className="mb-5 text-2xl font-black uppercase sm:text-3xl">Plausible independent responses</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {coordinationActors.map(([actor, response]) => (
                <Card
                  key={actor}
                  className="gap-3 border-4 border-primary bg-background p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                >
                  <h4 className="text-lg font-black uppercase text-brutal-pink">{actor}</h4>
                  <p className="text-sm font-bold leading-relaxed">{response}</p>
                </Card>
              ))}
            </div>

            <Card className="mt-8 gap-5 border-4 border-primary bg-foreground p-6 text-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-8">
              <h3 className="text-2xl font-black uppercase sm:text-3xl">The hypothesized causal chain</h3>
              <ol className="grid gap-3">
                {coordinationChain.map((step, index) => (
                  <li key={step} className="grid gap-3 sm:grid-cols-[2.5rem_1fr] sm:items-center">
                    <span className="flex h-10 w-10 items-center justify-center border-2 border-background bg-brutal-cyan text-lg font-black text-foreground">
                      {index + 1}
                    </span>
                    <span className="text-base font-black uppercase sm:text-lg">
                      {step}
                      {index < coordinationChain.length - 1 ? (
                        <span className="ml-3 text-brutal-cyan" aria-hidden="true">
                          →
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="border-t-2 border-background/40 pt-5 text-base font-bold">
                Survey responses do not automatically enact laws, fund trials, establish causation, or eradicate
                disease. Each arrow requires institutions and people to act, and the effects must be measured.
              </p>
            </Card>

            <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-brutal-pink">
                  Conditions for credibility
                </p>
                <h3 className="text-2xl font-black uppercase sm:text-3xl">A majority claim must earn trust</h3>
              </div>
              <Card className="border-4 border-primary bg-brutal-cyan p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-8">
                <ul className="grid gap-4 sm:grid-cols-2">
                  {coordinationConditions.map((condition) => (
                    <li key={condition} className="flex gap-3 text-sm font-bold leading-relaxed sm:text-base">
                      <span className="font-black" aria-hidden="true">
                        ■
                      </span>
                      <span>{condition}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </Container>
        </SectionContainer>

        <SectionContainer bgColor="pink" borderPosition="bottom" padding="lg">
          <Container size="xl">
            <div className="mb-8 max-w-4xl text-white">
              <p className="mb-3 text-sm font-black uppercase tracking-[0.2em]">Source trail</p>
              <h2 className="mb-4 text-3xl font-black uppercase md:text-5xl">Read the underlying evidence</h2>
              <p className="text-lg font-bold">
                Parameter values on this page open their own source and calculation details. These are the primary
                institutional and peer-reviewed sources for the central observed claims.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <SourceLink
                href="https://www.sipri.org/publications/2025/sipri-fact-sheets/trends-world-military-expenditure-2024"
                title="SIPRI: World military expenditure, 2024"
                detail="Observed military-spending input."
              />
              <SourceLink
                href="https://www.ndm.ox.ac.uk/covid-19/covid-research/drug-trials-recovery"
                title="Oxford: RECOVERY trial"
                detail="First patient, dexamethasone date, and NHS embedding."
              />
              <SourceLink
                href="https://www.ndph.ox.ac.uk/news/recovery-trial-celebrates-two-year-anniversary-of-life-saving-dexamethasone-result"
                title="Oxford: Three results within 100 days"
                detail="Institutional account of the trial's rapid results."
              />
              <SourceLink
                href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7295430/"
                title="Pivotal trial cost study"
                detail="Peer-reviewed $41,413 median cost per participant."
              />
              <SourceLink
                href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6508852/"
                title="Embedded pragmatic trial review"
                detail="Peer-reviewed review reporting a $97 median among 64 trials."
              />
              <SourceLink
                href={
                  RECOVERY_TRIAL_COST_PER_PATIENT.sourceUrl ??
                  "https://manual.warondisease.org/knowledge/appendix/recovery-trial"
                }
                title="RECOVERY cost estimate"
                detail="Source behind the approximate $500 model parameter."
              />
            </div>
          </Container>
        </SectionContainer>

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
          <Button
            asChild
            className="h-14 border-4 border-foreground bg-foreground px-8 text-lg font-black uppercase text-background hover:bg-background hover:text-foreground sm:px-12"
          >
            <Link href="/#vote">Take the survey</Link>
          </Button>
        </CTASection>
      </div>
    </Layout>
  )
}

function EvidenceTypeCard({ label, description, color }: { label: string; description: string; color: string }) {
  return (
    <Card className={`${color} gap-3 border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}>
      <h3 className="text-xl font-black uppercase">{label}</h3>
      <p className="text-sm font-bold leading-relaxed">{description}</p>
    </Card>
  )
}

function ResearchStatCard({
  label,
  value,
  detail,
  color,
}: {
  label: string
  value: ReactNode
  detail: string
  color: string
}) {
  return (
    <Card className={`${color} gap-3 border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}>
      <h3 className="text-xs font-black uppercase tracking-[0.18em]">{label}</h3>
      <p className="break-words text-3xl font-black sm:text-4xl">{value}</p>
      <p className="text-sm font-bold leading-relaxed">{detail}</p>
    </Card>
  )
}

function ComparisonRow({ label, value, detail }: { label: string; value: ReactNode; detail: string }) {
  return (
    <div className="grid gap-2 border-4 border-primary bg-background p-4 sm:grid-cols-[1fr_0.55fr_1.45fr] sm:items-center">
      <h4 className="text-sm font-black uppercase">{label}</h4>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-sm font-bold leading-relaxed">{detail}</p>
    </div>
  )
}

function SourceLink({ href, title, detail }: { href: string; title: string; detail: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block border-4 border-primary bg-background p-5 text-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"
    >
      <h3 className="mb-2 text-lg font-black uppercase">{title}</h3>
      <p className="text-sm font-bold leading-relaxed">{detail}</p>
    </a>
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
