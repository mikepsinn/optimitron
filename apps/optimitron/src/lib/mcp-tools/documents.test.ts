import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateDocument: vi.fn(),
  toDocumentDto: vi.fn(),
}));

vi.mock("../documents.server", () => ({
  updateDocument: mocks.updateDocument,
  toDocumentDto: mocks.toDocumentDto,
}));

import { handleDocumentToolCall } from "./documents";

function responseBody(
  response: Awaited<ReturnType<typeof handleDocumentToolCall>>,
) {
  return JSON.parse(response.content[0]?.text ?? "{}") as Record<
    string,
    unknown
  >;
}

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.updateDocument.mockResolvedValue({ document: { id: "document_1" } });
  mocks.toDocumentDto.mockReturnValue({ id: "document_1", version: 2 });
});

describe("MCP document tools", () => {
  it("updates and clears document ownership links through the shared server path", async () => {
    const clientAccessBoundary = {
      allowPersonalPrivate: false,
      organizationIds: ["organization_1"],
    };
    const response = await handleDocumentToolCall({
      args: {
        documentId: "document_1",
        expectedVersion: 1,
        organizationId: "organization_1",
        parentDocumentId: null,
        taskId: null,
      },
      clientAccessBoundary,
      name: "updateDocument",
      userId: "user_1",
    });

    expect(response.isError).not.toBe(true);
    expect(responseBody(response)).toEqual({
      document: { id: "document_1", version: 2 },
    });
    expect(mocks.updateDocument).toHaveBeenCalledWith(
      {
        body: null,
        documentId: "document_1",
        editorUserId: "user_1",
        expectedVersion: 1,
        organizationId: "organization_1",
        parentDocumentId: null,
        taskId: null,
        title: null,
        visibility: null,
      },
      { clientAccessBoundary },
    );
  });
});
