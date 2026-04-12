import Link from "next/link";
import { Avatar } from "@/components/retroui/Avatar";
import {
  formatCompactCurrency,
  formatDelayDuration,
  getTaskDelayStats,
} from "@/lib/tasks/accountability";
import { getPersonHref } from "@/lib/person-href";
import { buildTaskPressureShareText, getTaskPressurePrompt } from "@/lib/tasks/task-review-ui";
import type { TaskCardTask } from "./task-card";
import { TaskRowShare } from "./task-row-share";
import { DeathCounter } from "./death-counter";

export type TaskSortKey =
  | "title"
  | "assignee"
  | "status"
  | "deathsLockedIn"
  | "cost"
  | "time";

/** Below this threshold, cost is treated as −∞ for display purposes. */
const NEGATIVE_INFINITY_COST_THRESHOLD = -1e17;
/** Healthy life-years lost per averted death (child-skewed global average). */
const YEARS_PER_AVERTED_DEATH = 40;

/** Format raw cost. Renders "−∞" for sentinel values. */
function formatCost(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value <= NEGATIVE_INFINITY_COST_THRESHOLD) return "−∞";
  if (value < 0) return `−${formatCompactCurrency(Math.abs(value))}`;
  if (value === 0) return "$0";
  return formatCompactCurrency(value);
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
  deathsLockedIn: "Deaths Locked In",
  cost: "Cost",
  time: "Time",
};

export function TaskTableHeader({
  sortKey,
  sortDir,
  onSort,
}: {
  sortKey?: TaskSortKey;
  sortDir?: "asc" | "desc";
  onSort?: (key: TaskSortKey) => void;
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
        Share
      </span>
      <span className="w-12 shrink-0" />
    </div>
  );
}

export function TaskRow({
  task,
}: {
  task: TaskCardTask;
}) {
  const delayStats = getTaskDelayStats(task);
  const targetLabel =
    task.assigneePerson?.displayName ?? task.assigneeOrganization?.name ?? task.title;
  const fallbackInitials = targetLabel
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const shareText = buildTaskPressureShareText(task, delayStats);
  const pressurePrompt = getTaskPressurePrompt(task, delayStats);

  const isOverdue = task.dueAt != null && task.dueAt.getTime() < Date.now();

  const perDayDalys = task.impact?.selectedFrame?.delayDalysLostPerDayBase;
  const cost = task.impact?.selectedFrame?.estimatedCashCostUsdBase ?? null;
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
              <span className="ml-1">deaths locked in</span>
            </StatusBadge>
          ) : null}
          {cost != null ? (
            <StatusBadge>cost {formatCost(cost)}</StatusBadge>
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

      {/* Cost — desktop */}
      <ImpactCell
        value={formatCost(cost)}
        href={calculationsUrl}
        className="hidden w-24 lg:block"
      />

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
      // Higher deaths locked in = bigger problem; sort desc by default
      const perDay = task.impact?.selectedFrame?.delayDalysLostPerDayBase;
      return perDay != null ? perDay : 0;
    }
    case "cost":
      // Lower cost = better; ascending puts the −∞ treaty first
      return task.impact?.selectedFrame?.estimatedCashCostUsdBase ?? Infinity;
    case "time":
      // Lower time required = easier; ascending puts fastest first
      return task.estimatedEffortHours ?? Infinity;
    case "assignee":
      return task.assigneePerson?.displayName ?? task.assigneeOrganization?.name ?? "";
    case "status":
      return task.dueAt?.getTime() ?? Infinity;
    case "title":
      return task.title;
  }
}
