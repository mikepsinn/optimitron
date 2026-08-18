import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureNearbyFlyerHangTasks: vi.fn(),
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

vi.mock("@/lib/triggers", () => ({
  fireTaskTrigger: vi.fn().mockResolvedValue({ result: "filteredOut", spawnedTaskIds: [], spawnedTaskKeys: [] }),
  fireTaskTriggersForEvent: vi.fn().mockResolvedValue([]),
  buildTriggerContext: (extras: Record<string, unknown> = {}) => extras,
  buildTriggerParams: () => ({}),
}));

vi.mock("@/lib/flyer-hang/server", () => ({
  ensureNearbyFlyerHangTasks: mocks.ensureNearbyFlyerHangTasks,
}));

import {
  applyPostSigninSync,
  seedNearbyFlyerHangTasksAfterSignin,
} from "../post-signin-sync.server";

describe("post-signin sync", () => {
  beforeEach(() => {
    mocks.findUnique.mockReset();
    mocks.ensureNearbyFlyerHangTasks.mockReset();
    mocks.ensureNearbyFlyerHangTasks.mockResolvedValue({
      personalTaskId: "task_personal",
      places: [],
      usedOverpass: true,
    });
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

  it("updates account-level fields and forwards displayName to ensurePersonForUser", async () => {
    mocks.findUnique.mockResolvedValue({
      newsletterSubscribed: true,
      signupLandingUrl: null,
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
      personId: "person_1",
      referralRecorded: true,
      userUpdated: true,
    });

    // User update only carries account-level fields. displayName flows
    // through Person via ensurePersonForUser.
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: {
        newsletterSubscribed: false,
      },
    });
    expect(mocks.recordReferralAttributionForUser).toHaveBeenCalledWith(
      "user_1",
      "REF123",
      "sa_123",
    );
    expect(mocks.ensurePersonForUser).toHaveBeenCalledWith("user_1", {
      displayName: "Jane Doe",
    });
    expect(mocks.ensureUserTreatyTask).toHaveBeenCalledWith({
      personId: "person_1",
      userId: "user_1",
    });
    expect(mocks.postTaskCommentAndNotify).not.toHaveBeenCalled();
  });

  it("does not post a welcome comment — the HMT task description IS the welcome", async () => {
    mocks.findUnique.mockResolvedValue({
      newsletterSubscribed: true,
      signupLandingUrl: null,
    });
    mocks.recordReferralAttributionForUser.mockResolvedValue(false);
    mocks.ensureUserTreatyTask.mockResolvedValue({ created: true, taskId: "task_2" });

    await applyPostSigninSync({ userId: "user_1" });

    // Welcome content lives in the parent task's description (the
    // Promotion content seeded by user-onboarding:treaty), not in a
    // separate comment + notification. See post-signin-sync.server.ts
    // for the rationale.
    expect(mocks.postTaskCommentAndNotify).not.toHaveBeenCalled();
  });

  it("does not touch User when nothing account-level changed", async () => {
    mocks.findUnique.mockResolvedValue({
      newsletterSubscribed: true,
      signupLandingUrl: null,
    });
    mocks.recordReferralAttributionForUser.mockResolvedValue(false);

    await expect(
      applyPostSigninSync({
        userId: "user_1",
        name: "New Name",
      }),
    ).resolves.toEqual({
      personId: "person_1",
      referralRecorded: false,
      userUpdated: false,
    });

    expect(mocks.update).not.toHaveBeenCalled();
    // displayName still forwards to Person — that's a Person concern, not a
    // User update.
    expect(mocks.ensurePersonForUser).toHaveBeenCalledWith("user_1", {
      displayName: "New Name",
    });
  });
});

describe("seedNearbyFlyerHangTasksAfterSignin", () => {
  beforeEach(() => {
    mocks.findUnique.mockReset();
    mocks.ensureNearbyFlyerHangTasks.mockReset();
    mocks.ensureNearbyFlyerHangTasks.mockResolvedValue({
      personalTaskId: "task_personal",
      places: [],
      usedOverpass: true,
    });
  });

  it("seeds nearby tasks when the user has finite saved coordinates", async () => {
    mocks.findUnique.mockResolvedValue({
      city: "Austin",
      countryCode: "US",
      latitude: 30.27,
      longitude: -97.74,
      regionCode: "TX",
    });

    await seedNearbyFlyerHangTasksAfterSignin("user_1", "person_1");

    expect(mocks.ensureNearbyFlyerHangTasks).toHaveBeenCalledWith({
      city: "Austin",
      countryCode: "US",
      createdByUserId: "user_1",
      latitude: 30.27,
      longitude: -97.74,
      personId: "person_1",
      regionCode: "TX",
      userId: "user_1",
    });
  });

  it("skips seeding when the user has no saved coordinates yet", async () => {
    mocks.findUnique.mockResolvedValue({
      city: null,
      countryCode: null,
      latitude: null,
      longitude: null,
      regionCode: null,
    });

    await seedNearbyFlyerHangTasksAfterSignin("user_1", "person_1");

    expect(mocks.ensureNearbyFlyerHangTasks).not.toHaveBeenCalled();
  });

  it("swallows errors from ensureNearbyFlyerHangTasks — signin must not fail on this", async () => {
    mocks.findUnique.mockResolvedValue({
      city: "Austin",
      countryCode: "US",
      latitude: 30.27,
      longitude: -97.74,
      regionCode: "TX",
    });
    mocks.ensureNearbyFlyerHangTasks.mockRejectedValue(
      new Error("Overpass timed out"),
    );

    await expect(
      seedNearbyFlyerHangTasksAfterSignin("user_1", "person_1"),
    ).resolves.toBeUndefined();
  });
});
