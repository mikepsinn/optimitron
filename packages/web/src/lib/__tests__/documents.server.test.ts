import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  access: {
    assertDocumentAccess: vi.fn(),
    assertValidDocumentParent: vi.fn(),
    lockContentResources: vi.fn(),
    resolveDocumentAccess: vi.fn(),
    resolveDocumentAccessBatch: vi.fn(),
  },
  canManageOrganization: vi.fn(),
  canUserViewTask: vi.fn(),
  getTaskClientAccessWhere: vi.fn(() => ({})),
  invalidateDocumentReviewsForDocument: vi.fn(),
  isTaskWithinClientAccessBoundary: vi.fn(() => true),
  prisma: {
    documentCreate: vi.fn(),
    documentFindFirst: vi.fn(),
    documentFindMany: vi.fn(),
    documentFindUnique: vi.fn(),
    documentRevisionCreate: vi.fn(),
    documentRevisionFindFirst: vi.fn(),
    documentRevisionFindMany: vi.fn(),
    documentUpdate: vi.fn(),
    documentUpdateMany: vi.fn(),
    taskFindFirst: vi.fn(),
    transaction: vi.fn(),
  },
}));

vi.mock("@/lib/content-access.server", () => ({
  CONTENT_NOT_FOUND_MESSAGE: "Content not found",
  assertDocumentAccess: mocks.access.assertDocumentAccess,
  assertValidDocumentParent: mocks.access.assertValidDocumentParent,
  hasContentAccess: (actual: string | null, required: string) => {
    const rank: Record<string, number> = {
      VIEW: 1,
      COMMENT: 2,
      EDIT_CONTENT: 3,
      EDIT: 4,
      FULL_ACCESS: 5,
    };
    return actual != null && rank[actual] >= rank[required];
  },
  lockContentResources: mocks.access.lockContentResources,
  resolveDocumentAccess: mocks.access.resolveDocumentAccess,
  resolveDocumentAccessBatch: mocks.access.resolveDocumentAccessBatch,
}));

vi.mock("@/lib/organization.server", () => ({
  canManageOrganization: mocks.canManageOrganization,
}));

vi.mock("@/lib/tasks/document-review-invalidation.server", () => ({
  invalidateDocumentReviewsForDocument:
    mocks.invalidateDocumentReviewsForDocument,
}));

vi.mock("@/lib/tasks/task-visibility.server", () => ({
  assertUserCanViewTask: vi.fn(),
  canUserViewTask: mocks.canUserViewTask,
  getTaskClientAccessWhere: mocks.getTaskClientAccessWhere,
  isTaskWithinClientAccessBoundary: mocks.isTaskWithinClientAccessBoundary,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.prisma.transaction,
    document: {
      create: mocks.prisma.documentCreate,
      findFirst: mocks.prisma.documentFindFirst,
      findMany: mocks.prisma.documentFindMany,
      findUnique: mocks.prisma.documentFindUnique,
      update: mocks.prisma.documentUpdate,
      updateMany: mocks.prisma.documentUpdateMany,
    },
    documentRevision: {
      create: mocks.prisma.documentRevisionCreate,
      findFirst: mocks.prisma.documentRevisionFindFirst,
      findMany: mocks.prisma.documentRevisionFindMany,
    },
    task: { findFirst: mocks.prisma.taskFindFirst },
  },
}));

import {
  createDocument,
  DOCUMENT_CONFLICT_MESSAGE,
  DOCUMENT_IDEMPOTENCY_CONFLICT_MESSAGE,
  getDocumentForViewer,
  listDocumentsForViewer,
  toDocumentDto,
  updateDocument,
  type DocumentView,
} from "../documents.server";

