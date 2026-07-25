import type {
  PersonalQueueAuditResult,
  PersonalQueueResult,
  PersonalQueueRow,
} from "@/lib/tasks/personal-planning.server";

// Serializable projection of PersonalQueueRow for the dashboard. Rows are
// mapped 1:1 in queue order, so the section renders exactly the ordering
// loadPersonalQueue (and therefore MCP getMyQueue) returns.
export interface PersonalQueueDisplayRow {
  blockersCount: number;
  blockersResolved: number;
  cashCost: number;
  deadlinePolicy: string;
  deadlineRationale: string | null;
  deadlineStatus: string;
  evMath: string;
  hours: number | null;
  id: string;
  pSuccess: number | null;
  priority: number;
  timeUntilDueHours: number | null;
  title: string;
  value: number | null;
}

export interface PersonalQueueDisplayIssue {
  code: string;
  message: string;
  severity: "high" | "medium" | "low";
  taskId?: string;
}

export interface PersonalQueueDisplayData {
  buybackRate: number;
  issues: PersonalQueueDisplayIssue[];
  rows: PersonalQueueDisplayRow[];
}

export function toPersonalQueueDisplayData(
  queue: PersonalQueueResult,
  audit: PersonalQueueAuditResult,
): PersonalQueueDisplayData {
  return {
    buybackRate: queue.buybackRate,
    issues: audit.issues,
    rows: queue.queue.map((row: PersonalQueueRow) => ({
      blockersCount: row.blockersCount,
      blockersResolved: row.blockersResolved,
      cashCost: row.cashCost,
      deadlinePolicy: row.deadlinePolicy,
      deadlineRationale: row.deadlineRationale,
      deadlineStatus: row.deadlineStatus,
      evMath: row.evMath,
      hours: row.hours,
      id: row.id,
      pSuccess: row.pSuccess,
      priority: row.priority,
      timeUntilDueHours: row.timeUntilDueHours,
      title: row.title,
      value: row.value,
    })),
  };
}

// Collapsed-state summary for the data-issues disclosure, e.g. "1 high · 2 low".
// Severity counts are already in memory, so this costs nothing extra.
export function summarizeIssueSeverities(
  issues: PersonalQueueDisplayIssue[],
): string | null {
  if (issues.length === 0) return null;
  const order = ["high", "medium", "low"] as const;
  const counts = new Map<string, number>();
  for (const issue of issues) {
    counts.set(issue.severity, (counts.get(issue.severity) ?? 0) + 1);
  }
  return order
    .filter((severity) => counts.has(severity))
    .map((severity) => `${counts.get(severity)} ${severity}`)
    .join(" · ");
}

export interface DeadlineChip {
  label: string;
  urgent: boolean;
}

// Why a row may outrank higher-EV rows: required/expiring deadlines override
// pure EV ordering once waiting would miss them.
export function deadlineChip(row: {
  deadlineStatus: string;
  timeUntilDueHours: number | null;
}): DeadlineChip | null {
  switch (row.deadlineStatus) {
    case "missed":
      return { label: "required deadline missed", urgent: true };
    case "overdue":
      return { label: "overdue", urgent: true };
    case "start_now":
      return { label: "start now to make the deadline", urgent: true };
    case "expired":
      return { label: "expired", urgent: false };
    case "future":
      return row.timeUntilDueHours == null
        ? null
        : { label: `due in ${formatDuration(row.timeUntilDueHours)}`, urgent: false };
    default:
      return null;
  }
}

export function formatDuration(hours: number): string {
  if (hours < 1) return "under an hour";
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

const usdPerHour = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

export function formatPriority(priority: number): string {
  return `${usdPerHour.format(priority)}/hr`;
}
