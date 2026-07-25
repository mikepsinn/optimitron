/**
 * Regression guard for the one email nobody may gate: the sign-in link.
 *
 * Everything else in this PR moved behind human approval. If magic-link mail
 * ever needs an approval it can never get, the app locks every user out of
 * their own account. This drives the real `sendMagicLinkEmail` down through the
 * real `sendReactEmail` and stops at the Resend SDK.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  emailSend: vi.fn(),
  readOutboundMessageGate: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mocks.emailSend };
  },
}));

vi.mock("@react-email/components", () => ({
  render: vi.fn(async () => "Sign in link body"),
}));

vi.mock("@/lib/env", () => ({
  serverEnv: {
    EMAIL_FROM: "team@optimitron.com",
    EMAIL_MONITOR_BCC: undefined,
    NODE_ENV: "development",
    RESEND_API_KEY: "resend_test_key",
    RESEND_MOCK_SEND: undefined,
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: mocks.userFindUnique } },
}));

vi.mock("@/lib/email/outbound-gate.server", () => ({
  readOutboundMessageGate: mocks.readOutboundMessageGate,
}));

vi.mock("@/lib/url", () => ({
  getBaseUrl: () => "https://optimitron.com",
  buildUserReferralUrl: () => "https://optimitron.com",
  buildReferralUrl: () => "https://optimitron.com",
}));

import { sendMagicLinkEmail } from "@/lib/email/magic-link-email";

describe("sendMagicLinkEmail", () => {
  beforeEach(() => {
    mocks.emailSend.mockReset();
    mocks.readOutboundMessageGate.mockReset();
    mocks.userFindUnique.mockReset();
    mocks.emailSend.mockResolvedValue({ data: { id: "email_1" }, error: null });
    mocks.readOutboundMessageGate.mockResolvedValue({
      allowlist: [],
      stopAllOutbound: false,
    });
    mocks.userFindUnique.mockResolvedValue({ id: "user_1" });
  });

  it("still reaches the transport after the approval gate landed", async () => {
    const result = await sendMagicLinkEmail({
      identifier: "citizen@example.org",
      url: "https://warondisease.org/api/auth/callback/email?token=abc",
    } as never);

    expect(result).toEqual({
      existingUser: true,
      providerMessageId: "email_1",
    });
    expect(mocks.emailSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: ["citizen@example.org"] }),
    );
  });

  it("is suppressed only by the emergency stop, not by a missing approval", async () => {
    mocks.readOutboundMessageGate.mockResolvedValue({
      allowlist: [],
      stopAllOutbound: true,
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(
      sendMagicLinkEmail({
        identifier: "citizen@example.org",
        url: "https://warondisease.org/api/auth/callback/email?token=abc",
      } as never),
    ).rejects.toThrow(/Resend is not configured for magic-link email/);
    expect(mocks.emailSend).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
