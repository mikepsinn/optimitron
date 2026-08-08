"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Layout } from "@/components/layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { VoteOrShareButton } from "@/components/shared/VoteOrShareButton"
import { Check, Loader2 } from "lucide-react"
import Link from "next/link"
import confetti from "canvas-confetti"
import { ROUTES } from '@/lib/routes'
import { trackDonationCompleted } from "@/lib/analytics"

export default function DonateSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams?.get("session_id")
  const [loading, setLoading] = useState(true)
  const [sessionData, setSessionData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sessionId) {
      // Fetch session details
      fetch(`/api/stripe/session?session_id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error)
          } else {
            setSessionData(data)
            // Track donation completed event
            trackDonationCompleted({
              amount: data.amount_total ? data.amount_total / 100 : 0,
              type: data.mode === "subscription" ? "monthly" : "one_time",
              transactionId: sessionId || undefined,
            })
          }
          setLoading(false)
        })
        .catch(() => {
          setError("Failed to load donation details")
          setLoading(false)
        })

      // Trigger confetti
      const duration = 3000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#FF6B9D", "#00D4FF", "#FFE66D"],
        })

        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#FF6B9D", "#00D4FF", "#FFE66D"],
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }

      frame()
    } else {
      setError("No session ID provided")
      setLoading(false)
    }
  }, [sessionId])

  return (
    <Layout>
      <SectionContainer bgColor="background" borderPosition="none" padding="lg" className="min-h-screen">
        <Container size="sm">
          {loading ? (
            <Card className="p-12 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
              <p className="text-lg font-bold">Loading donation details...</p>
            </Card>
          ) : error ? (
            <Card className="p-12 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
              <div className="text-6xl mb-4">❌</div>
              <h1 className="text-3xl font-black uppercase mb-4">ERROR</h1>
              <p className="text-lg mb-6">{error}</p>
              <Button
                asChild
                className="h-12 px-8 font-black uppercase bg-brutal-pink text-white border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <Link href={ROUTES.donate}>BACK TO DONATE</Link>
              </Button>
            </Card>
          ) : (
            <>
              {/* Success Header */}
              <Card className="p-12 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-brutal-yellow text-center mb-8">
                <div className="inline-block p-4 bg-brutal-pink rounded-full mb-6">
                  <Check className="w-16 h-16 text-white" strokeWidth={4} />
                </div>
                <h1 className="text-4xl sm:text-5xl font-black uppercase mb-4">
                  DONATION <span className="text-brutal-pink">SUCCESSFUL!</span>
                </h1>
                <p className="text-xl font-bold mb-2">
                  Thank you for joining the war on disease, {sessionData?.metadata?.donorName || "friend"}!
                </p>
                <p className="text-lg">Your support brings us one step closer to ending preventable disease.</p>
              </Card>

              {/* Donation Details */}
              <Card className="p-8 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
                <h2 className="text-2xl font-black uppercase mb-6">DONATION DETAILS</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b-2 border-gray-200 pb-3">
                    <span className="font-bold uppercase">Amount</span>
                    <span className="text-2xl font-black text-brutal-pink">
                      ${sessionData?.amount_total ? (sessionData.amount_total / 100).toFixed(2) : "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b-2 border-gray-200 pb-3">
                    <span className="font-bold uppercase">Type</span>
                    <span className="font-black">
                      {sessionData?.mode === "subscription" ? "MONTHLY RECURRING" : "ONE-TIME"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b-2 border-gray-200 pb-3">
                    <span className="font-bold uppercase">Email</span>
                    <span className="font-bold">
                      {sessionData?.customer_email || sessionData?.customer_details?.email || "N/A"}
                    </span>
                  </div>
                  {sessionData?.mode === "subscription" && (
                    <div className="flex justify-between items-center">
                      <span className="font-bold uppercase">Next Payment</span>
                      <span className="font-bold">
                        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              {/* What's Next */}
              <Card className="p-8 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-cyan-400 mb-8">
                <h2 className="text-2xl font-black uppercase mb-4">WHAT HAPPENS NEXT?</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="w-6 h-6 mt-0.5 flex-shrink-0" strokeWidth={3} />
                    <div>
                      <div className="font-black uppercase">Confirmation Email</div>
                      <div className="text-sm">
                        Receipt sent to {sessionData?.customer_email || sessionData?.customer_details?.email || "your email"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-6 h-6 mt-0.5 flex-shrink-0" strokeWidth={3} />
                    <div>
                      <div className="font-black uppercase">Impact Updates</div>
                      <div className="text-sm">Monthly newsletter with treaty progress & research findings</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-6 h-6 mt-0.5 flex-shrink-0" strokeWidth={3} />
                    <div>
                      <div className="font-black uppercase">Quarterly Reports</div>
                      <div className="text-sm">Detailed financial transparency & metrics on lives impacted</div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Button
                  asChild
                  className="h-14 text-lg font-black uppercase bg-brutal-pink text-white border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                >
                  <Link href="/">
                    BACK TO HOME
                  </Link>
                </Button>
                <VoteOrShareButton
                  variant="default"
                  size="lg"
                  className="h-14 w-full"
                />
              </div>
            </>
          )}
        </Container>
      </SectionContainer>
    </Layout>
  )
}
