import Link from "next/link";
import { Avatar } from "@/components/retroui/Avatar";
import {
  buildTaskShareText,
  formatCompactCurrency,
  formatDelayDuration,
  getTaskDelayStats,
} from "@/lib/tasks/accountability";
import { getPersonHref } from "@/lib/person-href";
import type { TaskCardTask } from "./task-card";
import { TaskRowShare } from "./task-row-share";
import { DeathCounter } from "./death-counter";

export type TaskSortKey =
  | "title"
  | "assignee"
  | "status"
  | "deathsLockedIn"
  | "cost"
  | "time"
  | "assigneeBudget";

/** Healthy life-years lost per averted death (child-skewed global average). */
const YEARS_PER_AVERTED_DEATH = 40;

/** Format the taxpayer money wasted by delay as a display string. */
function formatMoneyWasted(value: number | null | undefined): string {
  if (value == null || value <= 0) return "—";
  return formatCompactCurrency(value);
}

/** Pull the assignee's military budget from contextJson, if present. */
function getMilitaryBudgetUsd(task: TaskCardTask): number | null {
  const context = task.contextJson;
  if (!context || typeof context !== "object") return null;
  const profile = (context as { assigneeProfile?: { budgetUsdPerYear?: number } })
    .assigneeProfile;
  return typeof profile?.budgetUsdPerYear === "number" ? profile.budgetUsdPerYear : null;
}

/** True when a task is assigned to the "Humanity" org — i.e. "you". */
function isAssignedToYou(task: TaskCardTask): boolean {
  return task.assigneeOrganization?.slug === "humanity";
}

/** Format an estimated effort duration. Sub-minute → seconds, sub-hour → minutes, else hours. */
function formatDuration(hours: number | null | undefined): string {
  if (hours == null || hours <= 0) return "—";
  const seconds = hours * 3600;
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (hours < 24) return `${hours.toFixed(hours < 10 ? 1 : 0)}h`;
  return `${Math.round(hours / 24)}d`;
}

