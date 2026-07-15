import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContentAccessLevel } from "@optimitron/db/enums";

const mocks = vi.hoisted(() => ({
  collectionFindFirst: vi.fn(),
  collectionFindMany: vi.fn(),
  collectionRecordFindFirst: vi.fn(),
  documentFindFirst: vi.fn(),
  documentFindMany: vi.fn(),
  organizationMemberFindMany: vi.fn(),
  userFindFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: {
      findFirst: mocks.collectionFindFirst,
      findMany: mocks.collectionFindMany,
    },
    collectionRecord: { findFirst: mocks.collectionRecordFindFirst },
    document: {
      findFirst: mocks.documentFindFirst,
      findMany: mocks.documentFindMany,
    },
    organizationMember: { findMany: mocks.organizationMemberFindMany },
    user: { findFirst: mocks.userFindFirst },
  },
}));

import {
  assertCollectionRecordAccess,
  assertDocumentAccess,
  resolveContentGrantee,
  resolveCollectionAccess,
  resolveCollectionAccessBatch,
  resolveDocumentAccess,
  resolveDocumentAccessBatch,
  setContentAccessGrant,
} from "../content-access.server";

function resource(overrides: Record<string, unknown> = {}) {
  return {
    accessGrants: [],
    createdByUserId: "creator_1",
    organizationId: null,
    parentDocumentId: null,
    task: null,
    visibility: "PRIVATE",
    ...overrides,
  };
}

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.organizationMemberFindMany.mockResolvedValue([]);
});

describe("document access", () => {
  it("gives a personal document creator full access", async () => {
    mocks.documentFindFirst.mockResolvedValue(resource());

    await expect(
      resolveDocumentAccess("document_1", "creator_1"),
    ).resolves.toBe(ContentAccessLevel.FULL_ACCESS);
  });

  it("revokes implicit creator access when an organization owns the document", async () => {
    mocks.documentFindFirst.mockResolvedValue(
      resource({ organizationId: "organization_1" }),
    );

    await expect(
      resolveDocumentAccess("document_1", "creator_1"),
    ).resolves.toBeNull();
  });

  it("gives current organization owners and admins full access", async () => {
    mocks.organizationMemberFindMany.mockResolvedValue([
      { organizationId: "organization_1", role: "admin" },
    ]);
    mocks.documentFindFirst.mockResolvedValue(
      resource({ organizationId: "organization_1" }),
    );

    await expect(resolveDocumentAccess("document_1", "admin_1")).resolves.toBe(
      ContentAccessLevel.FULL_ACCESS,
    );
  });

  it("inherits the broadest grant from a parent without losing a stronger child grant", async () => {
    const rows = new Map([
      [
        "child",
        resource({
          createdByUserId: "other",
          parentDocumentId: "parent",
          accessGrants: [
            {
              accessLevel: "EDIT_CONTENT",
              organizationId: null,
              userId: "viewer_1",
            },
          ],
        }),
      ],
      [
        "parent",
        resource({
          createdByUserId: "other",
          accessGrants: [
            {
              accessLevel: "VIEW",
              organizationId: null,
              userId: "viewer_1",
            },
          ],
        }),
      ],
    ]);
    mocks.documentFindFirst.mockImplementation(
      async ({ where }: { where: { id: string } }) =>
        rows.get(where.id) ?? null,
    );

    await expect(resolveDocumentAccess("child", "viewer_1")).resolves.toBe(
      ContentAccessLevel.EDIT_CONTENT,
    );
  });

  it("resolves a document batch through the same inherited-access policy", async () => {
    const rows = new Map([
      [
        "child",
        {
          id: "child",
          ...resource({
            createdByUserId: "other",
            parentDocumentId: "parent",
          }),
        },
      ],
      [
        "parent",
        {
          id: "parent",
          ...resource({ visibility: "PUBLIC" }),
        },
      ],
      [
        "private",
        {
          id: "private",
          ...resource({ createdByUserId: "other" }),
        },
      ],
    ]);
    mocks.documentFindMany.mockImplementation(
      async ({ where }: { where: { id: { in: string[] } } }) =>
        where.id.in.flatMap((id) => {
          const row = rows.get(id);
          return row ? [row] : [];
        }),
    );

    const access = await resolveDocumentAccessBatch(
      ["child", "private"],
      "viewer_1",
    );

    expect(access.get("child")).toBe(ContentAccessLevel.VIEW);
    expect(access.get("private")).toBeNull();
    expect(mocks.organizationMemberFindMany).toHaveBeenCalledTimes(1);
    expect(mocks.documentFindMany).toHaveBeenCalledTimes(2);
  });

  it("does not inherit public visibility through a private-task document", async () => {
    const rows = new Map([
      [
        "child",
        resource({
          createdByUserId: "other",
          parentDocumentId: "parent",
          task: { isPublic: false },
        }),
      ],
      ["parent", resource({ visibility: "PUBLIC" })],
    ]);
    mocks.documentFindFirst.mockImplementation(
      async ({ where }: { where: { id: string } }) =>
        rows.get(where.id) ?? null,
    );

    await expect(resolveDocumentAccess("child", null)).resolves.toBeNull();
  });

  it("masks missing and insufficient access with the same error", async () => {
    mocks.documentFindFirst.mockResolvedValue(
      resource({ createdByUserId: "other" }),
    );

    await expect(
      assertDocumentAccess("document_1", "viewer_1", ContentAccessLevel.VIEW),
    ).rejects.toThrow("Content not found");
    mocks.documentFindFirst.mockResolvedValue(null);
    await expect(
      assertDocumentAccess("missing", "viewer_1", ContentAccessLevel.VIEW),
    ).rejects.toThrow("Content not found");
  });

  it("does not reveal whether a grantee email exists without full access", async () => {
    mocks.documentFindFirst.mockResolvedValue(
      resource({ createdByUserId: "other" }),
    );
    mocks.userFindFirst.mockResolvedValue({ id: "target_user" });

    await expect(
      resolveContentGrantee({
        actorUserId: "viewer_1",
        grantee: { type: "user", email: "target@example.org" },
        resource: { type: "document", id: "document_1" },
      }),
    ).rejects.toThrow("Content not found");
    expect(mocks.userFindFirst).not.toHaveBeenCalled();
  });

  it("does not look up a direct grantee before resource authorization", async () => {
    mocks.documentFindFirst.mockResolvedValue(
      resource({ createdByUserId: "other" }),
    );
    mocks.userFindFirst.mockResolvedValue({ id: "target_user" });

    await expect(
      setContentAccessGrant({
        accessLevel: ContentAccessLevel.VIEW,
        actorUserId: "viewer_1",
        grantee: { type: "user", id: "target_user" },
        resource: { type: "document", id: "document_1" },
      }),
    ).rejects.toThrow("Content not found");
    expect(mocks.userFindFirst).not.toHaveBeenCalled();
  });

  it("resolves a grantee email after full access is established", async () => {
    mocks.documentFindFirst.mockResolvedValue(resource());
    mocks.userFindFirst.mockResolvedValue({ id: "target_user" });

    await expect(
      resolveContentGrantee({
        actorUserId: "creator_1",
        grantee: { type: "user", email: "target@example.org" },
        resource: { type: "document", id: "document_1" },
      }),
    ).resolves.toEqual({ type: "user", id: "target_user" });
  });
});

