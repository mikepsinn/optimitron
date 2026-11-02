import { describe, expect, it } from "vitest";
import { assertLocalNotionImportApply } from "../notion-import-cli";

describe("direct Notion import cache safety", () => {
  it.each(["localhost", "127.0.0.1", "[::1]", "host.docker.internal"])(
    "allows local apply on %s", (host) => {
      expect(() => assertLocalNotionImportApply(true, `postgresql://user:secret@${host}:5432/test`)).not.toThrow();
    },
  );

  it.each([undefined, "invalid", "https://localhost/db", "postgresql://user:secret@db.neon.tech/db", "postgresql://localhost:secret@remote.example/db"])(
    "rejects unsafe or unknown write destinations without exposing credentials", (url) => {
      expect(() => assertLocalNotionImportApply(true, url)).toThrow("importNotionBundle MCP");
      try { assertLocalNotionImportApply(true, url); } catch (error) {
        expect(String(error)).not.toContain("secret");
      }
    },
  );

  it("allows remote read-only validation", () => {
    expect(() => assertLocalNotionImportApply(false, "postgresql://user:secret@db.neon.tech/db")).not.toThrow();
  });
});
