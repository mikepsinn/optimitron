"use client"

import { CheckCircle2, Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { Input } from "@optimitron/neobrutalist-ui/ui/input"
import { Textarea } from "@optimitron/neobrutalist-ui/ui/textarea"

import { PARTNER_TYPE_OPTIONS, PARTNER_TYPES, type PartnerType } from "@/lib/partner-signup-options"

type SubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; name: string; email: string }
  | { status: "error"; message: string }

const failureMessage = "We could not send this. Please try again or email hello@acceleratedmedicine.org."

/** The partner and advisory-board sign-up on /contact. Each submission is stored and emailed to the Institute. */
export function PartnerSignupForm({ initialType }: { initialType?: PartnerType }) {
  const [type, setType] = useState<PartnerType | undefined>(initialType)
  const [submission, setSubmission] = useState<SubmissionState>({ status: "idle" })
  // An unchanged retry reuses its key, so it is stored and emailed once. An edited message is a new submission.
  const lastAttempt = useRef<{ key: string; payload: string }>()
  const confirmation = useRef<HTMLDivElement>(null)

  // The confirmation is shorter than the form, so bring it into view where the Send button was.
  useEffect(() => {
    if (submission.status === "success") {
      confirmation.current?.scrollIntoView({ block: "center" })
    }
  }, [submission.status])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get("name") ?? "").trim()
    const email = String(formData.get("email") ?? "").trim()
    const fields = {
      type: formData.get("type"),
      name,
      email,
      organization: formData.get("organization"),
      message: formData.get("message"),
      companyWebsite: formData.get("companyWebsite"),
    }
    const payload = JSON.stringify(fields)
    if (lastAttempt.current?.payload !== payload) {
      lastAttempt.current = { key: crypto.randomUUID(), payload }
    }
    setSubmission({ status: "submitting" })

    try {
      const response = await fetch("/api/partner-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionKey: lastAttempt.current.key, ...fields }),
      })
      const body = (await response.json()) as { error?: string; ok?: boolean }
      if (!response.ok || !body.ok) {
        throw new Error(body.error || failureMessage)
      }
      setSubmission({ status: "success", name, email })
    } catch (error) {
      setSubmission({
        status: "error",
        message: error instanceof Error ? error.message : failureMessage,
      })
    }
  }

  if (submission.status === "success") {
    return (
      <div ref={confirmation} role="status" className="rounded-lg border bg-card p-8 text-center shadow-sm">
        <CheckCircle2 aria-hidden="true" className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 text-2xl font-bold">Thank you, {submission.name}</h2>
        <p className="mt-2 text-muted-foreground">
          Your message is with the Institute. We&apos;ll reply to {submission.email}.
        </p>
      </div>
    )
  }

  const placeholder = PARTNER_TYPE_OPTIONS[type ?? "other"].messagePlaceholder

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border bg-card p-5 shadow-sm sm:p-8">
      <fieldset>
        <legend className="text-lg font-semibold">How do you want to work with us?</legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {PARTNER_TYPES.map(value => (
            <label key={value}
              className="flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input type="radio" name="type" value={value} required checked={type === value}
                onChange={() => setType(value)} className="mt-1 h-4 w-4 shrink-0 accent-[var(--primary)]" />
              <span>
                <span className="block font-medium">{PARTNER_TYPE_OPTIONS[value].label}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{PARTNER_TYPE_OPTIONS[value].description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="block text-sm font-medium">Your name</span>
          <Input name="name" autoComplete="name" maxLength={120} required className="h-11" />
        </label>
        <label className="block space-y-2">
          <span className="block text-sm font-medium">Email</span>
          <Input name="email" type="email" autoComplete="email" maxLength={320} required className="h-11" />
        </label>
        <label className="block space-y-2 sm:col-span-2">
          <span className="block text-sm font-medium">
            Organization <span className="font-normal text-muted-foreground">(optional)</span>
          </span>
          <Input name="organization" autoComplete="organization" maxLength={200} className="h-11" />
        </label>
        <label className="block space-y-2 sm:col-span-2">
          <span className="block text-sm font-medium">
            Message <span className="font-normal text-muted-foreground">(optional)</span>
          </span>
          <Textarea name="message" maxLength={4000} placeholder={placeholder} className="min-h-32" />
        </label>
      </div>

      {/* Hidden from people; bots that fill every field are accepted silently and not stored. */}
      <div aria-hidden="true" className="hidden">
        <input name="companyWebsite" tabIndex={-1} autoComplete="off" aria-label="Leave this field empty" />
      </div>

      <div className="space-y-3">
        <Button type="submit" size="lg" className="w-full text-base sm:w-auto" disabled={submission.status === "submitting"}>
          {submission.status === "submitting" ? <><Loader2 aria-hidden="true" className="animate-spin" /> Sending</> : "Send"}
        </Button>
        <p className="text-sm text-muted-foreground">We use your email only to reply to you.</p>
        {submission.status === "error" && (
          <p role="alert" className="text-sm font-medium text-destructive">{submission.message}</p>
        )}
      </div>
    </form>
  )
}
