import {
  TaskCommentKind,
  TaskCommentSource,
  TaskCommunicationAudience,
  TaskCommunicationChannel,
  TaskCommunicationPurpose,
} from "@optimitron/db/enums";
import type { Prisma } from "@optimitron/db";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { checkTaskCommunicationCooldown } from "@/lib/tasks/task-communications.server";
import type { SenderSignature } from "@/lib/email/wishonia-signature";
import {
  buildTaskCommentNotificationEmail,
  COMMENT_NOTIFICATION_PLACEHOLDER,
  type CommentNotificationCta,
} from "@/lib/tasks/task-comment-notification-email.server";
import {
  draftTaskNotification,
  sendDraftTaskNotification,
} from "@/lib/tasks/task-notifications.server";
import { recipientWithinRateLimits } from "@/lib/tasks/task-recipient-rate-limit.server";
import { resolveTaskRecipients } from "@/lib/tasks/task-recipients.server";

const log = createLogger("task-comment-notifications");

export interface PostTaskCommentInput {
  authorNameOverride?: string | null;
  authorPersonId?: string | null;
  authorUserId?: string | null;
  /// Override the email CTA. Default points to the in-app task page. Pass null
  /// to suppress entirely. Used by share emails to point recipients at the
  /// invite URL ("Take 30 seconds to end war and disease").
  cta?: CommentNotificationCta | null;
  /// Per-message From override. Used by share emails to foreground the
  /// sender's name (e.g. "Mike via Earth Optimization Services").
  from?: string | null;
  kind?: TaskCommentKind;
  message: string;
  /// When set, render a sender sign-off block in the email body. Used by
  /// share emails so the recipient sees their friend's name + role + org
  /// instead of (or in addition to) Wishonia's auto-signature. The Resend
  /// layer skips Wishonia auto-append when `from` is also set.
  senderSignature?: SenderSignature | null;
  source?: TaskCommentSource;
  taskId: string;
}

export type PostTaskCommentResult =
  | { commentId: string; status: "sent" }
  | { commentId: string; status: "skipped"; reason: string }
  | { commentId: string; status: "failed"; reason: string };

function asMetadataObject(metadata: unknown): Record<string, unknown> {
  if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }
  return metadata as Record<string, unknown>;
}

function getStoredUnsubscribeUrl(metadata: unknown): string | null {
  if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const value = (metadata as Record<string, unknown>).unsubscribeUrl;
  return typeof value === "string" && value.trim() ? value : null;
}

async function resolveAuthorName(input: {
  authorNameOverride?: string | null;
  authorPersonId?: string | null;
  authorUserId?: string | null;
}): Promise<string | null> {
  const override = input.authorNameOverride?.trim();
  if (override) return override;

  if (input.authorUserId) {
    const user = await prisma.user.findUnique({
      where: { id: input.authorUserId },
      select: {
        name: true,
        person: { select: { displayName: true } },
      },
    });
    return user?.person?.displayName ?? user?.name ?? null;
  }

  if (input.authorPersonId) {
    const person = await prisma.person.findUnique({
      where: { id: input.authorPersonId },
      select: { displayName: true },
    });
    return person?.displayName ?? null;
  }

  return null;
}

/**
 * Fires an email notification to task recipients if rate limits
 * allow. Use this AFTER the comment row has already been created, e.g. in the
 * threaded comment route where `postComment` builds materialized paths and
 * reply counts, and you only want the notification side-effect.
 */
