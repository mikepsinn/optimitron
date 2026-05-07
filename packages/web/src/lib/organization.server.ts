import {
  OrgStatus,
  OrgType,
  TaskCategory,
  TaskClaimPolicy,
  TaskDifficulty,
  TaskStatus,
  type Prisma,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { issueOrgContextToken } from "@/lib/organization-context-token.server";
import { slugify } from "@/lib/slugify";
import { notifyTaskAssigneeOfAssignment } from "@/lib/tasks/task-assignment-notifications.server";

type DbClient = Prisma.TransactionClient | typeof prisma;

export const NONPROFIT_COALITION_STRATEGY_URL =
  "https://manual.warondisease.org/knowledge/strategy/nonprofit-coalition-strategy";

const WAR_ON_DISEASE_ORIGIN = "https://warondisease.org";
const ORGANIZATION_ACTIVATION_TASK_TITLE =
  "Share the Clinical Trial Abundance Survey with your members";

function getOrganizationActivationTaskKey(organizationId: string) {
  return `organization:${organizationId}:share-1-percent-treaty-survey`;
}

function buildOrganizationActivationTaskDescription(input: {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
}) {
  const organizationToolsUrl = `${WAR_ON_DISEASE_ORIGIN}/organizations/${input.organizationId}`;
  const surveyUrl = `${WAR_ON_DISEASE_ORIGIN}/survey/${input.organizationSlug}`;
  const legalUrl = `${WAR_ON_DISEASE_ORIGIN}/endorse#organization-legal-notes`;

  return `Your organization joined the International Campaign to End War and Disease by publicly supporting the 1% Treaty. Now use the reach your members already trust: place the Clinical Trial Abundance Survey link on your site and share it once with your list.

Why this task exists:
- Members get a simple way to review the treaty and record their response.
- Responses from your organization link are credited to ${input.organizationName}.
- This is a policy survey, not a candidate endorsement.

Do this:
1. Open your organization tools page: ${organizationToolsUrl}
2. Copy the member survey link, website button, or iframe.
3. Put one of them on your website or in a newsletter.
4. Ask members to review the treaty and record their response.

Done when:
- The survey is linked or embedded where members can find it.
- At least one email, newsletter item, or social post sends members to the survey.
- The organization URL stays intact so responses are credited to ${input.organizationName}.

Clinical Trial Abundance Survey URL:
${surveyUrl}

Why organizations should share this:
${NONPROFIT_COALITION_STRATEGY_URL}

Legal notes:
${legalUrl}`;
}

export async function ensureOrganizationTreatyActivationTask(
  input: {
    organizationId: string;
    organizationName?: string | null;
    organizationSlug?: string | null;
  },
  creatorUserId: string,
  db: DbClient = prisma,
) {
  const organization = await db.organization.findUnique({
    where: { id: input.organizationId },
    select: { name: true, slug: true },
  });

  if (!organization) {
    throw new Error("Organization not found");
  }

  const taskKey = getOrganizationActivationTaskKey(input.organizationId);
  const description = buildOrganizationActivationTaskDescription({
    organizationId: input.organizationId,
    organizationName: organization.name,
    organizationSlug: organization.slug,
  });
  const contextJson = {
    organizationId: input.organizationId,
    organizationName: organization.name,
    organizationToolsUrl: `${WAR_ON_DISEASE_ORIGIN}/organizations/${input.organizationId}`,
    surveyUrl: `${WAR_ON_DISEASE_ORIGIN}/survey/${organization.slug}`,
  } satisfies Prisma.InputJsonValue;

  const task = await db.task.upsert({
    where: { taskKey },
    update: {
      assigneeOrganizationId: input.organizationId,
      contextJson,
      deletedAt: null,
      description,
      status: TaskStatus.ACTIVE,
      title: ORGANIZATION_ACTIVATION_TASK_TITLE,
    },
    create: {
      assigneeOrganizationId: input.organizationId,
      category: TaskCategory.OUTREACH,
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      contextJson,
      createdByUserId: creatorUserId,
      description,
      difficulty: TaskDifficulty.BEGINNER,
      estimatedEffortHours: 1,
      interestTags: ["1% Treaty", "organization", "member survey"],
      isPublic: true,
      roleTitle: "Organization supporter",
      skillTags: ["email", "website", "member outreach"],
      status: TaskStatus.ACTIVE,
      taskKey,
      title: ORGANIZATION_ACTIVATION_TASK_TITLE,
    },
    select: { id: true, title: true },
  });

  if (db === prisma) {
    await notifyTaskAssigneeOfAssignment({
      senderUserId: creatorUserId,
      taskId: task.id,
    });
  }

  return task;
}

export function normalizeOrganizationHttpUrl(
  raw: string | null | undefined,
): string | null | false {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    parsed.hash = "";
    parsed.hostname = parsed.hostname.toLowerCase();
    return parsed.toString();
  } catch {
    return false;
  }
}