const REVISION = {
  id: "revision_3",
  documentId: "document_1",
  version: 3,
  title: "Plan",
  body: "# Plan\n\nCurrent body",
  createdByUserId: "user_1",
  sourceArtifactId: null,
  contentHash: "hash_3",
  createdAt: new Date("2026-07-01T00:00:00Z"),
  updatedAt: new Date("2026-07-01T00:00:00Z"),
  deletedAt: null,
};

const DOCUMENT = {
  id: "document_1",
  jurisdictionId: "jurisdiction_1",
  taskId: "task_1",
  organizationId: null,
  parentDocumentId: null,
  currentRevisionId: REVISION.id,
  title: REVISION.title,
  version: REVISION.version,
  visibility: "PRIVATE" as const,
  createdByUserId: "user_1",
  sourceKey: null,
  sourceUrl: null,
  searchText: `${REVISION.title}\n${REVISION.body}`,
  idempotencyKey: null,
  requestHash: null,
  createdAt: new Date("2026-06-01T00:00:00Z"),
  updatedAt: new Date("2026-07-01T00:00:00Z"),
  deletedAt: null,
  currentRevision: REVISION,
};

function transactionClient() {
  return {
    document: {
      create: mocks.prisma.documentCreate,
      update: mocks.prisma.documentUpdate,
      updateMany: mocks.prisma.documentUpdateMany,
    },
    documentRevision: { create: mocks.prisma.documentRevisionCreate },
  };
}

beforeEach(() => {
  for (const group of [mocks.access, mocks.prisma]) {
    for (const fn of Object.values(group)) fn.mockReset();
  }
  mocks.canManageOrganization.mockReset();
  mocks.canManageOrganization.mockResolvedValue(true);
  mocks.canUserViewTask.mockReset();
  mocks.canUserViewTask.mockResolvedValue(true);
  mocks.invalidateDocumentReviewsForDocument.mockReset();
  mocks.invalidateDocumentReviewsForDocument.mockResolvedValue(undefined);
  mocks.prisma.taskFindFirst.mockResolvedValue({
    isPublic: true,
    jurisdictionId: "jurisdiction_1",
    ownerOrganizationId: null,
  });
  mocks.access.assertDocumentAccess.mockResolvedValue("FULL_ACCESS");
  mocks.access.assertValidDocumentParent.mockResolvedValue(undefined);
  mocks.access.resolveDocumentAccess.mockResolvedValue("FULL_ACCESS");
  mocks.prisma.documentRevisionFindMany.mockResolvedValue([
    {
      id: REVISION.id,
      version: REVISION.version,
      title: REVISION.title,
      createdAt: REVISION.createdAt,
    },
  ]);
  mocks.prisma.transaction.mockImplementation(
    async (callback: (tx: ReturnType<typeof transactionClient>) => unknown) =>
      callback(transactionClient()),
  );
});

describe("stable document reads", () => {
  it("loads the stable document and current revision", async () => {
    mocks.prisma.documentFindFirst.mockResolvedValue(DOCUMENT);

    const result = await getDocumentForViewer("document_1", "user_1");

    expect(result?.document.id).toBe("document_1");
    expect(result?.revision.id).toBe("revision_3");
    expect(result?.viewerCanEdit).toBe(true);
    expect(result?.versions[0]?.isCurrent).toBe(true);
  });

  it("keeps historical revision URLs readable under the stable document ACL", async () => {
    const oldRevision = { ...REVISION, id: "revision_2", version: 2 };
    mocks.prisma.documentFindFirst.mockResolvedValue(null);
    mocks.prisma.documentRevisionFindFirst.mockResolvedValue({
      ...oldRevision,
      document: DOCUMENT,
    });

    const result = await getDocumentForViewer("revision_2", "user_1");

    expect(result?.document.id).toBe("document_1");
    expect(result?.revision.id).toBe("revision_2");
    expect(result?.versions[0]?.isCurrent).toBe(true);
    expect(mocks.access.resolveDocumentAccess).toHaveBeenCalledWith(
      "document_1",
      "user_1",
    );
  });

  it("returns null without loading revision history when access is denied", async () => {
    mocks.prisma.documentFindFirst.mockResolvedValue(DOCUMENT);
    mocks.access.resolveDocumentAccess.mockResolvedValue(null);

    await expect(
      getDocumentForViewer("document_1", "stranger"),
    ).resolves.toBeNull();
    expect(mocks.prisma.documentRevisionFindMany).not.toHaveBeenCalled();
  });

  it("does not let a personal-scope client read an organization-private revision", async () => {
    mocks.prisma.documentFindFirst.mockResolvedValue({
      ...DOCUMENT,
      organizationId: "organization_1",
    });

    const result = await getDocumentForViewer("document_1", "counsel_1", {
      clientAccessBoundary: {
        allowPersonalPrivate: true,
        organizationIds: [],
      },
    });

    expect(result).toBeNull();
    expect(mocks.access.resolveDocumentAccess).not.toHaveBeenCalled();
  });
});

