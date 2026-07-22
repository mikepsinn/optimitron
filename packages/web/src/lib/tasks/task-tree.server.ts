import type { Prisma } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { impactEstimateSetSelect } from "@/lib/tasks.server";
import { selectImpactFrame } from "@/lib/tasks/impact";
import { getTaskVisibilityWhere } from "@/lib/tasks/task-visibility.server";
import { OPTIMIZE_EARTH_ROOT_TASK_ID } from "@/lib/tasks/task-keys";
import {
  buildTaskTree,
  countTaskTreeNodes,
  type TaskTreeNode,
} from "@/lib/tasks/task-tree";

const taskTreeSelect = {
  createdAt: true,
  currentImpactEstimateSet: {
    select: impactEstimateSetSelect,
  },
  dueAt: true,
  estimatedEffortHours: true,
  id: true,
  // Only the statuses of blocking/depends-on predecessors are needed for the
  // priority formula's blocker count — matches taskListSelect.incomingEdges
  // but without the assignee/impact joins that select brings in.
  incomingEdges: {
    where: {
      deletedAt: null,
      edgeType: { in: ["BLOCKS", "DEPENDS_ON"] },
    },
    select: {
      fromTask: {
        select: { status: true },
      },
    },
  },
  isPublic: true,
  parentTaskId: true,
  sortOrder: true,
  status: true,
  taskKey: true,
  title: true,
} satisfies Prisma.TaskSelect;

export interface TaskTreePageData {
  root: TaskTreeNode | null;
  totalTaskCount: number;
  visibleTaskCount: number;
}

export async function getTaskTreePageData(
  userId?: string | null,
): Promise<TaskTreePageData> {
  const viewer = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { personId: true },
      })
    : null;

  const tasks = await prisma.task.findMany({
    where: getTaskVisibilityWhere({
      personId: viewer?.personId ?? null,
      userId: userId ?? undefined,
      visibility: userId ? "accessible" : "public",
    }),
    select: taskTreeSelect,
  });

  const flatTasks = tasks.map((task) => ({
    blockerStatuses: task.incomingEdges.map((edge) => edge.fromTask.status),
    createdAt: task.createdAt,
    dueAt: task.dueAt,
    estimatedEffortHours: task.estimatedEffortHours,
    id: task.id,
    isPublic: task.isPublic,
    parentTaskId: task.parentTaskId,
    selectedImpactFrame: selectImpactFrame(task.currentImpactEstimateSet)
      .selectedFrame,
    sortOrder: task.sortOrder,
    status: task.status,
    taskKey: task.taskKey,
    title: task.title,
  }));

  const root = buildTaskTree(flatTasks, OPTIMIZE_EARTH_ROOT_TASK_ID);

  return {
    root,
    totalTaskCount: flatTasks.length,
    visibleTaskCount: root ? countTaskTreeNodes(root) : 0,
  };
}
