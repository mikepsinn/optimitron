import { TaskStatus } from "@optimitron/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fireMocks = vi.hoisted(() => ({
  fireTaskTrigger: vi.fn(),
  fireTaskTriggersForEvent: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

vi.mock("@/lib/triggers", () => ({
  fireTaskTrigger: fireMocks.fireTaskTrigger,
  fireTaskTriggersForEvent: fireMocks.fireTaskTriggersForEvent,
  buildTriggerContext: (extras: Record<string, unknown> = {}) => extras,
  buildTriggerParams: () => ({}),
}));

import {
  ensureUserTreatyTask,
  getUserTreatyTaskKey,
  getUserTreatySubtaskKey,
} from "@/lib/tasks/user-treaty-task.server";
import {
  markNextHumanAssignmentSubtaskComplete,
  markUserTreatyPhoneCallComplete,
  markUserTreatyReferralShareComplete,
} from "@/lib/tasks/user-treaty-task-progress.server";

interface FakeTask {
  id: string;
  deletedAt: Date | null;
  createdByUserId?: string | null;
  parentTaskId?: string | null;
  status?: string;
  taskKey?: string | null;
  title?: string;
  [key: string]: unknown;
}

interface FakeComment {
  id: string;
  deletedAt: Date | null;
  message: string;
  taskId: string;
  [key: string]: unknown;
}

function pickSelected<T extends Record<string, unknown>>(
  row: T,
  select?: Record<string, boolean>,
) {
  if (!select) return row;
  return Object.fromEntries(
    Object.entries(select)
      .filter(([, enabled]) => enabled)
      .map(([key]) => [key, row[key]]),
  );
}

function matchesTask(task: FakeTask, where: Record<string, unknown>) {
  for (const [key, value] of Object.entries(where)) {
    if (key === "deletedAt" && value === null && task.deletedAt !== null)
      return false;
    if (key === "id") {
      if (typeof value === "string" && task.id !== value) return false;
      if (
        typeof value === "object" &&
        value &&
        "in" in value &&
        !(value as { in: string[] }).in.includes(task.id)
      ) {
        return false;
      }
      continue;
    }
    if (key === "taskKey") {
      if (typeof value === "string" && task.taskKey !== value) return false;
      if (
        typeof value === "object" &&
        value &&
        "in" in value &&
        !(value as { in: string[] }).in.includes(task.taskKey ?? "")
      ) {
        return false;
      }
      continue;
    }
    if (
      key === "status" &&
      typeof value === "object" &&
      value &&
      "not" in value
    ) {
      if (task.status === (value as { not: string }).not) return false;
      continue;
    }
    if (task[key] !== value) return false;
  }
  return true;
}

function matchesComment(comment: FakeComment, where: Record<string, unknown>) {
  for (const [key, value] of Object.entries(where)) {
    if (key === "deletedAt" && value === null && comment.deletedAt !== null)
      return false;
    if (key === "message" && typeof value === "object" && value) {
      if (
        "contains" in value &&
        !comment.message.includes((value as { contains: string }).contains)
      ) {
        return false;
      }
      if (
        "startsWith" in value &&
        !comment.message.startsWith(
          (value as { startsWith: string }).startsWith,
        )
      ) {
        return false;
      }
      continue;
    }
    if (key === "taskId") {
      if (typeof value === "string" && comment.taskId !== value) return false;
      if (
        typeof value === "object" &&
        value &&
        "in" in value &&
        !(value as { in: string[] }).in.includes(comment.taskId)
      ) {
        return false;
      }
      continue;
    }
    if (key !== "message" && key !== "taskId" && comment[key] !== value) {
      return false;
    }
  }
  return true;
}

