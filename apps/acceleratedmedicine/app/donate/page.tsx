import { ExternalLink, Mail } from "lucide-react"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"

import { AcceleratedMedicinePage } from "@/components/accelerated-medicine-chrome"
import { DonationForm } from "@/components/donate/donation-form"
import { SectionHeading } from "@/components/section-heading"
import { SITE } from "@/lib/site-settings"

const uses = [
  {
    title: "Public education",
    text: "Explain patient choice, clinical-trial participation, pragmatic methods, and what the evidence can and cannot support.",
  },
  {
    title: "Research and operations",
    text: "Create transparent treatment outcome labels, compare treatments by effectiveness, side effects, and cost, and publish the methods and results.",
  },
  {
    title: "Infrastructure",
    text: "Maintain secure tools for standardized outcome collection, anonymization, aggregation, analysis, and public treatment rankings.",
  },
]

const majorGiftSubject = encodeURIComponent("Major Gift / Foundation Inquiry")

/**
 * One-time and monthly donations through Stripe Payment Links. No menu links here while the donate links are
 * hidden (SHOW_DONATE_LINKS in lib/navigation.ts). ?canceled shows a note for donors who left checkout.
 */
export default async function DonatePage({ searchParams }: { searchParams: Promise<{ canceled?: string }> }) {
  const { canceled } = await searchParams

  return (
    <AcceleratedMedicinePage>
      <section className="mx-auto max-w-3xl pb-10 text-center md:py-4">
        <p className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">Donate</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          Fund the Care-Integrated Clinical Trials Initiative
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground md:text-xl">
          Help patients understand their options and turn treatment outcomes into useful evidence. Your donation
          supports education, pragmatic-trial research, and transparent treatment comparisons.
        </p>
      </section>

      <section aria-label="Donation" className="mx-auto max-w-2xl space-y-6 pb-12 md:pb-16">
        <DonationForm canceled={Boolean(canceled)} />

        <div className="rounded-lg border p-5 sm:p-6">
          <h2 className="font-semibold">Foundation or major gifts ($10,000+)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            For large donations, corporate giving, or foundation grants requiring proposals, invoicing, or impact
            reports.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline">
              <a href="https://cal.com/mikepsinn" target="_blank" rel="noopener noreferrer">
                Schedule a call <ExternalLink aria-hidden="true" />
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={`mailto:${SITE.donationsEmail}?subject=${majorGiftSubject}`}>
                <Mail aria-hidden="true" /> Send email
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="uses-heading" className="band-muted py-12 md:py-16">
        <SectionHeading id="uses-heading" title="How your donation is used" />
        <ul className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-3">
          {uses.map(use => (
            <li key={use.title} className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="font-semibold">{use.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{use.text}</p>
            </li>
          ))}
        </ul>
      </section>
    </AcceleratedMedicinePage>
  )
}
