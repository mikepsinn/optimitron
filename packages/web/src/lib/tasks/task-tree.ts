import type { TaskStatus } from "@optimitron/db";
import { VALUE_IF_ACHIEVED_USD_METRIC_KEY } from "@optimitron/data/parameters";
import { getRootedTaskIds } from "@/lib/tasks/execution-planner-audit";
import { computeTaskPriority } from "@/lib/tasks/rank-tasks";
import {
  getMetricBaseValue,
  type TaskImpactFrameSummary,
} from "@/lib/tasks/impact";

/**
 * Minimal per-task shape the tree builder needs. Deliberately narrower than
 * `TaskListItem` — the /tasks/tree page only renders title, status, and the
 * task's own EV numbers, so the server query stays lean for ~100 nodes.
 */
export interface TaskTreeFlatTask {
  /**
   * Titles of other goals this task advances via a value edge. Display only —
   * the task still appears exactly once in the tree, under its single
   * parentTaskId, so nothing here affects counts or roll-ups.
   */
  alsoServes?: string[];
  blockerStatuses: TaskStatus[];
  createdAt: Date | string;
  dueAt: Date | string | null;
  estimatedEffortHours: number | null;
  id: string;
  isPublic: boolean;
  parentTaskId: string | null;
  selectedImpactFrame: TaskImpactFrameSummary | null;
  sortOrder: number | null;
  status: TaskStatus;
  taskKey: string | null;
  title: string;
}

export interface TaskTreeNode extends TaskTreeFlatTask {
  children: TaskTreeNode[];
  /** False when the priority formula is missing a required input (no direct
   * EV estimate or no effort-hours estimate). Only `priority` is unusable when
   * this is false. Read `hasEvEstimate` before treating `realEv` as measured. */
  evValid: boolean;
  /** True when the task carries a real expected-value number, independent of
   * whether it also carries the effort estimate `priority` needs. Mission
   * outcome values use `valueIfAchievedUsd` instead. */
  hasEvEstimate: boolean;
  priority: number;
  realEv: number;
  /** Mission outcome value under its stated scenario. This is not expected
   * value and never enters executable-task priority. */
  valueIfAchievedUsd: number | null;
}

function sortSiblings(left: TaskTreeFlatTask, right: TaskTreeFlatTask) {
  const leftOrder = left.sortOrder ?? 0;
  const rightOrder = right.sortOrder ?? 0;
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;

  const leftCreatedAt = new Date(left.createdAt).getTime();
  const rightCreatedAt = new Date(right.createdAt).getTime();
  if (leftCreatedAt !== rightCreatedAt) return leftCreatedAt - rightCreatedAt;

  return left.id.localeCompare(right.id);
}

/**
 * Nest a flat, viewer-scoped task list into a tree rooted at `rootTaskId`.
 *
 * Tasks that don't reach the root through `parentTaskId` — a private
 * ancestor the viewer can't see, an orphaned row, or a parent-chain cycle —
 * are dropped rather than silently re-parented to the root. Reuses the same
 * cycle-safe reachability check (`getRootedTaskIds`) the execution-graph
 * auditor uses, so "reaches the Optimize Earth root" has one definition.
 *
 * Returns null when `rootTaskId` itself isn't present/visible in `tasks`.
 */
export function buildTaskTree(
  tasks: readonly TaskTreeFlatTask[],
  rootTaskId: string,
): TaskTreeNode | null {
  const rootTask = tasks.find((task) => task.id === rootTaskId);
  if (!rootTask) {
    return null;
  }

  const rootedIds = getRootedTaskIds(
    tasks.map((task) => ({
      activeChildTaskCount: 0,
      hasMarginalEstimate: true,
      id: task.id,
      parentTaskId: task.parentTaskId,
    })),
    rootTaskId,
  );

  const childrenByParentId = new Map<string, TaskTreeFlatTask[]>();
  for (const task of tasks) {
    if (task.parentTaskId == null || !rootedIds.has(task.id)) {
      continue;
    }
    const siblings = childrenByParentId.get(task.parentTaskId) ?? [];
    siblings.push(task);
    childrenByParentId.set(task.parentTaskId, siblings);
  }

  function toNode(task: TaskTreeFlatTask): TaskTreeNode {
    const children = (childrenByParentId.get(task.id) ?? [])
      .slice()
      .sort(sortSiblings)
      .map(toNode);
    const valueIfAchievedUsd = task.selectedImpactFrame
      ? getMetricBaseValue(
          task.selectedImpactFrame.metrics,
          VALUE_IF_ACHIEVED_USD_METRIC_KEY,
        )
      : null;

    // A mission outcome is not executable work. Do not run its scenario value
    // through the task priority formula, even if a malformed frame also carries
    // an expectedEconomicValueUsd value or effort estimate.
    if (valueIfAchievedUsd != null) {
      return {
        ...task,
        children,
        evValid: false,
        hasEvEstimate: false,
        priority: 0,
        realEv: 0,
        valueIfAchievedUsd,
      };
    }

    const { priority, realEv, valid } = computeTaskPriority({
      blockerStatuses: task.blockerStatuses,
      dueAt: task.dueAt,
      estimatedEffortHours: task.estimatedEffortHours,
      selectedImpactFrame: task.selectedImpactFrame,
    });
    // `valid` only means the priority formula's denominator was usable — it
    // stays true even when there's no direct EV estimate at all (realEv then
    // defaults to 0). Require the estimate to actually be present so a
    // missing number isn't rendered as a measured zero.
    const hasDirectEvEstimate =
      task.selectedImpactFrame?.expectedEconomicValueUsdBase != null;

    return {
      ...task,
      children,
      evValid: valid && hasDirectEvEstimate,
      hasEvEstimate: hasDirectEvEstimate,
      priority,
      realEv,
      valueIfAchievedUsd: null,
    };
  }

  return toNode(rootTask);
}

/** Total node count in a built tree, including the root. Used for the "N
 * tasks" summary line without a second pass over the flat list. */
export function countTaskTreeNodes(node: TaskTreeNode): number {
  return (
    1 +
    node.children.reduce((total, child) => total + countTaskTreeNodes(child), 0)
  );
}
