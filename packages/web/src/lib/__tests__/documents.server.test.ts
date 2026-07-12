import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertUserCanViewTask: vi.fn(),
  prisma: {
    documentCreate: vi.fn(),
    documentFindMany: vi.fn(),
    documentFindUnique: vi.fn(),
    taskFindUnique: vi.fn(),
    transaction: vi.fn(),
    userFindUnique: vi.fn(),
  },
  tx: {
    documentCreate: vi.fn(),
    documentFindFirst: vi.fn(),
    documentFindUnique: vi.fn(),
    documentUpdate: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.prisma.transaction,
    document: {
      create: mocks.prisma.documentCreate,
      findMany: mocks.prisma.documentFindMany,
      findUnique: mocks.prisma.documentFindUnique,
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
}));

import {
  createDocument,
  getDocumentForViewer,
  toDocumentDto,
  updateDocument,
} from "../documents.server";

function createTxClient() {
  return {
    document: {
      create: mocks.tx.documentCreate,
      findFirst: mocks.tx.documentFindFirst,
      findUnique: mocks.tx.documentFindUnique,
      update: mocks.tx.documentUpdate,
    },
  };
}

const CURRENT_ROW = {
  id: "doc_v3",
  documentKey: "key_1",
  jurisdictionId: "jur_1",
  taskId: "task_1",
  title: "Plan",
  body: "# Plan\n\nold body",
  version: 3,
  isCurrent: true,
  visibility: "PRIVATE" as const,
  createdByUserId: "creator_1",
  createdAt: new Date("2026-07-01T00:00:00Z"),
  updatedAt: new Date("2026-07-01T00:00:00Z"),
};

beforeEach(() => {
  for (const group of [mocks.prisma, mocks.tx]) {
    for (const fn of Object.values(group)) {
      fn.mockReset();
    }
  }
  mocks.assertUserCanViewTask.mockReset();
  mocks.assertUserCanViewTask.mockResolvedValue(undefined);
  mocks.prisma.transaction.mockImplementation(
    async (cb: (tx: ReturnType<typeof createTxClient>) => unknown) =>
      cb(createTxClient()),
  );
});

describe("updateDocument version transition", () => {
  it("flips the current row and appends version + 1 in one transaction", async () => {
    mocks.tx.documentFindUnique.mockResolvedValue({
      documentKey: "key_1",
      createdByUserId: "creator_1",
    });
    mocks.tx.documentFindFirst.mockResolvedValue(CURRENT_ROW);
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
  });

  it("rejects non-creators with the 404-mapped error and writes nothing", async () => {
    mocks.tx.documentFindUnique.mockResolvedValue({
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
    mocks.tx.documentFindUnique.mockResolvedValue(null);

    await expect(
      updateDocument({
        documentId: "missing",
        editorUserId: "creator_1",
        body: "x",
      }),
    ).rejects.toThrow("Document not found");
  });

  it("rejects an empty replacement body before writing", async () => {
    mocks.tx.documentFindUnique.mockResolvedValue({
      documentKey: "key_1",
      createdByUserId: "creator_1",
    });
    mocks.tx.documentFindFirst.mockResolvedValue(CURRENT_ROW);

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
});

describe("createDocument", () => {
  it("defaults to PRIVATE and gates task attachment on task visibility", async () => {
    mocks.prisma.taskFindUnique.mockResolvedValue({ jurisdictionId: "jur_9" });
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
});

describe("getDocumentForViewer visibility gate", () => {
  it("returns null for anonymous viewers on a private document", async () => {
    mocks.prisma.documentFindUnique.mockResolvedValue(CURRENT_ROW);

    await expect(getDocumentForViewer("doc_v3", null)).resolves.toBeNull();

    // No version list leaks when the gate denies.
    expect(mocks.prisma.documentFindMany).not.toHaveBeenCalled();
  });

  it("returns the document and versions for its creator", async () => {
    mocks.prisma.documentFindUnique.mockResolvedValue(CURRENT_ROW);
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
    mocks.prisma.documentFindUnique.mockResolvedValue({
      ...CURRENT_ROW,
      visibility: "PUBLIC",
    });
    mocks.prisma.documentFindMany.mockResolvedValue([]);

    const result = await getDocumentForViewer("doc_v3", null);

    expect(result?.document.visibility).toBe("PUBLIC");
    expect(result?.viewerCanEdit).toBe(false);
  });

  it("lets admins read private documents they did not create", async () => {
    mocks.prisma.documentFindUnique.mockResolvedValue(CURRENT_ROW);
    mocks.prisma.userFindUnique.mockResolvedValue({
      id: "admin_1",
      isAdmin: true,
    });
    mocks.prisma.documentFindMany.mockResolvedValue([]);

    const result = await getDocumentForViewer("doc_v3", "admin_1");

    expect(result?.document.id).toBe("doc_v3");
    expect(result?.viewerCanEdit).toBe(false);
  });
});

describe("toDocumentDto boundary", () => {
  it("serializes dates to ISO strings and passes scalars through", () => {
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
      createdByUserId: "creator_1",
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
    });
  });
});
