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
  it("uses the bare task title as the subject (no author prefix — sender is in From header)", () => {
    const email = buildTaskCommentNotificationEmail(baseInput);
    expect(email.subject).toBe("Get the rest of humanity to vote on the 1% Treaty");
  });

  it("renders the comment message without an inline author label", () => {
    const email = buildTaskCommentNotificationEmail(baseInput);
    expect(email.text).toContain("Welcome. Get your network voting.");
    expect(email.text).not.toContain("Wishonia:");
    expect(email.html).toContain("Welcome. Get your network voting.");
    expect(email.html).not.toContain("Wishonia:");
  });

  it("does not render the breadcrumb or task description (noise)", () => {
    const email = buildTaskCommentNotificationEmail(baseInput);
    expect(email.text).not.toContain("Optimize Earth › Ratify the 1% Treaty");
    expect(email.text).not.toContain("Vote on the 1% Treaty.");
    expect(email.html).not.toContain("Optimize Earth");
    expect(email.html).not.toContain("Vote on the 1% Treaty.");
  });

  it("does not render a 'New activity' banner", () => {
    const email = buildTaskCommentNotificationEmail(baseInput);
    expect(email.html).not.toContain("New activity");
    expect(email.text).not.toContain("NEW ACTIVITY");
  });

  it("defaults the CTA to the in-app task URL with 'Open the task' label", () => {
    const email = buildTaskCommentNotificationEmail(baseInput);
    expect(email.text).toContain("Open the task: https://warondisease.org/tasks/task_xyz");
    expect(email.html).toContain("https://warondisease.org/tasks/task_xyz");
    expect(email.html).toContain("Open the task");
  });

  it("uses the override CTA when provided (share-email flow)", () => {
    const email = buildTaskCommentNotificationEmail({
      ...baseInput,
      cta: {
        label: "Take 30 seconds to end war and disease",
        url: "https://warondisease.org/treaty?invite=abc",
      },
    });
    expect(email.html).toContain("Take 30 seconds to end war and disease");
    expect(email.html).toContain("https://warondisease.org/treaty?invite=abc");
    expect(email.html).not.toContain("Open the task");
    expect(email.text).toContain(
      "Take 30 seconds to end war and disease: https://warondisease.org/treaty?invite=abc",
    );
  });

  it("suppresses the CTA when explicitly null", () => {
    const email = buildTaskCommentNotificationEmail({ ...baseInput, cta: null });
    expect(email.html).not.toContain("Open the task");
    expect(email.text).not.toContain("Open the task:");
  });

  it("renders a sender sign-off when senderSignature is set (share-email path)", () => {
    const email = buildTaskCommentNotificationEmail({
      ...baseInput,
      senderSignature: { name: "Mike Sinn" },
    });
    expect(email.html).toContain("Mike Sinn");
    expect(email.html).toContain("Recently promoted to Humanity Manager");
    expect(email.html).toContain("Earth Optimization Services LLC");
    expect(email.html).toContain("Yours in not dying,");
    expect(email.text).toContain("Mike Sinn");
    expect(email.text).toContain("Recently promoted to Humanity Manager");
    expect(email.text).toContain("Yours in not dying,");
  });

  it("does not render a sender sign-off when senderSignature is omitted", () => {
    const email = buildTaskCommentNotificationEmail(baseInput);
    expect(email.html).not.toContain("Yours in not dying,");
    expect(email.text).not.toContain("Yours in not dying,");
  });

  it("emits a placeholder for the unsubscribe URL", () => {
    const email = buildTaskCommentNotificationEmail(baseInput);
    expect(email.html).toContain(COMMENT_NOTIFICATION_PLACEHOLDER);
    expect(email.text).toContain(COMMENT_NOTIFICATION_PLACEHOLDER);
  });

  it("escapes HTML in comment, title, and CTA fields", () => {
    const email = buildTaskCommentNotificationEmail({
      ...baseInput,
      comment: {
        authorName: "<script>",
        message: "click <a href=\"x\">here</a>",
      },
      cta: { label: "Click <here>", url: "https://x.test/?q=<bad>" },
      task: {
        ...baseInput.task,
        title: "Title with <tag>",
      },
    });
    expect(email.html).not.toContain("<script>alert");
    expect(email.html).toContain("&lt;a href=&quot;x&quot;&gt;here&lt;/a&gt;");
    expect(email.html).toContain("&lt;tag&gt;");
    expect(email.html).toContain("Click &lt;here&gt;");
  });
});
