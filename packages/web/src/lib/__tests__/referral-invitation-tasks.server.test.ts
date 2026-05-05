import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    task: { update: vi.fn() },
  };
  return {
    fireTaskTrigger: vi.fn(),
    prisma: {
      task: { update: vi.fn() },
    },
    tx,
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

vi.mock("@/lib/triggers", () => ({
  buildTriggerContext: (extras: Record<string, unknown> = {}) => extras,
  fireTaskTrigger: mocks.fireTaskTrigger,
}));

import { createReferralInvitationTask } from "@/lib/referral-invitation-tasks.server";

describe("createReferralInvitationTask", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.fireTaskTrigger.mockResolvedValue({
      result: "spawned",
      spawnedSpecs: [
        {
          isParent: true,
          kind: "root",
          status: "ACTIVE",
          taskId: "task_1",
          taskKey: "program:one-percent-treaty:referral-invitation:token_1",
          wasCreated: true,
        },
      ],
      spawnedTaskIds: ["task_1"],
      spawnedTaskKeys: [
        "program:one-percent-treaty:referral-invitation:token_1",
      ],
      triggerKey: "referral:vote-invitation",
    });
    mocks.tx.task.update.mockResolvedValue({ id: "task_1" });
  });

  it("fires and patches the referral task inside the caller transaction", async () => {
    const taskId = await createReferralInvitationTask(
      {
        endpoint: {
          instructions: "Call this human.",
          url: "https://example.test/vote",
        },
        inviteToken: "token_1",
        creatorUserId: "user_1",
        parentTaskId: "training_root",
        recipientName: "Recipient Human",
        recipientPersonId: "person_recipient",
        referendumSlug: "one-percent-treaty",
      },
      mocks.tx as never,
    );

    expect(taskId).toBe("task_1");
    expect(mocks.fireTaskTrigger).toHaveBeenCalledWith(
      "referral:vote-invitation",
      expect.objectContaining({
        inviteToken: "token_1",
        parentTaskId: "training_root",
        recipient: expect.objectContaining({ firstName: "Recipient" }),
        user: { id: "user_1" },
      }),
      expect.objectContaining({ actorUserId: "user_1", db: mocks.tx }),
    );
    expect(mocks.tx.task.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "task_1" } }),
    );
    expect(mocks.prisma.task.update).not.toHaveBeenCalled();
  });
});
