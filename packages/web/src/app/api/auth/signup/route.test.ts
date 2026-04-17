import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensurePersonForUser: vi.fn(),
  hashPassword: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  recordReferralAttributionForUser: vi.fn(),
  sendWelcomeReferralEmailForUser: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  hashPassword: mocks.hashPassword,
}));

vi.mock("@/lib/person.server", () => ({
  ensurePersonForUser: mocks.ensurePersonForUser,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.findUnique,
      create: mocks.create,
    },
  },
}));

vi.mock("@/lib/referral.server", () => ({
  recordReferralAttributionForUser: mocks.recordReferralAttributionForUser,
}));

vi.mock("@/lib/referral-email.server", () => ({
  sendWelcomeReferralEmailForUser: mocks.sendWelcomeReferralEmailForUser,
}));

import { POST } from "./route";

describe("signup auth route", () => {
  beforeEach(() => {
    mocks.hashPassword.mockReset();
    mocks.ensurePersonForUser.mockReset();
    mocks.findUnique.mockReset();
    mocks.create.mockReset();
    mocks.recordReferralAttributionForUser.mockReset();
    mocks.sendWelcomeReferralEmailForUser.mockReset();
  });

  it("rejects passwords shorter than eight characters", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "short",
        }),
      }) as never,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Password must be at least 8 characters.",
    });
  });

  it("creates the user, records attribution, and sends the welcome email", async () => {
    // email check → no existing user; username uniqueness → available; referral code → available
    mocks.findUnique.mockResolvedValueOnce(null);
    mocks.hashPassword.mockResolvedValue("hashed-password");
    mocks.findUnique.mockResolvedValueOnce(null);
    mocks.findUnique.mockResolvedValueOnce(null);
    mocks.create.mockResolvedValue({
      id: "user_1",
      email: "user@example.com",
      name: "Test User",
      username: "covert-optimizer",
      referralCode: "REFCODE1",
      newsletterSubscribed: true,
      referralEmailSequenceLastSentAt: null,
      referralEmailSequenceStep: 0,
      createdAt: new Date("2026-03-11T00:00:00.000Z"),
    });

    const response = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "long-enough-password",
          name: "Test User",
          referralCode: "REF123",
          shareAttemptId: "sa_123",
          newsletterSubscribed: true,
        }),
      }) as never,
    );

    expect(response.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        email: "user@example.com",
        password: "hashed-password",
        name: "Test User",
        username: expect.any(String),
        referralCode: expect.any(String),
        newsletterSubscribed: true,
      },
    });
    expect(mocks.recordReferralAttributionForUser).toHaveBeenCalledWith(
      "user_1",
      "REF123",
      "sa_123",
    );
    expect(mocks.ensurePersonForUser).toHaveBeenCalledWith("user_1");
    expect(mocks.sendWelcomeReferralEmailForUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user_1",
        email: "user@example.com",
      }),
    );
    await expect(response.json()).resolves.toEqual({
      success: true,
      userId: "user_1",
    });
  });
});
