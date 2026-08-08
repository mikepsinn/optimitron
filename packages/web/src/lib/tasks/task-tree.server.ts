import type { Prisma } from "@optimitron/db";
import { TaskEdgeType } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { impactEstimateSetSelect } from "@/lib/tasks.server";
import { selectImpactFrame } from "@/lib/tasks/impact";
import { getTaskVisibilityWhere } from "@/lib/tasks/task-visibility.server";
import { getRootedTaskIds } from "@/lib/tasks/execution-planner-audit";
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
      edgeType: { in: [TaskEdgeType.BLOCKS, TaskEdgeType.DEPENDS_ON] },
    },
    select: {
      fromTask: {
        select: { status: true },
      },
    },
  },
  isPublic: true,
  // Titles of the other goals this task serves. Rendered as a flat chip on the
  // node, never as extra tree nodes: buildTaskTree and countTaskTreeNodes both
  // assume one path per task, so nesting an edged task under a second parent
  // would render it twice and inflate visibleTaskCount.
  outgoingEdges: {
    where: {
      deletedAt: null,
      edgeType: {
        in: [TaskEdgeType.INCREASES_PROBABILITY_OF, TaskEdgeType.ACCELERATES],
      },
    },
    select: {
      toTask: { select: { id: true, isPublic: true, title: true } },
    },
  },
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

  // Visibility alone is not enough: buildTaskTree drops anything that cannot
  // reach the Optimize Earth root, so a task can be readable and still absent
  // from the rendered tree. Use the same reachability rule the tree itself
  // uses, or the chip names goals the reader cannot find.
  const rootedTaskIds = getRootedTaskIds(
    // getRootedTaskIds only walks id/parentTaskId; the rest of
    // ExecutionGraphTask is queue bookkeeping it never reads here. Filled with
    // inert values rather than re-implementing reachability, so there stays
    // exactly one definition of "reaches the root".
    tasks.map((task) => ({
      activeChildTaskCount: 0,
      hasMarginalEstimate: false,
      id: task.id,
      parentTaskId: task.parentTaskId,
    })),
    OPTIMIZE_EARTH_ROOT_TASK_ID,
  );

  const flatTasks = tasks.map((task) => ({
    alsoServes: task.outgoingEdges
      .filter((edge) => rootedTaskIds.has(edge.toTask.id))
      .map((edge) => edge.toTask.title),
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
