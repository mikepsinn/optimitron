import {
  TaskCategory,
  TaskClaimPolicy,
  TaskDifficulty,
  TaskStatus,
} from "@optimitron/db";
import type { Prisma, PrismaClient } from "@optimitron/db";
import { getReferralInvitationFirstName } from "@/lib/referral-invitation-copy";

const REFERRAL_INVITATION_TASK_KEY_PREFIX = "program:one-percent-treaty:referral-invitation";

type ReferralInvitationTaskClient = Pick<PrismaClient, "task">;

export function buildReferralInvitationTaskKey(inviteToken: string) {
  return `${REFERRAL_INVITATION_TASK_KEY_PREFIX}:${inviteToken}`;
}

export function buildReferralInvitationTaskTitle(recipientName: string) {
  const firstName = getReferralInvitationFirstName(recipientName) || recipientName;
  return `Invite ${firstName} to vote on the 1% Treaty`;
}

export function buildReferralInvitationTaskDescription(recipientName: string) {
  const firstName = getReferralInvitationFirstName(recipientName) || recipientName;
  return [
    `${firstName} was invited to vote on the 1% Treaty.`,
    "The task is complete when their verified vote converts the invitation.",
  ].join("\n\n");
}

export async function createReferralInvitationTask(
  client: ReferralInvitationTaskClient,
  input: {
    contactTemplate: string;
    contactUrl: string;
    inviteToken: string;
    ownerUserId: string;
    recipientName: string;
    recipientPersonId?: string | null;
    referendumSlug: string;
  },
) {
  const task = await client.task.create({
    data: {
      assigneeAffiliationSnapshot: input.recipientName,
      assigneePersonId: input.recipientPersonId ?? null,
      category: TaskCategory.OUTREACH,
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      contactLabel: "Complete treaty vote",
      contactTemplate: input.contactTemplate,
      contactUrl: input.contactUrl,
      contextJson: {
        inviteToken: input.inviteToken,
        kind: "referral_invitation",
        referendumSlug: input.referendumSlug,
      } satisfies Prisma.InputJsonObject,
      description: buildReferralInvitationTaskDescription(input.recipientName),
      difficulty: TaskDifficulty.TRIVIAL,
      estimatedEffortHours: 0.01,
      interestTags: ["one-percent-treaty", "war-on-disease"],
      isPublic: false,
      ownerUserId: input.ownerUserId,
      roleTitle: "Referred treaty voter",
      skillTags: ["voting"],
      status: TaskStatus.ACTIVE,
      taskKey: buildReferralInvitationTaskKey(input.inviteToken),
      title: buildReferralInvitationTaskTitle(input.recipientName),
    },
    select: { id: true },
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
) {
  await client.task.updateMany({
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
}
