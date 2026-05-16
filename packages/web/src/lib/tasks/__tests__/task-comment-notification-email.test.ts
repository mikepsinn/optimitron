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
    authorAvatarUrl: "/sprites/wishonia/smirk-smile.png",
    message: "Welcome. Get your network voting.",
  },
  task: {
    description: "Vote on the 1% Treaty.",
    id: "task_xyz",
    title: "Get the rest of humanity to vote on the 1% Treaty",
  },
};

describe("buildTaskCommentNotificationEmail", () => {
  it("uses the bare task title as the subject (no author prefix — sender is in From header)", async () => {
    const email = await buildTaskCommentNotificationEmail(baseInput);
    expect(email.subject).toBe(
      "Get the rest of humanity to vote on the 1% Treaty",
    );
  });

  it("renders the comment as a comment card with author name and avatar", async () => {
    const email = await buildTaskCommentNotificationEmail(baseInput);
    expect(email.text).toContain("Welcome. Get your network voting.");
    expect(email.text).toContain("Wishonia commented");
    expect(email.html).toContain("Welcome. Get your network voting.");
    expect(email.html).toContain("Wishonia commented");
    expect(email.html).toContain(
      "https://warondisease.org/sprites/wishonia/smirk-smile.png",
    );
    expect(email.html).toContain('alt="Wishonia"');
  });

  it("does not render the breadcrumb or task description (noise)", async () => {
    const email = await buildTaskCommentNotificationEmail(baseInput);
    expect(email.text).not.toContain("Optimize Earth › Ratify the 1% Treaty");
    expect(email.text).not.toContain("Vote on the 1% Treaty.");
    expect(email.html).not.toContain("Optimize Earth");
    expect(email.html).not.toContain("Vote on the 1% Treaty.");
  });

  it("does not render a 'New activity' banner", async () => {
    const email = await buildTaskCommentNotificationEmail(baseInput);
    expect(email.html).not.toContain("New activity");
    expect(email.text).not.toContain("NEW ACTIVITY");
  });

  it("defaults the CTA to the in-app task URL with 'Open the task' label", async () => {
    const email = await buildTaskCommentNotificationEmail(baseInput);
    expect(email.text).toContain(
      "Open the task https://warondisease.org/tasks/task_xyz",
    );
    expect(email.html).toContain("https://warondisease.org/tasks/task_xyz");
    expect(email.html).toContain("Open the task");
  });

  it("uses the override CTA when provided (share-email flow)", async () => {
    const email = await buildTaskCommentNotificationEmail({
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
      "Take 30 seconds to end war and disease https://warondisease.org/treaty?invite=abc",
    );
  });

  it("renders a secondary CTA when provided", async () => {
    const email = await buildTaskCommentNotificationEmail({
      ...baseInput,
      cta: {
        label: "Mark task complete",
        url: "https://warondisease.org/tasks/task_xyz#complete",
      },
      secondaryCta: {
        label: "Open task",
        url: "https://warondisease.org/tasks/task_xyz",
      },
    });

    expect(email.text).toContain(
      "Mark task complete https://warondisease.org/tasks/task_xyz#complete",
    );
    expect(email.text).toContain(
      "Open task https://warondisease.org/tasks/task_xyz",
    );
    expect(email.html).toContain("Mark task complete");
    expect(email.html).toContain("Open task");
  });

  it("renders the template-driven share footer when the recipient has a referral URL", async () => {
    const email = await buildTaskCommentNotificationEmail({
      ...baseInput,
      recipientReferralUrl: "https://warondisease.org/vote/SAMPLE",
    });
    expect(email.html).toContain("Forward this");
    expect(email.html).toContain("Hi there");
    expect(email.html).toContain("respond to this stupid survey");
    expect(email.html).toContain("https://warondisease.org/vote/SAMPLE");
    expect(email.html).not.toContain("{treaty_url}");
    expect(email.text).toContain("Hi there");
    expect(email.text).not.toContain("{target_name}");
  });

  it("suppresses the CTA when explicitly null", async () => {
    const email = await buildTaskCommentNotificationEmail({
      ...baseInput,
      cta: null,
    });
    expect(email.html).not.toContain("Open the task");
    expect(email.text).not.toContain("Open the task");
  });

  it("renders a sender sign-off when senderSignature is set (share-email path)", async () => {
    const email = await buildTaskCommentNotificationEmail({
      ...baseInput,
      senderSignature: { name: "Mike Sinn" },
    });
    expect(email.html).toContain("Mike Sinn");
    expect(email.html).toContain("Recently promoted to Humanity Manager");
    expect(email.html).toContain("Earth Optimization Services LLC");
    expect(email.html).toContain("Love,");
    expect(email.text).toContain("Mike Sinn");
    expect(email.text).toContain("Recently promoted to Humanity Manager");
    expect(email.text).toContain("Love,");
  });

  it("does not render a sender sign-off when senderSignature is omitted", async () => {
    const email = await buildTaskCommentNotificationEmail(baseInput);
    expect(email.html).not.toContain("Love,");
    expect(email.text).not.toContain("Love,");
  });

  it("renders a recipient reason when provided", async () => {
    const email = await buildTaskCommentNotificationEmail({
      ...baseInput,
      recipientReason: "You're getting this because you created this task.",
    });
    expect(email.text).toContain(
      "You're getting this because you created this task.",
    );
    expect(email.html).toContain(
      "You&#x27;re getting this because you created this task.",
    );
  });

  it("renders a reply instruction only when provided", async () => {
    const withoutReply = await buildTaskCommentNotificationEmail(baseInput);
    expect(withoutReply.text).not.toContain("Reply to this email");
    expect(withoutReply.html).not.toContain("Reply to this email");

    const withReply = await buildTaskCommentNotificationEmail({
      ...baseInput,
      replyInstruction: "Reply to this email to add a comment to the task.",
    });
    expect(withReply.text).toContain(
      "Reply to this email to add a comment to the task.",
    );
    expect(withReply.html).toContain(
      "Reply to this email to add a comment to the task.",
    );
  });

  it("emits a placeholder for the unsubscribe URL", async () => {
    const email = await buildTaskCommentNotificationEmail(baseInput);
    expect(email.html).toContain(COMMENT_NOTIFICATION_PLACEHOLDER);
    expect(email.text).toContain(COMMENT_NOTIFICATION_PLACEHOLDER);
  });

  it("escapes HTML in comment, title, and CTA fields", async () => {
    const email = await buildTaskCommentNotificationEmail({
      ...baseInput,
      comment: {
        authorName: "<script>",
        authorAvatarUrl: 'https://x.test/avatar.png?q="<bad>"',
        message: 'click <a href="x">here</a>',
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
    expect(email.html).toContain(
      "https://x.test/avatar.png?q=&quot;&lt;bad&gt;&quot;",
    );
  });
});
