/**
 * Document server helpers. A logical document is a chain of immutable version
 * rows sharing one documentKey; exactly one row per chain has isCurrent.
 * Updates never mutate a version — they append a new row and flip isCurrent
 * inside a transaction.
 *
 * Visibility: PRIVATE by default. Private documents are readable by their
 * creator (and admins) only, and 404 for everyone else — same principle as
 * private tasks. Visibility is enforced at the CHAIN level: every read gates
 * on the documentKey's current row, not the requested row's own (possibly
 * stale) visibility field, so an old PUBLIC version can't outlive a later
 * PRIVATE one and a downgrade can't be bypassed by linking an old version id.
 */

import type { Prisma } from "@optimitron/db";
import { DocumentVisibility } from "@optimitron/db/enums";
import { prisma } from "@/lib/prisma";

export const DOCUMENT_NOT_FOUND_MESSAGE = "Document not found";
export const DOCUMENT_EMPTY_PATCH_MESSAGE =
  "At least one of title, body, or visibility must be provided";
export const DOCUMENT_PRIVATE_TASK_MESSAGE =
  "Cannot make a document attached to a private task public";

const MAX_TITLE_LENGTH = 300;
const MAX_BODY_LENGTH = 500_000;

export type DocumentRow = Prisma.DocumentGetPayload<Record<string, never>>;

/** Wire shape for API/MCP responses: dates as ISO strings. Omits
 * createdByUserId — raw User ids don't go to anonymous readers; route
 * creator attribution through Person if this ever needs a byline. */
export interface DocumentDto {
  id: string;
  documentKey: string;
  jurisdictionId: string | null;
  taskId: string | null;
  title: string;
  body: string;
  version: number;
  isCurrent: boolean;
  visibility: DocumentVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentSummary {
  id: string;
  title: string;
  version: number;
}

export function toDocumentDto(row: DocumentRow): DocumentDto {
  return {
    id: row.id,
    documentKey: row.documentKey,
    jurisdictionId: row.jurisdictionId,
    taskId: row.taskId,
    title: row.title,
    body: row.body,
    version: row.version,
    isCurrent: row.isCurrent,
    visibility: row.visibility,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function normalizeVisibility(
  value: unknown,
  fallback: DocumentVisibility,
): DocumentVisibility {
  return value === DocumentVisibility.PUBLIC ||
    value === DocumentVisibility.PRIVATE
    ? value
    : fallback;
}

function validateTitleAndBody(title: string, body: string): void {
  if (!title.trim()) {
    throw new Error("Title cannot be empty");
  }
  if (title.length > MAX_TITLE_LENGTH) {
    throw new Error(`Title exceeds ${MAX_TITLE_LENGTH} character limit`);
  }
  if (!body.trim()) {
    throw new Error("Body cannot be empty");
  }
  if (body.length > MAX_BODY_LENGTH) {
    throw new Error(`Body exceeds ${MAX_BODY_LENGTH} character limit`);
  }
}

async function getViewerFlags(
  userId?: string | null,
): Promise<{ id: string; isAdmin: boolean } | null> {
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isAdmin: true },
  });
  return user ? { id: user.id, isAdmin: user.isAdmin ?? false } : null;
}

/** Pure visibility rule: public docs are readable by anyone; private docs by
 * their creator or an admin. */
export function canViewDocument(
  document: Pick<DocumentRow, "visibility" | "createdByUserId">,
  viewer: { id: string; isAdmin: boolean } | null,
): boolean {
  if (document.visibility === DocumentVisibility.PUBLIC) return true;
  if (!viewer) return false;
  return viewer.isAdmin || document.createdByUserId === viewer.id;
}

