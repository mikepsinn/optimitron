import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  applyResubscribe: vi.fn(),
  applyUnsubscribe: vi.fn(),
  buildUnsubscribeUrl: vi.fn(),
  getEmailSuppressionStateForUser: vi.fn(),
  isMasterSuppressed: vi.fn(),
  isSendAllowed: vi.fn(),
  prismaUserFindUnique: vi.fn(),
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

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.prismaUserFindUnique,
    },
  },
}));

import { GET, POST } from "./route";

describe("unsubscribe route", () => {
  beforeEach(() => {
    mocks.applyResubscribe.mockReset();
    mocks.applyUnsubscribe.mockReset();
    mocks.buildUnsubscribeUrl.mockReset();
    mocks.getEmailSuppressionStateForUser.mockReset();
    mocks.isMasterSuppressed.mockReset();
    mocks.isSendAllowed.mockReset();
    mocks.prismaUserFindUnique.mockReset();
    mocks.verifyUnsubToken.mockReset();

    mocks.verifyUnsubToken.mockReturnValue(true);
    mocks.buildUnsubscribeUrl.mockReturnValue(
      "https://optimitron.com/api/email/unsubscribe?u=user_1&s=task_notifications&t=abc",
    );
  });

  it("GET renders a confirmation form without changing preferences", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/email/unsubscribe?u=user_1&s=task_notifications&t=abc",
      ),
    );

    expect(mocks.applyUnsubscribe).not.toHaveBeenCalled();
    expect(mocks.applyResubscribe).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Confirm unsubscribe");
    expect(html).toContain("Recipient email");
    expect(html).toContain("this is not your switch");
  });

  it("POST one-click applies unsubscribe without an email prompt", async () => {
    const response = await POST(
      new Request(
        "http://localhost/api/email/unsubscribe?u=user_1&s=task_notifications&t=abc",
        {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: "List-Unsubscribe=One-Click",
        },
      ),
    );

    expect(mocks.applyUnsubscribe).toHaveBeenCalledWith({
      userId: "user_1",
      scope: "task_notifications",
      emailLogId: null,
      via: "POST",
    });
    expect(mocks.prismaUserFindUnique).not.toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it("rejects a visible forwarded unsubscribe when the email does not match", async () => {
    mocks.prismaUserFindUnique.mockResolvedValue({
      email: "owner@example.com",
    });

    const response = await POST(
      new Request(
        "http://localhost/api/email/unsubscribe?u=user_1&s=task_notifications&t=abc",
        {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: "confirmEmail=friend%40example.com",
        },
      ),
    );

    expect(mocks.applyUnsubscribe).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    const html = await response.text();
    expect(html).toContain("does not match");
  });

  it("explains when a scope is re-enabled but the master opt-out is still active", async () => {
    mocks.prismaUserFindUnique.mockResolvedValue({
      email: "owner@example.com",
    });
    mocks.getEmailSuppressionStateForUser.mockResolvedValue({
      newsletterSubscribed: false,
      unsubscribedScopes: ["all"],
    });
    mocks.isMasterSuppressed.mockReturnValue(true);
    mocks.isSendAllowed.mockReturnValue(false);

    const response = await POST(
      new Request(
        "http://localhost/api/email/unsubscribe?u=user_1&s=task_notifications&t=abc&action=resubscribe",
        {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: "confirmEmail=owner%40example.com",
        },
      ),
    );

    expect(mocks.applyResubscribe).toHaveBeenCalledWith({
      userId: "user_1",
      scope: "task_notifications",
      emailLogId: null,
      via: "POST",
    });
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("master opt-out is still active");
    expect(html).toContain("/settings#email-preferences");
  });
});
