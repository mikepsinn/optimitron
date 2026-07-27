import { describe, expect, it } from "vitest";
import {
  buildNetworkBlockedHtmlPreview,
  readOutboundEnvelopeV2,
} from "./TaskExternalActionApprovals";

describe("readOutboundEnvelopeV2", () => {
  it("preserves every field in the exact version 2 email envelope", () => {
    expect(
      readOutboundEnvelopeV2({
        communicationId: "communication_1",
        delivery: {
          recipientUserId: "user_1",
          scope: "task_notifications",
        },
        emailLogId: "email_log_1",
        envelope: {
          bcc: ["audit@example.org"],
          from: "Wishonia <hello@example.org>",
          headers: {
            "In-Reply-To": "<message@example.org>",
            "X-Approval-Test": "exact",
          },
          html: "<p>Exact HTML</p>",
          replyTo: "reply@example.org",
          subject: "Exact subject",
          text: "Exact text",
          to: ["human@example.org"],
        },
        version: 2,
      }),
    ).toEqual({
      bcc: ["audit@example.org"],
      communicationId: "communication_1",
      emailLogId: "email_log_1",
      from: "Wishonia <hello@example.org>",
      headers: {
        "In-Reply-To": "<message@example.org>",
        "X-Approval-Test": "exact",
      },
      html: "<p>Exact HTML</p>",
      replyTo: "reply@example.org",
      subject: "Exact subject",
      text: "Exact text",
      to: ["human@example.org"],
    });
  });

  it("does not present a legacy payload as an exact version 2 envelope", () => {
    expect(
      readOutboundEnvelopeV2({
        from: "hello@example.org",
        subject: "Legacy",
        text: "Legacy text",
      }),
    ).toBeNull();
  });

  it("rejects incomplete version 2 payloads instead of exposing approval", () => {
    expect(
      readOutboundEnvelopeV2({
        delivery: {
          recipientUserId: null,
          scope: "task_notifications",
        },
        envelope: {},
        version: 2,
      }),
    ).toBeNull();
  });
});

describe("buildNetworkBlockedHtmlPreview", () => {
  it("blocks preview network requests without changing the stored HTML source", () => {
    const source =
      '<html><head><meta http-equiv="refresh" content="0;url=https://tracker.example/refresh"><title>Email</title></head><body><a href="https://tracker.example/click">Open</a><img src="https://tracker.example/pixel"></body></html>';
    const preview = buildNetworkBlockedHtmlPreview(source);

    expect(preview).toContain("default-src 'none'");
    expect(preview).toContain("base-uri 'none'");
    expect(preview).toContain("form-action 'none'");
    expect(preview).toContain("img-src data: cid:");
    expect(preview).toContain("style-src 'unsafe-inline'");
    expect(preview).not.toMatch(/http-equiv=["']refresh["']/i);
    expect(preview).not.toMatch(/\shref\s*=/i);
    expect(source).not.toContain("Content-Security-Policy");
  });
});