export function normalizeOrganizationImageUrl(raw: string | null | undefined) {
  return normalizeOrganizationHttpUrl(raw);
}

function assertValidOrganizationImageUrl(
  raw: string | null | undefined,
  label = "organization image URL",
): string | null {
  const normalized = normalizeOrganizationImageUrl(raw);
  if (normalized === false) {
    throw new Error(`Invalid ${label}`);
  }
  return normalized;
}

function assertValidOrganizationWebsiteUrl(
  raw: string | null | undefined,
): string | null {
  const normalized = normalizeOrganizationHttpUrl(raw);
  if (normalized === false) {
    throw new Error("Invalid organization website URL");
  }
  return normalized;
}

interface OrganizationDraftInput {
  contactEmail?: string | null;
  description?: string | null;
  donationUrl?: string | null;
  name: string;
  sourceRef?: string | null;
  sourceUrl?: string | null;
  squareLogoUrl?: string | null;
  type?: OrgType | null;
  website?: string | null;
  wordmarkLogoUrl?: string | null;
}

async function getAvailableSlug(
  db: DbClient,
  baseSlug: string,
  excludeId?: string,
) {
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await db.organization.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function findOrCreateOrganization(
  input: OrganizationDraftInput,
  db: DbClient = prisma,
) {
  const name = input.name.trim();
  const normalizedSquareLogo =
    input.squareLogoUrl === undefined
      ? undefined
      : assertValidOrganizationImageUrl(
          input.squareLogoUrl,
          "organization square logo URL",
        );
  const normalizedWordmarkLogo =
    input.wordmarkLogoUrl === undefined
      ? undefined
      : assertValidOrganizationImageUrl(
          input.wordmarkLogoUrl,
          "organization wordmark logo URL",
        );
  const normalizedWebsite =
    input.website === undefined
      ? undefined
      : assertValidOrganizationWebsiteUrl(input.website);
  const normalizedDonationUrl =
    input.donationUrl === undefined
      ? undefined
      : assertValidOrganizationWebsiteUrl(input.donationUrl);

  if (!name) {
    throw new Error("Organization name is required");
  }

  const normalizedSourceRef = input.sourceRef?.trim() || null;
  const desiredType = input.type ?? OrgType.OTHER;

  if (normalizedSourceRef) {
    const existingBySourceRef = await db.organization.findUnique({
      where: { sourceRef: normalizedSourceRef },
    });

    if (existingBySourceRef && existingBySourceRef.deletedAt == null) {
      const nextSlug = await getAvailableSlug(
        db,
        slugify(name),
        existingBySourceRef.id,
      );

      return db.organization.update({
        where: { id: existingBySourceRef.id },
        data: {
          contactEmail: input.contactEmail ?? existingBySourceRef.contactEmail,
          deletedAt: null,
          description: input.description ?? existingBySourceRef.description,
          donationUrl: normalizedDonationUrl ?? existingBySourceRef.donationUrl,
          name,
          slug: nextSlug,
          sourceRef: normalizedSourceRef,
          sourceUrl: input.sourceUrl ?? existingBySourceRef.sourceUrl,
          squareLogoUrl:
            normalizedSquareLogo ?? existingBySourceRef.squareLogoUrl,
          status: OrgStatus.APPROVED,
          type: desiredType,
          website: normalizedWebsite ?? existingBySourceRef.website,
          wordmarkLogoUrl:
            normalizedWordmarkLogo ?? existingBySourceRef.wordmarkLogoUrl,
        },
      });
    }
  }

  const existingByName = await db.organization.findFirst({
    where: {
      deletedAt: null,
      name,
    },
    orderBy: { createdAt: "asc" },
  });

  if (existingByName) {
    const nextSlug = await getAvailableSlug(
      db,
      slugify(name),
      existingByName.id,
    );

    return db.organization.update({
      where: { id: existingByName.id },
      data: {
        contactEmail: input.contactEmail ?? existingByName.contactEmail,
        deletedAt: null,
        description: input.description ?? existingByName.description,
        donationUrl: normalizedDonationUrl ?? existingByName.donationUrl,
        slug: nextSlug,
        sourceRef: normalizedSourceRef ?? existingByName.sourceRef,
        sourceUrl: input.sourceUrl ?? existingByName.sourceUrl,
        squareLogoUrl: normalizedSquareLogo ?? existingByName.squareLogoUrl,
        status: OrgStatus.APPROVED,
        type: input.type ?? existingByName.type,
        website: normalizedWebsite ?? existingByName.website,
        wordmarkLogoUrl:
          normalizedWordmarkLogo ?? existingByName.wordmarkLogoUrl,
      },
    });
  }

  const nextSlug = await getAvailableSlug(db, slugify(name));

  return db.organization.create({
    data: {
      contactEmail: input.contactEmail ?? null,
      description: input.description ?? null,
      donationUrl: normalizedDonationUrl ?? null,
      name,
      slug: nextSlug,
      sourceRef: normalizedSourceRef,
      sourceUrl: input.sourceUrl ?? null,
      squareLogoUrl: normalizedSquareLogo ?? null,
      status: OrgStatus.APPROVED,
      type: desiredType,
      website: normalizedWebsite ?? null,
      wordmarkLogoUrl: normalizedWordmarkLogo ?? null,
    },
  });
}

/**
 * Trusted/internal upsert path used by task imports and other non-public
 * ingestion flows. This path may create APPROVED org records because the
 * caller is responsible for provenance.
 */
export async function upsertTrustedOrganization(
  input: OrganizationDraftInput,
  db: DbClient = prisma,
) {
  return findOrCreateOrganization(input, db);
}

interface CreateOrganizationInput {
  name: string;
  slug?: string | null;
  type?: OrgType | null;
  status?: OrgStatus | null;
  website?: string | null;
  description?: string | null;
  donationUrl?: string | null;
  squareLogoUrl?: string | null;
  wordmarkLogoUrl?: string | null;
  contactEmail?: string | null;
  jurisdictionId?: string | null;
}

interface CreateOrganizationOptions {
  rejectDuplicates?: boolean;
}

/**
 * Public-facing creation path: creates an Organization and immediately inserts
 * an owner OrganizationMember row in the same transaction. New organizations
 * default to APPROVED so their survey/referral links work immediately.
 * Callers must pass an authenticated user id.
 */
export async function createOrganizationWithOwner(
  input: CreateOrganizationInput,
  creatorUserId: string,
  options: CreateOrganizationOptions = { rejectDuplicates: true },
) {
  const name = input.name.trim();
  const squareLogoUrl = assertValidOrganizationImageUrl(
    input.squareLogoUrl,
    "organization square logo URL",
  );
  const wordmarkLogoUrl = assertValidOrganizationImageUrl(
    input.wordmarkLogoUrl,
    "organization wordmark logo URL",
  );
  const donationUrl = assertValidOrganizationWebsiteUrl(input.donationUrl);
  const website = assertValidOrganizationWebsiteUrl(input.website);
  if (!name) {
    throw new Error("Organization name is required");
  }

  const baseSlug = slugify(input.slug?.trim() || name);
  if (!baseSlug) {
    throw new Error(
      "Organization slug is required or must be derivable from name",
    );
  }

  return prisma.$transaction(async (tx) => {
    let nextSlug = baseSlug;

    if (options.rejectDuplicates) {
      const existingByName = await tx.organization.findFirst({
        where: {
          deletedAt: null,
          name: { equals: name, mode: "insensitive" },
        },
        select: { name: true },
      });

      if (existingByName) {
        throw new Error(
          `Organization name already exists: ${existingByName.name}`,
        );
      }

      const existingBySlug = await tx.organization.findUnique({
        where: { slug: baseSlug },
        select: { slug: true },
      });

      if (existingBySlug) {
        throw new Error(
          `Organization slug already exists: ${existingBySlug.slug}`,
        );
      }
    } else {
      nextSlug = await getAvailableSlug(tx, baseSlug);
    }

    const organization = await tx.organization.create({
      data: {
        name,
        slug: nextSlug,
        type: input.type ?? OrgType.OTHER,
        status: input.status ?? OrgStatus.APPROVED,
        creatorId: creatorUserId,
        website,
        description: input.description ?? null,
        donationUrl,
        squareLogoUrl,
        wordmarkLogoUrl,
        contactEmail: input.contactEmail ?? null,
        jurisdictionId: input.jurisdictionId ?? null,
      },
    });

    await tx.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: creatorUserId,
        role: "owner",
      },
    });

    return organization;
  });
}

