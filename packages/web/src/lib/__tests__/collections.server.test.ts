import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  access: {
    assertCollectionAccess: vi.fn(),
    assertCollectionRecordAccess: vi.fn(),
    assertDocumentAccess: vi.fn(),
    lockContentResources: vi.fn(),
    resolveCollectionAccess: vi.fn(),
    resolveCollectionAccessBatch: vi.fn(),
  },
  canManageOrganization: vi.fn(),
  canUserViewOrganization: vi.fn(),
  canUserViewTask: vi.fn(),
  prisma: {
    collectionFindFirst: vi.fn(),
    collectionRecordCreate: vi.fn(),
    collectionRecordFindFirst: vi.fn(),
    collectionRecordFindMany: vi.fn(),
    collectionRecordFindUnique: vi.fn(),
    collectionRecordUpdateMany: vi.fn(),
    collectionRelationCreateMany: vi.fn(),
    collectionRelationUpdateMany: vi.fn(),
    personFindFirst: vi.fn(),
    transaction: vi.fn(),
  },
}));

vi.mock("@/lib/content-access.server", () => ({
  assertCollectionAccess: mocks.access.assertCollectionAccess,
  assertCollectionRecordAccess: mocks.access.assertCollectionRecordAccess,
  assertDocumentAccess: mocks.access.assertDocumentAccess,
  hasContentAccess: () => true,
  lockContentResources: mocks.access.lockContentResources,
  resolveCollectionAccess: mocks.access.resolveCollectionAccess,
  resolveCollectionAccessBatch: mocks.access.resolveCollectionAccessBatch,
}));

vi.mock("@/lib/organization.server", () => ({
  canManageOrganization: mocks.canManageOrganization,
  canUserViewOrganization: mocks.canUserViewOrganization,
}));

vi.mock("@/lib/tasks/task-visibility.server", () => ({
  canUserViewTask: mocks.canUserViewTask,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.prisma.transaction,
    collection: { findFirst: mocks.prisma.collectionFindFirst },
    collectionRecord: {
      create: mocks.prisma.collectionRecordCreate,
      findFirst: mocks.prisma.collectionRecordFindFirst,
      findMany: mocks.prisma.collectionRecordFindMany,
      findUnique: mocks.prisma.collectionRecordFindUnique,
      updateMany: mocks.prisma.collectionRecordUpdateMany,
    },
    collectionRelation: {
      createMany: mocks.prisma.collectionRelationCreateMany,
      updateMany: mocks.prisma.collectionRelationUpdateMany,
    },
    person: { findFirst: mocks.prisma.personFindFirst },
  },
}));

import {
  createCollectionRecord,
  queryCollectionRecords,
  upsertCollectionRecordsBatch,
  updateCollectionRecord,
} from "../collections.server";

const NOW = new Date("2026-07-14T12:00:00Z");

function field(overrides: Record<string, unknown> = {}) {
  return {
    id: "field_title",
    collectionId: "collection_1",
    targetCollectionId: null,
    createdByUserId: "user_1",
    key: "title",
    name: "Title",
    type: "TEXT",
    required: true,
    position: 0,
    optionsJson: null,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    ...overrides,
  };
}

function collection(fields = [field()]) {
  return {
    id: "collection_1",
    jurisdictionId: null,
    organizationId: null,
    createdByUserId: "user_1",
    sourceArtifactId: null,
    name: "Projects",
    description: null,
    visibility: "PRIVATE",
    version: 1,
    sourceKey: null,
    sourceUrl: null,
    idempotencyKey: null,
    requestHash: null,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    fields,
    views: [],
  };
}

function record(id: string, valuesJson: Record<string, unknown>, version = 1) {
  return {
    id,
    collectionId: "collection_1",
    createdByUserId: "user_1",
    sourceArtifactId: null,
    valuesJson,
    searchText: Object.values(valuesJson).join("\n"),
    taskId: null,
    personId: null,
    organizationId: null,
    documentId: null,
    version,
    sourceKey: null,
    sourceUrl: null,
    idempotencyKey: null,
    requestHash: null,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    outgoingRelations: [],
  };
}

function txClient() {
  return {
    collection: { findFirst: mocks.prisma.collectionFindFirst },
    collectionRecord: {
      create: mocks.prisma.collectionRecordCreate,
      findFirst: mocks.prisma.collectionRecordFindFirst,
      findUnique: mocks.prisma.collectionRecordFindUnique,
      updateMany: mocks.prisma.collectionRecordUpdateMany,
    },
    collectionRelation: {
      createMany: mocks.prisma.collectionRelationCreateMany,
      updateMany: mocks.prisma.collectionRelationUpdateMany,
    },
  };
}

