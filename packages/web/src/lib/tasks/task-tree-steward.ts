import { taskGovernanceFingerprint } from "@optimitron/agent";
import {
  TaskCategory,
  TaskClaimPolicy,
  TaskExecutionMode,
  TaskStatus,
} from "@optimitron/db/enums";
import {
  auditExecutionGraph,
  getRootedTaskIds,
  OPTIMIZE_EARTH_ROOT_TASK_ID,
  type ExecutionGraphEdge,
} from "./execution-planner-audit";
import {
  isBoundedAgentTaskEffort,
  MAX_AGENT_TASK_EFFORT_HOURS,
} from "./execution-eligibility";

export interface TaskTreeStewardTask {
  activeChildTaskCount: number;
  activeCandidateMatchCount: number;
  assigneeOrganizationId: string | null;
  assigneePersonId: string | null;
  category: TaskCategory;
  claimPolicy: TaskClaimPolicy;
  contextJson?: unknown;
  description: string;
  estimatePublicationEligible?: boolean;
  estimatedEffortHours: number | null;
  executionMode: TaskExecutionMode;
  hasMarginalEstimate: boolean;
  hasSourceUrl: boolean;
  id: string;
  isPublic: boolean;
  parentTaskId: string | null;
  preferredSkillTags?: string[];
  requiredAccessTags?: string[];
  requiredCredentialTags?: string[];
  requiredToolTags?: string[];
  roleTitle: string | null;
  skillTags?: string[];
  sourceArtifactCount: number;
  status: TaskStatus;
  taskKey: string | null;
  title: string;
}

export type TaskTreeStewardSeverity = "high" | "medium" | "low";

export interface TaskTreeStewardFinding {
  code: string;
  issueKey: string;
  message: string;
  recommendedAction: string;
  relatedTaskIds: string[];
  requiresApproval: boolean;
  severity: TaskTreeStewardSeverity;
  taskId?: string;
}

export interface TaskTreeStewardAudit {
  complete: boolean;
  issues: TaskTreeStewardFinding[];
  nextCursor: string | null;
  rootTaskId: string;
  summary: {
    activeLeafTasks: number;
    activeTasks: number;
    agentExecutableLeaves: number;
    duplicateGroups: number;
    highSeverityIssues: number;
    issueCount: number;
    rootedTasks: number;
    tasksNeedingCandidateResearch: number;
    totalTasks: number;
    unrootedTasks: number;
  };
}