const MANAGE_ROLES = new Set(["owner", "admin"]);

export async function canManageOrganization(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId, userId },
    },
    select: { role: true },
  });

  if (membership && MANAGE_ROLES.has(membership.role)) {
    return true;
  }

  return false;
}

export async function getManageableOrganizationsForUser(userId: string) {
  const memberships = await prisma.organizationMember.findMany({
    where: {
      userId,
      role: { in: Array.from(MANAGE_ROLES) },
      organization: { deletedAt: null },
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return memberships.map((membership) => membership.organization);
}

export async function getApprovedOrganizationForSurveySlug(slug: string) {
  const organization = await prisma.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      deletedAt: true,
      squareLogoUrl: true,
      wordmarkLogoUrl: true,
      donationUrl: true,
      website: true,
      description: true,
    },
  });

  if (
    !organization ||
    organization.deletedAt ||
    organization.status !== OrgStatus.APPROVED
  ) {
    return null;
  }

  return organization;
}

export async function getApprovedOrganizationSurveyContext(slug: string) {
  const organization = await getApprovedOrganizationForSurveySlug(slug);
  if (!organization) return null;

  return {
    organization,
    orgContextToken: issueOrgContextToken(organization.id).encoded,
  };
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class LastOwnerError extends Error {
  constructor(
    message = "Cannot remove or demote the last owner of the organization",
  ) {
    super(message);
    this.name = "LastOwnerError";
  }
}

export type OrganizationMemberRole = "owner" | "admin" | "member" | "viewer";

const ORGANIZATION_MEMBER_ROLES: ReadonlySet<OrganizationMemberRole> = new Set([
  "owner",
  "admin",
  "member",
  "viewer",
]);

export function isOrganizationMemberRole(
  value: string,
): value is OrganizationMemberRole {
  return ORGANIZATION_MEMBER_ROLES.has(value as OrganizationMemberRole);
}

async function isOrgOwner(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    select: { role: true },
  });
  return membership?.role === "owner";
}

