import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContentAccessLevel } from "@optimitron/db/enums";

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  resolveCollectionAccessBatch: vi.fn(),
  resolveDocumentAccessBatch: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { $queryRaw: mocks.queryRaw },
}));

vi.mock("@/lib/content-access.server", () => ({
  resolveCollectionAccessBatch: mocks.resolveCollectionAccessBatch,
  resolveDocumentAccessBatch: mocks.resolveDocumentAccessBatch,
}));

import { searchContent } from "../content-search.server";

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
});

describe("searchContent", () => {
  it("filters text matches through the shared access resolvers", async () => {
    mocks.queryRaw
      .mockResolvedValueOnce([
        {
          id: "visible_document",
          rank: 0.4,
          snippet: "visible result",
          title: "Visible document",
        },
        {
          id: "private_document",
          rank: 0.9,
          snippet: "private result",
          title: "Private document",
        },
      ])
      .mockResolvedValueOnce([
        {
          collectionName: "Visible projects",
          collectionId: "visible_collection",
          id: "visible_record",
          rank: 0.6,
          snippet: "visible record",
          title: "Mercury account",
        },
        {
          collectionName: "Private projects",
          collectionId: "private_collection",
          id: "private_record",
          rank: 1,
          snippet: "private record",
          title: "Private record",
        },
      ]);
    mocks.resolveDocumentAccessBatch.mockResolvedValue(
      new Map([
        ["visible_document", ContentAccessLevel.EDIT],
        ["private_document", null],
      ]),
    );
    mocks.resolveCollectionAccessBatch.mockResolvedValue(
      new Map([
        ["visible_collection", ContentAccessLevel.VIEW],
        ["private_collection", null],
      ]),
    );

    const result = await searchContent({
      query: "project status",
      userId: "viewer_1",
    });

    expect(result.results).toEqual([
      expect.objectContaining({
        collectionName: "Visible projects",
        id: "visible_record",
        permission: ContentAccessLevel.VIEW,
        title: "Mercury account",
      }),
      expect.objectContaining({
        id: "visible_document",
        permission: ContentAccessLevel.EDIT,
      }),
    ]);
    expect(result.results.map((row) => row.id)).not.toContain(
      "private_document",
    );
    expect(result.results.map((row) => row.id)).not.toContain("private_record");
    expect(mocks.resolveDocumentAccessBatch).toHaveBeenCalledWith(
      ["visible_document", "private_document"],
      "viewer_1",
    );
    const documentQuery = mocks.queryRaw.mock.calls[0]?.[0] as
      | { strings?: string[] }
      | undefined;
    expect(documentQuery?.strings?.join("")).toContain(
      'FROM "DocumentRevision" revision',
    );
  });

  it("rejects empty and oversized queries before touching the database", async () => {
    await expect(searchContent({ query: "x" })).rejects.toThrow(
      "query must be 2-500 characters",
    );
    await expect(searchContent({ query: "x".repeat(501) })).rejects.toThrow(
      "query must be 2-500 characters",
    );
    expect(mocks.queryRaw).not.toHaveBeenCalled();
  });
});
