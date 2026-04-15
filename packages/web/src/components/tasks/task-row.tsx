import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";
import { Avatar } from "@/components/retroui/Avatar";
import {
  buildTaskShareText,
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
import { getPersonHref } from "@/lib/person-href";
import type { TaskCardTask } from "./task-card";
import { TaskRowShare } from "./task-row-share";
import { DeathCounter } from "./death-counter";
import { LiveCounter } from "./live-counter";

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
  cost: "Wasted By Delay",
  time: "Time",
  assigneeBudget: "Military Budget",
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
    // Dense signer leaderboard: photo · assignee · task · 💀 deaths · 🔥 wasted · time · remind · details
    // Desktop-only header (>= lg). Mobile uses the packed caption inside each row.
    function signerHeaderCell(key: TaskSortKey, emoji: string, className: string) {
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
        <span className="h-14 w-14 shrink-0" />
        {headerCell("assignee", `w-56 shrink-0 ${hdr}`)}
        {headerCell("title", `min-w-0 flex-[1.2] ${hdr}`)}
        {signerHeaderCell("deathsLockedIn", "💀", `w-40 shrink-0 text-right ${hdr}`)}
        {signerHeaderCell("cost", "🔥", `w-44 shrink-0 text-right ${hdr}`)}
        {signerHeaderCell("time", "⏱", `w-20 shrink-0 text-right ${hdr}`)}
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Remind
        </span>
        <span className="w-7 shrink-0" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 border-b-2 border-foreground bg-muted/30 px-4 py-2">
      <span className="h-8 w-8 shrink-0" />
      {headerCell("assignee", `hidden w-44 shrink-0 sm:block ${hdr}`)}
      {headerCell("title", `min-w-0 flex-1 ${hdr}`)}
      {headerCell("status", `hidden shrink-0 sm:block ${hdr}`)}
      {headerCell("deathsLockedIn", `hidden w-40 shrink-0 text-right lg:block ${hdr}`)}
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

  // Dense signer leaderboard row — photo, name + role subtitle, 2 live stats
  // (deaths from delay, wasted by delay — per-signer attributed via share of
  // global military spending), and a send-reminder button.
  if (variant === "signer") {
    const roleLabel =
      task.assigneePerson?.currentAffiliation ?? task.roleTitle ?? null;
    const attribution = getSignerDelayAttribution(
      assigneeBudget,
      delayStats.currentDelayDays,
    );
    // Per-second growth rates for the live counters — attribution share
    // × global daily disease numbers ÷ 86400 seconds.
    const share =
      assigneeBudget != null ? assigneeBudget / GLOBAL_MILITARY_USD : 0;
    const deathsPerSecond = (DAILY_DISEASE_DEATHS * share) / 86400;
    const usdPerSecond = (DAILY_DISEASE_COST_USD * share) / 86400;
    const dueMs = task.dueAt?.getTime() ?? null;
    const canTick =
      dueMs != null && dueMs < Date.now() && share > 0 && attribution != null;
    // Compact packed caption for mobile (desktop uses full numbers below).
    const deathsTextCompact =
      attribution != null ? formatCompactCount(attribution.deathsFromDelay) : "—";
    const wastedTextCompact =
      attribution != null ? formatCompactCurrency(attribution.wastedUsd) : "—";
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
          href={`/tasks/${task.id}`}
          className="absolute inset-0 z-0"
          aria-label={`Open ${targetLabel}'s task`}
          tabIndex={-1}
        >
          <span className="sr-only">{targetLabel}</span>
        </Link>

        {assigneeHref ? (
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
              <Avatar.Fallback className="bg-brutal-pink text-xs font-black text-background">
                {fallbackInitials || "?"}
              </Avatar.Fallback>
            </Avatar>
          </Link>
        ) : null}
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
            <div className="mt-1 space-y-0.5 text-[11px] font-bold text-muted-foreground lg:hidden">
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
                )}
              </div>
              <div>
                🔥{" "}
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
        <div className="relative z-[1] hidden min-w-0 flex-[1.2] lg:block">
          <div className="whitespace-normal break-words text-balance text-sm font-black uppercase leading-tight text-foreground">
            {task.title}
          </div>
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
          🔥{" "}
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
          <div className="relative shrink-0">
            <TaskRowShare shareText={shareText} taskId={task.id} />
          </div>
        ) : null}
        <Link
          href={`/tasks/${task.id}`}
          className="relative z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center border-2 border-foreground bg-background text-foreground transition-transform hover:translate-y-[-1px] hover:bg-muted"
          title="Open task details"
          aria-label="Open task details"
        >
          <FaArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center gap-3 border-l-4 px-4 py-3 transition-colors hover:bg-muted/50 ${getLeftBorderColor(task)}`}
    >
      {/* Overlay link — fills the row so clicking empty space opens the task. */}
      <Link
        href={`/tasks/${task.id}`}
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
        <div className="block truncate text-sm font-bold underline-offset-4">
          {task.title}
        </div>
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
      <div className="relative z-[1] hidden shrink-0 sm:block lg:hidden">
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

      {/* Live death counter — desktop. Full comma-separated integers. */}
      <div className="relative z-[1] hidden w-40 shrink-0 break-all text-right text-sm font-black leading-tight text-brutal-red lg:block">
        {defaultDeathsPerSecond != null && deathClockStartMs != null && isOverdue ? (
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
            🔥{" "}
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
        <ImpactCell
          value={formatDuration(time)}
          href={null}
          className="w-16"
        />
      </div>

      <div className="relative hidden shrink-0 md:block">
        {task.isPublic ? (
          <TaskRowShare shareText={shareText} taskId={task.id} />
        ) : null}
      </div>

      <Link
        href={`/tasks/${task.id}`}
        className="relative z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center border-2 border-foreground bg-background text-foreground transition-transform hover:translate-y-[-1px] hover:bg-muted"
        title="Open task details"
        aria-label="Open task details"
      >
        <FaArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export function getTaskSortValue(task: TaskCardTask, key: TaskSortKey): string | number {
  switch (key) {
    case "deathsLockedIn": {
      // Deaths from delay for signer tasks are proportional to share of
      // global military spending → sort by budget to preserve order.
      const budget = getMilitaryBudgetUsd(task);
      if (budget != null) return budget;
      const perDay = task.impact?.selectedFrame?.delayDalysLostPerDayBase;
      return perDay != null ? perDay : 0;
    }
    case "cost": {
      // "Wasted by delay" is proportional to share of global military spending
      // for signer tasks → sorting by assigneeBudget preserves the order.
      // Non-signer tasks fall through to per-day delay econ value.
      const budget = getMilitaryBudgetUsd(task);
      if (budget != null) return budget;
      return task.impact?.selectedFrame?.delayEconomicValueUsdLostPerDayBase ?? 0;
    }
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
