import { formatDelayDuration, type TaskDelayStats } from "@/lib/tasks/accountability";

interface TaskMetadataTagsProps {
  category: string;
  status: string;
  delayStats: TaskDelayStats;
  dueAt?: Date | null;
}

function formatDueDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Tag({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "overdue" }) {
  const cls = variant === "overdue"
    ? "border-2 border-foreground bg-brutal-red text-brutal-red-foreground px-2 py-0.5"
    : "border-2 border-foreground bg-muted px-2 py-0.5";
  return <span className={cls}>{children}</span>;
}

export function TaskMetadataTags({ category, status, delayStats, dueAt }: TaskMetadataTagsProps) {
  return (
    <div className="flex flex-wrap gap-2 text-xs font-bold uppercase">
      <Tag>{category.toLowerCase()}</Tag>
      <Tag>{status.toLowerCase()}</Tag>
      {delayStats.isOverdue ? (
        <Tag variant="overdue">{`${formatDelayDuration(delayStats.currentDelayDays)} overdue`}</Tag>
      ) : dueAt ? (
        <Tag>{`due ${formatDueDate(dueAt)}`}</Tag>
      ) : null}
    </div>
  );
}
