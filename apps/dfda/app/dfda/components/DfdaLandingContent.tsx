import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { VoteOrShareButton } from "@/components/shared/VoteOrShareButton";
import { IconCard, ChecklistCard } from "@/components/ui/icon-card";
import { NumberedStepList } from "@/components/ui/numbered-step-card";
import { CTASection } from "@/components/ui/cta-section";
import {
  CheckCircle2,
  XCircle,
  Users,
  Building2,
  DollarSign,
  Clock,
  Globe,
  Shield,
  TrendingDown,
} from "lucide-react";
import { DfdaUserWorkflows } from "@optimitron/site-kit/components/how-it-works/DfdaUserWorkflows";
import { UniversalSearchBox } from "./UniversalSearchBox";
import { FeaturedConditions } from "./FeaturedConditions";
import { FeaturedTreatments } from "./FeaturedTreatments";
import { ExternalLinksSection } from "./ExternalLinksSection";
import { ROUTES } from "@/lib/routes";
import {
  PHARMA_DRUG_DEVELOPMENT_COST_CURRENT,
  DRUG_DISCOVERY_TO_APPROVAL_YEARS,
  ANTIDEPRESSANT_TRIAL_EXCLUSION_RATE,
  RECOVERY_TRIAL_COST_REDUCTION_FACTOR,
  RECOVERY_TRIAL_TOTAL_COST,
  OXFORD_RECOVERY_TRIAL_DURATION_MONTHS,
  ADAPTABLE_TRIAL_PATIENTS,
} from "@/lib/parameters-calculations-citations";
import { formatParameter, getParameterValue } from "@/lib/format-parameter";

// Derived values from parameters using formatParameter utility
const drugDevCostB = formatParameter(PHARMA_DRUG_DEVELOPMENT_COST_CURRENT);
const traditionalTimelineYears = formatParameter(
  DRUG_DISCOVERY_TO_APPROVAL_YEARS,
);
const exclusionRatePct = formatParameter(ANTIDEPRESSANT_TRIAL_EXCLUSION_RATE);
const costReductionFactor = formatParameter(
  RECOVERY_TRIAL_COST_REDUCTION_FACTOR,
);
const pragmaticTrialCostM = formatParameter(RECOVERY_TRIAL_TOTAL_COST);
const pragmaticTrialMonths = getParameterValue(
  OXFORD_RECOVERY_TRIAL_DURATION_MONTHS,
  "round",
);
const adaptableTrialPatients = formatParameter(ADAPTABLE_TRIAL_PATIENTS);

