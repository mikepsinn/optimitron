import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensurePersonForUser: vi.fn(),
  personFindFirst: vi.fn(),
  personUpdate: vi.fn(),
  userUpdate: vi.fn(),
  userFindUniqueOrThrow: vi.fn(),
  userFindUnique: vi.fn(),
  $transaction: vi.fn(),
}));

vi.mock("@/lib/person.server", () => ({
  ensurePersonForUser: mocks.ensurePersonForUser,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    person: {
      findFirst: mocks.personFindFirst,
      update: mocks.personUpdate,
    },
    user: {
      findUnique: mocks.userFindUnique,
      findUniqueOrThrow: mocks.userFindUniqueOrThrow,
      update: mocks.userUpdate,
    },
    $transaction: mocks.$transaction,
  },
}));

import {
  ProfileValidationError,
  updateUserProfile,
} from "../profile-identity.server";

beforeEach(() => {
  mocks.ensurePersonForUser.mockReset();
  mocks.personFindFirst.mockReset();
  mocks.personUpdate.mockReset();
  mocks.userUpdate.mockReset();
  mocks.userFindUniqueOrThrow.mockReset();
  mocks.userFindUnique.mockReset();
  mocks.$transaction.mockReset();

  // Run the transaction callback inline against a tx that delegates to the
  // mocked top-level prisma client. Keeps the assertion focus on which model
  // and field set the writer touches, not on transaction internals.
  mocks.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
    return fn({
      person: { update: mocks.personUpdate },
      user: {
        findUniqueOrThrow: mocks.userFindUniqueOrThrow,
        update: mocks.userUpdate,
      },
    });
  });

  mocks.userFindUniqueOrThrow.mockResolvedValue({ personId: "person_1" });

  // Profile identity data fetch at the end of updateUserProfile. Returns null
  // so we can ignore the rendered DTO and just assert on the writer calls.
  mocks.userFindUnique.mockResolvedValue(null);
});

describe("updateUserProfile", () => {
  it("writes display fields to Person, not User", async () => {
    await updateUserProfile("user_1", {
      name: "Ada",
      bio: "hi",
      handle: "ada",
      headline: "engineer",
      website: "https://ada.dev",
      coverImage: "https://img/cover.png",
      isPublic: true,
    });

    expect(mocks.personUpdate).toHaveBeenCalledWith({
      where: { id: "person_1" },
      data: {
        displayName: "Ada",
        handle: "ada",
        bio: "hi",
        headline: "engineer",
        website: "https://ada.dev",
        coverImage: "https://img/cover.png",
        isPublic: true,
      },
    });
    // User update should only carry account-only fields (name + bio mirrors
    // remain transitional). No handle / headline / coverImage / website /
    // isPublic on the User write.
    const userData = mocks.userUpdate.mock.calls[0]?.[0]?.data ?? {};
    expect(userData).not.toHaveProperty("handle");
    expect(userData).not.toHaveProperty("username");
    expect(userData).not.toHaveProperty("headline");
    expect(userData).not.toHaveProperty("coverImage");
    expect(userData).not.toHaveProperty("website");
    expect(userData).not.toHaveProperty("isPublic");
  });

  it("normalises the handle to lowercase before writing", async () => {
    await updateUserProfile("user_1", { handle: "MixedCase" });

    expect(mocks.personUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ handle: "mixedcase" }),
      }),
    );
  });

  it("throws ProfileValidationError when the handle collides with another Person", async () => {
    mocks.personFindFirst.mockResolvedValueOnce({ id: "person_other" });

    await expect(
      updateUserProfile("user_1", { handle: "ada" }),
    ).rejects.toBeInstanceOf(ProfileValidationError);
    expect(mocks.personUpdate).not.toHaveBeenCalled();
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });

  it("rejects handles outside the 3–24 character range", async () => {
    await expect(
      updateUserProfile("user_1", { handle: "ab" }),
    ).rejects.toBeInstanceOf(ProfileValidationError);
  });

  it("rejects handles with disallowed characters", async () => {
    await expect(
      updateUserProfile("user_1", { handle: "has spaces" }),
    ).rejects.toBeInstanceOf(ProfileValidationError);
  });
});
