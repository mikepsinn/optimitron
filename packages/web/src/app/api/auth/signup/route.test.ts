import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensurePersonForUser: vi.fn(),
  hashPassword: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  recordReferralAttributionForUser: vi.fn(),
  userCount: vi.fn(),
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
      count: mocks.userCount,
    },
  },
}));

vi.mock("@/lib/referral.server", () => ({
  recordReferralAttributionForUser: mocks.recordReferralAttributionForUser,
}));

import { POST } from "./route";

describe("signup auth route", () => {
  beforeEach(() => {
    mocks.hashPassword.mockReset();
    mocks.ensurePersonForUser.mockReset();
    mocks.findUnique.mockReset();
    mocks.create.mockReset();
    mocks.userCount.mockReset();
    mocks.userCount.mockResolvedValue(0);
    mocks.recordReferralAttributionForUser.mockReset();
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

  it("silently accepts honeypot signups without creating an account", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email: "bot@example.com",
          password: "long-enough-password",
          companyWebsite: "https://spam.example",
        }),
      }) as never,
    );

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(mocks.hashPassword).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.recordReferralAttributionForUser).not.toHaveBeenCalled();
  });

  it("quietly suppresses direct signup floods before hashing passwords", async () => {
    mocks.userCount.mockResolvedValue(1_000);

    const response = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email: "flood@example.com",
          password: "long-enough-password",
        }),
      }) as never,
    );

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mocks.userCount).toHaveBeenCalledWith({
      where: {
        createdAt: expect.objectContaining({ gte: expect.any(Date) }),
        deletedAt: null,
      },
    });
    expect(mocks.hashPassword).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.recordReferralAttributionForUser).not.toHaveBeenCalled();
  });

  it("creates the user without awarding referral credit before verification; Person.handle is seeded by ensurePersonForUser", async () => {
    // email check → no existing user; referral code → available.
    // The route no longer writes User.username — handle is seeded on Person
    // by ensurePersonForUser, which is mocked here as a side-effect-free spy.
    mocks.findUnique.mockResolvedValueOnce(null);
    mocks.hashPassword.mockResolvedValue("hashed-password");
    mocks.findUnique.mockResolvedValueOnce(null);
    mocks.create.mockResolvedValue({
      id: "user_1",
      email: "user@example.com",
      referralCode: "REFCODE1",
      newsletterSubscribed: true,
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
        referralCode: expect.any(String),
        newsletterSubscribed: true,
      },
    });
    // User.create must NOT carry display fields — they live on Person now.
    const createPayload = mocks.create.mock.calls[0]?.[0]?.data ?? {};
    expect(createPayload).not.toHaveProperty("username");
    expect(createPayload).not.toHaveProperty("name");
    expect(createPayload).not.toHaveProperty("image");
    expect(createPayload).not.toHaveProperty("bio");
    expect(mocks.recordReferralAttributionForUser).not.toHaveBeenCalled();
    // The signup form's `name` is forwarded to Person via ensurePersonForUser.
    expect(mocks.ensurePersonForUser).toHaveBeenCalledWith("user_1", {
      displayName: "Test User",
    });
    await expect(response.json()).resolves.toEqual({
      success: true,
      userId: "user_1",
    });
  });
});
