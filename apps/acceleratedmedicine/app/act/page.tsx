import type { Metadata } from "next"
import Link from "next/link"

import { AcceleratedMedicinePage } from "@/components/accelerated-medicine-chrome"
import { ExplainerVideoSection } from "@/components/home/explainer-video"
import { actProvisions } from "@/components/present/patient-journey/closing"
import { recovery, threeChanges } from "@/components/present/patient-journey/opening"
import { rightToTrialMetadata } from "@/lib/right-to-trial-metadata"

export const metadata: Metadata = rightToTrialMetadata({
  title: "The Care-Integrated Clinical Trials Act | Institute for Accelerated Medicine",
  description:
    "Proposed state legislation that lets any patient get a screened, promising treatment through their own doctor, lets clinics charge a fair price, and publishes every result.",
  path: "/act",
})

// The page describes the act for legislators, staff and advocates who saw the deck or the video. It names
// no state and asks visitors to do nothing, because the Institute is a 501(c)(3). Its content comes from
// the deck's script (content/patient-journey/script.md): the three changes and the five provisions are the
// slides' own lists, and the details and answers come from the speaker notes.
const provisionDetails: Record<string, string> = {
  "Review:":
    "The board has at least three members, including a physician, an outcomes researcher and an ethicist, with no financial ties to the clinic or the maker. A treatment qualifies after Phase I safety testing in people or with a documented record of safe use in people. One approval can cover many qualified clinics.",
  "Access:":
    "A patient does not need a life-threatening illness, to be unable to join a trial, or to have used up approved drugs first. The consent form covers the treatment, realistic outcomes, other options, known and unknown risks, the cost, and what data is collected. If a patient cannot consent, a legal representative can.",
  "Payment:":
    "The patient, family, charities, employers, research sponsors, and insurers that choose to can pay. The consent form states who pays and what the patient may owe.",
  "Safety:":
    "The board must also reassess if a trial of the same treatment elsewhere stops for safety. Current patients can continue if stopping is riskier. Every protocol is reviewed at least once a year.",
  "Results:":
    "Each board publishes a yearly de-identified report for each protocol, including bad, null and unclear results. Small groups are combined, so no one can be identified.",
}

const questions = [
  {
    question: "Who pays, and what does it cost the state?",
    answer: [
      "No insurer or state program has to pay. The patient, family, charities, employers, research sponsors, and insurers that choose to can pay.",
      "Clinics may charge a fair price, so they have a reason to offer new treatments, and one board approval can cover many clinics. Other ways to pay include installments or memberships, crowdfunding, patient-aid groups, free supply from the maker, and lower prices for patients who share outcome data.",
    ],
  },
  {
    question: "How is this different from the federal Right to Try law?",
    answer: [
      "The federal Right to Try Act (2018) lets a patient with a life-threatening illness, who has used up approved options and cannot join a trial, ask a maker for a drug that has passed Phase I and is still in development. The maker does not have to agree, may charge only its direct costs, and collects no outcomes. The FDA reports only 21 investigational drugs used under the law from May 2018 to December 2024. It does not cover drugs already approved for other conditions.",
      "Under this act, any patient whose doctor recommends a screened treatment can get it with written consent, clinics can charge a fair price, and every result is published.",
    ],
  },
  {
    question: "Who is liable if something goes wrong?",
    answer: [
      "The bill protects people who take part in good faith from liability under state law, except for gross negligence, reckless or willful misconduct, fraud, or concealing safety information. Federal law still applies, and the federal Right to Try law's protections cover only patients who meet its rules.",
    ],
  },
  {
    question: "Does it replace randomized trials?",
    answer: [
      "No. The bill also lets ordinary doctors enroll patients in centrally run randomized trials, as RECOVERY did, alongside treatments an independent board has screened.",
    ],
  },
  {
    question: "Could clinics exploit patients by charging for experimental treatment?",
    answer: [
      "Unproven stem-cell clinics show why people worry about this. The act answers it four ways. The board approves each clinic and protocol. The consent form states the cost and that the treatment is experimental. Serious side effects can pause new patients. Every result, including failures, is published, so a clinic cannot hide poor results.",
    ],
  },
]

const background = [
  { href: "/right-to-trial", label: "Right to Trial", text: "Our earlier education campaign on patients' access to promising treatments." },
  { href: "/model-act", label: "Model framework", text: "Provisions a state can start from, drawn from enacted text." },
  { href: "/montana", label: "An enacted state precedent", text: "How one state already licenses experimental treatment centers." },
  { href: "/right-to-trial#state-map", label: "State-by-state pages", text: "Where each state stands." },
]

function SectionHeading({ id, title, children }: { id: string; title: string; children?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2 id={id} className="text-3xl font-bold tracking-tighter sm:text-4xl">{title}</h2>
      {children && <p className="mt-3 text-muted-foreground md:text-lg">{children}</p>}
    </div>
  )
}

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
        <div className="mx-auto mt-8 max-w-3xl space-y-8">
          {questions.map(item => (
            <div key={item.question}>
              <h3 className="text-xl font-semibold">{item.question}</h3>
              {item.answer.map(paragraph => (
                <p key={paragraph.slice(0, 40)} className="mt-3 text-muted-foreground">{paragraph}</p>
              ))}
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-3xl text-sm text-muted-foreground">
          The Right to Try figures come from the FDA&apos;s summary, as reported by{" "}
          <a href="https://www.factcheck.org/2026/06/no-evidence-for-trumps-right-to-try-claim/" className="text-primary hover:underline">
            FactCheck.org (2026)
          </a>
          .
        </p>
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
