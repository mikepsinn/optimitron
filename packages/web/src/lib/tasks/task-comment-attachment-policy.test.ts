import { describe, expect, it } from "vitest";
import {
  normalizeTaskCommentAttachmentContentType,
  taskCommentAttachmentBytesMatchContentType,
} from "./task-comment-attachment-policy";

describe("task comment attachment policy", () => {
  it("uses the filename extension instead of trusting a caller MIME label", () => {
    expect(
      normalizeTaskCommentAttachmentContentType("report.pdf", "image/png"),
    ).toBe("application/pdf");
    expect(
      normalizeTaskCommentAttachmentContentType(
        "payload.exe",
        "application/pdf",
      ),
    ).toBe("");
  });

  it("recognizes valid file signatures and rejects mismatches", () => {
    const png = Uint8Array.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    expect(taskCommentAttachmentBytesMatchContentType("image/png", png)).toBe(
      true,
    );
    expect(
      taskCommentAttachmentBytesMatchContentType("application/pdf", png),
    ).toBe(false);
  });
});
