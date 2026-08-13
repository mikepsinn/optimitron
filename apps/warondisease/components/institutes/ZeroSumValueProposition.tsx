import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import {
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL,
  RECOVERY_TRIAL_COST_REDUCTION_FACTOR,
  TREATY_ANNUAL_FUNDING,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  GLOBAL_MED_RESEARCH_SPENDING,
  TOTAL_RESEARCH_FUNDING_WITH_TREATY,
  TRIAL_CAPACITY_CUMULATIVE_YEARS_20YR,
} from "@/lib/parameters-calculations-citations"
import { formatParameter, getParameterValue } from "@/lib/format-parameter"
import { getImpactAnalysisInfo } from "@/lib/site-config"
import { ParameterValue } from "@/components/shared/ParameterValue"
import { MAJORITY_OF_HUMANS_ON_EARTH } from "@/lib/majority-humanity-target"

// Derived values from parameters
const spendingRatio = formatParameter(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO)
const spendingRatioRaw = getParameterValue(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO, "round")
const militarySpending = formatParameter(GLOBAL_MILITARY_SPENDING_ANNUAL_2024)
const clinicalTrialsSpending = formatParameter(GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL)
const costReduction = formatParameter(RECOVERY_TRIAL_COST_REDUCTION_FACTOR)
const treatyFunding = formatParameter(TREATY_ANNUAL_FUNDING)
const trialCapacityMultiplier = formatParameter(DFDA_TRIAL_CAPACITY_MULTIPLIER)
const trialCapacityMultiplierRaw = getParameterValue(DFDA_TRIAL_CAPACITY_MULTIPLIER, "round")
const currentResearchFunding = formatParameter(GLOBAL_MED_RESEARCH_SPENDING)
const totalResearchFundingWithTreaty = formatParameter(TOTAL_RESEARCH_FUNDING_WITH_TREATY)
const cumulativeTrialYears = getParameterValue(TRIAL_CAPACITY_CUMULATIVE_YEARS_20YR, "round")

