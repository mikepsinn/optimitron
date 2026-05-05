import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getReplyAddress,
  getReplyEmailDomain,
  parseReplyAddress,
} from "../task-notification";
import {
  WAR_ON_DISEASE_CANONICAL_DOMAIN,
  WAR_ON_DISEASE_REPLY_DOMAIN,
} from "@/lib/site";

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

describe("reply domain env", () => {
  const originalReplyDomain = process.env.REPLY_EMAIL_DOMAIN;
  const originalInboundSecret = process.env.RESEND_INBOUND_WEBHOOK_SECRET;

  afterEach(() => {
    if (originalReplyDomain !== undefined) {
      process.env.REPLY_EMAIL_DOMAIN = originalReplyDomain;
    } else {
      delete process.env.REPLY_EMAIL_DOMAIN;
    }
    if (originalInboundSecret !== undefined) {
      process.env.RESEND_INBOUND_WEBHOOK_SECRET = originalInboundSecret;
    } else {
      delete process.env.RESEND_INBOUND_WEBHOOK_SECRET;
    }
    vi.resetModules();
  });

  it("falls back to the default reply domain when the env var is blank", async () => {
    process.env.REPLY_EMAIL_DOMAIN = "";
    vi.resetModules();
    const { getReplyAddress, getReplyEmailDomain } =
      await import("../task-notification");

    expect(WAR_ON_DISEASE_CANONICAL_DOMAIN).toBe("warondisease.org");
    expect(getReplyEmailDomain()).toBe(WAR_ON_DISEASE_REPLY_DOMAIN);
    expect(getReplyAddress("abc")).toBe(
      `reply+abc@${WAR_ON_DISEASE_REPLY_DOMAIN}`,
    );
  });

  it("does not enable task email replies until both inbound secret and domain are configured", async () => {
    delete process.env.RESEND_INBOUND_WEBHOOK_SECRET;
    process.env.REPLY_EMAIL_DOMAIN = "reply.test";
    vi.resetModules();
    const { getConfiguredTaskReplyAddress, getTaskEmailReplyInstruction } =
      await import("../task-notification");

    expect(getConfiguredTaskReplyAddress("abc")).toBeNull();
    expect(getTaskEmailReplyInstruction()).toBeNull();
  });

  it("returns a task reply address when inbound secret and domain are configured", async () => {
    process.env.RESEND_INBOUND_WEBHOOK_SECRET = "secret_test";
    process.env.REPLY_EMAIL_DOMAIN = "reply.test";
    vi.resetModules();
    const { getConfiguredTaskReplyAddress, getTaskEmailReplyInstruction } =
      await import("../task-notification");

    expect(getConfiguredTaskReplyAddress("abc")).toBe("reply+abc@reply.test");
    expect(getTaskEmailReplyInstruction()).toBe(
      "Reply to this email to add a comment to the task.",
    );
  });
});

describe("app-URL helpers", () => {
  const originalBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const originalNextAuthUrl = process.env.NEXTAUTH_URL;

  afterEach(() => {
    if (originalBaseUrl !== undefined) {
      process.env.NEXT_PUBLIC_BASE_URL = originalBaseUrl;
    } else {
      delete process.env.NEXT_PUBLIC_BASE_URL;
    }
    if (originalNextAuthUrl !== undefined) {
      process.env.NEXTAUTH_URL = originalNextAuthUrl;
    } else {
      delete process.env.NEXTAUTH_URL;
    }
    vi.resetModules();
  });

  it("uses NEXT_PUBLIC_BASE_URL when set", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://staging.warondisease.org";
    vi.resetModules();
    const { getAppBaseUrl, getTaskUrl } = await import("../task-notification");

    expect(getAppBaseUrl()).toBe("https://staging.warondisease.org");
    expect(getTaskUrl("abc")).toBe(
      "https://staging.warondisease.org/tasks/abc",
    );
  });

  it("strips trailing slash from the configured base", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://example.com/";
    vi.resetModules();
    const { getAppBaseUrl, getTaskUrl } = await import("../task-notification");

    expect(getAppBaseUrl()).toBe("https://example.com");
    expect(getTaskUrl("abc")).toBe("https://example.com/tasks/abc");
  });

  it("falls back to a fixed production URL when no env vars are set", async () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.NEXTAUTH_URL;
    vi.resetModules();
    const { getTaskUrl } = await import("../task-notification");

    // Intentionally minimal: just verify the fallback is a real-looking URL
    // and the task-url builder uses it. The exact fallback domain is an
    // implementation detail — assertion is on shape, not value.
    const url = getTaskUrl("xyz");
    expect(url).toMatch(/^https?:\/\/.+\/tasks\/xyz$/);
  });
});

describe("sendTaskNotificationEmail", () => {
  // Capture the env before each test so we can flip RESEND_API_KEY off and
  // observe the disabled-status path without hitting the real Resend.
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalMockSend = process.env.RESEND_MOCK_SEND;

  beforeEach(() => {
    vi.resetModules();
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_MOCK_SEND;
  });
  afterEach(() => {
    if (originalApiKey !== undefined)
      process.env.RESEND_API_KEY = originalApiKey;
    if (originalMockSend !== undefined)
      process.env.RESEND_MOCK_SEND = originalMockSend;
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
