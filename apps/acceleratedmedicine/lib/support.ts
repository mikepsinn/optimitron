import { Resend } from "resend"
import { z } from "zod"

import { escapeHtml } from "@/lib/escape-html"
import { supportLinkUrl, verifySupportLink } from "@/lib/support-links"
import { ORGANIZATION_STATES, SUPPORTER_STATES } from "@/lib/support-options"
import {
  getOrganization,
  getSupporter,
  hasSupportEvent,
  recordSupportEvent,
  storeOrganization,
  storeSupporter,
  type StoredOrganization,
  type StoredSupporter,
} from "@/lib/support-store"

const INBOX = "hello@acceleratedmedicine.org"
const INITIATIVE = "Care-Integrated Clinical Trials Initiative"
const SIGNATURE_TEXT = [
  `The ${INITIATIVE}`,
  "A project of the Institute for Accelerated Medicine (Accelerated Medicine Foundation Inc), a 501(c)(3) nonprofit",
].join("\n")
const SIGNATURE_HTML = `<p><strong>The ${INITIATIVE}</strong><br>A project of the Institute for Accelerated Medicine (Accelerated Medicine Foundation Inc), a 501(c)(3) nonprofit</p>`

// People type "example.org" as often as "https://example.org". Anything that is not http or https, such as
// a javascript: link, is rejected, because the site links to these addresses.
const webAddress = z.preprocess(
  value => {
    const trimmed = typeof value === "string" ? value.trim() : value
    return typeof trimmed === "string" && trimmed && !/^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? `https://${trimmed}` : trimmed
  },
  z.string().max(1000).url().refine(address => /^https?:\/\//i.test(address), "Enter a web address"),
)

const honeypot = z.string().max(500).optional().default("")

export const supporterSchema = z.object({
  submissionKey: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  state: z.enum(SUPPORTER_STATES),
  updates: z.boolean().default(false),
  companyWebsite: honeypot,
})

export const organizationSchema = z.object({
  submissionKey: z.string().uuid(),
  organization: z.string().trim().min(1).max(200),
  website: webAddress,
  logoUrl: z.union([z.literal(""), webAddress]).optional().default(""),
  contactName: z.string().trim().min(1).max(120),
  contactEmail: z.string().trim().email().max(320),
  state: z.enum(ORGANIZATION_STATES),
  companyWebsite: honeypot,
})

export type SupporterInput = z.infer<typeof supporterSchema>
export type OrganizationInput = z.infer<typeof organizationSchema>

function emailClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return undefined
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || "no-reply@updates.dfda.earth"
  return { resend: new Resend(apiKey), from: `${INITIATIVE} <${fromAddress}>` }
}

export function buildSupporterConfirmation(name: string, confirmUrl: string) {
  const subject = `Confirm your support for the ${INITIATIVE}`
  const text = [
    `Hi ${name},`,
    "",
    `Confirm that you support the ${INITIATIVE}, so every patient can join clinical trials of the most promising treatments through their own doctor, with every result published:`,
    confirmUrl,
    "",
    "If you did not sign up, ignore this email and nothing will be recorded.",
    "",
    SIGNATURE_TEXT,
  ].join("\n")
  const html = `
    <main style="font-family:Arial,sans-serif;line-height:1.6;max-width:640px;margin:auto;padding:24px">
      <p>Hi ${escapeHtml(name)},</p>
      <p>Confirm that you support the ${INITIATIVE}, so every patient can join clinical trials of the most promising treatments through their own doctor, with every result published.</p>
      <p><a href="${escapeHtml(confirmUrl)}" style="display:inline-block;background:#6d4aff;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Confirm your support</a></p>
      <p style="color:#666">If you did not sign up, ignore this email and nothing will be recorded.</p>
      ${SIGNATURE_HTML}
    </main>
  `.trim()
  return { html, subject, text }
}

