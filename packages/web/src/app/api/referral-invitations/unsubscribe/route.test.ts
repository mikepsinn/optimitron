import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  unsubscribeReferralInvitationRecipient: vi.fn(),
}));

vi.mock("@/lib/referral-invitations.server", () => ({
  unsubscribeReferralInvitationRecipient: mocks.unsubscribeReferralInvitationRecipient,
}));

import { GET, POST } from "./route";

describe("/api/referral-invitations/unsubscribe", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("unsubscribes from GET links with a confirmation page", async () => {
    mocks.unsubscribeReferralInvitationRecipient.mockResolvedValue(true);

    const response = await GET(
      new Request("http://localhost/api/referral-invitations/unsubscribe?i=invite_1&t=token_1"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(await response.text()).toContain("You have been unsubscribed");
    expect(mocks.unsubscribeReferralInvitationRecipient).toHaveBeenCalledWith({
      invitationId: "invite_1",
      token: "token_1",
    });
  });

  it("supports one-click POST unsubscribe", async () => {
    mocks.unsubscribeReferralInvitationRecipient.mockResolvedValue(true);

    const response = await POST(
      new Request("http://localhost/api/referral-invitations/unsubscribe", {
        body: new URLSearchParams({ i: "invite_1", t: "token_1" }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(204);
  });
});