describe("document creation", () => {
  it("creates a stable row, its first revision, and current pointer atomically", async () => {
    const created = {
      ...DOCUMENT,
      id: "document_new",
      taskId: null,
      jurisdictionId: null,
      version: 1,
      currentRevisionId: "revision_new",
      currentRevision: { ...REVISION, id: "revision_new", version: 1 },
    };
    mocks.prisma.documentCreate.mockResolvedValue({ id: created.id });
    mocks.prisma.documentRevisionCreate.mockResolvedValue({
      id: "revision_new",
    });
    mocks.prisma.documentUpdate.mockResolvedValue(created);
    mocks.prisma.documentFindFirst.mockResolvedValue(created);

    const result = await createDocument({
      body: "Body",
      createdByUserId: "user_1",
      title: "Notes",
    });

    expect(mocks.prisma.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.documentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        createdByUserId: "user_1",
        title: "Notes",
        version: 0,
        visibility: "PRIVATE",
      }),
      select: { id: true },
    });
    expect(mocks.prisma.documentRevisionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        body: "Body",
        documentId: "document_new",
        title: "Notes",
        version: 1,
      }),
      select: { id: true },
    });
    expect(mocks.prisma.documentUpdate).toHaveBeenCalledWith({
      where: { id: "document_new" },
      data: { currentRevisionId: "revision_new", version: 1 },
    });
    expect(result.document.id).toBe("document_new");
  });

  it("returns an identical idempotent create and rejects changed content", async () => {
    mocks.prisma.documentFindUnique.mockResolvedValue({
      id: DOCUMENT.id,
      requestHash: "different_hash",
    });

    await expect(
      createDocument({
        body: "Body",
        createdByUserId: "user_1",
        idempotencyKey: "retry_1",
        title: "Notes",
      }),
    ).rejects.toThrow(DOCUMENT_IDEMPOTENCY_CONFLICT_MESSAGE);
    expect(mocks.prisma.transaction).not.toHaveBeenCalled();
  });
});

