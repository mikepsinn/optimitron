import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDocumentForViewer: vi.fn(),
  getTaskRequestIdentity: vi.fn(),
  requireTaskRequestAuth: vi.fn(),
  updateDocument: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  getTaskRequestIdentity: mocks.getTaskRequestIdentity,
  requireTaskRequestAuth: mocks.requireTaskRequestAuth,
}));

vi.mock("@/lib/documents.server", () => ({
  DOCUMENT_CONFLICT_MESSAGE:
    "Document changed since it was loaded. Refresh and try again.",
  DOCUMENT_EMPTY_PATCH_MESSAGE:
    "At least one editable document field must be provided",
  DOCUMENT_NOT_FOUND_MESSAGE: "Document not found",
  DOCUMENT_PRIVATE_TASK_MESSAGE:
    "Cannot make a document attached to a private task public",
  getDocumentForViewer: mocks.getDocumentForViewer,
  toDocumentDto: (row: unknown) => row,
  updateDocument: mocks.updateDocument,
}));

import { GET, POST } from "./route";

beforeEach(() => {
  for (const fn of Object.values(mocks)) {
    fn.mockReset();
  }
});

describe("GET /api/documents/[id]", () => {
  it("returns 404 for an anonymous viewer on a private document", async () => {
    mocks.getTaskRequestIdentity.mockResolvedValue({ userId: null });
    mocks.getDocumentForViewer.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/documents/doc_1"),
      { params: Promise.resolve({ id: "doc_1" }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      code: "CONTENT_NOT_FOUND",
      error: "Content not found.",
    });
  });

  it("returns the document for a permitted viewer", async () => {
    const clientAccessBoundary = {
      allowPersonalPrivate: false,
      organizationIds: ["organization_1"],
    };
    mocks.getTaskRequestIdentity.mockResolvedValue({
      clientAccessBoundary,
      userId: "creator_1",
    });
    mocks.getDocumentForViewer.mockResolvedValue({
      document: { id: "doc_1" },
      versions: [],
      viewerCanEdit: true,
    });

    const response = await GET(
      new Request("http://localhost/api/documents/doc_1"),
      { params: Promise.resolve({ id: "doc_1" }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.getDocumentForViewer).toHaveBeenCalledWith(
      "doc_1",
      "creator_1",
      { clientAccessBoundary },
    );
  });
});

describe("POST /api/documents/[id]", () => {
  it("requires authentication", async () => {
    mocks.requireTaskRequestAuth.mockRejectedValue(new Error("Unauthorized"));

    const response = await POST(
      new Request("http://localhost/api/documents/doc_1", {
        method: "POST",
        body: JSON.stringify({ body: "new" }),
      }),
      { params: Promise.resolve({ id: "doc_1" }) },
    );

    expect(response.status).toBe(401);
    expect(mocks.updateDocument).not.toHaveBeenCalled();
  });

  it("maps the not-found error from non-creator edits to 404", async () => {
    mocks.requireTaskRequestAuth.mockResolvedValue({ userId: "stranger_1" });
    mocks.updateDocument.mockRejectedValue(new Error("Document not found"));

    const response = await POST(
      new Request("http://localhost/api/documents/doc_1", {
        method: "POST",
        body: JSON.stringify({ body: "hijack" }),
      }),
      { params: Promise.resolve({ id: "doc_1" }) },
    );

    expect(response.status).toBe(404);
  });

  it("maps the empty-patch rejection to 400", async () => {
    mocks.requireTaskRequestAuth.mockResolvedValue({ userId: "creator_1" });
    mocks.updateDocument.mockRejectedValue(
      new Error("At least one editable document field must be provided"),
    );

    const response = await POST(
      new Request("http://localhost/api/documents/doc_1", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: "doc_1" }) },
    );

    expect(response.status).toBe(400);
  });

  it("maps the public-visibility-on-a-private-task rejection to 400", async () => {
    mocks.requireTaskRequestAuth.mockResolvedValue({ userId: "creator_1" });
    mocks.updateDocument.mockRejectedValue(
      new Error("Cannot make a document attached to a private task public"),
    );

    const response = await POST(
      new Request("http://localhost/api/documents/doc_1", {
        method: "POST",
        body: JSON.stringify({ visibility: "PUBLIC" }),
      }),
      { params: Promise.resolve({ id: "doc_1" }) },
    );

    expect(response.status).toBe(400);
  });

  it("maps an optimistic concurrency conflict to 409", async () => {
    mocks.requireTaskRequestAuth.mockResolvedValue({ userId: "creator_1" });
    mocks.updateDocument.mockRejectedValue(
      new Error("Document changed since it was loaded. Refresh and try again."),
    );

    const response = await POST(
      new Request("http://localhost/api/documents/doc_1", {
        method: "POST",
        body: JSON.stringify({ body: "new", expectedVersion: 2 }),
      }),
      { params: Promise.resolve({ id: "doc_1" }) },
    );

    expect(response.status).toBe(409);
  });
});
