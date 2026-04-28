import { describe, expect, it } from "vitest";
import {
  buildOverdueReminderEmail,
  MAX_OVERDUE_SEND_COUNT,
  OVERDUE_REMINDER_PLACEHOLDER,
} from "@/lib/tasks/task-overdue-reminder.server";

const fixedNow = new Date("2026-04-27T12:00:00.000Z");

const baseInput = {
  ancestors: [
    { title: "Optimize Earth" },
    { title: "End War and Disease" },
    { title: "Ratify the 1% Treaty" },
  ],
  baseUrl: "https://warondisease.org",
  now: fixedNow,
  recipient: {
    email: "joe@example.com",
  },
  task: {
    description:
      "Vote on the 1% Treaty. It takes 30 seconds and your vote prevents lifetimes of suffering.",
    dueAt: new Date("2026-04-24T12:00:00.000Z"),
    id: "task_abc123",
    title: "Get Joe to vote on the 1% Treaty",
  },
};

describe("buildOverdueReminderEmail", () => {
  it("uses [OVERDUE] subject prefix on send #1", () => {
    const email = buildOverdueReminderEmail({ ...baseInput, sendCount: 1 });
    expect(email.subject).toBe("[OVERDUE] Get Joe to vote on the 1% Treaty");
  });

  it("escalates to [FINAL NOTICE] on the cap send", () => {
    const email = buildOverdueReminderEmail({
      ...baseInput,
      sendCount: MAX_OVERDUE_SEND_COUNT,
    });
    expect(email.subject).toBe("[FINAL NOTICE] Get Joe to vote on the 1% Treaty");
  });

  it("includes the days-overdue line in the body", () => {
    const email = buildOverdueReminderEmail({ ...baseInput, sendCount: 1 });
    expect(email.text).toContain("3 days overdue.");
  });

  it("uses singular 'day' for one-day overdue", () => {
    const email = buildOverdueReminderEmail({
      ...baseInput,
      now: new Date("2026-04-25T12:00:00.000Z"),
      sendCount: 1,
    });
    expect(email.text).toContain("1 day overdue.");
  });

  it("renders the ancestor breadcrumb in the body", () => {
    const email = buildOverdueReminderEmail({ ...baseInput, sendCount: 1 });
    expect(email.text).toContain("Optimize Earth");
    expect(email.text).toContain("End War and Disease");
    expect(email.text).toContain("Ratify the 1% Treaty");
  });

  it("includes the task description verbatim", () => {
    const email = buildOverdueReminderEmail({ ...baseInput, sendCount: 1 });
    expect(email.text).toContain(
      "Vote on the 1% Treaty. It takes 30 seconds and your vote prevents lifetimes of suffering.",
    );
  });

  it("absolutizes the task URL with the provided base URL", () => {
    const email = buildOverdueReminderEmail({ ...baseInput, sendCount: 1 });
    expect(email.text).toContain("https://warondisease.org/tasks/task_abc123");
    expect(email.html).toContain("https://warondisease.org/tasks/task_abc123");
  });

  it("emits a placeholder for the unsubscribe URL so the cron can substitute it", () => {
    const email = buildOverdueReminderEmail({ ...baseInput, sendCount: 1 });
    expect(email.html).toContain(OVERDUE_REMINDER_PLACEHOLDER);
    expect(email.text).toContain(OVERDUE_REMINDER_PLACEHOLDER);
  });

  it("renders comments under a Recent activity heading when provided", () => {
    const email = buildOverdueReminderEmail({
      ...baseInput,
      comments: [
        {
          authorName: "Alice",
          createdAt: new Date("2026-04-26T00:00:00.000Z"),
          message: "Hey Joe — this matters, please vote.",
        },
      ],
      sendCount: 1,
    });
    expect(email.text).toContain("RECENT ACTIVITY");
    expect(email.text).toContain("Alice:");
    expect(email.text).toContain("Hey Joe — this matters, please vote.");
    expect(email.html).toContain("Recent activity");
    expect(email.html).toContain("Alice:");
  });

  it("escapes HTML-unsafe characters in description and comment bodies", () => {
    const email = buildOverdueReminderEmail({
      ...baseInput,
      comments: [
        {
          authorName: "<script>",
          createdAt: fixedNow,
          message: "click <a href=\"x\">here</a>",
        },
      ],
      sendCount: 1,
      task: {
        ...baseInput.task,
        description: "<script>alert(1)</script>",
        title: "Title with <tag>",
      },
    });
    expect(email.html).not.toContain("<script>alert(1)</script>");
    expect(email.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).toContain("&lt;a href=&quot;x&quot;&gt;here&lt;/a&gt;");
  });

  it("omits the Recent activity block when no comments are passed", () => {
    const email = buildOverdueReminderEmail({ ...baseInput, sendCount: 1 });
    expect(email.text).not.toContain("RECENT ACTIVITY");
    expect(email.html).not.toContain("Recent activity");
  });
});
