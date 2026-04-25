import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  canSendEmailToUser: vi.fn(),
  emailSend: vi.fn(),
  serverEnv: {
    EMAIL_FROM: "team@optimitron.com",
    NODE_ENV: "development",
    RESEND_API_KEY: "resend_test_key" as string | undefined,
    RESEND_MOCK_SEND: undefined as "1" | undefined,
  },
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: mocks.emailSend,
    };
  },
}));

vi.mock("@react-email/components", () => ({
  render: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  serverEnv: mocks.serverEnv,
}));

vi.mock("@/lib/email/can-send.server", () => ({
  canSendEmailToUser: mocks.canSendEmailToUser,
}));

vi.mock("@/lib/email/unsub-url", () => ({
  buildUnsubscribeUrl: vi.fn(() => "https://optimitron.com/api/email/unsubscribe?token=abc"),
}));

import { sendResendEmail } from "../email/resend";

describe("sendResendEmail", () => {
  beforeEach(() => {
    mocks.canSendEmailToUser.mockReset();
    mocks.emailSend.mockReset();
    mocks.serverEnv.NODE_ENV = "development";
    mocks.serverEnv.RESEND_API_KEY = "resend_test_key";
    mocks.serverEnv.RESEND_MOCK_SEND = undefined;
    mocks.canSendEmailToUser.mockResolvedValue(true);
    mocks.emailSend.mockResolvedValue({
      data: { id: "email_1" },
      error: null,
    });
  });

  it("adds one-click unsubscribe headers for non-transactional email", async () => {
    const result = await sendResendEmail({
      html: "<p>Hello</p>",
      scope: "referral_sequence",
      subject: "Hello",
      text: "Hello",
      to: "citizen@example.com",
      userId: "user_1",
    });

    expect(result).toEqual({
      id: "email_1",
      status: "sent",
      unsubscribeUrl: "https://optimitron.com/api/email/unsubscribe?token=abc",
    });

    const payload = mocks.emailSend.mock.calls[0]?.[0];
    expect(payload).toMatchObject({
      headers: {
        "List-Unsubscribe": expect.stringContaining(
          "https://optimitron.com/api/email/unsubscribe?token=abc",
        ),
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
  });

  it("omits one-click unsubscribe headers for transactional email", async () => {
    const result = await sendResendEmail({
      html: "<p>Hello</p>",
      scope: "magic_link",
      subject: "Magic link",
      text: "Hello",
      to: "citizen@example.com",
      userId: "user_1",
    });

    expect(result).toEqual({
      id: "email_1",
      status: "sent",
      unsubscribeUrl: null,
    });

    const payload = mocks.emailSend.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.headers).toBeUndefined();
  });

  it("can mock successful sends in non-production verification runs", async () => {
    mocks.serverEnv.RESEND_API_KEY = undefined;
    mocks.serverEnv.RESEND_MOCK_SEND = "1";

    const result = await sendResendEmail({
      html: "<p>Hello</p>",
      scope: "magic_link",
      subject: "Magic link",
      text: "Hello",
      to: "citizen@example.com",
      userId: "user_1",
    });

    expect(result).toMatchObject({
      status: "sent",
      unsubscribeUrl: null,
    });
    expect(result.status).toBe("sent");
    if (result.status === "sent") {
      expect(result.id).toMatch(/^mock_resend_/);
    }
    expect(mocks.emailSend).not.toHaveBeenCalled();
  });
});
