import type { Metadata } from "next"

import { AcceleratedMedicinePage } from "@/components/accelerated-medicine-chrome"
import { SectionHeading } from "@/components/section-heading"
import { SupporterForm } from "@/components/support-forms"
import { COUNTRY_OPTIONS } from "@/lib/support-options"

export const metadata: Metadata = {
  title: "Open Letter: Universal Care-Integrated Clinical Trials",
  description:
    "Sign the open letter calling for every patient to have the right and practical ability to join clinical trials through ordinary care.",
}

export default function OpenLetterPage() {
  return (
    <AcceleratedMedicinePage>
      <article className="mx-auto max-w-3xl">
        <header className="pb-10 text-center md:py-4">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Open Letter
          </h1>
          <p className="mt-2 text-xl font-medium text-primary sm:text-2xl">
            Universal Care-Integrated Clinical Trials
          </p>
        </header>

        <section className="prose prose-lg mx-auto max-w-none pb-10">
          <p className="text-lg leading-relaxed text-muted-foreground">
            Every patient should have the right and practical ability to:
          </p>
          <ol className="mt-4 space-y-3 text-foreground">
            <li>Visit their own doctor.</li>
            <li>
              Compare treatment rankings and Outcome Labels showing benefits and
              harms.
            </li>
            <li>
              Join trials of promising treatments through ordinary care.
            </li>
            <li>
              Have every result improve the evidence for the next patient.
            </li>
          </ol>
        </section>

        <section className="border-t pt-10 pb-10">
          <p className="text-lg leading-relaxed text-muted-foreground">
            We call on policymakers, health systems, and research funders to:
          </p>
          <ol className="mt-4 space-y-4 text-foreground">
            <li>
              <span className="font-semibold">
                Enable participation through ordinary care:
              </span>{" "}
              put the policies and trial infrastructure in place so patients can
              join through their own doctor.
            </li>
            <li>
              <span className="font-semibold">
                Fund clinics&apos; research work:
              </span>{" "}
              pay for the extra staff time, monitoring, and outcome reporting
              needed to make participation practical.
            </li>
            <li>
              <span className="font-semibold">Make every result count:</span>{" "}
              require timely public reporting of positive, negative, and
              inconclusive results, with patient privacy protected.
            </li>
          </ol>
        </section>

        <section
          id="sign"
          aria-labelledby="sign-heading"
          className="scroll-mt-20 border-t pt-10 pb-12 md:pb-16"
        >
          <SectionHeading id="sign-heading" title="Add Your Name">
            Sign the open letter to show your support for universal
            care-integrated clinical trials.
          </SectionHeading>
          <div className="mt-6">
            <SupporterForm countries={COUNTRY_OPTIONS} />
          </div>
        </section>
      </article>
    </AcceleratedMedicinePage>
  )
}
