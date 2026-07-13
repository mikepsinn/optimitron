import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertUserCanViewTask: vi.fn(),
  canUserViewTask: vi.fn(),
  prisma: {
    documentCreate: vi.fn(),
    documentFindFirst: vi.fn(),
    documentFindMany: vi.fn(),
    taskFindUnique: vi.fn(),
    transaction: vi.fn(),
    userFindUnique: vi.fn(),
  },
  tx: {
    documentCreate: vi.fn(),
    documentFindFirst: vi.fn(),
    documentUpdate: vi.fn(),
    taskFindUnique: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.prisma.transaction,
    document: {
      create: mocks.prisma.documentCreate,
      findFirst: mocks.prisma.documentFindFirst,
      findMany: mocks.prisma.documentFindMany,
    },
    task: {
      findUnique: mocks.prisma.taskFindUnique,
    },
    user: {
      findUnique: mocks.prisma.userFindUnique,
    },
  },
}));

vi.mock("@/lib/tasks/task-visibility.server", () => ({
  assertUserCanViewTask: mocks.assertUserCanViewTask,
  canUserViewTask: mocks.canUserViewTask,
}));

import {
  createDocument,
  DOCUMENT_EMPTY_PATCH_MESSAGE,
  DOCUMENT_PRIVATE_TASK_MESSAGE,
  getDocumentForViewer,
  listDocumentsForViewer,
  listDocumentSummariesForViewer,
  toDocumentDto,
  updateDocument,
} from "../documents.server";

function createTxClient() {
  return {
    document: {
      create: mocks.tx.documentCreate,
      findFirst: mocks.tx.documentFindFirst,
      update: mocks.tx.documentUpdate,
    },
    task: {
      findUnique: mocks.tx.taskFindUnique,
    },
  };
}

