import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  serverEnv: {
    R2_ACCESS_KEY_ID: "test-shared-access-key",
    R2_ENDPOINT: "https://example.invalid",
    R2_PRIVATE_ACCESS_KEY_ID: "test-private-access-key",
    R2_PRIVATE_BUCKET: "private-files",
    R2_PRIVATE_SECRET_ACCESS_KEY: "test-private-secret-key",
    R2_SECRET_ACCESS_KEY: "test-shared-secret-key",
  },
}));

import { presignPrivateUpload } from "./object-storage.server";

describe("presignPrivateUpload", () => {
  it("binds the caller-provided checksum without signing an empty-body checksum", async () => {
    const checksumSha256 = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
    const result = await presignPrivateUpload({
      checksumSha256,
      contentLength: 3,
      contentType: "text/plain",
      key: "task-comment-attachments/test",
    });
    const url = new URL(result.uploadUrl);

    expect(url.searchParams.get("x-amz-checksum-sha256")).toBe(checksumSha256);
    expect(url.searchParams.has("x-amz-checksum-crc32")).toBe(false);
    expect(url.searchParams.get("X-Amz-Credential")).toContain(
      "test-private-access-key",
    );
  });
});