export async function notifyTaskCommentRecipients(input: {
  authorPersonId?: string | null;
  authorUserId?: string | null;
  authorNameOverride?: string | null;
  commentId: string;
  cta?: CommentNotificationCta | null;
  from?: string | null;
  message: string;
  senderSignature?: SenderSignature | null;
  taskId: string;
}): Promise<PostTaskCommentResult> {
  const { commentId, taskId, message } = input;
  const now = new Date();

  const recipients = await resolveTaskRecipients(taskId);
  if (recipients.length === 0) {
    return { commentId, status: "skipped", reason: "no_recipient" };
  }

  const filteredRecipients = recipients.filter((recipient) => {
    if (input.authorPersonId && recipient.personId && recipient.personId === input.authorPersonId) {
      return false;
    }
    if (input.authorUserId && recipient.userId === input.authorUserId) {
      return false;
    }
    return true;
  });
  if (filteredRecipients.length === 0) {
    return { commentId, status: "skipped", reason: "author_is_recipient" };
  }

  const cooldown = await checkTaskCommunicationCooldown(taskId, "email");
  if (!cooldown.allowed) {
    return { commentId, status: "skipped", reason: "cooldown" };
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, title: true, deletedAt: true },
  });
  if (!task || task.deletedAt) {
    return { commentId, status: "skipped", reason: "task_missing" };
  }

  const authorName = await resolveAuthorName({
    authorNameOverride: input.authorNameOverride ?? null,
    authorPersonId: input.authorPersonId ?? null,
    authorUserId: input.authorUserId ?? null,
  });

  const email = buildTaskCommentNotificationEmail({
    comment: { authorName, message },
    cta: input.cta,
    senderSignature: input.senderSignature,
    task,
  });

  try {
    let sentCount = 0;
    let skippedReason: string | null = null;

    const directRecipients = filteredRecipients.filter((recipient) => !recipient.isAdmin);
    const admins = filteredRecipients.filter((recipient) => recipient.isAdmin);
    const recipientsToNotify =
      directRecipients.length > 0 ? directRecipients : admins;
    const adminBccEmails = admins.map((recipient) => recipient.email);
    let bccApplied = false;

    for (let index = 0; index < recipientsToNotify.length; index += 1) {
      const recipient = recipientsToNotify[index];
      const bccEmails =
        admins.length > 0 && !bccApplied
          ? adminBccEmails.filter((email) => email !== recipient.email)
          : [];

      if (!(await recipientWithinRateLimits(recipient.email, now))) {
        skippedReason = "rate_limited";
        continue;
      }

      const draft = await draftTaskNotification({
        audience: TaskCommunicationAudience.ASSIGNEE,
        channel: TaskCommunicationChannel.EMAIL,
        dedupeKey: `task-comment-notification:${commentId}:${recipient.email}`,
        emailScope: "task_notifications",
        html: email.html,
        purpose: TaskCommunicationPurpose.STATUS_UPDATE,
        recipientEmail: recipient.email,
        bccEmails,
        recipientOrganizationId: recipient.organizationId ?? null,
        recipientPersonId: recipient.personId ?? null,
        recipientUserId: recipient.userId ?? null,
        senderPersonId: input.authorPersonId ?? null,
        senderUserId: input.authorUserId ?? null,
        subject: email.subject,
        // Reuse the comment we already created so sendDraftTaskNotification
        // doesn't write a second AGENT-source audit row for the same send.
        taskCommentId: commentId,
        taskId,
        text: email.text,
      });

      const unsubscribeUrl = getStoredUnsubscribeUrl(draft.metadataJson);
      if (unsubscribeUrl && email.html.includes(COMMENT_NOTIFICATION_PLACEHOLDER)) {
        await prisma.taskCommunication.update({
          where: { id: draft.id },
          data: {
            metadataJson: {
              ...asMetadataObject(draft.metadataJson),
              html: email.html.replaceAll(COMMENT_NOTIFICATION_PLACEHOLDER, unsubscribeUrl),
              text: email.text.replaceAll(COMMENT_NOTIFICATION_PLACEHOLDER, unsubscribeUrl),
            } as Prisma.InputJsonObject,
          },
        });
      }

      const sendResult = await sendDraftTaskNotification({
        communicationId: draft.id,
        from: input.from ?? null,
        now,
      });

      if (sendResult.status === "sent") {
        sentCount += 1;
      } else if (!skippedReason) {
        skippedReason = sendResult.status;
      }

      if (admins.length > 0) {
        bccApplied = true;
      }
    }

    if (sentCount > 0) {
      return { commentId, status: "sent" };
    }
    return { commentId, status: "skipped", reason: skippedReason ?? "skipped" };
  } catch (error) {
    log.error("Failed to send comment notification", {
      commentId,
      error,
      taskId,
    });
    return {
      commentId,
      status: "failed",
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Posts a TaskComment AND fires comment notifications if rate limits allow.
 * The comment is always created — only the
 * email is conditional. Returns a result describing what happened.
 *
 * Use this for system/agent-authored simple comments. For threaded comments
 * with reply counts and materialized paths, use `postComment` from
 * `task-comments.server.ts` and then call `notifyTaskCommentRecipients`.
 */
export async function postTaskCommentAndNotify(
  input: PostTaskCommentInput,
): Promise<PostTaskCommentResult> {
  const kind = input.kind ?? TaskCommentKind.COMMENT;
  const source = input.source ?? TaskCommentSource.WEB;

  const comment = await prisma.taskComment.create({
    data: {
      authorPersonId: input.authorPersonId ?? null,
      authorUserId: input.authorUserId ?? null,
      kind,
      message: input.message,
      source,
      taskId: input.taskId,
    },
    select: { id: true },
  });

  return notifyTaskCommentRecipients({
    authorNameOverride: input.authorNameOverride ?? null,
    authorPersonId: input.authorPersonId ?? null,
    authorUserId: input.authorUserId ?? null,
    commentId: comment.id,
    cta: input.cta,
    from: input.from ?? null,
    message: input.message,
    senderSignature: input.senderSignature ?? null,
    taskId: input.taskId,
  });
}
