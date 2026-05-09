import type { TaskCardTask } from "@/components/tasks/task-card";
import {
  isTreatySignerTaskKeyPrefix,
  OPTIMIZE_EARTH_ROOT_TASK_ID,
  TREATY_PARENT_TASK_ID,
  TREATY_PARENT_TASK_KEY,
} from "@/lib/tasks/task-keys";

interface TaskTreeRoot {
  childTasks?: TaskCardTask[] | null;
  id: string;
  taskKey?: string | null;
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
    (task) => task.id === OPTIMIZE_EARTH_ROOT_TASK_ID,
  );
  const preferredProgramChildren = Array.isArray(prizeRoot?.childTasks)
    ? prizeRoot.childTasks
    : [];
  const allProgramChildren = data.topLevelTasks.flatMap((task) =>
    Array.isArray(task.childTasks) ? task.childTasks : [],
  );
  const treatyProgram =
    preferredProgramChildren.find(isTreatyParentTask) ??
    allProgramChildren.find(isTreatyParentTask) ??
    data.allTasks.find(isTreatyParentTask) ??
    null;
  const signerTasks = data.allTasks.filter((task) =>
    isTreatySignerTaskKeyPrefix(task.taskKey),
  );

  return {
    signerTasks,
    treatyProgram,
  };
}

function isTreatyParentTask(task: { id: string; taskKey?: string | null }) {
  return (
    task.id === TREATY_PARENT_TASK_ID ||
    task.taskKey === TREATY_PARENT_TASK_KEY
  );
}
