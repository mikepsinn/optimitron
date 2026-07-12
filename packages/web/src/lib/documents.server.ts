/**
 * Document server helpers. A logical document is a chain of immutable version
 * rows sharing one documentKey; exactly one row per chain has isCurrent.
 * Updates never mutate a version — they append a new row and flip isCurrent
 * inside a transaction.
 *
 * Visibility: PRIVATE by default. Private documents are readable by their
 * creator (and admins) only, and 404 for everyone else — same principle as
 * private tasks.
 */

import type { Prisma } from "@optimitron/db";
import { DocumentVisibility } from "@optimitron/db/enums";
import { prisma } from "@/lib/prisma";

export const DOCUMENT_NOT_FOUND_MESSAGE = "Document not found";

const MAX_TITLE_LENGTH = 300;
const MAX_BODY_LENGTH = 500_000;

export interface DocumentRow {
  id: string;
  documentKey: string;
  jurisdictionId: string | null;
  taskId: string | null;
  title: string;
  body: string;
  version: number;
  isCurrent: boolean;
  visibility: DocumentVisibility;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Wire shape for API/MCP responses: dates as ISO strings. */
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
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
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
    createdByUserId: row.createdByUserId,
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

/**
 * Create version 1 of a new document. Private by default. When taskId is
 * given, the creator must be able to view that task (same predicate as
 * /tasks/[id]) so documents can't be attached to tasks the author can't see.
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

  if (taskId) {
    const { assertUserCanViewTask } = await import(
      "@/lib/tasks/task-visibility.server"
    );
    await assertUserCanViewTask(taskId, input.createdByUserId);
    if (!jurisdictionId) {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { jurisdictionId: true },
      });
      jurisdictionId = task?.jurisdictionId ?? null;
    }
  }

  return prisma.document.create({
    data: {
      title,
      body,
      taskId,
      jurisdictionId,
      visibility: normalizeVisibility(
        input.visibility,
        DocumentVisibility.PRIVATE,
      ),
      createdByUserId: input.createdByUserId,
    },
  });
}

/**
 * Append a new version. Only the document's creator may update. Runs in one
 * transaction: the current row loses isCurrent, the new row (version + 1)
 * gains it. Untouched fields carry forward.
 */
export async function updateDocument(input: {
  documentId: string;
  editorUserId: string;
  title?: string | null;
  body?: string | null;
  visibility?: DocumentVisibility | null;
}): Promise<DocumentRow> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.document.findUnique({
      where: { id: input.documentId },
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
      where: { documentKey: existing.documentKey, isCurrent: true },
      orderBy: { version: "desc" },
    });
    if (!current) {
      throw new Error(DOCUMENT_NOT_FOUND_MESSAGE);
    }

    const title = input.title?.trim() || current.title;
    const body = input.body ?? current.body;
    validateTitleAndBody(title, body);

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
        visibility: normalizeVisibility(input.visibility, current.visibility),
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
 * Load one version row plus the version list for its chain, gated by
 * visibility. Returns null (callers 404) when missing or not viewable.
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

  const document = await prisma.document.findUnique({
    where: { id: normalizedId },
  });
  if (!document) return null;

  const viewer = await getViewerFlags(userId);
  if (!canViewDocument(document, viewer)) return null;

  const versions = await prisma.document.findMany({
    where: { documentKey: document.documentKey },
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
    viewerCanEdit: viewer != null && document.createdByUserId === viewer.id,
  };
}

/**
 * List current versions the viewer can see: public documents plus the
 * viewer's own. Anonymous viewers see public documents only.
 */
export async function listDocumentsForViewer(input: {
  userId?: string | null;
  taskId?: string | null;
  limit?: number | null;
}): Promise<DocumentRow[]> {
  const limit = Math.min(Math.max(input.limit ?? 100, 1), 500);
  const taskId = input.taskId?.trim() || null;

  const visibilityOr: Prisma.DocumentWhereInput[] = [
    { visibility: DocumentVisibility.PUBLIC },
  ];
  if (input.userId) {
    visibilityOr.push({ createdByUserId: input.userId });
  }

  return prisma.document.findMany({
    where: {
      isCurrent: true,
      ...(taskId ? { taskId } : {}),
      OR: visibilityOr,
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}
