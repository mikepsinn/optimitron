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
import {
  buildTaskCommentNotificationEmail,
  COMMENT_NOTIFICATION_PLACEHOLDER,
} from "@/lib/tasks/task-comment-notification-email.server";
import {
  draftTaskNotification,
  sendDraftTaskNotification,
} from "@/lib/tasks/task-notifications.server";
import { recipientWithinRateLimits } from "@/lib/tasks/task-recipient-rate-limit.server";
import { resolveTaskRecipient } from "@/lib/tasks/task-recipients.server";
import { getTaskAncestors } from "@/lib/tasks.server";

const log = createLogger("task-comment-notifications");

export interface PostTaskCommentInput {
  authorNameOverride?: string | null;
  authorPersonId?: string | null;
  authorUserId?: string | null;
  kind?: TaskCommentKind;
  message: string;
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
 * Fires an email notification to the task's assignee recipient if rate limits
 * allow. Use this AFTER the comment row has already been created, e.g. in the
 * threaded comment route where `postComment` builds materialized paths and
 * reply counts, and you only want the notification side-effect.
 */
export async function notifyTaskCommentRecipients(input: {
  authorPersonId?: string | null;
  authorUserId?: string | null;
  authorNameOverride?: string | null;
  commentId: string;
  message: string;
  taskId: string;
}): Promise<PostTaskCommentResult> {
  const { commentId, taskId, message } = input;
  const now = new Date();

  const recipient = await resolveTaskRecipient(taskId);
  if (!recipient) {
    return { commentId, status: "skipped", reason: "no_recipient" };
  }

  if (input.authorUserId && recipient.userId === input.authorUserId) {
    return { commentId, status: "skipped", reason: "author_is_recipient" };
  }

  if (!(await recipientWithinRateLimits(recipient.email, now))) {
    return { commentId, status: "skipped", reason: "rate_limited" };
  }

  const cooldown = await checkTaskCommunicationCooldown(taskId, "email");
  if (!cooldown.allowed) {
    return { commentId, status: "skipped", reason: "cooldown" };
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { description: true, id: true, title: true, deletedAt: true },
  });
  if (!task || task.deletedAt) {
    return { commentId, status: "skipped", reason: "task_missing" };
  }

  const authorName = await resolveAuthorName({
    authorNameOverride: input.authorNameOverride ?? null,
    authorPersonId: input.authorPersonId ?? null,
    authorUserId: input.authorUserId ?? null,
  });
  const ancestors = await getTaskAncestors(taskId);

  const email = buildTaskCommentNotificationEmail({
    ancestors,
    comment: { authorName, message },
    task,
  });

  try {
    const draft = await draftTaskNotification({
      audience: TaskCommunicationAudience.ASSIGNEE,
      channel: TaskCommunicationChannel.EMAIL,
      dedupeKey: `task-comment-notification:${commentId}`,
      emailScope: "task_notifications",
      html: email.html,
      purpose: TaskCommunicationPurpose.STATUS_UPDATE,
      recipientEmail: recipient.email,
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
      now,
    });

    if (sendResult.status === "sent") {
      return { commentId, status: "sent" };
    }
    return { commentId, status: "skipped", reason: sendResult.status };
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
 * Posts a TaskComment AND fires an email notification to the task's assignee
 * recipient if rate limits allow. The comment is always created — only the
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
    message: input.message,
    taskId: input.taskId,
  });
}
