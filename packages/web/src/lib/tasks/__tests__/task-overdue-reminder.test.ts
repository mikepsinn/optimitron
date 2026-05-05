import { describe, expect, it } from "vitest";
import {
  buildOverdueReminderComment,
  MAX_OVERDUE_REMINDER_COMMENTS,
} from "@/lib/tasks/task-overdue-reminder.server";

const fixedNow = new Date("2026-04-27T12:00:00.000Z");

const baseInput = {
  now: fixedNow,
  task: {
    description:
      "Vote on the 1% Treaty. It takes 30 seconds and your vote prevents lifetimes of suffering.",
    dueAt: new Date("2026-04-24T12:00:00.000Z"),
    id: "task_abc123",
    title: "Get Joe to vote on the 1% Treaty",
  },
};

describe("buildOverdueReminderComment", () => {
  it("caps automatic overdue reminder comments at one", () => {
    expect(MAX_OVERDUE_REMINDER_COMMENTS).toBe(1);
  });

  it("uses a straightforward overdue subject", () => {
    const draft = buildOverdueReminderComment({ ...baseInput, sendCount: 1 });
    expect(draft.subject).toBe(
      "Task overdue: Get Joe to vote on the 1% Treaty",
    );
  });

  it("builds a straightforward public Wishonia comment body", () => {
    const draft = buildOverdueReminderComment({ ...baseInput, sendCount: 1 });
    expect(draft.message).toBe(
      "This task is 3 days overdue: Get Joe to vote on the 1% Treaty.\n\nPlease mark it complete or post a status update.",
    );
    expect(draft.message).not.toContain("Yeahhh");
    expect(draft.message).not.toContain("FYI");
    expect(draft.message).not.toContain("people died");
  });

  it("uses singular day for one-day overdue", () => {
    const draft = buildOverdueReminderComment({
      ...baseInput,
      now: new Date("2026-04-25T12:00:00.000Z"),
      sendCount: 1,
    });
    expect(draft.message).toContain("This task is 1 day overdue:");
    expect(draft.message).not.toContain("people died");
  });

  it("does not put delivery audit details or email addresses into the public comment", () => {
    const draft = buildOverdueReminderComment({ ...baseInput, sendCount: 1 });
    expect(draft.message).not.toContain("queued");
    expect(draft.message).not.toContain("@");
  });
});