export function DfdaLandingContent() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-brutal-cyan py-20 border-b-4 border-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-black text-5xl md:text-7xl mb-6 text-balance">
              LET'S CREATE THE FDA OF THE FUTURE
            </h1>
            <p className="text-xl md:text-2xl font-bold mb-8 text-balance">
              A decentralized framework that makes clinical trials{" "}
              {costReductionFactor} cheaper,{" "}
              {(DRUG_DISCOVERY_TO_APPROVAL_YEARS.value / 2).toFixed(1)} years
              faster, and saves millions of lives
            </p>

            {/* Universal Search Box */}
            <div className="mt-12">
              <UniversalSearchBox />
            </div>

            {/* Featured Conditions */}
            <FeaturedConditions />
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-20 border-b-4 border-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-black text-4xl md:text-5xl mb-12 text-center">
              THE PROBLEM: TRADITIONAL TRIALS ARE BROKEN
            </h2>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <IconCard
                icon={DollarSign}
                title="TOO EXPENSIVE"
                description={`Average cost: ${drugDevCostB} per drug. 90% of that is wasted on bureaucracy, not science.`}
                color="red"
              />
              <IconCard
                icon={Clock}
                title="TOO SLOW"
                description={`Takes ${traditionalTimelineYears} years to bring a drug to market. People die waiting.`}
                color="red"
              />
              <IconCard
                icon={Users}
                title="TOO EXCLUSIVE"
                description={`Only ${Math.round((1 - ANTIDEPRESSANT_TRIAL_EXCLUSION_RATE.value) * 100)}% of patients can participate. Strict eligibility criteria exclude most people.`}
                color="red"
              />
              <IconCard
                icon={Building2}
                title="TOO ARTIFICIAL"
                description="Conducted in specialized centers with ideal conditions. Results don't reflect real-world use."
                color="red"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Traditional vs Pragmatic Comparison */}
      <section className="py-20 bg-brutal-yellow border-b-4 border-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-black text-4xl md:text-5xl mb-12 text-center">
              TRADITIONAL VS PRAGMATIC TRIALS
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Traditional Trials */}
              <Card className="p-8 bg-background border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-3 mb-6">
                  <XCircle className="w-10 h-10 text-brutal-red" />
                  <h3 className="font-black text-3xl">TRADITIONAL TRIALS</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="font-bold">
                      Specialized research centers only
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="font-bold">
                      Strict eligibility criteria (excludes {exclusionRatePct}%+
                      of patients)
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="font-bold">
                      Frequent in-person visits required
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="font-bold">
                      Manual data collection and entry
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="font-bold">
                      Extensive monitoring and documentation
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="font-bold">
                      Artificial conditions (not real-world)
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="font-bold">Cost: {drugDevCostB} per drug</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="font-bold">
                      Timeline: {traditionalTimelineYears} years
                    </p>
                  </div>
                </div>
              </Card>

              {/* Pragmatic Trials */}
              <Card className="p-8 bg-brutal-green border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                  <h3 className="font-black text-3xl">PRAGMATIC TRIALS</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="font-bold">
                      Conducted in regular clinics and hospitals
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="font-bold">
                      Broad eligibility (includes real-world patients)
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="font-bold">
                      Minimal additional visits (part of routine care)
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="font-bold">
                      Automated data from electronic health records
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="font-bold">
                      Streamlined monitoring (focus on safety)
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="font-bold">
                      Real-world conditions (actual practice)
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="font-bold">
                      Cost: {pragmaticTrialCostM} per drug (
                      {costReductionFactor} cheaper)
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="font-bold">
                      Timeline: ~{pragmaticTrialMonths} months
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How Pragmatic Trials Work */}
      <section className="py-20 border-b-4 border-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-black text-4xl md:text-5xl mb-12 text-center">
              HOW PRAGMATIC TRIALS WORK
            </h2>

            <NumberedStepList
              steps={[
                {
                  title: "INTEGRATE WITH ROUTINE CARE",
                  description:
                    "Instead of creating artificial research environments, pragmatic trials happen during normal doctor visits. Patients receive care as usual, with minimal disruption.",
                  color: "cyan",
                },
                {
                  title: "USE EXISTING DATA SYSTEMS",
                  description:
                    "Electronic health records (EHRs) automatically capture data. No need for expensive manual data entry or separate research databases. This alone saves billions.",
                  color: "pink",
                },
                {
                  title: "INCLUDE REAL-WORLD PATIENTS",
                  description:
                    "No strict exclusion criteria. If you have the condition, you can participate. This makes trials faster to recruit, more representative, and more ethical.",
                  color: "yellow",
                },
                {
                  title: "FOCUS ON OUTCOMES THAT MATTER",
                  description:
                    "Instead of measuring biomarkers in a lab, pragmatic trials measure what patients care about: survival, quality of life, symptom relief, hospital admissions.",
                  color: "green",
                },
                {
                  title: "STREAMLINE REGULATION",
                  description:
                    "Still FDA-approved and safe, but with less bureaucratic overhead. Focus on safety monitoring, not paperwork. Regulators are already embracing this approach.",
                  color: "purple",
                },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Decentralized Trials */}
      <section className="py-20 bg-brutal-purple border-b-4 border-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-black text-4xl md:text-5xl mb-12 text-center">
              DECENTRALIZED CLINICAL TRIALS
            </h2>

            <Card className="p-8 bg-background border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
              <p className="text-xl font-bold text-center mb-8">
                Take it one step further: bring trials directly to patients,
                wherever they are.
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                <IconCard
                  icon={Globe}
                  title="REMOTE PARTICIPATION"
                  description="Patients participate from home using telemedicine, wearables, and mobile apps."
                  iconPosition="center"
                  className="border-0 shadow-none"
                />
                <IconCard
                  icon={Users}
                  title="BROADER ACCESS"
                  description="Rural patients, working parents, and people with mobility issues can now participate."
                  iconPosition="center"
                  className="border-0 shadow-none"
                />
                <IconCard
                  icon={TrendingDown}
                  title="LOWER COSTS"
                  description="No need for expensive research sites. Reduces costs by another 50-70%."
                  iconPosition="center"
                  className="border-0 shadow-none"
                />
              </div>
            </Card>

            <Card className="p-8 bg-brutal-cyan border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-black text-2xl mb-4">
                REAL EXAMPLE: COVID-19 VACCINE TRIALS
              </h3>
              <p className="text-lg font-bold">
                The COVID-19 vaccine trials used pragmatic and decentralized
                approaches to enroll 40,000+ participants in months instead of
                years. They proved these methods work at scale while maintaining
                safety and scientific rigor.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section className="py-20 border-b-4 border-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Shield className="w-20 h-20 mx-auto mb-6" />
              <h2 className="font-black text-4xl md:text-5xl mb-6">
                BUT IS IT SAFE?
              </h2>
              <p className="text-2xl font-bold">
                YES. PRAGMATIC TRIALS ARE JUST AS SAFE AS TRADITIONAL TRIALS.
              </p>
            </div>

            <div className="space-y-6">
              <ChecklistCard
                icon={CheckCircle2}
                title="SAME FDA APPROVAL PROCESS"
                description="Pragmatic trials still require FDA approval and oversight. Safety standards don't change."
              />
              <ChecklistCard
                icon={CheckCircle2}
                title="CONTINUOUS MONITORING"
                description="EHR systems enable real-time safety monitoring across thousands of patients simultaneously."
              />
              <ChecklistCard
                icon={CheckCircle2}
                title="BETTER REAL-WORLD SAFETY DATA"
                description="Because pragmatic trials include diverse, real-world patients, they actually detect safety issues that artificial trials might miss."
              />
              <ChecklistCard
                icon={CheckCircle2}
                title="ENDORSED BY EXPERTS"
                description="The NIH, FDA, and leading medical institutions already support and conduct pragmatic trials."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 border-b-4 border-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-black text-4xl md:text-5xl mb-12 text-center">
              IT'S ALREADY WORKING
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8 bg-brutal-cyan border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="font-black text-2xl mb-4">
                  ASPIRIN FOR HEART ATTACKS
                </h3>
                <p className="font-bold mb-4">
                  A pragmatic trial in the 1980s discovered that aspirin reduces
                  heart attack deaths by 23%. Cost: $50,000. Lives saved:
                  millions.
                </p>
                <p className="font-bold text-brutal-green">
                  Traditional trial would have cost $50+ million and taken years
                  longer.
                </p>
              </Card>

              <Card className="p-8 bg-brutal-green border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="font-black text-2xl mb-4">
                  RECOVERY TRIAL (COVID-19)
                </h3>
                <p className="font-bold mb-4">
                  Pragmatic trial identified dexamethasone as a COVID treatment
                  in just 3 months. Enrolled 11,000+ patients across 176
                  hospitals.
                </p>
                <p className="font-bold text-brutal-green">
                  Saved an estimated 1 million lives in the first year alone.
                </p>
              </Card>

              <Card className="p-8 bg-brutal-pink border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="font-black text-2xl mb-4">SALFORD LUNG STUDY</h3>
                <p className="font-bold mb-4">
                  Pragmatic trial tested asthma medication in real-world GP
                  practices. Enrolled 4,000+ patients in routine care settings.
                </p>
                <p className="font-bold text-brutal-green">
                  Cost 70% less than traditional trial, results more applicable
                  to actual patients.
                </p>
              </Card>

              <Card className="p-8 bg-brutal-yellow border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="font-black text-2xl mb-4">ADAPTABLE TRIAL</h3>
                <p className="font-bold mb-4">
                  NIH-funded pragmatic trial testing aspirin for heart disease
                  prevention. Using EHR data from {adaptableTrialPatients}+
                  patients across 40 sites.
                </p>
                <p className="font-bold text-brutal-green">
                  Demonstrates that pragmatic trials work at scale in the U.S.
                  healthcare system.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Treatments */}
      <FeaturedTreatments />

      {/* User Workflows Section */}
      <section className="py-20 bg-brutal-cyan border-b-4 border-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-black text-4xl md:text-5xl mb-6 text-center">
              A Decentralized Framework for Drug Assessment
            </h2>
            <p className="text-xl font-bold text-center mb-16 text-balance">
              See what the platonic ideal of healthcare and clinical trials will
              look like when dFDA frameworks are widely adopted.
            </p>

            <DfdaUserWorkflows
              findTrialsHref={ROUTES.findTrials}
              createTrialHref={ROUTES.contact}
            />
          </div>
        </div>
      </section>

      {/* External Resources */}
      <ExternalLinksSection />

      {/* CTA Section */}
      <CTASection
        bgColor="red"
        heading="THE SCIENCE IS PROVEN. THE SOLUTION EXISTS."
        description="All we need is the will to transcend our primitive evolutionary past and devote 1% less to killing people and more to curing them."
        className="border-t-0"
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <VoteOrShareButton variant="cta" size="xl" className="px-8 py-6" />
          <Link href={ROUTES.research}>
            <Button
              size="lg"
              variant="outline"
              className="bg-background hover:bg-background/90 text-primary font-black text-xl px-8 py-6 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              SEE THE RESEARCH
            </Button>
          </Link>
        </div>
      </CTASection>
    </div>
  );
}