/** Public + creator/admin visibility OR, shared by both list helpers below. */
async function buildDocumentVisibilityWhere(
  userId?: string | null,
): Promise<Prisma.DocumentWhereInput> {
  const viewer = await getViewerFlags(userId);
  const visibilityOr: Prisma.DocumentWhereInput[] = [
    { visibility: DocumentVisibility.PUBLIC },
  ];
  if (viewer?.isAdmin) {
    // Admins get the same private read access canViewDocument grants them.
    visibilityOr.push({ visibility: DocumentVisibility.PRIVATE });
  } else if (viewer) {
    visibilityOr.push({ createdByUserId: viewer.id });
  }
  return { OR: visibilityOr };
}

/**
 * Create version 1 of a new document. Private by default. When taskId is
 * given, the creator must be able to view that task (same predicate as
 * /tasks/[id]) so documents can't be attached to tasks the author can't see.
 * A document can only be made PUBLIC on a task that is itself public —
 * otherwise the document would leak the private task's existence/id to
 * anyone who can read the document.
 */
export async function createDocument(input: {
  title: string;
  body: string;
  createdByUserId: string;
  taskId?: string | null;
  jurisdictionId?: string | null;
  visibility?: DocumentVisibility | null;
}): Promise<DocumentRow> {
  const title = input.title.trim();
  const body = input.body;
  validateTitleAndBody(title, body);

  const taskId = input.taskId?.trim() || null;
  let jurisdictionId = input.jurisdictionId?.trim() || null;
  const visibility = normalizeVisibility(
    input.visibility,
    DocumentVisibility.PRIVATE,
  );

  if (taskId) {
    const { assertUserCanViewTask } = await import(
      "@/lib/tasks/task-visibility.server"
    );
    await assertUserCanViewTask(taskId, input.createdByUserId);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { jurisdictionId: true, isPublic: true },
    });
    if (!jurisdictionId) {
      jurisdictionId = task?.jurisdictionId ?? null;
    }
    if (visibility === DocumentVisibility.PUBLIC && !task?.isPublic) {
      throw new Error(DOCUMENT_PRIVATE_TASK_MESSAGE);
    }
  }

  return prisma.document.create({
    data: {
      title,
      body,
      taskId,
      jurisdictionId,
      visibility,
      createdByUserId: input.createdByUserId,
    },
  });
}

/**
 * Append a new version. Only the document's creator may update. Runs in one
 * transaction: the current row loses isCurrent, the new row (version + 1)
 * gains it. Untouched fields carry forward. Rejects patches that touch none
 * of title/body/visibility instead of appending a no-op version, and — same
 * rule as createDocument — refuses to flip an attached document PUBLIC while
 * its task is private.
 */
export async function updateDocument(input: {
  documentId: string;
  editorUserId: string;
  title?: string | null;
  body?: string | null;
  visibility?: DocumentVisibility | null;
}): Promise<DocumentRow> {
  if (input.title == null && input.body == null && input.visibility == null) {
    throw new Error(DOCUMENT_EMPTY_PATCH_MESSAGE);
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.document.findFirst({
      where: { id: input.documentId, deletedAt: null },
      select: { documentKey: true, createdByUserId: true },
    });
    if (!existing) {
      throw new Error(DOCUMENT_NOT_FOUND_MESSAGE);
    }
    if (existing.createdByUserId !== input.editorUserId) {
      // Non-creators get the same 404 as a missing document so private
      // documents stay indistinguishable from nonexistent ones.
      throw new Error(DOCUMENT_NOT_FOUND_MESSAGE);
    }

    const current = await tx.document.findFirst({
      where: {
        documentKey: existing.documentKey,
        isCurrent: true,
        deletedAt: null,
      },
      orderBy: { version: "desc" },
    });
    if (!current) {
      throw new Error(DOCUMENT_NOT_FOUND_MESSAGE);
    }

    const title = input.title?.trim() || current.title;
    const body = input.body ?? current.body;
    validateTitleAndBody(title, body);

    const visibility = normalizeVisibility(input.visibility, current.visibility);
    if (visibility === DocumentVisibility.PUBLIC && current.taskId) {
      const task = await tx.task.findUnique({
        where: { id: current.taskId },
        select: { isPublic: true },
      });
      if (!task?.isPublic) {
        throw new Error(DOCUMENT_PRIVATE_TASK_MESSAGE);
      }
    }

    await tx.document.update({
      where: { id: current.id },
      data: { isCurrent: false },
    });

    return tx.document.create({
      data: {
        documentKey: current.documentKey,
        title,
        body,
        taskId: current.taskId,
        jurisdictionId: current.jurisdictionId,
        version: current.version + 1,
        isCurrent: true,
        visibility,
        createdByUserId: current.createdByUserId,
      },
    });
  });
}

