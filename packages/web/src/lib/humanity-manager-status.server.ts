import {
  ReferralInvitationStatus,
  TaskStatus,
} from "@optimitron/db";
import type { Prisma } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import {
  type HumanityManagerStatusInput,
  type HumanityManagerStatusLeader,
  type HumanityManagerStatusPerson,
  type HumanityManagerStatusReminder,
} from "@/lib/humanity-manager-status-content";
import {
  buildTaskShareTokens,
  getTaskDelayStats,
} from "@/lib/tasks/accountability";
import { getTreatyLevelCostOfDelay } from "@/lib/tasks/delay-attribution";
import {
  getShareTemplate,
  getUsableShareTemplates,
  pickDefaultShareTemplateId,
  type ShareRecipientMode,
} from "@/lib/tasks/share-templates";
import { renderTemplate } from "@/lib/tasks/render-template";
import { TREATY_SIGNER_TASK_KEY_PREFIX } from "@/lib/tasks/task-keys";
import {
  getAssigneeGovernmentBudgetUsd,
  getAssigneeMilitaryBudgetUsd,
  getAssigneeMilitaryToClinicalTrialsRatio,
  getAssigneeTwitterHandle,
} from "@/lib/tasks/task-context";
import { getHandleOrReferralCode } from "@/lib/referral.client";
import { buildTaskUrl, buildUserInviteReferralUrl } from "@/lib/url";

const STATUS_SAMPLE_LIMIT = 8;
const DAY_MS = 1000 * 60 * 60 * 24;

const PENDING_INVITATION_STATUSES: ReferralInvitationStatus[] = [
  ReferralInvitationStatus.PENDING,
  ReferralInvitationStatus.COPIED,
  ReferralInvitationStatus.SENT,
];

interface StatusUser {
  downstreamConversionCount?: number | null;
  handle?: string | null;
  referralCode?: string | null;
}

function clampNumber(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.floor(value);
}

function daysBetween(now: Date, value: Date | string | null | undefined): number {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.ceil((now.getTime() - date.getTime()) / DAY_MS));
}

function formatCompletedInvitation(
  invitation: {
    convertedAt: Date | string | null;
    convertedVote?: {
      createdAt: Date | string;
      person?: { displayName: string | null } | null;
      user?: { person?: { displayName: string | null } | null } | null;
    } | null;
    recipientName: string;
  },
): HumanityManagerStatusPerson {
  return {
    completedAt: invitation.convertedAt ?? invitation.convertedVote?.createdAt ?? null,
    displayName:
      invitation.convertedVote?.person?.displayName?.trim() ||
      invitation.convertedVote?.user?.person?.displayName?.trim() ||
      invitation.recipientName.trim() ||
      "Employee",
  };
}

function pickRenderedReminder(input: {
  mode: ShareRecipientMode;
  tokens: Record<string, string>;
}): string | null {
  const templates = getUsableShareTemplates(input.tokens, input.mode);
  const templateId = pickDefaultShareTemplateId(templates, input.mode);
  const template =
    templates.find((candidate) => candidate.id === templateId) ??
    (templateId ? getShareTemplate(templateId) : undefined) ??
    templates[0];

  if (!template) return null;
  return renderTemplate(template.body, input.tokens);
}

function buildEmployeeReminder(input: {
  baseUrl: string;
  invitation: {
    createdAt?: Date | string | null;
    id: string;
    inviteToken: string;
    recipientName: string;
  };
  now: Date;
  user: StatusUser;
}): HumanityManagerStatusReminder | null {
  const targetLabel = input.invitation.recipientName.trim() || "there";
  const currentDelayDays = daysBetween(input.now, input.invitation.createdAt);
  const delay = getTreatyLevelCostOfDelay(currentDelayDays);
  const treatyUrl = buildUserInviteReferralUrl(
    {
      handle: input.user.handle,
      referralCode: input.user.referralCode,
    },
    input.invitation.inviteToken,
    input.baseUrl,
  );
  const tokens = buildTaskShareTokens({
    citizenName: "A citizen",
    currentDelayDays,
    currentEconomicValueUsdLost: delay?.wastedUsd ?? null,
    currentHumanLivesLost: delay?.deathsFromDelay ?? null,
    currentSufferingHoursLost: null,
    now: input.now,
    targetLabel,
    taskTitle: "Vote on the 1% Treaty",
    treatyUrl,
  });
  const message = pickRenderedReminder({ mode: "one_human", tokens });
  if (!message) return null;

  return {
    id: `employee-${input.invitation.id}`,
    label: targetLabel,
    message,
    recipientMode: "one_human",
    title: "Employee reminder",
  };
}

