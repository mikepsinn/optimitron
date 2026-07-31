import { Prisma } from "@optimitron/db";
import { ContentAccessLevel, ContentVisibility } from "@optimitron/db/enums";
import { sha256CanonicalJson } from "@optimitron/data/parameters";
import {
  assertDocumentAccess,
  assertValidDocumentParent,
  CONTENT_NOT_FOUND_MESSAGE,
  hasContentAccess,
  lockContentResources,
  resolveDocumentAccess,
  resolveDocumentAccessBatch,
} from "@/lib/content-access.server";
import { canManageOrganization } from "@/lib/organization.server";
import { prisma } from "@/lib/prisma";
import {
  hasDocumentGovernanceHistory,
  invalidateDocumentReviewsForDocument,
} from "@/lib/tasks/document-review-invalidation.server";
import type { TaskClientAccessBoundary } from "@/lib/tasks/task-visibility.server";

export const DOCUMENT_NOT_FOUND_MESSAGE = "Document not found";
export const DOCUMENT_EMPTY_PATCH_MESSAGE =
  "At least one editable document field must be provided";
export const DOCUMENT_PRIVATE_TASK_MESSAGE =
  "Cannot make a document attached to a private task public";
export const DOCUMENT_CONFLICT_MESSAGE =
  "Document changed since it was loaded. Refresh and try again.";
export const DOCUMENT_IDEMPOTENCY_CONFLICT_MESSAGE =
  "Document idempotency key was already used for different content";

const MAX_TITLE_LENGTH = 300;
const MAX_BODY_LENGTH = 500_000;
const MAX_LIST_LIMIT = 500;
const DOCUMENT_LIST_BATCH_SIZE = 500;
const MAX_DOCUMENT_LIST_SCAN = 5_000;

const documentInclude = {
  currentRevision: true,
} satisfies Prisma.DocumentInclude;

export type DocumentWithCurrentRevision = Prisma.DocumentGetPayload<{
  include: typeof documentInclude;
}>;

export interface DocumentVersionSummary {
  createdAt: string;
  id: string;
  isCurrent: boolean;
  title: string;
  version: number;
}

export interface DocumentDto {
  body: string;
  createdAt: string;
  effectivePermission: ContentAccessLevel;
  id: string;
  isCurrent: boolean;
  jurisdictionId: string | null;
  organizationId: string | null;
  parentDocumentId: string | null;
  revisionId: string;
  sourceKey: string | null;
  sourceUrl: string | null;
  taskId: string | null;
  title: string;
  updatedAt: string;
  version: number;
  visibility: ContentVisibility;
}

export interface DocumentSummary {
  effectivePermission: ContentAccessLevel;
  id: string;
  organizationId: string | null;
  revisionId: string | null;
  taskId: string | null;
  title: string;
  updatedAt: string;
  version: number;
  visibility: ContentVisibility;
}

export interface DocumentView {
  document: DocumentWithCurrentRevision;
  effectivePermission: ContentAccessLevel;
  revision: NonNullable<DocumentWithCurrentRevision["currentRevision"]>;
  versions: DocumentVersionSummary[];
  visibleParentDocumentId: string | null;
  visibleTaskId: string | null;
  viewerCanEdit: boolean;
}

function normalizeVisibility(
  value: unknown,
  fallback: ContentVisibility,
): ContentVisibility {
  return value === ContentVisibility.PUBLIC ||
    value === ContentVisibility.PRIVATE
    ? value
    : fallback;
}

function validateTitleAndBody(title: string, body: string): void {
  if (!title.trim()) throw new Error("Title cannot be empty");
  if (title.length > MAX_TITLE_LENGTH) {
    throw new Error(`Title exceeds ${MAX_TITLE_LENGTH} character limit`);
  }
  if (!body.trim()) throw new Error("Body cannot be empty");
  if (body.length > MAX_BODY_LENGTH) {
    throw new Error(`Body exceeds ${MAX_BODY_LENGTH} character limit`);
  }
}

