import { TaskKind } from "@optimitron/db";

export const OPTIMIZE_EARTH_ROOT_TASK_ID = "optimize-earth";

export interface ExecutionGraphTask {
  activeChildTaskCount: number;
  hasMarginalEstimate: boolean;
  id: string;
  kind: TaskKind | string | null;
  parentTaskId: string | null;
  priority?: number | null;
  queueEligible?: boolean;
}

export interface ExecutionGraphEdge {
  edgeType:
    | "DEPENDS_ON"
    | "BLOCKS"
    | "INCREASES_PROBABILITY_OF"
    | "ACCELERATES"
    | string;
  fromTaskId: string;
  probabilityDeltaBase?: number | null;
  timeDeltaDaysBase?: number | null;
  toTaskId: string;
}

export interface ExecutionGraphFinding {
  code: string;
  message: string;
  severity: "high" | "medium" | "low";
  taskId?: string;
}

function findDirectedCycle(
  nodeIds: readonly string[],
  neighbors: (nodeId: string) => readonly string[],
) {
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(nodeId: string): string | null {
    if (visiting.has(nodeId)) return nodeId;
    if (visited.has(nodeId)) return null;
    visiting.add(nodeId);
    for (const neighbor of neighbors(nodeId)) {
      const cycleNode = visit(neighbor);
      if (cycleNode) return cycleNode;
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
    return null;
  }

  for (const nodeId of nodeIds) {
    const cycleNode = visit(nodeId);
    if (cycleNode) return cycleNode;
  }
  return null;
}

function reachesRoot(
  taskId: string,
  taskById: ReadonlyMap<string, ExecutionGraphTask>,
  rootTaskId: string,
) {
  const seen = new Set<string>();
  let currentId: string | null = taskId;
  while (currentId) {
    if (currentId === rootTaskId) return true;
    if (seen.has(currentId)) return false;
    seen.add(currentId);
    currentId = taskById.get(currentId)?.parentTaskId ?? null;
  }
  return false;
}

export function getRootedTaskIds(
  tasks: ExecutionGraphTask[],
  rootTaskId = OPTIMIZE_EARTH_ROOT_TASK_ID,
) {
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  if (taskById.get(rootTaskId)?.kind !== TaskKind.PROJECT) {
    return new Set<string>();
  }
  return new Set(
    tasks
      .filter((task) => reachesRoot(task.id, taskById, rootTaskId))
      .map((task) => task.id),
  );
}

export function auditExecutionGraph(input: {
  edges: ExecutionGraphEdge[];
  rootTaskId?: string;
  tasks: ExecutionGraphTask[];
}) {
  const rootTaskId = input.rootTaskId ?? OPTIMIZE_EARTH_ROOT_TASK_ID;
  const taskById = new Map(input.tasks.map((task) => [task.id, task]));
  const rootedTaskIds = getRootedTaskIds(input.tasks, rootTaskId);
  const findings: ExecutionGraphFinding[] = [];
  const rootTask = taskById.get(rootTaskId);
  if (!rootTask) {
    findings.push({
      code: "MISSING_ROOT",
      message: `The Optimize Earth root task ${rootTaskId} is missing.`,
      severity: "high",
      taskId: rootTaskId,
    });
  } else if (rootTask.kind !== TaskKind.PROJECT) {
    findings.push({
      code: "ROOT_NOT_PROJECT",
      message: `The Optimize Earth root task ${rootTaskId} must be a PROJECT.`,
      severity: "high",
      taskId: rootTaskId,
    });
  }

  const parentCycle = findDirectedCycle(
    input.tasks.map((task) => task.id),
    (taskId) => {
      const parentTaskId = taskById.get(taskId)?.parentTaskId;
      return parentTaskId ? [parentTaskId] : [];
    },
  );
  if (parentCycle) {
    findings.push({
      code: "PARENT_CYCLE",
      message: `Task ${parentCycle} participates in a parent-tree cycle.`,
      severity: "high",
      taskId: parentCycle,
    });
  }

  const outgoingDependencies = new Map<string, string[]>();
  for (const edge of input.edges) {
    if (edge.edgeType !== "DEPENDS_ON" && edge.edgeType !== "BLOCKS") continue;
    const neighbors = outgoingDependencies.get(edge.fromTaskId) ?? [];
    neighbors.push(edge.toTaskId);
    outgoingDependencies.set(edge.fromTaskId, neighbors);
  }
  const dependencyCycle = findDirectedCycle(
    input.tasks.map((task) => task.id),
    (taskId) => outgoingDependencies.get(taskId) ?? [],
  );
  if (dependencyCycle) {
    findings.push({
      code: "DEPENDENCY_CYCLE",
      message: `Task ${dependencyCycle} participates in a dependency cycle.`,
      severity: "high",
      taskId: dependencyCycle,
    });
  }

  for (const task of input.tasks) {
    if (task.id !== rootTaskId && !rootedTaskIds.has(task.id)) {
      findings.push({
        code: "UNROOTED_TASK",
        message: `Task ${task.id} does not reach the Optimize Earth root through parentTaskId.`,
        severity: "high",
        taskId: task.id,
      });
    }
    if (task.queueEligible && task.activeChildTaskCount > 0) {
      findings.push({
        code: "EXECUTABLE_PARENT",
        message: `Task ${task.id} has child tasks but entered an execution queue.`,
        severity: "high",
        taskId: task.id,
      });
    }
    if (task.queueEligible && task.kind !== TaskKind.TASK) {
      findings.push({
        code: "PROJECT_IN_QUEUE",
        message: `Non-TASK row ${task.id} entered an execution queue.`,
        severity: "high",
        taskId: task.id,
      });
    }
    if (
      task.kind === TaskKind.TASK &&
      task.activeChildTaskCount === 0 &&
      !task.hasMarginalEstimate
    ) {
      findings.push({
        code: "MISSING_MARGINAL_ESTIMATE",
        message: `Atomic task ${task.id} has no direct or explicitly edge-derived marginal estimate.`,
        severity: "medium",
        taskId: task.id,
      });
    }
  }

  for (const edge of input.edges) {
    const invalidProbabilityDelta =
      edge.edgeType === "INCREASES_PROBABILITY_OF" &&
      typeof edge.probabilityDeltaBase === "number" &&
      (!Number.isFinite(edge.probabilityDeltaBase) ||
        edge.probabilityDeltaBase < 0 ||
        edge.probabilityDeltaBase > 1);
    const invalidTimeDelta =
      edge.edgeType === "ACCELERATES" &&
      typeof edge.timeDeltaDaysBase === "number" &&
      (!Number.isFinite(edge.timeDeltaDaysBase) || edge.timeDeltaDaysBase < 0);
    if (invalidProbabilityDelta || invalidTimeDelta) {
      findings.push({
        code: "INVALID_VALUE_EDGE",
        message: `Value edge ${edge.fromTaskId} -> ${edge.toTaskId} has an invalid base contribution. Probability lifts must be at most 1 and all contributions must be finite.`,
        severity: "high",
        taskId: edge.fromTaskId,
      });
      continue;
    }
    const missingProbabilityDelta =
      edge.edgeType === "INCREASES_PROBABILITY_OF" &&
      !(
        typeof edge.probabilityDeltaBase === "number" &&
        edge.probabilityDeltaBase > 0
      );
    const missingTimeDelta =
      edge.edgeType === "ACCELERATES" &&
      !(
        typeof edge.timeDeltaDaysBase === "number" && edge.timeDeltaDaysBase > 0
      );
    if (missingProbabilityDelta || missingTimeDelta) {
      findings.push({
        code: "UNANNOTATED_VALUE_EDGE",
        message: `Value edge ${edge.fromTaskId} -> ${edge.toTaskId} has no positive base contribution and therefore inherits no value.`,
        severity: "medium",
        taskId: edge.fromTaskId,
      });
    }
  }

  const queueTasks = input.tasks.filter((task) => task.queueEligible);
  const tieKeys = new Map<string, string>();
  for (const task of queueTasks) {
    if (!Number.isFinite(task.priority)) continue;
    const key = `${task.priority}:${task.id}`;
    const priorTaskId = tieKeys.get(key);
    if (priorTaskId) {
      findings.push({
        code: "NONDETERMINISTIC_TIE",
        message: `Tasks ${priorTaskId} and ${task.id} have the same priority and stable tie-break key.`,
        severity: "high",
        taskId: task.id,
      });
    }
    tieKeys.set(key, task.id);
  }

  return findings.sort((left, right) => {
    const severityRank = { high: 0, medium: 1, low: 2 } as const;
    const severityDifference =
      severityRank[left.severity] - severityRank[right.severity];
    if (severityDifference !== 0) return severityDifference;
    if (left.code !== right.code) return left.code.localeCompare(right.code);
    return (left.taskId ?? "").localeCompare(right.taskId ?? "");
  });
}
