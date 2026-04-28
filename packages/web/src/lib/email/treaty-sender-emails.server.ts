import {
  ReferralInvitationStatus,
  TaskCommunicationAudience,
  TaskCommunicationChannel,
  TaskCommunicationPurpose,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { ROUTES } from "@/lib/routes";
import {
  buildTreatyRecipientVotedEmail,
  buildTreatyVoteConfirmedEmail,
} from "@/lib/email/treaty-sender-email-sequence";
import { sendTaskNotification } from "@/lib/tasks/task-notifications.server";
import { ensureUserTreatyTask } from "@/lib/tasks/user-treaty-task.server";
import { FLOW_VOTER_LIVES_SAVED_ROUNDED } from "@/lib/treaty-share-flow-parameters";
import { getBaseUrl } from "@/lib/url";

type TreatySenderEmailStatus =
  | "duplicate"
  | "missing_email"
  | "missing_task"
  | "not_found"
  | "sent"
  | "skipped";

interface TreatySenderEmailResult {
  status: TreatySenderEmailStatus;
}

function absoluteUrl(path: string) {
  return new URL(path, getBaseUrl()).toString();
}

function formatLivesScore(invitationCount: number) {
  const value = invitationCount * FLOW_VOTER_LIVES_SAVED_ROUNDED.value;
  if (value === 0) return "0";
  return Number(value.toPrecision(3)).toLocaleString("en-US");
}

function toResultStatus(
  status: string,
): TreatySenderEmailStatus {
  if (status === "sent") return "sent";
  if (status === "duplicate") return "duplicate";
  return "skipped";
}

export async function sendTreatyVoteConfirmedEmailForUser(input: {
  referendumId: string;
  userId: string;
  now?: Date;
}): Promise<TreatySenderEmailResult> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true, id: true, personId: true },
  });

  if (!user) return { status: "not_found" };
  if (!user.email) return { status: "missing_email" };

  const treatyTask = await ensureUserTreatyTask({
    personId: user.personId,
    userId: user.id,
  });
  const taskId = treatyTask.taskId;

  const dashboardUrl = absoluteUrl(ROUTES.dashboard);
  const email = buildTreatyVoteConfirmedEmail({ dashboardUrl });

  const result = await sendTaskNotification({
    audience: TaskCommunicationAudience.ASSIGNEE,
    channel: TaskCommunicationChannel.EMAIL,
    dedupeKey: `treaty_vote_confirmed:${input.referendumId}:${user.id}`,
    emailScope: "task_notifications",
    html: email.html,
    now: input.now,
    purpose: TaskCommunicationPurpose.VOTE_CONFIRMED,
    recipientEmail: user.email,
    recipientUserId: user.id,
    skipUserSuppressionCheck: true,
    subject: email.subject,
    taskId,
    text: email.text,
  });

  return { status: toResultStatus(result.status) };
}

export async function sendTreatyRecipientVotedEmailForInvitation(input: {
  invitationId: string;
  now?: Date;
}): Promise<TreatySenderEmailResult> {
  const invitation = await prisma.referralInvitation.findUnique({
    where: { id: input.invitationId },
    select: {
      id: true,
      messageFormat: true,
      recipientName: true,
      referrerUserId: true,
      referrer: {
        select: {
          email: true,
          id: true,
        },
      },
      taskId: true,
    },
  });

  if (!invitation) return { status: "not_found" };
  if (!invitation.referrer.email) return { status: "missing_email" };
  if (!invitation.taskId) return { status: "missing_task" };

  const [confirmedCount, pendingCount] = await prisma.$transaction([
    prisma.referralInvitation.count({
      where: {
        convertedAt: { not: null },
        deletedAt: null,
        referrerUserId: invitation.referrerUserId,
      },
    }),
    prisma.referralInvitation.count({
      where: {
        convertedAt: null,
        deletedAt: null,
        referrerUserId: invitation.referrerUserId,
        status: {
          in: [
            ReferralInvitationStatus.PENDING,
            ReferralInvitationStatus.COPIED,
            ReferralInvitationStatus.SENT,
          ],
        },
      },
    }),
  ]);

  const dashboardUrl = absoluteUrl(ROUTES.dashboard);
  const email = buildTreatyRecipientVotedEmail({
    confirmedLives: formatLivesScore(confirmedCount),
    dashboardUrl,
    messageFormat: invitation.messageFormat,
    pendingLives: formatLivesScore(pendingCount),
    recipientName: invitation.recipientName,
  });

  const result = await sendTaskNotification({
    audience: TaskCommunicationAudience.SENDER,
    channel: TaskCommunicationChannel.EMAIL,
    dedupeKey: `treaty_recipient_voted:${invitation.id}`,
    emailScope: "task_notifications",
    html: email.html,
    now: input.now,
    purpose: TaskCommunicationPurpose.RECIPIENT_VOTED,
    recipientEmail: invitation.referrer.email,
    recipientUserId: invitation.referrer.id,
    referralInvitationId: invitation.id,
    skipUserSuppressionCheck: true,
    subject: email.subject,
    taskId: invitation.taskId,
    text: email.text,
  });

  return { status: toResultStatus(result.status) };
}
