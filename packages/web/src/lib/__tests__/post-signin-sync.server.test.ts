import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensurePersonForUser: vi.fn(),
  ensureUserTreatyTask: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  postTaskCommentAndNotify: vi.fn(),
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

vi.mock("@/lib/tasks/user-treaty-task.server", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/tasks/user-treaty-task.server")
  >("@/lib/tasks/user-treaty-task.server");
  return {
    ...actual,
    ensureUserTreatyTask: mocks.ensureUserTreatyTask,
  };
});

vi.mock("@/lib/tasks/task-comment-notifications.server", () => ({
  postTaskCommentAndNotify: mocks.postTaskCommentAndNotify,
}));

import { applyPostSigninSync } from "../post-signin-sync.server";

describe("post-signin sync", () => {
  beforeEach(() => {
    mocks.findUnique.mockReset();
    mocks.ensurePersonForUser.mockReset();
    mocks.ensurePersonForUser.mockResolvedValue({ id: "person_1" });
    mocks.ensureUserTreatyTask.mockReset();
    mocks.ensureUserTreatyTask.mockResolvedValue({ created: false, taskId: "task_1" });
    mocks.postTaskCommentAndNotify.mockReset();
    mocks.postTaskCommentAndNotify.mockResolvedValue({
      commentId: "comment_1",
      status: "sent",
    });
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
    expect(mocks.ensureUserTreatyTask).toHaveBeenCalledWith({
      personId: "person_1",
      userId: "user_1",
    });
    expect(mocks.postTaskCommentAndNotify).not.toHaveBeenCalled();
  });

  it("posts a Wishonia welcome comment when the treaty task is freshly created", async () => {
    mocks.findUnique.mockResolvedValue({
      name: "Existing User",
      newsletterSubscribed: true,
    });
    mocks.recordReferralAttributionForUser.mockResolvedValue(false);
    mocks.ensureUserTreatyTask.mockResolvedValue({ created: true, taskId: "task_2" });

    await applyPostSigninSync({ userId: "user_1" });

    expect(mocks.postTaskCommentAndNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        authorNameOverride: "Wishonia",
        taskId: "task_2",
        message: expect.stringContaining("Wishonia"),
      }),
    );
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
