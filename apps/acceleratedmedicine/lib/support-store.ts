import { createHash } from "node:crypto"

import { FormFieldType, FormPurpose, FormSubmissionStatus } from "@optimitron/db"

import { storeFormSubmission, type StoredForm } from "@/lib/form-submission-store"
import { prisma } from "@/lib/prisma"
import type { OrganizationInput, SupporterInput } from "@/lib/support"
import type { SupportLinkAction } from "@/lib/support-links"
import { ORGANIZATION_STATES, SUPPORTER_STATES } from "@/lib/support-options"

const supporterForm: StoredForm = {
  sourceKey: "acceleratedmedicine:supporter",
  title: "Supporters of the Care-Integrated Clinical Trials Initiative",
  purpose: FormPurpose.INTAKE,
  fields: [
    { key: "name", prompt: "Your name", type: FormFieldType.SHORT_TEXT, required: true },
    { key: "email", prompt: "Email", type: FormFieldType.EMAIL, required: true },
    { key: "state", prompt: "Your state", type: FormFieldType.SINGLE_SELECT, required: true, optionsJson: SUPPORTER_STATES },
    { key: "updates", prompt: "Send occasional updates", type: FormFieldType.BOOLEAN, required: true },
  ],
}

const organizationForm: StoredForm = {
  sourceKey: "acceleratedmedicine:organization-endorsement",
  title: "Organizations endorsing the Care-Integrated Clinical Trials Initiative",
  purpose: FormPurpose.INTAKE,
  fields: [
    { key: "organization", prompt: "Organization", type: FormFieldType.SHORT_TEXT, required: true },
    { key: "website", prompt: "Website", type: FormFieldType.URL, required: true },
    { key: "logoUrl", prompt: "Logo link", type: FormFieldType.URL, required: false },
    { key: "contactName", prompt: "Contact name", type: FormFieldType.SHORT_TEXT, required: true },
    { key: "contactEmail", prompt: "Contact email", type: FormFieldType.EMAIL, required: true },
    { key: "state", prompt: "Where it works", type: FormFieldType.SINGLE_SELECT, required: true, optionsJson: ORGANIZATION_STATES },
  ],
}

// The Form model has no confirmed or approved status, so each confirmation and approval is its own submission.
const supportEventForm: StoredForm = {
  sourceKey: "acceleratedmedicine:support-event",
  title: "Supporter confirmations and organization approvals",
  purpose: FormPurpose.INTAKE,
  fields: [
    {
      key: "action",
      prompt: "Action",
      type: FormFieldType.SINGLE_SELECT,
      required: true,
      optionsJson: ["confirm-supporter", "approve-organization"],
    },
    { key: "submissionId", prompt: "The supporter or organization submission", type: FormFieldType.SHORT_TEXT, required: true },
  ],
}

export function storeSupporter(input: SupporterInput, submissionKey: string, clientKey: string) {
  return storeFormSubmission(
    supporterForm,
    { name: input.name, email: input.email, state: input.state, updates: input.updates },
    submissionKey,
    clientKey,
  )
}

export function storeOrganization(input: OrganizationInput, submissionKey: string, clientKey: string) {
  return storeFormSubmission(
    organizationForm,
    {
      organization: input.organization,
      website: input.website,
      logoUrl: input.logoUrl || "",
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      state: input.state,
    },
    submissionKey,
    clientKey,
  )
}

/**
 * Records a confirmation or approval. A second click finds the first record, because the key is the same.
 * The signed link already authorized the click, so each event gets its own client key and is never rate-limited.
 */
export function recordSupportEvent(action: SupportLinkAction, submissionId: string) {
  const key = `support-event/${action}/${submissionId}`
  return storeFormSubmission(
    supportEventForm,
    { action, submissionId },
    key,
    createHash("sha256").update(key).digest("hex"),
  )
}

type StoredValues = Record<string, unknown>

