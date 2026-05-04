import { OrgStatus, OrgType, type Prisma } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { issueOrgContextToken } from "@/lib/organization-context-token.server";
import { slugify } from "@/lib/slugify";

type DbClient = Prisma.TransactionClient | typeof prisma;

interface OrganizationDraftInput {
  contactEmail?: string | null;
  description?: string | null;
  logo?: string | null;
  name: string;
  sourceRef?: string | null;
  sourceUrl?: string | null;
  type?: OrgType | null;
  website?: string | null;
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
          logo: input.logo ?? existingBySourceRef.logo,
          name,
          slug: nextSlug,
          sourceRef: normalizedSourceRef,
          sourceUrl: input.sourceUrl ?? existingBySourceRef.sourceUrl,
          status: OrgStatus.APPROVED,
          type: desiredType,
          website: input.website ?? existingBySourceRef.website,
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
        logo: input.logo ?? existingByName.logo,
        slug: nextSlug,
        sourceRef: normalizedSourceRef ?? existingByName.sourceRef,
        sourceUrl: input.sourceUrl ?? existingByName.sourceUrl,
        status: OrgStatus.APPROVED,
        type: input.type ?? existingByName.type,
        website: input.website ?? existingByName.website,
      },
    });
  }

  const nextSlug = await getAvailableSlug(db, slugify(name));

  return db.organization.create({
    data: {
      contactEmail: input.contactEmail ?? null,
      description: input.description ?? null,
      logo: input.logo ?? null,
      name,
      slug: nextSlug,
      sourceRef: normalizedSourceRef,
      sourceUrl: input.sourceUrl ?? null,
      status: OrgStatus.APPROVED,
      type: desiredType,
      website: input.website ?? null,
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
  logo?: string | null;
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
  options: CreateOrganizationOptions = {},
) {
  const name = input.name.trim();
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
        website: input.website ?? null,
        description: input.description ?? null,
        logo: input.logo ?? null,
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

/**
 * Returns true if the user can manage the given organization. Lazily backfills
 * an "owner" membership row when the user is the org's creator but has no
 * membership row yet — this keeps legacy orgs first-class without requiring a
 * data migration.
 */
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

  if (membership) {
    return false;
  }

  // No membership row — check creator fallback and backfill if applicable.
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { creatorId: true },
  });

  if (!org || org.creatorId !== userId) {
    return false;
  }

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: { organizationId, userId },
    },
    update: {},
    create: {
      organizationId,
      userId,
      role: "owner",
    },
  });

  return true;
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
      logo: true,
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
  logo?: string | null;
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
  if (patch.website !== undefined) data.website = patch.website;
  if (patch.description !== undefined) data.description = patch.description;
  if (patch.logo !== undefined) data.logo = patch.logo;
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
