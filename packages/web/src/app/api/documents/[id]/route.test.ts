import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getDocumentForViewer: vi.fn(),
  updateDocument: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/lib/documents.server", () => ({
  DOCUMENT_EMPTY_PATCH_MESSAGE:
    "At least one of title, body, or visibility must be provided",
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
    mocks.getCurrentUser.mockResolvedValue(null);
    mocks.getDocumentForViewer.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/documents/doc_1"),
      { params: Promise.resolve({ id: "doc_1" }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Document not found.",
    });
  });

  it("returns the document for a permitted viewer", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "creator_1" });
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
    );
  });
});

describe("POST /api/documents/[id]", () => {
  it("requires authentication", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

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
    mocks.getCurrentUser.mockResolvedValue({ id: "stranger_1" });
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
    mocks.getCurrentUser.mockResolvedValue({ id: "creator_1" });
    mocks.updateDocument.mockRejectedValue(
      new Error(
        "At least one of title, body, or visibility must be provided",
      ),
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
    mocks.getCurrentUser.mockResolvedValue({ id: "creator_1" });
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
});
