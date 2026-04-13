import { BrutalCard } from "@/components/ui/brutal-card";
import type { TaskContext } from "@/lib/tasks/task-context";

interface TaskDifficultyStripProps {
  taskTitle: string;
  context: TaskContext;
}

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  return `${(seconds / 3600).toFixed(1)} hours`;
}

export function TaskDifficultyStrip({ taskTitle, context }: TaskDifficultyStripProps) {
  const difficulty = context.difficulty;
  if (!difficulty) return null;

  const rows: Array<{ label: string; value: string }> = [
    { label: "Task", value: taskTitle },
  ];
  if (difficulty.whatItMeans) {
    rows.push({ label: "What It Means", value: difficulty.whatItMeans });
  }
  if (difficulty.label) {
    rows.push({ label: "Difficulty", value: difficulty.label });
  }
  if (difficulty.timeRequiredSeconds != null) {
    rows.push({
      label: "Time Required",
      value: formatSeconds(difficulty.timeRequiredSeconds),
    });
  }
  if (difficulty.skillsRequired) {
    rows.push({ label: "Skills Required", value: difficulty.skillsRequired });
  }

  return (
    <BrutalCard bgColor="background" padding="lg">
      <dl className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-1 gap-1 border-b-2 border-foreground/10 pb-2 last:border-b-0 last:pb-0 sm:grid-cols-[12rem_1fr] sm:gap-4"
          >
            <dt className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
              {row.label}
            </dt>
            <dd className="text-sm font-bold">{row.value}</dd>
          </div>
        ))}
      </dl>
    </BrutalCard>
  );
}