export function ZeroSumValueProposition() {
  const impactAnalysis = getImpactAnalysisInfo()

  return (
    <SectionContainer bgColor="red" borderPosition="bottom" padding="lg">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase mb-6 text-foreground">
            STOP FIGHTING OVER <span className="text-foreground">SCRAPS</span>
          </h2>
          <p className="text-xl sm:text-2xl font-bold text-foreground max-w-4xl mx-auto mb-8">
            GROW THE GLOBAL PIE
          </p>
        </div>

        {/* The Dog Metaphor */}
        <div className="max-w-5xl mx-auto mb-12">
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 bg-background">
            <p className="text-lg font-bold text-foreground mb-4">Most nonprofits are trapped in a zero-sum game.</p>
            <p className="text-lg font-bold text-foreground mb-6">
              They're like{" "}
              <span className="text-brutal-pink">
                starving dogs fighting over a single bowl of food while an entire banquet sits untouched behind them
              </span>
              . The dogs are very focused on the bowl. They've developed sophisticated bowl-fighting strategies. Some
              dogs have hired consultants to optimize their bowl access.
            </p>
            <p className="text-lg font-bold text-foreground">None of them have turned around.</p>
          </Card>
        </div>

        {/* The Zero-Sum Reality */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-background">
              <h3 className="text-2xl font-black uppercase mb-4 text-foreground">THE ZERO-SUM TRAP</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-brutal-pink font-black text-xl">×</span>
                  <span className="font-bold text-foreground">
                    Every grant you win is a grant another organization loses
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brutal-pink font-black text-xl">×</span>
                  <span className="font-bold text-foreground">
                    Every dollar for malaria is a dollar not spent on Alzheimer's
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brutal-pink font-black text-xl">×</span>
                  <span className="font-bold text-foreground">Your success requires someone else's failure</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brutal-pink font-black text-xl">×</span>
                  <span className="font-bold text-foreground">
                    You're not solving scarcity. You're reshuffling it.
                  </span>
                </li>
              </ul>
            </Card>

            <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-brutal-yellow">
              <h3 className="text-2xl font-black uppercase mb-4 text-foreground">THE REAL PROBLEM</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-black text-foreground mb-1">{spendingRatio}</div>
                  <p className="font-bold text-foreground">
                    Humanity spends {spendingRatioRaw} times more on weapons than on clinical trials to discover which medicines
                    actually work
                  </p>
                </div>
                <div className="border-t-4 border-primary pt-4">
                  <div className="text-2xl font-black text-foreground mb-1">{militarySpending} vs {clinicalTrialsSpending}</div>
                  <p className="font-bold text-foreground">Military spending vs. clinical trial funding annually</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* The Math That Changes Everything */}
        <div className="max-w-5xl mx-auto mb-12">
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 bg-background">
            <h3 className="text-2xl sm:text-3xl font-black uppercase mb-6 text-center text-foreground">
              THE GAME-CHANGING MATH
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-brutal-pink border-4 border-primary w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-black">1</span>
                </div>
                <div>
                  <h4 className="font-black text-lg mb-2 text-foreground">THE BOTTLENECK ISN'T IDEAS</h4>
                  <p className="font-bold text-foreground">
                    We've explored less than 1% of possible drug-disease combinations using existing safe compounds
                    because clinical trials are too slow and expensive. This is the chokepoint that limits every health
                    outcome.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-brutal-cyan border-4 border-primary w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-black">2</span>
                </div>
                <div>
                  <h4 className="font-black text-lg mb-2 text-foreground">1% REDIRECTED = {trialCapacityMultiplierRaw}X MORE CAPACITY</h4>
                  <p className="font-bold text-foreground">
                    <a
                      href={impactAnalysis.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brutal-cyan hover:underline"
                    >
                      Redirecting just 1% of military budgets ({treatyFunding} annually) creates {trialCapacityMultiplier} more clinical trial
                      capacity
                    </a>{" "}
                    through hyper-efficient pragmatic trials that cost {costReduction} less than traditional methods.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-brutal-yellow border-4 border-primary w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-black">3</span>
                </div>
                <div>
                  <h4 className="font-black text-lg mb-2 text-foreground">{cumulativeTrialYears} YEARS OF RESEARCH IN 20</h4>
                  <p className="font-bold text-foreground">
                    <a
                      href={impactAnalysis.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brutal-cyan hover:underline"
                    >
                      ~{cumulativeTrialYears} years of medical research compressed into 20 calendar years
                    </a>
                    . Treatments for YOUR disease get discovered decades faster.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-brutal-pink border-4 border-primary w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-black">4</span>
                </div>
                <div>
                  <h4 className="font-black text-lg mb-2 text-foreground">EVERYONE WINS SIMULTANEOUSLY</h4>
                  <p className="font-bold text-foreground">
                    No longer competing for {currentResearchFunding} in scraps. Now there&apos;s {totalResearchFundingWithTreaty}+ flowing annually. Malaria gets cured AND
                    Alzheimer&apos;s gets cured. You stop writing competing grant proposals and start governing the treaty
                    fund together.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* The Strategy Is Simple */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 bg-brutal-cyan">
            <h3 className="text-2xl sm:text-3xl font-black uppercase mb-4 text-center text-foreground">
              THE STRATEGY IS SIMPLE
            </h3>
            <p className="text-lg font-bold text-foreground text-center mb-6">
              Stop optimizing bowl-fighting strategies. Turn around. Notice the banquet. Take 2 minutes to embed our
              survey.
            </p>
            <div className="bg-background border-4 border-primary p-6">
              <p className="font-bold text-foreground mb-4">When enough organizations promote the survey:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-brutal-pink font-black">→</span>
                  <span className="font-bold text-foreground">
                    Public pressure reaches critical mass (
                    <ParameterValue param={MAJORITY_OF_HUMANS_ON_EARTH} /> humans)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brutal-pink font-black">→</span>
                  <span className="font-bold text-foreground">
                    Governments redirect 1% from "creating corpses" to "preventing corpses"
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brutal-pink font-black">→</span>
                  <span className="font-bold text-foreground">
                    Clinical trial capacity expands {trialCapacityMultiplier} globally through pragmatic trials
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brutal-pink font-black">→</span>
                  <span className="font-bold text-foreground">
                    Every disease gets massively more research funding
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brutal-pink font-black">→</span>
                  <span className="font-bold text-foreground">
                    You stop competing. You start winning together.
                  </span>
                </li>
              </ul>
            </div>
            <div className="mt-6 text-center">
              <p className="text-xl font-black text-foreground">
                A few years of coordinated advocacy will unlock more impact than decades of incrementalism.
              </p>
            </div>
          </Card>
        </div>
      </Container>
    </SectionContainer>
  )
}