function createFakeTaskDb() {
  let nextTask = 0;
  let nextComment = 0;
  const tasks: FakeTask[] = [];
  const comments: FakeComment[] = [];

  const db = {
    task: {
      create: vi.fn(async ({ data }) => {
        const task = {
          id: `task_${++nextTask}`,
          deletedAt: null,
          ...data,
        } as FakeTask;
        tasks.push(task);
        return task;
      }),
      findMany: vi.fn(async ({ where, select }) =>
        tasks
          .filter((task) => matchesTask(task, where ?? {}))
          .map((task) => pickSelected(task, select)),
      ),
      findUnique: vi.fn(async ({ where, select }) => {
        const task = where.id
          ? tasks.find((c) => c.id === where.id)
          : tasks.find((c) => c.taskKey === where.taskKey);
        return task ? pickSelected(task, select) : null;
      }),
      update: vi.fn(async ({ where, data }) => {
        const task = tasks.find((c) => c.id === where.id);
        if (!task) throw new Error("Task not found.");
        Object.assign(task, data);
        return task;
      }),
      updateMany: vi.fn(async ({ where, data }) => {
        let count = 0;
        for (const t of tasks) {
          if (!matchesTask(t, where ?? {})) continue;
          Object.assign(t, data);
          count++;
        }
        return { count };
      }),
    },
    taskComment: {
      create: vi.fn(async ({ data }) => {
        const comment = {
          id: `comment_${++nextComment}`,
          deletedAt: null,
          ...data,
        } as FakeComment;
        comments.push(comment);
        return { id: comment.id };
      }),
      findFirst: vi.fn(async ({ where }) => {
        const comment = comments.find((c) => matchesComment(c, where ?? {}));
        return comment ? { id: comment.id } : null;
      }),
      count: vi.fn(
        async ({ where }: { where?: Record<string, unknown> } = {}) => {
          return comments.filter((c) => matchesComment(c, where ?? {})).length;
        },
      ),
    },
  };
  return { comments, db: db as never, tasks };
}

/**
 * Pre-populate `tasks` with the synthetic tree the trigger would have
 * produced and configure the fireTaskTrigger mock to return a matching
 * FireResult. The actual trigger runtime is tested in
 * `src/lib/triggers/__tests__/fire.integration.test.ts`.
 */
function seedSyntheticOnboardingTree(
  tasks: FakeTask[],
  userId: string,
): {
  rootId: string;
  subtaskIds: Record<string, string>;
} {
  const rootId = `task_root_${userId}`;
  const subtaskIds: Record<string, string> = {};
  tasks.push({
    id: rootId,
    deletedAt: null,
    taskKey: getUserTreatyTaskKey(userId),
    createdByUserId: userId,
    parentTaskId: null,
    status: "ACTIVE",
    title: "Get 4 billion people to vote on the 1% Treaty",
  });
  const childKinds = [
    "signTreatyPersonally",
    "shareReferralUrl",
    "phoneScript",
    "assignFirstHuman",
    "assignSecondHuman",
    "completeTraining",
  ] as const;
  for (const kind of childKinds) {
    const id = `task_${kind}_${userId}`;
    subtaskIds[kind] = id;
    tasks.push({
      id,
      deletedAt: null,
      taskKey: getUserTreatySubtaskKey(userId, kind),
      createdByUserId: userId,
      parentTaskId: rootId,
      status: "ACTIVE",
    });
  }
  return { rootId, subtaskIds };
}

function makeFireResult(
  rootId: string,
  subtaskIds: Record<string, string>,
  userId: string,
  parentWasCreated: boolean,
) {
  return {
    result: "spawned" as const,
    triggerKey: "user-onboarding:treaty",
    triggerId: "trig-1",
    idempotencyKey: getUserTreatyTaskKey(userId),
    spawnedSpecs: [
      {
        kind: "root",
        isParent: true,
        taskId: rootId,
        taskKey: getUserTreatyTaskKey(userId),
        status: TaskStatus.ACTIVE,
        wasCreated: parentWasCreated,
      },
      ...Object.entries(subtaskIds).map(([kind, taskId]) => ({
        kind,
        isParent: false,
        taskId,
        taskKey: getUserTreatySubtaskKey(userId, kind as never),
        status: TaskStatus.ACTIVE,
        wasCreated: parentWasCreated,
      })),
    ],
    spawnedTaskIds: [rootId, ...Object.values(subtaskIds)],
    spawnedTaskKeys: [
      getUserTreatyTaskKey(userId),
      ...Object.entries(subtaskIds).map(([kind]) =>
        getUserTreatySubtaskKey(userId, kind as never),
      ),
    ],
  };
}

