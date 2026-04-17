import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  canSendEmailToUser: vi.fn(),
  emailSend: vi.fn(),
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
  serverEnv: {
    EMAIL_FROM: "team@optimitron.com",
    RESEND_API_KEY: "resend_test_key",
  },
}));

vi.mock("@/lib/email/can-send.server", () => ({
  canSendEmailToUser: mocks.canSendEmailToUser,
}));

vi.mock("@/lib/email/unsub-url", () => ({
  buildUnsubscribeUrl: vi.fn(() => "https://optimitron.com/api/email/unsubscribe?token=abc"),
}));

import { sendResendEmail } from "../resend";

describe("sendResendEmail", () => {
  beforeEach(() => {
    mocks.canSendEmailToUser.mockReset();
    mocks.emailSend.mockReset();
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
});