interface TestDocumentRow {
  id: string;
  documentKey: string;
  jurisdictionId: string | null;
  taskId: string | null;
  title: string;
  body: string;
  version: number;
  isCurrent: boolean;
  visibility: "PUBLIC" | "PRIVATE";
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const CURRENT_ROW: TestDocumentRow = {
  id: "doc_v3",
  documentKey: "key_1",
  jurisdictionId: "jur_1",
  taskId: "task_1",
  title: "Plan",
  body: "# Plan\n\nold body",
  version: 3,
  isCurrent: true,
  visibility: "PRIVATE",
  createdByUserId: "creator_1",
  createdAt: new Date("2026-07-01T00:00:00Z"),
  updatedAt: new Date("2026-07-01T00:00:00Z"),
  deletedAt: null,
};

/** Wires prisma.document.findFirst so the "specific requested row" call
 * (filtered by id) and the "current row for the chain" call (filtered by
 * isCurrent) can return different rows, matching getDocumentForViewer's two
 * lookups. */
function mockDocumentLookup(
  requested: TestDocumentRow | null,
  current: TestDocumentRow | null = requested,
) {
  mocks.prisma.documentFindFirst.mockImplementation(
    async ({ where }: { where: Record<string, unknown> }) =>
      "isCurrent" in where ? current : requested,
  );
}

beforeEach(() => {
  for (const group of [mocks.prisma, mocks.tx]) {
    for (const fn of Object.values(group)) {
      fn.mockReset();
    }
  }
  mocks.assertUserCanViewTask.mockReset();
  mocks.assertUserCanViewTask.mockResolvedValue(undefined);
  mocks.canUserViewTask.mockReset();
  mocks.canUserViewTask.mockResolvedValue(true);
  mocks.prisma.transaction.mockImplementation(
    async (cb: (tx: ReturnType<typeof createTxClient>) => unknown) =>
      cb(createTxClient()),
  );
});

describe("updateDocument version transition", () => {
  it("flips the current row and appends version + 1 in one transaction", async () => {
    mocks.tx.documentFindFirst
      .mockResolvedValueOnce({
        documentKey: "key_1",
        createdByUserId: "creator_1",
      })
      .mockResolvedValueOnce(CURRENT_ROW);
    mocks.tx.documentCreate.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        ...CURRENT_ROW,
        ...data,
        id: "doc_v4",
      }),
    );

    const result = await updateDocument({
      documentId: "doc_v3",
      editorUserId: "creator_1",
      body: "# Plan\n\nnew body",
    });

    expect(mocks.prisma.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.tx.documentUpdate).toHaveBeenCalledWith({
      where: { id: "doc_v3" },
      data: { isCurrent: false },
    });
    expect(mocks.tx.documentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        documentKey: "key_1",
        version: 4,
        isCurrent: true,
        body: "# Plan\n\nnew body",
        // Untouched fields carry forward from the current version.
        title: "Plan",
        taskId: "task_1",
        jurisdictionId: "jur_1",
        visibility: "PRIVATE",
        createdByUserId: "creator_1",
      }),
    });
    expect(result.version).toBe(4);
    // Visibility didn't change, so the private-task guard never queries it.
    expect(mocks.tx.taskFindUnique).not.toHaveBeenCalled();
  });

  it("rejects non-creators with the 404-mapped error and writes nothing", async () => {
    mocks.tx.documentFindFirst.mockResolvedValueOnce({
      documentKey: "key_1",
      createdByUserId: "creator_1",
    });

    await expect(
      updateDocument({
        documentId: "doc_v3",
        editorUserId: "stranger_1",
        body: "hijack",
      }),
    ).rejects.toThrow("Document not found");

    expect(mocks.tx.documentUpdate).not.toHaveBeenCalled();
    expect(mocks.tx.documentCreate).not.toHaveBeenCalled();
  });

  it("rejects when the document does not exist", async () => {
    mocks.tx.documentFindFirst.mockResolvedValueOnce(null);

    await expect(
      updateDocument({
        documentId: "missing",
        editorUserId: "creator_1",
        body: "x",
      }),
    ).rejects.toThrow("Document not found");
  });

  it("rejects an empty replacement body before writing", async () => {
    mocks.tx.documentFindFirst
      .mockResolvedValueOnce({
        documentKey: "key_1",
        createdByUserId: "creator_1",
      })
      .mockResolvedValueOnce(CURRENT_ROW);

    await expect(
      updateDocument({
        documentId: "doc_v3",
        editorUserId: "creator_1",
        body: "   ",
      }),
    ).rejects.toThrow("Body cannot be empty");

    expect(mocks.tx.documentUpdate).not.toHaveBeenCalled();
    expect(mocks.tx.documentCreate).not.toHaveBeenCalled();
  });

  it("rejects a patch touching none of title/body/visibility before opening a transaction", async () => {
    await expect(
      updateDocument({ documentId: "doc_v3", editorUserId: "creator_1" }),
    ).rejects.toThrow(DOCUMENT_EMPTY_PATCH_MESSAGE);

    expect(mocks.prisma.transaction).not.toHaveBeenCalled();
  });

  it("refuses to flip visibility to PUBLIC while the attached task is private", async () => {
    mocks.tx.documentFindFirst
      .mockResolvedValueOnce({
        documentKey: "key_1",
        createdByUserId: "creator_1",
      })
      .mockResolvedValueOnce(CURRENT_ROW); // taskId: "task_1"
    mocks.tx.taskFindUnique.mockResolvedValue({ isPublic: false });

    await expect(
      updateDocument({
        documentId: "doc_v3",
        editorUserId: "creator_1",
        visibility: "PUBLIC",
      }),
    ).rejects.toThrow(DOCUMENT_PRIVATE_TASK_MESSAGE);

    expect(mocks.tx.documentUpdate).not.toHaveBeenCalled();
    expect(mocks.tx.documentCreate).not.toHaveBeenCalled();
  });

  it("allows flipping visibility to PUBLIC when the attached task is public", async () => {
    mocks.tx.documentFindFirst
      .mockResolvedValueOnce({
        documentKey: "key_1",
        createdByUserId: "creator_1",
      })
      .mockResolvedValueOnce(CURRENT_ROW);
    mocks.tx.taskFindUnique.mockResolvedValue({ isPublic: true });
    mocks.tx.documentCreate.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        ...CURRENT_ROW,
        ...data,
        id: "doc_v4",
      }),
    );

    const result = await updateDocument({
      documentId: "doc_v3",
      editorUserId: "creator_1",
      visibility: "PUBLIC",
    });

    expect(result.visibility).toBe("PUBLIC");
  });
});