async function assertNotLastOwner(
  tx: Prisma.TransactionClient,
  organizationId: string,
  userIdBeingChanged: string,
) {
  const ownerCount = await tx.organizationMember.count({
    where: { organizationId, role: "owner" },
  });
  if (ownerCount <= 1) {
    const targetMembership = await tx.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: userIdBeingChanged },
      },
      select: { role: true },
    });
    if (targetMembership?.role === "owner") {
      throw new LastOwnerError();
    }
  }
}

interface UpdateOrganizationInput {
  name?: string;
  slug?: string | null;
  type?: OrgType;
  status?: OrgStatus;
  website?: string | null;
  description?: string | null;
  donationUrl?: string | null;
  squareLogoUrl?: string | null;
  wordmarkLogoUrl?: string | null;
  contactEmail?: string | null;
  jurisdictionId?: string | null;
}

interface UpdateOrganizationOptions {
  allowStatusChange?: boolean;
}

export async function updateOrganization(
  organizationId: string,
  callerUserId: string,
  patch: UpdateOrganizationInput,
  options: UpdateOrganizationOptions = {},
) {
  if (!(await canManageOrganization(callerUserId, organizationId))) {
    throw new ForbiddenError(
      "You do not have permission to manage this organization",
    );
  }

  if (
    !options.allowStatusChange &&
    (patch.status !== undefined || patch.jurisdictionId !== undefined)
  ) {
    throw new ForbiddenError(
      "Changing status or jurisdictionId requires platform-admin privileges",
    );
  }

  const existing = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true, slug: true, deletedAt: true },
  });
  if (!existing || existing.deletedAt) {
    throw new Error("Organization not found");
  }

  const data: Prisma.OrganizationUpdateInput = {};

  if (patch.name !== undefined) {
    const nextName = patch.name.trim();
    if (!nextName) throw new Error("Organization name cannot be empty");
    data.name = nextName;
  }

  if (patch.slug !== undefined) {
    const baseSource =
      patch.slug && patch.slug.trim()
        ? patch.slug.trim()
        : ((data.name as string | undefined) ?? existing.name);
    const nextSlug = await getAvailableSlug(
      prisma,
      slugify(baseSource),
      existing.id,
    );
    data.slug = nextSlug;
  }

  if (patch.type !== undefined) data.type = patch.type;
  if (patch.status !== undefined) data.status = patch.status;
  if (patch.website !== undefined) {
    data.website = assertValidOrganizationWebsiteUrl(patch.website);
  }
  if (patch.donationUrl !== undefined) {
    data.donationUrl = assertValidOrganizationWebsiteUrl(patch.donationUrl);
  }
  if (patch.description !== undefined) data.description = patch.description;
  if (patch.squareLogoUrl !== undefined) {
    data.squareLogoUrl = assertValidOrganizationImageUrl(
      patch.squareLogoUrl,
      "organization square logo URL",
    );
  }
  if (patch.wordmarkLogoUrl !== undefined) {
    data.wordmarkLogoUrl = assertValidOrganizationImageUrl(
      patch.wordmarkLogoUrl,
      "organization wordmark logo URL",
    );
  }
  if (patch.contactEmail !== undefined) data.contactEmail = patch.contactEmail;
  if (patch.jurisdictionId !== undefined) {
    data.jurisdiction = patch.jurisdictionId
      ? { connect: { id: patch.jurisdictionId } }
      : { disconnect: true };
  }

  return prisma.organization.update({
    where: { id: organizationId },
    data,
  });
}

