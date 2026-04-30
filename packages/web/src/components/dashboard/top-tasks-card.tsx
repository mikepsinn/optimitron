import Link from "next/link";
import type { TaskDifficulty } from "@optimitron/db";
import { TaskClaimButton } from "@/components/tasks/TaskClaimButton";
import { ArcadeTag } from "@/components/ui/arcade-tag";
import { BrutalCard } from "@/components/ui/brutal-card";
import { getTaskPath, ROUTES } from "@/lib/routes";

interface TopTask {
  canClaim: boolean;
  description: string;
  difficulty: TaskDifficulty;
  estimatedEffortHours: number | null;
  id: string;
  title: string;
  viewerHasClaim: boolean;
}

export function TopTasksCard({ tasks }: { tasks: TopTask[] }) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <BrutalCard bgColor="yellow" padding="lg">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <ArcadeTag>For You</ArcadeTag>
            <h2 className="text-3xl font-black uppercase">Top Tasks</h2>
            <p className="text-sm font-bold text-muted-foreground">
              Highest-fit claimable tasks based on your current profile.
            </p>
          </div>
          <Link className="text-sm font-black uppercase underline underline-offset-4" href={ROUTES.tasks}>
            Open Tasks
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-md border-4 border-primary bg-background p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="mb-3 flex flex-wrap gap-2">
                <ArcadeTag>{task.difficulty.toLowerCase()}</ArcadeTag>
                {task.estimatedEffortHours != null ? (
                  <ArcadeTag>{`${task.estimatedEffortHours}h`}</ArcadeTag>
                ) : null}
              </div>
              <h3 className="mb-2 text-xl font-black uppercase">{task.title}</h3>
              <p className="mb-4 text-sm font-bold text-muted-foreground">
                {task.description}
              </p>
              <div className="flex flex-wrap gap-3">
                <TaskClaimButton
                  canClaim={task.canClaim}
                  signedIn
                  signInHref={ROUTES.tasks}
                  taskId={task.id}
                  viewerHasClaim={task.viewerHasClaim}
                />
                <Link
                  className="text-sm font-black uppercase underline underline-offset-4"
                  href={getTaskPath(task.id)}
                >
                  Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </BrutalCard>
    </div>
  );
}
