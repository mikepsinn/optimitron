import Link from "next/link";
import { ShareOverdueListButtons } from "@/components/tasks/ShareOverdueListButtons";
import { ArcadeTag } from "@/components/ui/arcade-tag";
import { BrutalCard } from "@/components/ui/brutal-card";
import { GameCTA } from "@/components/ui/game-cta";
import { Progress } from "@/components/retroui/Progress";
import { getTaskDescriptionSummary } from "@/components/tasks/task-description";
import {
  aggregateTaskDelayStats,
  formatCompactCount,
  formatCompactCurrency,
} from "@/lib/tasks/accountability";
import { getConfiguredSiteOrigin } from "@/lib/site";
import { getTaskPath, ROUTES } from "@/lib/routes";
import type { TaskCardTask } from "./task-card";

interface TopTaskCardProps {
  task: TaskCardTask & {
    childTasks: TaskCardTask[];
  };
}

export function TopTaskCard({ task }: TopTaskCardProps) {
  const total = task.childTasks.length;
  const completed = task.childTasks.filter(
    (t) => t.completedAt != null || t.status === "VERIFIED",
  ).length;
  const progressPct = total > 0 ? (completed / total) * 100 : 0;
  const delaySummary = aggregateTaskDelayStats(task.childTasks);
  const tasksUrl = `${getConfiguredSiteOrigin({ allowLocalFallback: true })}${ROUTES.tasks}`;

  return (
    <BrutalCard bgColor="pink" padding="lg" shadowSize={8} hover>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <ArcadeTag>{task.category.toLowerCase()}</ArcadeTag>
          {total > 0 ? (
            <ArcadeTag>{`${completed} / ${total} subtasks completed`}</ArcadeTag>
          ) : null}
        </div>

        <Link href={getTaskPath(task.id)}>
          <h2 className="text-2xl font-black uppercase leading-tight hover:underline sm:text-3xl">
            {task.title}
          </h2>
        </Link>

        <p className="max-w-3xl text-sm font-bold leading-7 text-muted-foreground">
          {getTaskDescriptionSummary(task.description, 300)}
        </p>

        {total > 0 ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-black uppercase">
              <span>Progress</span>
              <span>{`${completed} / ${total}`}</span>
            </div>
            <Progress value={progressPct} className="h-4" />
          </div>
        ) : null}

        {delaySummary.overdueTaskCount > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border-4 border-foreground bg-background p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brutal-red">
                Deaths From Delay
              </p>
              <p className="mt-1 text-2xl font-black uppercase text-foreground">
                {formatCompactCount(delaySummary.currentHumanLivesLost)}
              </p>
            </div>
            <div className="border-4 border-foreground bg-background p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brutal-red">
                Suffering-Hours
              </p>
              <p className="mt-1 text-2xl font-black uppercase text-foreground">
                {formatCompactCount(delaySummary.currentSufferingHoursLost)}
              </p>
            </div>
            <div className="border-4 border-foreground bg-background p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brutal-red">
                Economic Loss
              </p>
              <p className="mt-1 text-2xl font-black uppercase text-foreground">
                {formatCompactCurrency(delaySummary.currentEconomicValueUsdLost)}
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <GameCTA href={getTaskPath(task.id)} size="sm">
            View Subtasks
          </GameCTA>
          <ShareOverdueListButtons
            economicLoss={formatCompactCurrency(delaySummary.currentEconomicValueUsdLost)}
            livesLost={formatCompactCount(delaySummary.currentHumanLivesLost)}
            overdueCount={delaySummary.overdueTaskCount}
            tasksUrl={tasksUrl}
            variant="icon"
          />
        </div>
      </div>
    </BrutalCard>
  );
}
