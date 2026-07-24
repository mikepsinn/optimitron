import {
  buildOrganizationActivationTaskDescription,
  getOrganizationActivationTaskKey,
  GLOBAL_SURVEY_NAME,
  ORGANIZATION_ACTIVATION_TASK_TITLE,
} from "@optimitron/data/campaign";
import {
  ContentVisibility,
  OrgStatus,
  OrgType,
  OrganizationMemberRole as DbOrganizationMemberRole,
  TaskCategory,
  TaskClaimPolicy,
  TaskStatus,
  type Prisma,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { NONPROFIT_COALITION_STRATEGY_URL } from "@/lib/routes";
import { slugify } from "@/lib/slugify";
import { notifyTaskAssigneeOfAssignment } from "@/lib/tasks/task-assignment-notifications.server";
import {
  ensureExecutionPlanningBranch,
  MissingOptimizeEarthRootError,
} from "@/lib/tasks/planning-branch.server";
import { getBaseUrl } from "@/lib/url";

type DbClient = Pick<
  Prisma.TransactionClient,
  "organization" | "organizationMember" | "task"
>;

export async function ensureOrganizationTreatyActivationTask(
  input: {
    organizationId: string;
    organizationName?: string | null;
    organizationSlug?: string | null;
  },
  creatorUserId: string,
  db: DbClient = prisma,
) {
  await assertOrganizationCanBePubliclyReferenced(input.organizationId, db);

  const organization = await db.organization.findUnique({
    where: { id: input.organizationId },
    select: { name: true, slug: true },
  });

  if (!organization) {
    throw new Error("Organization not found");
  }

  const taskKey = getOrganizationActivationTaskKey(input.organizationId);
  const baseUrl = getBaseUrl().replace(/\/+$/, "");
  const organizationToolsUrl = `${baseUrl}/organizations/${input.organizationId}`;
  const surveyUrl = `${baseUrl}/survey/${organization.slug}`;
  const description = buildOrganizationActivationTaskDescription({
    baseUrl,
    coalitionStrategyUrl: NONPROFIT_COALITION_STRATEGY_URL,
    legalUrl: `${baseUrl}/join#organization-legal-notes`,
    organizationName: organization.name,
    organizationToolsUrl,
    surveyUrl,
  });
  const contextJson = {
    organizationId: input.organizationId,
    organizationName: organization.name,
    organizationToolsUrl,
    surveyUrl,
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
  visibility?: ContentVisibility | null;
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
          ...(input.visibility == null ? {} : { visibility: input.visibility }),
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
        ...(input.visibility == null ? {} : { visibility: input.visibility }),
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
      visibility: input.visibility ?? ContentVisibility.PUBLIC,
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
  visibility?: ContentVisibility | null;
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
        visibility: input.visibility ?? ContentVisibility.PUBLIC,
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
        role: DbOrganizationMemberRole.OWNER,
      },
    });

    // Every organization lands with its "Optimize <org>" planning root ready
    // instead of waiting for a member's first scoped getMe. Runs after the
    // owner-membership insert because the ensure re-checks membership.
    try {
      await ensureExecutionPlanningBranch({
        organizationId: organization.id,
        prisma: tx,
        userId: creatorUserId,
      });
    } catch (error) {
      // An unseeded database (no optimize-earth root yet) must not block org
      // creation — the lazy ensure path creates the branch once seeded.
      if (!(error instanceof MissingOptimizeEarthRootError)) throw error;
    }

    return organization;
  });
}

const MANAGE_ROLES = new Set<DbOrganizationMemberRole>([
  DbOrganizationMemberRole.OWNER,
  DbOrganizationMemberRole.ADMIN,
]);

const CONTRIBUTE_ROLES = [
  DbOrganizationMemberRole.OWNER,
  DbOrganizationMemberRole.ADMIN,
  DbOrganizationMemberRole.MEMBER,
] as const;

export async function canManageOrganization(
  userId: string,
  organizationId: string,
  db: Pick<DbClient, "organizationMember"> = prisma,
): Promise<boolean> {
  const membership = await db.organizationMember.findFirst({
    where: {
      organizationId,
      userId,
      organization: { deletedAt: null },
    },
    select: { role: true },
  });

  if (membership && MANAGE_ROLES.has(membership.role)) {
    return true;
  }

  return false;
}

export async function canContributeToOrganization(
  userId: string,
  organizationId: string,
  db: Pick<DbClient, "organizationMember"> = prisma,
): Promise<boolean> {
  const membership = await db.organizationMember.findFirst({
    where: {
      organization: { deletedAt: null },
      organizationId,
      role: { in: [...CONTRIBUTE_ROLES] },
      userId,
    },
    select: { id: true },
  });
  return membership != null;
}

export async function canUserViewOrganization(
  organizationId: string,
  userId?: string | null,
  db: Pick<DbClient, "organization"> = prisma,
): Promise<boolean> {
  const organization = await db.organization.findFirst({
    where: {
      id: organizationId.trim(),
      ...getOrganizationAccessWhere(userId),
    },
    select: { id: true },
  });
  return organization != null;
}