describe("createDocument", () => {
  it("defaults to PRIVATE and gates task attachment on task visibility", async () => {
    mocks.prisma.taskFindUnique.mockResolvedValue({
      jurisdictionId: "jur_9",
      isPublic: false,
    });
    mocks.prisma.documentCreate.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        ...CURRENT_ROW,
        ...data,
        id: "doc_new",
      }),
    );

    await createDocument({
      title: "Notes",
      body: "text",
      createdByUserId: "creator_1",
      taskId: "task_9",
    });

    expect(mocks.assertUserCanViewTask).toHaveBeenCalledWith(
      "task_9",
      "creator_1",
    );
    expect(mocks.prisma.documentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        visibility: "PRIVATE",
        taskId: "task_9",
        // Inherits the task's jurisdiction when none is given.
        jurisdictionId: "jur_9",
      }),
    });
  });

  it("refuses to attach to a task the creator cannot view", async () => {
    mocks.assertUserCanViewTask.mockRejectedValue(new Error("Task not found"));

    await expect(
      createDocument({
        title: "Notes",
        body: "text",
        createdByUserId: "stranger_1",
        taskId: "private_task",
      }),
    ).rejects.toThrow("Task not found");

    expect(mocks.prisma.documentCreate).not.toHaveBeenCalled();
  });

  it("refuses a PUBLIC document attached to a private task", async () => {
    mocks.prisma.taskFindUnique.mockResolvedValue({
      jurisdictionId: "jur_9",
      isPublic: false,
    });

    await expect(
      createDocument({
        title: "Notes",
        body: "text",
        createdByUserId: "creator_1",
        taskId: "task_9",
        visibility: "PUBLIC",
      }),
    ).rejects.toThrow(DOCUMENT_PRIVATE_TASK_MESSAGE);

    expect(mocks.prisma.documentCreate).not.toHaveBeenCalled();
  });

  it("allows a PUBLIC document attached to a public task", async () => {
    mocks.prisma.taskFindUnique.mockResolvedValue({
      jurisdictionId: "jur_9",
      isPublic: true,
    });
    mocks.prisma.documentCreate.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        ...CURRENT_ROW,
        ...data,
        id: "doc_new",
      }),
    );

    const result = await createDocument({
      title: "Notes",
      body: "text",
      createdByUserId: "creator_1",
      taskId: "task_9",
      visibility: "PUBLIC",
    });

    expect(result.visibility).toBe("PUBLIC");
  });
});

describe("getDocumentForViewer visibility gate", () => {
  it("returns null for anonymous viewers on a private document", async () => {
    mockDocumentLookup(CURRENT_ROW);

    await expect(getDocumentForViewer("doc_v3", null)).resolves.toBeNull();

    // No version list leaks when the gate denies.
    expect(mocks.prisma.documentFindMany).not.toHaveBeenCalled();
  });

  it("returns the document and versions for its creator", async () => {
    mockDocumentLookup(CURRENT_ROW);
    mocks.prisma.userFindUnique.mockResolvedValue({
      id: "creator_1",
      isAdmin: false,
    });
    mocks.prisma.documentFindMany.mockResolvedValue([
      {
        id: "doc_v3",
        version: 3,
        isCurrent: true,
        title: "Plan",
        createdAt: CURRENT_ROW.createdAt,
      },
    ]);

    const result = await getDocumentForViewer("doc_v3", "creator_1");

    expect(result?.document.id).toBe("doc_v3");
    expect(result?.viewerCanEdit).toBe(true);
    expect(result?.versions).toHaveLength(1);
  });

  it("returns public documents to anonymous viewers without edit rights", async () => {
    mockDocumentLookup({ ...CURRENT_ROW, visibility: "PUBLIC" });
    mocks.prisma.documentFindMany.mockResolvedValue([]);

    const result = await getDocumentForViewer("doc_v3", null);

    expect(result?.document.visibility).toBe("PUBLIC");
    expect(result?.viewerCanEdit).toBe(false);
  });

  it("lets admins read private documents they did not create", async () => {
    mockDocumentLookup(CURRENT_ROW);
    mocks.prisma.userFindUnique.mockResolvedValue({
      id: "admin_1",
      isAdmin: true,
    });
    mocks.prisma.documentFindMany.mockResolvedValue([]);

    const result = await getDocumentForViewer("doc_v3", "admin_1");

    expect(result?.document.id).toBe("doc_v3");
    expect(result?.viewerCanEdit).toBe(false);
  });

  it("denies an old PUBLIC version once the chain's current version is PRIVATE", async () => {
    // Regression test: visibility is a chain-level property. A version that
    // was PUBLIC when written must NOT stay independently readable once a
    // later version in the same documentKey flips the chain PRIVATE.
    const oldPublicRow: TestDocumentRow = {
      ...CURRENT_ROW,
      id: "doc_v1",
      version: 1,
      isCurrent: false,
      visibility: "PUBLIC",
    };
    const currentPrivateRow: TestDocumentRow = {
      ...CURRENT_ROW,
      id: "doc_v2",
      version: 2,
      isCurrent: true,
      visibility: "PRIVATE",
    };
    mockDocumentLookup(oldPublicRow, currentPrivateRow);

    await expect(getDocumentForViewer("doc_v1", null)).resolves.toBeNull();
    expect(mocks.prisma.documentFindMany).not.toHaveBeenCalled();
  });

  it("treats a soft-deleted document as not found", async () => {
    // Mimics Prisma's WHERE filtering: only "find" the row when the caller
    // actually asked for deletedAt: null, so this fails if that filter is
    // ever dropped from the query.
    mocks.prisma.documentFindFirst.mockImplementation(
      async ({ where }: { where: { deletedAt?: null } }) =>
        where.deletedAt === null
          ? null
          : { ...CURRENT_ROW, deletedAt: new Date("2026-07-10T00:00:00Z") },
    );

    await expect(
      getDocumentForViewer("doc_v3", "creator_1"),
    ).resolves.toBeNull();
  });
});

