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

type FetchArgs = Parameters<typeof fetch>;
type FetchResult = ReturnType<typeof fetch>;
type FetchMock = ReturnType<typeof vi.fn<FetchArgs, FetchResult>>;

function mockFetchResponse(body: unknown, init?: ResponseInit): FetchMock {
  return vi.fn<FetchArgs, FetchResult>(async () => jsonResponse(body, init));
}

function getFirstRequestBody(fetcher: FetchMock) {
  const init = fetcher.mock.calls[0]?.[1];
  if (typeof init?.body !== "string") {
    throw new Error("Expected fetch to be called with a string request body.");
  }
  return JSON.parse(init.body);
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
    const fetcher = mockFetchResponse({ invitation }, { status: 201 });

    const result = await createReferralInvitationRequest(
      {
        contactMethod: "EMAIL",
        messageFormat: "TASK_NOTIFICATION",
        recipientEmail: "jake@example.com",
        recipientName: "Jake",
      },
      fetcher,
    );

    expect(result).toEqual(invitation);
    expect(fetcher).toHaveBeenCalledWith(
      "/api/referral-invitations",
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );
    expect(getFirstRequestBody(fetcher)).toEqual({
      contactMethod: "EMAIL",
      messageFormat: "TASK_NOTIFICATION",
      recipientEmail: "jake@example.com",
      recipientName: "Jake",
    });
  });

  it("surfaces create errors from the API payload", async () => {
    const fetcher = mockFetchResponse(
      { error: "Recipient email cannot be your own email." },
      { status: 400 },
    );

    await expect(
      createReferralInvitationRequest(
        {
          contactMethod: "EMAIL",
          messageFormat: "SINCERE",
          recipientEmail: "ada@example.com",
          recipientName: "Ada",
        },
        fetcher,
      ),
    ).rejects.toThrow("Recipient email cannot be your own email.");
  });

  it("updates invitations through the referral invitation API", async () => {
    const payload = { invitation, status: "ok" };
    const fetcher = mockFetchResponse(payload);

    const result = await updateReferralInvitationRequest(
      {
        action: "markCopied",
        id: "invite_1",
        messageText: "edited message",
        shareChannel: "whatsapp",
      },
      fetcher,
    );

    expect(result).toEqual(payload);
    expect(fetcher).toHaveBeenCalledWith(
      "/api/referral-invitations",
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      }),
    );
    expect(getFirstRequestBody(fetcher)).toEqual({
      action: "markCopied",
      id: "invite_1",
      messageText: "edited message",
      shareChannel: "whatsapp",
    });
  });
});
