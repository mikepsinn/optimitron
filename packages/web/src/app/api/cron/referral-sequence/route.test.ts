import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isAuthorizedCronRequest: vi.fn(),
  processDueReferralSequenceEmails: vi.fn(),
}));

vi.mock("@/lib/cron", () => ({
  isAuthorizedCronRequest: mocks.isAuthorizedCronRequest,
}));

vi.mock("@/lib/email/referral-email.server", () => ({
  processDueReferralSequenceEmails: mocks.processDueReferralSequenceEmails,
}));

import { GET } from "./route";

describe("referral sequence cron route", () => {
  beforeEach(() => {
    mocks.isAuthorizedCronRequest.mockReset();
    mocks.processDueReferralSequenceEmails.mockReset();
  });

  it("returns 401 for unauthorized requests", async () => {
    mocks.isAuthorizedCronRequest.mockReturnValue(false);

    const response = await GET(new Request("http://localhost/api/cron/referral-sequence"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns the processing summary for authorized requests", async () => {
    mocks.isAuthorizedCronRequest.mockReturnValue(true);
    mocks.processDueReferralSequenceEmails.mockResolvedValue({
      disabled: false,
      completed: 2,
      failures: 0,
      scanned: 10,
      sent: 3,
    });

    const response = await GET(new Request("http://localhost/api/cron/referral-sequence"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      disabled: false,
      completed: 2,
      failures: 0,
      scanned: 10,
      sent: 3,
    });
  });
});