interface FindingInput {
  code: string;
  message: string;
  recommendedAction: string;
  relatedTaskIds?: string[];
  requiresApproval: boolean;
  severity: TaskTreeStewardSeverity;
  taskId?: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function hasAcceptanceCriteria(task: TaskTreeStewardTask) {
  const criteria = asRecord(task.contextJson).acceptanceCriteria;
  if (
    Array.isArray(criteria) &&
    criteria.some((item) => typeof item === "string" && item.trim().length > 0)
  ) {
    return true;
  }
  return /(^|\n)\s*(acceptance criteria|done when|deliverable)\s*:?/im.test(
    task.description,
  );
}

function isAgentTask(task: TaskTreeStewardTask) {
  const executorType = asRecord(task.contextJson).executor_type;
  return task.executionMode === TaskExecutionMode.AGENT_ONLY || executorType === "AI Agent";
}

function hasRoutingTags(task: TaskTreeStewardTask) {
  return [
    task.skillTags,
    task.preferredSkillTags,
    task.requiredAccessTags,
    task.requiredCredentialTags,
    task.requiredToolTags,
  ].some((values) => (values?.length ?? 0) > 0);
}

function issueKey(finding: FindingInput) {
  return [
    finding.severity,
    finding.code,
    finding.taskId ?? "",
    ...(finding.relatedTaskIds ?? []),
  ].join(":");
}

function addFinding(findings: TaskTreeStewardFinding[], finding: FindingInput) {
  const relatedTaskIds = Array.from(
    new Set(finding.relatedTaskIds ?? []),
  ).sort();
  findings.push({
    ...finding,
    issueKey: issueKey({ ...finding, relatedTaskIds }),
    relatedTaskIds,
  });
}

function recommendationForGraphFinding(code: string) {
  switch (code) {
    case "MISSING_ROOT":
      return "Restore the managed Optimize Earth root before changing descendants.";
    case "PARENT_CYCLE":
    case "DEPENDENCY_CYCLE":
      return "Prepare a cycle-breaking proposal with the exact edge to remove.";
    case "UNROOTED_TASK":
      return "Research the closest valid program parent and prepare a reparent proposal.";
    case "MISSING_MARGINAL_ESTIMATE":
      return "Prepare a sourced marginal estimate for review.";
    case "UNREVIEWED_PUBLIC_ESTIMATE":
      return "Send the estimate through review before using it on a public task.";
    case "INVALID_VALUE_EDGE":
    case "UNANNOTATED_VALUE_EDGE":
      return "Prepare a sourced correction to the edge contribution.";
    default:
      return "Inspect the graph invariant and prepare the smallest safe correction.";
  }
}

function graphFindingRequiresApproval(code: string) {
  return code !== "EXECUTABLE_PARENT";
}

export function auditTaskTree(input: {
  cursor?: string | null;
  edges: ExecutionGraphEdge[];
  limit?: number;
  rootTaskId?: string;
  tasks: TaskTreeStewardTask[];
}): TaskTreeStewardAudit {
  const rootTaskId = input.rootTaskId ?? OPTIMIZE_EARTH_ROOT_TASK_ID;
  const limit = Math.min(Math.max(Math.trunc(input.limit ?? 100), 1), 500);
  const taskById = new Map(input.tasks.map((task) => [task.id, task]));
  const rootedTaskIds = getRootedTaskIds(input.tasks, rootTaskId);
  const findings: TaskTreeStewardFinding[] = [];

  for (const finding of auditExecutionGraph({
    edges: input.edges,
    rootTaskId,
    tasks: input.tasks.map((task) => ({
      activeChildTaskCount: task.activeChildTaskCount,
      estimatePublicationEligible: task.estimatePublicationEligible,
      hasMarginalEstimate: task.hasMarginalEstimate,
      id: task.id,
      parentTaskId: task.parentTaskId,
      queueEligible: false,
      requiresMarginalEstimate:
        task.status === TaskStatus.ACTIVE && task.activeChildTaskCount === 0,
    })),
  })) {
    addFinding(findings, {
      code: finding.code,
      message: finding.message,
      recommendedAction: recommendationForGraphFinding(finding.code),
      requiresApproval: graphFindingRequiresApproval(finding.code),
      severity: finding.severity,
      taskId: finding.taskId,
    });
  }

  const duplicateGroups = new Map<string, TaskTreeStewardTask[]>();
  for (const task of input.tasks) {
    if (task.status === TaskStatus.VERIFIED) continue;
    const fingerprint = taskGovernanceFingerprint(task);
    const group = duplicateGroups.get(fingerprint) ?? [];
    group.push(task);
    duplicateGroups.set(fingerprint, group);
  }

  let duplicateGroupCount = 0;
  for (const group of duplicateGroups.values()) {
    if (group.length < 2) continue;
    duplicateGroupCount += 1;
    const ids = group.map((task) => task.id).sort();
    addFinding(findings, {
      code: "DUPLICATE_TASK_FINGERPRINT",
      message: `Tasks ${ids.join(", ")} have the same normalized title and assignee context.`,
      recommendedAction:
        "Compare history, edges, artifacts, and task keys; then prepare a canonical-task merge proposal.",
      relatedTaskIds: ids,
      requiresApproval: true,
      severity: "high",
      taskId: ids[0],
    });
  }

  let activeLeafTasks = 0;
  let agentExecutableLeaves = 0;
  let tasksNeedingCandidateResearch = 0;
  for (const task of input.tasks) {
    if (task.parentTaskId && !taskById.has(task.parentTaskId)) {
      addFinding(findings, {
        code: "MISSING_PARENT_TASK",
        message: `Task ${task.id} references missing parent ${task.parentTaskId}.`,
        recommendedAction:
          "Restore the missing parent or prepare an evidence-backed reparent proposal.",
        relatedTaskIds: [task.parentTaskId],
        requiresApproval: true,
        severity: "high",
        taskId: task.id,
      });
    }
    if (
      task.parentTaskId === rootTaskId &&
      task.id !== rootTaskId &&
      !task.taskKey?.trim()
    ) {
      addFinding(findings, {
        code: "UNKEYED_ROOT_CHILD",
        message: `Task ${task.id} sits directly below Optimize Earth without a stable task key.`,
        recommendedAction:
          "Identify its owning program and prepare a reparent or managed-branch proposal.",
        requiresApproval: true,
        severity: "high",
        taskId: task.id,
      });
    }

    if (task.status !== TaskStatus.ACTIVE || task.activeChildTaskCount > 0) continue;
    activeLeafTasks += 1;
    const agentTask = isAgentTask(task);
    if (agentTask) agentExecutableLeaves += 1;

    if (task.description.trim().length < 20) {
      addFinding(findings, {
        code: "MISSING_TASK_BRIEF",
        message: `Active leaf task ${task.id} has no useful execution brief.`,
        recommendedAction:
          "Draft a concise brief that names the deliverable, constraints, and evidence source.",
        requiresApproval: true,
        severity: "medium",
        taskId: task.id,
      });
    }
    if (!hasAcceptanceCriteria(task)) {
      addFinding(findings, {
        code: "MISSING_ACCEPTANCE_CRITERIA",
        message: `Active leaf task ${task.id} has no structured acceptance criteria.`,
        recommendedAction:
          "Draft testable acceptance criteria for the task owner to approve.",
        requiresApproval: true,
        severity: "medium",
        taskId: task.id,
      });
    }
    if (
      task.estimatedEffortHours == null ||
      !Number.isFinite(task.estimatedEffortHours) ||
      task.estimatedEffortHours <= 0
    ) {
      addFinding(findings, {
        code: "MISSING_EFFORT_ESTIMATE",
        message: `Active leaf task ${task.id} has no usable effort estimate.`,
        recommendedAction:
          "Prepare a calibrated effort estimate and record the assumptions behind it.",
        requiresApproval: true,
        severity: "medium",
        taskId: task.id,
      });
    }
    if (task.isPublic && task.sourceArtifactCount === 0 && !task.hasSourceUrl) {
      addFinding(findings, {
        code: "MISSING_PUBLIC_SOURCE",
        message: `Public active leaf task ${task.id} has no source URL or source artifact.`,
        recommendedAction:
          "Research and attach the best authoritative source before public promotion.",
        requiresApproval: false,
        severity: "low",
        taskId: task.id,
      });
    }
    if (
      task.claimPolicy === TaskClaimPolicy.ASSIGNED_ONLY &&
      !task.assigneePersonId &&
      !task.assigneeOrganizationId
    ) {
      addFinding(findings, {
        code: "UNASSIGNED_ASSIGNED_ONLY_TASK",
        message: `Task ${task.id} is ASSIGNED_ONLY but has no assignee.`,
        recommendedAction:
          "Research eligible candidates; do not assign or contact a human without approval.",
        requiresApproval: true,
        severity: "high",
        taskId: task.id,
      });
    }

    const hasAssignee = Boolean(
      task.assigneePersonId || task.assigneeOrganizationId,
    );
    if (!hasAssignee && task.activeCandidateMatchCount === 0) {
      tasksNeedingCandidateResearch += 1;
      addFinding(findings, {
        code: agentTask ? "AGENT_ROUTE_NEEDED" : "CANDIDATE_RESEARCH_NEEDED",
        message: `Active leaf task ${task.id} has no assignee or saved candidate match.`,
        recommendedAction: agentTask
          ? "Score registered agents and save the best eligible agent candidate."
          : "Research qualified people or organizations and save suggestions with provenance; do not contact them.",
        requiresApproval: false,
        severity: agentTask ? "high" : "medium",
        taskId: task.id,
      });
    }
    if (!hasAssignee && !hasRoutingTags(task)) {
      addFinding(findings, {
        code: "MISSING_ROUTING_TAGS",
        message: `Unassigned active leaf task ${task.id} has no capability or access tags for candidate matching.`,
        recommendedAction:
          "Infer conservative routing tags from the brief and propose them for review.",
        requiresApproval: true,
        severity: "low",
        taskId: task.id,
      });
    }
    if (agentTask && !isBoundedAgentTaskEffort(task.estimatedEffortHours)) {
      addFinding(findings, {
        code: "UNBOUNDED_AGENT_TASK",
        message: `Agent task ${task.id} is not bounded to a ${MAX_AGENT_TASK_EFFORT_HOURS}-hour-or-smaller deliverable.`,
        recommendedAction:
          "Decompose it into independently verifiable child tasks before agent execution.",
        requiresApproval: true,
        severity: "high",
        taskId: task.id,
      });
    }
    if (
      task.category === TaskCategory.ENGINEERING &&
      !task.assigneePersonId &&
      task.activeCandidateMatchCount === 0
    ) {
      addFinding(findings, {
        code: "DEVELOPMENT_ROUTE_TO_OWNER",
        message: `Development task ${task.id} has no reviewed route to Mike or another approved developer.`,
        recommendedAction:
          "Save Mike as the suggested route; do not auto-execute or assign development work.",
        requiresApproval: true,
        severity: "medium",
        taskId: task.id,
      });
    }
  }

  const severityRank = { high: 0, medium: 1, low: 2 } as const;
  findings.sort((left, right) => {
    const severityDifference =
      severityRank[left.severity] - severityRank[right.severity];
    if (severityDifference !== 0) return severityDifference;
    if (left.code !== right.code) return left.code.localeCompare(right.code);
    return left.issueKey.localeCompare(right.issueKey);
  });

  const uniqueFindings = Array.from(
    new Map(findings.map((finding) => [finding.issueKey, finding])).values(),
  );
  const cursorIndex = input.cursor
    ? uniqueFindings.findIndex((finding) => finding.issueKey === input.cursor)
    : -1;
  if (input.cursor && cursorIndex < 0) {
    throw new Error("Invalid task tree audit cursor.");
  }
  const start = cursorIndex + 1;
  const issues = uniqueFindings.slice(start, start + limit);
  const complete = start + issues.length >= uniqueFindings.length;

  return {
    complete,
    issues,
    nextCursor:
      complete || issues.length === 0
        ? null
        : issues[issues.length - 1]!.issueKey,
    rootTaskId,
    summary: {
      activeLeafTasks,
      activeTasks: input.tasks.filter((task) => task.status === TaskStatus.ACTIVE)
        .length,
      agentExecutableLeaves,
      duplicateGroups: duplicateGroupCount,
      highSeverityIssues: uniqueFindings.filter(
        (finding) => finding.severity === "high",
      ).length,
      issueCount: uniqueFindings.length,
      rootedTasks: rootedTaskIds.size,
      tasksNeedingCandidateResearch,
      totalTasks: input.tasks.length,
      unrootedTasks: input.tasks.filter(
        (task) => task.id !== rootTaskId && !rootedTaskIds.has(task.id),
      ).length,
    },
  };
}
