"use client"

import { CheckCircle2, Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { FormEvent, ReactNode, RefObject } from "react"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { Input } from "@optimitron/neobrutalist-ui/ui/input"

import { ORGANIZATION_STATES, SUPPORTER_STATES } from "@/lib/support-options"

type SubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; fields: Record<string, string> }
  | { status: "error"; message: string }

const failureMessage = "We could not send this. Please try again or email hello@acceleratedmedicine.org."
const card = "rounded-lg border bg-card p-5 shadow-sm sm:p-8"
const select = "h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

/** Posts a form's fields once. An unchanged retry reuses its key, so it is stored and emailed once. */
function useSubmission(endpoint: string) {
  const [submission, setSubmission] = useState<SubmissionState>({ status: "idle" })
  const lastAttempt = useRef<{ key: string; payload: string }>()
  const confirmation = useRef<HTMLDivElement>(null)

  // The confirmation is shorter than the form, so bring it into view where the button was.
  useEffect(() => {
    if (submission.status === "success") confirmation.current?.scrollIntoView({ block: "center" })
  }, [submission.status])

  async function submit(event: FormEvent<HTMLFormElement>, extra: Record<string, unknown> = {}) {
    event.preventDefault()
    const fields = Object.fromEntries(
      [...new FormData(event.currentTarget).entries()].map(([key, value]) => [key, String(value).trim()]),
    )
    const payload = JSON.stringify({ ...fields, ...extra })
    if (lastAttempt.current?.payload !== payload) {
      lastAttempt.current = { key: crypto.randomUUID(), payload }
    }
    setSubmission({ status: "submitting" })
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionKey: lastAttempt.current.key, ...fields, ...extra }),
      })
      // A platform error page is HTML, not JSON, so it falls back to the general message.
      const body = (await response.json().catch(() => ({}))) as { error?: string; ok?: boolean }
      if (!response.ok || !body.ok) throw new Error(body.error || failureMessage)
      setSubmission({ status: "success", fields })
    } catch (error) {
      setSubmission({ status: "error", message: error instanceof Error ? error.message : failureMessage })
    }
  }

  const fail = (message: string) => setSubmission({ status: "error", message })
  return { submission, submit, fail, confirmation }
}

// Mirrors the server: a missing scheme becomes https://, and only http and https addresses count.
function isWebAddress(value: string) {
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`)
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".")
  } catch {
    return false
  }
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-medium">
        {label} {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </span>
      {children}
    </label>
  )
}

function StateSelect({ name, label, options }: { name: string; label: string; options: readonly string[] }) {
  return (
    <Field label={label}>
      <select name={name} required defaultValue="" className={select}>
        <option value="" disabled>Choose one</option>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </Field>
  )
}

function Footer({ submission, label, note }: { submission: SubmissionState; label: string; note: string }) {
  return (
    <div className="space-y-3">
      {/* Hidden from people; bots that fill every field are accepted silently and not stored. */}
      <div aria-hidden="true" className="hidden">
        <input name="companyWebsite" tabIndex={-1} autoComplete="off" aria-label="Leave this field empty" />
      </div>
      <Button type="submit" size="lg" className="w-full text-base sm:w-auto" disabled={submission.status === "submitting"}>
        {submission.status === "submitting" ? <><Loader2 aria-hidden="true" className="animate-spin" /> Sending</> : label}
      </Button>
      <p className="text-sm text-muted-foreground">{note}</p>
      {submission.status === "error" && <p role="alert" className="text-sm font-medium text-destructive">{submission.message}</p>}
    </div>
  )
}

function Done({ confirmation, title, children }: { confirmation: RefObject<HTMLDivElement>; title: string; children: ReactNode }) {
  return (
    <div ref={confirmation} role="status" className={`${card} text-center`}>
      <CheckCircle2 aria-hidden="true" className="mx-auto h-10 w-10 text-primary" />
      <h3 className="mt-4 text-2xl font-bold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{children}</p>
    </div>
  )
}

/** A person adds their name. They count once they click the link in the confirmation email. */
export function SupporterForm() {
  const { submission, submit, confirmation } = useSubmission("/api/support")
  const [updates, setUpdates] = useState(true)

  if (submission.status === "success") {
    return (
      <Done confirmation={confirmation} title="Check your email">
        We sent a link to {submission.fields.email}. Your name counts once you click it.
      </Done>
    )
  }

  return (
    <form onSubmit={event => submit(event, { updates })} className={`${card} space-y-6`}>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Your name"><Input name="name" autoComplete="name" maxLength={120} required className="h-11" /></Field>
        <Field label="Email"><Input name="email" type="email" autoComplete="email" maxLength={320} required className="h-11" /></Field>
        <div className="sm:col-span-2"><StateSelect name="state" label="Your state" options={SUPPORTER_STATES} /></div>
      </div>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={updates} onChange={event => setUpdates(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--primary)]" />
        <span>Email me occasional updates about the initiative.</span>
      </label>
      <Footer submission={submission} label="Add my name"
        note="We show how many people support the initiative, never their names. We email you only to confirm and, if you ask, to send updates." />
    </form>
  )
}

/** An organization endorses. It appears on /supporters and its state page after the Institute approves it. */
export function OrganizationForm() {
  const { submission, submit, fail, confirmation } = useSubmission("/api/endorse")

  if (submission.status === "success") {
    return (
      <Done confirmation={confirmation} title={`Thank you, ${submission.fields.organization}`}>
        We check each organization before listing it, and we&apos;ll email {submission.fields.contactEmail} when it
        appears on the supporters page.
      </Done>
    )
  }

  return (
    <form onSubmit={event => {
      const data = new FormData(event.currentTarget)
      const website = String(data.get("website") ?? "").trim()
      const logoUrl = String(data.get("logoUrl") ?? "").trim()
      if (!isWebAddress(website)) {
        event.preventDefault()
        return fail("Enter the website as a web address, such as example.org.")
      }
      if (logoUrl && !isWebAddress(logoUrl)) {
        event.preventDefault()
        return fail("Enter the logo link as a web address, such as example.org/logo.png, or leave it empty.")
      }
      return submit(event)
    }} className={`${card} space-y-6`}>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Organization"><Input name="organization" autoComplete="organization" maxLength={200} required className="h-11" /></Field>
        </div>
        <Field label="Website"><Input name="website" type="text" inputMode="url" autoComplete="url" maxLength={1000} required placeholder="example.org" className="h-11" /></Field>
        <Field label="Logo link" optional><Input name="logoUrl" type="text" inputMode="url" maxLength={1000} placeholder="example.org/logo.png" className="h-11" /></Field>
        <Field label="Contact name"><Input name="contactName" autoComplete="name" maxLength={120} required className="h-11" /></Field>
        <Field label="Contact email"><Input name="contactEmail" type="email" autoComplete="email" maxLength={320} required className="h-11" /></Field>
        <div className="sm:col-span-2"><StateSelect name="state" label="Where it works" options={ORGANIZATION_STATES} /></div>
      </div>
      <Footer submission={submission} label="Endorse the initiative"
        note="We list the organization's name, website, logo and state. The contact's name and email stay private." />
    </form>
  )
}
