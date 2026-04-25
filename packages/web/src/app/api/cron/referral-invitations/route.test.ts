import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isAuthorizedCronRequest: vi.fn(),
  processDueReferralInvitationRecipientEmails: vi.fn(),
}));

vi.mock("@/lib/cron", () => ({
  isAuthorizedCronRequest: mocks.isAuthorizedCronRequest,
}));

vi.mock("@/lib/referral-invitations.server", () => ({
  processDueReferralInvitationRecipientEmails:
    mocks.processDueReferralInvitationRecipientEmails,
}));

import { GET } from "./route";

describe("/api/cron/referral-invitations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects unauthorized cron requests", async () => {
    mocks.isAuthorizedCronRequest.mockReturnValue(false);

    const response = await GET(new Request("http://localhost/api/cron/referral-invitations"));

    expect(response.status).toBe(401);
    expect(mocks.processDueReferralInvitationRecipientEmails).not.toHaveBeenCalled();
  });

  it("processes due invitation recipient emails", async () => {
    mocks.isAuthorizedCronRequest.mockReturnValue(true);
    mocks.processDueReferralInvitationRecipientEmails.mockResolvedValue({
      failures: 0,
      scanned: 1,
      sent: 1,
      skipped: 0,
    });

    const response = await GET(new Request("http://localhost/api/cron/referral-invitations"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      failures: 0,
      scanned: 1,
      sent: 1,
      skipped: 0,
    });
  });
});
