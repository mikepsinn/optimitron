import { DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT } from "@optimitron/data/parameters";
import {
  type TaskDelayStats,
  buildTaskShareText,
  formatCompactCount,
  formatCompactCurrency,
  formatDelayDuration,
} from "@/lib/tasks/accountability";
import { isPublicOfficialPerson } from "@/lib/public-officials";
import { readTreatySignerSlotContext } from "./task-context";
import { isTreatyParentTaskKey, isTreatySignerTaskKey } from "./task-keys";

interface ReviewAssigneeLike {
  displayName: string;
  isPublicFigure?: boolean | null;
  sourceRef?: string | null;
}

interface ReviewOrganizationLike {
  name: string;
}

interface ReviewTaskLike {
  assigneeOrganization?: ReviewOrganizationLike | null;
  assigneePerson?: ReviewAssigneeLike | null;
  childTasks?: unknown[] | null;
  currentImpactEstimateSet?: {
    assumptionsJson?: unknown;
  } | null;
  contextJson?: unknown;
  description?: string | null;
  dueAt?: Date | null;
  id?: string;
  impact?: {
    selectedFrame?: unknown;
    selectedMetrics?: Record<string, { baseValue: number | null }> | null;
  } | null;
  isPublic?: boolean;
  completedAt?: Date | null;
  parentTask?: {
    taskKey?: string | null;
    title?: string | null;
  } | null;
  taskKey?: string | null;
  title: string;
  status?: string | null;
  verifiedAt?: Date | null;
}

interface ReviewPersonLike {
  displayName: string;
  isPublicFigure: boolean;
  sourceRef?: string | null;
}

export interface EmployeeReviewMetric {
  detail?: string | null;
  label: string;
  tone?: "background" | "cyan" | "green" | "pink" | "red" | "yellow";
  value: string;
}

export interface EmployeeReviewCallout {
  description: string;
  href?: string;
  hrefLabel?: string;
  eyebrow: string;
  title: string;
}

export interface EmployeeReviewBannerModel {
  callout?: EmployeeReviewCallout | null;
  description: string;
  eyebrow: string;
  metrics: EmployeeReviewMetric[];
  title: string;
}

export interface TaskReviewUiModel {
  assigneeLabel: string;
  assignedBylinePrefix: string;
  blockerBanner: EmployeeReviewBannerModel | null;
  childSectionHeading: string;
  childSectionNavLabel: string;
  recordLinkLabel: string;
}