describe("collection access", () => {
  it("applies direct organization grants to current members", async () => {
    mocks.organizationMemberFindMany.mockResolvedValue([
      { organizationId: "collaborators", role: "member" },
    ]);
    mocks.collectionFindFirst.mockResolvedValue(
      resource({
        createdByUserId: "other",
        accessGrants: [
          {
            accessLevel: "EDIT_CONTENT",
            organizationId: "collaborators",
            userId: null,
          },
        ],
      }),
    );

    await expect(
      resolveCollectionAccess("collection_1", "member_1"),
    ).resolves.toBe(ContentAccessLevel.EDIT_CONTENT);
  });

  it("makes collection records inherit their collection access", async () => {
    mocks.collectionRecordFindFirst.mockResolvedValue({
      collectionId: "collection_1",
    });
    mocks.collectionFindFirst.mockResolvedValue(
      resource({ createdByUserId: "viewer_1" }),
    );

    await expect(
      assertCollectionRecordAccess(
        "record_1",
        "viewer_1",
        ContentAccessLevel.EDIT_CONTENT,
      ),
    ).resolves.toEqual({ collectionId: "collection_1" });
  });

  it("resolves collection batches with one membership lookup", async () => {
    mocks.collectionFindMany.mockResolvedValue([
      { id: "public", ...resource({ visibility: "PUBLIC" }) },
      { id: "private", ...resource({ createdByUserId: "other" }) },
    ]);

    const access = await resolveCollectionAccessBatch(
      ["public", "private"],
      "viewer_1",
    );

    expect(access.get("public")).toBe(ContentAccessLevel.VIEW);
    expect(access.get("private")).toBeNull();
    expect(mocks.organizationMemberFindMany).toHaveBeenCalledTimes(1);
    expect(mocks.collectionFindMany).toHaveBeenCalledTimes(1);
  });
});
