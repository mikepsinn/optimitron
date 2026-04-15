import { ProgramTaskSection } from "@/components/tasks/ProgramTaskSection";
import type { TaskCardTask } from "@/components/tasks/task-card";
import { TasksRootIntro } from "@/components/tasks/TasksRootIntro";

interface ReferendumSiteDashboardClientProps {
  task: TaskCardTask | null;
  subtasks: TaskCardTask[];
}

export function ReferendumSiteDashboardClient({
  task,
  subtasks,
}: ReferendumSiteDashboardClientProps) {
  if (!task) return null;
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="text-center">
        <TasksRootIntro />
      </div>
      <ProgramTaskSection
        task={task}
        subtasks={subtasks}
        subtasksTitle={
          subtasks.length > 0
            ? `↳ ${subtasks.length} employees have overdue tasks`
            : undefined
        }
      />
    </div>
  );
}