describe("optimistic document updates", () => {
  it("rejects a stale expected version before writing", async () => {
    mocks.prisma.documentFindFirst.mockResolvedValue(DOCUMENT);

    await expect(
      updateDocument({
        body: "New body",
        documentId: DOCUMENT.id,
        editorUserId: "user_1",
        expectedVersion: 2,
      }),
    ).rejects.toThrow(DOCUMENT_CONFLICT_MESSAGE);
    expect(mocks.prisma.transaction).not.toHaveBeenCalled();
  });

  it("appends a revision and stales prior exact-revision reviews", async () => {
    const nextRevision = {
      ...REVISION,
      id: "revision_4",
      version: 4,
      body: "New body",
    };
    const updatedDocument = {
      ...DOCUMENT,
      version: 4,
      currentRevisionId: nextRevision.id,
      currentRevision: nextRevision,
    };
    mocks.prisma.documentFindFirst
      .mockResolvedValueOnce(DOCUMENT)
      .mockResolvedValueOnce(updatedDocument);
    mocks.prisma.documentUpdateMany.mockResolvedValue({ count: 1 });
    mocks.prisma.documentRevisionCreate.mockResolvedValue({
      id: nextRevision.id,
    });
    mocks.prisma.documentUpdate.mockResolvedValue(updatedDocument);

    const result = await updateDocument({
      body: "New body",
      documentId: DOCUMENT.id,
      editorUserId: "user_1",
      expectedVersion: 3,
    });

    expect(mocks.prisma.documentUpdateMany).toHaveBeenCalledWith({
      where: { id: DOCUMENT.id, version: 3, deletedAt: null },
      data: expect.objectContaining({ version: 4 }),
    });
    expect(mocks.prisma.documentRevisionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        body: "New body",
        documentId: DOCUMENT.id,
        version: 4,
      }),
      select: { id: true },
    });
    expect(mocks.invalidateDocumentReviewsForDocument).toHaveBeenCalledWith(
      expect.objectContaining({ document: expect.any(Object) }),
      DOCUMENT.id,
    );
    expect(result.revision.id).toBe("revision_4");
  });

  it("does not stale reviews when the optimistic version claim loses a race", async () => {
    mocks.prisma.documentFindFirst.mockResolvedValue(DOCUMENT);
    mocks.prisma.documentUpdateMany.mockResolvedValue({ count: 0 });

    await expect(
      updateDocument({
        body: "New body",
        documentId: DOCUMENT.id,
        editorUserId: "user_1",
        expectedVersion: 3,
      }),
    ).rejects.toThrow(DOCUMENT_CONFLICT_MESSAGE);

    expect(mocks.prisma.documentRevisionCreate).not.toHaveBeenCalled();
    expect(mocks.invalidateDocumentReviewsForDocument).not.toHaveBeenCalled();
  });
});

describe("document boundaries", () => {
  it("serializes the selected revision without exposing its creator", () => {
    const view: DocumentView = {
      document: DOCUMENT,
      revision: REVISION,
      effectivePermission: "FULL_ACCESS",
      visibleParentDocumentId: null,
      visibleTaskId: "task_1",
      viewerCanEdit: true,
      versions: [],
    };

    expect(toDocumentDto(view)).toEqual({
      body: REVISION.body,
      createdAt: "2026-07-01T00:00:00.000Z",
      effectivePermission: "FULL_ACCESS",
      id: DOCUMENT.id,
      isCurrent: true,
      jurisdictionId: "jurisdiction_1",
      organizationId: null,
      parentDocumentId: null,
      revisionId: REVISION.id,
      sourceKey: null,
      sourceUrl: null,
      taskId: "task_1",
      title: REVISION.title,
      updatedAt: "2026-07-01T00:00:00.000Z",
      version: 3,
      visibility: "PRIVATE",
    });
  });

  it("returns only summaries whose access resolver permits them", async () => {
    mocks.prisma.documentFindMany.mockResolvedValue([
      {
        id: "visible",
        organizationId: null,
        taskId: null,
        title: "Visible",
        updatedAt: DOCUMENT.updatedAt,
        version: 1,
        visibility: "PUBLIC",
      },
      {
        id: "private",
        organizationId: null,
        taskId: null,
        title: "Private",
        updatedAt: DOCUMENT.updatedAt,
        version: 1,
        visibility: "PRIVATE",
      },
    ]);
    mocks.access.resolveDocumentAccessBatch.mockResolvedValue(
      new Map([
        ["visible", "VIEW"],
        ["private", null],
      ]),
    );

    const result = await listDocumentsForViewer({ userId: null });

    expect(result.map((row) => row.id)).toEqual(["visible"]);
    expect(mocks.access.resolveDocumentAccessBatch).toHaveBeenCalledWith(
      ["visible", "private"],
      null,
    );
  });
});
