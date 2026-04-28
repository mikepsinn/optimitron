import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

import {
  ensureUserTreatyTask,
  getUserTreatyTaskKey,
  getUserTreatySubtaskKey,
} from "@/lib/tasks/user-treaty-task.server";
import {
  markNextHumanAssignmentSubtaskComplete,
  markUserTreatyReferralShareComplete,
} from "@/lib/tasks/user-treaty-task-progress.server";

interface FakeTask {
  id: string;
  deletedAt: Date | null;
  ownerUserId?: string | null;
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
    if (key === "deletedAt" && value === null && task.deletedAt !== null) return false;
    if (key === "id") {
      if (typeof value === "string" && task.id !== value) return false;
      if (
        typeof value === "object" &&
        value &&
        "in" in value &&
        !((value as { in: string[] }).in.includes(task.id))
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
        !((value as { in: string[] }).in.includes(task.taskKey ?? ""))
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
    if (key === "deletedAt" && value === null && comment.deletedAt !== null) {
      return false;
    }
    if (
      key === "message" &&
      typeof value === "object" &&
      value &&
      "contains" in value &&
      !comment.message.includes((value as { contains: string }).contains)
    ) {
      return false;
    }
    if (key === "taskId") {
      if (typeof value === "string" && comment.taskId !== value) return false;
      if (
        typeof value === "object" &&
        value &&
        "in" in value &&
        !((value as { in: string[] }).in.includes(comment.taskId))
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
      create: vi.fn(async ({ data, select }) => {
        const task = {
          id: `task_${++nextTask}`,
          deletedAt: null,
          ...data,
        } as FakeTask;
        tasks.push(task);
        return pickSelected(task, select);
      }),
      findMany: vi.fn(async ({ where, select }) =>
        tasks
          .filter((task) => matchesTask(task, where ?? {}))
          .map((task) => pickSelected(task, select)),
      ),
      findUnique: vi.fn(async ({ where, select }) => {
        const task = where.id
          ? tasks.find((candidate) => candidate.id === where.id)
          : tasks.find((candidate) => candidate.taskKey === where.taskKey);
        return task ? pickSelected(task, select) : null;
      }),
      update: vi.fn(async ({ where, data, select }) => {
        const task = tasks.find((candidate) => candidate.id === where.id);
        if (!task) throw new Error("Task not found.");
        Object.assign(task, data);
        return pickSelected(task, select);
      }),
      updateMany: vi.fn(async ({ where, data }) => {
        let count = 0;
        for (const task of tasks) {
          if (!matchesTask(task, where ?? {})) continue;
          Object.assign(task, data);
          count += 1;
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
      findFirst: vi.fn(async ({ where, select }) => {
        const comment = comments.find((candidate) =>
          matchesComment(candidate, where ?? {}),
        );
        return comment ? pickSelected(comment, select) : null;
      }),
    },
  };

  return { comments, db: db as never, tasks };
}

describe("user treaty task tree", () => {
  it("creates the 4B objective and default subtasks idempotently", async () => {
    const { db, tasks } = createFakeTaskDb();
    const now = new Date("2026-04-28T12:00:00.000Z");

    const first = await ensureUserTreatyTask(
      { now, personId: "person_1", userId: "user_1" },
      db,
    );
    const second = await ensureUserTreatyTask(
      { now, personId: "person_1", userId: "user_1" },
      db,
    );

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(tasks).toHaveLength(5);
    expect(first.taskId).toBe(second.taskId);

    const root = tasks.find(
      (task) => task.taskKey === getUserTreatyTaskKey("user_1"),
    );
    expect(root).toMatchObject({
      title: "Get 4 billion people to vote on the 1% Treaty",
      ownerUserId: "user_1",
      parentTaskId: null,
    });

    expect(first.subtaskIds.shareReferralUrl).toBeTruthy();
    expect(first.subtaskIds.assignFirstHuman).toBeTruthy();
    expect(first.subtaskIds.assignSecondHuman).toBeTruthy();
    expect(first.subtaskIds.completeTraining).toBeTruthy();
    expect(
      tasks.filter((task) => task.parentTaskId === first.taskId).map((task) => task.title),
    ).toEqual([
      "Share your 1% Treaty referral URL",
      "Give your first human the 1% Treaty voting task",
      "Give your second human the 1% Treaty voting task",
      "Complete Humanity Management Training",
    ]);
  });

  it("gives downstream users their own separate local task tree", async () => {
    const { db, tasks } = createFakeTaskDb();

    const alice = await ensureUserTreatyTask(
      { personId: "person_alice", userId: "alice" },
      db,
    );
    const bob = await ensureUserTreatyTask(
      { personId: "person_bob", userId: "bob" },
      db,
    );

    expect(alice.taskId).not.toBe(bob.taskId);
    expect(
      tasks.find((task) => task.taskKey === getUserTreatyTaskKey("bob")),
    ).toMatchObject({
      ownerUserId: "bob",
      parentTaskId: null,
    });
    expect(
      tasks.some(
        (task) => task.ownerUserId === "bob" && task.parentTaskId === alice.taskId,
      ),
    ).toBe(false);
  });

  it("completes training after share plus two unique human assignments", async () => {
    const { db, tasks } = createFakeTaskDb();
    const now = new Date("2026-04-28T12:00:00.000Z");
    const treatyTask = await ensureUserTreatyTask(
      { now, personId: "person_1", userId: "user_1" },
      db,
    );

    await markUserTreatyReferralShareComplete(
      {
        channel: "copy-link",
        now,
        personId: "person_1",
        taskId: treatyTask.subtaskIds.shareReferralUrl,
        userId: "user_1",
      },
      db,
    );
    await markNextHumanAssignmentSubtaskComplete(
      {
        invitationId: "invite_1",
        now,
        personId: "person_1",
        recipientName: "Ada",
        userId: "user_1",
      },
      db,
    );
    await markNextHumanAssignmentSubtaskComplete(
      {
        invitationId: "invite_1",
        now,
        personId: "person_1",
        recipientName: "Ada",
        userId: "user_1",
      },
      db,
    );

    expect(
      tasks.find(
        (task) =>
          task.taskKey === getUserTreatySubtaskKey("user_1", "assignFirstHuman"),
      )?.status,
    ).toBe("VERIFIED");
    expect(
      tasks.find(
        (task) =>
          task.taskKey === getUserTreatySubtaskKey("user_1", "assignSecondHuman"),
      )?.status,
    ).toBe("ACTIVE");

    await markNextHumanAssignmentSubtaskComplete(
      {
        invitationId: "invite_2",
        now,
        personId: "person_1",
        recipientName: "Grace",
        userId: "user_1",
      },
      db,
    );

    expect(
      tasks.find(
        (task) =>
          task.taskKey === getUserTreatySubtaskKey("user_1", "shareReferralUrl"),
      )?.status,
    ).toBe("VERIFIED");
    expect(
      tasks.find(
        (task) =>
          task.taskKey === getUserTreatySubtaskKey("user_1", "assignSecondHuman"),
      )?.status,
    ).toBe("VERIFIED");
    expect(
      tasks.find(
        (task) =>
          task.taskKey === getUserTreatySubtaskKey("user_1", "completeTraining"),
      )?.status,
    ).toBe("VERIFIED");
  });
});
