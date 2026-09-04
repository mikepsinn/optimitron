import type { Metadata } from "next"
import Link from "next/link"
import { Check } from "lucide-react"

import { Layout } from "@/components/layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { SuccessConfetti } from "@/components/donate/success-confetti"
import { ROUTES } from "@/lib/routes"

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

  return (
    <Layout>
      <SectionContainer
        bgColor="background"
        borderPosition="none"
        padding="lg"
        className="min-h-screen"
      >
        <Container size="sm">
          {confirmed ? <SuccessConfetti /> : null}

          <Card className="p-12 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-brutal-yellow text-center mb-8">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-brutal-pink">
              <Check className="w-16 h-16 text-white" strokeWidth={4} />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black uppercase mb-4">
              {confirmed ? (
                <>
                  DONATION <span className="text-brutal-pink">RECEIVED!</span>
                </>
              ) : (
                <>
                  THANK <span className="text-brutal-pink">YOU!</span>
                </>
              )}
            </h1>
            <p className="text-xl font-bold">
              Your support funds patient education, pragmatic-trial research,
              and public treatment evidence.
            </p>
          </Card>

          <Card className="p-8 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
            <h2 className="text-2xl font-black uppercase mb-4">
              WHERE YOUR DONATION WENT
            </h2>
            <p className="text-lg font-bold mb-3">
              Every donation — including gifts made on warondisease.org — goes
              to Accelerated Medicine Foundation Inc, a 501(c)(3) nonprofit
              operating as the Institute for Accelerated Medicine.
            </p>
            <p className="mb-3">
              EIN 41-2555651. Your donation is tax-deductible to the extent
              allowed by law. Stripe emails your receipt — keep it for your
              records.
            </p>
            {sessionId ? (
              <p className="text-sm text-muted-foreground break-all">
                Reference: {sessionId}. Questions? Email{" "}
                <a className="underline" href="mailto:hello@acceleratedmedicine.org">
                  hello@acceleratedmedicine.org
                </a>{" "}
                with that reference.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Just donated? Your Stripe receipt email is the confirmation.
                Questions? Email{" "}
                <a className="underline" href="mailto:hello@acceleratedmedicine.org">
                  hello@acceleratedmedicine.org
                </a>
                .
              </p>
            )}
          </Card>

          <Card className="p-8 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-cyan-400 mb-8">
            <h2 className="text-2xl font-black uppercase mb-4">
              KEEP THE MOMENTUM
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 mt-0.5 flex-shrink-0" strokeWidth={3} />
                <div>
                  <div className="font-black uppercase">
                    Vote on the 1% Treaty
                  </div>
                  <div className="text-sm">
                    30 seconds to say military budgets should fund cures
                    instead.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 mt-0.5 flex-shrink-0" strokeWidth={3} />
                <div>
                  <div className="font-black uppercase">
                    Put your state on the Right to Trial map
                  </div>
                  <div className="text-sm">
                    Tell us whether every patient in your state should be able
                    to join a clinical trial.
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid sm:grid-cols-2 gap-4">
            <Button
              asChild
              className="h-14 text-lg font-black uppercase bg-brutal-pink text-white border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              <a href="https://warondisease.org/vote">VOTE ON THE TREATY</a>
            </Button>
            <Button
              asChild
              className="h-14 text-lg font-black uppercase bg-brutal-cyan border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              <Link href={ROUTES.survey}>TAKE THE STATE SURVEY</Link>
            </Button>
          </div>
        </Container>
      </SectionContainer>
    </Layout>
  )
}
