import type { SendVerificationRequestParams } from "next-auth/providers/email";
import type { MockInstance } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendMagicLinkEmail: vi.fn(),
  userCount: vi.fn(),
  verificationTokenCount: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      count: mocks.userCount,
    },
    verificationToken: {
      count: mocks.verificationTokenCount,
    },
  },
}));

vi.mock("@/lib/email/magic-link-email", () => ({
  sendMagicLinkEmail: mocks.sendMagicLinkEmail,
}));

import { sendSpamGuardedMagicLinkEmail } from "../auth-spam-guard.server";

let consoleLogSpy: MockInstance<
  [message?: unknown, ...optionalParams: unknown[]],
  void
>;

function magicLinkParams(
  identifier = "human@example.com",
): SendVerificationRequestParams {
  return {
    expires: new Date("2026-05-23T18:00:00.000Z"),
    identifier,
    provider: {} as SendVerificationRequestParams["provider"],
    theme: {} as SendVerificationRequestParams["theme"],
    token: "token-1",
    url: "https://warondisease.org/api/auth/callback/email?token=token-1",
  };
}

describe("auth spam guard", () => {
  beforeEach(() => {
    consoleLogSpy?.mockRestore();
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    mocks.sendMagicLinkEmail.mockReset();
    mocks.sendMagicLinkEmail.mockResolvedValue({
      existingUser: false,
      providerMessageId: "email_1",
    });
    mocks.userCount.mockReset();
    mocks.verificationTokenCount.mockReset();
    mocks.verificationTokenCount.mockResolvedValue(1);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  function lastAuthLog() {
    const raw = consoleLogSpy.mock.calls.at(-1)?.[0];
    expect(typeof raw).toBe("string");
    return JSON.parse(raw as string) as Record<string, unknown>;
  }

  it("quietly suppresses magic-link email after repeated recent requests for the same address", async () => {
    mocks.verificationTokenCount.mockResolvedValue(6);

    await expect(
      sendSpamGuardedMagicLinkEmail(magicLinkParams("Human@Example.COM")),
    ).resolves.toBeUndefined();

    expect(mocks.verificationTokenCount).toHaveBeenCalledWith({
      where: {
        createdAt: expect.objectContaining({ gte: expect.any(Date) }),
        deletedAt: null,
        identifier: {
          equals: "human@example.com",
          mode: "insensitive",
        },
      },
    });
    expect(mocks.sendMagicLinkEmail).not.toHaveBeenCalled();
    expect(lastAuthLog()).toMatchObject({
      authCallbackHost: "warondisease.org",
      emailDomain: "example.com",
      msg: "auth_magic_link_request",
      outcome: "suppressed",
      reason: "repeated_email",
      recentTokenCount: 6,
      route: "/api/auth/signin/email",
    });
  });

  it("normalizes and sends normal magic-link email below the repeated-request limit", async () => {
    mocks.verificationTokenCount.mockResolvedValue(2);

    await sendSpamGuardedMagicLinkEmail(magicLinkParams("Human@Example.COM"));

    expect(mocks.sendMagicLinkEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "human@example.com",
      }),
    );
    expect(lastAuthLog()).toMatchObject({
      authCallbackHost: "warondisease.org",
      emailDomain: "example.com",
      existingUser: false,
      msg: "auth_magic_link_request",
      outcome: "sent",
      providerMessageId: "email_1",
      recentTokenCount: 2,
      route: "/api/auth/signin/email",
    });
  });

  it("counts only password users for the direct signup flood limiter", async () => {
    const { shouldSuppressDirectPasswordSignup } =
      await import("../auth-spam-guard.server");
    mocks.userCount.mockResolvedValue(0);

    await expect(
      shouldSuppressDirectPasswordSignup(new Date("2026-05-23T18:00:00.000Z")),
    ).resolves.toBe(false);

    expect(mocks.userCount).toHaveBeenCalledWith({
      where: {
        createdAt: expect.objectContaining({ gte: expect.any(Date) }),
        deletedAt: null,
        password: { not: null },
      },
    });
  });
});
