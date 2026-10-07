"use client"

import { Loader2 } from "lucide-react"
import { useState } from "react"
import type { FormEvent } from "react"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { Input } from "@optimitron/neobrutalist-ui/ui/input"

import { trackDonationStarted } from "@/lib/analytics"
import { getPaymentLink, PRESET_AMOUNTS, type PresetAmount } from "@/lib/stripe-payment-links"

type Frequency = "oneTime" | "monthly"

const frequencies: { value: Frequency; label: string }[] = [
  { value: "oneTime", label: "One-time" },
  { value: "monthly", label: "Monthly" },
]

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Picks an amount and frequency, then sends the donor to that amount's Stripe Payment Link. */
export function DonationForm({ canceled }: { canceled: boolean }) {
  const [amount, setAmount] = useState<PresetAmount>(25)
  const [frequency, setFrequency] = useState<Frequency>("monthly")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function donate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return setError("Please enter your name")
    if (!email.trim()) return setError("Please enter your email")
    if (!emailPattern.test(email)) return setError("Please enter a valid email address")

    setError(null)
    setLoading(true)
    trackDonationStarted({ amount, type: frequency === "oneTime" ? "one_time" : "monthly" })
    window.location.href = getPaymentLink(amount, frequency, email, name)
  }

  return (
    <form onSubmit={donate} noValidate className="space-y-6 rounded-lg border bg-card p-5 shadow-sm sm:p-8">
      {canceled && (
        <p role="status" className="rounded-md bg-muted px-4 py-3 text-sm">Donation cancelled. You can try again below.</p>
      )}

      <div role="group" aria-label="How often" className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
        {frequencies.map(option => (
          <button key={option.value} type="button" aria-pressed={frequency === option.value}
            onClick={() => setFrequency(option.value)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              frequency === option.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            {option.label}
          </button>
        ))}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Amount</legend>
        <div className="grid grid-cols-3 gap-2">
          {PRESET_AMOUNTS.map(preset => (
            <Button key={preset} type="button" variant={amount === preset ? "default" : "outline"}
              aria-pressed={amount === preset} onClick={() => setAmount(preset)} className="h-11 text-base">
              ${preset.toLocaleString("en-US")}
            </Button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="block text-sm font-medium">Full name</span>
          <Input name="name" autoComplete="name" value={name} onChange={event => setName(event.target.value)}
            disabled={loading} className="h-11" />
        </label>
        <label className="block space-y-2">
          <span className="block text-sm font-medium">Email</span>
          <Input name="email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)}
            disabled={loading} className="h-11" />
        </label>
      </div>

      {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}

      <Button type="submit" size="lg" className="w-full text-base" disabled={loading}>
        {loading
          ? <><Loader2 aria-hidden="true" className="animate-spin" /> Opening checkout</>
          : `Donate $${amount.toLocaleString("en-US")} ${frequency === "monthly" ? "monthly" : "now"}`}
      </Button>
    </form>
  )
}
