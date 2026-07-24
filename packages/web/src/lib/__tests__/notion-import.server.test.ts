import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CollectionFieldType, ContentVisibility } from "@optimitron/db/enums";
import { sha256CanonicalJson } from "@optimitron/data/parameters";

const mocks = vi.hoisted(() => ({
  assertCollectionAccess: vi.fn(),
  assertDocumentAccess: vi.fn(),
  collectionFindMany: vi.fn(),
  collectionRecordFindMany: vi.fn(),
  contentAttachmentFindMany: vi.fn(),
  documentFindMany: vi.fn(),
  organizationFindMany: vi.fn(),
  personFindMany: vi.fn(),
  sourceArtifactFindMany: vi.fn(),
  sourceArtifactFindUnique: vi.fn(),
  sourceArtifactUpsert: vi.fn(),
  taskFindMany: vi.fn(),
  transaction: vi.fn(),
  userFindFirst: vi.fn(),
}));

vi.mock("@/lib/content-access.server", () => ({
  assertCollectionAccess: mocks.assertCollectionAccess,
  assertCollectionRecordAccess: vi.fn(),
  assertDocumentAccess: mocks.assertDocumentAccess,
  lockContentResources: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: { findMany: mocks.collectionFindMany },
    collectionRecord: { findMany: mocks.collectionRecordFindMany },
    contentAttachment: { findMany: mocks.contentAttachmentFindMany },
    document: { findMany: mocks.documentFindMany },
    organization: { findMany: mocks.organizationFindMany },
    person: { findMany: mocks.personFindMany },
    sourceArtifact: {
      findMany: mocks.sourceArtifactFindMany,
      findUnique: mocks.sourceArtifactFindUnique,
    },
    task: { findMany: mocks.taskFindMany },
    $transaction: mocks.transaction,
    user: { findFirst: mocks.userFindFirst },
  },
}));

vi.mock("@/lib/object-storage.server", () => ({
  deletePrivateObject: vi.fn(),
  uploadPrivateObject: vi.fn(),
}));

import {
  importedDependencyEdgeAction,
  importNotionBundle,
} from "../notion-import.server";
import { notionImportBundleSchema } from "../notion-import.schema";
import { notionOperationalWorkspacesFixture } from "./fixtures/notion-operational-workspaces";

function stableSourceKey(
  kind: string,
  sourceId: string,
  workspaceId = "workspace-1",
): string {
  const workspaceDigest = createHash("sha256")
    .update(workspaceId)
    .digest("hex")
    .slice(0, 32);
  const sourceIdDigest = createHash("sha256")
    .update(sourceId)
    .digest("hex")
    .slice(0, 32);
  return `notion:${workspaceDigest}:${kind}:${sourceIdDigest}`;
}

function cleanJson(value: unknown) {
  return JSON.parse(JSON.stringify(value ?? null)) as unknown;
}

const rawBundle = {
  collections: [
    {
      fields: [
        { key: "name", name: "Name", position: 0, type: "TEXT" },
        {
          key: "score",
          name: "Score",
          optionsJson: {
            dependencies: ["hours", "value"],
            expression: "value / hours",
          },
          position: 1,
          type: "FORMULA",
        },
      ],
      name: "Projects",
      records: [
        {
          sourceId: "record-1",
          values: { name: "Treaty signatures", score: 12.5 },
        },
      ],
      sourceId: "collection-1",
      views: [
        {
          isDefault: true,
          name: "Current work",
          visibleFieldKeys: ["name", "score"],
        },
      ],
    },
  ],
  workspaceId: "workspace-1",
};

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.userFindFirst.mockResolvedValue({ id: "user_1", personId: "person_1" });
  mocks.assertCollectionAccess.mockResolvedValue("FULL_ACCESS");
  mocks.assertDocumentAccess.mockResolvedValue("FULL_ACCESS");
  mocks.collectionFindMany.mockResolvedValue([]);
  mocks.collectionRecordFindMany.mockResolvedValue([]);
  mocks.documentFindMany.mockResolvedValue([]);
  mocks.contentAttachmentFindMany.mockResolvedValue([]);
  mocks.taskFindMany.mockResolvedValue([]);
  mocks.personFindMany.mockResolvedValue([]);
  mocks.organizationFindMany.mockResolvedValue([]);
  mocks.sourceArtifactFindMany.mockResolvedValue([]);
  mocks.sourceArtifactFindUnique.mockResolvedValue(null);
  mocks.sourceArtifactUpsert.mockImplementation(async ({ create }) => ({
    ...create,
    id: "source_artifact_1",
  }));
  mocks.transaction.mockImplementation(async (callback) =>
    callback({
      sourceArtifact: {
        findUnique: mocks.sourceArtifactFindUnique,
        upsert: mocks.sourceArtifactUpsert,
      },
    }),
  );
});

