import type { Metadata } from "next"
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  ExternalLink,
  HeartPulse,
  Scale,
  ShieldCheck,
  Stethoscope,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"

import { AcceleratedMedicinePage } from "@/components/accelerated-medicine-chrome"
import { SectionHeading } from "@/components/section-heading"
import { StateOrganizations } from "@/components/state-organizations"
import { RIGHT_TO_TRY_SOURCES } from "@/lib/right-to-try"
import { rightToTrialMetadata } from "@/lib/right-to-trial-metadata"
import { getSupportSummary } from "@/lib/support-store"

// Montana's supporting organizations refresh every few minutes, and at once when one is approved.
export const revalidate = 300

export const metadata: Metadata = rightToTrialMetadata({
  title: "Montana's Universal Right to Try Law | Care-Integrated Clinical Trials Initiative",
  description:
    "A plain-language guide to Montana SB 535: licensed experimental treatment centers, patient safeguards, and what the Care-Integrated Clinical Trials Act would add.",
  path: "/montana",
})

const milestones = [
  { year: "2015", title: "Right to Try begins", text: "Montana creates an initial access path for eligible patients." },
  { year: "2023", title: "SB 422 broadens eligibility", text: "The state removes the terminal-illness restriction from its Right to Try law." },
  {
    year: "2025",
    title: "SB 535 creates licensed centers",
    text: "The law defines experimental treatments and sets state licensing, safety, consent and oversight requirements.",
  },
  {
    year: "2026",
    title: "The doors can open",
    text: "Final rules take effect, and Montana publishes the experimental treatment center application.",
  },
]

const provisions = [
  {
    icon: Building2,
    title: "Licensed centers",
    text: "Experimental treatment centers must obtain a state license and operate within Montana's facility rules.",
  },
  {
    icon: Stethoscope,
    title: "Clinical review",
    text: "A treating health care provider identifies the patient as eligible after considering approved options.",
  },
  {
    icon: ClipboardCheck,
    title: "Written consent",
    text: "The patient receives the treatment's possible outcomes, approved alternatives, insurance limits, and costs.",
  },
  {
    icon: ShieldCheck,
    title: "Safety and records",
    text: "Centers must meet professional, safety, recordkeeping, inspection, and reporting requirements.",
  },
  {
    icon: Scale,
    title: "Professional accountability",
    text: "Licensing boards keep authority over professional conduct and care provided under the law.",
  },
  {
    icon: HeartPulse,
    title: "A broader treatment definition",
    text: "The statute covers drugs, biologics, devices, procedures, and individualized treatments that meet its conditions.",
  },
]

const progress = [
  {
    title: "Rules in force",
    text: "The operating rules for experimental treatment centers took effect July 25, 2026, with an independent review board evaluating treatments.",
  },
  {
    title: "$12,500 to apply",
    text: "A company with a drug through preliminary safety testing pays $12,500 to ask the review board for approval to offer it in Montana.",
  },
  {
    title: "First applications filed",
    text: "Treatments for neuropathy and hearing loss are already under review. The first licensed clinics are expected around the end of 2026.",
  },
]

const sources = [
  ["SB 535 enrolled bill", RIGHT_TO_TRY_SOURCES.montanaSb535],
  ["SB 422 enrolled bill", RIGHT_TO_TRY_SOURCES.montanaSb422],
  ["Final 2026 rules", RIGHT_TO_TRY_SOURCES.montanaRules],
  ["Current Montana Code", RIGHT_TO_TRY_SOURCES.montanaLaw],
  ["Treatment center licensing", RIGHT_TO_TRY_SOURCES.montanaLicensing],
] as const

const card = "rounded-lg border bg-card p-6 shadow-sm"
const externalLink = "font-medium text-primary hover:underline"

