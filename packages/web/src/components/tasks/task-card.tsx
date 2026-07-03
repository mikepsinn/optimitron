import Link from "next/link";
import {
  TaskClaimPolicy,
  TaskStatus,
  type TaskCategory,
  type TaskDifficulty,
} from "@optimitron/db";
import { getPersonHref } from "@/lib/person-href";
import { getTaskDescriptionSummary } from "@/components/tasks/task-description";
import { TaskCommunicationActions } from "@/components/tasks/TaskCommunicationActions";
import { TaskShareButtons } from "@/components/tasks/TaskShareButtons";
import { TaskClaimButton } from "@/components/tasks/TaskClaimButton";
import { Avatar } from "@/components/retroui/Avatar";
import { ArcadeTag } from "@/components/ui/arcade-tag";
import { BrutalCard, type BrutalCardBgColor } from "@/components/ui/brutal-card";
import { getSignInPath, getTaskPath, ROUTES } from "@/lib/routes";
import {
  formatCompactCount,
  formatCompactCurrency,
  formatDelayDuration,
  getTaskDelayStats,
} from "@/lib/tasks/accountability";
import type {
  TaskImpactFrameSummary,
  TaskImpactMetricSummary,
} from "@/lib/tasks/impact";
import { canTaskAcceptMoreClaims } from "@/lib/tasks/rank-tasks";
import { buildTaskShareText } from "@/lib/tasks/accountability";

export interface TaskCardTask {
  activeClaimCount: number;
  assigneeAffiliationSnapshot: string | null;
  assigneeOrganization: {
    contactEmail?: string | null;
    id: string;
    name: string;
    slug: string;
    squareLogoUrl: string | null;
    type: string;
    website?: string | null;
  } | null;
  assigneePerson: {
    countryCode: string | null;
    currentAffiliation: string | null;
    displayName: string;
    handle?: string | null;
    id: string;
    image: string | null;
    isPublicFigure: boolean;
    sourceRef?: string | null;
  } | null;
  category: TaskCategory;
  claimPolicy: TaskClaimPolicy;
  completedAt: Date | string | null;
  contextJson?: unknown;
  primaryEndpoint?: {
    email?: string | null;
    instructions?: string | null;
    kind?: string | null;
    label?: string | null;
    url?: string | null;
  } | null;
  communicationEndpoints?: Array<{
    email?: string | null;
    id?: string | null;
    instructions?: string | null;
    isPrimary?: boolean | null;
    kind?: string | null;
    label?: string | null;
    priority?: number | null;
    url?: string | null;
  }> | null;
  description: string;
  difficulty: TaskDifficulty;
  dueAt: Date | string | null;
  estimatedEffortHours: number | null;
  id: string;
  impact?: {
    costPerDalyUsd?: number | null;
    selectedFrame?: TaskImpactFrameSummary | null;
    selectedMetrics?: Record<string, TaskImpactMetricSummary> | null;
  };
  currentImpactEstimateSet?: {
    assumptionsJson: unknown;
  } | null;
  interestTags: string[];
  isPublic: boolean;
  maxClaims: number | null;
  parentTask?: { id: string; title: string } | null;
  roleTitle: string | null;
  recommendationScore?: number;
  sortOrder?: number | null;
  sourceUrl: string | null;
  status: TaskStatus;
  taskKey?: string | null;
  title: string;
  skillTags: string[];
  verifiedAt: Date | string | null;
  viewerHasClaim: boolean;
}

function hasNegativeImpact(task: TaskCardTask) {
  const econ = task.impact?.selectedFrame?.expectedEconomicValueUsdBase;
  const dalys = task.impact?.selectedFrame?.expectedDalysAvertedBase;
  return (econ != null && econ < 0) || (dalys != null && dalys < 0);
}

function hasPositiveImpact(task: TaskCardTask) {
  const econ = task.impact?.selectedFrame?.expectedEconomicValueUsdBase;
  return econ != null && econ > 0;
}

function getCardColor(task: TaskCardTask): BrutalCardBgColor {
  if (task.status === TaskStatus.VERIFIED && hasNegativeImpact(task)) {
    return "red";
  }

  if (task.claimPolicy === TaskClaimPolicy.ASSIGNED_ONLY) {
    return "yellow";
  }

  if (task.status === TaskStatus.VERIFIED && hasPositiveImpact(task)) {
    return "green";
  }

  if (task.status === TaskStatus.VERIFIED) {
    return "yellow"; // unmeasured — neither green (earned) nor red (harmful)
  }

  if (task.viewerHasClaim) {
    return "cyan";
  }

  return "background";
}

function getTaskDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function formatDueDate(value: Date | string) {
  const date = getTaskDate(value);
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function HarmInflictedSection({ task }: { task: TaskCardTask }) {
  const econ = task.impact?.selectedFrame?.expectedEconomicValueUsdBase;
  const dalys = task.impact?.selectedFrame?.expectedDalysAvertedBase;

  return (
    <div className="space-y-1 border-t-2 border-foreground/20 pt-2">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-brutal-red">
        Harm Inflicted
      </p>
      {econ != null ? (
        <p>{`${formatCompactCurrency(Math.abs(econ))} economic damage`}</p>
      ) : null}
      {dalys != null ? (
        <p>{`${formatCompactCount(Math.abs(dalys))} DALYs caused`}</p>
      ) : null}
    </div>
  );
}

function UnmeasuredSpendingSection({ task }: { task: TaskCardTask }) {
  const cost = task.impact?.selectedFrame?.estimatedCashCostUsdBase;

  return (
    <div className="space-y-1 border-t-2 border-foreground/20 pt-2">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-background">
        Unmeasured Spending
      </p>
      {cost != null ? (
        <p>{`Cost: ${formatCompactCurrency(cost)}`}</p>
      ) : null}
      <p>Measured value: ???</p>
    </div>
  );
}

export function TaskCard({
  hideAssignee = false,
  showRecommendationScore = false,
  signedIn,
  task,
}: {
  /**
   * When true, suppress the avatar header, the inline "Assigned to X"
   * text, and the "Full Record" link. Used on the /tasks "Your Tasks"
   * section where every row is assigned to the viewer — both renderings
   * just say "you" and add nothing.
   */
  hideAssignee?: boolean;
  showRecommendationScore?: boolean;
  signedIn: boolean;
  task: TaskCardTask;
}) {
  const delayStats = getTaskDelayStats(task);
  const canClaim = canTaskAcceptMoreClaims({
    activeClaimCount: task.activeClaimCount,
    claimPolicy: task.claimPolicy,
    difficulty: task.difficulty,
    estimatedEffortHours: task.estimatedEffortHours,
    interestTags: task.interestTags,
    maxClaims: task.maxClaims,
    skillTags: task.skillTags,
    status: task.status,
  });
  const signInHref = getSignInPath(ROUTES.tasks);
  const targetLabel =
    task.assigneePerson?.displayName ?? task.assigneeOrganization?.name ?? task.title;
  const shareText = buildTaskShareText({
    currentDelayDays: delayStats.currentDelayDays,
    currentEconomicValueUsdLost: delayStats.currentEconomicValueUsdLost,
    currentHumanLivesLost: delayStats.currentHumanLivesLost,
    currentSufferingHoursLost: delayStats.currentSufferingHoursLost,
    targetLabel,
    taskTitle: task.title,
  });
  const fallbackInitials = targetLabel
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const dueDate = getTaskDate(task.dueAt);

  return (
    <BrutalCard bgColor={getCardColor(task)} className="h-full" hover padding="lg">
      <div className="flex h-full flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <ArcadeTag>{task.taskKey ?? task.id}</ArcadeTag>
          <ArcadeTag>{task.category.toLowerCase()}</ArcadeTag>
          <ArcadeTag>{task.difficulty.toLowerCase()}</ArcadeTag>
          <ArcadeTag>
            {task.claimPolicy === TaskClaimPolicy.ASSIGNED_ONLY
              ? "assigned"
              : task.claimPolicy === TaskClaimPolicy.OPEN_SINGLE
                ? "single-active"
                : "open-many"}
          </ArcadeTag>
          {dueDate ? (
            <ArcadeTag>
              {dueDate.getTime() < Date.now() ? "overdue" : `due ${formatDueDate(dueDate)}`}
            </ArcadeTag>
          ) : null}
          {task.estimatedEffortHours != null ? (
            <ArcadeTag>{`${task.estimatedEffortHours}h`}</ArcadeTag>
          ) : null}
          {showRecommendationScore && typeof task.recommendationScore === "number" ? (
            <ArcadeTag>{`fit ${Math.round(task.recommendationScore * 100)}`}</ArcadeTag>
          ) : null}
        </div>

        <div className="space-y-2">
          {!hideAssignee && (task.assigneePerson || task.assigneeOrganization) ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 border-4 border-foreground bg-muted">
                <Avatar.Image
                  alt={targetLabel}
                  src={task.assigneePerson?.image ?? task.assigneeOrganization?.squareLogoUrl ?? undefined}
                />
                <Avatar.Fallback className="bg-foreground font-black text-background">
                  {fallbackInitials || "?"}
                </Avatar.Fallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-foreground">
                  Assignee
                </p>
                <p className="truncate text-sm font-black uppercase">
                  {task.assigneePerson ? (
                    <Link
                      className="underline underline-offset-4"
                      href={getPersonHref(task.assigneePerson)}
                    >
                      {targetLabel}
                    </Link>
                  ) : (
                    targetLabel
                  )}
                </p>
              </div>
            </div>
          ) : null}
          {task.parentTask ? (
            <Link
              href={getTaskPath(task.parentTask.id)}
              className="inline-block text-xs font-black uppercase tracking-[0.18em] text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              ↑ {task.parentTask.title}
            </Link>
          ) : null}
          <Link href={getTaskPath(task.id)} className="block">
            <h3 className="text-2xl font-black uppercase leading-tight underline-offset-4 hover:underline">
              {task.title}
              {task.isPublic ? null : (
                <span
                  aria-label="Private task"
                  className="ml-2 text-base align-middle"
                  title="Private — visible only to you and assignees"
                >
                  🔒
                </span>
              )}
            </h3>
          </Link>
          <p className="text-sm font-bold leading-6">
            {getTaskDescriptionSummary(task.description, 220)}
          </p>
        </div>

        <div className="space-y-2 text-sm font-bold">
          {!hideAssignee && task.assigneePerson ? (
            <p>
              Assigned to{" "}
              <span className="underline underline-offset-4">
                {task.assigneePerson.displayName}
              </span>
              {task.roleTitle ? `, ${task.roleTitle}` : ""}
            </p>
          ) : null}
          {!hideAssignee && !task.assigneePerson && task.assigneeOrganization ? (
            <p>
              Assigned to{" "}
              <span className="underline underline-offset-4">
                {task.assigneeOrganization.name}
              </span>
              {task.roleTitle ? `, ${task.roleTitle}` : ""}
            </p>
          ) : null}
          {!hideAssignee &&
          (task.assigneeAffiliationSnapshot ||
            task.assigneePerson?.currentAffiliation) ? (
            <p>
              {task.assigneeAffiliationSnapshot ??
                task.assigneeOrganization?.name ??
                task.assigneePerson?.currentAffiliation}
            </p>
          ) : null}
          {task.skillTags.length > 0 ? (
            <p>{`Skills: ${task.skillTags.slice(0, 4).join(", ")}`}</p>
          ) : null}
          {task.interestTags.length > 0 ? (
            <p>{`Interests: ${task.interestTags.slice(0, 4).join(", ")}`}</p>
          ) : null}
          {task.status === TaskStatus.VERIFIED && hasNegativeImpact(task) ? (
            <HarmInflictedSection task={task} />
          ) : task.status === TaskStatus.VERIFIED && !hasNegativeImpact(task) && !hasPositiveImpact(task) ? (
            <UnmeasuredSpendingSection task={task} />
          ) : delayStats.isOverdue ? (
            <div className="space-y-1 border-t-2 border-foreground/20 pt-2">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brutal-red">
                Delay Clock
              </p>
              <p>{`${formatDelayDuration(delayStats.currentDelayDays)} overdue`}</p>
              <p>{`${formatCompactCurrency(delayStats.currentEconomicValueUsdLost)} lost so far`}</p>
              {delayStats.currentHumanLivesLost != null ? (
                <p>{`${formatCompactCount(delayStats.currentHumanLivesLost)} deaths from delay`}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-3">
          {task.status !== TaskStatus.VERIFIED &&
          !task.assigneeOrganization &&
          !task.assigneePerson ? (
            <TaskClaimButton
              canClaim={canClaim}
              signedIn={signedIn}
              signInHref={signInHref}
              taskId={task.id}
              viewerHasClaim={task.viewerHasClaim}
            />
          ) : null}
          <Link
            className="text-sm font-black uppercase underline underline-offset-4"
            href={getTaskPath(task.id)}
          >
            Details
          </Link>
          {!hideAssignee && task.assigneePerson ? (
            <Link
              className="text-sm font-black uppercase underline underline-offset-4"
              href={getPersonHref(task.assigneePerson)}
            >
              Full Record
            </Link>
          ) : null}
          {task.sourceUrl ? (
            <Link
              className="text-sm font-black uppercase underline underline-offset-4"
              href={task.sourceUrl}
              target="_blank"
            >
              Source
            </Link>
          ) : null}
          {task.claimPolicy === TaskClaimPolicy.ASSIGNED_ONLY ? (
            <Link
              className="text-sm font-black uppercase underline underline-offset-4"
              href="/governments"
            >
              Scorecard
            </Link>
          ) : null}
        </div>

        {task.status !== TaskStatus.VERIFIED && (task.assigneePerson || task.assigneeOrganization) ? (
          <TaskCommunicationActions
            compact
            delayStats={{
              currentDelayDays: delayStats.currentDelayDays,
              currentEconomicValueUsdLost: delayStats.currentEconomicValueUsdLost,
              currentHumanLivesLost: delayStats.currentHumanLivesLost,
              currentSufferingHoursLost: delayStats.currentSufferingHoursLost,
            }}
            task={task}
            taskId={task.id}
          />
        ) : null}

        {task.isPublic ? (
          <TaskShareButtons
            taskId={task.id}
            shareText={shareText}
            taskTitle={task.title}
          />
        ) : null}
      </div>
    </BrutalCard>
  );
}
