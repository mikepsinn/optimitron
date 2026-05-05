import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  canSendEmailToUser: vi.fn(),
  emailSend: vi.fn(),
  serverEnv: {
    EMAIL_FROM: "team@optimitron.com" as string | undefined,
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
  buildUnsubscribeUrl: vi.fn(
    () => "https://optimitron.com/api/email/unsubscribe?token=abc",
  ),
}));

import { EMAIL_UNSUBSCRIBE_URL_PLACEHOLDER } from "../email/placeholders";
import { sendResendEmail } from "../email/resend";

describe("sendResendEmail", () => {
  beforeEach(() => {
    mocks.canSendEmailToUser.mockReset();
    mocks.emailSend.mockReset();
    mocks.serverEnv.EMAIL_FROM = "team@optimitron.com";
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
      scope: "task_notifications",
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

  it("uses the War on Disease updates domain when EMAIL_FROM is not configured", async () => {
    mocks.serverEnv.EMAIL_FROM = undefined;

    await sendResendEmail({
      html: "<p>Hello</p>",
      scope: "task_notifications",
      subject: "Hello",
      text: "Hello",
      to: "citizen@example.com",
      userId: "user_1",
    });

    const payload = mocks.emailSend.mock.calls[0]?.[0];
    expect(payload).toMatchObject({
      from: "Earth Optimization Services <hello@updates.warondisease.org>",
      headers: {
        "List-Unsubscribe": expect.stringContaining(
          "mailto:unsubscribe@updates.warondisease.org",
        ),
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

    const payload = mocks.emailSend.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(payload.headers).toBeUndefined();
  });

  it("passes through a configured Reply-To address", async () => {
    await sendResendEmail({
      html: "<p>Hello</p>",
      replyTo: "reply+task_1@reply.test",
      scope: "task_notifications",
      subject: "Hello",
      text: "Hello",
      to: "citizen@example.com",
      userId: "user_1",
    });

    expect(mocks.emailSend.mock.calls[0]?.[0]).toMatchObject({
      replyTo: "reply+task_1@reply.test",
    });
  });

  it("can skip the automatic Wishonia signature when the body is already a comment notification", async () => {
    await sendResendEmail({
      html: "<p>Hello</p>",
      scope: "task_notifications",
      skipWishoniaSignature: true,
      subject: "Hello",
      text: "Hello",
      to: "citizen@example.com",
      userId: "user_1",
    });

    const payload = mocks.emailSend.mock.calls[0]?.[0];
    expect(payload).toMatchObject({
      html: "<p>Hello</p>",
      text: "Hello",
    });
  });

  it("replaces unsubscribe placeholders in the email body before sending", async () => {
    await sendResendEmail({
      html: `<a href="${EMAIL_UNSUBSCRIBE_URL_PLACEHOLDER}">Unsubscribe</a>`,
      scope: "task_notifications",
      skipWishoniaSignature: true,
      subject: "Hello",
      text: `Unsubscribe: ${EMAIL_UNSUBSCRIBE_URL_PLACEHOLDER}`,
      to: "citizen@example.com",
      userId: "user_1",
    });

    const payload = mocks.emailSend.mock.calls[0]?.[0];
    expect(payload.html).toContain(
      "https://optimitron.com/api/email/unsubscribe?token=abc",
    );
    expect(payload.text).toContain(
      "https://optimitron.com/api/email/unsubscribe?token=abc",
    );
    expect(payload.html).not.toContain(EMAIL_UNSUBSCRIBE_URL_PLACEHOLDER);
    expect(payload.text).not.toContain(EMAIL_UNSUBSCRIBE_URL_PLACEHOLDER);
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
