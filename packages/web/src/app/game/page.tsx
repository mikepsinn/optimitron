import { EarthOptimizationGameLandingPage } from "@/components/site/EarthOptimizationGameLandingPage";
import { getRouteMetadata } from "@/lib/metadata";
import { gameLink } from "@/lib/routes";
import { getTaskDetailData } from "@/lib/tasks.server";
import { TREATY_PARENT_TASK_ID } from "@/lib/tasks/task-keys";
import type { TaskCardTask } from "@/components/tasks/task-card";

export const metadata = getRouteMetadata(gameLink);

export default async function GamePage() {
  const treatyParentTask = await getTaskDetailData(TREATY_PARENT_TASK_ID, null);
  const lateEmployeeProgramTask =
    (treatyParentTask?.task ?? null) as TaskCardTask | null;
  const lateEmployeeTasks = (treatyParentTask?.task?.childTasks ??
    []) as unknown as TaskCardTask[];

  return (
    <EarthOptimizationGameLandingPage
      lateEmployeeProgramTask={lateEmployeeProgramTask}
      lateEmployeeTasks={lateEmployeeTasks}
    />
  );
}
