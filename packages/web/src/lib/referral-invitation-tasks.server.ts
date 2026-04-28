import {
  TaskCategory,
  TaskClaimPolicy,
  TaskCommentKind,
  TaskCommentSource,
  TaskDifficulty,
  TaskStatus,
} from "@optimitron/db";
import type { Prisma, PrismaClient } from "@optimitron/db";
import { getReferralInvitationFirstName } from "@/lib/referral-invitation-copy";
import { upsertPrimaryTaskCommunicationEndpoint } from "@/lib/tasks/task-communication-endpoints.server";

const REFERRAL_INVITATION_TASK_KEY_PREFIX = "program:one-percent-treaty:referral-invitation";

type ReferralInvitationTaskClient =
  | Pick<PrismaClient, "task" | "taskComment" | "taskCommunicationEndpoint">
  | Pick<Prisma.TransactionClient, "task" | "taskComment" | "taskCommunicationEndpoint">;

export function buildReferralInvitationTaskKey(inviteToken: string) {
  return `${REFERRAL_INVITATION_TASK_KEY_PREFIX}:${inviteToken}`;
}

export function buildReferralInvitationTaskTitle(recipientName: string) {
  const firstName = getReferralInvitationFirstName(recipientName) || recipientName;
  return `${firstName}: vote on the 1% Treaty`;
}

export function buildReferralInvitationTaskDescription(recipientName: string) {
  const firstName = getReferralInvitationFirstName(recipientName) || recipientName;
  return [
    `${firstName} was invited to vote on the 1% Treaty.`,
    "The task is complete when their verified vote converts the invitation.",
  ].join("\n\n");
}

export function buildReferralInvitationTaskCompletionMessage(recipientName: string) {
  return `${recipientName} voted on the 1% Treaty. This referral task is now verified.`;
}

const REFERRAL_INVITATION_DUE_DAYS = 3;

export async function createReferralInvitationTask(
  client: ReferralInvitationTaskClient,
  input: {
    dueAt?: Date | null;
    endpoint: { instructions: string; url: string };
    inviteToken: string;
    now?: Date;
    ownerUserId: string;
    parentTaskId?: string | null;
    recipientName: string;
    recipientPersonId?: string | null;
    referendumSlug: string;
  },
) {
  const now = input.now ?? new Date();
  const dueAt =
    input.dueAt ??
    new Date(now.getTime() + REFERRAL_INVITATION_DUE_DAYS * 24 * 60 * 60 * 1000);

  const task = await client.task.create({
    data: {
      assigneeAffiliationSnapshot: input.recipientName,
      assigneePersonId: input.recipientPersonId ?? null,
      category: TaskCategory.OUTREACH,
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      contextJson: {
        inviteToken: input.inviteToken,
        kind: "referral_invitation",
        referendumSlug: input.referendumSlug,
      } satisfies Prisma.InputJsonObject,
      description: buildReferralInvitationTaskDescription(input.recipientName),
      difficulty: TaskDifficulty.TRIVIAL,
      dueAt,
      estimatedEffortHours: 0.01,
      interestTags: ["one-percent-treaty", "war-on-disease"],
      isPublic: false,
      ownerUserId: input.ownerUserId,
      parentTaskId: input.parentTaskId ?? null,
      roleTitle: "Referred treaty voter",
      skillTags: ["voting"],
      status: TaskStatus.ACTIVE,
      taskKey: buildReferralInvitationTaskKey(input.inviteToken),
      title: buildReferralInvitationTaskTitle(input.recipientName),
    },
    select: { id: true },
  });

  await upsertPrimaryTaskCommunicationEndpoint(client, task.id, {
    instructions: input.endpoint.instructions,
    label: "Complete treaty vote",
    url: input.endpoint.url,
  });

  return task.id;
}

export async function verifyReferralInvitationTask(
  client: ReferralInvitationTaskClient,
  input: {
    invitationId: string;
    recipientName: string;
    taskId: string;
    verifiedAt: Date;
    verifiedByUserId: string;
  },
): Promise<{ commentId: string | null; message: string | null; verified: boolean }> {
  const updated = await client.task.updateMany({
    where: {
      id: input.taskId,
      deletedAt: null,
      status: { not: TaskStatus.VERIFIED },
    },
    data: {
      actualEffortSeconds: 30,
      completedAt: input.verifiedAt,
      completionEvidence:
        `${input.recipientName} verified a vote through referral invitation ${input.invitationId}.`,
      status: TaskStatus.VERIFIED,
      verifiedAt: input.verifiedAt,
      verifiedByUserId: input.verifiedByUserId,
    },
  });

  if (updated.count === 0) {
    return { commentId: null, message: null, verified: false };
  }

  const message = buildReferralInvitationTaskCompletionMessage(input.recipientName);
  const comment = await client.taskComment.create({
    data: {
      authorUserId: input.verifiedByUserId,
      kind: TaskCommentKind.STATUS_UPDATE,
      message,
      source: TaskCommentSource.SYSTEM,
      taskId: input.taskId,
    },
    select: { id: true },
  });

  return { commentId: comment.id, message, verified: true };
}