async function readSubmissions(sourceKey: string, ids?: string[]): Promise<Array<{ id: string; values: StoredValues }>> {
  const submissions = await prisma.formSubmission.findMany({
    where: {
      deletedAt: null,
      status: FormSubmissionStatus.SUBMITTED,
      formRevision: { form: { sourceKey } },
      ...(ids ? { id: { in: ids } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      responses: { where: { deletedAt: null }, select: { valueJson: true, field: { select: { key: true } } } },
    },
  })
  return submissions.map(submission => ({
    id: submission.id,
    values: Object.fromEntries(submission.responses.map(response => [response.field.key, response.valueJson])),
  }))
}

const text = (value: unknown) => (typeof value === "string" ? value : "")

export interface StoredSupporter {
  id: string
  name: string
  email: string
  state: string
  updates: boolean
}

export interface StoredOrganization {
  id: string
  organization: string
  website: string
  logoUrl: string
  contactName: string
  contactEmail: string
  state: string
}

const toSupporter = ({ id, values }: { id: string; values: StoredValues }): StoredSupporter => ({
  id,
  name: text(values.name),
  email: text(values.email),
  state: text(values.state),
  updates: values.updates === true,
})

const toOrganization = ({ id, values }: { id: string; values: StoredValues }): StoredOrganization => ({
  id,
  organization: text(values.organization),
  website: text(values.website),
  logoUrl: text(values.logoUrl),
  contactName: text(values.contactName),
  contactEmail: text(values.contactEmail),
  state: text(values.state),
})

export async function getSupporter(id: string): Promise<StoredSupporter | undefined> {
  const [found] = await readSubmissions(supporterForm.sourceKey, [id])
  return found && toSupporter(found)
}

export async function getOrganization(id: string): Promise<StoredOrganization | undefined> {
  const [found] = await readSubmissions(organizationForm.sourceKey, [id])
  return found && toOrganization(found)
}

/** The submission ids each action has been recorded for. */
async function readSupportEvents(): Promise<Record<SupportLinkAction, Set<string>>> {
  const events = { "confirm-supporter": new Set<string>(), "approve-organization": new Set<string>() }
  for (const { values } of await readSubmissions(supportEventForm.sourceKey)) {
    const action = text(values.action)
    if (action === "confirm-supporter" || action === "approve-organization") {
      events[action].add(text(values.submissionId))
    }
  }
  return events
}

export async function hasSupportEvent(action: SupportLinkAction, submissionId: string): Promise<boolean> {
  return (await readSupportEvents())[action].has(submissionId)
}

/** People who confirmed, counted once per email address, however many times they signed up. */
export function countConfirmedPeople(supporters: readonly StoredSupporter[], confirmedIds: ReadonlySet<string>): number {
  return new Set(supporters.filter(person => confirmedIds.has(person.id)).map(person => person.email.trim().toLowerCase())).size
}

export type ListedOrganization = Pick<StoredOrganization, "organization" | "website" | "logoUrl" | "state">

/** Approved organizations in name order, each listed once even if it endorsed twice. */
export function listApprovedOrganizations(
  organizations: readonly StoredOrganization[],
  approvedIds: ReadonlySet<string>,
): ListedOrganization[] {
  const byName = new Map<string, ListedOrganization>()
  for (const { id, organization, website, logoUrl, state } of organizations) {
    // A later approved endorsement replaces an earlier one, so a corrected website or logo wins.
    if (approvedIds.has(id)) byName.set(organization.trim().toLowerCase(), { organization, website, logoUrl, state })
  }
  return [...byName.values()].sort((a, b) => a.organization.localeCompare(b.organization, "en"))
}

export interface SupportSummary {
  confirmedPeople: number
  organizations: ListedOrganization[]
}

/**
 * What /supporters and the state pages show. A build without a database (CI) gets an empty summary. At run
 * time a failed read throws, so Next.js keeps serving the last good page instead of caching an empty one.
 */
export async function getSupportSummary(): Promise<SupportSummary> {
  if (!process.env.DATABASE_URL) return { confirmedPeople: 0, organizations: [] }
  try {
    const [events, supporters, organizations] = await Promise.all([
      readSupportEvents(),
      readSubmissions(supporterForm.sourceKey),
      readSubmissions(organizationForm.sourceKey),
    ])
    return {
      confirmedPeople: countConfirmedPeople(supporters.map(toSupporter), events["confirm-supporter"]),
      organizations: listApprovedOrganizations(organizations.map(toOrganization), events["approve-organization"]),
    }
  } catch (error) {
    console.error("Support summary is unavailable", error)
    if (process.env.NEXT_PHASE === "phase-production-build") return { confirmedPeople: 0, organizations: [] }
    throw error
  }
}
