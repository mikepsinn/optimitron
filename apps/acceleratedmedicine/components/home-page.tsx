import { ArrowRight, Check, CheckCircle2 } from "lucide-react"
import { Inter } from "next/font/google"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@optimitron/neobrutalist-ui/ui/card"

import { BenefitCards } from "@/components/home/benefit-cards"
import { ExplainerVideoSection } from "@/components/home/explainer-video"
import { HomeFooter, HomeHeader } from "@/components/home/home-chrome"
import { PatientSteps } from "@/components/home/how-it-works/PatientSteps"
import { ProviderSteps } from "@/components/home/how-it-works/ProviderSteps"
import { ResearchPartnerSteps } from "@/components/home/how-it-works/ResearchPartnerSteps"
import landingExample from "@/components/home/landing-example.json"
import { LearningLoop } from "@/components/home/learning-loop"
import { OutcomeLabel, type OutcomeCategory } from "@/components/home/outcome-label"
import { PartnersSection } from "@/components/home/partners-section"
import { RankingsPreview } from "@/components/home/rankings-preview"
import { LegacyHomeHashRedirect } from "@/components/legacy-home-hash-redirect"

// The home page shows how care-integrated clinical trials would work for patients with a global Open
// Treatment Evidence Network. Its sections and look come from the decentralized-fda prototype's home page
// (mikepsinn/dfda, apps/web), without links into the prototype. `prototype-theme` switches the page to
// the prototype's colors (app/globals.css).
//
// landing-example.json holds the prototype's example rankings and Outcome Label, exported from its
// treatment-estimate snapshot (apps/web/data/optimitron). Regenerate it from there when they change.

const inter = Inter({ subsets: ["latin"] })

const highlights = [
  "Treatment rankings based on real-world outcomes",
  "An Outcome Label for every treatment",
  "Patient data that stays with patients and their clinics",
]

const labelFeatures = [
  "Comprehensive health impact data",
  "Both positive and negative effects",
  "Evidence-based decision making",
]

const audiences = [
  { id: "how-it-works-patient", eyebrow: "For patients", title: "How Your Doctor's Visit Should Actually Work", steps: <PatientSteps /> },
  { id: "how-it-works-provider", eyebrow: "For doctors", title: "How Treating Patients Should Work", steps: <ProviderSteps /> },
  { id: "how-it-works-research-partner", eyebrow: "For researchers", title: "How Clinical Trials Should Work", steps: <ResearchPartnerSteps /> },
]

function SectionHeading({ title, children }: { title: string; children: string }) {
  return (
    <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{title}</h2>
      <p className="max-w-[85%] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">{children}</p>
    </div>
  )
}

function Hero() {
  return (
    <section className="band-muted-fade -mt-6 w-full py-12 md:-mt-10 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-6">
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">Our mission</div>
            <h1 className="text-3xl font-bold tracking-tighter min-[380px]:text-4xl sm:text-5xl lg:text-4xl xl:text-5xl">
              Ensure every patient can participate in clinical trials for the{" "}
              <span className="text-primary">most promising treatments</span>
            </h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl">
              This is how your doctor&apos;s visit should actually work, with a global Open Treatment Evidence
              Network.
            </p>
            <ul className="space-y-4">
              {highlights.map(highlight => (
                <li key={highlight} className="flex items-center gap-2">
                  <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm md:text-base">{highlight}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full gap-1 text-base sm:w-auto">
                <a href="#help">Partner with us <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" /></a>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full gap-1 text-base sm:w-auto">
                <a href="#how-it-works">See how it should actually work <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" /></a>
              </Button>
            </div>
          </div>
          <LearningLoop />
        </div>
      </div>
    </section>
  )
}

function Rankings() {
  return (
    <section className="band-muted w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <SectionHeading title="Comparative Effectiveness Rankings">
          Patients and doctors would see which treatments worked best for people with the same condition
        </SectionHeading>
        <div className="mx-auto mt-8 max-w-4xl">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Interventions by Condition</CardTitle>
              <CardDescription>
                An example using today&apos;s estimates. With the network, rankings would update as patients report
                outcomes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RankingsPreview conditions={landingExample.rankings} />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

function OutcomeLabels() {
  const { treatment, condition, categories } = landingExample.outcomeLabel
  return (
    <section className="band-muted w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Outcome Labels</h2>
            <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
              Every treatment would have a label showing its effects on all measurable aspects of health
            </p>
            <ul className="grid gap-2">
              {labelFeatures.map(feature => (
                <li key={feature} className="flex items-center gap-2">
                  <Check aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <OutcomeLabel title={treatment} tag={condition}
            subtitle="An example using today's estimates. Changes are relative to the baselines shown."
            data={categories as OutcomeCategory[]} showBars={false} />
        </div>
      </div>
    </section>
  )
}

function HowItShouldWork() {
  return (
    <section id="how-it-works" className="w-full scroll-mt-16 py-12 md:py-24 lg:py-32">
      {/* The page container already pads phones; the wide mock-ups need that width. */}
      <div className="container px-0 sm:px-4 md:px-6">
        <SectionHeading title="How It Should Actually Work">
          Patients would report outcomes, doctors would see what has worked for patients like theirs, and
          researchers would run trials on the same network.
        </SectionHeading>
        {audiences.map(audience => (
          <div key={audience.id} id={audience.id} className="relative mt-12 mb-16">
            <div className="mx-auto max-w-5xl">
              <p className="text-center text-sm font-semibold tracking-wider text-primary uppercase">{audience.eyebrow}</p>
              <h3 className="mt-2 mb-8 text-center text-2xl font-bold">{audience.title}</h3>
              {audience.steps}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Benefits() {
  return (
    <section id="benefits" className="band-fade w-full scroll-mt-16 py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <SectionHeading title="Why Care-Integrated Clinical Trials Matter">
          What the network would deliver for patients, clinicians and researchers
        </SectionHeading>
        <BenefitCards />
      </div>
    </section>
  )
}

export function HomePage() {
  return (
    <div className={`prototype-theme flex min-h-screen flex-col bg-background text-foreground ${inter.className}`}>
      <LegacyHomeHashRedirect />
      <HomeHeader />
      <main className="w-full flex-1 py-6 md:py-10">
        <div className="container mx-auto px-4 md:px-6">
          <Hero />
          <ExplainerVideoSection />
          <Rankings />
          <OutcomeLabels />
          <HowItShouldWork />
          <Benefits />
          <PartnersSection />
        </div>
      </main>
      <HomeFooter />
    </div>
  )
}