function normalizeOptional(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function searchText(title: string, body: string): string {
  return `${title}\n${body}`;
}

async function canViewerSeeTask(
  taskId: string,
  userId: string | null,
): Promise<boolean> {
  const { canUserViewTask } =
    await import("@/lib/tasks/task-visibility.server");
  return canUserViewTask(taskId, userId);
}

async function assertDocumentAccessOrNotFound(
  documentId: string,
  userId: string,
  required: ContentAccessLevel,
): Promise<ContentAccessLevel> {
  try {
    return await assertDocumentAccess(documentId, userId, required);
  } catch (error) {
    throw mapContentAccessError(error);
  }
}

async function assertTaskLink(input: {
  clientAccessBoundary?: TaskClientAccessBoundary;
  taskId: string | null;
  userId: string;
  visibility: ContentVisibility;
}): Promise<{
  isPublic: boolean;
  jurisdictionId: string | null;
  ownerOrganizationId: string | null;
} | null> {
  if (!input.taskId) return null;
  const { assertUserCanViewTask, getTaskClientAccessWhere } =
    await import("@/lib/tasks/task-visibility.server");
  await assertUserCanViewTask(input.taskId, input.userId);
  const task = await prisma.task.findFirst({
    where: input.clientAccessBoundary
      ? {
          AND: [
            { id: input.taskId, deletedAt: null },
            getTaskClientAccessWhere(input.clientAccessBoundary),
          ],
        }
      : { id: input.taskId, deletedAt: null },
    select: {
      isPublic: true,
      jurisdictionId: true,
      ownerOrganizationId: true,
    },
  });
  if (!task) throw new Error(DOCUMENT_NOT_FOUND_MESSAGE);
  if (input.visibility === ContentVisibility.PUBLIC && !task.isPublic) {
    throw new Error(DOCUMENT_PRIVATE_TASK_MESSAGE);
  }
  return task;
}

function clientCanAccessOrganization(
  organizationId: string,
  boundary: TaskClientAccessBoundary,
): boolean {
  return (
    boundary.organizationIds === null ||
    boundary.organizationIds.includes(organizationId)
  );
}

export async function isDocumentWithinClientAccessBoundary(
  document: Pick<
    DocumentWithCurrentRevision,
    "organizationId" | "taskId" | "visibility"
  >,
  boundary?: TaskClientAccessBoundary,
  db: Pick<Prisma.TransactionClient, "task"> = prisma,
): Promise<boolean> {
  if (!boundary || document.visibility === ContentVisibility.PUBLIC) {
    return true;
  }
  if (document.organizationId) {
    return clientCanAccessOrganization(document.organizationId, boundary);
  }
  if (!document.taskId) return boundary.allowPersonalPrivate;

  const task = await db.task.findFirst({
    where: { deletedAt: null, id: document.taskId },
    select: { isPublic: true, ownerOrganizationId: true },
  });
  if (!task) return false;
  const { isTaskWithinClientAccessBoundary } =
    await import("@/lib/tasks/task-visibility.server");
  return isTaskWithinClientAccessBoundary(task, boundary);
}

async function assertDocumentCreationWithinClientAccessBoundary(input: {
  boundary?: TaskClientAccessBoundary;
  organizationId: string | null;
  task: {
    isPublic: boolean;
    ownerOrganizationId: string | null;
  } | null;
  visibility: ContentVisibility;
}): Promise<void> {
  if (!input.boundary || input.visibility === ContentVisibility.PUBLIC) return;
  if (input.organizationId) {
    if (clientCanAccessOrganization(input.organizationId, input.boundary)) {
      return;
    }
    throw new Error(DOCUMENT_NOT_FOUND_MESSAGE);
  }
  if (input.task) {
    const { isTaskWithinClientAccessBoundary } =
      await import("@/lib/tasks/task-visibility.server");
    if (isTaskWithinClientAccessBoundary(input.task, input.boundary)) return;
    throw new Error(DOCUMENT_NOT_FOUND_MESSAGE);
  }
  if (!input.boundary.allowPersonalPrivate) {
    throw new Error(DOCUMENT_NOT_FOUND_MESSAGE);
  }
}

async function assertOrganizationOwner(
  input: {
    organizationId: string | null;
    userId: string;
  },
  db: Pick<Prisma.TransactionClient, "organizationMember"> = prisma,
): Promise<void> {
  if (
    input.organizationId &&
    !(await canManageOrganization(input.userId, input.organizationId, db))
  ) {
    throw new Error(DOCUMENT_NOT_FOUND_MESSAGE);
  }
}

async function loadDocumentAndRevision(documentOrRevisionId: string): Promise<{
  document: DocumentWithCurrentRevision;
  revision: NonNullable<DocumentWithCurrentRevision["currentRevision"]>;
} | null> {
  const normalizedId = documentOrRevisionId.trim();
  if (!normalizedId) return null;

  const directDocument = await prisma.document.findFirst({
    where: { id: normalizedId, deletedAt: null },
    include: documentInclude,
  });
  if (directDocument?.currentRevision) {
    return {
      document: directDocument,
      revision: directDocument.currentRevision,
    };
  }

  const revision = await prisma.documentRevision.findFirst({
    where: { id: normalizedId, deletedAt: null },
    include: { document: { include: documentInclude } },
  });
  if (!revision?.document.currentRevision || revision.document.deletedAt) {
    return null;
  }
  return { document: revision.document, revision };
}

export function toDocumentDto(view: DocumentView): DocumentDto {
  const { document, effectivePermission, revision } = view;
  return {
    body: revision.body,
    createdAt: revision.createdAt.toISOString(),
    effectivePermission,
    id: document.id,
    isCurrent: revision.id === document.currentRevisionId,
    jurisdictionId: document.jurisdictionId,
    organizationId: document.organizationId,
    parentDocumentId: view.visibleParentDocumentId,
    revisionId: revision.id,
    sourceKey:
      effectivePermission === ContentAccessLevel.FULL_ACCESS
        ? document.sourceKey
        : null,
    sourceUrl:
      effectivePermission === ContentAccessLevel.FULL_ACCESS
        ? document.sourceUrl
        : null,
    taskId: view.visibleTaskId,
    title: revision.title,
    updatedAt: document.updatedAt.toISOString(),
    version: revision.version,
    visibility: document.visibility,
  };
}

async function buildDocumentView(input: {
  clientAccessBoundary?: TaskClientAccessBoundary;
  document: DocumentWithCurrentRevision;
  revision: NonNullable<DocumentWithCurrentRevision["currentRevision"]>;
  userId: string | null;
}): Promise<DocumentView | null> {
  if (
    !(await isDocumentWithinClientAccessBoundary(
      input.document,
      input.clientAccessBoundary,
    ))
  ) {
    return null;
  }
  const effectivePermission = await resolveDocumentAccess(
    input.document.id,
    input.userId,
  );
  if (!effectivePermission) return null;

  const versions = await prisma.documentRevision.findMany({
    where: {
      documentId: input.document.id,
      deletedAt: null,
    },
    orderBy: { version: "desc" },
    select: { id: true, version: true, title: true, createdAt: true },
  });
  const [canViewTask, canViewParent] = await Promise.all([
    input.document.taskId
      ? import("@/lib/tasks/task-visibility.server").then(
          ({ canUserViewTask }) =>
            canUserViewTask(input.document.taskId as string, input.userId),
        )
      : Promise.resolve(false),
    input.document.parentDocumentId
      ? resolveDocumentAccess(
          input.document.parentDocumentId,
          input.userId,
        ).then((access) => access != null)
      : Promise.resolve(false),
  ]);

  return {
    document: input.document,
    revision: input.revision,
    effectivePermission,
    visibleParentDocumentId: canViewParent
      ? input.document.parentDocumentId
      : null,
    visibleTaskId: canViewTask ? input.document.taskId : null,
    viewerCanEdit: hasContentAccess(
      effectivePermission,
      ContentAccessLevel.EDIT_CONTENT,
    ),
    versions: versions.map((revision) => ({
      ...revision,
      createdAt: revision.createdAt.toISOString(),
      isCurrent: revision.id === input.document.currentRevisionId,
    })),
  };
}

export async function getDocumentForViewer(
  documentOrRevisionId: string,
  userId?: string | null,
  options: { clientAccessBoundary?: TaskClientAccessBoundary } = {},
): Promise<DocumentView | null> {
  const loaded = await loadDocumentAndRevision(documentOrRevisionId);
  if (!loaded) return null;
  return buildDocumentView({
    ...loaded,
    clientAccessBoundary: options.clientAccessBoundary,
    userId: userId?.trim() || null,
  });
}

export async function createDocument(
  input: {
    body: string;
    createdByUserId: string;
    idempotencyKey?: string | null;
    jurisdictionId?: string | null;
    organizationId?: string | null;
    parentDocumentId?: string | null;
    requestHash?: string | null;
    sourceArtifactId?: string | null;
    sourceKey?: string | null;
    sourceUrl?: string | null;
    taskId?: string | null;
    title: string;
    visibility?: ContentVisibility | null;
  },
  options: { clientAccessBoundary?: TaskClientAccessBoundary } = {},
): Promise<DocumentView> {
  const title = input.title.trim();
  const body = input.body;
  validateTitleAndBody(title, body);

  const taskId = normalizeOptional(input.taskId);
  const organizationId = normalizeOptional(input.organizationId);
  const parentDocumentId = normalizeOptional(input.parentDocumentId);
  const idempotencyKey = normalizeOptional(input.idempotencyKey);
  const sourceKey = normalizeOptional(input.sourceKey);
  const sourceUrl = normalizeOptional(input.sourceUrl);
  const sourceArtifactId = normalizeOptional(input.sourceArtifactId);
  const visibility = normalizeVisibility(
    input.visibility,
    ContentVisibility.PRIVATE,
  );

  const [task] = await Promise.all([
    assertTaskLink({
      clientAccessBoundary: options.clientAccessBoundary,
      taskId,
      userId: input.createdByUserId,
      visibility,
    }),
    assertOrganizationOwner({
      organizationId,
      userId: input.createdByUserId,
    }),
    parentDocumentId
      ? assertDocumentAccessOrNotFound(
          parentDocumentId,
          input.createdByUserId,
          ContentAccessLevel.EDIT,
        )
      : Promise.resolve(null),
  ]);
  await assertDocumentCreationWithinClientAccessBoundary({
    boundary: options.clientAccessBoundary,
    organizationId,
    task,
    visibility,
  });

  const jurisdictionId =
    normalizeOptional(input.jurisdictionId) ?? task?.jurisdictionId ?? null;
  const requestHash =
    normalizeOptional(input.requestHash) ??
    (await sha256CanonicalJson({
      body,
      jurisdictionId,
      organizationId,
      parentDocumentId,
      sourceArtifactId,
      sourceKey,
      sourceUrl,
      taskId,
      title,
      visibility,
    }));

  const findExisting = async () => {
    const [byIdempotencyKey, bySourceKey] = await Promise.all([
      idempotencyKey
        ? prisma.document.findUnique({
            where: {
              createdByUserId_idempotencyKey: {
                createdByUserId: input.createdByUserId,
                idempotencyKey,
              },
            },
            select: { id: true, requestHash: true },
          })
        : null,
      sourceKey
        ? prisma.document.findUnique({
            where: { sourceKey },
            select: { id: true, requestHash: true },
          })
        : null,
    ]);
    if (
      byIdempotencyKey &&
      bySourceKey &&
      byIdempotencyKey.id !== bySourceKey.id
    ) {
      throw new Error(DOCUMENT_IDEMPOTENCY_CONFLICT_MESSAGE);
    }
    return byIdempotencyKey ?? bySourceKey;
  };
  const returnExisting = async (existing: {
    id: string;
    requestHash: string | null;
  }) => {
    if (existing.requestHash !== requestHash) {
      throw new Error(DOCUMENT_IDEMPOTENCY_CONFLICT_MESSAGE);
    }
    const view = await getDocumentForViewer(
      existing.id,
      input.createdByUserId,
      options,
    );
    if (!view) throw new Error(DOCUMENT_NOT_FOUND_MESSAGE);
    return view;
  };
  const existing = await findExisting();
  if (existing) {
    return returnExisting(existing);
  }

  let documentId: string;
  try {
    documentId = await prisma.$transaction(async (tx) => {
      if (parentDocumentId) {
        await lockContentResources(tx, [
          { type: "document", id: parentDocumentId },
        ]);
        await assertDocumentAccess(
          parentDocumentId,
          input.createdByUserId,
          ContentAccessLevel.EDIT,
          tx,
        );
      }
      await assertOrganizationOwner(
        { organizationId, userId: input.createdByUserId },
        tx,
      );
      const document = await tx.document.create({
        data: {
          createdByUserId: input.createdByUserId,
          idempotencyKey,
          jurisdictionId,
          organizationId,
          parentDocumentId,
          requestHash,
          searchText: searchText(title, body),
          sourceKey,
          sourceUrl,
          taskId,
          title,
          version: 0,
          visibility,
        },
        select: { id: true },
      });
      const revision = await tx.documentRevision.create({
        data: {
          body,
          contentHash: await sha256CanonicalJson({ body, title }),
          createdByUserId: input.createdByUserId,
          documentId: document.id,
          sourceArtifactId,
          title,
          version: 1,
        },
        select: { id: true },
      });
      await tx.document.update({
        where: { id: document.id },
        data: { currentRevisionId: revision.id, version: 1 },
      });
      return document.id;
    });
  } catch (error) {
    if (!isUniqueConstraintError(error) || (!idempotencyKey && !sourceKey)) {
      throw error;
    }
    const raced = await findExisting();
    if (!raced) throw error;
    return returnExisting(raced);
  }

  const view = await getDocumentForViewer(
    documentId,
    input.createdByUserId,
    options,
  );
  if (!view) throw new Error(DOCUMENT_NOT_FOUND_MESSAGE);
  return view;
}

export async function updateDocument(
  input: {
    body?: string | null;
    documentId: string;
    editorUserId: string;
    expectedVersion: number;
    organizationId?: string | null;
    parentDocumentId?: string | null;
    requestHash?: string | null;
    sourceArtifactId?: string | null;
    sourceUrl?: string | null;
    taskId?: string | null;
    title?: string | null;
    visibility?: ContentVisibility | null;
  },
  options: { clientAccessBoundary?: TaskClientAccessBoundary } = {},
): Promise<DocumentView> {
  const hasContentPatch = input.title != null || input.body != null;
  const hasMetadataPatch =
    input.visibility != null ||
    input.organizationId !== undefined ||
    input.parentDocumentId !== undefined ||
    input.requestHash !== undefined ||
    input.sourceArtifactId !== undefined ||
    input.sourceUrl !== undefined ||
    input.taskId !== undefined;
  if (!hasContentPatch && !hasMetadataPatch) {
    throw new Error(DOCUMENT_EMPTY_PATCH_MESSAGE);
  }
  if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 1) {
    throw new Error("expectedVersion must be a positive integer");
  }

  const current = await prisma.document.findFirst({
    where: { id: input.documentId, deletedAt: null },
    include: documentInclude,
  });
  if (!current?.currentRevision) throw new Error(DOCUMENT_NOT_FOUND_MESSAGE);
  if (
    !(await isDocumentWithinClientAccessBoundary(
      current,
      options.clientAccessBoundary,
    ))
  ) {
    throw new Error(DOCUMENT_NOT_FOUND_MESSAGE);
  }
  await assertDocumentAccessOrNotFound(
    input.documentId,
    input.editorUserId,
    hasMetadataPatch
      ? ContentAccessLevel.FULL_ACCESS
      : ContentAccessLevel.EDIT_CONTENT,
  );
  if (current.version !== input.expectedVersion) {
    throw new Error(DOCUMENT_CONFLICT_MESSAGE);
  }

  const title = input.title?.trim() || current.currentRevision.title;
  const body = input.body ?? current.currentRevision.body;
  validateTitleAndBody(title, body);

  const visibility = normalizeVisibility(input.visibility, current.visibility);
  const taskId =
    input.taskId === undefined
      ? current.taskId
      : normalizeOptional(input.taskId);
  const organizationId =
    input.organizationId === undefined
      ? current.organizationId
      : normalizeOptional(input.organizationId);
  const parentDocumentId =
    input.parentDocumentId === undefined
      ? current.parentDocumentId
      : normalizeOptional(input.parentDocumentId);
  const requestHash =
    input.requestHash === undefined
      ? current.requestHash
      : normalizeOptional(input.requestHash);
  const sourceArtifactId = normalizeOptional(input.sourceArtifactId);
  const sourceUrl =
    input.sourceUrl === undefined
      ? current.sourceUrl
      : normalizeOptional(input.sourceUrl);

  const [task] = await Promise.all([
    assertTaskLink({
      clientAccessBoundary: options.clientAccessBoundary,
      taskId,
      userId: input.editorUserId,
      visibility,
    }),
    assertOrganizationOwner({ organizationId, userId: input.editorUserId }),
    assertValidDocumentParent({
      documentId: current.id,
      parentDocumentId,
    }),
    parentDocumentId
      ? assertDocumentAccessOrNotFound(
          parentDocumentId,
          input.editorUserId,
          ContentAccessLevel.EDIT,
        )
      : Promise.resolve(null),
  ]);
  await assertDocumentCreationWithinClientAccessBoundary({
    boundary: options.clientAccessBoundary,
    organizationId,
    task,
    visibility,
  });

  const nextVersion = current.version + 1;
  await prisma.$transaction(async (tx) => {
    await lockContentResources(tx, [
      { type: "document", id: current.id },
      ...(parentDocumentId
        ? [{ type: "document" as const, id: parentDocumentId }]
        : []),
    ]);
    try {
      await assertDocumentAccess(
        current.id,
        input.editorUserId,
        hasMetadataPatch
          ? ContentAccessLevel.FULL_ACCESS
          : ContentAccessLevel.EDIT_CONTENT,
        tx,
      );
      await assertOrganizationOwner(
        { organizationId, userId: input.editorUserId },
        tx,
      );
      await assertValidDocumentParent(
        { documentId: current.id, parentDocumentId },
        tx,
      );
      if (parentDocumentId) {
        await assertDocumentAccess(
          parentDocumentId,
          input.editorUserId,
          ContentAccessLevel.EDIT,
          tx,
        );
      }
      if (
        taskId !== current.taskId &&
        (await hasDocumentGovernanceHistory(tx, current.id, current.taskId))
      ) {
        throw new Error(
          "Documents with review or decision history cannot be linked to another task",
        );
      }
    } catch (error) {
      throw mapContentAccessError(error);
    }
    const claimed = await tx.document.updateMany({
      where: {
        id: current.id,
        version: input.expectedVersion,
        deletedAt: null,
      },
      data: {
        organizationId,
        parentDocumentId,
        requestHash,
        searchText: searchText(title, body),
        sourceUrl,
        taskId,
        title,
        version: nextVersion,
        visibility,
      },
    });
    if (claimed.count !== 1) throw new Error(DOCUMENT_CONFLICT_MESSAGE);

    const revision = await tx.documentRevision.create({
      data: {
        body,
        contentHash: await sha256CanonicalJson({ body, title }),
        createdByUserId: input.editorUserId,
        documentId: current.id,
        sourceArtifactId,
        title,
        version: nextVersion,
      },
      select: { id: true },
    });
    await tx.document.update({
      where: { id: current.id },
      data: { currentRevisionId: revision.id },
    });
    await invalidateDocumentReviewsForDocument(tx, current.id);
  });

  const view = await getDocumentForViewer(
    current.id,
    input.editorUserId,
    options,
  );
  if (!view) throw new Error(DOCUMENT_NOT_FOUND_MESSAGE);
  return view;
}