interface TreatySignerReviewContext {
  annualRedirectAmountUsd: number;
  decisionMakerLabel: string;
  governmentName: string;
  militaryBudgetUsd: number;
  snapshotYear: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readTreatySignerReviewContext(task: ReviewTaskLike): TreatySignerReviewContext | null {
  const slot = readTreatySignerSlotContext(task.contextJson);
  if (slot) {
    return slot;
  }

  const assumptions = task.currentImpactEstimateSet?.assumptionsJson;
  if (!isRecord(assumptions)) {
    return null;
  }

  if (
    typeof assumptions.annualRedirectAmountUsd !== "number" ||
    typeof assumptions.decisionMakerLabel !== "string" ||
    typeof assumptions.governmentName !== "string" ||
    typeof assumptions.militaryBudgetUsd !== "number"
  ) {
    return null;
  }

  return {
    annualRedirectAmountUsd: assumptions.annualRedirectAmountUsd,
    decisionMakerLabel: assumptions.decisionMakerLabel,
    governmentName: assumptions.governmentName,
    militaryBudgetUsd: assumptions.militaryBudgetUsd,
    snapshotYear: 2024,
  };
}

export function buildTaskPressureShareText(
  task: ReviewTaskLike,
  delayStats: Pick<
    TaskDelayStats,
    "currentDelayDays" | "currentEconomicValueUsdLost" | "currentHumanLivesLost" | "currentSufferingHoursLost"
  >,
) {
  const slot = readTreatySignerReviewContext(task);
  if (!isTreatySignerTask(task)) {
    const targetLabel =
      task.assigneePerson?.displayName ?? task.assigneeOrganization?.name ?? task.title;

    return buildTaskShareText({
      currentDelayDays: delayStats.currentDelayDays,
      currentEconomicValueUsdLost: delayStats.currentEconomicValueUsdLost,
      currentHumanLivesLost: delayStats.currentHumanLivesLost,
      currentSufferingHoursLost: delayStats.currentSufferingHoursLost,
      targetLabel,
      taskTitle: task.title,
    });
  }

  const employeeLabel = task.assigneePerson?.displayName ?? slot?.decisionMakerLabel ?? "this employee";
  const delayLabel =
    delayStats.currentDelayDays > 0
      ? `${formatDelayDuration(delayStats.currentDelayDays)} overdue`
      : "still unresolved";
  const lives = formatCompactCount(delayStats.currentHumanLivesLost);
  const opening = slot
    ? `We pay ${slot.governmentName} to promote general welfare, not sit on ${formatCompactCurrency(slot.militaryBudgetUsd)} of military spending while disease keeps killing people.`
    : "We pay governments to promote general welfare, not piss public money away on weapons while disease keeps killing people.";
  const close = slot
    ? `One signature redirects ${formatCompactCurrency(slot.annualRedirectAmountUsd)} per year into pragmatic clinical trials.`
    : null;

  return [
    opening,
    `Tell your employee ${employeeLabel} to take 30 seconds to sign the 1% Treaty.`,
    `This blocking task is ${delayLabel} and has already locked in ${lives} deaths by delaying disease eradication.`,
    close,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" ");
}

export function getTaskPressurePrompt(
  task: ReviewTaskLike,
  delayStats: Pick<TaskDelayStats, "currentDelayDays">,
) {
  const slot = readTreatySignerReviewContext(task);
  if (!isTreatySignerTask(task)) {
    return null;
  }

  const delayLabel =
    delayStats.currentDelayDays > 0
      ? `${formatDelayDuration(delayStats.currentDelayDays)} overdue`
      : "still sitting open";

  if (!slot) {
    return `Tell your employee to take 30 seconds to sign. ${delayLabel}.`;
  }

  return `Tell your employee to take 30 seconds to sign and redirect ${formatCompactCurrency(slot.annualRedirectAmountUsd)} per year. ${delayLabel}.`;
}

function isTreatyParentTask(task: ReviewTaskLike) {
  return isTreatyParentTaskKey(task.taskKey);
}

function isTreatySignerTask(task: ReviewTaskLike) {
  return (
    isTreatySignerTaskKey(task.taskKey) ||
    readTreatySignerReviewContext(task) != null
  );
}

function buildTreatyMetrics(task: ReviewTaskLike): EmployeeReviewMetric[] {
  const slot = readTreatySignerReviewContext(task);
  if (!slot) {
    return [];
  }

  const patientsFundablePerYear = Math.round(
    slot.annualRedirectAmountUsd / DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT.value,
  );

  return [
    {
      detail: `${slot.snapshotYear} military budget under this office`,
      label: "Budget Controlled",
      tone: "red",
      value: formatCompactCurrency(slot.militaryBudgetUsd),
    },
    {
      detail: "Annual money left on the table until this is signed",
      label: "Better Use Right Now",
      tone: "green",
      value: formatCompactCurrency(slot.annualRedirectAmountUsd),
    },
    {
      detail: `Per year at ${formatCompactCurrency(DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT.value)} per patient`,
      label: "Trial Capacity",
      tone: "cyan",
      value: formatCompactCount(patientsFundablePerYear),
    },
  ];
}

export function isPublicOfficialTask(task: ReviewTaskLike) {
  return (
    isTreatySignerTask(task) ||
    isPublicOfficialPerson(task.assigneePerson)
  );
}

export function getTaskReviewUi(task: ReviewTaskLike): TaskReviewUiModel {
  const officialTask = isPublicOfficialTask(task);
  const treatyMetrics = buildTreatyMetrics(task);
  const slot = readTreatySignerReviewContext(task);
  const blockerBanner =
    isTreatySignerTask(task)
      ? {
          callout: {
            description:
              "Tell your employee to take 30 seconds to sign. Every extra day keeps the money in weapons while disease kills people.",
            eyebrow: "Blocking Task",
            title: task.title,
          },
          description: slot
            ? `You are paying ${slot.governmentName} to promote the general welfare. Instead, ${task.assigneePerson?.displayName ?? slot.decisionMakerLabel} is still sitting on ${formatCompactCurrency(slot.militaryBudgetUsd)} of military spending while refusing to finish a 30-second task that would redirect ${formatCompactCurrency(slot.annualRedirectAmountUsd)} per year into pragmatic clinical trials.`
            : `You are paying this office to promote the general welfare. Instead, ${task.assigneePerson?.displayName ?? "this employee"} is still refusing to finish a 30-second signature task while disease keeps killing people.`,
          eyebrow: "Employee Performance Review",
          metrics: treatyMetrics,
          title: "Promote the general welfare.",
        }
      : null;

  return {
    assigneeLabel: officialTask ? "Employee" : "Assignee",
    assignedBylinePrefix: officialTask ? "Your employee" : "Assigned to",
    blockerBanner,
    childSectionHeading: isTreatyParentTask(task)
      ? "Outstanding Employee Blockers"
      : "Subtasks",
    childSectionNavLabel: isTreatyParentTask(task) ? "Blockers" : "Subtasks",
    recordLinkLabel: officialTask ? "Employee Review" : "Full Record",
  };
}

export function buildPublicOfficialPersonReview(input: {
  openTasks: ReviewTaskLike[];
  person: ReviewPersonLike;
}): EmployeeReviewBannerModel | null {
  const blockerTask = input.openTasks[0] ?? null;
  const slot = blockerTask ? readTreatySignerReviewContext(blockerTask) : null;

  if (!slot && !isPublicOfficialPerson(input.person)) {
    return null;
  }
  const metrics = blockerTask && slot ? buildTreatyMetrics(blockerTask) : [];

  return {
    callout: blockerTask
      ? {
          description: slot
            ? `${formatCompactCurrency(slot.annualRedirectAmountUsd)} per year is still being burned on military spending until this employee finishes the task.`
            : "This task is still open and still blocking better outcomes.",
          eyebrow: "Current Blocking Task",
          href: blockerTask.id ? `/tasks/${blockerTask.id}` : undefined,
          hrefLabel: "Open Task",
          title: blockerTask.title,
        }
      : null,
    description: slot
      ? `You are paying this office to promote the general welfare. Instead, ${input.person.displayName} is still sitting on ${formatCompactCurrency(slot.militaryBudgetUsd)} in annual military spending while a 30-second signature could redirect ${formatCompactCurrency(slot.annualRedirectAmountUsd)} per year into pragmatic clinical trials.`
      : `You are paying this employee to improve public welfare. This page tracks the work they still have not finished.`,
    eyebrow: "Employee Performance Review",
    metrics,
    title: "Promote the general welfare.",
  };
}