export default async function MontanaPage() {
  const { organizations } = await getSupportSummary()
  return (
    <AcceleratedMedicinePage>
      <section className="mx-auto max-w-4xl pb-12 text-center md:py-8 md:pb-16">
        <p className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">Enacted precedent</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          What Montana&apos;s Universal Right to Try law does
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-muted-foreground md:text-xl">
          Montana SB 535 creates a licensed, supervised path for eligible patients to consider experimental
          treatment after reviewing approved choices with a treating clinician. Niklas Anzinger and Infinita led the
          push for the law, and Infinita formed the state&apos;s first experimental treatment review board.
        </p>
        <Button asChild size="lg" className="mt-8">
          <a href={RIGHT_TO_TRY_SOURCES.montanaSb535} rel="noreferrer" target="_blank">
            Read the enrolled SB 535 <ExternalLink aria-hidden="true" className="ml-1 h-4 w-4" />
          </a>
        </Button>
      </section>

      <section aria-labelledby="history-heading" className="band-muted py-12 md:py-20">
        <SectionHeading id="history-heading" title="Patients can reach treatments, and providers can deliver them">
          Montana removed the terminal-illness restriction in 2023. In 2025, SB 535 created licensed experimental
          treatment centers, direct provider-patient payment agreements, outcome monitoring, adverse event reporting,
          and an access requirement funded by 2% of each center&apos;s net annual profits.
        </SectionHeading>
        <ol className="mx-auto mt-8 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {milestones.map(milestone => (
            <li key={milestone.year} className={card}>
              <p className="text-3xl font-bold tracking-tight text-primary tabular-nums">{milestone.year}</p>
              <h3 className="mt-2 font-semibold">{milestone.title}</h3>
              <p className="mt-2 text-muted-foreground">{milestone.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="provisions-heading" className="py-12 md:py-20">
        <SectionHeading id="provisions-heading" title="What the law requires" />
        <ul className="mx-auto mt-8 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {provisions.map(({ icon: Icon, title, text }) => (
            <li key={title} className={card}>
              <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="progress-heading" className="band-muted py-12 md:py-20">
        <SectionHeading id="progress-heading" title="This is already happening" />
        <ul className="mx-auto mt-8 grid max-w-5xl gap-6 md:grid-cols-3">
          {progress.map(item => (
            <li key={item.title} className={card}>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-muted-foreground">{item.text}</p>
            </li>
          ))}
        </ul>
        <div className="mx-auto mt-6 flex max-w-5xl flex-col gap-4 rounded-lg border border-primary/30 bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">The Montana Experimental Treatment Review Board is taking submissions</h3>
            <p className="mt-2 text-muted-foreground">
              Infinita formed this independent board of physicians, scientists and ethicists. It reviews treatments that
              have passed Phase I for Montana&apos;s centers, and it has issued its first decision.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <a href="https://montanaetrb.org" rel="noreferrer" target="_blank">
              Visit montanaetrb.org <ExternalLink aria-hidden="true" className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
        <p className="mx-auto mt-6 max-w-5xl text-sm text-muted-foreground">
          Reported by{" "}
          <a className={externalLink} href="https://www.technologyreview.com/2026/07/30/1140942/montana-experimental-medical-hub-pushed-forward-right-to-try/"
            rel="noreferrer" target="_blank">
            MIT Technology Review (July 30, 2026)
          </a>
          .
        </p>
      </section>

      <section aria-labelledby="act-heading" className="py-12 md:py-20">
        <SectionHeading id="act-heading" title="How the act builds on Montana">
          Montana showed that a state can open access to promising treatments. The Care-Integrated Clinical Trials
          Act builds on it. Patients get screened treatments through their own doctor&apos;s practice as well as at
          dedicated centers. Every patient&apos;s outcome is recorded, and each protocol&apos;s yearly public report must include failures. And doctors can enroll patients in
          randomized trials during ordinary care, so the next patient chooses better.
        </SectionHeading>
        <div className="mt-8 text-center">
          <Button asChild size="lg">
            <Link href="/act">Read the act <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <StateOrganizations name="Montana" organizations={organizations.filter(organization => organization.state === "Montana")} />

      <section aria-labelledby="sources-heading" className="border-t py-12 md:py-16">
        <SectionHeading id="sources-heading" title="Official Montana sources" />
        <ul className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
          {sources.map(([label, href]) => (
            <li key={label}>
              <a href={href} rel="noreferrer" target="_blank"
                className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4 font-medium shadow-sm hover:border-primary hover:text-primary">
                {label} <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </AcceleratedMedicinePage>
  )
}
