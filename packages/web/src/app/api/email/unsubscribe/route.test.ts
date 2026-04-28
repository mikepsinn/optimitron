import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  applyResubscribe: vi.fn(),
  applyUnsubscribe: vi.fn(),
  buildUnsubscribeUrl: vi.fn(),
  getEmailSuppressionStateForUser: vi.fn(),
  isMasterSuppressed: vi.fn(),
  isSendAllowed: vi.fn(),
  verifyUnsubToken: vi.fn(),
}));

vi.mock("@/lib/email/can-send.server", () => ({
  getEmailSuppressionStateForUser: mocks.getEmailSuppressionStateForUser,
  isMasterSuppressed: mocks.isMasterSuppressed,
  isSendAllowed: mocks.isSendAllowed,
}));

vi.mock("@/lib/email/suppression.server", () => ({
  applyResubscribe: mocks.applyResubscribe,
  applyUnsubscribe: mocks.applyUnsubscribe,
}));

vi.mock("@/lib/email/unsub-token", () => ({
  verifyUnsubToken: mocks.verifyUnsubToken,
}));

vi.mock("@/lib/email/unsub-url", () => ({
  buildUnsubscribeUrl: mocks.buildUnsubscribeUrl,
}));

import { GET } from "./route";

describe("unsubscribe route", () => {
  beforeEach(() => {
    mocks.applyResubscribe.mockReset();
    mocks.applyUnsubscribe.mockReset();
    mocks.buildUnsubscribeUrl.mockReset();
    mocks.getEmailSuppressionStateForUser.mockReset();
    mocks.isMasterSuppressed.mockReset();
    mocks.isSendAllowed.mockReset();
    mocks.verifyUnsubToken.mockReset();

    mocks.verifyUnsubToken.mockReturnValue(true);
    mocks.buildUnsubscribeUrl.mockReturnValue(
      "https://optimitron.com/api/email/unsubscribe?u=user_1&s=task_notifications&t=abc",
    );
  });

  it("explains when a scope is re-enabled but the master opt-out is still active", async () => {
    mocks.getEmailSuppressionStateForUser.mockResolvedValue({
      newsletterSubscribed: false,
      unsubscribedScopes: ["all"],
    });
    mocks.isMasterSuppressed.mockReturnValue(true);
    mocks.isSendAllowed.mockReturnValue(false);

    const response = await GET(
      new Request(
        "http://localhost/api/email/unsubscribe?u=user_1&s=task_notifications&t=abc&action=resubscribe",
      ),
    );

    expect(mocks.applyResubscribe).toHaveBeenCalledWith({
      userId: "user_1",
      scope: "task_notifications",
      emailLogId: null,
      via: "GET",
    });
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("master opt-out is still active");
    expect(html).toContain("/settings#email-preferences");
  });
});
