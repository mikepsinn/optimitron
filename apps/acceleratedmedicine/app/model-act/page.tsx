import type { Metadata } from "next"
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Database,
  ExternalLink,
  HeartPulse,
  Scale,
  ShieldCheck,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"

import { AcceleratedMedicinePage } from "@/components/accelerated-medicine-chrome"
import { SectionHeading } from "@/components/section-heading"
import { RIGHT_TO_TRY_SOURCES } from "@/lib/right-to-try"
import { rightToTrialMetadata } from "@/lib/right-to-trial-metadata"

export const metadata: Metadata = rightToTrialMetadata({
  title: "Model Framework | Institute for Accelerated Medicine",
  description:
    "An educational framework for state patient access, licensed experimental treatment centers, informed consent, oversight, and comparable outcome evidence.",
  path: "/model-act",
})

// Kept until the act has bill text; /act describes the act itself.
const parts = [
  {
    icon: HeartPulse,
    title: "Patient eligibility",
    text: "Let an informed adult consider an experimental treatment after the patient and treating clinician evaluate approved options.",
  },
  {
    icon: Building2,
    title: "Licensed treatment centers",
    text: "Create a state license with qualified leadership, facility standards, inspection, records, and enforcement.",
  },
  {
    icon: ClipboardCheck,
    title: "Informed consent",
    text: "Put known risks, possible benefits, alternatives, costs, conflicts, privacy, and the right to stop in plain language.",
  },
  {
    icon: ShieldCheck,
    title: "Professional oversight",
    text: "Keep clinicians and facilities accountable to licensing boards, scope-of-practice rules, and safety reporting.",
  },
  {
    icon: Scale,
    title: "Provider participation and fair costs",
    text: "Let clinicians and treatment centers be paid for treatment and trial services. Disclose every charge before care.",
  },
  {
    icon: Database,
    title: "Comparable outcomes",
    text: "Collect the same outcomes for each condition and publish de-identified results so patients, clinicians, and researchers can compare treatments.",
  },
]

export default function ModelActPage() {
  return (
    <AcceleratedMedicinePage>
      <section className="mx-auto max-w-4xl pb-12 text-center md:py-8 md:pb-16">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">A model framework for every state</h1>
        <p className="mx-auto mt-4 max-w-3xl text-muted-foreground md:text-xl">
          Start with Montana&apos;s enacted licensing framework. Add pragmatic trials, provider payment, and published
          outcomes, so every patient has the right and the practical ability to join a clinical trial of the most
          promising treatments.
        </p>
        <ol className="mt-10 grid gap-6 text-left md:grid-cols-2 lg:grid-cols-3">
          {parts.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-2xl font-bold text-primary tabular-nums">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h2 className="mt-4 font-semibold">{title}</h2>
              <p className="mt-2 text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="enacted-heading" className="band-muted py-12 md:py-20">
        <SectionHeading id="enacted-heading" title="Use enacted text as the starting point">
          The framework above is an educational outline. Montana&apos;s enrolled bill and final rules provide the
          official enacted language, definitions, licensing structure, and implementation detail.
        </SectionHeading>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <a href={RIGHT_TO_TRY_SOURCES.montanaSb535} rel="noreferrer" target="_blank">
              Open SB 535 <ExternalLink aria-hidden="true" className="ml-1 h-4 w-4" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/montana">Read the Montana guide <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/act">Read the act <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </AcceleratedMedicinePage>
  )
}
