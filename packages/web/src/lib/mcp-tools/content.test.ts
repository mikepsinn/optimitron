import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listContentAccessGrants: vi.fn(),
  getContentAttachmentDownload: vi.fn(),
  exportContent: vi.fn(),
}));

vi.mock("../content-access.server", () => ({
  listContentAccessGrants: mocks.listContentAccessGrants,
}));

vi.mock("../content-attachments.server", () => ({
  getContentAttachmentDownload: mocks.getContentAttachmentDownload,
}));

vi.mock("../content-export.server", () => ({
  exportContent: mocks.exportContent,
}));

import { handleContentToolCall } from "./content";

function body(response: Awaited<ReturnType<typeof handleContentToolCall>>) {
  return JSON.parse(response.content[0]?.text ?? "{}") as {
    error?: string;
  };
}

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
});

describe("MCP content boundaries", () => {
  it.each([
    [
      "manageContentAccess" as const,
      { action: "list", resourceId: "private", resourceType: "document" },
      mocks.listContentAccessGrants,
    ],
    [
      "manageContentFiles" as const,
      { action: "open", attachmentId: "private" },
      mocks.getContentAttachmentDownload,
    ],
    [
      "exportContent" as const,
      { resourceId: "private", resourceType: "document" },
      mocks.exportContent,
    ],
  ])(
    "returns the same masked denial from %s",
    async (name, args, operation) => {
      operation.mockRejectedValue(new Error("Content not found"));

      const response = await handleContentToolCall({
        args,
        name,
        userId: "viewer_1",
      });

      expect(response.isError).toBe(true);
      expect(body(response)).toEqual({ error: "Content not found" });
    },
  );
});
