import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/email/task-notification", () => ({
  getAppBaseUrl: () => "https://warondisease.org",
  getTaskCompletionUrl: (taskId: string) =>
    `https://warondisease.org/tasks/${taskId}#complete`,
  getTaskEmailReplyInstruction: () =>
    "Reply to this email to add a comment to the task.",
  getTaskUrl: (taskId: string) => `https://warondisease.org/tasks/${taskId}`,
}));

import { buildTaskAssignmentNotificationEmail } from "@/lib/tasks/task-assignment-notification-email.server";
import { ORGANIZATION_ACTIVATION_TASK_TITLE } from "@/lib/messaging";

const baseTaskInput = {
  id: "task_meridian",
  recipientName: "Meridian Research Foundation",
  replyInstruction: "Reply to this email to add a comment to the task.",
  title: ORGANIZATION_ACTIVATION_TASK_TITLE,
};

function countOccurrences(value: string, needle: string): number {
  return value.split(needle).length - 1;
}

describe("buildTaskAssignmentNotificationEmail", () => {
  it("emails the task contents with a single Open Task CTA", async () => {
    const email = await buildTaskAssignmentNotificationEmail({
      ...baseTaskInput,
      description:
        "Put the survey link on your site.\n\nThen share it once with your members.",
    });

    expect(email.subject).toBe(
      `New task: ${ORGANIZATION_ACTIVATION_TASK_TITLE}`,
    );
    expect(email.text).toContain(
      "New task for Meridian Research Foundation",
    );
    expect(email.text).toContain("Put the survey link on your site.");
    expect(email.text).toContain(
      "Open task https://warondisease.org/tasks/task_meridian",
    );
    expect(email.text).toContain(
      "Reply to this email to add a comment to the task.",
    );
    // Minimalism guard: drop the secondary "Mark complete" CTA and the
    // "decentralized to-do list" feedback chrome.
    expect(email.text).not.toContain("Mark complete");
    expect(email.text).not.toContain(
      "decentralized to-do list for humanity",
    );
    expect(email.html).toContain("Meridian Research Foundation");
    expect(email.html).toContain(ORGANIZATION_ACTIVATION_TASK_TITLE);
    expect(email.html).toContain("Open task");
    expect(email.html).not.toContain("Mark complete");
    expect(countOccurrences(email.html, "Open task")).toBe(1);
  });

  it("renders markdown links in the task description", async () => {
    const email = await buildTaskAssignmentNotificationEmail({
      ...baseTaskInput,
      description:
        "Read [the manual](https://manual.warondisease.org/) before contacting the signer.",
    });

    expect(email.html).toContain('href="https://manual.warondisease.org/"');
    expect(email.html).toContain(">the manual</a>");
  });

  it("renders ordered and unordered markdown lists in the task description", async () => {
    const email = await buildTaskAssignmentNotificationEmail({
      ...baseTaskInput,
      description: [
        "Do this:",
        "",
        "- Put the survey link on your site.",
        "- Share it once with members.",
        "",
        "Then:",
        "",
        "1. Open the task.",
        "2. Mark it complete.",
      ].join("\n"),
    });

    expect(email.html).toContain("<ul");
    expect(email.html).toContain("<ol");
    expect(email.html).toContain("<li");
    expect(email.html).toContain("Put the survey link on your site.");
    expect(email.html).toContain("Open the task.");
  });

  it("renders compact markdown headings in the task description", async () => {
    const email = await buildTaskAssignmentNotificationEmail({
      ...baseTaskInput,
      description: [
        "# Do this",
        "",
        "## Evidence",
        "",
        "### Done when",
      ].join("\n"),
    });

    expect(email.html).toContain("<h1");
    expect(email.html).toContain("<h2");
    expect(email.html).toContain("<h3");
    expect(email.html).toContain('style="color:#000;font-size:20px');
    expect(email.html).toContain('style="color:#000;font-size:18px');
    expect(email.html).toContain('style="color:#000;font-size:16px');
  });

  it("renders fenced code blocks in the task description", async () => {
    const email = await buildTaskAssignmentNotificationEmail({
      ...baseTaskInput,
      description: ["```text", "Open the task.", "```"].join("\n"),
    });

    expect(email.html).toContain("<pre");
    expect(email.html).toContain("<code");
    expect(email.html).toContain("Open the task.");
  });

  it("escapes HTML inside fenced code blocks before rendering markdown", async () => {
    const email = await buildTaskAssignmentNotificationEmail({
      ...baseTaskInput,
      description: [
        "```html",
        '<iframe src="x"></iframe>',
        "```",
      ].join("\n"),
    });

    expect(email.html).toContain("<pre");
    expect(email.html).toContain("<code");
    expect(email.html).toContain("&lt;iframe");
    expect(email.html).not.toMatch(/<iframe\b/i);
  });

  it("strips raw script tags outside fenced code blocks", async () => {
    const email = await buildTaskAssignmentNotificationEmail({
      ...baseTaskInput,
      description: [
        "Review the submitted task.",
        "",
        "<script>alert(1)</script>",
      ].join("\n"),
    });

    expect(email.html).not.toMatch(/<script\b/i);
  });

  it("strips raw iframe tags outside fenced code blocks", async () => {
    const email = await buildTaskAssignmentNotificationEmail({
      ...baseTaskInput,
      description: [
        "Review the submitted task.",
        "",
        '<iframe src="https://evil.example/embed"></iframe>',
      ].join("\n"),
    });

    expect(email.html).not.toMatch(/<iframe\b/i);
  });

  it("removes javascript URLs from raw anchors outside fenced code blocks", async () => {
    const email = await buildTaskAssignmentNotificationEmail({
      ...baseTaskInput,
      description:
        'Review <a href="javascript:alert(1)">the submitted task</a>.',
    });

    expect(email.html).not.toContain("javascript:alert");
  });

  it("removes event handler attributes from raw image tags outside fenced code blocks", async () => {
    const email = await buildTaskAssignmentNotificationEmail({
      ...baseTaskInput,
      description: 'Review <img src=x onerror=alert(1)> the submitted task.',
    });

    expect(email.html).not.toContain("onerror");
  });

  it("preserves safe markdown features after sanitizing task descriptions", async () => {
    const email = await buildTaskAssignmentNotificationEmail({
      ...baseTaskInput,
      description: [
        "# Do this",
        "",
        "Use **bold** and *emphasis*.",
        "",
        "- [HTTP](http://warondisease.org)",
        "- [HTTPS](https://warondisease.org)",
        "- [Email](mailto:team@warondisease.org)",
        "",
        "Open <https://manual.warondisease.org>.",
      ].join("\n"),
    });

    expect(email.html).toContain("<h1");
    expect(email.html).toContain("<strong");
    expect(email.html).toContain("<em");
    expect(email.html).toContain("<ul");
    expect(email.html).toContain('href="http://warondisease.org"');
    expect(email.html).toContain('href="https://warondisease.org"');
    expect(email.html).toContain('href="mailto:team@warondisease.org"');
    expect(email.html).toContain('href="https://manual.warondisease.org"');
  });
});
