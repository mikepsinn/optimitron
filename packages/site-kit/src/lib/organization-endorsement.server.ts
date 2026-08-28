import {
  ContentVisibility,
  OrganizationMemberRole,
  OrgStatus,
  OrgType,
} from "@optimitron/db"
import { prisma } from "./prisma"

/**
 * The organization helpers the campaign endorsement route needs.
 *
 * Optimitron's `organization.server` is 989 lines and reaches the task
 * notification, execution-lifecycle and email stacks — roughly 12,000 lines in
 * total. The endorsement route uses six of its functions and only one of them,
 * `ensureOrganizationTreatyActivationTask`, is on that heavy path. These are
 * the other five, copied faithfully.
 *
 * Two deliberate omissions, both Optimitron governance-OS behaviour rather
 * than anything the endorsing reader sees:
 *
 * - No treaty activation task. The organization's position is still recorded,
 *   which is the action the reader took; the internal follow-up task and its
 *   assignee email are skipped. Precedent: `/api/votes/sync` already diverges
 *   from Optimitron's vote route the same way.
 * - No "Optimize <org>" execution planning branch. Optimitron creates one on
 *   org creation, already inside a try/catch that tolerates an unseeded
 *   database, so its absence is a supported state rather than a broken one.
 *
 * Both apps write to the same database, so anything that affects stored shape
 * — above all slug generation — matches Optimitron exactly.
 */

/**
 * Optimitron's `slugify`, copied rather than swapped for site-kit's
 * `generateSlug`. The two disagree: this maps `&` to "and" and collapses every
 * other non-alphanumeric run to a hyphen, while `generateSlug` strips `&`
 * outright. "Doctors & Nurses" becomes `doctors-and-nurses` here and
 * `doctors-nurses` there. Both apps create organizations in one shared
 * database, so they have to agree on the slug or the same name yields two
 * different rows depending on which domain the user happened to be on.
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function normalizeOrganizationHttpUrl(
  raw: string | null | undefined,
): string | null | false {
  const trimmed = raw?.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false
    }
    parsed.hash = ""
    parsed.hostname = parsed.hostname.toLowerCase()
    return parsed.toString()
  } catch {
    return false
  }
}

export function normalizeOrganizationImageUrl(raw: string | null | undefined) {
  return normalizeOrganizationHttpUrl(raw)
}

function assertValidOrganizationImageUrl(
  raw: string | null | undefined,
  label = "organization image URL",
): string | null {
  const normalized = normalizeOrganizationImageUrl(raw)
  if (normalized === false) {
    throw new Error(`Invalid ${label}`)
  }
  return normalized
}

function assertValidOrganizationWebsiteUrl(
  raw: string | null | undefined,
): string | null {
  const normalized = normalizeOrganizationHttpUrl(raw)
  if (normalized === false) {
    throw new Error("Invalid organization website URL")
  }
  return normalized
}

export interface CreateOrganizationInput {
  contactEmail?: string | null
  description?: string | null
  donationUrl?: string | null
  jurisdictionId?: string | null
  name: string
  slug?: string | null
  squareLogoUrl?: string | null
  status?: OrgStatus | null
  type?: OrgType | null
  visibility?: ContentVisibility | null
  website?: string | null
  wordmarkLogoUrl?: string | null
}

export interface CreateOrganizationOptions {
  rejectDuplicates?: boolean
}

type SlugLookup = {
  organization: { findUnique: typeof prisma.organization.findUnique }
}

async function getAvailableSlug(db: SlugLookup, baseSlug: string) {
  let slug = baseSlug
  let suffix = 2

  while (true) {
    const existing = await db.organization.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!existing) return slug

    slug = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

/**
 * Creates an Organization and immediately makes the creator its OWNER.
 *
 * The ownership row is the point: without it nobody can manage the
 * organization afterwards. site-kit's existing `createOrganizationLogic` does
 * not insert one — it is the survey partner-signup path, which also hardcodes
 * RESEARCH_CENTER and sends a welcome email — so it is not a substitute here.
 */
export async function createOrganizationWithOwner(
  input: CreateOrganizationInput,
  creatorUserId: string,
  options: CreateOrganizationOptions = { rejectDuplicates: true },
) {
  const name = input.name.trim()
  const squareLogoUrl = assertValidOrganizationImageUrl(
    input.squareLogoUrl,
    "organization square logo URL",
  )
  const wordmarkLogoUrl = assertValidOrganizationImageUrl(
    input.wordmarkLogoUrl,
    "organization wordmark logo URL",
  )
  const donationUrl = assertValidOrganizationWebsiteUrl(input.donationUrl)
  const website = assertValidOrganizationWebsiteUrl(input.website)
  if (!name) {
    throw new Error("Organization name is required")
  }

  const baseSlug = slugify(input.slug?.trim() || name)
  if (!baseSlug) {
    throw new Error(
      "Organization slug is required or must be derivable from name",
    )
  }

  return prisma.$transaction(async (tx) => {
    let nextSlug = baseSlug

    if (options.rejectDuplicates) {
      const existingByName = await tx.organization.findFirst({
        where: {
          deletedAt: null,
          name: { equals: name, mode: "insensitive" },
        },
        select: { name: true },
      })

      if (existingByName) {
        throw new Error(
          `Organization name already exists: ${existingByName.name}`,
        )
      }

      const existingBySlug = await tx.organization.findUnique({
        where: { slug: baseSlug },
        select: { slug: true },
      })

      if (existingBySlug) {
        throw new Error(
          `Organization slug already exists: ${existingBySlug.slug}`,
        )
      }
    } else {
      nextSlug = await getAvailableSlug(tx, baseSlug)
    }

    const organization = await tx.organization.create({
      data: {
        contactEmail: input.contactEmail ?? null,
        creatorId: creatorUserId,
        description: input.description ?? null,
        donationUrl,
        jurisdictionId: input.jurisdictionId ?? null,
        name,
        slug: nextSlug,
        squareLogoUrl,
        status: input.status ?? OrgStatus.APPROVED,
        type: input.type ?? OrgType.OTHER,
        visibility: input.visibility ?? ContentVisibility.PUBLIC,
        website,
        wordmarkLogoUrl,
      },
    })

    await tx.organizationMember.create({
      data: {
        organizationId: organization.id,
        role: OrganizationMemberRole.OWNER,
        userId: creatorUserId,
      },
    })

    return organization
  })
}

const MANAGE_ROLES = new Set<OrganizationMemberRole>([
  OrganizationMemberRole.OWNER,
  OrganizationMemberRole.ADMIN,
])

export async function canManageOrganization(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const membership = await prisma.organizationMember.findFirst({
    where: {
      organization: { deletedAt: null },
      organizationId,
      userId,
    },
    select: { role: true },
  })

  return Boolean(membership && MANAGE_ROLES.has(membership.role))
}

export async function assertOrganizationCanBePubliclyReferenced(
  organizationId: string,
) {
  const organization = await prisma.organization.findFirst({
    where: {
      deletedAt: null,
      id: organizationId.trim(),
      status: OrgStatus.APPROVED,
      visibility: ContentVisibility.PUBLIC,
    },
    select: { id: true },
  })
  if (!organization) {
    throw new Error(
      "Public tasks cannot reference a private or unpublished organization.",
    )
  }
}
