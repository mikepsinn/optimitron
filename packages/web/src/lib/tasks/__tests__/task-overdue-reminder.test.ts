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
  it("uses Lumbergh-style 'Yeahhh, about ...' subject on send #1 (no [OVERDUE] prefix)", () => {
    const email = buildOverdueReminderEmail({ ...baseInput, sendCount: 1 });
    expect(email.subject).toBe("Yeahhh, about Get Joe to vote on the 1% Treaty");
    expect(email.subject).not.toContain("[OVERDUE]");
  });

  it("escalates subject through send #2", () => {
    const email = buildOverdueReminderEmail({ ...baseInput, sendCount: 2 });
    expect(email.subject).toBe("So... about Get Joe to vote on the 1% Treaty");
  });

  it("escalates subject through send #3 with 'memo' framing", () => {
    const email = buildOverdueReminderEmail({ ...baseInput, sendCount: 3 });
    expect(email.subject).toBe("Did you get the memo on Get Joe to vote on the 1% Treaty?");
  });

  it("escalates subject to 'I'm gonna need you to ...' on the cap send (no [FINAL NOTICE])", () => {
    const email = buildOverdueReminderEmail({
      ...baseInput,
      sendCount: MAX_OVERDUE_SEND_COUNT,
    });
    expect(email.subject).toBe(
      "I'm gonna need you to go ahead and finish Get Joe to vote on the 1% Treaty. Mmkay?",
    );
    expect(email.subject).not.toContain("[FINAL NOTICE]");
  });

  it("includes the days-overdue line + mortality FYI", () => {
    const email = buildOverdueReminderEmail({ ...baseInput, sendCount: 1 });
    expect(email.text).toContain("3 days overdue.");
    expect(email.text).toContain(
      "About 450,000 people died waiting in the meantime, just an FYI.",
    );
  });

  it("uses singular 'day' for one-day overdue and reports ~150,000 deaths", () => {
    const email = buildOverdueReminderEmail({
      ...baseInput,
      now: new Date("2026-04-25T12:00:00.000Z"),
      sendCount: 1,
    });
    expect(email.text).toContain("1 day overdue.");
    expect(email.text).toContain("About 150,000 people died waiting");
  });

  it("renders the Lumbergh opener line in the body", () => {
    const email = buildOverdueReminderEmail({ ...baseInput, sendCount: 1 });
    expect(email.text).toContain(
      "Yeahhh... if you could just go ahead and finish Get Joe to vote on the 1% Treaty",
    );
  });

  it("does not render the ancestor breadcrumb (noise)", () => {
    const email = buildOverdueReminderEmail({ ...baseInput, sendCount: 1 });
    expect(email.text).not.toContain("Optimize Earth");
    expect(email.text).not.toContain("End War and Disease");
  });

  it("does not include the task description (noise — they can click through)", () => {
    const email = buildOverdueReminderEmail({ ...baseInput, sendCount: 1 });
    expect(email.text).not.toContain("It takes 30 seconds");
    expect(email.html).not.toContain("It takes 30 seconds");
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

  it("renders comment messages without author labels (noise — sender already in From)", () => {
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
    expect(email.text).toContain("Hey Joe — this matters, please vote.");
    expect(email.text).not.toContain("Alice:");
    expect(email.html).toContain("Hey Joe — this matters, please vote.");
    expect(email.html).not.toContain("Alice:");
    expect(email.text).not.toContain("RECENT ACTIVITY");
    expect(email.html).not.toContain("Recent activity");
  });

  it("escapes HTML-unsafe characters in title and comment bodies", () => {
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
        title: "Title with <tag>",
      },
    });
    expect(email.html).toContain("&lt;a href=&quot;x&quot;&gt;here&lt;/a&gt;");
    expect(email.html).toContain("&lt;tag&gt;");
  });
});
