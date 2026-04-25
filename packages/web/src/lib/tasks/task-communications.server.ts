import {
  ActivityType,
  TaskCommentKind,
  TaskCommentSource,
  TaskCommunicationAudience,
  TaskCommunicationChannel,
  TaskCommunicationDirection,
  TaskCommunicationPurpose,
  TaskCommunicationStatus,
} from "@optimitron/db";
import type { Prisma } from "@optimitron/db";
import { prisma } from "@/lib/prisma";

/** Minimum seconds between recorded task communications on the same task+channel. */
const TASK_COMMUNICATION_COOLDOWN_SECONDS = 86_400; // 24 hours

export type TaskCommunicationActionChannel =
  | "email"
  | "externalUrl"
  | "mailto"
  | "manual";

export async function countTaskCommunications(taskId: string) {
  return prisma.taskCommunication.count({
    where: {
      deletedAt: null,
      taskId,
    },
  });
}

function toTaskCommunicationChannel(channel: TaskCommunicationActionChannel) {
  switch (channel) {
    case "email":
      return TaskCommunicationChannel.EMAIL;
    case "mailto":
      return TaskCommunicationChannel.MAILTO;
    case "manual":
      return TaskCommunicationChannel.MANUAL;
    case "externalUrl":
    default:
      return TaskCommunicationChannel.EXTERNAL_URL;
  }
}

function normalizeChannel(value: string): TaskCommunicationActionChannel {
  if (value === "email" || value === "mailto" || value === "manual") {
    return value;
  }

  return "externalUrl";
}

export function normalizeTaskCommunicationActionChannel(value: unknown) {
  return normalizeChannel(typeof value === "string" ? value : "externalUrl");
}

/**
 * Check whether a task communication action is allowed.
 * Returns `{ allowed: true }` or `{ allowed: false, retryAfter }`.
 */
export async function checkTaskCommunicationCooldown(
  taskId: string,
  channel: TaskCommunicationActionChannel,
) {
  const cutoff = new Date(
    Date.now() - TASK_COMMUNICATION_COOLDOWN_SECONDS * 1000,
  );
  const prismaChannel = toTaskCommunicationChannel(channel);

  const recent = await prisma.taskCommunication.findFirst({
    where: {
      channel: prismaChannel,
      deletedAt: null,
      status: TaskCommunicationStatus.SENT,
      taskId,
      OR: [
        { sentAt: { gte: cutoff } },
        {
          createdAt: { gte: cutoff },
          sentAt: null,
        },
      ],
    },
    orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }],
    select: { createdAt: true, sentAt: true },
  });

  if (!recent) {
    return { allowed: true as const };
  }

  const recentAt = recent.sentAt ?? recent.createdAt;
  const retryAfter = new Date(
    recentAt.getTime() + TASK_COMMUNICATION_COOLDOWN_SECONDS * 1000,
  );
  return { allowed: false as const, retryAfter };
}

export async function recordTaskCommunication(input: {
  channel: TaskCommunicationActionChannel;
  endpointId?: string | null;
  href?: string | null;
  message?: string | null;
  metadataJson?: Prisma.InputJsonObject | null;
  skipCooldownCheck?: boolean;
  source?: TaskCommentSource;
  submittedAt?: Date | null;
  taskId: string;
  userId: string;
}) {
  const channel = normalizeChannel(input.channel);
  if (!input.skipCooldownCheck) {
    const cooldown = await checkTaskCommunicationCooldown(
      input.taskId,
      channel,
    );
    if (!cooldown.allowed) {
      throw new Error(
        `Task communication cooldown active for this task+channel. Retry after ${cooldown.retryAfter.toISOString()}.`,
      );
    }
  }

  const now = new Date();
  const message = input.message?.trim();
  const href = input.href?.trim() || null;
  const source = input.source ?? TaskCommentSource.WEB;
  const metadata: Record<string, Prisma.InputJsonValue | null> = {
    ...(input.metadataJson ?? {}),
    href,
  };
  if (channel === "externalUrl" || channel === "mailto") {
    metadata.openedAt = now.toISOString();
  }
  if (input.submittedAt) {
    metadata.submittedAt = input.submittedAt.toISOString();
  }

  return prisma.$transaction(async (tx) => {
    const comment = await tx.taskComment.create({
      data: {
        authorUserId: input.userId,
        kind: message ? TaskCommentKind.OUTBOUND_MESSAGE : TaskCommentKind.STATUS_UPDATE,
        message:
          message ??
          `Opened task communication endpoint${href ? `: ${href}` : "."}`,
        source,
        taskId: input.taskId,
      },
    });

    const communication = await tx.taskCommunication.create({
      data: {
        audience: TaskCommunicationAudience.ASSIGNEE,
        channel: toTaskCommunicationChannel(channel),
        direction: TaskCommunicationDirection.OUTBOUND,
        endpointId: input.endpointId ?? null,
        externalUrl: href,
        metadataJson: metadata as Prisma.InputJsonObject,
        purpose: TaskCommunicationPurpose.REMINDER,
        senderUserId: input.userId,
        sentAt: now,
        status: TaskCommunicationStatus.SENT,
        taskCommentId: comment.id,
        taskId: input.taskId,
      },
    });

    const activity = await tx.activity.create({
      data: {
        description: "Recorded task communication",
        entityId: input.taskId,
        entityType: "Task",
        metadata: JSON.stringify({
          channel,
          communicationId: communication.id,
          href,
          taskCommentId: comment.id,
        }),
        type: ActivityType.CONTACTED_ASSIGNEE,
        userId: input.userId,
      },
    });

    return { activity, comment, communication };
  });
}
