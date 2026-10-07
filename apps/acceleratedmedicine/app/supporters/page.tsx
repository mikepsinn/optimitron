import { ArrowRight } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"

import { AcceleratedMedicinePage } from "@/components/accelerated-medicine-chrome"
import { SectionHeading } from "@/components/section-heading"
import { SupportingOrganizations } from "@/components/supporting-organizations"
import { rightToTrialMetadata } from "@/lib/right-to-trial-metadata"
import { getSupportSummary } from "@/lib/support-store"

// Rebuilt every few minutes, and at once when someone confirms or an organization is approved.
export const revalidate = 300

export const metadata: Metadata = rightToTrialMetadata({
  title: "Supporters | Care-Integrated Clinical Trials Initiative",
  description:
    "The people and organizations who support the Care-Integrated Clinical Trials Initiative: every patient should be able to join clinical trials of the most promising treatments.",
  path: "/supporters",
})

export default async function SupportersPage() {
  const { confirmedPeople, organizations } = await getSupportSummary()

  return (
    <AcceleratedMedicinePage>
      <section className="mx-auto max-w-3xl pb-12 text-center md:py-8 md:pb-16">
        <p className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">Supporters</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          Who supports the Care-Integrated Clinical Trials Initiative
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground md:text-xl">
          {confirmedPeople > 0
            ? `${confirmedPeople.toLocaleString("en-US")} ${confirmedPeople === 1 ? "person has" : "people have"} added their name, so every patient can join clinical trials of the most promising treatments.`
            : "Add your name, so every patient can join clinical trials of the most promising treatments."}
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/support">Show your support <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" /></Link>
        </Button>
      </section>

      <section aria-labelledby="organizations-heading" className="band-muted py-12 md:py-20">
        <SectionHeading id="organizations-heading" title="Organizations" />
        <div className="mt-8">
          {organizations.length > 0 ? (
            <SupportingOrganizations organizations={organizations} />
          ) : (
            <p className="text-center text-muted-foreground">
              Patient groups, clinics, hospitals, research groups and companies can{" "}
              <Link href="/support#organization" className="font-medium text-primary hover:underline">endorse the initiative</Link>.
            </p>
          )}
        </div>
      </section>
    </AcceleratedMedicinePage>
  )
}