export async function addOrganizationMember(
  organizationId: string,
  callerUserId: string,
  targetUserId: string,
  role: OrganizationMemberRole,
) {
  if (!isOrganizationMemberRole(role)) {
    throw new Error(`Invalid role: ${role}`);
  }
  if (!(await canManageOrganization(callerUserId, organizationId))) {
    throw new ForbiddenError(
      "You do not have permission to manage this organization",
    );
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });
  if (!targetUser) {
    throw new Error("Target user not found");
  }

  return prisma.$transaction(async (tx) => {
    return tx.organizationMember.upsert({
      where: {
        organizationId_userId: { organizationId, userId: targetUserId },
      },
      update: { role },
      create: { organizationId, userId: targetUserId, role },
    });
  });
}

export async function removeOrganizationMember(
  organizationId: string,
  callerUserId: string,
  targetUserId: string,
) {
  const isSelfRemoval = callerUserId === targetUserId;
  if (
    !isSelfRemoval &&
    !(await canManageOrganization(callerUserId, organizationId))
  ) {
    throw new ForbiddenError(
      "You do not have permission to manage this organization",
    );
  }

  await prisma.$transaction(async (tx) => {
    await assertNotLastOwner(tx, organizationId, targetUserId);
    await tx.organizationMember.delete({
      where: {
        organizationId_userId: { organizationId, userId: targetUserId },
      },
    });
  });
}

export async function updateOrganizationMemberRole(
  organizationId: string,
  callerUserId: string,
  targetUserId: string,
  role: OrganizationMemberRole,
) {
  if (!isOrganizationMemberRole(role)) {
    throw new Error(`Invalid role: ${role}`);
  }
  if (!(await canManageOrganization(callerUserId, organizationId))) {
    throw new ForbiddenError(
      "You do not have permission to manage this organization",
    );
  }

  return prisma.$transaction(async (tx) => {
    if (role !== "owner") {
      await assertNotLastOwner(tx, organizationId, targetUserId);
    }
    return tx.organizationMember.update({
      where: {
        organizationId_userId: { organizationId, userId: targetUserId },
      },
      data: { role },
    });
  });
}

export async function listOrganizationMembers(
  organizationId: string,
  callerUserId: string,
) {
  if (!(await canManageOrganization(callerUserId, organizationId))) {
    throw new ForbiddenError(
      "You do not have permission to view this organization's members",
    );
  }

  return prisma.organizationMember.findMany({
    where: { organizationId },
    select: {
      role: true,
      joinedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          person: { select: { displayName: true, handle: true } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });
}

export async function softDeleteOrganization(
  organizationId: string,
  callerUserId: string,
) {
  if (!(await isOrgOwner(callerUserId, organizationId))) {
    throw new ForbiddenError("Only an organization owner can delete it");
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: { deletedAt: new Date() },
  });
}