function formatDueDate(value: Date) {
  return value.toLocaleDateString("en-US", {
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

function StatusBadge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "overdue" | "done" }) {
  const colors = {
    default: "bg-muted text-muted-foreground",
    overdue: "bg-brutal-red text-brutal-red-foreground",
    done: "bg-brutal-green text-brutal-green-foreground",
  };
  return (
    <span className={`inline-block rounded-sm border-2 border-foreground px-2 py-0.5 text-xs font-bold ${colors[variant]}`}>
      {children}
    </span>
  );
}

function getLeftBorderColor(task: TaskCardTask): string {
  const econ = task.impact?.selectedFrame?.expectedEconomicValueUsdBase;
  const dalys = task.impact?.selectedFrame?.expectedDalysAvertedBase;
  const hasNegative = (econ != null && econ < 0) || (dalys != null && dalys < 0);

  if (task.status === "VERIFIED" && hasNegative) return "border-l-brutal-red";
  if (task.claimPolicy === "ASSIGNED_ONLY") return "border-l-brutal-yellow";
  if (task.viewerHasClaim) return "border-l-brutal-cyan";
  return "border-l-muted";
}

const SORT_LABELS: Record<TaskSortKey, string> = {
  title: "Task",
  assignee: "Assignee",
  status: "Status",
  deathsLockedIn: "Deaths From Delay",
  cost: "Tax $ Wasted By Delay",
  time: "Time",
  assigneeBudget: "Budget Controlled",
};

export type TaskListVariant = "default" | "signer";

export function TaskTableHeader({
  sortKey,
  sortDir,
  onSort,
  variant = "default",
}: {
  sortKey?: TaskSortKey;
  sortDir?: "asc" | "desc";
  onSort?: (key: TaskSortKey) => void;
  variant?: TaskListVariant;
}) {
  function headerCell(key: TaskSortKey, className: string) {
    const isActive = sortKey === key;
    const arrow = isActive ? (sortDir === "asc" ? " \u2191" : " \u2193") : "";
    return (
      <span
        className={`${className} ${onSort ? "cursor-pointer select-none hover:text-foreground" : ""}`}
        onClick={onSort ? () => onSort(key) : undefined}
      >
        {SORT_LABELS[key]}{arrow}
      </span>
    );
  }

  const hdr = "text-xs font-bold uppercase tracking-wide text-muted-foreground";

  if (variant === "signer") {
    // Dense signer leaderboard: photo · leader name · budget · remind · details
    return (
      <div className="flex items-center gap-3 border-b-2 border-foreground bg-muted/30 px-4 py-2">
        <span className="h-8 w-8 shrink-0" />
        {headerCell("assignee", `min-w-0 flex-1 ${hdr}`)}
        {headerCell("assigneeBudget", `hidden w-32 shrink-0 text-right sm:block ${hdr}`)}
        <span className="hidden shrink-0 md:block text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Remind
        </span>
        <span className="w-12 shrink-0" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 border-b-2 border-foreground bg-muted/30 px-4 py-2">
      <span className="h-8 w-8 shrink-0" />
      {headerCell("assignee", `hidden w-36 shrink-0 sm:block ${hdr}`)}
      {headerCell("title", `min-w-0 flex-1 ${hdr}`)}
      {headerCell("status", `hidden shrink-0 sm:block ${hdr}`)}
      {headerCell("deathsLockedIn", `hidden w-36 shrink-0 text-right lg:block ${hdr}`)}
      {headerCell("cost", `hidden w-24 shrink-0 text-right lg:block ${hdr}`)}
      {headerCell("time", `hidden w-16 shrink-0 text-right xl:block ${hdr}`)}
      <span className="hidden shrink-0 md:block text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Remind
      </span>
      <span className="w-12 shrink-0" />
    </div>
  );
}

export function TaskRow({
  task,
  variant = "default",
}: {
  task: TaskCardTask;
  variant?: TaskListVariant;
}) {
  const delayStats = getTaskDelayStats(task);
  const assignedToYou = isAssignedToYou(task);
  const targetLabel = assignedToYou
    ? "You"
    : task.assigneePerson?.displayName ?? task.assigneeOrganization?.name ?? task.title;
  const assigneeBudget = getMilitaryBudgetUsd(task);
  const isSignerTask = task.assigneePerson != null && assigneeBudget != null;
  const fallbackInitials = targetLabel
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const shareText = buildTaskShareText({
    currentDelayDays: delayStats.currentDelayDays,
    currentEconomicValueUsdLost: delayStats.currentEconomicValueUsdLost,
    currentHumanLivesLost: delayStats.currentHumanLivesLost,
    currentSufferingHoursLost: delayStats.currentSufferingHoursLost,
    targetLabel,
    taskTitle: task.title,
  });
  const pressurePrompt: string | null = null;

  const isOverdue = task.dueAt != null && task.dueAt.getTime() < Date.now();

  const perDayDalys = task.impact?.selectedFrame?.delayDalysLostPerDayBase;
  const moneyWasted = delayStats.currentEconomicValueUsdLost;
  const time = task.estimatedEffortHours;

  // Continuous death counter inputs: convert per-day healthy life-years lost
  // into per-second, then divide by years-per-death to get deaths/sec.
  const yearsPerSecond = perDayDalys != null && perDayDalys > 0 ? perDayDalys / 86400 : null;
  const deathClockStartMs = task.dueAt?.getTime() ?? null;
  const showDeathCounter = yearsPerSecond != null && deathClockStartMs != null && isOverdue;

  const calculationsUrl =
    (task.currentImpactEstimateSet?.assumptionsJson as { calculationsUrl?: string } | null)
      ?.calculationsUrl ?? null;
  const assigneeHref = task.assigneePerson
    ? getPersonHref(task.assigneePerson)
    : null;

  const avatarEl = (
    <Avatar className="h-8 w-8 shrink-0 border-2 border-foreground bg-muted">
      <Avatar.Image
        alt={targetLabel}
        src={task.assigneePerson?.image ?? task.assigneeOrganization?.logo ?? undefined}
      />
      <Avatar.Fallback className="bg-brutal-pink text-xs font-black text-background">
        {fallbackInitials || "?"}
      </Avatar.Fallback>
    </Avatar>
  );

  // Dense signer leaderboard row — 4 cells: photo · name · budget · remind · details
  if (variant === "signer") {
    return (
      <div
        className={`flex items-center gap-3 border-l-4 px-4 py-3 transition-colors hover:bg-muted/50 ${getLeftBorderColor(task)}`}
      >
        {assigneeHref ? (
          <Link href={assigneeHref} className="shrink-0" title={targetLabel}>
            {avatarEl}
          </Link>
        ) : (
          avatarEl
        )}
        <Link
          href={`/tasks/${task.id}`}
          className="min-w-0 flex-1 truncate text-sm font-bold underline-offset-4 hover:underline"
        >
          {targetLabel}
        </Link>
        <div className="hidden w-32 shrink-0 text-right text-sm font-black sm:block">
          {assigneeBudget != null ? formatCompactCurrency(assigneeBudget) : "—"}
        </div>
        <div className="hidden shrink-0 md:block">
          {task.isPublic ? (
            <TaskRowShare shareText={shareText} taskId={task.id} />
          ) : null}
        </div>
        <Link
          href={`/tasks/${task.id}`}
          className="w-12 shrink-0 text-right text-xs font-bold uppercase underline underline-offset-4"
        >
          Details
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 border-l-4 px-4 py-3 transition-colors hover:bg-muted/50 ${getLeftBorderColor(task)}`}
    >
      {assigneeHref ? (
        <Link href={assigneeHref} className="shrink-0" title={targetLabel}>
          {avatarEl}
        </Link>
      ) : (
        avatarEl
      )}

      {assigneeHref ? (
        <Link
          href={assigneeHref}
          className="hidden w-36 shrink-0 truncate text-xs font-bold uppercase underline-offset-4 hover:underline sm:block"
        >
          {targetLabel}
        </Link>
      ) : (
        <span className="hidden w-36 shrink-0 truncate text-xs font-bold uppercase sm:block">
          {targetLabel}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <Link
          href={`/tasks/${task.id}`}
          className="block truncate text-sm font-bold underline-offset-4 hover:underline"
        >
          {task.title}
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
              {delayStats.currentDelayDays > 365
                ? `${formatDelayDuration(delayStats.currentDelayDays)} overdue`
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
      <div className="hidden shrink-0 sm:block lg:hidden">
        {isOverdue ? (
          <StatusBadge variant="overdue">
            {delayStats.currentDelayDays > 365
              ? `${formatDelayDuration(delayStats.currentDelayDays)} overdue`
              : "overdue"}
          </StatusBadge>
        ) : task.dueAt ? (
          <StatusBadge>{`due ${formatDueDate(task.dueAt)}`}</StatusBadge>
        ) : task.status === "VERIFIED" ? (
          <StatusBadge variant="done">verified</StatusBadge>
        ) : null}
      </div>

      {/* Live death counter — desktop */}
      <div className="hidden w-36 shrink-0 text-right text-xs font-bold lg:block">
        {showDeathCounter ? (
          calculationsUrl ? (
            <a
              href={calculationsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brutal-red underline underline-offset-4 hover:text-foreground"
            >
              <DeathCounter
                yearsPerSecond={yearsPerSecond}
                startMs={deathClockStartMs}
                yearsPerDeath={YEARS_PER_AVERTED_DEATH}
              />
            </a>
          ) : (
            <span className="text-brutal-red">
              <DeathCounter
                yearsPerSecond={yearsPerSecond}
                startMs={deathClockStartMs}
                yearsPerDeath={YEARS_PER_AVERTED_DEATH}
              />
            </span>
          )
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>

      {/* Taxpayer money wasted by delay — desktop (budget on signer rows) */}
      {isSignerTask ? (
        <ImpactCell
          value={
            assigneeBudget != null
              ? formatCompactCurrency(assigneeBudget)
              : "—"
          }
          href={null}
          className="hidden w-24 lg:block"
        />
      ) : (
        <ImpactCell
          value={formatMoneyWasted(moneyWasted)}
          href={calculationsUrl}
          className="hidden w-24 lg:block"
        />
      )}

      {/* Time required — xl desktop */}
      <ImpactCell
        value={formatDuration(time)}
        href={null}
        className="hidden w-16 xl:block"
      />

      <div className="hidden shrink-0 md:block">
        {task.isPublic ? (
          <TaskRowShare shareText={shareText} taskId={task.id} />
        ) : null}
      </div>

      <Link
        href={`/tasks/${task.id}`}
        className="w-12 shrink-0 text-right text-xs font-bold uppercase underline underline-offset-4"
      >
        Details
      </Link>
    </div>
  );
}

export function getTaskSortValue(task: TaskCardTask, key: TaskSortKey): string | number {
  switch (key) {
    case "deathsLockedIn": {
      // Higher deaths from delay = bigger problem; sort desc by default
      const perDay = task.impact?.selectedFrame?.delayDalysLostPerDayBase;
      return perDay != null ? perDay : 0;
    }
    case "cost":
      // Higher taxpayer $ wasted per day of delay = more urgent; sort desc by default
      return task.impact?.selectedFrame?.delayEconomicValueUsdLostPerDayBase ?? 0;
    case "time":
      // Lower time required = easier; ascending puts fastest first
      return task.estimatedEffortHours ?? Infinity;
    case "assigneeBudget":
      // Higher military budget = more shameable; sort desc by default
      return getMilitaryBudgetUsd(task) ?? 0;
    case "assignee":
      return task.assigneePerson?.displayName ?? task.assigneeOrganization?.name ?? "";
    case "status":
      return task.dueAt?.getTime() ?? Infinity;
    case "title":
      return task.title;
  }
}
