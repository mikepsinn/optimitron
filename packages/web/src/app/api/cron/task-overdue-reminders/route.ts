import { NextResponse } from "next/server";
import {
  TaskCommentKind,
  TaskCommentSource,
  TaskCommunicationAudience,
  TaskCommunicationChannel,
  TaskCommunicationPurpose,
  TaskCommunicationStatus,
  TaskStatus,
} from "@optimitron/db/enums";
import type { Prisma } from "@optimitron/db";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { checkTaskCommunicationCooldown } from "@/lib/tasks/task-communications.server";
import {
  getAppBaseUrl,
  getTaskCompletionUrl,
  getTaskEmailReplyInstruction,
  getTaskUrl,
} from "@/lib/email/task-notification";
import { WISHONIA_AVATAR_PATH } from "@/lib/email/wishonia-signature";
import {
  buildTaskCommentNotificationEmail,
  COMMENT_NOTIFICATION_PLACEHOLDER,
} from "@/lib/tasks/task-comment-notification-email.server";
import {
  draftTaskNotification,
  sendDraftTaskNotification,
} from "@/lib/tasks/task-notifications.server";
import {
  buildOverdueReminderComment,
  MAX_OVERDUE_REMINDER_COMMENTS,
} from "@/lib/tasks/task-overdue-reminder.server";
import { resolveTaskRecipient } from "@/lib/tasks/task-recipients.server";
import { recipientWithinRateLimits } from "@/lib/tasks/task-recipient-rate-limit.server";
import { getWishoniaUserId } from "@/lib/wishonia.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const log = createLogger("task-overdue-reminders");

const REMINDER_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_BATCH_SIZE = 50;

interface ReminderResult {
  failures: number;
  scanned: number;
  sent: number;
  skipped: number;
}

function getStoredUnsubscribeUrl(metadata: unknown): string | null {
  if (
    metadata === null ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    return null;
  }
  const value = (metadata as Record<string, unknown>).unsubscribeUrl;
  return typeof value === "string" && value.trim() ? value : null;
}

function asMetadataObject(metadata: unknown): Record<string, unknown> {
  if (
    metadata === null ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    return {};
  }
  return metadata as Record<string, unknown>;
}