describe("user treaty task tree", () => {
  beforeEach(() => {
    fireMocks.fireTaskTrigger.mockReset();
    fireMocks.fireTaskTriggersForEvent.mockReset();
    fireMocks.fireTaskTriggersForEvent.mockResolvedValue([]);
  });

  it("ensureUserTreatyTask reconstructs legacy return shape from FireResult", async () => {
    const { tasks } = createFakeTaskDb();
    const seeded = seedSyntheticOnboardingTree(tasks, "user_1");
    fireMocks.fireTaskTrigger.mockResolvedValue(
      makeFireResult(seeded.rootId, seeded.subtaskIds, "user_1", true),
    );

    const result = await ensureUserTreatyTask({
      personId: "person_1",
      userId: "user_1",
    });

    expect(result.created).toBe(true);
    expect(result.taskId).toBe(seeded.rootId);
    expect(result.subtaskIds.shareReferralUrl).toBe(
      seeded.subtaskIds.shareReferralUrl,
    );
    expect(result.subtaskIds.phoneScript).toBe(seeded.subtaskIds.phoneScript);
    expect(result.subtaskIds.assignFirstHuman).toBe(
      seeded.subtaskIds.assignFirstHuman,
    );
    expect(result.subtaskIds.assignSecondHuman).toBe(
      seeded.subtaskIds.assignSecondHuman,
    );
    expect(result.subtaskIds.completeTraining).toBe(
      seeded.subtaskIds.completeTraining,
    );
    expect(result.subtaskStatuses.shareReferralUrl).toBe(TaskStatus.ACTIVE);
  });

  it("ensureUserTreatyTask reports created=false on subsequent fires", async () => {
    const { tasks } = createFakeTaskDb();
    const seeded = seedSyntheticOnboardingTree(tasks, "user_2");
    fireMocks.fireTaskTrigger.mockResolvedValue(
      makeFireResult(seeded.rootId, seeded.subtaskIds, "user_2", false),
    );

    const result = await ensureUserTreatyTask({
      personId: "person_2",
      userId: "user_2",
    });
    expect(result.created).toBe(false);
  });

  it("ensureUserTreatyTask throws when the trigger isn't seeded", async () => {
    fireMocks.fireTaskTrigger.mockResolvedValue({
      result: "filteredOut",
      triggerKey: "user-onboarding:treaty",
      reason: "trigger not found: user-onboarding:treaty",
      spawnedSpecs: [],
      spawnedTaskIds: [],
      spawnedTaskKeys: [],
    });

    await expect(
      ensureUserTreatyTask({ personId: "p", userId: "u" }),
    ).rejects.toThrow(/trigger did not run/);
  });

  it("ensureUserTreatyTask throws when a required spec is missing", async () => {
    fireMocks.fireTaskTrigger.mockResolvedValue({
      result: "spawned",
      triggerKey: "user-onboarding:treaty",
      idempotencyKey: "x",
      spawnedSpecs: [
        {
          kind: "root",
          isParent: true,
          taskId: "t-root",
          taskKey: "x",
          status: TaskStatus.ACTIVE,
          wasCreated: true,
        },
        // missing all child specs
      ],
      spawnedTaskIds: ["t-root"],
      spawnedTaskKeys: ["x"],
    });

    await expect(
      ensureUserTreatyTask({ personId: "p", userId: "u" }),
    ).rejects.toThrow(/missing required spec/);
  });

  it("markUserTreatyReferralShareComplete VERIFIES the share subtask and fires task.statusChanged.VERIFIED", async () => {
    const { db, tasks, comments } = createFakeTaskDb();
    const seeded = seedSyntheticOnboardingTree(tasks, "user_3");
    fireMocks.fireTaskTrigger.mockResolvedValue(
      makeFireResult(seeded.rootId, seeded.subtaskIds, "user_3", false),
    );

    const result = await markUserTreatyReferralShareComplete(
      {
        channel: "copy-link",
        personId: "person_3",
        taskId: seeded.subtaskIds.shareReferralUrl,
        userId: "user_3",
      },
      db,
    );

    expect(result).toBe(true);
    const share = tasks.find(
      (t) =>
        t.taskKey === getUserTreatySubtaskKey("user_3", "shareReferralUrl"),
    );
    expect(share?.status).toBe("VERIFIED");

    // Status update comment posted on the share task.
    expect(
      comments.some(
        (c) =>
          c.taskId === seeded.subtaskIds.shareReferralUrl &&
          c.message.includes("Shared"),
      ),
    ).toBe(true);

    // task.statusChanged.VERIFIED event fired so the HMT gate trigger can evaluate.
    expect(fireMocks.fireTaskTriggersForEvent).toHaveBeenCalledWith(
      "task.statusChanged.VERIFIED",
      expect.objectContaining({
        user: { id: "user_3" },
        task: expect.objectContaining({
          taskKey: getUserTreatySubtaskKey("user_3", "shareReferralUrl"),
        }),
      }),
      expect.objectContaining({ actorUserId: "user_3", db }),
    );
  });

  it("markUserTreatyReferralShareComplete returns false without side effects when the share task is not updated", async () => {
    const { db, tasks, comments } = createFakeTaskDb();
    const seeded = seedSyntheticOnboardingTree(tasks, "user_noop");
    const shareTask = tasks.find(
      (t) =>
        t.taskKey === getUserTreatySubtaskKey("user_noop", "shareReferralUrl"),
    );
    if (shareTask) {
      shareTask.createdByUserId = "someone_else";
    }
    fireMocks.fireTaskTrigger.mockResolvedValue(
      makeFireResult(seeded.rootId, seeded.subtaskIds, "user_noop", false),
    );

    const result = await markUserTreatyReferralShareComplete(
      {
        channel: "copy-link",
        personId: "person_noop",
        taskId: seeded.subtaskIds.shareReferralUrl,
        userId: "user_noop",
      },
      db,
    );

    expect(result).toBe(false);
    expect(comments).toHaveLength(0);
    expect(fireMocks.fireTaskTriggersForEvent).not.toHaveBeenCalled();
  });

  it("markUserTreatyPhoneCallComplete VERIFIES the phone task and fires the HMT gate in the same db context", async () => {
    const { db, tasks } = createFakeTaskDb();
    const seeded = seedSyntheticOnboardingTree(tasks, "user_phone");
    fireMocks.fireTaskTrigger.mockResolvedValue(
      makeFireResult(seeded.rootId, seeded.subtaskIds, "user_phone", false),
    );

    const result = await markUserTreatyPhoneCallComplete(
      {
        invitationId: "invite_phone",
        personId: "person_phone",
        recipientName: "Grace",
        userId: "user_phone",
      },
      db,
    );

    expect(result).toBe(true);
    expect(
      tasks.find(
        (t) =>
          t.taskKey === getUserTreatySubtaskKey("user_phone", "phoneScript"),
      )?.status,
    ).toBe("VERIFIED");
    expect(fireMocks.fireTaskTriggersForEvent).toHaveBeenCalledWith(
      "task.statusChanged.VERIFIED",
      expect.objectContaining({
        user: { id: "user_phone" },
        task: expect.objectContaining({
          taskKey: getUserTreatySubtaskKey("user_phone", "phoneScript"),
        }),
      }),
      expect.objectContaining({ actorUserId: "user_phone", db }),
    );
  });

  it("markNextHumanAssignmentSubtaskComplete VERIFIES the next assignment and fires the right event", async () => {
    const { db, tasks } = createFakeTaskDb();
    const seeded = seedSyntheticOnboardingTree(tasks, "user_4");
    fireMocks.fireTaskTrigger.mockResolvedValue(
      makeFireResult(seeded.rootId, seeded.subtaskIds, "user_4", false),
    );

    await markNextHumanAssignmentSubtaskComplete(
      {
        invitationId: "invite_1",
        personId: "person_4",
        recipientName: "Ada",
        userId: "user_4",
      },
      db,
    );

    expect(
      tasks.find(
        (t) =>
          t.taskKey === getUserTreatySubtaskKey("user_4", "assignFirstHuman"),
      )?.status,
    ).toBe("VERIFIED");
    expect(
      tasks.find(
        (t) =>
          t.taskKey === getUserTreatySubtaskKey("user_4", "assignSecondHuman"),
      )?.status,
    ).toBe("ACTIVE");

    expect(fireMocks.fireTaskTriggersForEvent).toHaveBeenCalledWith(
      "task.statusChanged.VERIFIED",
      expect.objectContaining({
        user: { id: "user_4" },
        task: expect.objectContaining({
          taskKey: getUserTreatySubtaskKey("user_4", "assignFirstHuman"),
        }),
      }),
      expect.objectContaining({ actorUserId: "user_4", db }),
    );
  });
});
