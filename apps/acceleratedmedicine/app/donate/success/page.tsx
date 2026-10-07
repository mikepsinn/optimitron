import { CheckCircle2 } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"

import { AcceleratedMedicinePage } from "@/components/accelerated-medicine-chrome"
import { SuccessConfetti } from "@/components/donate/success-confetti"
import { NONPROFIT } from "@/lib/nonprofit-identity"
import { SITE } from "@/lib/site-settings"

export const metadata: Metadata = {
  title: "Donation Received",
  description:
    "Your donation to Accelerated Medicine Foundation Inc (dba Institute for Accelerated Medicine), a 501(c)(3) nonprofit. EIN 41-2555651. Donations are tax-deductible.",
}

/**
 * Stripe Payment Links redirect here after checkout with
 * ?session_id={CHECKOUT_SESSION_ID}. There is no webhook and no API call:
 * arriving with a session_id IS the confirmation, and Stripe emails the
 * receipt. Donors from warondisease.org land here too, so the page names the
 * legal entity every donation goes to.
 */
export default async function DonateSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id: sessionId } = await searchParams
  const confirmed = Boolean(sessionId)
  const email = (
    <a className="font-medium text-primary hover:underline" href={`mailto:${SITE.email}`}>{SITE.email}</a>
  )

  return (
    <AcceleratedMedicinePage>
      {confirmed ? <SuccessConfetti /> : null}

      <section className="mx-auto max-w-2xl pb-8 text-center md:py-4">
        <CheckCircle2 aria-hidden="true" className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          {confirmed ? "Donation received" : "Thank you"}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground md:text-xl">
          Your support funds patient education, pragmatic-trial research, and public treatment evidence.
        </p>
      </section>

      <section aria-labelledby="receipt-heading" className="mx-auto max-w-2xl space-y-3 rounded-lg border bg-card p-6 shadow-sm sm:p-8">
        <h2 id="receipt-heading" className="text-xl font-semibold">Where your donation went</h2>
        <p>
          Every donation, including gifts made on warondisease.org, goes to {NONPROFIT.legalName}, a 501(c)(3)
          nonprofit operating as the {NONPROFIT.registeredDba}.
        </p>
        <p className="text-muted-foreground">
          EIN {NONPROFIT.ein}. Your donation is tax-deductible to the extent allowed by law. Stripe emails your
          receipt. Keep it for your records.
        </p>
        {sessionId ? (
          <p className="text-sm text-muted-foreground">
            Reference: <span className="break-all">{sessionId}</span>. Questions? Email {email} with that reference.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Just donated? Your Stripe receipt email is the confirmation. Questions? Email {email}.
          </p>
        )}
      </section>

      <section className="mx-auto max-w-2xl py-10 text-center">
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/support">Add your name</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/act">Read the act</Link>
          </Button>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Donated on warondisease.org?{" "}
          <a className="font-medium text-primary hover:underline" href="https://warondisease.org/vote">
            Vote on the 1% Treaty
          </a>
        </p>
      </section>
    </AcceleratedMedicinePage>
  )
}
