import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  canSendEmailToUser: vi.fn(),
  emailSend: vi.fn(),
  receivingGet: vi.fn(),
  serverEnv: {
    EMAIL_FROM: "team@optimitron.com" as string | undefined,
    EMAIL_MONITOR_BCC: undefined as string | undefined,
    NODE_ENV: "development",
    RESEND_API_KEY: "resend_test_key" as string | undefined,
    RESEND_MOCK_SEND: undefined as "1" | undefined,
  },
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = {
      receiving: {
        get: mocks.receivingGet,
      },
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

// The Wishonia signature's avatar `<img src>` uses `getBaseUrl()`, which
// falls back to localhost in test runs (no canonical site origin env).
// The new `assertEmailSafe` send-boundary guard correctly rejects any
// body containing `localhost` — so we mock the base URL to a production
// origin for these unit tests. Real-world prod sends have VERCEL_URL set
// and never hit this fallback path.
vi.mock("@/lib/url", () => ({
  getBaseUrl: () => "https://optimitron.com",
  buildUserReferralUrl: (id: string | null | undefined) =>
    id ? `https://optimitron.com/vote/${id}` : "https://optimitron.com",
  buildReferralUrl: (id: string | null | undefined) =>
    id ? `https://optimitron.com/vote/${id}` : "https://optimitron.com",
}));

import { EMAIL_UNSUBSCRIBE_URL_PLACEHOLDER } from "../email/placeholders";
import {
  DEFAULT_SYSTEM_EMAIL_FROM,
  DEFAULT_UNSUBSCRIBE_EMAIL,
} from "../email/from-address";
import {
  getReceivedEmailContent,
  sendExternalResendEmail,
  sendReactEmail,
  sendResendEmail,
} from "../email/resend";
import { render } from "@react-email/components";

describe("sendResendEmail", () => {
  beforeEach(() => {
    mocks.canSendEmailToUser.mockReset();
    mocks.emailSend.mockReset();
    mocks.receivingGet.mockReset();
    mocks.serverEnv.EMAIL_FROM = "team@optimitron.com";
    mocks.serverEnv.EMAIL_MONITOR_BCC = undefined;
    mocks.serverEnv.NODE_ENV = "development";
    mocks.serverEnv.RESEND_API_KEY = "resend_test_key";
    mocks.serverEnv.RESEND_MOCK_SEND = undefined;
    mocks.canSendEmailToUser.mockResolvedValue(true);
    mocks.emailSend.mockResolvedValue({
      data: { id: "email_1" },
      error: null,
    });
    mocks.receivingGet.mockResolvedValue({
      data: {
        from: "Citizen <citizen@example.org>",
        headers: { "In-Reply-To": "<outbound@example.org>" },
        html: "<p>Done.</p>",
        subject: "Re: task",
        text: "Done.",
        to: ["reply+task_1@updates.warondisease.org"],
      },
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
      from: DEFAULT_SYSTEM_EMAIL_FROM,
      headers: {
        "List-Unsubscribe": expect.stringContaining(
          `mailto:${DEFAULT_UNSUBSCRIBE_EMAIL}`,
        ),
      },
    });
  });

  it("ignores EMAIL_FROM for default sends", async () => {
    mocks.serverEnv.EMAIL_FROM = "Optimitron <team@optimitron.com>";

    await sendResendEmail({
      html: "<p>Hello</p>",
      scope: "magic_link",
      subject: "Magic link",
      text: "Hello",
      to: "citizen@example.com",
      userId: "user_1",
    });

    const payload = mocks.emailSend.mock.calls[0]?.[0];
    expect(payload).toMatchObject({
      from: DEFAULT_SYSTEM_EMAIL_FROM,
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

  it("passes through caller headers while keeping unsubscribe headers", async () => {
    await sendResendEmail({
      headers: {
        "Message-ID": "<task-task_1-comm-comm_1@updates.warondisease.org>",
      },
      html: "<p>Hello</p>",
      scope: "task_notifications",
      subject: "Hello",
      text: "Hello",
      to: "citizen@example.com",
      userId: "user_1",
    });

    expect(mocks.emailSend.mock.calls[0]?.[0]).toMatchObject({
      headers: {
        "Message-ID": "<task-task_1-comm-comm_1@updates.warondisease.org>",
        "List-Unsubscribe": expect.stringContaining(
          "https://optimitron.com/api/email/unsubscribe?token=abc",
        ),
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
  });

  it("does not BCC a monitor address unless EMAIL_MONITOR_BCC is configured", async () => {
    await sendResendEmail({
      html: "<p>Hello</p>",
      scope: "task_notifications",
      subject: "Hello",
      text: "Hello",
      to: "citizen@example.com",
      userId: "user_1",
    });

    const payload = mocks.emailSend.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(payload.bcc).toBeUndefined();
  });

  it("merges configured monitor BCC with per-message BCCs", async () => {
    mocks.serverEnv.EMAIL_MONITOR_BCC = "M@ThinkByNumbers.org";

    await sendResendEmail({
      bcc: ["admin@example.com", "m@thinkbynumbers.org"],
      html: "<p>Hello</p>",
      scope: "task_notifications",
      subject: "Hello",
      text: "Hello",
      to: "citizen@example.com",
      userId: "user_1",
    });

    expect(mocks.emailSend.mock.calls[0]?.[0]).toMatchObject({
      bcc: ["admin@example.com", "m@thinkbynumbers.org"],
    });
  });

  it("disables monitor BCC when EMAIL_MONITOR_BCC is explicitly false", async () => {
    mocks.serverEnv.EMAIL_MONITOR_BCC = "false";

    await sendResendEmail({
      html: "<p>Hello</p>",
      scope: "task_notifications",
      subject: "Hello",
      text: "Hello",
      to: "citizen@example.com",
      userId: "user_1",
    });

    const payload = mocks.emailSend.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(payload.bcc).toBeUndefined();
  });

  it("disables monitor BCC when EMAIL_MONITOR_BCC is explicitly 0", async () => {
    mocks.serverEnv.EMAIL_MONITOR_BCC = "0";

    await sendResendEmail({
      html: "<p>Hello</p>",
      scope: "task_notifications",
      subject: "Hello",
      text: "Hello",
      to: "citizen@example.com",
      userId: "user_1",
    });

    const payload = mocks.emailSend.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(payload.bcc).toBeUndefined();
  });

  it("does not BCC the monitor address when the monitor is the recipient", async () => {
    mocks.serverEnv.EMAIL_MONITOR_BCC = "m@thinkbynumbers.org";

    await sendResendEmail({
      html: "<p>Hello</p>",
      scope: "task_notifications",
      subject: "Hello",
      text: "Hello",
      to: "M@ThinkByNumbers.org",
      userId: "user_1",
    });

    const payload = mocks.emailSend.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(payload.bcc).toBeUndefined();
  });

  it("BCCs the monitor address on React emails", async () => {
    mocks.serverEnv.EMAIL_MONITOR_BCC = "m@thinkbynumbers.org";
    vi.mocked(render).mockResolvedValueOnce("<p>Hello</p>");
    vi.mocked(render).mockResolvedValueOnce("Hello");

    await sendReactEmail({
      react: { props: { children: "Hello" }, type: "div" } as never,
      scope: "task_notifications",
      subject: "Hello",
      to: "citizen@example.com",
      userId: "user_1",
    });

    expect(mocks.emailSend.mock.calls[0]?.[0]).toMatchObject({
      bcc: ["m@thinkbynumbers.org"],
    });
  });

  it("BCCs the monitor address on external emails", async () => {
    mocks.serverEnv.EMAIL_MONITOR_BCC = "m@thinkbynumbers.org";

    await sendExternalResendEmail({
      html: "<p>Hello</p>",
      subject: "Hello",
      text: "Hello",
      to: "citizen@example.com",
    });

    expect(mocks.emailSend.mock.calls[0]?.[0]).toMatchObject({
      bcc: ["m@thinkbynumbers.org"],
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

  it("fetches received email content for inbound reply webhooks", async () => {
    await expect(getReceivedEmailContent("received_1")).resolves.toEqual({
      from: "Citizen <citizen@example.org>",
      headers: { "In-Reply-To": "<outbound@example.org>" },
      html: "<p>Done.</p>",
      subject: "Re: task",
      text: "Done.",
      to: ["reply+task_1@updates.warondisease.org"],
    });

    expect(mocks.receivingGet).toHaveBeenCalledWith("received_1");
  });
});