async function processOverdueReminders(now: Date): Promise<ReminderResult> {
  const reminderEligibilityCutoff = new Date(
    now.getTime() - REMINDER_INTERVAL_MS,
  );
  const candidates = await prisma.task.findMany({
    where: {
      deletedAt: null,
      dueAt: { lte: reminderEligibilityCutoff, not: null },
      status: TaskStatus.ACTIVE,
      OR: [
        { assigneePersonId: { not: null } },
        { assigneeOrganizationId: { not: null } },
        {
          communicationEndpoints: {
            some: { deletedAt: null, isPrimary: true },
          },
        },
      ],
    },
    orderBy: [{ dueAt: "asc" }],
    select: {
      description: true,
      dueAt: true,
      id: true,
      title: true,
    },
    take: DEFAULT_BATCH_SIZE,
  });

  const result: ReminderResult = {
    failures: 0,
    scanned: candidates.length,
    sent: 0,
    skipped: 0,
  };

  for (const task of candidates) {
    try {
      const reminderCommentSummary = await prisma.taskComment.aggregate({
        where: {
          deletedAt: null,
          taskId: task.id,
          communications: {
            some: {
              deletedAt: null,
              purpose: TaskCommunicationPurpose.REMINDER,
              status: TaskCommunicationStatus.SENT,
            },
          },
        },
        _count: { _all: true },
        _max: { createdAt: true },
      });

      const reminderCommentCount = reminderCommentSummary._count._all;
      const lastReminderCommentAt = reminderCommentSummary._max.createdAt;

      if (reminderCommentCount >= MAX_OVERDUE_REMINDER_COMMENTS) {
        result.skipped += 1;
        continue;
      }

      if (
        lastReminderCommentAt &&
        now.getTime() - lastReminderCommentAt.getTime() < REMINDER_INTERVAL_MS
      ) {
        result.skipped += 1;
        continue;
      }

      const cooldown = await checkTaskCommunicationCooldown(task.id, "email");
      if (!cooldown.allowed) {
        result.skipped += 1;
        continue;
      }

      const recipient = await resolveTaskRecipient(task.id);
      if (!recipient) {
        result.skipped += 1;
        continue;
      }

      if (!(await recipientWithinRateLimits(recipient.email, now))) {
        result.skipped += 1;
        continue;
      }

      const nextReminderCommentCount = reminderCommentCount + 1;
      const reminder = buildOverdueReminderComment({
        now,
        sendCount: nextReminderCommentCount,
        task,
      });
      const message = buildTaskCommentNotificationEmail({
        baseUrl: getAppBaseUrl(),
        comment: {
          authorAvatarUrl: WISHONIA_AVATAR_PATH,
          authorName: "Wishonia",
          message: reminder.message,
        },
        cta: {
          label: "Mark task complete",
          url: getTaskCompletionUrl(task.id),
        },
        recipientReason: recipient.reason ?? null,
        replyInstruction: getTaskEmailReplyInstruction(),
        secondaryCta: {
          label: "Open task",
          url: getTaskUrl(task.id),
        },
        task,
      });
      const draft = await draftTaskNotification({
        audience: TaskCommunicationAudience.ASSIGNEE,
        channel: TaskCommunicationChannel.EMAIL,
        dedupeKey: `task-overdue-reminder:${task.id}:${nextReminderCommentCount}`,
        emailScope: "task_notifications",
        html: message.html,
        bccEmails: [],
        metadataJson: {
          recipientReason: recipient.reason ?? null,
          recipientRole: recipient.role ?? null,
        } satisfies Prisma.InputJsonObject,
        purpose: TaskCommunicationPurpose.REMINDER,
        recipientEmail: recipient.email,
        recipientOrganizationId: recipient.organizationId ?? null,
        recipientPersonId: recipient.personId ?? null,
        recipientUserId: recipient.userId ?? null,
        skipWishoniaSignature: true,
        step: nextReminderCommentCount,
        subject: reminder.subject,
        taskId: task.id,
        text: message.text,
      });

      const reminderComment = await prisma.taskComment.create({
        data: {
          authorUserId: await getWishoniaUserId(),
          kind: TaskCommentKind.COMMENT,
          message: reminder.message,
          source: TaskCommentSource.SYSTEM,
          taskId: task.id,
        },
        select: { id: true },
      });

      const unsubscribeUrl = getStoredUnsubscribeUrl(draft.metadataJson);
      let finalHtml = message.html;
      let finalText = message.text;
      if (
        unsubscribeUrl &&
        message.html.includes(COMMENT_NOTIFICATION_PLACEHOLDER)
      ) {
        finalHtml = message.html.replaceAll(
          COMMENT_NOTIFICATION_PLACEHOLDER,
          unsubscribeUrl,
        );
        finalText = message.text.replaceAll(
          COMMENT_NOTIFICATION_PLACEHOLDER,
          unsubscribeUrl,
        );
      }
      await prisma.taskCommunication.update({
        where: { id: draft.id },
        data: {
          metadataJson: {
            ...asMetadataObject(draft.metadataJson),
            html: finalHtml,
            text: finalText,
          } as Prisma.InputJsonObject,
          taskCommentId: reminderComment.id,
        },
      });

      const sendResult = await sendDraftTaskNotification({
        communicationId: draft.id,
        now,
      });

      if (sendResult.status === "sent") {
        result.sent += 1;
      } else {
        result.skipped += 1;
      }
    } catch (error) {
      log.error("Failed to send overdue reminder", { error, taskId: task.id });
      result.failures += 1;
    }
  }

  return result;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const result = await processOverdueReminders(now);
    return NextResponse.json(result);
  } catch (error) {
    log.error("Failed to process overdue task reminders", error);
    return NextResponse.json(
      { error: "Failed to process overdue task reminders." },
      { status: 500 },
    );
  }
}