/**
 * Public approved organizations plus the viewer's organizations. OAuth callers
 * pass their organization allowlist so membership alone cannot widen a token.
 */
export function getOrganizationAccessWhere(
  userId?: string | null,
  allowedOrganizationIds: readonly string[] | null = null,
): Prisma.OrganizationWhereInput {
  const normalizedUserId = userId?.trim() || null;
  const normalizedOrganizationIds =
    allowedOrganizationIds === null
      ? null
      : [
          ...new Set(
            allowedOrganizationIds.map((id) => id.trim()).filter(Boolean),
          ),
        ];
  const canAccessPrivateOrganizations =
    normalizedUserId &&
    (normalizedOrganizationIds === null ||
      normalizedOrganizationIds.length > 0);

  return {
    deletedAt: null,
    OR: [
      {
        status: OrgStatus.APPROVED,
        visibility: ContentVisibility.PUBLIC,
      },
      ...(canAccessPrivateOrganizations
        ? [
            {
              ...(normalizedOrganizationIds === null
                ? {}
                : { id: { in: normalizedOrganizationIds } }),
              OR: [
                { creatorId: normalizedUserId },
                { members: { some: { userId: normalizedUserId } } },
              ],
            },
          ]
        : []),
    ],
  };
}

export async function assertOrganizationCanBePubliclyReferenced(
  organizationId: string,
  db: Pick<DbClient, "organization"> = prisma,
) {
  const organization = await db.organization.findFirst({
    where: {
      deletedAt: null,
      id: organizationId.trim(),
      status: OrgStatus.APPROVED,
      visibility: ContentVisibility.PUBLIC,
    },
    select: { id: true },
  });
  if (!organization) {
    throw new Error(
      "Public tasks cannot reference a private or unpublished organization.",
    );
  }
}

export const PRIVATE_ORGANIZATION_PUBLIC_TASK_ERROR =
  "An organization with public tasks cannot be made private.";

export async function assertOrganizationCanBePrivate(
  organizationId: string,
  db: Pick<DbClient, "task"> = prisma,
) {
  const publicTask = await db.task.findFirst({
    where: {
      deletedAt: null,
      isPublic: true,
      OR: [
        { assigneeOrganizationId: organizationId.trim() },
        { ownerOrganizationId: organizationId.trim() },
      ],
    },
    select: { id: true },
  });
  if (publicTask) {
    throw new Error(PRIVATE_ORGANIZATION_PUBLIC_TASK_ERROR);
  }
}

export async function getManageableOrganizationsForUser(
  userId: string,
  options: { publiclyReferenceableOnly?: boolean } = {},
) {
  const memberships = await prisma.organizationMember.findMany({
    where: {
      userId,
      role: { in: Array.from(MANAGE_ROLES) },
      organization: {
        deletedAt: null,
        ...(options.publiclyReferenceableOnly
          ? {
              status: OrgStatus.APPROVED,
              visibility: ContentVisibility.PUBLIC,
            }
          : {}),
      },
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
      visibility: true,
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
    organization.status !== OrgStatus.APPROVED ||
    organization.visibility !== ContentVisibility.PUBLIC
  ) {
    return null;
  }

  return organization;
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

const ORGANIZATION_MEMBER_ROLE_TO_DB = {
  owner: DbOrganizationMemberRole.OWNER,
  admin: DbOrganizationMemberRole.ADMIN,
  member: DbOrganizationMemberRole.MEMBER,
  viewer: DbOrganizationMemberRole.VIEWER,
} as const satisfies Record<OrganizationMemberRole, DbOrganizationMemberRole>;

const ORGANIZATION_MEMBER_ROLES = new Set<OrganizationMemberRole>(
  Object.keys(ORGANIZATION_MEMBER_ROLE_TO_DB) as OrganizationMemberRole[],
);

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
  return membership?.role === DbOrganizationMemberRole.OWNER;
}

async function assertNotLastOwner(
  tx: Prisma.TransactionClient,
  organizationId: string,
  userIdBeingChanged: string,
) {
  const ownerCount = await tx.organizationMember.count({
    where: { organizationId, role: DbOrganizationMemberRole.OWNER },
  });
  if (ownerCount <= 1) {
    const targetMembership = await tx.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: userIdBeingChanged },
      },
      select: { role: true },
    });
    if (targetMembership?.role === DbOrganizationMemberRole.OWNER) {
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
  visibility?: ContentVisibility;
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
  if (patch.visibility !== undefined) {
    if (patch.visibility === ContentVisibility.PRIVATE) {
      await assertOrganizationCanBePrivate(organizationId);
    }
    data.visibility = patch.visibility;
  }
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
      update: { role: ORGANIZATION_MEMBER_ROLE_TO_DB[role] },
      create: {
        organizationId,
        userId: targetUserId,
        role: ORGANIZATION_MEMBER_ROLE_TO_DB[role],
      },
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
      data: { role: ORGANIZATION_MEMBER_ROLE_TO_DB[role] },
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
