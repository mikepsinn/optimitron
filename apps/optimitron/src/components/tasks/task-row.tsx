import Link from "next/link";
import { Avatar } from "@/components/retroui/Avatar";
import {
  buildTaskShareText,
  buildTaskShareTokens,
  formatCompactCount,
  formatCompactCurrency,
  formatDelayDuration,
  getTaskDelayStats,
} from "@/lib/tasks/accountability";
import {
  DAILY_DISEASE_COST_USD,
  DAILY_DISEASE_DEATHS,
  GLOBAL_MILITARY_USD,
  getSignerDelayAttribution,
} from "@/lib/tasks/delay-attribution";
import {
  getAssigneeGovernmentBudgetUsd,
  getAssigneeMilitaryBudgetUsd,
  getAssigneeMilitaryToClinicalTrialsRatio,
  getAssigneeTwitterHandle,
} from "@/lib/tasks/task-context";
import { getPersonHref } from "@/lib/person-href";
import { getTaskPath } from "@/lib/routes";
import type { TaskCardTask } from "./task-card";
import { getTaskAssigneeLabels } from "@/lib/tasks/assignee-label";
import { TaskRowShare } from "./task-row-share";
import { DeathCounter } from "./death-counter";
import { LiveCounter } from "./live-counter";

// Small lock beside private-task titles. Private tasks only appear in lists
// for their creator or assignee, so the lock marks "only you can see this."
function PrivateTaskLock({ isPublic }: { isPublic: boolean }) {
  if (isPublic) return null;
  return (
    <span
      aria-label="Private task"
      className="ml-1"
      title="Private — visible only to you and assignees"
    >
      🔒
    </span>
  );
}

export type TaskSortKey =
  | "recommendation"
  | "title"
  | "assignee"
  | "status"
  | "deathsLockedIn"
  | "cost"
  | "time"
  | "assigneeBudget"
  | "impactLives"
  | "impactMoney"
  | "verifiedAt";

/** Healthy life-years lost per averted death (child-skewed global average). */
export const YEARS_PER_AVERTED_DEATH = 40;

/** Format the taxpayer money wasted by delay as a display string. */
function formatMoneyWasted(value: number | null | undefined): string {
  if (value == null || value <= 0) return "—";
  return formatCompactCurrency(value);
}

/** Extract the best Twitter/X handle for a task assignee, or the platform handle. */
function getLeaderHandle(task: TaskCardTask): string | null {
  return (
    getAssigneeTwitterHandle(task.contextJson) ??
    task.assigneePerson?.handle ??
    null
  );
}

/** True when a task is assigned to the "Humanity" org — i.e. "you". */

/** Format an estimated effort duration. Sub-minute → seconds, sub-hour → minutes, else hours. */
function formatDuration(hours: number | null | undefined): string {
  if (hours == null || hours <= 0) return "—";
  const seconds = hours * 3600;
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (hours < 24) return `${hours.toFixed(hours < 10 ? 1 : 0)}h`;
  return `${Math.round(hours / 24)}d`;
}

function getTaskDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function getTaskDateMs(value: Date | string | null | undefined): number | null {
  return getTaskDate(value)?.getTime() ?? null;
}

