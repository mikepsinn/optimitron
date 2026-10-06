import type { Metadata } from "next"

import { HomeChrome } from "@/components/home/home-chrome"
import { PartnerSignupForm } from "@/components/partner-signup-form"
import { isPartnerType } from "@/lib/partner-signup-options"
import { rightToTrialMetadata } from "@/lib/right-to-trial-metadata"

export const metadata: Metadata = rightToTrialMetadata({
  title: "Partner with us | Institute for Accelerated Medicine",
  description:
    "Clinics, researchers, data partners, funders and advisors: tell us how you want to help every patient join clinical trials for the most promising treatments.",
  path: "/contact",
})

/** Partner and advisory-board sign-up. The home page's partner cards preselect a type with ?type=. */
export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const { type } = await searchParams

  return (
    <HomeChrome>
      <section className="mx-auto w-full max-w-3xl md:py-4">
        <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">Partner with us</div>
        <h1 className="mt-4 text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          Help every patient join a trial for the most promising treatments
        </h1>
        <p className="mt-4 text-muted-foreground md:text-xl">
          Tell us how you want to help make care-integrated clinical trials part of normal care. Your message goes
          to the Institute&apos;s inbox, and we reply by email.
        </p>
        <div className="mt-8">
          <PartnerSignupForm initialType={isPartnerType(type) ? type : undefined} />
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Prefer email? Write to{" "}
          <a href="mailto:hello@acceleratedmedicine.org" className="text-primary hover:underline">
            hello@acceleratedmedicine.org
          </a>
          .
        </p>
      </section>
    </HomeChrome>
  )
}
