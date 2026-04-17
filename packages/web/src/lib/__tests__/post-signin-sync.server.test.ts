import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensurePersonForUser: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  recordReferralAttributionForUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
  },
}));

vi.mock("@/lib/referral.server", () => ({
  recordReferralAttributionForUser: mocks.recordReferralAttributionForUser,
}));

vi.mock("@/lib/person.server", () => ({
  ensurePersonForUser: mocks.ensurePersonForUser,
}));

import { applyPostSigninSync } from "../post-signin-sync.server";

describe("post-signin sync", () => {
  beforeEach(() => {
    mocks.findUnique.mockReset();
    mocks.ensurePersonForUser.mockReset();
    mocks.update.mockReset();
    mocks.recordReferralAttributionForUser.mockReset();
  });

  it("updates missing profile fields and records referral attribution", async () => {
    mocks.findUnique.mockResolvedValue({
      name: null,
      newsletterSubscribed: true,
    });
    mocks.recordReferralAttributionForUser.mockResolvedValue(true);

    await expect(
      applyPostSigninSync({
        userId: "user_1",
        name: "Jane Doe",
        newsletterSubscribed: false,
        referralCode: "REF123",
        shareAttemptId: "sa_123",
      }),
    ).resolves.toEqual({
      referralRecorded: true,
      userUpdated: true,
    });

    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: {
        name: "Jane Doe",
        newsletterSubscribed: false,
      },
    });
    expect(mocks.recordReferralAttributionForUser).toHaveBeenCalledWith(
      "user_1",
      "REF123",
      "sa_123",
    );
    expect(mocks.ensurePersonForUser).toHaveBeenCalledWith("user_1");
  });

  it("leaves the user unchanged when nothing new is provided", async () => {
    mocks.findUnique.mockResolvedValue({
      name: "Existing User",
      newsletterSubscribed: true,
    });
    mocks.recordReferralAttributionForUser.mockResolvedValue(false);

    await expect(
      applyPostSigninSync({
        userId: "user_1",
        name: "New Name",
      }),
    ).resolves.toEqual({
      referralRecorded: false,
      userUpdated: false,
    });

    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.ensurePersonForUser).toHaveBeenCalledWith("user_1");
  });
});