function formatDueDate(value: Date | string) {
  const date = getTaskDate(value);
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

function ImpactCell({
  value,
  href,
  className,
}: {
  value: string;
  href: string | null;
  className?: string;
}) {
  const base = `${className ?? ""} shrink-0 text-right text-xs font-bold text-muted-foreground`;
  if (href && value !== "—") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} underline underline-offset-4 hover:text-foreground`}
      >
        {value}
      </a>
    );
  }
  return <span className={base}>{value}</span>;
}

function StatusBadge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "overdue" | "done";
}) {
  const colors = {
    default: "bg-muted text-muted-foreground",
    overdue: "bg-brutal-red text-brutal-red-foreground",
    done: "bg-brutal-green text-brutal-green-foreground",
  };
  return (
    <span
      className={`inline-block rounded-sm border-2 border-foreground px-2 py-0.5 text-xs font-bold ${colors[variant]}`}
    >
      {children}
    </span>
  );
}

function getLeftBorderColor(task: TaskCardTask): string {
  const econ = task.impact?.selectedFrame?.expectedEconomicValueUsdBase;
  const dalys = task.impact?.selectedFrame?.expectedDalysAvertedBase;
  const hasNegative =
    (econ != null && econ < 0) || (dalys != null && dalys < 0);
  const hasPositive =
    (econ != null && econ > 0) || (dalys != null && dalys > 0);

  if (task.status === "VERIFIED" && hasNegative) return "border-l-brutal-red";
  if (task.status === "VERIFIED" && hasPositive) return "border-l-brutal-green";
  if (task.claimPolicy === "ASSIGNED_ONLY") return "border-l-background";
  if (task.viewerHasClaim) return "border-l-background";
  return "border-l-muted";
}

function formatCompletedDate(value: Date | string | null | undefined): string {
  const date = getTaskDate(value);
  if (!date) return "—";
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function impactSignClass(value: number | null | undefined): string {
  if (value == null) return "text-muted-foreground";
  if (value < 0) return "text-brutal-red";
  if (value > 0) return "text-brutal-green";
  return "text-muted-foreground";
}

const SORT_LABELS: Record<TaskSortKey, string> = {
  recommendation: "Expected Value / Hour",
  title: "Task",
  assignee: "Assignee",
  status: "Status",
  deathsLockedIn: "Deaths From Delay",
  cost: "Wasted By Delay",
  time: "Time",
  assigneeBudget: "Military Budget",
  impactLives: "Lives Saved",
  impactMoney: "$ Saved",
  verifiedAt: "Completed",
};

export type TaskListVariant = "default" | "signer" | "completed";

export function TaskTableHeader({
  sortKey,
  sortDir,
  onSort,
  variant = "default",
  hideAssignee = false,
}: {
  sortKey?: TaskSortKey;
  sortDir?: "asc" | "desc";
  onSort?: (key: TaskSortKey) => void;
  variant?: TaskListVariant;
  hideAssignee?: boolean;
}) {
  function headerCell(key: TaskSortKey, className: string) {
    const isActive = sortKey === key;
    const arrow = isActive ? (sortDir === "asc" ? " \u2191" : " \u2193") : "";
    return (
      <span
        className={`${className} ${onSort ? "cursor-pointer select-none hover:text-foreground" : ""}`}
        onClick={onSort ? () => onSort(key) : undefined}
      >
        {SORT_LABELS[key]}
        {arrow}
      </span>
    );
  }

  const hdr = "text-xs font-bold uppercase tracking-wide text-muted-foreground";

  if (variant === "signer") {
    // Dense signer leaderboard: photo · assignee · task · 💀 deaths · 💸 wasted · time · remind · details
    // Desktop-only header (>= lg). Mobile uses the packed caption inside each row.
    function signerHeaderCell(
      key: TaskSortKey,
      emoji: string,
      className: string,
    ) {
      const isActive = sortKey === key;
      const arrow = isActive ? (sortDir === "asc" ? " \u2191" : " \u2193") : "";
      return (
        <span
          className={`${className} ${onSort ? "cursor-pointer select-none hover:text-foreground" : ""}`}
          onClick={onSort ? () => onSort(key) : undefined}
        >
          {emoji} {SORT_LABELS[key]}
          {arrow}
        </span>
      );
    }
    return (
      <div className="hidden items-center gap-3 border-b-2 border-foreground bg-muted/30 px-4 py-2 lg:flex">
        {hideAssignee ? null : <span className="h-14 w-14 shrink-0" />}
        {hideAssignee ? null : headerCell("assignee", `w-56 shrink-0 ${hdr}`)}
        {headerCell("title", `min-w-0 flex-[1.2] ${hdr}`)}
        {signerHeaderCell(
          "deathsLockedIn",
          "💀",
          `w-40 shrink-0 text-right ${hdr}`,
        )}
        {signerHeaderCell("cost", "💸", `w-44 shrink-0 text-right ${hdr}`)}
        {signerHeaderCell("time", "⏱", `w-20 shrink-0 text-right ${hdr}`)}
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Remind
        </span>
        <span className="w-7 shrink-0" />
      </div>
    );
  }

  if (variant === "completed") {
    // Completed leaderboard: photo · assignee · task · 💀 lives saved · 💸 $ saved · completed date
    function completedHeaderCell(
      key: TaskSortKey,
      emoji: string,
      className: string,
    ) {
      const isActive = sortKey === key;
      const arrow = isActive ? (sortDir === "asc" ? " \u2191" : " \u2193") : "";
      return (
        <span
          className={`${className} ${onSort ? "cursor-pointer select-none hover:text-foreground" : ""}`}
          onClick={onSort ? () => onSort(key) : undefined}
        >
          {emoji} {SORT_LABELS[key]}
          {arrow}
        </span>
      );
    }
    return (
      <div className="hidden items-center gap-3 border-b-2 border-foreground bg-muted/30 px-4 py-2 lg:flex">
        {hideAssignee ? null : <span className="h-14 w-14 shrink-0" />}
        {hideAssignee ? null : headerCell("assignee", `w-56 shrink-0 ${hdr}`)}
        {headerCell("title", `min-w-0 flex-[1.2] ${hdr}`)}
        {completedHeaderCell(
          "impactLives",
          "💀",
          `w-40 shrink-0 text-right ${hdr}`,
        )}
        {completedHeaderCell(
          "impactMoney",
          "💸",
          `w-44 shrink-0 text-right ${hdr}`,
        )}
        {headerCell("verifiedAt", `w-24 shrink-0 text-right ${hdr}`)}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 border-b-2 border-foreground bg-muted/30 px-4 py-2">
      <span className="h-8 w-8 shrink-0" />
      {headerCell("assignee", `hidden w-44 shrink-0 sm:block ${hdr}`)}
      {headerCell("title", `min-w-0 flex-1 ${hdr}`)}
      {headerCell("status", `hidden shrink-0 sm:block ${hdr}`)}
      {headerCell(
        "deathsLockedIn",
        `hidden w-40 shrink-0 text-right lg:block ${hdr}`,
      )}
      {headerCell("cost", `hidden w-44 shrink-0 text-right lg:block ${hdr}`)}
      {headerCell("time", `hidden w-16 shrink-0 text-right xl:block ${hdr}`)}
      <span className="hidden shrink-0 md:block text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Remind
      </span>
      <span className="w-7 shrink-0" />
    </div>
  );
}

export function TaskRow({
  task,
  variant = "default",
  hideAssignee = false,
  now,
}: {
  task: TaskCardTask;
  variant?: TaskListVariant;
  hideAssignee?: boolean;
  now: Date | null;
}) {
  const delayStats = now ? getTaskDelayStats(task, now) : null;
  const { display: targetLabel, share: shareTargetLabel } =
    getTaskAssigneeLabels(task);
  const countryCode = task.assigneePerson?.countryCode ?? null;
  const assigneeBudget = getAssigneeMilitaryBudgetUsd(task.contextJson);
  const governmentBudgetUsd = getAssigneeGovernmentBudgetUsd(task.contextJson);
  const militaryToClinicalTrialsRatio =
    getAssigneeMilitaryToClinicalTrialsRatio(task.contextJson);

  const isSignerTask = task.assigneePerson != null && assigneeBudget != null;
  const fallbackInitials = targetLabel
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const shareText = buildTaskShareText({
    currentDelayDays: delayStats?.currentDelayDays ?? 0,
    currentEconomicValueUsdLost:
      delayStats?.currentEconomicValueUsdLost ?? null,
    currentHumanLivesLost: delayStats?.currentHumanLivesLost ?? null,
    currentSufferingHoursLost: delayStats?.currentSufferingHoursLost ?? null,
    targetLabel: shareTargetLabel,
    taskTitle: task.title,
  });
  const leaderHandle = getLeaderHandle(task);

  const shareTokens = now
    ? buildTaskShareTokens({
        countryCode,
        currentDelayDays: delayStats?.currentDelayDays ?? 0,
        currentEconomicValueUsdLost:
          delayStats?.currentEconomicValueUsdLost ?? null,
        currentHumanLivesLost: delayStats?.currentHumanLivesLost ?? null,
        currentSufferingHoursLost:
          delayStats?.currentSufferingHoursLost ?? null,
        governmentBudgetUsdPerYear: governmentBudgetUsd,
        leaderHandle,
        militaryToClinicalTrialsRatio,
        militaryBudgetUsdPerYear: assigneeBudget,
        now,
        targetLabel: shareTargetLabel,
        taskTitle: task.title,
      })
    : undefined;

  const pressurePrompt: string | null = null;

  const dueMs = getTaskDateMs(task.dueAt);
  const isOverdue = dueMs != null && now != null && dueMs < now.getTime();
  const currentDelayDays = delayStats?.currentDelayDays ?? 0;

  const perDayDalys = task.impact?.selectedFrame?.delayDalysLostPerDayBase;
  const moneyWasted = delayStats?.currentEconomicValueUsdLost ?? null;
  // Per-second delay rates for live counters. Deaths derived from
  // delayDalysLostPerDayBase / 40 years-per-death; money from
  // delayEconomicValueUsdLostPerDayBase. Signer tasks will override these
  // downstream with share-of-global-military attribution.
  const delayEconPerDay =
    task.impact?.selectedFrame?.delayEconomicValueUsdLostPerDayBase ?? null;
  const defaultDeathsPerSecond =
    perDayDalys != null && perDayDalys > 0
      ? perDayDalys / 86400 / YEARS_PER_AVERTED_DEATH
      : null;
  const defaultUsdPerSecond =
    delayEconPerDay != null && delayEconPerDay > 0
      ? delayEconPerDay / 86400
      : null;
  const time = task.estimatedEffortHours;

  // Continuous death counter inputs: convert per-day healthy life-years lost
  // into per-second, then divide by years-per-death to get deaths/sec.
  const yearsPerSecond =
    perDayDalys != null && perDayDalys > 0 ? perDayDalys / 86400 : null;
  const deathClockStartMs = dueMs;
  const showDeathCounter =
    yearsPerSecond != null && deathClockStartMs != null && isOverdue;

  const calculationsUrl =
    (
      task.currentImpactEstimateSet?.assumptionsJson as {
        calculationsUrl?: string;
      } | null
    )?.calculationsUrl ?? null;
  const assigneeHref = task.assigneePerson
    ? getPersonHref(task.assigneePerson)
    : null;

  const avatarEl = (
    <Avatar className="h-8 w-8 shrink-0 border-2 border-foreground bg-muted">
      <Avatar.Image
        alt={targetLabel}
        src={
          task.assigneePerson?.image ??
          task.assigneeOrganization?.squareLogoUrl ??
          undefined
        }
      />
      <Avatar.Fallback className="bg-foreground text-xs font-black text-background">
        {fallbackInitials || "?"}
      </Avatar.Fallback>
    </Avatar>
  );

  // Dense signer leaderboard row — photo, name + role subtitle, 2 live stats
  // (deaths from delay, wasted by delay — per-signer attributed via share of
  // global military spending), and a send-reminder button.
  if (variant === "signer") {
    const roleLabel =
      task.assigneePerson?.currentAffiliation ?? task.roleTitle ?? null;
    const attribution = getSignerDelayAttribution(
      assigneeBudget,
      delayStats?.currentDelayDays ?? 0,
    );
    // Per-second growth rates for the live counters — attribution share
    // × global daily disease numbers ÷ 86400 seconds.
    const share =
      assigneeBudget != null ? assigneeBudget / GLOBAL_MILITARY_USD : 0;
    const deathsPerSecond = (DAILY_DISEASE_DEATHS * share) / 86400;
    const usdPerSecond = (DAILY_DISEASE_COST_USD * share) / 86400;
    const canTick =
      dueMs != null &&
      now != null &&
      dueMs < now.getTime() &&
      share > 0 &&
      attribution != null;
    // Compact packed caption for mobile (desktop uses full numbers below).
    const deathsTextCompact =
      attribution != null
        ? formatCompactCount(attribution.deathsFromDelay)
        : "—";
    const wastedTextCompact =
      attribution != null ? formatCompactCurrency(attribution.wastedUsd) : "—";
    const signerShareText = buildTaskShareText({
      currentDelayDays: delayStats?.currentDelayDays ?? 0,
      currentEconomicValueUsdLost:
        attribution?.wastedUsd ??
        delayStats?.currentEconomicValueUsdLost ??
        null,
      currentHumanLivesLost:
        attribution?.deathsFromDelay ??
        delayStats?.currentHumanLivesLost ??
        null,
      currentSufferingHoursLost: null,
      targetLabel,
      taskTitle: task.title,
    });
    const signerShareTokens = now
      ? buildTaskShareTokens({
          countryCode,
          currentDelayDays: delayStats?.currentDelayDays ?? 0,
          currentEconomicValueUsdLost:
            attribution?.wastedUsd ??
            delayStats?.currentEconomicValueUsdLost ??
            null,
          currentHumanLivesLost:
            attribution?.deathsFromDelay ??
            delayStats?.currentHumanLivesLost ??
            null,
          currentSufferingHoursLost: null,
          governmentBudgetUsdPerYear: governmentBudgetUsd,
          leaderHandle,
          militaryToClinicalTrialsRatio,
          militaryBudgetUsdPerYear: assigneeBudget,
          now,
          targetLabel,
          taskTitle: task.title,
        })
      : undefined;
    return (
      <div
        className={`relative flex items-center gap-3 border-l-4 px-3 py-3 transition-colors hover:bg-muted/50 sm:px-4 ${getLeftBorderColor(task)}`}
      >
        {/*
          Overlay link — invisible, fills the whole row so clicking any empty
          space navigates to the task detail. Interactive children are lifted
          above this with `relative z-10` so they keep their own click targets.
        */}
        <Link
          href={getTaskPath(task.id)}
          className="absolute inset-0 z-0"
          aria-label={`Open ${targetLabel}'s task`}
          tabIndex={-1}
        >
          <span className="sr-only">{targetLabel}</span>
        </Link>

        {!hideAssignee && assigneeHref ? (
          <Link
            href={assigneeHref}
            className="relative z-10 shrink-0"
            title={targetLabel}
          >
            <Avatar className="h-12 w-12 shrink-0 border-2 border-foreground bg-muted sm:h-14 sm:w-14">
              <Avatar.Image
                alt={targetLabel}
                src={task.assigneePerson?.image ?? undefined}
              />
              <Avatar.Fallback className="bg-foreground text-xs font-black text-background">
                {fallbackInitials || "?"}
              </Avatar.Fallback>
            </Avatar>
          </Link>
        ) : null}
        {!hideAssignee ? (
          <div className="relative z-[1] min-w-0 flex-1 sm:w-56 sm:shrink-0 sm:flex-none">
            <div className="truncate text-sm font-black underline-offset-4 sm:text-base">
              {targetLabel}
            </div>
            {roleLabel ? (
              <div className="truncate text-[11px] font-bold text-muted-foreground sm:text-xs">
                {roleLabel}
              </div>
            ) : null}
            {/* Mobile — stacked delay stats so they do not get cut off */}
            {attribution != null ? (
              <div className="mt-1 text-[11px] font-bold text-muted-foreground lg:hidden">
                <div className="text-[10px] font-black uppercase tracking-[0.12em] text-brutal-red">
                  Wasted by delay
                </div>
                <div>
                  💀{" "}
                  {canTick && dueMs != null ? (
                    <LiveCounter
                      ratePerSecond={deathsPerSecond}
                      startMs={dueMs}
                      mode="integer"
                    />
                  ) : (
                    deathsTextCompact
                  )}{" "}
                  deaths
                </div>
                <div>
                  💸{" "}
                  {canTick && dueMs != null ? (
                    <LiveCounter
                      ratePerSecond={usdPerSecond}
                      startMs={dueMs}
                      mode="currency"
                    />
                  ) : (
                    wastedTextCompact
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        <div
          className={`relative z-[1] min-w-0 ${hideAssignee ? "flex-1" : "hidden flex-[1.2] lg:block"}`}
        >
          <Link
            href={getTaskPath(task.id)}
            className="block whitespace-normal break-words text-balance text-sm font-black uppercase leading-tight text-foreground underline-offset-4 hover:underline"
          >
            {task.title}
            <PrivateTaskLock isPublic={task.isPublic} />
          </Link>
          {hideAssignee && attribution != null ? (
            <div className="mt-1 text-[11px] font-bold text-muted-foreground lg:hidden">
              <div>
                💀{" "}
                {canTick && dueMs != null ? (
                  <LiveCounter
                    ratePerSecond={deathsPerSecond}
                    startMs={dueMs}
                    mode="integer"
                  />
                ) : (
                  deathsTextCompact
                )}{" "}
                deaths
              </div>
              <div>
                💸{" "}
                {canTick && dueMs != null ? (
                  <LiveCounter
                    ratePerSecond={usdPerSecond}
                    startMs={dueMs}
                    mode="currency"
                  />
                ) : (
                  wastedTextCompact
                )}
              </div>
            </div>
          ) : null}
        </div>
        {/* Desktop — live stats plus estimated time */}
        <div className="relative z-[1] hidden w-40 shrink-0 break-all text-right text-sm font-black leading-tight text-brutal-red lg:block">
          💀{" "}
          {canTick && dueMs != null ? (
            <LiveCounter
              ratePerSecond={deathsPerSecond}
              startMs={dueMs}
              mode="integer"
            />
          ) : (
            "—"
          )}
        </div>
        <div className="relative z-[1] hidden w-44 shrink-0 break-all text-right text-sm font-black leading-tight text-brutal-red lg:block">
          💸{" "}
          {canTick && dueMs != null ? (
            <LiveCounter
              ratePerSecond={usdPerSecond}
              startMs={dueMs}
              mode="currency"
            />
          ) : (
            "—"
          )}
        </div>
        <div className="relative z-[1] hidden w-20 shrink-0 text-right text-sm font-black leading-tight lg:block">
          {formatDuration(time)}
        </div>
        {task.isPublic ? (
          <div className="relative z-[1] shrink-0">
            <TaskRowShare
              shareText={signerShareText}
              shareTokens={signerShareTokens}
              targetLabel={shareTargetLabel}
              taskId={task.id}
              taskTitle={task.title}
            />
          </div>
        ) : null}
      </div>
    );
  }

  // Completed leaderboard row — photo, name + role, task title, signed
  // lives/money impact (green = helped, red = harmed), completion date.
  // No Remind button — the task is done.
  if (variant === "completed") {
    const roleLabel =
      task.assigneePerson?.currentAffiliation ?? task.roleTitle ?? null;
    const econ =
      task.impact?.selectedFrame?.expectedEconomicValueUsdBase ?? null;
    const dalys = task.impact?.selectedFrame?.expectedDalysAvertedBase ?? null;
    const livesSaved = dalys != null ? dalys / YEARS_PER_AVERTED_DEATH : null;
    const livesClass = impactSignClass(livesSaved);
    const moneyClass = impactSignClass(econ);
    const livesText = livesSaved != null ? formatCompactCount(livesSaved) : "—";
    const moneyText = econ != null ? formatCompactCurrency(econ) : "—";
    const completedText = formatCompletedDate(task.verifiedAt);
    return (
      <div
        className={`relative flex items-center gap-3 border-l-4 px-3 py-3 transition-colors hover:bg-muted/50 sm:px-4 ${getLeftBorderColor(task)}`}
      >
        <Link
          href={getTaskPath(task.id)}
          className="absolute inset-0 z-0"
          aria-label={`Open ${targetLabel}'s task`}
          tabIndex={-1}
        >
          <span className="sr-only">{targetLabel}</span>
        </Link>

        {!hideAssignee && assigneeHref ? (
          <Link
            href={assigneeHref}
            className="relative z-10 shrink-0"
            title={targetLabel}
          >
            <Avatar className="h-12 w-12 shrink-0 border-2 border-foreground bg-muted sm:h-14 sm:w-14">
              <Avatar.Image
                alt={targetLabel}
                src={task.assigneePerson?.image ?? undefined}
              />
              <Avatar.Fallback className="bg-foreground text-xs font-black text-background">
                {fallbackInitials || "?"}
              </Avatar.Fallback>
            </Avatar>
          </Link>
        ) : null}
        {!hideAssignee ? (
          <div className="relative z-[1] min-w-0 flex-1 sm:w-56 sm:shrink-0 sm:flex-none">
            <div className="truncate text-sm font-black underline-offset-4 sm:text-base">
              {targetLabel}
            </div>
            {roleLabel ? (
              <div className="truncate text-[11px] font-bold text-muted-foreground sm:text-xs">
                {roleLabel}
              </div>
            ) : null}
            {/* Mobile — stacked impact stats */}
            <div className="mt-1 text-[11px] font-bold text-muted-foreground lg:hidden">
              <div className={`${livesClass} font-black`}>
                💀 {livesText} lives
              </div>
              <div className={`${moneyClass} font-black`}>💸 {moneyText}</div>
              {completedText !== "—" ? (
                <div>completed {completedText}</div>
              ) : null}
            </div>
          </div>
        ) : null}
        <div
          className={`relative z-[1] min-w-0 ${hideAssignee ? "flex-1" : "hidden flex-[1.2] lg:block"}`}
        >
          <Link
            href={getTaskPath(task.id)}
            className="block whitespace-normal break-words text-balance text-sm font-black uppercase leading-tight text-foreground underline-offset-4 hover:underline"
          >
            {task.title}
            <PrivateTaskLock isPublic={task.isPublic} />
          </Link>
          {hideAssignee ? (
            <div className="mt-1 text-[11px] font-bold text-muted-foreground lg:hidden">
              <div className={`${livesClass} font-black`}>
                💀 {livesText} lives
              </div>
              <div className={`${moneyClass} font-black`}>💸 {moneyText}</div>
              {completedText !== "—" ? (
                <div>completed {completedText}</div>
              ) : null}
            </div>
          ) : null}
        </div>
        <div
          className={`relative z-[1] hidden w-40 shrink-0 break-all text-right text-sm font-black leading-tight lg:block ${livesClass}`}
        >
          💀 {livesText}
        </div>
        <div
          className={`relative z-[1] hidden w-44 shrink-0 break-all text-right text-sm font-black leading-tight lg:block ${moneyClass}`}
        >
          💸 {moneyText}
        </div>
        <div className="relative z-[1] hidden w-24 shrink-0 text-right text-xs font-bold text-muted-foreground lg:block">
          {completedText}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center gap-3 border-l-4 px-4 py-3 transition-colors hover:bg-muted/50 ${getLeftBorderColor(task)}`}
    >
      {/* Overlay link — fills the row so clicking empty space opens the task. */}
      <Link
        href={getTaskPath(task.id)}
        className="absolute inset-0 z-0"
        aria-label={`Open ${task.title}`}
        tabIndex={-1}
      >
        <span className="sr-only">{task.title}</span>
      </Link>
      {assigneeHref ? (
        <Link
          href={assigneeHref}
          className="relative z-10 shrink-0"
          title={targetLabel}
        >
          {avatarEl}
        </Link>
      ) : (
        <span className="relative z-[1] shrink-0">{avatarEl}</span>
      )}

      {assigneeHref ? (
        <Link
          href={assigneeHref}
          className="relative z-10 hidden w-44 shrink-0 min-w-0 flex-col text-xs font-bold uppercase underline-offset-4 hover:underline sm:flex"
        >
          <span className="truncate">{targetLabel}</span>
          {task.assigneePerson?.currentAffiliation ? (
            <span className="truncate text-[10px] font-bold normal-case text-muted-foreground">
              {task.assigneePerson.currentAffiliation}
            </span>
          ) : null}
        </Link>
      ) : (
        <span className="relative z-[1] hidden w-44 shrink-0 min-w-0 flex-col text-xs font-bold uppercase sm:flex">
          <span className="truncate">{targetLabel}</span>
        </span>
      )}

      <div className="relative z-[1] min-w-0 flex-1">
        <Link
          href={getTaskPath(task.id)}
          className="block truncate text-sm font-bold underline-offset-4 hover:underline"
        >
          {task.title}
          <PrivateTaskLock isPublic={task.isPublic} />
        </Link>
        {pressurePrompt ? (
          <p className="mt-1 truncate text-[11px] font-black uppercase text-brutal-red">
            {pressurePrompt}
          </p>
        ) : null}
        {/* Mobile badges — show data from hidden columns */}
        <div className="mt-1 flex flex-wrap gap-1 lg:hidden">
          {isOverdue ? (
            <StatusBadge variant="overdue">
              {currentDelayDays > 365
                ? `${formatDelayDuration(currentDelayDays)} overdue`
                : "overdue"}
            </StatusBadge>
          ) : task.dueAt ? (
            <StatusBadge>{`due ${formatDueDate(task.dueAt)}`}</StatusBadge>
          ) : task.status === "VERIFIED" ? (
            <StatusBadge variant="done">verified</StatusBadge>
          ) : null}
          {showDeathCounter ? (
            <StatusBadge variant="overdue">
              <DeathCounter
                yearsPerSecond={yearsPerSecond}
                startMs={deathClockStartMs}
                yearsPerDeath={YEARS_PER_AVERTED_DEATH}
              />
              <span className="ml-1">deaths from delay</span>
            </StatusBadge>
          ) : null}
          {moneyWasted != null && moneyWasted > 0 ? (
            <StatusBadge variant="overdue">
              {formatMoneyWasted(moneyWasted)} wasted
            </StatusBadge>
          ) : null}
          {time != null && time > 0 ? (
            <StatusBadge>{formatDuration(time)}</StatusBadge>
          ) : null}
        </div>
      </div>

      {/* Desktop status */}
      <div className="relative z-[1] hidden shrink-0 sm:block lg:hidden">
        {isOverdue ? (
          <StatusBadge variant="overdue">
            {currentDelayDays > 365
              ? `${formatDelayDuration(currentDelayDays)} overdue`
              : "overdue"}
          </StatusBadge>
        ) : task.dueAt ? (
          <StatusBadge>{`due ${formatDueDate(task.dueAt)}`}</StatusBadge>
        ) : task.status === "VERIFIED" ? (
          <StatusBadge variant="done">verified</StatusBadge>
        ) : null}
      </div>

      {/* Live death counter — desktop. Full comma-separated integers. */}
      <div className="relative z-[1] hidden w-40 shrink-0 break-all text-right text-sm font-black leading-tight text-brutal-red lg:block">
        {defaultDeathsPerSecond != null &&
        deathClockStartMs != null &&
        isOverdue ? (
          <>
            💀{" "}
            <LiveCounter
              ratePerSecond={defaultDeathsPerSecond}
              startMs={deathClockStartMs}
              mode="integer"
            />
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>

      {/* Taxpayer $ wasted by delay — desktop. Full dollar counter. */}
      <div className="relative z-[1] hidden w-44 shrink-0 break-all text-right text-sm font-black leading-tight text-brutal-red lg:block">
        {isSignerTask && assigneeBudget != null ? (
          <>💰 ${assigneeBudget.toLocaleString("en-US")}</>
        ) : defaultUsdPerSecond != null &&
          deathClockStartMs != null &&
          isOverdue ? (
          <>
            💸{" "}
            <LiveCounter
              ratePerSecond={defaultUsdPerSecond}
              startMs={deathClockStartMs}
              mode="currency"
            />
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>

      {/* Time required — xl desktop */}
      <div className="relative z-[1] hidden xl:block">
        <ImpactCell value={formatDuration(time)} href={null} className="w-16" />
      </div>

      <div className="relative z-[1] hidden shrink-0 md:block">
        {task.isPublic ? (
          <TaskRowShare
            shareText={shareText}
            shareTokens={shareTokens}
            targetLabel={shareTargetLabel}
            taskId={task.id}
            taskTitle={task.title}
          />
        ) : null}
      </div>
    </div>
  );
}

export function getTaskSortValue(
  task: TaskCardTask,
  key: TaskSortKey,
): string | number {
  switch (key) {
    case "recommendation":
      return task.recommendationScore ?? 0;
    case "deathsLockedIn": {
      // Deaths from delay for signer tasks are proportional to share of
      // global military spending → sort by budget to preserve order.
      const budget = getAssigneeMilitaryBudgetUsd(task.contextJson);
      if (budget != null) return budget;
      const perDay = task.impact?.selectedFrame?.delayDalysLostPerDayBase;
      return perDay != null ? perDay : 0;
    }
    case "cost": {
      // "Wasted by delay" is proportional to share of global military spending
      // for signer tasks → sorting by assigneeBudget preserves the order.
      // Non-signer tasks fall through to per-day delay econ value.
      const budget = getAssigneeMilitaryBudgetUsd(task.contextJson);
      if (budget != null) return budget;
      return (
        task.impact?.selectedFrame?.delayEconomicValueUsdLostPerDayBase ?? 0
      );
    }
    case "time":
      // Lower time required = easier; ascending puts fastest first
      return task.estimatedEffortHours ?? Infinity;
    case "assigneeBudget":
      // Higher military budget = more shameable; sort desc by default
      return getAssigneeMilitaryBudgetUsd(task.contextJson) ?? 0;
    case "impactLives":
      return task.impact?.selectedFrame?.expectedDalysAvertedBase ?? 0;
    case "impactMoney":
      return task.impact?.selectedFrame?.expectedEconomicValueUsdBase ?? 0;
    case "verifiedAt":
      return getTaskDateMs(task.verifiedAt) ?? 0;
    case "assignee":
      return (
        task.assigneePerson?.displayName ??
        task.assigneeOrganization?.name ??
        ""
      );
    case "status":
      return getTaskDateMs(task.dueAt) ?? Infinity;
    case "title":
      return task.title;
  }
}
