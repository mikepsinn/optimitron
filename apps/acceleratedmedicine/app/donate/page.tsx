"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Layout } from "@/components/layout"
import { StatCardGrid, type StatCardProps } from "@/components/ui/stat-card"
import { Input } from "@/components/ui/input"
import { getPaymentLink, type PresetAmount } from "@/lib/stripe-payment-links"
import { trackDonationStarted } from "@/lib/analytics"
import {
  CURRENT_CLINICAL_TRIAL_PARTICIPATION_RATE,
  RECOVERY_TRIAL_COST_REDUCTION_FACTOR,
  GLOBAL_DISEASE_DEATHS_DAILY,
} from "@/lib/parameters-calculations-citations"
import { ParameterValue } from "@/components/shared/ParameterValue"
import { getEmail } from "@/lib/site-config"

// New shared components
import { Container } from "@/components/ui/container"
import { SectionHeader } from "@/components/ui/section-header"
import { BrutalCard } from "@/components/ui/brutal-card"
import { FormField } from "@/components/ui/form-field"
import { ToggleButtonGroup } from "@/components/ui/toggle-button-group"
import { AmountSelector } from "@/components/ui/amount-selector"
import { AlertCard } from "@/components/ui/alert-card"
import { LoadingButton } from "@/components/ui/loading-button"

export default function DonatePage() {
  const searchParams = useSearchParams()
  const canceled = searchParams?.get("canceled")

  const [selectedAmount, setSelectedAmount] = useState<number | null>(25)
  const [donationType, setDonationType] = useState<"one-time" | "monthly">("monthly")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDonate = async () => {
    // Validate inputs
    if (!selectedAmount) {
      setError("Please select a donation amount")
      return
    }

    if (!name.trim()) {
      setError("Please enter your name")
      return
    }

    if (!email.trim()) {
      setError("Please enter your email")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setError(null)
    setLoading(true)

    try {
      // Track donation started event
      trackDonationStarted({
        amount: selectedAmount,
        type: donationType === "one-time" ? "one_time" : "monthly",
      })

      // All amounts are now preset amounts with Payment Links
      const paymentLinkType = donationType === "one-time" ? "oneTime" : "monthly"
      const paymentUrl = getPaymentLink(selectedAmount as PresetAmount, paymentLinkType, email, name)
      window.location.href = paymentUrl
    } catch (err) {
      console.error("Donation error:", err)
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background py-20">
        <Container>
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase mb-6">
              FUND MEDICAL FREEDOM <span className="text-brutal-pink">THAT LEARNS</span>
            </h1>
            <p className="text-xl sm:text-2xl max-w-3xl mx-auto leading-relaxed">
              Help patients understand their options and turn treatment outcomes into useful evidence. Your donation supports education, pragmatic-trial research, and transparent treatment comparisons.
            </p>
          </div>

          {/* Impact Stats */}
          <StatCardGrid
            className="mb-16"
            stats={[
              {
                value: (
                  <ParameterValue
                    param={CURRENT_CLINICAL_TRIAL_PARTICIPATION_RATE}
                    format={{ precision: 2 }}
                  />
                ),
                label: "Patients who currently participate in clinical trials",
                color: "yellow",
              },
              {
                value: <ParameterValue param={RECOVERY_TRIAL_COST_REDUCTION_FACTOR} />,
                label: "Lower cost per patient in the RECOVERY trial",
                color: "pink",
              },
              {
                value: <ParameterValue param={GLOBAL_DISEASE_DEATHS_DAILY} />,
                label: "Lives lost daily to disease",
                color: "cyan",
              },
            ] as StatCardProps[]}
          />

          {/* Donation Form */}
          <BrutalCard padding="lg" className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-black uppercase mb-6 text-center">
              COMPLETE YOUR <span className="text-brutal-pink">DONATION</span>
            </h2>

            {/* Cancellation message */}
            {canceled && (
              <AlertCard
                type="warning"
                message="Donation cancelled. You can try again below."
                className="mb-6"
              />
            )}

            {/* Error message */}
            {error && (
              <AlertCard
                type="error"
                message={error}
                className="mb-6"
              />
            )}

            {/* One-time vs Monthly */}
            <ToggleButtonGroup
              options={[
                { value: "one-time", label: "ONE-TIME" },
                { value: "monthly", label: "MONTHLY" },
              ]}
              value={donationType}
              onChange={(value) => setDonationType(value as "one-time" | "monthly")}
              size="lg"
              className="mb-6"
            />

            {/* Amount Selection */}
            <FormField label="SELECT AMOUNT" className="mb-6">
              <AmountSelector
                amounts={[1, 5, 10, 25, 50, 100, 250, 500, 1000]}
                value={selectedAmount}
                onChange={setSelectedAmount}
                columns={3}
              />
            </FormField>

            {/* Personal Information */}
            <div className="space-y-4 mb-6">
              <FormField label="FULL NAME" required htmlFor="name">
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="h-12 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold bg-background text-foreground"
                />
              </FormField>
              <FormField label="EMAIL" required htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-12 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold bg-background text-foreground"
                />
              </FormField>
            </div>

            {/* Submit Button */}
            <LoadingButton
              onClick={handleDonate}
              loading={loading}
              loadingText="PROCESSING..."
              className="w-full h-16 text-xl font-black uppercase bg-brutal-pink text-white border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all"
            >
              DONATE {selectedAmount ? `$${selectedAmount}` : ""} {donationType === "monthly" ? "MONTHLY" : "NOW"}
            </LoadingButton>

            {/* Major Gifts / Foundation Giving */}
            <div className="mt-6 p-4 border-4 border-primary bg-background rounded">
              <h3 className="font-black uppercase text-sm mb-2 text-center">FOUNDATION OR MAJOR GIFTS ($10,000+)</h3>
              <p className="text-xs text-center mb-3 text-muted-foreground">
                For large donations, corporate giving, or foundation grants requiring proposals, invoicing, or impact
                reports
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="https://cal.com/mikepsinn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-3 px-4 text-center font-bold uppercase border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-brutal-cyan hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Schedule a Call
                </a>
                <a
                  href={`mailto:${getEmail('donations')}?subject=Major%20Gift%20%2F%20Foundation%20Inquiry`}
                  className="block py-3 px-4 text-center font-bold uppercase border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-background hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Send Email
                </a>
              </div>
            </div>
          </BrutalCard>

          {/* How Funds Are Used */}
          <div className="mt-16">
            <SectionHeader
              title={<>HOW YOUR <span className="text-brutal-pink">DONATION</span> IS USED</>}
              size="md"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <BrutalCard bgColor="yellow">
                <h3 className="text-xl font-black uppercase mb-2">PUBLIC EDUCATION</h3>
                <p className="leading-relaxed">
                  Explain patient choice, clinical-trial participation, pragmatic methods, and what the evidence can and cannot support.
                </p>
              </BrutalCard>
              <BrutalCard>
                <h3 className="text-xl font-black uppercase mb-2">RESEARCH & OPERATIONS</h3>
                <p className="leading-relaxed">
                  Create transparent treatment outcome labels, compare treatments by effectiveness, side effects, and cost, and publish the methods and results.
                </p>
              </BrutalCard>
              <BrutalCard>
                <h3 className="text-xl font-black uppercase mb-2">INFRASTRUCTURE</h3>
                <p className="leading-relaxed">
                  Maintain secure tools for standardized outcome collection, anonymization, aggregation, analysis, and public treatment rankings.
                </p>
              </BrutalCard>
            </div>
          </div>
        </Container>
      </div>
    </Layout>
  )
}
