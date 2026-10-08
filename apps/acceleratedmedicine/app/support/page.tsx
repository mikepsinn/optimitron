import type { Metadata } from "next"
import Link from "next/link"

import { AcceleratedMedicinePage } from "@/components/accelerated-medicine-chrome"
import { SectionHeading } from "@/components/section-heading"
import { OrganizationForm, SupporterForm } from "@/components/support-forms"
import { SHOW_SUPPORTERS_LINKS } from "@/lib/navigation"
import { rightToTrialMetadata } from "@/lib/right-to-trial-metadata"

export const metadata: Metadata = rightToTrialMetadata({
  title: "Show your support | Care-Integrated Clinical Trials Initiative",
  description:
    "Add your name, or endorse as an organization: every patient should be able to join clinical trials of the most promising treatments, through their own doctor, with every result published.",
  path: "/support",
})

/** People add their name and organizations endorse. It asks nobody to contact a legislator, because the Institute is a 501(c)(3). */
export default function SupportPage() {
  return (
    <AcceleratedMedicinePage>
      <section className="mx-auto max-w-3xl pb-10 text-center md:py-4">
        <p className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">Show your support</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          Support the Care-Integrated Clinical Trials Initiative
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground md:text-xl">
          Every patient should be able to join clinical trials of the most promising treatments, through their own
          doctor, with every result published. Each name shows that people want it.
        </p>
      </section>

      <section aria-labelledby="people-heading" className="mx-auto max-w-3xl pb-12 md:pb-16">
        <SectionHeading id="people-heading" title="Add your name" />
        <div className="mt-6"><SupporterForm /></div>
      </section>

      <section id="organization" aria-labelledby="organization-heading" className="band-muted scroll-mt-20 py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <SectionHeading id="organization-heading" title="Endorse as an organization">
            Patient groups, clinics, hospitals, research groups and companies can endorse the initiative. We list each
            one on the supporters page.
          </SectionHeading>
          <div className="mt-6"><OrganizationForm /></div>
        </div>
      </section>

      {SHOW_SUPPORTERS_LINKS && (
        <p className="py-10 text-center">
          <Link href="/supporters" className="font-medium text-primary hover:underline">See who supports the initiative</Link>
        </p>
      )}
    </AcceleratedMedicinePage>
  )
}
