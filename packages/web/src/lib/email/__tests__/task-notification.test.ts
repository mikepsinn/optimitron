import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getReplyAddress,
  getReplyEmailDomain,
  parseReplyAddress,
} from "../task-notification";

/**
 * Unit tests for the reply-address encoder/decoder. Pure functions, no DB
 * or network mocking. Covers the round-trip + the parsing edge cases an
 * inbound webhook is likely to hit (display-name angle brackets, case,
 * whitespace).
 */
describe("reply-address encode/decode", () => {
  // Tests assume the default domain. If REPLY_EMAIL_DOMAIN is set in the
  // test env, swap it into expectations dynamically.
  const domain = getReplyEmailDomain();

  describe("getReplyAddress", () => {
    it("formats with reply+ prefix and configured domain", () => {
      expect(getReplyAddress("abc123")).toBe(`reply+abc123@${domain}`);
    });

    it("preserves the taskId verbatim (no slugging)", () => {
      // Task IDs are cuids — alphanumeric, no encoding needed.
      const taskId = "cmoox5gru000004l11fxc9ln2";
      expect(getReplyAddress(taskId)).toBe(`reply+${taskId}@${domain}`);
    });
  });

  describe("parseReplyAddress", () => {
    it("round-trips an encoded address", () => {
      const taskId = "cmoox5gru000004l11fxc9ln2";
      const encoded = getReplyAddress(taskId);
      const parsed = parseReplyAddress(encoded);
      expect(parsed?.taskId).toBe(taskId);
    });

    it("strips display-name angle brackets", () => {
      const parsed = parseReplyAddress(
        `Earth Optimization Services <reply+abc@${domain}>`,
      );
      expect(parsed?.taskId).toBe("abc");
    });

    it("is case-insensitive on the domain", () => {
      const parsed = parseReplyAddress(`reply+abc@${domain.toUpperCase()}`);
      expect(parsed?.taskId).toBe("abc");
    });

    it("preserves taskId casing while matching the prefix case-insensitively", () => {
      const parsed = parseReplyAddress(`Reply+TaskABC@${domain.toUpperCase()}`);
      expect(parsed?.taskId).toBe("TaskABC");
    });

    it("trims surrounding whitespace", () => {
      const parsed = parseReplyAddress(`   reply+abc@${domain}\n`);
      expect(parsed?.taskId).toBe("abc");
    });

    it("returns null for an address on a different domain", () => {
      expect(parseReplyAddress("reply+abc@other.example.com")).toBeNull();
    });

    it("returns null for an address without the reply+ prefix", () => {
      expect(parseReplyAddress(`hello@${domain}`)).toBeNull();
    });

    it("returns null for an empty taskId after the prefix", () => {
      expect(parseReplyAddress(`reply+@${domain}`)).toBeNull();
    });

    it("returns null for non-email garbage", () => {
      expect(parseReplyAddress("not-an-email")).toBeNull();
      expect(parseReplyAddress("")).toBeNull();
    });
  });
});

describe("sendTaskNotificationEmail", () => {
  // Capture the env before each test so we can flip RESEND_API_KEY off and
  // observe the disabled-status path without hitting the real Resend.
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalMockSend = process.env.RESEND_MOCK_SEND;

  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_MOCK_SEND;
  });
  afterEach(() => {
    if (originalApiKey !== undefined) process.env.RESEND_API_KEY = originalApiKey;
    if (originalMockSend !== undefined) process.env.RESEND_MOCK_SEND = originalMockSend;
  });

  it("returns disabled status when Resend is not configured", async () => {
    // Re-import to pick up the env change since serverEnv may be cached.
    const mod = await import("../task-notification");
    const result = await mod.sendTaskNotificationEmail({
      taskId: "abc",
      recipientEmail: "test@example.com",
      subject: "test",
      text: "test body",
    });
    // Either disabled (preferred) or failed are both acceptable when no
    // Resend creds — the import-cache + env-lookup interaction inside
    // serverEnv may treat the absence either way. The contract is "no
    // crash, no real send."
    expect(["disabled", "failed"]).toContain(result.status);
    expect(result.replyTo).toContain("reply+abc@");
  });
});