export interface DocumentVersionSummary {
  id: string;
  version: number;
  isCurrent: boolean;
  title: string;
  createdAt: Date;
}

/**
 * Load one version row plus the version list for its chain, gated by the
 * CHAIN's current visibility (not the requested row's own field — see file
 * header). Returns null (callers 404) when missing, soft-deleted, or not
 * viewable.
 */
export async function getDocumentForViewer(
  documentId: string,
  userId?: string | null,
): Promise<{
  document: DocumentRow;
  versions: DocumentVersionSummary[];
  viewerCanEdit: boolean;
} | null> {
  const normalizedId = documentId?.trim();
  if (!normalizedId) return null;

  const document = await prisma.document.findFirst({
    where: { id: normalizedId, deletedAt: null },
  });
  if (!document) return null;

  const current = await prisma.document.findFirst({
    where: {
      documentKey: document.documentKey,
      isCurrent: true,
      deletedAt: null,
    },
    orderBy: { version: "desc" },
  });
  if (!current) return null;

  const viewer = await getViewerFlags(userId);
  if (!canViewDocument(current, viewer)) return null;

  const versions = await prisma.document.findMany({
    where: { documentKey: document.documentKey, deletedAt: null },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      isCurrent: true,
      title: true,
      createdAt: true,
    },
  });

  return {
    document,
    versions,
    viewerCanEdit: viewer != null && current.createdByUserId === viewer.id,
  };
}

/**
 * List current versions the viewer can see: public documents, the viewer's
 * own, and (for admins) every private document too — same access
 * canViewDocument grants. Anonymous viewers see public documents only. When
 * taskId is given, the viewer must be able to view that task itself — a
 * document-list query can't become a way to probe private task ids.
 */
export async function listDocumentsForViewer(input: {
  userId?: string | null;
  taskId?: string | null;
  limit?: number | null;
}): Promise<DocumentRow[]> {
  const limit = Math.min(Math.max(input.limit ?? 100, 1), 500);
  const taskId = input.taskId?.trim() || null;

  if (taskId) {
    const { canUserViewTask } = await import(
      "@/lib/tasks/task-visibility.server"
    );
    if (!(await canUserViewTask(taskId, input.userId ?? null))) return [];
  }

  const visibilityWhere = await buildDocumentVisibilityWhere(input.userId);

  return prisma.document.findMany({
    where: {
      isCurrent: true,
      deletedAt: null,
      ...(taskId ? { taskId } : {}),
      ...visibilityWhere,
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

/**
 * Minimal id/title/version list for a task's attached documents — used by
 * TaskDocumentsList, which never renders the body. Avoids shipping full
 * markdown bodies (up to 500k chars each) on every task page load.
 */
export async function listDocumentSummariesForViewer(input: {
  userId?: string | null;
  taskId: string;
  limit?: number | null;
}): Promise<DocumentSummary[]> {
  const taskId = input.taskId?.trim();
  if (!taskId) return [];
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 500);

  const { canUserViewTask } = await import(
    "@/lib/tasks/task-visibility.server"
  );
  if (!(await canUserViewTask(taskId, input.userId ?? null))) return [];

  const visibilityWhere = await buildDocumentVisibilityWhere(input.userId);

  return prisma.document.findMany({
    where: {
      isCurrent: true,
      deletedAt: null,
      taskId,
      ...visibilityWhere,
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: { id: true, title: true, version: true },
  });
}
