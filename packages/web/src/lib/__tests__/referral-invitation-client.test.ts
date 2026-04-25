import { describe, expect, it, vi } from "vitest";
import {
  buildReferralInvitationShareMessage,
  createReferralInvitationRequest,
  getReferralInvitationSenderName,
  updateReferralInvitationRequest,
  type ReferralInvitationClientRecord,
} from "@/lib/referral-invitation-client";

const invitation: ReferralInvitationClientRecord = {
  id: "invite_1",
  inviteToken: "invite_token",
  recipientEmail: "jake@example.com",
  recipientName: "Jake Smith",
};

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("referral invitation client helpers", () => {
  it("builds invite-token share messages from the sender user", () => {
    const message = buildReferralInvitationShareMessage({
      baseUrl: "https://warondisease.org",
      invitation,
      messageFormat: "SINCERE",
      senderName: "Ada",
      user: {
        name: "Ada",
        referralCode: "ada_fallback",
        username: "ada",
      },
    });

    expect(message).toContain("Hi Jake.");
    expect(message).toContain("https://warondisease.org/vote/ada?invite=invite_token");
  });

  it("uses name, username, then default sender display name", () => {
    expect(getReferralInvitationSenderName({ name: " Ada ", username: "ada" })).toBe("Ada");
    expect(getReferralInvitationSenderName({ name: " ", username: "ada" })).toBe("ada");
    expect(getReferralInvitationSenderName(null)).toBe("A voter");
  });

  it("creates invitations through the referral invitation API", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ invitation }, { status: 201 }));

    const result = await createReferralInvitationRequest(
      {
        contactMethod: "EMAIL",
        messageFormat: "TASK_NOTIFICATION",
        recipientEmail: "jake@example.com",
        recipientName: "Jake",
      },
      fetcher as unknown as typeof fetch,
    );

    expect(result).toEqual(invitation);
    expect(fetcher).toHaveBeenCalledWith(
      "/api/referral-invitations",
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );
    const [, init] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      contactMethod: "EMAIL",
      messageFormat: "TASK_NOTIFICATION",
      recipientEmail: "jake@example.com",
      recipientName: "Jake",
    });
  });

  it("surfaces create errors from the API payload", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({ error: "Recipient email cannot be your own email." }, { status: 400 }),
    );

    await expect(
      createReferralInvitationRequest(
        {
          contactMethod: "EMAIL",
          messageFormat: "SINCERE",
          recipientEmail: "ada@example.com",
          recipientName: "Ada",
        },
        fetcher as unknown as typeof fetch,
      ),
    ).rejects.toThrow("Recipient email cannot be your own email.");
  });

  it("updates invitations through the referral invitation API", async () => {
    const payload = { invitation, status: "sent" };
    const fetcher = vi.fn(async () => jsonResponse(payload));

    const result = await updateReferralInvitationRequest(
      {
        action: "sendEmail",
        id: "invite_1",
        messageText: "edited message",
      },
      fetcher as unknown as typeof fetch,
    );

    expect(result).toEqual(payload);
    expect(fetcher).toHaveBeenCalledWith(
      "/api/referral-invitations",
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      }),
    );
    const [, init] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      action: "sendEmail",
      id: "invite_1",
      messageText: "edited message",
    });
  });
});
