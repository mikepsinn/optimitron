import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensurePersonForUser: vi.fn(),
  hashPassword: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  recordReferralAttributionForUser: vi.fn(),
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

import { POST } from "./route";

describe("signup auth route", () => {
  beforeEach(() => {
    mocks.hashPassword.mockReset();
    mocks.ensurePersonForUser.mockReset();
    mocks.findUnique.mockReset();
    mocks.create.mockReset();
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

  it("creates the user and records attribution; Person.handle is seeded by ensurePersonForUser", async () => {
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
    expect(mocks.recordReferralAttributionForUser).toHaveBeenCalledWith(
      "user_1",
      "REF123",
      "sa_123",
    );
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
