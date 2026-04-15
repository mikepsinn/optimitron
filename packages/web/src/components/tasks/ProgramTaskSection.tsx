import Link from "next/link";
import { LiveCounter } from "@/components/tasks/live-counter";
import { SortableTaskList } from "@/components/tasks/task-list-controls";
import type { TaskCardTask } from "@/components/tasks/task-card";
import { BrutalCard } from "@/components/ui/brutal-card";
import {
  formatCompactCount,
  formatCompactCurrency,
  formatDelayDuration,
  getTaskDelayStats,
} from "@/lib/tasks/accountability";
import {
  DAILY_DISEASE_COST_USD,
  DAILY_DISEASE_DEATHS,
  getTreatyLevelCostOfDelay,
} from "@/lib/tasks/delay-attribution";

export function ProgramCard({ task }: { task: TaskCardTask }) {
  const delayStats = getTaskDelayStats(task);
  const overdueLabel =
    delayStats.isOverdue && delayStats.currentDelayDays > 0
      ? formatDelayDuration(delayStats.currentDelayDays)
      : null;
  const costOfDelay = getTreatyLevelCostOfDelay(delayStats.currentDelayDays);
  const dueMs = task.dueAt?.getTime() ?? null;
  const canTick = dueMs != null && task.dueAt != null && task.dueAt.getTime() < Date.now();

  return (
    <Link href={`/tasks/${task.id}`} className="block">
      <BrutalCard
        bgColor="background"
        padding="lg"
        className="transition-transform hover:translate-x-[-2px] hover:translate-y-[-2px]"
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-2xl font-black uppercase leading-tight sm:text-3xl">
              {task.title}
            </h3>
            {overdueLabel ? (
              <span className="border-2 border-foreground bg-brutal-red px-2 py-0.5 text-xs font-black uppercase tracking-wide text-brutal-red-foreground">
                {overdueLabel} overdue
              </span>
            ) : null}
          </div>
          {costOfDelay ? (
            <div className="flex flex-wrap gap-4 text-sm font-bold">
              <span>
                💀{" "}
                <span className="font-black">
                  {canTick && dueMs != null ? (
                    <LiveCounter
                      ratePerSecond={DAILY_DISEASE_DEATHS / 86400}
                      startMs={dueMs}
                      mode="integer"
                    />
                  ) : (
                    formatCompactCount(costOfDelay.deathsFromDelay)
                  )}
                </span>{" "}
                deaths from delay
              </span>
              <span>
                🔥{" "}
                <span className="font-black">
                  {canTick && dueMs != null ? (
                    <LiveCounter
                      ratePerSecond={DAILY_DISEASE_COST_USD / 86400}
                      startMs={dueMs}
                      mode="currency"
                    />
                  ) : (
                    formatCompactCurrency(costOfDelay.wastedUsd)
                  )}
                </span>{" "}
                wasted by delay
              </span>
            </div>
          ) : null}
        </div>
      </BrutalCard>
    </Link>
  );
}

export function ProgramTaskSection({
  pageSize = 10,
  subtasks,
  subtasksTitle,
  task,
}: {
  pageSize?: number;
  subtasks: TaskCardTask[];
  subtasksTitle?: string;
  task: TaskCardTask;
}) {
  return (
    <div className="space-y-4">
      <ProgramCard task={task} />
      {subtasks.length > 0 ? (
        <div className="ml-2 space-y-3 border-l-4 border-foreground/20 pl-3 sm:ml-6 sm:pl-5">
          {subtasksTitle ? (
            <h2 className="text-lg font-black tracking-tight sm:text-2xl">
              {subtasksTitle}
            </h2>
          ) : null}
          <SortableTaskList
            tasks={subtasks}
            defaultSortKey="assigneeBudget"
            defaultSortDir="desc"
            variant="signer"
            pageSize={pageSize}
          />
        </div>
      ) : null}
    </div>
  );
}