export async function listDocumentsForViewer(input: {
  clientAccessBoundary?: TaskClientAccessBoundary;
  limit?: number | null;
  taskId?: string | null;
  userId?: string | null;
}): Promise<DocumentSummary[]> {
  const limit = Math.min(Math.max(input.limit ?? 100, 1), MAX_LIST_LIMIT);
  const taskId = normalizeOptional(input.taskId);

  if (taskId) {
    const { canUserViewTask, getTaskClientAccessWhere } =
      await import("@/lib/tasks/task-visibility.server");
    if (!(await canUserViewTask(taskId, input.userId ?? null))) return [];
    if (
      input.clientAccessBoundary &&
      !(await prisma.task.findFirst({
        where: {
          AND: [
            { deletedAt: null, id: taskId },
            getTaskClientAccessWhere(input.clientAccessBoundary),
          ],
        },
        select: { id: true },
      }))
    ) {
      return [];
    }
  }

  const viewerUserId = input.userId?.trim() || null;
  const summaries: DocumentSummary[] = [];
  const boundaryTaskAccess = new Map<string, boolean>();
  let cursor: string | undefined;
  let scanned = 0;

  while (summaries.length < limit && scanned < MAX_DOCUMENT_LIST_SCAN) {
    const take = Math.min(
      DOCUMENT_LIST_BATCH_SIZE,
      MAX_DOCUMENT_LIST_SCAN - scanned,
    );
    const rows = await prisma.document.findMany({
      where: {
        deletedAt: null,
        ...(taskId ? { taskId } : {}),
      },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        currentRevision: {
          select: { id: true },
        },
        id: true,
        organizationId: true,
        taskId: true,
        title: true,
        updatedAt: true,
        version: true,
        visibility: true,
      },
    });
    if (rows.length === 0) break;
    scanned += rows.length;
    cursor = rows.at(-1)?.id;

    const accessById = await resolveDocumentAccessBatch(
      rows.map((document) => document.id),
      viewerUserId,
    );
    if (input.clientAccessBoundary && !taskId) {
      const unresolvedTaskIds = [
        ...new Set(
          rows.flatMap((document) =>
            document.visibility === ContentVisibility.PRIVATE &&
            !document.organizationId &&
            document.taskId &&
            !boundaryTaskAccess.has(document.taskId)
              ? [document.taskId]
              : [],
          ),
        ),
      ];
      if (unresolvedTaskIds.length > 0) {
        const tasks = await prisma.task.findMany({
          where: { deletedAt: null, id: { in: unresolvedTaskIds } },
          select: { id: true, isPublic: true, ownerOrganizationId: true },
        });
        const taskById = new Map(tasks.map((task) => [task.id, task]));
        const { isTaskWithinClientAccessBoundary } =
          await import("@/lib/tasks/task-visibility.server");
        for (const unresolvedTaskId of unresolvedTaskIds) {
          const task = taskById.get(unresolvedTaskId);
          boundaryTaskAccess.set(
            unresolvedTaskId,
            Boolean(
              task &&
              isTaskWithinClientAccessBoundary(
                task,
                input.clientAccessBoundary,
              ),
            ),
          );
        }
      }
    }
    for (const document of rows) {
      if (input.clientAccessBoundary) {
        if (document.visibility !== ContentVisibility.PUBLIC) {
          if (document.organizationId) {
            if (
              !clientCanAccessOrganization(
                document.organizationId,
                input.clientAccessBoundary,
              )
            ) {
              continue;
            }
          } else if (document.taskId) {
            if (!taskId && !boundaryTaskAccess.get(document.taskId)) continue;
          } else if (!input.clientAccessBoundary.allowPersonalPrivate) {
            continue;
          }
        }
      }
      const effectivePermission = accessById.get(document.id) ?? null;
      if (!effectivePermission) continue;
      summaries.push({
        effectivePermission,
        id: document.id,
        organizationId: document.organizationId,
        revisionId: document.currentRevision?.id ?? null,
        taskId:
          document.taskId &&
          (taskId || (await canViewerSeeTask(document.taskId, viewerUserId)))
            ? document.taskId
            : null,
        title: document.title,
        updatedAt: document.updatedAt.toISOString(),
        version: document.version,
        visibility: document.visibility,
      });
      if (summaries.length === limit) break;
    }
    if (rows.length < take) break;
  }

  return summaries;
}

export async function listDocumentSummariesForViewer(input: {
  limit?: number | null;
  taskId: string;
  userId?: string | null;
}): Promise<DocumentSummary[]> {
  return listDocumentsForViewer(input);
}

export function mapContentAccessError(error: unknown): Error {
  if (error instanceof Error && error.message === CONTENT_NOT_FOUND_MESSAGE) {
    return new Error(DOCUMENT_NOT_FOUND_MESSAGE);
  }
  return error instanceof Error ? error : new Error("Unknown document error");
}
