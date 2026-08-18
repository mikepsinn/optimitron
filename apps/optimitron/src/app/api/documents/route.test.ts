import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createDocument: vi.fn(),
  getTaskRequestIdentity: vi.fn(),
  listDocumentsForViewer: vi.fn(),
  requireTaskRequestAuth: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  getTaskRequestIdentity: mocks.getTaskRequestIdentity,
  requireTaskRequestAuth: mocks.requireTaskRequestAuth,
}));

vi.mock("@/lib/documents.server", () => ({
  createDocument: mocks.createDocument,
  listDocumentsForViewer: mocks.listDocumentsForViewer,
  toDocumentDto: (row: unknown) => row,
}));

import { GET, POST } from "./route";

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
});

describe("GET /api/documents", () => {
  it("forwards bearer client access boundaries to document listing", async () => {
    const clientAccessBoundary = {
      allowPersonalPrivate: false,
      organizationIds: ["organization_1"],
    };
    mocks.getTaskRequestIdentity.mockResolvedValue({
      clientAccessBoundary,
      userId: "user_1",
    });
    mocks.listDocumentsForViewer.mockResolvedValue([]);

    const response = await GET(
      new Request("http://localhost/api/documents?taskId=task_1&limit=12"),
    );

    expect(response.status).toBe(200);
    expect(mocks.listDocumentsForViewer).toHaveBeenCalledWith({
      clientAccessBoundary,
      limit: 12,
      taskId: "task_1",
      userId: "user_1",
    });
  });
});

describe("POST /api/documents", () => {
  it("forwards bearer client access boundaries to document creation", async () => {
    const clientAccessBoundary = {
      allowPersonalPrivate: false,
      organizationIds: ["organization_1"],
    };
    mocks.requireTaskRequestAuth.mockResolvedValue({
      clientAccessBoundary,
      userId: "user_1",
    });
    mocks.createDocument.mockResolvedValue({ id: "document_1" });

    const response = await POST(
      new Request("http://localhost/api/documents", {
        body: JSON.stringify({
          body: "Text",
          organizationId: "organization_1",
          taskId: "task_1",
          title: "Charter",
        }),
        headers: { "Idempotency-Key": "create-document-1" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.createDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        createdByUserId: "user_1",
        idempotencyKey: "create-document-1",
        organizationId: "organization_1",
        taskId: "task_1",
      }),
      { clientAccessBoundary },
    );
  });

  it("requires authentication before creating a document", async () => {
    mocks.requireTaskRequestAuth.mockRejectedValue(new Error("Unauthorized"));

    const response = await POST(
      new Request("http://localhost/api/documents", {
        body: JSON.stringify({ title: "Charter" }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    expect(mocks.createDocument).not.toHaveBeenCalled();
  });
});
