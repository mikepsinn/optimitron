import {
  TaskCommunicationAudience,
  TaskCommunicationChannel,
  TaskCommunicationPurpose,
} from "@optimitron/db/enums";
import type { Prisma } from "@optimitron/db";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { formatShareEmailFromHeader } from "@/lib/email/from-address";
import { getTaskEmailReplyInstruction } from "@/lib/email/task-notification";
import { buildTaskAssignmentNotificationEmail } from "@/lib/tasks/task-assignment-notification-email.server";
import {
  draftTaskNotification,
  sendDraftTaskNotification,
} from "@/lib/tasks/task-notifications.server";
import { getUserDisplayName, userDisplaySelect } from "@/lib/user-display";
import { buildUserReferralUrl } from "@/lib/url";

async function getRecipientReferralUrl(userId: string | null): Promise<string | null> {
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      referralCode: true,
      person: { select: { handle: true } },
    },
  });
  if (!user) return null;
  return buildUserReferralUrl({
    handle: user.person?.handle ?? null,
    referralCode: user.referralCode,
  });
}

const log = createLogger("task-assignment-notifications");

type AssignmentRecipient = {
  email: string;
  name: string;
  organizationId: string | null;
  personId: string | null;
  userId: string | null;
};

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null;
}

async function resolveSenderDisplayName(
  senderUserId: string | null | undefined,
): Promise<string | null> {
  if (!senderUserId) return null;
  const user = await prisma.user.findUnique({
    where: { id: senderUserId },
    select: userDisplaySelect,
  });
  if (!user) return null;
  const name = getUserDisplayName(user);
  return name === "Anonymous" ? null : name;
}

async function resolveAssignmentRecipient(taskId: string): Promise<{
  recipient: AssignmentRecipient;
  task: { description: string; id: string; title: string };
} | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      assigneeOrganization: {
        select: {
          contactEmail: true,
          id: true,
          members: {
            orderBy: { joinedAt: "asc" },
            select: {
              role: true,
              user: { select: { email: true, id: true } },
            },
            where: { role: { in: ["owner", "admin"] } },
          },
          name: true,
        },
      },
      assigneePerson: {
        select: {
          displayName: true,
          email: true,
          id: true,
          user: { select: { email: true, id: true } },
        },
      },
      deletedAt: true,
      description: true,
      id: true,
      title: true,
    },
  });

  if (!task || task.deletedAt) {
    return null;
  }

  if (task.assigneeOrganization) {
    const member = task.assigneeOrganization.members.find((candidate) =>
      Boolean(normalizeEmail(candidate.user.email)),
    );
    const email =
      normalizeEmail(task.assigneeOrganization.contactEmail) ??
      normalizeEmail(member?.user.email);

    if (!email) {
      return null;
    }

    return {
      recipient: {
        email,
        name: task.assigneeOrganization.name,
        organizationId: task.assigneeOrganization.id,
        personId: null,
        userId:
          normalizeEmail(member?.user.email) === email
            ? (member?.user.id ?? null)
            : null,
      },
      task,
    };
  }

  if (task.assigneePerson) {
    const email =
      normalizeEmail(task.assigneePerson.email) ??
      normalizeEmail(task.assigneePerson.user?.email);

    if (!email) {
      return null;
    }

    return {
      recipient: {
        email,
        name: task.assigneePerson.displayName,
        organizationId: null,
        personId: task.assigneePerson.id,
        userId:
          normalizeEmail(task.assigneePerson.user?.email) === email
            ? (task.assigneePerson.user?.id ?? null)
            : null,
      },
      task,
    };
  }

  return null;
}

export async function notifyTaskAssigneeOfAssignment(input: {
  senderUserId?: string | null;
  taskId: string;
}) {
  try {
    const resolved = await resolveAssignmentRecipient(input.taskId);
    if (!resolved) {
      return { reason: "no_assignee_email", status: "skipped" as const };
    }

    const { recipient, task } = resolved;
    const senderName = await resolveSenderDisplayName(input.senderUserId);
    const recipientReferralUrl = await getRecipientReferralUrl(recipient.userId);
    const email = buildTaskAssignmentNotificationEmail({
      description: task.description,
      id: task.id,
      recipientName: recipient.name,
      recipientReferralUrl,
      replyInstruction: getTaskEmailReplyInstruction(),
      title: task.title,
    });

    const draft = await draftTaskNotification({
      audience: TaskCommunicationAudience.ASSIGNEE,
      channel: TaskCommunicationChannel.EMAIL,
      dedupeKey: `task-assignment:${task.id}:${recipient.email}`,
      emailScope: "task_notifications",
      html: email.html,
      metadataJson: {
        notificationKind: "task_assignment",
      } satisfies Prisma.InputJsonObject,
      purpose: TaskCommunicationPurpose.ASSIGNMENT,
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      recipientOrganizationId: recipient.organizationId,
      recipientPersonId: recipient.personId,
      recipientUserId: recipient.userId,
      senderName,
      senderUserId: input.senderUserId ?? null,
      subject: email.subject,
      taskId: task.id,
      text: email.text,
    });

    return sendDraftTaskNotification({
      communicationId: draft.id,
      from: senderName ? formatShareEmailFromHeader(senderName) : null,
      senderUserId: input.senderUserId ?? null,
    });
  } catch (error) {
    log.error("Failed to send task assignment notification", {
      error,
      taskId: input.taskId,
    });
    return {
      reason: error instanceof Error ? error.message : String(error),
      status: "failed" as const,
    };
  }
}
