import { createHash } from "node:crypto"

import { FormFieldType, FormPurpose, FormSubmissionStatus } from "@optimitron/db"

import { storeFormSubmission, type StoredForm } from "@/lib/form-submission-store"
import { prisma } from "@/lib/prisma"
import type { OrganizationInput, SupporterInput } from "@/lib/support"
import type { SupportLinkAction } from "@/lib/support-links"
import { COUNTRY_CODES, ORGANIZATION_STATES, OUTSIDE_US, SUPPORTER_STATES, US, fullName } from "@/lib/support-options"

const supporterForm: StoredForm = {
  sourceKey: "acceleratedmedicine:supporter",
  title: "Supporters of the Care-Integrated Clinical Trials Initiative",
  purpose: FormPurpose.INTAKE,
  fields: [
    { key: "firstName", prompt: "First name", type: FormFieldType.SHORT_TEXT, required: true },
    { key: "lastName", prompt: "Last name", type: FormFieldType.SHORT_TEXT, required: false },
    { key: "email", prompt: "Email", type: FormFieldType.EMAIL, required: true },
    { key: "countryCode", prompt: "Country", type: FormFieldType.SINGLE_SELECT, required: true, optionsJson: COUNTRY_CODES },
    // Required in the US only, so the field itself is optional.
    { key: "state", prompt: "State", type: FormFieldType.SINGLE_SELECT, required: false, optionsJson: SUPPORTER_STATES },
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
    { key: "contactFirstName", prompt: "Contact first name", type: FormFieldType.SHORT_TEXT, required: true },
    { key: "contactLastName", prompt: "Contact last name", type: FormFieldType.SHORT_TEXT, required: false },
    { key: "contactEmail", prompt: "Contact email", type: FormFieldType.EMAIL, required: true },
    { key: "countryCode", prompt: "Country", type: FormFieldType.SINGLE_SELECT, required: true, optionsJson: COUNTRY_CODES },
    { key: "state", prompt: "Where it works", type: FormFieldType.SINGLE_SELECT, required: false, optionsJson: ORGANIZATION_STATES },
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
    {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      countryCode: input.countryCode,
      state: input.state,
      updates: input.updates,
    },
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
      contactFirstName: input.contactFirstName,
      contactLastName: input.contactLastName,
      contactEmail: input.contactEmail,
      countryCode: input.countryCode,
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
  firstName: string
  lastName: string
  /** First and last name together. */
  name: string
  email: string
  /** ISO 3166-1 alpha-2, or "" for an early supporter who only said they live outside the US. */
  countryCode: string
  /** A US state, or "" outside the US. */
  state: string
  updates: boolean
}

export interface StoredOrganization {
  id: string
  organization: string
  website: string
  logoUrl: string
  contactFirstName: string
  contactLastName: string
  contactEmail: string
  countryCode: string
  /** A US state or "Nationwide", or "" outside the US. */
  state: string
}

/**
 * The country and state a submission gave. Submissions from before the forms asked for a country have only a
 * state: a US state (or "Nationwide"), or "Outside the United States".
 */
function readPlace(values: StoredValues): { countryCode: string; state: string } {
  const state = text(values.state)
  if (values.countryCode !== undefined) return { countryCode: text(values.countryCode), state }
  return state === OUTSIDE_US || !state ? { countryCode: "", state: "" } : { countryCode: US, state }
}

/** A stored supporter, including those who signed up with one name box before the first and last name boxes. */
export const toSupporter = ({ id, values }: { id: string; values: StoredValues }): StoredSupporter => {
  const firstName = text(values.firstName) || text(values.name)
  const lastName = text(values.lastName)
  return {
    id,
    firstName,
    lastName,
    name: fullName(firstName, lastName),
    email: text(values.email),
    ...readPlace(values),
    updates: values.updates === true,
  }
}

export const toOrganization = ({ id, values }: { id: string; values: StoredValues }): StoredOrganization => ({
  id,
  organization: text(values.organization),
  website: text(values.website),
  logoUrl: text(values.logoUrl),
  contactFirstName: text(values.contactFirstName) || text(values.contactName),
  contactLastName: text(values.contactLastName),
  contactEmail: text(values.contactEmail),
  ...readPlace(values),
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

export type ListedOrganization = Pick<StoredOrganization, "organization" | "website" | "logoUrl" | "countryCode" | "state">

/** Approved organizations in name order, each listed once even if it endorsed twice. */
export function listApprovedOrganizations(
  organizations: readonly StoredOrganization[],
  approvedIds: ReadonlySet<string>,
): ListedOrganization[] {
  const byName = new Map<string, ListedOrganization>()
  for (const { id, organization, website, logoUrl, countryCode, state } of organizations) {
    // A later approved endorsement replaces an earlier one, so a corrected website or logo wins.
    if (approvedIds.has(id)) byName.set(organization.trim().toLowerCase(), { organization, website, logoUrl, countryCode, state })
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