beforeEach(() => {
  for (const group of [mocks.access, mocks.prisma]) {
    for (const fn of Object.values(group)) fn.mockReset();
  }
  mocks.canManageOrganization.mockReset();
  mocks.canManageOrganization.mockResolvedValue(true);
  mocks.canUserViewOrganization.mockReset();
  mocks.canUserViewOrganization.mockResolvedValue(true);
  mocks.canUserViewTask.mockReset();
  mocks.canUserViewTask.mockResolvedValue(true);
  mocks.access.assertCollectionAccess.mockResolvedValue("FULL_ACCESS");
  mocks.access.assertCollectionRecordAccess.mockResolvedValue({
    collectionId: "collection_1",
  });
  mocks.access.assertDocumentAccess.mockResolvedValue("VIEW");
  mocks.access.resolveCollectionAccess.mockResolvedValue("FULL_ACCESS");
  mocks.access.resolveCollectionAccessBatch.mockResolvedValue(new Map());
  mocks.prisma.collectionFindFirst.mockResolvedValue(collection());
  mocks.prisma.transaction.mockImplementation(
    async (callback: (tx: ReturnType<typeof txClient>) => unknown) =>
      callback(txClient()),
  );
});

describe("collection value contracts", () => {
  it("rejects normal writes to formula outputs", async () => {
    mocks.prisma.collectionFindFirst.mockResolvedValue(
      collection([
        field({
          id: "field_formula",
          key: "roi",
          name: "ROI",
          required: false,
          type: "FORMULA",
          optionsJson: { expression: "revenue / cost" },
        }),
      ]),
    );

    await expect(
      createCollectionRecord({
        collectionId: "collection_1",
        createdByUserId: "user_1",
        values: { roi: 4.2 },
      }),
    ).rejects.toThrow("roi is read-only");
    expect(mocks.prisma.transaction).not.toHaveBeenCalled();
  });

  it("preserves imported formula outputs without executing their expression", async () => {
    mocks.prisma.collectionFindFirst.mockResolvedValue(
      collection([
        field({
          id: "field_formula",
          key: "roi",
          name: "ROI",
          required: false,
          type: "FORMULA",
          optionsJson: { expression: "revenue / cost" },
        }),
      ]),
    );
    mocks.prisma.collectionRecordCreate.mockResolvedValue({ id: "record_1" });
    mocks.prisma.collectionRecordFindFirst.mockResolvedValue(
      record("record_1", { roi: 4.2 }),
    );

    const result = await createCollectionRecord({
      allowImportedComputedValues: true,
      collectionId: "collection_1",
      createdByUserId: "user_1",
      values: { roi: 4.2 },
    });

    expect(mocks.prisma.collectionRecordCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ valuesJson: { roi: 4.2 } }),
      select: { id: true },
    });
    expect(result.values).toEqual({ roi: 4.2 });
  });

  it("rejects non-finite numbers before a write", async () => {
    mocks.prisma.collectionFindFirst.mockResolvedValue(
      collection([
        field({ key: "score", name: "Score", required: false, type: "NUMBER" }),
      ]),
    );

    await expect(
      createCollectionRecord({
        collectionId: "collection_1",
        createdByUserId: "user_1",
        values: { score: Number.POSITIVE_INFINITY },
      }),
    ).rejects.toThrow("score must be a finite number");
  });

  it("rejects a record write when the collection schema changed before locking", async () => {
    mocks.prisma.collectionFindFirst
      .mockResolvedValueOnce(collection())
      .mockResolvedValueOnce({ ...collection(), version: 2 });

    await expect(
      createCollectionRecord({
        collectionId: "collection_1",
        createdByUserId: "user_1",
        values: { title: "Stale schema" },
      }),
    ).rejects.toThrow("Collection changed since it was loaded");
    expect(mocks.prisma.collectionRecordCreate).not.toHaveBeenCalled();
  });
});

