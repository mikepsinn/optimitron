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

describe("buildTaskAssignmentNotificationEmail", () => {
  it("emails the task contents with open and completion links", () => {
    const email = buildTaskAssignmentNotificationEmail({
      description:
        "Put the survey link on your site.\n\nThen share it once with your members.",
      id: "task_iam",
      recipientName: "Institute for Accelerated Medicine",
      replyInstruction: "Reply to this email to add a comment to the task.",
      title: ORGANIZATION_ACTIVATION_TASK_TITLE,
    });

    expect(email.subject).toBe(
      `New task: ${ORGANIZATION_ACTIVATION_TASK_TITLE}`,
    );
    expect(email.text).toContain(
      "New task for Institute for Accelerated Medicine",
    );
    expect(email.text).toContain("Put the survey link on your site.");
    expect(email.text).toContain(
      "Open task: https://warondisease.org/tasks/task_iam",
    );
    expect(email.text).toContain(
      "Mark complete: https://warondisease.org/tasks/task_iam#complete",
    );
    expect(email.text).toContain(
      "Reply to this email to add a comment to the task.",
    );
    expect(email.text).toContain(
      "We are building a decentralized to-do list for humanity",
    );
    expect(email.text).toContain("https://warondisease.org/feedback");
    expect(email.html).toContain("Institute for Accelerated Medicine");
    expect(email.html).toContain(ORGANIZATION_ACTIVATION_TASK_TITLE);
    expect(email.html).toContain("Open task");
    expect(email.html).toContain("Mark complete");
  });
});
