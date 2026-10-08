import type { Metadata } from "next"
import Link from "next/link"

import { AcceleratedMedicinePage } from "@/components/accelerated-medicine-chrome"
import { FaqList } from "@/components/faq-list"
import { ExplainerVideoSection } from "@/components/home/explainer-video"
import { SectionHeading } from "@/components/section-heading"
import { ACT_QUESTIONS } from "@/lib/act-questions"
import { actProvisions } from "@/components/present/patient-journey/closing"
import { recovery, threeChanges } from "@/components/present/patient-journey/opening"
import { rightToTrialMetadata } from "@/lib/right-to-trial-metadata"

export const metadata: Metadata = rightToTrialMetadata({
  title: "The Care-Integrated Clinical Trials Act",
  description:
    "Proposed state legislation that lets any patient get a screened, promising treatment through their own doctor, lets clinics charge for it, and publishes every result.",
  path: "/act",
})

// The page describes the act for legislators, staff and advocates who saw the deck or the video. It names
// no state and asks visitors to do nothing, because the Institute is a 501(c)(3). Its content comes from
// the deck's script (content/patient-journey/script.md): the three changes and the five provisions are the
// slides' own lists, and the details and answers come from the slides' If asked notes.
const provisionDetails: Record<string, string> = {
  "Review:":
    "The board has at least five members: a physician, an outcomes researcher, an ethicist, a non-scientist and a member unaffiliated with the clinics and makers it reviews. None may have financial ties to the clinic or the maker. A treatment qualifies through early safety testing in people, a documented record of safe use in people, a well-understood biological method with supporting lab or animal data, or evidence specific to a device. One approval can cover many qualified clinics.",
  "Access:":
    "The treating doctor records the reason for the treatment in the medical record. A patient does not need a life-threatening illness, to be unable to join a trial, or to have used up approved drugs first. The consent form covers the treatment, realistic outcomes, other options, known and unknown risks, the cost, and what data is collected. If a patient cannot consent, a legal representative can.",
  "Payment:":
    "The patient, family, charities, employers, research sponsors, and insurers that choose to can pay. The consent form states who pays and what the patient may owe.",
  "Safety:":
    "The board must also reassess if a trial of the same treatment elsewhere stops for safety. Current patients can continue if stopping is riskier. Every protocol is reviewed at least once a year.",
  "Results:":
    "Each board publishes a yearly de-identified report for each protocol, including bad, null and unclear results. Small groups are combined, so no one can be identified.",
}

const background = [
  { href: "/states", label: "Your state", text: "The patients waiting in each state, and what the act would change there." },
  { href: "/montana", label: "An enacted state precedent", text: "How one state already licenses experimental treatment centers." },
  { href: "/impact", label: "Impact model", text: "How much sooner treatments could arrive if every state adopted the act." },
]

export default function ActPage() {
  return (
    <AcceleratedMedicinePage>
      <section className="mx-auto max-w-4xl pb-12 text-center md:py-8 md:pb-16">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          The Care-Integrated Clinical Trials Act
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-muted-foreground md:text-xl">
          Every patient&apos;s treatment can help the next patient. This proposed state law lets any patient get a
          screened, promising treatment through their own doctor, lets clinics charge enough to offer it, and
          publishes every result.
        </p>
        <ul className="mt-10 grid gap-6 text-left md:grid-cols-3">
          {threeChanges.map(change => (
            <li key={change.lead} className="rounded-lg border bg-card p-6 shadow-sm">
              <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <change.icon className="h-5 w-5" />
              </span>
              <p className="mt-4">
                <strong className="font-semibold">{change.lead}</strong>{" "}
                <span className="text-muted-foreground">{change.text}</span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <ExplainerVideoSection />

      <section aria-labelledby="provisions-heading" className="py-12 md:py-20">
        <SectionHeading id="provisions-heading" title="What the act does" />
        <ul className="mx-auto mt-8 max-w-4xl divide-y rounded-lg border bg-card shadow-sm">
          {actProvisions.map(provision => (
            <li key={provision.lead} className="flex gap-4 p-5 sm:gap-5 sm:p-6">
              <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <provision.icon className="h-5 w-5" />
              </span>
              <div>
                <p>
                  <strong className="font-semibold">{provision.lead}</strong> {provision.text}
                </p>
                <p className="mt-2 text-sm text-muted-foreground md:text-base">{provisionDetails[provision.lead]}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="evidence-heading" className="band-muted py-12 md:py-20">
        <SectionHeading id="evidence-heading" title="A trial built into everyday care saved a million lives">
          RECOVERY was built into normal hospital care across the UK&apos;s National Health Service. Any hospital could
          enroll patients during their care, with little extra paperwork, and outcomes came from routine health
          records.
        </SectionHeading>
        <ul className="mx-auto mt-8 grid max-w-5xl gap-6 md:grid-cols-3">
          {recovery.map(stat => (
            <li key={stat.value} className="rounded-lg border bg-card p-6 shadow-sm">
              <p className="text-4xl font-bold tracking-tight text-primary tabular-nums">{stat.value}</p>
              <p className="mt-3 text-muted-foreground">{stat.text}</p>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-6 max-w-5xl text-sm text-muted-foreground">
          Sources: RECOVERY Collaborative Group, New England Journal of Medicine, 2021; NHS England, 2021; Manhattan
          Institute, 2023; Moore et al., JAMA Internal Medicine, 2018.
        </p>
      </section>

      <section aria-labelledby="questions-heading" className="py-12 md:py-20">
        <SectionHeading id="questions-heading" title="Common questions" />
        <div className="mx-auto mt-8 max-w-3xl">
          <FaqList questions={ACT_QUESTIONS} idPrefix="questions" />
        </div>
      </section>

      <section aria-labelledby="background-heading" className="border-t py-12 md:py-16">
        <SectionHeading id="background-heading" title="More background" />
        <ul className="mx-auto mt-8 grid max-w-4xl gap-6 sm:grid-cols-2">
          {background.map(link => (
            <li key={link.href}>
              <Link href={link.href} className="font-semibold text-primary hover:underline">{link.label}</Link>
              <p className="mt-1 text-muted-foreground">{link.text}</p>
            </li>
          ))}
        </ul>
      </section>
    </AcceleratedMedicinePage>
  )
}
