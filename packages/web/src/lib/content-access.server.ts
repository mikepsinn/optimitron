import type { Prisma } from "@optimitron/db";
import {
  ActivityType,
  ContentAccessLevel,
  ContentVisibility,
} from "@optimitron/db/enums";
import { prisma } from "@/lib/prisma";

export const CONTENT_NOT_FOUND_MESSAGE = "Content not found";

const ACCESS_RANK: Record<ContentAccessLevel, number> = {
  [ContentAccessLevel.VIEW]: 1,
  [ContentAccessLevel.COMMENT]: 2,
  [ContentAccessLevel.EDIT_CONTENT]: 3,
  [ContentAccessLevel.EDIT]: 4,
  [ContentAccessLevel.FULL_ACCESS]: 5,
};

const MANAGE_ORGANIZATION_ROLES = new Set(["owner", "admin"]);
const MAX_DOCUMENT_ANCESTORS = 64;

export type ContentResource =
  | { type: "document"; id: string }
  | { type: "collection"; id: string };

export type ContentGrantee =
  | { type: "user"; id: string }
  | { type: "organization"; id: string };

export type ContentGranteeReference =
  | { type: "user"; email?: string; id?: string }
  | { type: "organization"; id: string };

export async function lockContentResources(
  tx: Prisma.TransactionClient,
  resources: ContentResource[],
): Promise<void> {
  const keys = [
    ...new Set(
      resources.map(
        (resource) => `${resource.type}:${normalizeId(resource.id)}`,
      ),
    ),
  ].sort();
  for (const key of keys) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('content-resource'), hashtext(${key}))`;
  }
}

interface ViewerMemberships {
  organizationIds: Set<string>;
  managedOrganizationIds: Set<string>;
}

type ContentAccessClient = Pick<
  Prisma.TransactionClient,
  | "collection"
  | "collectionRecord"
  | "document"
  | "organization"
  | "organizationMember"
  | "user"
>;

function normalizeId(value: string): string {
  return typeof value === "string" ? value.trim() : "";
}

export function hasContentAccess(
  actual: ContentAccessLevel | null,
  required: ContentAccessLevel,
): boolean {
  return actual != null && ACCESS_RANK[actual] >= ACCESS_RANK[required];
}

function strongestAccess(
  left: ContentAccessLevel | null,
  right: ContentAccessLevel | null,
): ContentAccessLevel | null {
  if (!left) return right;
  if (!right) return left;
  return ACCESS_RANK[left] >= ACCESS_RANK[right] ? left : right;
}

async function loadViewerMemberships(
  userId: string | null,
  client: ContentAccessClient,
): Promise<ViewerMemberships> {
  if (!userId) {
    return {
      organizationIds: new Set(),
      managedOrganizationIds: new Set(),
    };
  }

  const memberships = await client.organizationMember.findMany({
    where: { userId, organization: { deletedAt: null } },
    select: { organizationId: true, role: true },
  });

  return {
    organizationIds: new Set(memberships.map((row) => row.organizationId)),
    managedOrganizationIds: new Set(
      memberships
        .filter((row) => MANAGE_ORGANIZATION_ROLES.has(row.role))
        .map((row) => row.organizationId),
    ),
  };
}

function accessFromResource(input: {
  createdByUserId: string;
  grants: Array<{
    accessLevel: ContentAccessLevel;
    organizationId: string | null;
    userId: string | null;
  }>;
  organizationId: string | null;
  userId: string | null;
  viewerMemberships: ViewerMemberships;
  visibility: ContentVisibility;
}): ContentAccessLevel | null {
  let access: ContentAccessLevel | null =
    input.visibility === ContentVisibility.PUBLIC
      ? ContentAccessLevel.VIEW
      : null;

  if (!input.userId) return access;
  if (!input.organizationId && input.createdByUserId === input.userId) {
    access = ContentAccessLevel.FULL_ACCESS;
  }
  if (
    input.organizationId &&
    input.viewerMemberships.managedOrganizationIds.has(input.organizationId)
  ) {
    access = ContentAccessLevel.FULL_ACCESS;
  }

  for (const grant of input.grants) {
    const appliesToUser = grant.userId === input.userId;
    const appliesToOrganization =
      grant.organizationId != null &&
      input.viewerMemberships.organizationIds.has(grant.organizationId);
    if (appliesToUser || appliesToOrganization) {
      access = strongestAccess(access, grant.accessLevel);
    }
  }

  return access;
}

export async function resolveDocumentAccess(
  documentId: string,
  userId?: string | null,
  client: ContentAccessClient = prisma,
): Promise<ContentAccessLevel | null> {
  let currentId = normalizeId(documentId);
  if (!currentId) return null;

  const normalizedUserId = userId?.trim() || null;
  const memberships = await loadViewerMemberships(normalizedUserId, client);
  const seen = new Set<string>();
  let access: ContentAccessLevel | null = null;
  let blocksPublicInheritance = false;

  for (let depth = 0; currentId && depth < MAX_DOCUMENT_ANCESTORS; depth += 1) {
    if (seen.has(currentId)) return null;
    seen.add(currentId);

    const document = await client.document.findFirst({
      where: { id: currentId, deletedAt: null },
      select: {
        createdByUserId: true,
        organizationId: true,
        parentDocumentId: true,
        task: { select: { isPublic: true } },
        visibility: true,
        accessGrants: {
          where: { deletedAt: null },
          select: {
            accessLevel: true,
            organizationId: true,
            userId: true,
          },
        },
      },
    });
    if (!document) return null;

    blocksPublicInheritance ||= document.task?.isPublic === false;
    access = strongestAccess(
      access,
      accessFromResource({
        createdByUserId: document.createdByUserId,
        grants: document.accessGrants,
        organizationId: document.organizationId,
        visibility: blocksPublicInheritance
          ? ContentVisibility.PRIVATE
          : document.visibility,
        userId: normalizedUserId,
        viewerMemberships: memberships,
      }),
    );
    currentId = document.parentDocumentId ?? "";
  }

  if (currentId) return null;
  return access;
}

export async function resolveDocumentAccessBatch(
  documentIds: readonly string[],
  userId?: string | null,
  client: ContentAccessClient = prisma,
): Promise<Map<string, ContentAccessLevel | null>> {
  const normalizedIds = [
    ...new Set(documentIds.map(normalizeId).filter(Boolean)),
  ];
  const results = new Map<string, ContentAccessLevel | null>(
    normalizedIds.map((id) => [id, null]),
  );
  if (normalizedIds.length === 0) return results;

  const normalizedUserId = userId?.trim() || null;
  const memberships = await loadViewerMemberships(normalizedUserId, client);
  const states = new Map(
    normalizedIds.map((id) => [
      id,
      {
        access: null as ContentAccessLevel | null,
        currentId: id,
        blocksPublicInheritance: false,
        invalid: false,
        seen: new Set<string>(),
      },
    ]),
  );

  for (let depth = 0; depth < MAX_DOCUMENT_ANCESTORS; depth += 1) {
    const pendingIds = [
      ...new Set(
        [...states.values()]
          .filter((state) => state.currentId && !state.invalid)
          .map((state) => state.currentId),
      ),
    ];
    if (pendingIds.length === 0) break;

    const rows = await client.document.findMany({
      where: { id: { in: pendingIds }, deletedAt: null },
      select: {
        id: true,
        createdByUserId: true,
        organizationId: true,
        parentDocumentId: true,
        task: { select: { isPublic: true } },
        visibility: true,
        accessGrants: {
          where: { deletedAt: null },
          select: {
            accessLevel: true,
            organizationId: true,
            userId: true,
          },
        },
      },
    });
    const rowsById = new Map(rows.map((row) => [row.id, row]));

    for (const state of states.values()) {
      if (!state.currentId || state.invalid) continue;
      if (state.seen.has(state.currentId)) {
        state.invalid = true;
        continue;
      }
      state.seen.add(state.currentId);

      const document = rowsById.get(state.currentId);
      if (!document) {
        state.invalid = true;
        continue;
      }
      state.blocksPublicInheritance ||= document.task?.isPublic === false;
      state.access = strongestAccess(
        state.access,
        accessFromResource({
          createdByUserId: document.createdByUserId,
          grants: document.accessGrants,
          organizationId: document.organizationId,
          visibility: state.blocksPublicInheritance
            ? ContentVisibility.PRIVATE
            : document.visibility,
          userId: normalizedUserId,
          viewerMemberships: memberships,
        }),
      );
      state.currentId = document.parentDocumentId ?? "";
    }
  }

  for (const [id, state] of states) {
    results.set(id, state.invalid || state.currentId ? null : state.access);
  }
  return results;
}

export async function resolveCollectionAccess(
  collectionId: string,
  userId?: string | null,
  client: ContentAccessClient = prisma,
): Promise<ContentAccessLevel | null> {
  const normalizedCollectionId = normalizeId(collectionId);
  if (!normalizedCollectionId) return null;

  const normalizedUserId = userId?.trim() || null;
  const [collection, memberships] = await Promise.all([
    client.collection.findFirst({
      where: { id: normalizedCollectionId, deletedAt: null },
      select: {
        createdByUserId: true,
        organizationId: true,
        visibility: true,
        accessGrants: {
          where: { deletedAt: null },
          select: {
            accessLevel: true,
            organizationId: true,
            userId: true,
          },
        },
      },
    }),
    loadViewerMemberships(normalizedUserId, client),
  ]);
  if (!collection) return null;

  return accessFromResource({
    createdByUserId: collection.createdByUserId,
    grants: collection.accessGrants,
    organizationId: collection.organizationId,
    visibility: collection.visibility,
    userId: normalizedUserId,
    viewerMemberships: memberships,
  });
}

export async function resolveCollectionAccessBatch(
  collectionIds: readonly string[],
  userId?: string | null,
  client: ContentAccessClient = prisma,
): Promise<Map<string, ContentAccessLevel | null>> {
  const normalizedIds = [
    ...new Set(collectionIds.map(normalizeId).filter(Boolean)),
  ];
  const results = new Map<string, ContentAccessLevel | null>(
    normalizedIds.map((id) => [id, null]),
  );
  if (normalizedIds.length === 0) return results;

  const normalizedUserId = userId?.trim() || null;
  const [collections, memberships] = await Promise.all([
    client.collection.findMany({
      where: { id: { in: normalizedIds }, deletedAt: null },
      select: {
        id: true,
        createdByUserId: true,
        organizationId: true,
        visibility: true,
        accessGrants: {
          where: { deletedAt: null },
          select: {
            accessLevel: true,
            organizationId: true,
            userId: true,
          },
        },
      },
    }),
    loadViewerMemberships(normalizedUserId, client),
  ]);

  for (const collection of collections) {
    results.set(
      collection.id,
      accessFromResource({
        createdByUserId: collection.createdByUserId,
        grants: collection.accessGrants,
        organizationId: collection.organizationId,
        visibility: collection.visibility,
        userId: normalizedUserId,
        viewerMemberships: memberships,
      }),
    );
  }
  return results;
}

export async function assertDocumentAccess(
  documentId: string,
  userId: string | null | undefined,
  required: ContentAccessLevel,
  client: ContentAccessClient = prisma,
): Promise<ContentAccessLevel> {
  const access = await resolveDocumentAccess(documentId, userId, client);
  if (!hasContentAccess(access, required)) {
    throw new Error(CONTENT_NOT_FOUND_MESSAGE);
  }
  return access as ContentAccessLevel;
}

export async function assertCollectionAccess(
  collectionId: string,
  userId: string | null | undefined,
  required: ContentAccessLevel,
  client: ContentAccessClient = prisma,
): Promise<ContentAccessLevel> {
  const access = await resolveCollectionAccess(collectionId, userId, client);
  if (!hasContentAccess(access, required)) {
    throw new Error(CONTENT_NOT_FOUND_MESSAGE);
  }
  return access as ContentAccessLevel;
}

export async function assertCollectionRecordAccess(
  recordId: string,
  userId: string | null | undefined,
  required: ContentAccessLevel,
  client: ContentAccessClient = prisma,
): Promise<{ collectionId: string }> {
  const record = await client.collectionRecord.findFirst({
    where: { id: normalizeId(recordId), deletedAt: null },
    select: { collectionId: true },
  });
  if (!record) throw new Error(CONTENT_NOT_FOUND_MESSAGE);
  await assertCollectionAccess(record.collectionId, userId, required, client);
  return record;
}

export async function assertValidDocumentParent(
  input: {
    documentId: string;
    parentDocumentId: string | null;
  },
  client: ContentAccessClient = prisma,
): Promise<void> {
  if (!input.parentDocumentId) return;
  if (input.documentId === input.parentDocumentId) {
    throw new Error("A document cannot be its own parent");
  }

  let currentId: string | null = input.parentDocumentId;
  const seen = new Set<string>([input.documentId]);
  for (let depth = 0; currentId && depth < MAX_DOCUMENT_ANCESTORS; depth += 1) {
    if (seen.has(currentId)) {
      throw new Error("Document parent would create a cycle");
    }
    seen.add(currentId);
    const parent: { parentDocumentId: string | null } | null =
      await client.document.findFirst({
        where: { id: currentId, deletedAt: null },
        select: { parentDocumentId: true },
      });
    if (!parent) throw new Error(CONTENT_NOT_FOUND_MESSAGE);
    currentId = parent.parentDocumentId;
  }
  if (currentId) throw new Error("Document hierarchy is too deep");
}

function resourceWhere(
  resource: ContentResource,
):
  | { documentId: string; collectionId: null }
  | { documentId: null; collectionId: string } {
  return resource.type === "document"
    ? { documentId: normalizeId(resource.id), collectionId: null }
    : { documentId: null, collectionId: normalizeId(resource.id) };
}

function granteeWhere(
  grantee: ContentGrantee,
):
  | { userId: string; organizationId: null }
  | { userId: null; organizationId: string } {
  return grantee.type === "user"
    ? { userId: normalizeId(grantee.id), organizationId: null }
    : { userId: null, organizationId: normalizeId(grantee.id) };
}

async function assertFullAccess(
  resource: ContentResource,
  actorUserId: string,
  client: ContentAccessClient = prisma,
): Promise<void> {
  if (resource.type === "document") {
    await assertDocumentAccess(
      resource.id,
      actorUserId,
      ContentAccessLevel.FULL_ACCESS,
      client,
    );
    return;
  }
  await assertCollectionAccess(
    resource.id,
    actorUserId,
    ContentAccessLevel.FULL_ACCESS,
    client,
  );
}

async function assertGranteeExists(
  grantee: ContentGrantee,
  client: ContentAccessClient = prisma,
): Promise<void> {
  if (grantee.type === "user") {
    const user = await client.user.findFirst({
      where: { id: normalizeId(grantee.id), deletedAt: null },
      select: { id: true },
    });
    if (!user) throw new Error("User not found");
    return;
  }
  const organization = await client.organization.findFirst({
    where: { id: normalizeId(grantee.id), deletedAt: null },
    select: { id: true },
  });
  if (!organization) throw new Error("Organization not found");
}

export async function resolveContentGrantee(input: {
  actorUserId: string;
  grantee: ContentGranteeReference;
  resource: ContentResource;
}): Promise<ContentGrantee> {
  if (input.grantee.type === "organization") {
    return { type: "organization", id: normalizeId(input.grantee.id) };
  }
  if (input.grantee.id) {
    return { type: "user", id: normalizeId(input.grantee.id) };
  }

  await assertFullAccess(input.resource, input.actorUserId);
  const email = input.grantee.email?.trim();
  if (!email) throw new Error("Specify one user ID or email address.");
  const user = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      email: { equals: email, mode: "insensitive" },
    },
    select: { id: true },
  });
  if (!user) throw new Error("No Optimitron account uses that email address.");
  return { type: "user", id: user.id };
}

function accessAuditMetadata(input: {
  accessLevel: ContentAccessLevel | null;
  grantee: ContentGrantee;
  operation: "grant" | "revoke";
  previousAccessLevel: ContentAccessLevel | null;
}): string {
  return JSON.stringify({
    accessLevel: input.accessLevel,
    granteeId: input.grantee.id,
    granteeType: input.grantee.type,
    operation: input.operation,
    previousAccessLevel: input.previousAccessLevel,
  });
}

export async function setContentAccessGrant(input: {
  accessLevel: ContentAccessLevel;
  actorUserId: string;
  grantee: ContentGrantee;
  resource: ContentResource;
}) {
  await assertFullAccess(input.resource, input.actorUserId);
  await assertGranteeExists(input.grantee);

  const resource = resourceWhere(input.resource);
  const grantee = granteeWhere(input.grantee);

  return prisma.$transaction(async (tx) => {
    await lockContentResources(tx, [input.resource]);
    await assertFullAccess(input.resource, input.actorUserId, tx);
    await assertGranteeExists(input.grantee, tx);
    const existing = await tx.contentAccessGrant.findFirst({
      where: { ...resource, ...grantee, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    const grant = existing
      ? await tx.contentAccessGrant.update({
          where: { id: existing.id },
          data: {
            accessLevel: input.accessLevel,
            grantedByUserId: input.actorUserId,
          },
        })
      : await tx.contentAccessGrant.create({
          data: {
            ...resource,
            ...grantee,
            accessLevel: input.accessLevel,
            grantedByUserId: input.actorUserId,
          },
        });

    await tx.activity.create({
      data: {
        userId: input.actorUserId,
        type: ActivityType.CONTENT_ACCESS_CHANGED,
        description: `Updated ${input.resource.type} access`,
        entityType:
          input.resource.type === "document" ? "Document" : "Collection",
        entityId: input.resource.id,
        metadata: accessAuditMetadata({
          accessLevel: input.accessLevel,
          grantee: input.grantee,
          operation: "grant",
          previousAccessLevel: existing?.accessLevel ?? null,
        }),
      },
    });

    return grant;
  });
}

export async function revokeContentAccessGrant(input: {
  actorUserId: string;
  grantee: ContentGrantee;
  resource: ContentResource;
}): Promise<void> {
  await assertFullAccess(input.resource, input.actorUserId);
  const resource = resourceWhere(input.resource);
  const grantee = granteeWhere(input.grantee);

  await prisma.$transaction(async (tx) => {
    await lockContentResources(tx, [input.resource]);
    await assertFullAccess(input.resource, input.actorUserId, tx);
    const existing = await tx.contentAccessGrant.findFirst({
      where: { ...resource, ...grantee, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: { accessLevel: true },
    });
    if (!existing) return;
    await tx.contentAccessGrant.updateMany({
      where: { ...resource, ...grantee, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    await tx.activity.create({
      data: {
        userId: input.actorUserId,
        type: ActivityType.CONTENT_ACCESS_CHANGED,
        description: `Revoked ${input.resource.type} access`,
        entityType:
          input.resource.type === "document" ? "Document" : "Collection",
        entityId: input.resource.id,
        metadata: accessAuditMetadata({
          accessLevel: null,
          grantee: input.grantee,
          operation: "revoke",
          previousAccessLevel: existing.accessLevel,
        }),
      },
    });
  });
}

export async function listContentAccessGrants(input: {
  actorUserId: string;
  resource: ContentResource;
}) {
  await assertFullAccess(input.resource, input.actorUserId);
  return prisma.contentAccessGrant.findMany({
    where: { ...resourceWhere(input.resource), deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      accessLevel: true,
      userId: true,
      organizationId: true,
      grantedByUserId: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          email: true,
          id: true,
          person: { select: { displayName: true } },
        },
      },
      organization: { select: { id: true, name: true } },
    },
  });
}