function buildPresidentReminder(input: {
  baseUrl: string;
  now: Date;
  task: {
    assigneePerson: {
      countryCode: string | null;
      displayName: string;
      handle?: string | null;
    } | null;
    contextJson: Prisma.JsonValue | null;
    dueAt: Date | string | null;
    id: string;
    title: string;
  };
  user: StatusUser;
}): HumanityManagerStatusReminder | null {
  const targetLabel =
    input.task.assigneePerson?.displayName?.trim() || input.task.title;
  const delayStats = getTaskDelayStats({ dueAt: input.task.dueAt });
  const referralId = getHandleOrReferralCode(input.user);
  const treatyUrl = buildTaskUrl(input.task.id, input.baseUrl, referralId);
  const tokens = buildTaskShareTokens({
    countryCode: input.task.assigneePerson?.countryCode ?? null,
    currentDelayDays: delayStats.currentDelayDays,
    currentEconomicValueUsdLost: delayStats.currentEconomicValueUsdLost,
    currentHumanLivesLost: delayStats.currentHumanLivesLost,
    currentSufferingHoursLost: delayStats.currentSufferingHoursLost,
    governmentBudgetUsdPerYear: getAssigneeGovernmentBudgetUsd(
      input.task.contextJson,
    ),
    leaderHandle:
      getAssigneeTwitterHandle(input.task.contextJson) ??
      input.task.assigneePerson?.handle ??
      null,
    militaryBudgetUsdPerYear: getAssigneeMilitaryBudgetUsd(
      input.task.contextJson,
    ),
    militaryToClinicalTrialsRatio: getAssigneeMilitaryToClinicalTrialsRatio(
      input.task.contextJson,
    ),
    now: input.now,
    targetLabel,
    taskTitle: input.task.title,
    treatyUrl,
  });
  const message = pickRenderedReminder({ mode: "leader", tokens });
  if (!message) return null;

  return {
    id: `president-${input.task.id}`,
    label: targetLabel,
    message,
    recipientMode: "leader",
    title: "President reminder",
  };
}

export async function loadHumanityManagerStatus(input: {
  baseUrl: string;
  now?: Date;
  user: StatusUser;
  userId: string;
}): Promise<HumanityManagerStatusInput> {
  const now = input.now ?? new Date();
  const convertedInvitationWhere = {
    deletedAt: null,
    referrerUserId: input.userId,
    status: ReferralInvitationStatus.CONVERTED,
    convertedVote: { is: { deletedAt: null } },
  } satisfies Prisma.ReferralInvitationWhereInput;
  const overdueInvitationWhere = {
    deletedAt: null,
    referrerUserId: input.userId,
    status: { in: PENDING_INVITATION_STATUSES },
  } satisfies Prisma.ReferralInvitationWhereInput;
  const overduePresidentWhere = {
    assigneePersonId: { not: null },
    deletedAt: null,
    dueAt: { lt: now },
    status: { not: TaskStatus.VERIFIED },
    taskKey: { startsWith: `${TREATY_SIGNER_TASK_KEY_PREFIX}:` },
  } satisfies Prisma.TaskWhereInput;

  const [
    directConversionCount,
    convertedInvitations,
    overdueEmployeeCount,
    overdueEmployees,
    overduePresidentCount,
    overduePresidentTasks,
  ] = await Promise.all([
    prisma.referralInvitation.count({ where: convertedInvitationWhere }),
    prisma.referralInvitation.findMany({
      orderBy: [{ convertedAt: "desc" }, { createdAt: "desc" }],
      select: {
        convertedAt: true,
        convertedVote: {
          select: {
            createdAt: true,
            person: { select: { displayName: true } },
            user: {
              select: {
                person: { select: { displayName: true } },
              },
            },
          },
        },
        recipientName: true,
      },
      take: STATUS_SAMPLE_LIMIT,
      where: convertedInvitationWhere,
    }),
    prisma.referralInvitation.count({ where: overdueInvitationWhere }),
    prisma.referralInvitation.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        createdAt: true,
        id: true,
        inviteToken: true,
        recipientName: true,
      },
      take: STATUS_SAMPLE_LIMIT,
      where: overdueInvitationWhere,
    }),
    prisma.task.count({ where: overduePresidentWhere }),
    prisma.task.findMany({
      orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
      select: {
        assigneeAffiliationSnapshot: true,
        assigneePerson: {
          select: {
            countryCode: true,
            currentAffiliation: true,
            displayName: true,
            handle: true,
          },
        },
        contextJson: true,
        dueAt: true,
        id: true,
        title: true,
      },
      take: STATUS_SAMPLE_LIMIT,
      where: overduePresidentWhere,
    }),
  ]);

  const employeeReminders = overdueEmployees
    .map((invitation) =>
      buildEmployeeReminder({
        baseUrl: input.baseUrl,
        invitation,
        now,
        user: input.user,
      }),
    )
    .filter((reminder): reminder is HumanityManagerStatusReminder => reminder != null)
    .slice(0, 3);

  const presidentReminders = overduePresidentTasks
    .map((task) =>
      buildPresidentReminder({
        baseUrl: input.baseUrl,
        now,
        task,
        user: input.user,
      }),
    )
    .filter((reminder): reminder is HumanityManagerStatusReminder => reminder != null)
    .slice(0, 3);

  return {
    completedEmployees: convertedInvitations.map(formatCompletedInvitation),
    directConversionCount,
    downstreamConversionCount: clampNumber(input.user.downstreamConversionCount),
    overdueEmployeeCount,
    overdueEmployees: overdueEmployees.map((invitation) => ({
      displayName: invitation.recipientName,
    })),
    overduePresidentCount,
    overduePresidents: overduePresidentTasks.map(
      (task): HumanityManagerStatusLeader => ({
        countryLabel:
          task.assigneePerson?.currentAffiliation ||
          task.assigneeAffiliationSnapshot ||
          null,
        displayName: task.assigneePerson?.displayName || "President",
      }),
    ),
    reminders: [...employeeReminders, ...presidentReminders],
  };
}