export function buildOrganizationAlert(input: OrganizationInput, approveUrl: string) {
  const rows: Array<[string, string]> = [
    ["Organization", input.organization],
    ["Website", input.website],
    ["Logo", input.logoUrl || "Not provided"],
    ["Where it works", input.state],
    ["Contact", `${input.contactName} <${input.contactEmail}>`],
  ]
  const subject = `[Endorsement] ${input.organization} (${input.state})`
  const text = [
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Check the organization, then list it on /supporters and its state page:",
    approveUrl,
    "",
    "Do nothing to keep it off the site. Reply to this email to write to the contact.",
  ].join("\n")
  const html = `
    <h1>Organization endorsement</h1>
    ${rows.map(([label, value]) => `<p><strong>${label}:</strong> ${escapeHtml(value)}</p>`).join("\n")}
    <p>Check the organization, then list it on /supporters and its state page.</p>
    <p><a href="${escapeHtml(approveUrl)}">Approve listing</a></p>
    <p>Do nothing to keep it off the site. Reply to this email to write to the contact.</p>
  `.trim()
  return { html, subject, text }
}

function buildOrganizationReceipt(input: OrganizationInput) {
  const subject = `We received ${input.organization}'s endorsement`
  const body = `Thank you for endorsing the ${INITIATIVE}. We check each organization before listing it, and we will email you when ${input.organization} appears on acceleratedmedicine.org/supporters.`
  return {
    subject,
    text: [`Hi ${input.contactName},`, "", body, "", SIGNATURE_TEXT].join("\n"),
    html: `<main style="font-family:Arial,sans-serif;line-height:1.6;max-width:640px;margin:auto;padding:24px"><p>Hi ${escapeHtml(input.contactName)},</p><p>${escapeHtml(body)}</p>${SIGNATURE_HTML}</main>`,
  }
}

function buildOrganizationListed(organization: StoredOrganization) {
  const subject = `${organization.organization} is listed as a supporter`
  const body = `${organization.organization} now appears among the organizations supporting the ${INITIATIVE}: https://acceleratedmedicine.org/supporters`
  return {
    subject,
    text: [`Hi ${organization.contactName},`, "", body, "", SIGNATURE_TEXT].join("\n"),
    html: `<main style="font-family:Arial,sans-serif;line-height:1.6;max-width:640px;margin:auto;padding:24px"><p>Hi ${escapeHtml(organization.contactName)},</p><p>${escapeHtml(body)}</p>${SIGNATURE_HTML}</main>`,
  }
}

/**
 * Stores a person's support and emails them a confirmation link. They count once they click it.
 * A failed confirmation email fails the request, so the retry (same keys) stores once and sends once.
 */
export async function sendSupporterSignup(
  rawInput: unknown,
  options: { clientKey: string; store?: typeof storeSupporter },
): Promise<{ sentConfirmation: boolean }> {
  const input = supporterSchema.parse(rawInput)
  // Silently accept bot submissions, so bots learn nothing and spam stays out of the store.
  if (input.companyWebsite) return { sentConfirmation: false }

  const { submissionId } = await (options.store ?? storeSupporter)(input, input.submissionKey, options.clientKey)
  const email = emailClient()
  if (!email) {
    console.error("Supporter email service is not configured")
    return { sentConfirmation: false }
  }
  const result = await email.resend.emails.send(
    { from: email.from, to: input.email, ...buildSupporterConfirmation(input.name, supportLinkUrl("confirm-supporter", submissionId)) },
    { idempotencyKey: `supporter-confirmation/${submissionId}` },
  )
  if (result.error || !result.data?.id) {
    throw new Error(`The supporter confirmation was not accepted: ${result.error?.message ?? "no email id"}`)
  }
  return { sentConfirmation: true }
}

/**
 * Stores an organization's endorsement and emails the Institute an "Approve listing" link. Nothing is listed
 * until someone clicks it. A failed alert fails the request, so the retry sends it once.
 */
export async function sendOrganizationEndorsement(
  rawInput: unknown,
  options: { clientKey: string; store?: typeof storeOrganization },
): Promise<{ notified: boolean }> {
  const input = organizationSchema.parse(rawInput)
  if (input.companyWebsite) return { notified: false }

  const { submissionId } = await (options.store ?? storeOrganization)(input, input.submissionKey, options.clientKey)
  const email = emailClient()
  if (!email) {
    console.error("Endorsement email service is not configured")
    return { notified: false }
  }
  const alert = await email.resend.emails.send(
    { from: email.from, to: INBOX, replyTo: input.contactEmail, ...buildOrganizationAlert(input, supportLinkUrl("approve-organization", submissionId)) },
    { idempotencyKey: `organization-alert/${submissionId}` },
  )
  if (alert.error || !alert.data?.id) {
    throw new Error(`The endorsement alert was not accepted: ${alert.error?.message ?? "no email id"}`)
  }
  try {
    await email.resend.emails.send(
      { from: email.from, to: input.contactEmail, replyTo: INBOX, ...buildOrganizationReceipt(input) },
      { idempotencyKey: `organization-receipt/${submissionId}` },
    )
  } catch (error) {
    console.error("Endorsement receipt email failed", error)
  }
  return { notified: true }
}