describe("collection record concurrency and query", () => {
  it("redacts organization links the viewer cannot access", async () => {
    mocks.canUserViewOrganization.mockResolvedValue(false);
    mocks.prisma.collectionRecordFindFirst.mockResolvedValue({
      ...record("record_1", { title: "Private operation" }),
      organizationId: "organization_private",
      outgoingRelations: [
        {
          id: "relation_1",
          fieldId: "field_org",
          sourceRecordId: "record_1",
          targetDocumentId: null,
          targetOrganizationId: "organization_private",
          targetPersonId: null,
          targetRecordId: null,
          targetTaskId: null,
          position: 0,
          createdByUserId: "user_1",
          createdAt: NOW,
          updatedAt: NOW,
          deletedAt: null,
          field: { key: "organization", type: "ORGANIZATION" },
        },
      ],
    });

    const { getCollectionRecordForViewer } =
      await import("../collections.server");
    const result = await getCollectionRecordForViewer("record_1", "viewer_1");

    expect(result?.canonicalEntity.organizationId).toBeNull();
    expect(result?.relations).toEqual([]);
  });

  it("rejects stale record edits", async () => {
    mocks.prisma.collectionRecordFindFirst.mockResolvedValue(
      record("record_1", { title: "Current" }, 3),
    );

    await expect(
      updateCollectionRecord({
        editorUserId: "user_1",
        expectedVersion: 2,
        recordId: "record_1",
        values: { title: "Stale" },
      }),
    ).rejects.toThrow("Record changed since it was loaded");
    expect(mocks.prisma.transaction).not.toHaveBeenCalled();
  });

  it("filters, sorts, and cursor-paginates deterministic record results", async () => {
    mocks.prisma.collectionRecordFindMany.mockResolvedValue([
      record("record_a", { title: "Alpha" }),
      record("record_c", { title: "Gamma" }),
      record("record_b", { title: "Beta" }),
    ]);

    const result = await queryCollectionRecords({
      collectionId: "collection_1",
      filters: [{ fieldKey: "title", operator: "contains", value: "a" }],
      sorts: [{ direction: "desc", fieldKey: "title" }],
      limit: 2,
      userId: "user_1",
    });

    expect(result.records.map((row) => row.id)).toEqual([
      "record_c",
      "record_b",
    ]);
    expect(result.nextCursor).toBe("record_b");
  });

  it("searches the complete bounded record set before pagination", async () => {
    mocks.prisma.collectionRecordFindMany.mockResolvedValue([
      record("record_a", { title: "Alpha" }),
      record("record_b", { title: "Beta launch" }),
      record("record_c", { title: "Gamma" }),
    ]);

    const result = await queryCollectionRecords({
      collectionId: "collection_1",
      limit: 1,
      query: "beta",
      userId: "user_1",
    });

    expect(result.records.map((row) => row.id)).toEqual(["record_b"]);
    expect(mocks.prisma.collectionRecordFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10_001 }),
    );
  });

  it("matches a date filter to imported timestamps on the same calendar day", async () => {
    mocks.prisma.collectionFindFirst.mockResolvedValue(
      collection([
        field({ key: "date", name: "Date", required: false, type: "DATE" }),
      ]),
    );
    mocks.prisma.collectionRecordFindMany.mockResolvedValue([
      record("record_a", { date: "2026-07-14T18:30:00.000Z" }),
      record("record_b", { date: "2026-07-15T01:00:00.000Z" }),
    ]);

    const result = await queryCollectionRecords({
      collectionId: "collection_1",
      filters: [{ fieldKey: "date", operator: "equals", value: "2026-07-14" }],
      userId: "user_1",
    });

    expect(result.records.map((row) => row.id)).toEqual(["record_a"]);
  });

  it("rolls back earlier batch edits when a later record is stale", async () => {
    const persisted = new Map([
      ["record_1", record("record_1", { title: "First" }, 1)],
      ["record_2", record("record_2", { title: "Second" }, 2)],
    ]);
    mocks.prisma.collectionRecordFindMany.mockResolvedValue([
      persisted.get("record_1"),
      persisted.get("record_2"),
    ]);
    mocks.prisma.transaction.mockImplementation(async (callback) => {
      const staged = new Map(
        [...persisted].map(([id, row]) => [
          id,
          { ...row, valuesJson: { ...row.valuesJson } },
        ]),
      );
      const result = await callback({
        collection: {
          findFirst: vi.fn().mockResolvedValue({ version: 1 }),
        },
        collectionRecord: {
          findFirst: vi.fn().mockResolvedValue(null),
          findUnique: vi.fn(),
          updateMany: vi.fn(async ({ data, where }) => {
            const current = staged.get(where.id);
            if (
              !current ||
              current.deletedAt ||
              current.collectionId !== where.collectionId ||
              current.version !== where.version
            ) {
              return { count: 0 };
            }
            staged.set(where.id, {
              ...current,
              searchText: data.searchText,
              valuesJson: data.valuesJson,
              version: current.version + 1,
            });
            return { count: 1 };
          }),
        },
        collectionRelation: {
          createMany: vi.fn(),
          updateMany: vi.fn(),
        },
      });
      persisted.clear();
      for (const [id, row] of staged) persisted.set(id, row);
      return result;
    });

    await expect(
      upsertCollectionRecordsBatch({
        collectionId: "collection_1",
        editorUserId: "user_1",
        operations: [
          {
            operation: "update",
            expectedVersion: 1,
            recordId: "record_1",
            values: { title: "Changed first" },
          },
          {
            operation: "update",
            expectedVersion: 1,
            recordId: "record_2",
            values: { title: "Stale second" },
          },
        ],
      }),
    ).rejects.toThrow("Record changed since it was loaded");

    expect(persisted.get("record_1")).toMatchObject({
      valuesJson: { title: "First" },
      version: 1,
    });
    expect(persisted.get("record_2")).toMatchObject({
      valuesJson: { title: "Second" },
      version: 2,
    });
  });

  it("returns an exact lost-response batch retry as unchanged", async () => {
    const replayed = record("record_1", { title: "Already saved" }, 2);
    mocks.prisma.collectionRecordFindMany.mockResolvedValue([replayed]);
    mocks.prisma.collectionRecordUpdateMany.mockResolvedValue({ count: 0 });
    mocks.prisma.collectionRecordFindFirst.mockResolvedValue(replayed);

    const result = await upsertCollectionRecordsBatch({
      collectionId: "collection_1",
      editorUserId: "user_1",
      operations: [
        {
          operation: "update",
          expectedVersion: 1,
          recordId: "record_1",
          values: { title: "Already saved" },
        },
      ],
    });

    expect(result).toEqual([expect.objectContaining({ action: "unchanged" })]);
  });
});