describe("listDocumentsForViewer", () => {
  it("returns [] without querying documents when the viewer can't view the task", async () => {
    mocks.canUserViewTask.mockResolvedValue(false);

    const result = await listDocumentsForViewer({
      userId: "stranger_1",
      taskId: "private_task",
    });

    expect(result).toEqual([]);
    expect(mocks.prisma.documentFindMany).not.toHaveBeenCalled();
  });

  it("includes private documents from any creator for admin viewers", async () => {
    mocks.prisma.userFindUnique.mockResolvedValue({
      id: "admin_1",
      isAdmin: true,
    });
    mocks.prisma.documentFindMany.mockResolvedValue([CURRENT_ROW]);

    await listDocumentsForViewer({ userId: "admin_1" });

    expect(mocks.prisma.documentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { visibility: "PUBLIC" },
            { visibility: "PRIVATE" },
          ]),
        }),
      }),
    );
  });

  it("excludes soft-deleted rows", async () => {
    mocks.prisma.userFindUnique.mockResolvedValue(null);
    mocks.prisma.documentFindMany.mockImplementation(
      async ({ where }: { where: { deletedAt?: null } }) =>
        where.deletedAt === null
          ? []
          : [{ ...CURRENT_ROW, visibility: "PUBLIC", deletedAt: new Date() }],
    );

    await expect(listDocumentsForViewer({ userId: null })).resolves.toEqual(
      [],
    );
  });
});

describe("listDocumentSummariesForViewer", () => {
  it("returns id/title/version only, gated by task visibility", async () => {
    mocks.prisma.documentFindMany.mockResolvedValue([
      { id: "doc_v3", title: "Plan", version: 3 },
    ]);

    const result = await listDocumentSummariesForViewer({
      userId: null,
      taskId: "task_1",
    });

    expect(mocks.canUserViewTask).toHaveBeenCalledWith("task_1", null);
    expect(mocks.prisma.documentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { id: true, title: true, version: true },
      }),
    );
    expect(result).toEqual([{ id: "doc_v3", title: "Plan", version: 3 }]);
  });

  it("returns [] when the viewer can't view the task", async () => {
    mocks.canUserViewTask.mockResolvedValue(false);

    const result = await listDocumentSummariesForViewer({
      userId: "stranger_1",
      taskId: "private_task",
    });

    expect(result).toEqual([]);
    expect(mocks.prisma.documentFindMany).not.toHaveBeenCalled();
  });
});

describe("toDocumentDto boundary", () => {
  it("serializes dates to ISO strings, passes scalars through, and omits createdByUserId", () => {
    const dto = toDocumentDto(CURRENT_ROW);

    expect(dto).toEqual({
      id: "doc_v3",
      documentKey: "key_1",
      jurisdictionId: "jur_1",
      taskId: "task_1",
      title: "Plan",
      body: "# Plan\n\nold body",
      version: 3,
      isCurrent: true,
      visibility: "PRIVATE",
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
    });
    expect(dto).not.toHaveProperty("createdByUserId");
  });
});
