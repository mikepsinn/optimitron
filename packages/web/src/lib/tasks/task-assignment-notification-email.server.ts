import React from "react";
import {
  getTaskEmailReplyInstruction,
  getTaskUrl,
} from "@/lib/email/task-notification";
import { formatDefaultSystemEmailFromHeader } from "@/lib/email/from-address";
import {
  SAMPLE_REFERRAL_URL,
  SAMPLE_TASK_ID,
  SAMPLE_TASK_REPLY_ADDRESS,
  type EmailPreview,
} from "@/lib/email/preview-envelope";
import { renderReactEmailBody } from "@/lib/email/render-react-email";
import { TaskAssignmentReactEmail } from "@/lib/tasks/task-assignment-react-email";

export interface TaskAssignmentEmailInput {
  description: string;
  id: string;
  recipientName: string;
  replyInstruction?: string | null;
  title: string;
  /**
   * When the assignee is one of our users (not an external office),
   * pass their personal referral URL so the share kit appears at the
   * bottom of the email. Omit for external assignees — including the
   * share kit on outreach emails to leaders' offices is off-brand.
   */
  recipientReferralUrl?: string | null;
}

export interface TaskAssignmentEmail {
  html: string;
  subject: string;
  text: string;
}

export async function buildTaskAssignmentNotificationEmail(
  input: TaskAssignmentEmailInput,
): Promise<TaskAssignmentEmail> {
  const taskUrl = getTaskUrl(input.id);
  const replyInstruction =
    input.replyInstruction === undefined
      ? getTaskEmailReplyInstruction()
      : input.replyInstruction;
  const subject = `New task: ${input.title}`;
  const body = await renderReactEmailBody(
    React.createElement(TaskAssignmentReactEmail, {
      description: input.description,
      recipientName: input.recipientName,
      replyInstruction,
      taskUrl,
      title: input.title,
      recipientReferralUrl: input.recipientReferralUrl,
    }),
  );

  return { ...body, subject };
}

export const TASK_ASSIGNMENT_TEMPLATE_ID = "task-assignment";

const SAMPLE_ASSIGNMENT_INPUT = {
  description: [
    "The 1% Treaty needs your country's signature. Sign the document, hire two people you love with your hiring link, and verify that your local treaty signer has been contacted.",
    "",
    "Read [the manual](https://manual.warondisease.org/) before you start.",
    "",
    "- Sign the treaty.",
    "- Hire two people you love with your hiring link.",
    "- Verify your local treaty signer has been contacted.",
    "",
    "```html",
    '<iframe src="https://warondisease.org/vote/SAMPLE" title="1% Treaty vote"></iframe>',
    "```",
  ].join("\n"),
  id: SAMPLE_TASK_ID,
  recipientName: "Sample Assignee",
  replyInstruction: "Reply to this email to leave a comment on the task.",
  title: "Sign the 1% Treaty for {country}",
  recipientReferralUrl: SAMPLE_REFERRAL_URL,
};

export const TASK_ASSIGNMENT_PREVIEW: EmailPreview = {
  templateId: TASK_ASSIGNMENT_TEMPLATE_ID,
  displayName: "You were assigned a new task",
  trigger:
    "Fires when a task is assigned to a user — either by a manual edit on the task page, or automatically when a task trigger blueprint runs (e.g. post-signup onboarding tasks, country-specific treaty-signer tasks). Reply-To routes inbound replies back as task comments.",
  scope: "task_notifications",
  from: () => formatDefaultSystemEmailFromHeader(),
  subject: () => `New task: ${SAMPLE_ASSIGNMENT_INPUT.title}`,
  replyTo: () => SAMPLE_TASK_REPLY_ADDRESS,
  skipWishoniaSignature: false,
  renderReact: () =>
    React.createElement(TaskAssignmentReactEmail, {
      description: SAMPLE_ASSIGNMENT_INPUT.description,
      recipientName: SAMPLE_ASSIGNMENT_INPUT.recipientName,
      replyInstruction: SAMPLE_ASSIGNMENT_INPUT.replyInstruction,
      taskUrl: getTaskUrl(SAMPLE_ASSIGNMENT_INPUT.id),
      title: SAMPLE_ASSIGNMENT_INPUT.title,
      recipientReferralUrl: SAMPLE_ASSIGNMENT_INPUT.recipientReferralUrl,
    }),
};
