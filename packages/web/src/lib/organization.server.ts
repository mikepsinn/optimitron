import { OrgStatus, OrgType, type Prisma } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
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
    const nextSlug = await getAvailableSlug(db, slugify(name), existingByName.id);

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
  type?: OrgType | null;
  website?: string | null;
  description?: string | null;
  logo?: string | null;
  contactEmail?: string | null;
  jurisdictionId?: string | null;
}

/**
 * Public-facing creation path: creates an Organization with status PENDING
 * and immediately inserts an owner OrganizationMember row in the same
 * transaction. Callers must pass an authenticated user id.
 */
export async function createOrganizationWithOwner(
  input: CreateOrganizationInput,
  creatorUserId: string,
) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Organization name is required");
  }

  return prisma.$transaction(async (tx) => {
    const nextSlug = await getAvailableSlug(tx, slugify(name));

    const organization = await tx.organization.create({
      data: {
        name,
        slug: nextSlug,
        type: input.type ?? OrgType.OTHER,
        status: OrgStatus.PENDING,
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