describe("Notion import review", () => {
  it("does not take ownership of active dependencies created elsewhere", () => {
    expect(
      importedDependencyEdgeAction({
        calculationVersion: "manual.v1",
        deletedAt: null,
      }),
    ).toBe("preserve");
    expect(
      importedDependencyEdgeAction({
        calculationVersion: "manual.v1",
        deletedAt: new Date(),
      }),
    ).toBe("conflict");
    expect(
      importedDependencyEdgeAction({
        calculationVersion: "notion-import.v1",
        deletedAt: new Date(),
      }),
    ).toBe("restore");
    expect(importedDependencyEdgeAction(null)).toBe("create");
  });

  it("preserves formula definitions and their current imported outputs", () => {
    const bundle = notionImportBundleSchema.parse(rawBundle);
    const formula = bundle.collections[0]?.fields[1];

    expect(formula).toMatchObject({
      key: "score",
      type: CollectionFieldType.FORMULA,
      optionsJson: {
        dependencies: ["hours", "value"],
        expression: "value / hours",
      },
    });
    expect(bundle.collections[0]?.records[0]?.values.score).toBe(12.5);
  });

  it("dry-runs representative EOS, APG, personal, FEDMI, and IC2EWD data losslessly", async () => {
    const bundle = notionImportBundleSchema.parse(
      notionOperationalWorkspacesFixture,
    );

    const result = await importNotionBundle({
      actorUserId: "user_1",
      bundle,
      dryRun: true,
    });

    expect(result.hasErrors).toBe(false);
    expect(result.summary).toMatchObject({
      create: 18,
      error: 0,
      preserve: 2,
    });
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "document", action: "create" }),
        expect.objectContaining({ kind: "collection", action: "create" }),
        expect.objectContaining({ kind: "record", action: "create" }),
        expect.objectContaining({ kind: "view", action: "create" }),
        expect.objectContaining({
          kind: "preservedArtifact",
          action: "preserve",
        }),
        expect.objectContaining({ kind: "export", action: "preserve" }),
      ]),
    );

    const personalCollection = bundle.collections.find(
      (collection) => collection.sourceId === "collection-personal-tasks",
    );
    expect(personalCollection?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "priority", type: "FORMULA" }),
        expect.objectContaining({ key: "business_total", type: "ROLLUP" }),
      ]),
    );
    expect(personalCollection?.records[0]?.values).toMatchObject({
      business_total: 12000,
      priority: 17.25,
    });
    expect(bundle.documents[0]?.raw).toMatchObject({
      blocks: expect.arrayContaining([
        expect.objectContaining({ type: "unsupported_future_block" }),
      ]),
    });
  });

  it("reports identical collections, records, and views as unchanged", async () => {
    const bundle = notionImportBundleSchema.parse(rawBundle);
    const collection = bundle.collections[0]!;
    const record = collection.records[0]!;
    const collectionHash = await sha256CanonicalJson(
      cleanJson({ normalized: collection, raw: null }),
    );
    const recordHash = await sha256CanonicalJson(
      cleanJson({ normalized: record, raw: null }),
    );
    const collectionSourceKey = stableSourceKey(
      "collection",
      collection.sourceId,
    );
    const recordSourceKey = stableSourceKey("record", record.sourceId);

    mocks.collectionFindMany.mockResolvedValue([
      {
        fields: [
          { id: "field_name", key: "name" },
          { id: "field_score", key: "score" },
        ],
        id: "collection_db_1",
        requestHash: collectionHash,
        sourceKey: collectionSourceKey,
        views: [
          {
            filterJson: [],
            id: "view_db_1",
            isDefault: true,
            name: "Current work",
            sortJson: [],
            visibleFieldIds: ["field_name", "field_score"],
          },
        ],
      },
    ]);
    mocks.collectionRecordFindMany.mockResolvedValue([
      {
        collection: { sourceKey: collectionSourceKey },
        id: "record_db_1",
        requestHash: recordHash,
        sourceKey: recordSourceKey,
      },
    ]);

    const result = await importNotionBundle({
      actorUserId: "user_1",
      bundle,
      dryRun: true,
    });

    expect(result.items).toEqual([
      expect.objectContaining({ action: "unchanged", kind: "collection" }),
      expect.objectContaining({ action: "unchanged", kind: "record" }),
      expect.objectContaining({ action: "unchanged", kind: "view" }),
    ]);
    expect(result.summary).toMatchObject({ unchanged: 3, update: 0 });
  });

  it("updates an imported attachment when its source moves to another document", async () => {
    const pngBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nJ8AAAAASUVORK5CYII=";
    const bytesHash = createHash("sha256")
      .update(Buffer.from(pngBase64, "base64"))
      .digest("hex");
    const storageKey = `content-attachments/notion-${createHash("sha256")
      .update(`workspace-1:file-1:${bytesHash}`)
      .digest("hex")
      .slice(0, 32)}`;
    mocks.documentFindMany.mockResolvedValue([
      {
        id: "document_new",
        requestHash: "old",
        sourceKey: stableSourceKey("document", "document-1"),
      },
    ]);
    mocks.contentAttachmentFindMany.mockResolvedValue([
      {
        collectionRecordId: null,
        deletedAt: null,
        documentId: "document_old",
        id: "attachment_1",
        storageKey,
        uploadedAt: new Date("2026-07-14T12:00:00Z"),
      },
    ]);

    const result = await importNotionBundle({
      actorUserId: "user_1",
      bundle: {
        attachments: [
          {
            base64: pngBase64,
            contentType: "image/png",
            documentSourceId: "document-1",
            fileName: "chart.png",
            sourceId: "file-1",
          },
        ],
        documents: [
          {
            markdown: "Body",
            sourceId: "document-1",
            title: "Document",
          },
        ],
        workspaceId: "workspace-1",
      },
      dryRun: true,
    });

    expect(result.items).toContainEqual(
      expect.objectContaining({
        action: "update",
        kind: "attachment",
        targetId: "attachment_1",
      }),
    );
  });

  it("rejects an attachment move without access to its current document", async () => {
    const pngBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nJ8AAAAASUVORK5CYII=";
    const bytesHash = createHash("sha256")
      .update(Buffer.from(pngBase64, "base64"))
      .digest("hex");
    const storageKey = `content-attachments/notion-${createHash("sha256")
      .update(`workspace-1:file-1:${bytesHash}`)
      .digest("hex")
      .slice(0, 32)}`;
    mocks.documentFindMany.mockResolvedValue([
      {
        id: "document_new",
        requestHash: "old",
        sourceKey: stableSourceKey("document", "document-1"),
      },
    ]);
    mocks.contentAttachmentFindMany.mockResolvedValue([
      {
        collectionRecordId: null,
        deletedAt: null,
        documentId: "document_private",
        id: "attachment_1",
        storageKey,
        uploadedAt: new Date("2026-07-14T12:00:00Z"),
      },
    ]);
    mocks.assertDocumentAccess.mockImplementation(async (documentId) => {
      if (documentId === "document_private") {
        throw new Error("Content not found");
      }
      return "FULL_ACCESS";
    });

    const result = await importNotionBundle({
      actorUserId: "user_1",
      bundle: {
        attachments: [
          {
            base64: pngBase64,
            contentType: "image/png",
            documentSourceId: "document-1",
            fileName: "chart.png",
            sourceId: "file-1",
          },
        ],
        documents: [
          {
            markdown: "Body",
            sourceId: "document-1",
            title: "Document",
          },
        ],
        workspaceId: "workspace-1",
      },
      dryRun: true,
    });

    expect(result.items).toContainEqual(
      expect.objectContaining({
        action: "error",
        kind: "attachment",
        sourceId: "file-1",
      }),
    );
  });

  it("reports unresolved source references in the dry-run review", async () => {
    const result = await importNotionBundle({
      actorUserId: "user_1",
      bundle: {
        tasks: [
          {
            parentSourceId: "missing-parent",
            sourceId: "task-1",
            title: "Prepare application",
          },
        ],
        workspaceId: "workspace-1",
      },
      dryRun: true,
    });

    expect(result.hasErrors).toBe(true);
    expect(result.summary.error).toBe(1);
    expect(result.items).toContainEqual(
      expect.objectContaining({
        action: "error",
        kind: "task",
        sourceId: "task-1",
      }),
    );
  });

  it("does not apply a bundle whose preflight review has errors", async () => {
    const result = await importNotionBundle({
      actorUserId: "user_1",
      bundle: {
        tasks: [
          {
            parentSourceId: "missing-parent",
            sourceId: "task-1",
            title: "Prepare application",
          },
        ],
        workspaceId: "workspace-1",
      },
      dryRun: false,
    });

    expect(result).toMatchObject({ dryRun: false, hasErrors: true });
    expect(result.items).toContainEqual(
      expect.objectContaining({
        action: "error",
        kind: "task",
        sourceId: "task-1",
      }),
    );
  });

  it("reports source ownership conflicts before applying writes", async () => {
    mocks.personFindMany.mockResolvedValue([
      {
        createdByUserId: "another_user",
        id: "person_db_1",
        sourceRef: stableSourceKey("person", "person-1"),
      },
    ]);

    const result = await importNotionBundle({
      actorUserId: "user_1",
      bundle: {
        people: [{ displayName: "Tom", sourceId: "person-1" }],
        workspaceId: "workspace-1",
      },
      dryRun: true,
    });

    expect(result.hasErrors).toBe(true);
    expect(result.items).toContainEqual(
      expect.objectContaining({
        action: "error",
        kind: "person",
        message: expect.stringContaining("owned elsewhere"),
      }),
    );
  });

  it("creates actor-scoped private copies instead of claiming legacy public provenance", async () => {
    const exportItem = {
      exportedAt: "2026-07-16T12:00:00.000Z",
      sourceId: "export-1",
      title: "Workspace export",
    };
    const contentHash = await sha256CanonicalJson(
      cleanJson({ normalized: exportItem, raw: null }),
    );
    const legacySourceKey = `${stableSourceKey("export", exportItem.sourceId)}:${contentHash}`;

    mocks.userFindFirst.mockImplementation(async ({ where }) => ({
      id: where.id,
      personId: `person_${where.id}`,
    }));
    mocks.sourceArtifactFindUnique.mockImplementation(async ({ where }) =>
      where.sourceKey === legacySourceKey
        ? { id: "legacy_public", isPublic: true, ownerUserId: null }
        : null,
    );
    mocks.sourceArtifactUpsert
      .mockResolvedValueOnce({ id: "source_user_1" })
      .mockResolvedValueOnce({ id: "source_user_2" });

    for (const actorUserId of ["user_1", "user_2"]) {
      const result = await importNotionBundle({
        actorUserId,
        bundle: { export: exportItem, workspaceId: "workspace-1" },
        dryRun: false,
      });

      expect(result).toMatchObject({ hasErrors: false });
    }

    const writes = mocks.sourceArtifactUpsert.mock.calls.map(
      ([input]) => input,
    );
    expect(writes).toHaveLength(2);
    expect(writes.map((input) => input.where.sourceKey)).not.toContain(
      legacySourceKey,
    );
    expect(new Set(writes.map((input) => input.where.sourceKey)).size).toBe(2);
    expect(writes.map((input) => input.create.ownerUserId)).toEqual([
      "user_1",
      "user_2",
    ]);
    expect(writes.every((input) => input.create.isPublic === false)).toBe(true);
  });

  it("preserves an existing organization's visibility when refreshing Notion data", async () => {
    const sourceRef = stableSourceKey("organization", "organization-1");
    const existing = {
      creatorId: "user_1",
      id: "organization_db_1",
      sourceRef,
      visibility: ContentVisibility.PUBLIC,
    };
    const organizationUpdate = vi.fn().mockResolvedValue({ id: existing.id });
    mocks.organizationFindMany.mockResolvedValue([existing]);
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        organization: {
          findUnique: vi.fn().mockResolvedValue(existing),
          update: organizationUpdate,
        },
        sourceArtifact: {
          findUnique: mocks.sourceArtifactFindUnique,
          upsert: mocks.sourceArtifactUpsert,
        },
      }),
    );

    const result = await importNotionBundle({
      actorUserId: "user_1",
      bundle: {
        organizations: [
          {
            name: "Updated organization",
            sourceId: "organization-1",
          },
        ],
        workspaceId: "workspace-1",
      },
      dryRun: false,
    });

    expect(result).toMatchObject({ hasErrors: false });
    expect(organizationUpdate).toHaveBeenCalledWith({
      where: { id: existing.id },
      data: expect.not.objectContaining({ visibility: expect.anything() }),
    });
  });

  it("keeps identical source IDs from different workspaces independent", async () => {
    mocks.personFindMany.mockResolvedValue([
      {
        createdByUserId: "another_user",
        id: "person_db_1",
        sourceRef: stableSourceKey("person", "person-1", "workspace-2"),
      },
    ]);

    const result = await importNotionBundle({
      actorUserId: "user_1",
      bundle: {
        people: [{ displayName: "Tom", sourceId: "person-1" }],
        workspaceId: "workspace-1",
      },
      dryRun: true,
    });

    expect(result.hasErrors).toBe(false);
    expect(result.items).toContainEqual(
      expect.objectContaining({ action: "create", kind: "person" }),
    );
  });

  it("reports inaccessible existing documents and collections before applying writes", async () => {
    mocks.documentFindMany.mockResolvedValue([
      {
        id: "document_db_1",
        requestHash: "old",
        sourceKey: stableSourceKey("document", "document-1"),
      },
    ]);
    mocks.collectionFindMany.mockResolvedValue([
      {
        fields: [{ id: "field_name", key: "name" }],
        id: "collection_db_1",
        requestHash: "old",
        sourceKey: stableSourceKey("collection", "collection-1"),
        views: [],
      },
    ]);
    mocks.assertDocumentAccess.mockRejectedValue(
      new Error("Content not found"),
    );
    mocks.assertCollectionAccess.mockRejectedValue(
      new Error("Content not found"),
    );

    const result = await importNotionBundle({
      actorUserId: "user_1",
      bundle: {
        collections: [
          {
            fields: [{ key: "name", name: "Name", type: "TEXT" }],
            name: "Private collection",
            records: [{ sourceId: "record-1", values: { name: "Row" } }],
            sourceId: "collection-1",
            views: [{ name: "Table", visibleFieldKeys: ["name"] }],
          },
        ],
        documents: [
          {
            markdown: "Private body",
            sourceId: "document-1",
            title: "Private document",
          },
        ],
        workspaceId: "workspace-1",
      },
      dryRun: true,
    });

    expect(result.hasErrors).toBe(true);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "error", kind: "document" }),
        expect.objectContaining({ action: "error", kind: "collection" }),
        expect.objectContaining({ action: "error", kind: "record" }),
        expect.objectContaining({ action: "error", kind: "view" }),
      ]),
    );
  });

  it("rejects cyclic task hierarchies before loading import state", async () => {
    await expect(
      importNotionBundle({
        actorUserId: "user_1",
        bundle: {
          tasks: [
            { parentSourceId: "task-2", sourceId: "task-1", title: "One" },
            { parentSourceId: "task-1", sourceId: "task-2", title: "Two" },
          ],
          workspaceId: "workspace-1",
        },
        dryRun: true,
      }),
    ).rejects.toThrow("Task parent cycle");
    expect(mocks.userFindFirst).not.toHaveBeenCalled();
  });

  it("rejects ambiguous direct and source canonical links", () => {
    const result = notionImportBundleSchema.safeParse({
      collections: [
        {
          name: "Projects",
          records: [
            {
              sourceId: "record-1",
              taskId: "task_db_1",
              taskSourceId: "task-1",
            },
          ],
          sourceId: "collection-1",
        },
      ],
      workspaceId: "workspace-1",
    });

    expect(result.success).toBe(false);
  });
});