export type LinkResult<T> = { status: "invalid" } | { status: "pending" | "done"; record: T }

interface LinkDependencies {
  getSupporter: typeof getSupporter
  getOrganization: typeof getOrganization
  hasSupportEvent: typeof hasSupportEvent
  recordSupportEvent: typeof recordSupportEvent
  subscribe: (email: string) => Promise<void>
  notifyListed: (organization: StoredOrganization) => Promise<void>
}

async function subscribeToUpdates(address: string) {
  const audienceId = process.env.RESEND_AUDIENCE_ID
  const email = emailClient()
  if (!audienceId || !email) {
    console.error("RESEND_AUDIENCE_ID or RESEND_API_KEY is not configured; a confirmed supporter was not subscribed")
    return
  }
  const result = await email.resend.contacts.create({ audienceId, email: address, unsubscribed: false })
  if (result.error) throw new Error(result.error.message)
}

async function emailListed(organization: StoredOrganization) {
  const email = emailClient()
  if (!email) return
  await email.resend.emails.send(
    { from: email.from, to: organization.contactEmail, replyTo: INBOX, ...buildOrganizationListed(organization) },
    { idempotencyKey: `organization-listed/${organization.id}` },
  )
}

const defaults: LinkDependencies = {
  getSupporter,
  getOrganization,
  hasSupportEvent,
  recordSupportEvent,
  subscribe: subscribeToUpdates,
  notifyListed: emailListed,
}

/** What the confirmation page shows: a bad link, a person still to confirm, or one already confirmed. */
export async function checkSupporterLink(id: string, token: string, deps: Partial<LinkDependencies> = {}): Promise<LinkResult<StoredSupporter>> {
  const { getSupporter: get, hasSupportEvent: has } = { ...defaults, ...deps }
  if (!verifySupportLink("confirm-supporter", id, token)) return { status: "invalid" }
  const record = await get(id)
  if (!record) return { status: "invalid" }
  return { status: (await has("confirm-supporter", id)) ? "done" : "pending", record }
}

/** Confirms a person once. Their updates subscription starts here, so nobody is subscribed without clicking. */
export async function confirmSupporter(id: string, token: string, deps: Partial<LinkDependencies> = {}): Promise<LinkResult<StoredSupporter>> {
  const all = { ...defaults, ...deps }
  const checked = await checkSupporterLink(id, token, all)
  if (checked.status !== "pending") return checked
  await all.recordSupportEvent("confirm-supporter", id)
  if (checked.record.updates) {
    await all.subscribe(checked.record.email).catch(error => console.error("Supporter subscription failed", error))
  }
  return { status: "done", record: checked.record }
}

export async function checkOrganizationLink(id: string, token: string, deps: Partial<LinkDependencies> = {}): Promise<LinkResult<StoredOrganization>> {
  const { getOrganization: get, hasSupportEvent: has } = { ...defaults, ...deps }
  if (!verifySupportLink("approve-organization", id, token)) return { status: "invalid" }
  const record = await get(id)
  if (!record) return { status: "invalid" }
  return { status: (await has("approve-organization", id)) ? "done" : "pending", record }
}

/** Lists an organization once and tells its contact. */
export async function approveOrganization(id: string, token: string, deps: Partial<LinkDependencies> = {}): Promise<LinkResult<StoredOrganization>> {
  const all = { ...defaults, ...deps }
  const checked = await checkOrganizationLink(id, token, all)
  if (checked.status !== "pending") return checked
  await all.recordSupportEvent("approve-organization", id)
  await all.notifyListed(checked.record).catch(error => console.error("Listing email failed", error))
  return { status: "done", record: checked.record }
}
