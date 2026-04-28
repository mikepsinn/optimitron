import { describe, expect, it } from "vitest";
import {
  buildTaskCommentNotificationEmail,
  COMMENT_NOTIFICATION_PLACEHOLDER,
} from "@/lib/tasks/task-comment-notification-email.server";

const baseInput = {
  ancestors: [{ title: "Optimize Earth" }, { title: "Ratify the 1% Treaty" }],
  baseUrl: "https://warondisease.org",
  comment: {
    authorName: "Wishonia",
    message: "Welcome. Get your network voting.",
  },
  task: {
    description: "Vote on the 1% Treaty.",
    id: "task_xyz",
    title: "Get the rest of humanity to vote on the 1% Treaty",
  },
};

describe("buildTaskCommentNotificationEmail", () => {
  it("uses '{author}: {title}' as the subject when author name is known", () => {
    const email = buildTaskCommentNotificationEmail(baseInput);
    expect(email.subject).toBe(
      "Wishonia: Get the rest of humanity to vote on the 1% Treaty",
    );
  });

  it("falls back to '[Update] {title}' when no author name", () => {
    const email = buildTaskCommentNotificationEmail({
      ...baseInput,
      comment: { authorName: null, message: "system note" },
    });
    expect(email.subject).toBe(
      "[Update] Get the rest of humanity to vote on the 1% Treaty",
    );
  });

  it("renders the comment message in the body with author label", () => {
    const email = buildTaskCommentNotificationEmail(baseInput);
    expect(email.text).toContain("Wishonia:");
    expect(email.text).toContain("Welcome. Get your network voting.");
    expect(email.html).toContain("Wishonia:");
    expect(email.html).toContain("Welcome. Get your network voting.");
  });

  it("includes the breadcrumb and task description", () => {
    const email = buildTaskCommentNotificationEmail(baseInput);
    expect(email.text).toContain("Optimize Earth › Ratify the 1% Treaty");
    expect(email.text).toContain("Vote on the 1% Treaty.");
  });

  it("absolutizes the task URL with the provided base URL", () => {
    const email = buildTaskCommentNotificationEmail(baseInput);
    expect(email.text).toContain("https://warondisease.org/tasks/task_xyz");
    expect(email.html).toContain("https://warondisease.org/tasks/task_xyz");
  });

  it("emits a placeholder for the unsubscribe URL", () => {
    const email = buildTaskCommentNotificationEmail(baseInput);
    expect(email.html).toContain(COMMENT_NOTIFICATION_PLACEHOLDER);
    expect(email.text).toContain(COMMENT_NOTIFICATION_PLACEHOLDER);
  });

  it("escapes HTML in author, comment, description, and title", () => {
    const email = buildTaskCommentNotificationEmail({
      ...baseInput,
      comment: {
        authorName: "<script>",
        message: "click <a href=\"x\">here</a>",
      },
      task: {
        ...baseInput.task,
        description: "<script>alert(1)</script>",
        title: "Title with <tag>",
      },
    });
    expect(email.html).not.toContain("<script>alert(1)</script>");
    expect(email.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(email.html).toContain("&lt;a href=&quot;x&quot;&gt;here&lt;/a&gt;");
    expect(email.html).toContain("&lt;script&gt;");
  });

  it("uses 'New activity' banner not 'OVERDUE'", () => {
    const email = buildTaskCommentNotificationEmail(baseInput);
    expect(email.html).toContain("New activity");
    expect(email.html).not.toContain("OVERDUE");
    expect(email.text).toContain("NEW ACTIVITY");
  });
});
