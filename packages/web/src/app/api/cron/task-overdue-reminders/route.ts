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
  draftTaskNotification,
  sendDraftTaskNotification,
} from "@/lib/tasks/task-notifications.server";
import {
  buildOverdueReminderEmail,
  MAX_COMMENTS_IN_REMINDER,
  MAX_OVERDUE_SEND_COUNT,
  OVERDUE_REMINDER_PLACEHOLDER,
} from "@/lib/tasks/task-overdue-reminder.server";
import { resolveTaskRecipient } from "@/lib/tasks/task-recipients.server";
import { recipientWithinRateLimits } from "@/lib/tasks/task-recipient-rate-limit.server";
import { getTaskAncestors } from "@/lib/tasks.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const log = createLogger("task-overdue-reminders");

const REMINDER_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_BATCH_SIZE = 50;

async function loadRecentTaskComments(taskId: string) {
  const comments = await prisma.taskComment.findMany({
    where: {
      deletedAt: null,
      kind: { in: [TaskCommentKind.OUTBOUND_MESSAGE, TaskCommentKind.COMMENT, TaskCommentKind.STATUS_UPDATE] },
      // Exclude AGENT-source rows — those are audit-log echoes of outbound
      // emails written by sendDraftTaskNotification. Including them would
      // duplicate the previous reminder body inside the next reminder.
      source: { not: TaskCommentSource.AGENT },
      taskId,
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      authorPerson: { select: { displayName: true } },
      authorUser: {
        select: {
          name: true,
          person: { select: { displayName: true } },
        },
      },
      createdAt: true,
      message: true,
    },
    take: MAX_COMMENTS_IN_REMINDER,
  });

  return comments.reverse().map((c) => ({
    authorName:
      c.authorUser?.person?.displayName ??
      c.authorUser?.name ??
      c.authorPerson?.displayName ??
      null,
    createdAt: c.createdAt,
    message: c.message,
  }));
}

interface ReminderResult {
  failures: number;
  scanned: number;
  sent: number;
  skipped: number;
}

function getStoredUnsubscribeUrl(metadata: unknown): string | null {
  if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const value = (metadata as Record<string, unknown>).unsubscribeUrl;
  return typeof value === "string" && value.trim() ? value : null;
}

function asMetadataObject(metadata: unknown): Record<string, unknown> {
  if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }
  return metadata as Record<string, unknown>;
}

async function processOverdueReminders(now: Date): Promise<ReminderResult> {
  const candidates = await prisma.task.findMany({
    where: {
      deletedAt: null,
      dueAt: { lt: now, not: null },
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
      const sentSummary = await prisma.taskCommunication.aggregate({
        where: {
          deletedAt: null,
          purpose: TaskCommunicationPurpose.REMINDER,
          status: TaskCommunicationStatus.SENT,
          taskId: task.id,
        },
        _count: { _all: true },
        _max: { sentAt: true },
      });

      const sendCount = sentSummary._count._all;
      const lastSentAt = sentSummary._max.sentAt;

      if (sendCount >= MAX_OVERDUE_SEND_COUNT) {
        result.skipped += 1;
        continue;
      }

      if (lastSentAt && now.getTime() - lastSentAt.getTime() < REMINDER_INTERVAL_MS) {
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

      const ancestors = await getTaskAncestors(task.id);
      const comments = await loadRecentTaskComments(task.id);
      const nextSendCount = sendCount + 1;
      const message = buildOverdueReminderEmail({
        ancestors,
        comments,
        now,
        recipient,
        sendCount: nextSendCount,
        task,
      });
      const reminderComment = await prisma.taskComment.create({
        data: {
          kind: TaskCommentKind.STATUS_UPDATE,
          message: `Automated overdue reminder ${nextSendCount} queued for ${recipient.email}.`,
          source: TaskCommentSource.SYSTEM,
          taskId: task.id,
        },
        select: { id: true },
      });

      const draft = await draftTaskNotification({
        audience: TaskCommunicationAudience.ASSIGNEE,
        channel: TaskCommunicationChannel.EMAIL,
        dedupeKey: `task-overdue-reminder:${task.id}:${nextSendCount}`,
        emailScope: "task_notifications",
        html: message.html,
        purpose: TaskCommunicationPurpose.REMINDER,
        recipientEmail: recipient.email,
        recipientOrganizationId: recipient.organizationId ?? null,
        recipientPersonId: recipient.personId ?? null,
        recipientUserId: recipient.userId ?? null,
        step: nextSendCount,
        subject: message.subject,
        taskCommentId: reminderComment.id,
        taskId: task.id,
        text: message.text,
      });

      const unsubscribeUrl = getStoredUnsubscribeUrl(draft.metadataJson);
      if (unsubscribeUrl && message.html.includes(OVERDUE_REMINDER_PLACEHOLDER)) {
        const finalHtml = message.html.replaceAll(
          OVERDUE_REMINDER_PLACEHOLDER,
          unsubscribeUrl,
        );
        const finalText = message.text.replaceAll(
          OVERDUE_REMINDER_PLACEHOLDER,
          unsubscribeUrl,
        );
        await prisma.taskCommunication.update({
          where: { id: draft.id },
          data: {
            metadataJson: {
              ...asMetadataObject(draft.metadataJson),
              html: finalHtml,
              text: finalText,
            } as Prisma.InputJsonObject,
          },
        });
      }

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
