import type { TaskCardTask } from "@/components/tasks/task-card";
import {
  EARTH_OPTIMIZATION_PRIZE_ROOT_TASK_ID,
  isTreatySignerTaskKeyPrefix,
  TREATY_PARENT_TASK_ID,
} from "@/lib/tasks/task-keys";

interface TaskTreeRoot {
  childTasks?: unknown;
  id: string;
}

export interface PresidentManagementTasks {
  signerTasks: TaskCardTask[];
  treatyProgram: TaskCardTask | null;
}

export function selectTreatyPresidentManagementTasks(data: {
  allTasks: TaskCardTask[];
  topLevelTasks: TaskTreeRoot[];
}): PresidentManagementTasks {
  const prizeRoot = data.topLevelTasks.find(
    (task) => task.id === EARTH_OPTIMIZATION_PRIZE_ROOT_TASK_ID,
  );
  const programChildren = (prizeRoot?.childTasks ?? []) as TaskCardTask[];
  const treatyProgram =
    programChildren.find((task) => task.id === TREATY_PARENT_TASK_ID) ?? null;
  const signerTasks = data.allTasks.filter((task) =>
    isTreatySignerTaskKeyPrefix(task.taskKey),
  );

  return {
    signerTasks,
    treatyProgram,
  };
}

