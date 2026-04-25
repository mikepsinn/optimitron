import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isAuthorizedCronRequest: vi.fn(),
  processDueReferralInvitationRecipientEmails: vi.fn(),
  processDueReferralInvitationSenderEmails: vi.fn(),
  processDueTreatyMonthlyScorecardEmails: vi.fn(),
  processDueTreatyNeverSharedReengagementEmails: vi.fn(),
}));

vi.mock("@/lib/cron", () => ({
  isAuthorizedCronRequest: mocks.isAuthorizedCronRequest,
}));

vi.mock("@/lib/referral-invitations.server", () => ({
  processDueReferralInvitationRecipientEmails:
    mocks.processDueReferralInvitationRecipientEmails,
  processDueReferralInvitationSenderEmails:
    mocks.processDueReferralInvitationSenderEmails,
}));

vi.mock("@/lib/treaty-sender-emails.server", () => ({
  processDueTreatyMonthlyScorecardEmails:
    mocks.processDueTreatyMonthlyScorecardEmails,
  processDueTreatyNeverSharedReengagementEmails:
    mocks.processDueTreatyNeverSharedReengagementEmails,
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
    expect(mocks.processDueReferralInvitationSenderEmails).not.toHaveBeenCalled();
    expect(mocks.processDueTreatyMonthlyScorecardEmails).not.toHaveBeenCalled();
    expect(mocks.processDueTreatyNeverSharedReengagementEmails).not.toHaveBeenCalled();
  });

  it("processes due invitation recipient, sender, re-engagement, and monthly scorecard emails", async () => {
    mocks.isAuthorizedCronRequest.mockReturnValue(true);
    mocks.processDueReferralInvitationRecipientEmails.mockResolvedValue({
      failures: 0,
      scanned: 1,
      sent: 1,
      skipped: 0,
    });
    mocks.processDueReferralInvitationSenderEmails.mockResolvedValue({
      failures: 0,
      scanned: 2,
      sent: 1,
      skipped: 1,
    });
    mocks.processDueTreatyNeverSharedReengagementEmails.mockResolvedValue({
      failures: 0,
      scanned: 3,
      sent: 2,
      skipped: 1,
    });
    mocks.processDueTreatyMonthlyScorecardEmails.mockResolvedValue({
      failures: 0,
      scanned: 4,
      sent: 3,
      skipped: 1,
    });

    const response = await GET(new Request("http://localhost/api/cron/referral-invitations"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      recipientEmails: {
        failures: 0,
        scanned: 1,
        sent: 1,
        skipped: 0,
      },
      senderEmails: {
        failures: 0,
        scanned: 2,
        sent: 1,
        skipped: 1,
      },
      reengagementEmails: {
        failures: 0,
        scanned: 3,
        sent: 2,
        skipped: 1,
      },
      monthlyScorecardEmails: {
        failures: 0,
        scanned: 4,
        sent: 3,
        skipped: 1,
      },
    });
  });
});
