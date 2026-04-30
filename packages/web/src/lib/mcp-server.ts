/**
 * Shared MCP Server factory for the Optimitron Task System.
 *
 * Used by:
 * - scripts/mcp-task-server.ts (stdio transport for Claude Code)
 * - app/api/mcp/route.ts (HTTP transport for Claude Desktop / remote clients)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  AgentRunStatus,
  OrgStatus,
  OrgType,
  ReferendumStatus,
  TaskCategory,
  TaskClaimPolicy,
  TaskDifficulty,
  TaskImpactFrameKey,
  TaskStatus,
} from "@optimitron/db/enums";
import type { Prisma } from "@optimitron/db";

// ---------------------------------------------------------------------------
// Scopes — re-exported from the browser-safe `mcp-scopes` module so client
// components (consent UI, dev portal) can pull just the catalog without
// dragging this server-only file into the client bundle.
// ---------------------------------------------------------------------------

import {
  MCP_SCOPE_DESCRIPTIONS,
  DEFAULT_SCOPES,
  ALL_SCOPES,
  McpScope,
} from "./mcp-scopes";
import {
  TASK_TRIGGER_ADMIN_TOOL_NAMES,
  TASK_TRIGGER_TOOL_DEFINITIONS,
  TASK_TRIGGER_TOOL_SCOPES,
  handleTaskTriggerToolCall,
  isTaskTriggerToolName,
} from "./mcp-tools/task-triggers";
import { slugify } from "./slugify";
import type { RankableTask, TaskPriorityInput, TaskPriorityResult } from "./tasks/rank-tasks";

export { MCP_SCOPE_DESCRIPTIONS, DEFAULT_SCOPES, ALL_SCOPES, McpScope };

const TOOL_SCOPES: Record<string, McpScope[]> = {
  createOrganization: [McpScope.TASKS_ADMIN],
  createTask: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  proposeTaskBundle: [McpScope.TASKS_ADMIN],
  promoteTask: [McpScope.TASKS_ADMIN],
  deleteTask: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  updateTask: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  setTaskImpact: [McpScope.TASKS_ADMIN],
  recordTaskActuals: [McpScope.TASKS_ADMIN],
  updateMilestone: [McpScope.TASKS_ADMIN],
  addDependency: [McpScope.TASKS_ADMIN],
  createReferendum: [McpScope.TASKS_ADMIN],
  createPerson: [McpScope.TASKS_ADMIN],
  upsertOrganization: [McpScope.TASKS_ADMIN],
  // tasks:personal
  claimTask: [McpScope.TASKS_PERSONAL],
  claimSignerReminder: [McpScope.TASKS_PERSONAL],
  completeTaskClaim: [McpScope.TASKS_PERSONAL],
  logAgentRun: [McpScope.AGENT_RUN],
  acquireLease: [McpScope.AGENT_RUN],
  heartbeatLease: [McpScope.AGENT_RUN],
  releaseLease: [McpScope.AGENT_RUN],
  postTaskComment: [McpScope.TASKS_PERSONAL],
  voteTaskComment: [McpScope.TASKS_PERSONAL],
  deleteTaskComment: [McpScope.TASKS_PERSONAL],
  getTaskComments: [McpScope.TASKS_PERSONAL],
  getMyQueue: [McpScope.TASKS_PERSONAL],
  getAIQueue: [McpScope.TASKS_PERSONAL],
  getNextAction: [McpScope.TASKS_PERSONAL],
  getQueueAudit: [McpScope.TASKS_PERSONAL],
  getMe: [McpScope.TASKS_PERSONAL],
  updateMyProfile: [McpScope.TASKS_PERSONAL],
  searchRepo: [McpScope.GITHUB],
  getFileContent: [McpScope.GITHUB],
  listRepoFiles: [McpScope.GITHUB],
  githubApi: [McpScope.GITHUB],
  ...TASK_TRIGGER_TOOL_SCOPES,
};

const ADMIN_ONLY_TOOLS = new Set([
  "createOrganization",
  "proposeTaskBundle",
  "promoteTask",
  "setTaskImpact",
  "recordTaskActuals",
  "updateMilestone",
  "addDependency",
  "createReferendum",
  "createPerson",
  "upsertOrganization",
  "logAgentRun",
  "acquireLease",
  "heartbeatLease",
  "releaseLease",
  "searchRepo",
  "getFileContent",
  "listRepoFiles",
  "githubApi",
  ...TASK_TRIGGER_ADMIN_TOOL_NAMES,
]);

function hasScope(grantedScopes: McpScope[] | undefined, toolName: string): boolean {
  // Deny by default. Callers must pass an explicit scopes array — stdio passes ALL_SCOPES,
  // HTTP traffic always carries a Bearer token (the route 401s on missing/invalid auth) and
  // passes the scopes granted at OAuth consent time.
  if (!grantedScopes) return false;
  const required = TOOL_SCOPES[toolName];
  if (!required) return true;
  return required.some((s) => grantedScopes.includes(s));
}

function hasAdminTaskWriteAccess(scopes: McpScope[] | undefined, isAdmin: boolean) {
  return isAdmin && !!scopes?.includes(McpScope.TASKS_ADMIN);
}

// ---------------------------------------------------------------------------
// Lazy imports (keep startup fast, avoid connection errors during tool listing)
// ---------------------------------------------------------------------------

async function getTaskFunctions() {
  const [tasks, ranking, impact, endpoints, lease] = await Promise.all([
    import("./tasks.server"),
    import("./tasks/rank-tasks"),
    import("./tasks/impact"),
    import("./tasks/task-communication-endpoints.server"),
    import("./tasks/agent-lease.server"),
  ]);
  return { tasks, ranking, impact, endpoints, lease };
}

async function getPrisma() {
  const { prisma } = await import("./prisma");
  return prisma;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ok(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function err(message: string) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}

function getMcpBaseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3001")
  );
}

// Personal-queue tools need to know *whose* queue to fetch — they cannot run
// anonymously. Instead of a bare "Authentication required" string, emit a
// structured error the calling LLM can act on: OAuth discovery URL for remote
// HTTP clients, env-var fallback for local stdio.
function authRequired(toolName: string, reason: string) {
  const base = getMcpBaseUrl();
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            error: "authentication_required",
            tool: toolName,
            message: `Tool "${toolName}" needs an authenticated user. ${reason}`,
            remediation: {
              remote_http: {
                description:
                  "If you're connecting over HTTP (e.g. the Claude.ai connector), the server advertises OAuth via the standard well-known endpoint. Have the client fetch this URL and complete the OAuth 2.1 + PKCE flow, then retry the tool with the resulting Bearer token.",
                resourceMetadata: `${base}/.well-known/oauth-protected-resource/mcp`,
                authorizationServerMetadata: `${base}/.well-known/oauth-authorization-server`,
                authorizeEndpoint: `${base}/api/mcp/oauth/authorize`,
                tokenEndpoint: `${base}/api/mcp/oauth/token`,
                registrationEndpoint: `${base}/api/mcp/oauth/register`,
              },
              local_stdio: {
                description:
                  "If you're running the local stdio server (Claude Code via .mcp.json), set MCP_USER_EMAIL or MCP_USER_ID in your environment and restart the server. The stdio transport has no OAuth — it identifies you by env var.",
                envVars: ["MCP_USER_EMAIL", "MCP_USER_ID"],
              },
            },
          },
          null,
          2,
        ),
      },
    ],
    isError: true,
  };
}

function toTaskDifficulty(value: unknown) {
  if (typeof value !== "string") return null;
  return TaskDifficulty[value as keyof typeof TaskDifficulty] ?? null;
}

function enumValue<T extends Record<string, string>>(
  values: T,
  value: unknown,
  fallback: T[keyof T],
) {
  if (typeof value !== "string") return fallback;
  return values[value as keyof T] ?? fallback;
}

function buildAgentCapabilities(args: Record<string, unknown>) {
  return {
    availableHoursPerWeek: (args.availableHoursPerWeek as number) ?? null,
    interestTags: (args.interestTags as string[]) ?? [],
    maxTaskDifficulty: toTaskDifficulty(args.maxDifficulty)?.toString() ?? null,
    skillTags: (args.skillTags as string[]) ?? [],
  };
}

async function listActivePublicEarthTasks() {
  const { tasks } = await getTaskFunctions();
  return tasks.listTasks({
    limit: 5000,
    visibility: "public",
    status: TaskStatus.ACTIVE,
  });
}

function asObject(value: unknown) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function dedupeStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.map((value) => value?.trim() ?? "").filter(Boolean)),
  );
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function mergeTaskContextJson(input: {
  baseContextJson?: unknown;
  patchContextJson?: unknown;
  sourceUrl?: string | null;
}) {
  const base = asObject(input.baseContextJson) ?? {};
  const patch = asObject(input.patchContextJson) ?? {};
  const merged = { ...base, ...patch };
  const sourceUrls = dedupeStrings([
    ...asStringArray(base.sourceUrls),
    ...asStringArray(patch.sourceUrls),
    input.sourceUrl ?? null,
  ]);

  if (sourceUrls.length > 0) {
    merged.sourceUrls = sourceUrls;
  }

  return Object.keys(merged).length > 0 ? merged : undefined;
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function toStoredProposalIssues(
  issues: Array<{ code: string; message: string; severity: string }>,
) {
  return issues.map((issue) => ({
    code: issue.code,
    message: issue.message,
    severity: issue.severity,
  }));
}

function getPrimaryCommunicationEndpoint(input?: {
  communicationEndpoints?: Array<{
    email?: string | null;
    isPrimary?: boolean | null;
    priority?: number | null;
    url?: string | null;
  }> | null;
}) {
  const endpoints = input?.communicationEndpoints ?? [];
  return (
    endpoints.find((endpoint) => endpoint.isPrimary) ??
    [...endpoints].sort(
      (left, right) => (left.priority ?? 0) - (right.priority ?? 0),
    )[0] ??
    null
  );
}

function getCommunicationEndpointUrl(input?: {
  communicationEndpoints?: Array<{
    email?: string | null;
    isPrimary?: boolean | null;
    priority?: number | null;
    url?: string | null;
  }> | null;
}) {
  const endpoint = getPrimaryCommunicationEndpoint(input);
  if (!endpoint) return null;
  if (endpoint.url) return endpoint.url;
  if (endpoint.email) return `mailto:${endpoint.email}`;
  return null;
}

type SummarizableTask = {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  category?: string | null;
  difficulty?: string | null;
  taskKey?: string | null;
  dueAt?: Date | string | null;
  parentTaskId?: string | null;
  impactStatement?: string | null;
  primaryEndpoint?: {
    email?: string | null;
    instructions?: string | null;
    kind?: string | null;
    label?: string | null;
    url?: string | null;
  } | null;
  claimPolicy?: string | null;
  skillTags?: string[] | null;
  interestTags?: string[] | null;
  estimatedEffortHours?: number | null;
  assigneePerson?: { displayName?: string | null } | null;
  assigneeOrganization?: { name?: string | null } | null;
  blockerStatuses?: string[] | null;
  milestones?: unknown[] | null;
  childTasks?: unknown[] | null;
  _count?: { childTasks?: number | null } | null;
};

function buildStoredProposalContext(input: {
  candidate: Record<string, unknown>;
  decision?: {
    evaluation?: { qualityScore?: number; rationale?: string[] };
    issues?: Array<{ code: string; message: string; severity: string }>;
    promotable?: boolean;
    proposalRef?: string;
  } | null;
}) {
  return {
    proposalV1: {
      assigneeOrganizationId: (input.candidate.assigneeOrganizationId as string) ?? null,
      assigneePersonId: (input.candidate.assigneePersonId as string) ?? null,
      blockerRefs: (input.candidate.blockerRefs as string[]) ?? [],
      contactUrl: (input.candidate.contactUrl as string) ?? null,
      description: (input.candidate.description as string) ?? null,
      estimatedEffortHours: (input.candidate.estimatedEffortHours as number) ?? null,
      impact: (input.candidate.impact as Record<string, number | null>) ?? null,
      isPublic: (input.candidate.isPublic as boolean) ?? true,
      parentTaskRef: (input.candidate.parentTaskRef as string) ?? null,
      proposalRef:
        input.decision?.proposalRef ??
        (input.candidate.id as string) ??
        (input.candidate.taskKey as string) ??
        null,
      review: input.decision
        ? {
            issues: input.decision.issues ?? [],
            promotable: input.decision.promotable ?? false,
            qualityScore: input.decision.evaluation?.qualityScore ?? null,
            rationale: input.decision.evaluation?.rationale ?? [],
            reviewedAt: new Date().toISOString(),
          }
        : null,
      roleTitle: (input.candidate.roleTitle as string) ?? null,
      sourceUrls: (input.candidate.sourceUrls as string[]) ?? [],
      status: "DRAFT",
      taskKey: (input.candidate.taskKey as string) ?? null,
      title: input.candidate.title as string,
    },
  };
}

function inferProposalCategory(candidate: Record<string, unknown>) {
  const text = [
    (candidate.taskKey as string) ?? "",
    (candidate.title as string) ?? "",
    (candidate.description as string) ?? "",
  ]
    .join(" ")
    .toLowerCase();

  if (text.includes("growth") || text.includes("conversion") || text.includes("traffic")) {
    return TaskCategory.COMMUNICATION;
  }
  if (text.includes("contact") || text.includes("journalist") || text.includes("research")) {
    return TaskCategory.RESEARCH;
  }
  if (text.includes("system:") || text.includes("queue") || text.includes("ranking")) {
    return TaskCategory.ENGINEERING;
  }

  return TaskCategory.OTHER;
}

function inferProposalDifficulty(candidate: Record<string, unknown>) {
  const effort = (candidate.estimatedEffortHours as number) ?? 0;
  if (effort >= 6) return TaskDifficulty.ADVANCED;
  if (effort >= 2) return TaskDifficulty.INTERMEDIATE;
  return TaskDifficulty.BEGINNER;
}

function matchCandidateToDecision(
  candidate: Record<string, unknown>,
  decision: { proposalRef: string; title: string },
) {
  return (
    (candidate.id as string) === decision.proposalRef ||
    (candidate.taskKey as string) === decision.proposalRef ||
    (((candidate.id as string) ?? "").length === 0 &&
      ((candidate.taskKey as string) ?? "").length === 0 &&
      (candidate.title as string) === decision.title)
  );
}

function taskProposalCandidateFromRecord(task: {
  assigneeOrganizationId?: string | null;
  assigneePersonId?: string | null;
  communicationEndpoints?: Array<{
    email?: string | null;
    isPrimary?: boolean | null;
    priority?: number | null;
    url?: string | null;
  }> | null;
  contextJson?: unknown;
  description: string | null;
  estimatedEffortHours?: number | null;
  id: string;
  isPublic: boolean;
  roleTitle?: string | null;
  status: string;
  taskKey?: string | null;
  title: string;
}) {
  const context = asObject(task.contextJson);
  const proposal = asObject(context?.proposalV1);
  const contextSourceUrls = asStringArray(context?.sourceUrls);
  const proposalSourceUrls = Array.isArray(proposal?.sourceUrls)
    ? (proposal?.sourceUrls as string[])
    : [];
  const sourceUrls = dedupeStrings([
    ...contextSourceUrls,
    ...proposalSourceUrls,
  ]);

  return {
    assigneeOrganizationId:
      (proposal?.assigneeOrganizationId as string) ?? task.assigneeOrganizationId ?? null,
    assigneePersonId:
      (proposal?.assigneePersonId as string) ?? task.assigneePersonId ?? null,
    blockerRefs: ((proposal?.blockerRefs as string[]) ?? []) as string[],
    contactUrl: (proposal?.contactUrl as string) ?? getCommunicationEndpointUrl(task) ?? null,
    description: (proposal?.description as string) ?? task.description ?? null,
    estimatedEffortHours:
      (proposal?.estimatedEffortHours as number) ?? task.estimatedEffortHours ?? null,
    id: task.id,
    impact: (proposal?.impact as Record<string, number | null>) ?? null,
    isPublic: (proposal?.isPublic as boolean) ?? task.isPublic,
    parentTaskRef: (proposal?.parentTaskRef as string) ?? null,
    roleTitle: (proposal?.roleTitle as string) ?? task.roleTitle ?? null,
    sourceUrls,
    status: task.status,
    taskKey: (proposal?.taskKey as string) ?? task.taskKey ?? null,
    title: (proposal?.title as string) ?? task.title,
  };
}

async function attachProposalImpactEstimate(input: {
  prisma: Awaited<ReturnType<typeof getPrisma>>;
  taskId: string;
  estimatedEffortHours: number | null;
  impact: Record<string, number | null> | null;
}) {
  const impact = input.impact;
  if (!impact) return null;

  const hasMeaningfulImpact = Object.values(impact).some(
    (value) => typeof value === "number" && value > 0,
  );
  if (!hasMeaningfulImpact) return null;

  const estimateSet = await input.prisma.taskImpactEstimateSet.create({
    data: {
      assumptionsJson: { source: "mcp-proposal" },
      calculationVersion: "mcp-proposal-v1",
      counterfactualKey: "status-quo",
      estimateKind: "FORECAST",
      isCurrent: true,
      methodologyKey: "agent-proposal",
      parameterSetHash: `mcp-proposal:${input.taskId}`,
      publicationStatus: "DRAFT",
      sourceSystem: "MANUAL",
      taskId: input.taskId,
    },
  });

  await input.prisma.taskImpactFrameEstimate.create({
    data: {
      taskImpactEstimateSetId: estimateSet.id,
      frameKey: TaskImpactFrameKey.TWENTY_YEAR,
      frameSlug: "twenty-year-proposal",
      evaluationHorizonYears: 20,
      successProbabilityBase: 0.6,
      delayDalysLostPerDayBase: (impact.delayDalysLostPerDay as number) ?? null,
      delayEconomicValueUsdLostPerDayBase:
        (impact.delayEconomicValueUsdLostPerDay as number) ?? null,
      expectedDalysAvertedBase: null,
      expectedEconomicValueUsdBase:
        input.estimatedEffortHours == null || impact.expectedValuePerHourUsd == null
          ? null
          : impact.expectedValuePerHourUsd * input.estimatedEffortHours,
      estimatedCashCostUsdBase: null,
      estimatedEffortHoursBase: input.estimatedEffortHours ?? null,
      adoptionRampYears: 0,
      annualDiscountRate: 0.03,
      benefitDurationYears: 20,
      timeToImpactStartDays: 0,
    },
  });

  await input.prisma.task.update({
    where: { id: input.taskId },
    data: { currentImpactEstimateSetId: estimateSet.id },
  });

  return estimateSet.id;
}

async function attachDirectTaskImpactEstimate(input: {
  prisma: Awaited<ReturnType<typeof getPrisma>> | Prisma.TransactionClient;
  taskId: string;
  estimatedEffortHours: number;
  estimatedCashCostUsdBase: number;
  expectedEconomicValueUsdBase: number;
  successProbabilityBase: number;
  timeToImpactStartDays: number;
}) {
  const estimateSet = await input.prisma.taskImpactEstimateSet.create({
    data: {
      assumptionsJson: {
        source: "mcp-create-task",
        evidenceType: "user-supplied",
        notes: "Direct task inputs used for task priority scoring.",
      },
      calculationVersion: "mcp-direct-v1",
      counterfactualKey: "status-quo",
      estimateKind: "FORECAST",
      isCurrent: true,
      methodologyKey: "agent-direct",
      parameterSetHash: `mcp-direct:${input.taskId}:${Date.now()}:${Math.random().toString(36).slice(2)}`,
      publicationStatus: "DRAFT",
      sourceSystem: "MANUAL",
      taskId: input.taskId,
    },
  });

  await input.prisma.taskImpactFrameEstimate.create({
    data: {
      taskImpactEstimateSetId: estimateSet.id,
      frameKey: TaskImpactFrameKey.FIVE_YEAR,
      frameSlug: "five-year-direct",
      evaluationHorizonYears: 5,
      successProbabilityLow: null,
      successProbabilityBase: input.successProbabilityBase,
      successProbabilityHigh: null,
      delayDalysLostPerDayBase: null,
      delayDalysLostPerDayLow: null,
      delayDalysLostPerDayHigh: null,
      delayEconomicValueUsdLostPerDayBase: null,
      delayEconomicValueUsdLostPerDayLow: null,
      delayEconomicValueUsdLostPerDayHigh: null,
      expectedDalysAvertedBase: null,
      expectedDalysAvertedLow: null,
      expectedDalysAvertedHigh: null,
      expectedEconomicValueUsdBase: input.expectedEconomicValueUsdBase,
      expectedEconomicValueUsdLow: null,
      expectedEconomicValueUsdHigh: null,
      estimatedCashCostUsdBase: input.estimatedCashCostUsdBase,
      estimatedCashCostUsdLow: null,
      estimatedCashCostUsdHigh: null,
      estimatedEffortHoursBase: input.estimatedEffortHours,
      estimatedEffortHoursLow: null,
      estimatedEffortHoursHigh: null,
      adoptionRampYears: 0,
      annualDiscountRate: 0.03,
      benefitDurationYears: 5,
      timeToImpactStartDays: input.timeToImpactStartDays,
    },
  });

  await input.prisma.task.update({
    where: { id: input.taskId },
    data: { currentImpactEstimateSetId: estimateSet.id },
  });

  return estimateSet.id;
}

function summarizeTask(task: SummarizableTask) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    category: task.category,
    difficulty: task.difficulty,
    taskKey: task.taskKey,
    dueAt: task.dueAt,
    parentTaskId: task.parentTaskId,
    impactStatement: task.impactStatement,
    primaryEndpoint: task.primaryEndpoint ?? null,
    claimPolicy: task.claimPolicy,
    skillTags: task.skillTags,
    interestTags: task.interestTags,
    estimatedEffortHours: task.estimatedEffortHours,
    assigneePersonName: task.assigneePerson?.displayName ?? null,
    assigneeOrgName: task.assigneeOrganization?.name ?? null,
    blocked: task.blockerStatuses?.some((status) => status !== TaskStatus.VERIFIED) ?? false,
    blockerCount: task.blockerStatuses?.length ?? 0,
    milestoneCount: task.milestones?.length ?? 0,
    childTaskCount: task.childTasks?.length ?? task._count?.childTasks ?? 0,
  };
}

const DEFAULT_PERSONAL_BUYBACK_RATE = 1000;
const MS_PER_HOUR = 60 * 60 * 1000;

type DeadlinePolicy = "NONE" | "SOFT" | "EXPIRES" | "REQUIRED";
type DeadlineStatus = "none" | "future" | "start_now" | "overdue" | "missed" | "expired";

type PersonalQueueRow = ReturnType<typeof summarizeTask> & {
  assigneeOrganizationId?: string | null;
  assigneePersonId?: string | null;
  blockersCount: number;
  blockersResolved: number;
  blockersResolvedPercent: number;
  evMath: string;
  availableAt: string | null;
  cashCost: number;
  deadlinePolicy: DeadlinePolicy;
  deadlineRationale: string | null;
  deadlineStatus: DeadlineStatus;
  hours: number | null;
  latestStartAt: string | null;
  ownerUserId?: string | null;
  executorType: string;
  pSuccess: number | null;
  priority: number;
  realEv: number;
  buybackRate: number;
  unblockedBlockers: number;
  unresolvedBlockers: number;
  timeUntilDueHours: number | null;
  valid: boolean;
  value: number | null;
  validationNotes: string[];
};

type PersonalQueueTaskRecord = Record<string, unknown> & SummarizableTask & {
  assigneeOrganizationId?: string | null;
  assigneePersonId?: string | null;
  ownerUserId?: string | null;
  availableAt?: Date | string | null;
  deadlinePolicy?: DeadlinePolicy | string | null;
  contextJson?: unknown;
  selectedImpactFrame?: unknown;
  isPublic?: boolean | null;
  blockerStatuses?: TaskStatus[] | null;
};

function parsePositiveNumber(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  if (value <= 0) return fallback;
  return value;
}

function parseFiniteNumber(value: unknown, fallback?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback ?? null;
  return value;
}

function firstFiniteNumber(values: unknown[], fallback?: number) {
  for (const value of values) {
    const parsed = parseFiniteNumber(value);
    if (parsed != null) return parsed;
  }
  return fallback ?? null;
}

const AI_EXECUTOR_TYPE = "AI Agent";

function normalizeExecutorType(value: unknown) {
  if (typeof value !== "string") return "Self";
  const normalized = value.trim().toLowerCase();
  if (normalized === "ai" || normalized === "agent" || normalized === "ai agent") {
    return AI_EXECUTOR_TYPE;
  }
  if (normalized === "self") return "Self";
  return value.trim() || "Self";
}

function normalizeDeadlinePolicy(value: unknown, fallback: DeadlinePolicy = "NONE"): DeadlinePolicy {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "required" || normalized === "hard" || normalized === "must" || normalized === "must_do" || normalized === "must-do") {
    return "REQUIRED";
  }
  if (normalized === "expires" || normalized === "expire" || normalized === "expiring") return "EXPIRES";
  if (normalized === "soft") return "SOFT";
  if (normalized === "none") return "NONE";
  return fallback;
}

function parseTaskDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIsoOrNull(date: Date | null) {
  return date ? date.toISOString() : null;
}

function getTaskContext(task: PersonalQueueTaskRecord | Record<string, unknown>) {
  return asObject(task.contextJson) ?? {};
}

function getTaskExecutorType(task: PersonalQueueTaskRecord | Record<string, unknown>) {
  const context = getTaskContext(task);
  return normalizeExecutorType(
    context.executor_type ??
      context.executorType,
  );
}

function normalizeAcceptanceCriteria(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function extractAcceptanceCriteriaFromDescription(description: unknown): string[] {
  if (typeof description !== "string" || !description.trim()) return [];

  const lines = description.split(/\r?\n/);
  const criteria: string[] = [];
  let inAcceptanceSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^#{1,6}\s+acceptance criteria\b/i.test(trimmed)) {
      inAcceptanceSection = true;
      continue;
    }
    if (inAcceptanceSection && /^#{1,6}\s+/.test(trimmed)) {
      break;
    }
    if (!inAcceptanceSection || !trimmed) {
      continue;
    }

    const bulletMatch = trimmed.match(/^(?:[-*+]\s+(?:\[[ xX]\]\s*)?|\d+[.)]\s+)(.+)$/);
    if (!bulletMatch?.[1]) {
      continue;
    }

    const criterion = bulletMatch[1]
      .replace(/\s+/g, " ")
      .trim();
    if (criterion) criteria.push(criterion);
  }

  return criteria;
}

function mergeAcceptanceCriteriaIntoContext(
  context: Record<string, unknown>,
  description: unknown,
  explicitCriteria?: unknown,
) {
  const existingCriteria = normalizeAcceptanceCriteria(context.acceptanceCriteria);
  if (existingCriteria.length > 0) {
    return context;
  }

  const explicit = normalizeAcceptanceCriteria(explicitCriteria);
  const criteria =
    explicit.length > 0
      ? explicit
      : extractAcceptanceCriteriaFromDescription(description);

  return criteria.length > 0
    ? { ...context, acceptanceCriteria: criteria }
    : context;
}

function enrichTaskForMcp(task: unknown) {
  const record = { ...(task as Record<string, unknown>) };
  const context = mergeAcceptanceCriteriaIntoContext(
    { ...getTaskContext(record) },
    record.description,
  );
  return {
    ...record,
    contextJson: context,
    executorType: getTaskExecutorType({ ...record, contextJson: context }),
  };
}

function isSelfExecutableTask(task: PersonalQueueTaskRecord) {
  return getTaskExecutorType(task) !== AI_EXECUTOR_TYPE;
}

function isAIExecutableTask(task: PersonalQueueTaskRecord) {
  return getTaskExecutorType(task) === AI_EXECUTOR_TYPE;
}

function isTaskTimeAvailable(task: PersonalQueueTaskRecord, now: Date) {
  const availableAt = parseTaskDate(task.availableAt);
  return !availableAt || availableAt.getTime() <= now.getTime();
}

function computeDeadlineSummary(
  task: PersonalQueueTaskRecord,
  hours: number | null,
  now: Date,
) {
  const availableAt = parseTaskDate(task.availableAt);
  const dueAt = parseTaskDate(task.dueAt);
  const context = getTaskContext(task);
  const rawPolicy = task.deadlinePolicy ?? context.deadline_policy ?? context.deadlinePolicy;
  const deadlinePolicy = normalizeDeadlinePolicy(
    rawPolicy,
    dueAt ? "SOFT" : "NONE",
  );
  const deadlineRationale =
    typeof context.deadline_rationale === "string"
      ? context.deadline_rationale
      : typeof context.deadlineRationale === "string"
        ? context.deadlineRationale
        : null;

  if (!dueAt || deadlinePolicy === "NONE") {
    return {
      availableAt: toIsoOrNull(availableAt),
      deadlinePolicy,
      deadlineRationale,
      deadlineStatus: "none" as DeadlineStatus,
      dueAt: toIsoOrNull(dueAt),
      latestStartAt: null,
      timeUntilDueHours: dueAt ? (dueAt.getTime() - now.getTime()) / MS_PER_HOUR : null,
    };
  }

  const usableHours = typeof hours === "number" && Number.isFinite(hours) && hours > 0 ? hours : null;
  const latestStartAt = usableHours == null ? null : new Date(dueAt.getTime() - usableHours * MS_PER_HOUR);
  const timeUntilDueHours = (dueAt.getTime() - now.getTime()) / MS_PER_HOUR;
  let deadlineStatus: DeadlineStatus = "future";
  if (timeUntilDueHours < 0) {
    deadlineStatus =
      deadlinePolicy === "REQUIRED"
        ? "missed"
        : deadlinePolicy === "EXPIRES"
          ? "expired"
          : "overdue";
  } else if (
    (deadlinePolicy === "REQUIRED" || deadlinePolicy === "EXPIRES") &&
    latestStartAt &&
    now.getTime() >= latestStartAt.getTime()
  ) {
    deadlineStatus = "start_now";
  }

  return {
    availableAt: toIsoOrNull(availableAt),
    deadlinePolicy,
    deadlineRationale,
    deadlineStatus,
    dueAt: dueAt.toISOString(),
    latestStartAt: toIsoOrNull(latestStartAt),
    timeUntilDueHours,
  };
}

function resolveTaskEconomics(args: Record<string, unknown>, existing?: {
  contextJson?: unknown;
  estimatedEffortHours?: number | null;
  selectedImpactFrame?: unknown;
}) {
  const existingContext = asObject(existing?.contextJson) ?? {};
  const existingFrame = asObject(existing?.selectedImpactFrame);
  const pSuccess =
    firstFiniteNumber([
      args.p_success,
      args.pSuccess,
      args.successProbabilityBase,
      existingContext.p_success,
      existingContext.pSuccess,
      existingFrame?.successProbabilityBase,
    ], 1) ?? 1;
  const normalizedPSuccess = Math.max(0, Math.min(1, pSuccess));
  const grossValue = firstFiniteNumber([
    args.value,
    args.grossValue,
    existingContext.value,
    existingContext.grossValue,
  ]);
  const expectedEconomicValueUsdBase =
    firstFiniteNumber([args.expectedEconomicValueUsdBase]) ??
    (grossValue == null
      ? firstFiniteNumber([existingFrame?.expectedEconomicValueUsdBase], 0) ?? 0
      : grossValue * normalizedPSuccess);
  const estimatedEffortHours =
    firstFiniteNumber([
      args.hours,
      args.estimatedEffortHours,
      existing?.estimatedEffortHours,
      existingFrame?.estimatedEffortHoursBase,
      existingContext.hours,
    ], 1) ?? 1;
  const estimatedCashCostUsdBase =
    firstFiniteNumber([
      args.cash_cost,
      args.cashCost,
      args.estimatedCashCostUsdBase,
      existingContext.cash_cost,
      existingContext.cashCost,
      existingFrame?.estimatedCashCostUsdBase,
    ], 0) ?? 0;
  const timeToImpactStartDays =
    firstFiniteNumber([args.timeToImpactStartDays, existingFrame?.timeToImpactStartDays], 0) ?? 0;

  return {
    estimatedCashCostUsdBase: Math.max(0, estimatedCashCostUsdBase),
    estimatedEffortHours: Math.max(estimatedEffortHours, 0),
    expectedEconomicValueUsdBase,
    grossValue,
    pSuccess: normalizedPSuccess,
    timeToImpactStartDays: Math.max(0, timeToImpactStartDays),
  };
}

function buildPersonalTaskContext(args: Record<string, unknown>, economics: ReturnType<typeof resolveTaskEconomics>, baseContextJson?: unknown) {
  const contextPatch: Record<string, unknown> = {};
  const providedContext = asObject(args.contextJson) ?? {};
  if (args.executor_type !== undefined || args.executorType !== undefined || baseContextJson == null) {
    contextPatch.executor_type = normalizeExecutorType(args.executor_type ?? args.executorType);
  }
  if (economics.grossValue != null) contextPatch.value = economics.grossValue;
  contextPatch.p_success = economics.pSuccess;
  contextPatch.cash_cost = economics.estimatedCashCostUsdBase;
  if (args.ev_math !== undefined || args.evMath !== undefined) {
    contextPatch.ev_math = (args.ev_math ?? args.evMath) as string;
  }
  if (args.can_delegate !== undefined || args.canDelegate !== undefined) {
    contextPatch.can_delegate = Boolean(args.can_delegate ?? args.canDelegate);
  }
  if (args.best_route !== undefined || args.bestRoute !== undefined) {
    contextPatch.best_route = (args.best_route ?? args.bestRoute) as string;
  }
  if (args.deadline_rationale !== undefined || args.deadlineRationale !== undefined) {
    contextPatch.deadline_rationale = (args.deadline_rationale ?? args.deadlineRationale) as string;
  }
  const contextWithCriteria = mergeAcceptanceCriteriaIntoContext(
    {
      ...providedContext,
      ...contextPatch,
    },
    args.description,
    args.acceptanceCriteria,
  );

  return mergeTaskContextJson({
    baseContextJson,
    patchContextJson: contextWithCriteria,
    sourceUrl: args.sourceUrl !== undefined ? ((args.sourceUrl as string) || null) : null,
  });
}

function resolveDeadlinePolicyInput(
  args: Record<string, unknown>,
  dueAt: Date | null,
  existing?: PersonalQueueTaskRecord,
) {
  if (args.deadline_policy !== undefined || args.deadlinePolicy !== undefined) {
    return normalizeDeadlinePolicy(args.deadline_policy ?? args.deadlinePolicy);
  }
  if (existing?.deadlinePolicy) {
    return normalizeDeadlinePolicy(existing.deadlinePolicy);
  }
  return dueAt ? "SOFT" : "NONE";
}

function hasEconomicsPatch(args: Record<string, unknown>) {
  return [
    "hours",
    "estimatedEffortHours",
    "value",
    "grossValue",
    "p_success",
    "pSuccess",
    "successProbabilityBase",
    "cash_cost",
    "cashCost",
    "estimatedCashCostUsdBase",
    "expectedEconomicValueUsdBase",
  ].some((key) => args[key] !== undefined);
}

function buildPersonalQueueRows(
  tasks: unknown[],
  ranking: {
    computeTaskPriority: (task: TaskPriorityInput, options?: { buybackRate?: number }) => TaskPriorityResult;
    isTaskBlocked?: (task: Pick<RankableTask, "blockerStatuses">) => boolean;
  },
  buybackRate?: number,
  options?: {
    requireUnblocked?: boolean;
    limit?: number;
    now?: Date;
  },
) {
  const limit = parseQueueLimit(options?.limit, 50, Math.min(5000, tasks.length));
  const parsedBuybackRate = parsePositiveNumber(buybackRate, DEFAULT_PERSONAL_BUYBACK_RATE);
  const now = options?.now ?? new Date();
  const filtered = options?.requireUnblocked
    ? tasks.filter((task) => {
        const sourceTask = task as PersonalQueueTaskRecord;
        if (!isTaskTimeAvailable(sourceTask, now)) return false;
        if (
          ranking.isTaskBlocked?.({
            blockerStatuses: sourceTask.blockerStatuses ?? undefined,
          }) ?? false
        ) {
          return false;
        }
        const deadline = computeDeadlineSummary(sourceTask, null, now);
        return !(deadline.deadlinePolicy === "EXPIRES" && deadline.deadlineStatus === "expired");
      })
    : tasks;

  const ranked = filtered
    .map((task) => {
      const sourceTask = task as PersonalQueueTaskRecord;
      const score = ranking.computeTaskPriority(sourceTask as TaskPriorityInput, {
        buybackRate: parsedBuybackRate,
      });
      const summary = summarizeTask(sourceTask);
      const context = getTaskContext(sourceTask);
      const selectedImpactFrame = asObject(sourceTask.selectedImpactFrame);
      const hours = firstFiniteNumber([
        sourceTask.estimatedEffortHours,
        selectedImpactFrame?.estimatedEffortHoursBase,
        context.hours,
      ]);
      const value = firstFiniteNumber([context.value, context.grossValue]);
      const pSuccess = firstFiniteNumber([
        context.p_success,
        context.pSuccess,
        selectedImpactFrame?.successProbabilityBase,
      ]);
      const cashCost = firstFiniteNumber([
        context.cash_cost,
        context.cashCost,
        selectedImpactFrame?.estimatedCashCostUsdBase,
      ], 0) ?? 0;
      const deadline = computeDeadlineSummary(sourceTask, hours, now);
      return {
        ...summary,
        assigneeOrganizationId: sourceTask.assigneeOrganizationId ?? null,
        assigneePersonId: sourceTask.assigneePersonId ?? null,
        ownerUserId: sourceTask.ownerUserId ?? null,
        blockersCount: score.blockersCount,
        blockersResolved: score.blockersResolved,
        blockersResolvedPercent:
          score.blockersCount > 0 ? (score.unblockedBlockers / score.blockersCount) * 100 : 100,
        availableAt: deadline.availableAt,
        buybackRate: score.buybackRate,
        cashCost,
        deadlinePolicy: deadline.deadlinePolicy,
        deadlineRationale: deadline.deadlineRationale,
        deadlineStatus: deadline.deadlineStatus,
        dueAt: deadline.dueAt,
        evMath: score.evMath,
        hours,
        latestStartAt: deadline.latestStartAt,
        executorType: getTaskExecutorType(sourceTask),
        priority: score.priority,
        pSuccess,
        realEv: score.realEv,
        timeUntilDueHours: deadline.timeUntilDueHours,
        unblockedBlockers: score.unblockedBlockers,
        unresolvedBlockers: Math.max(0, score.blockersCount - score.unblockedBlockers),
        valid: score.valid,
        value,
        validationNotes: score.validationNotes,
      } as PersonalQueueTaskRecord & PersonalQueueRow;
    })
    .sort((left, right) => right.priority - left.priority);

  return ranked.slice(0, limit);
}

function parseQueueLimit(value: unknown, fallback = 20, max = 100) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  const clamped = Math.floor(value);
  return Math.max(1, Math.min(clamped, max));
}

const REFERENDUM_SELECT = {
  _count: {
    select: {
      organizationPositions: true,
      surveys: true,
      votes: true,
    },
  },
  createdAt: true,
  createdByUserId: true,
  description: true,
  id: true,
  jurisdictionId: true,
  slug: true,
  status: true,
  title: true,
  updatedAt: true,
} satisfies Prisma.ReferendumSelect;

type ReferendumToolRecord = Prisma.ReferendumGetPayload<{
  select: typeof REFERENDUM_SELECT;
}>;

function parseReferendumStatus(value: unknown, fallback: ReferendumStatus) {
  const normalized = optionalString(value)?.toUpperCase();
  if (!normalized) return fallback;
  return ReferendumStatus[normalized as keyof typeof ReferendumStatus] ?? null;
}

function referendumPath(slug: string) {
  return `/agencies/dcongress/referendums/${slug}`;
}

function summarizeReferendum(referendum: ReferendumToolRecord) {
  return {
    createdAt: referendum.createdAt.toISOString(),
    createdByUserId: referendum.createdByUserId,
    description: referendum.description,
    id: referendum.id,
    jurisdictionId: referendum.jurisdictionId,
    organizationPositionCount: referendum._count.organizationPositions,
    path: referendumPath(referendum.slug),
    slug: referendum.slug,
    status: referendum.status,
    surveyCount: referendum._count.surveys,
    title: referendum.title,
    updatedAt: referendum.updatedAt.toISOString(),
    voteCount: referendum._count.votes,
  };
}

function nextActionRecommendation(task: PersonalQueueRow | null) {
  if (!task) {
    return {
      label: "kill it",
      rationale: ["No unblocked, actionable private task found."],
    };
  }

  if (!task.valid || task.priority <= 0) {
    return {
      label: "kill it",
      rationale: [
        "Task priority model could not compute a positive score. Treat as low-value or invalid.",
      ],
    };
  }

  if (
    task.validationNotes.some((note) =>
      note.toLowerCase().includes("missing") ||
      note.toLowerCase().includes("invalid denominator")
    )
  ) {
    return {
      label: "clarify it",
      rationale: ["Task economics are missing/ambiguous; clarify key inputs first."],
    };
  }

  if (task.executorType === AI_EXECUTOR_TYPE) {
    return {
      label: "delegate it",
      rationale: ["This task is explicitly marked for AI-agent execution."],
    };
  }

  return {
    label: "do it",
    rationale: ["This is the highest-priority private, unblocked task."],
  };
}

function selectPersonalNextAction(queue: PersonalQueueRow[]) {
  const deadlineCriticalTasks = queue.filter(
    (task) =>
      (task.deadlinePolicy === "REQUIRED" &&
        (task.deadlineStatus === "start_now" || task.deadlineStatus === "missed")) ||
      (task.deadlinePolicy === "EXPIRES" && task.deadlineStatus === "start_now"),
  );
  const selected = deadlineCriticalTasks[0] ?? queue[0] ?? null;
  if (!selected) {
    return {
      deadlineOverride: false,
      selectionReason: "empty_queue",
      task: null,
    };
  }
  if (deadlineCriticalTasks.length > 0) {
    return {
      deadlineOverride: true,
      selectionReason:
        selected.deadlineStatus === "missed"
          ? "deadline_missed"
          : "deadline_latest_start",
      task: selected,
    };
  }
  return {
    deadlineOverride: false,
    selectionReason: "highest_priority",
    task: selected,
  };
}

// ---------------------------------------------------------------------------
// Shared `contextJson` schema exposed on createTask + updateTask
// ---------------------------------------------------------------------------
// Mirrors `TaskContextJsonSchema` in packages/web/src/lib/tasks/task-context.ts
// — the single source of truth on the render side. Kept hand-written here so
// MCP clients (Claude Code, Claude Desktop) see the structured slots instead
// of "Arbitrary structured metadata" and can populate the dossier/remind
// template when creating tasks. If you add a slot to the Zod schema, mirror
// it here. Round-trips are safe-parsed via `readTaskContext()` on the render
// side, so any extra properties are dropped silently.

const TASK_CONTEXT_JSON_SCHEMA = {
  type: "object" as const,
  description:
    "Rich task dossier read by the /tasks/[id] detail page. Every slot is optional; blocks no-op when absent. Mirror of TaskContextJsonSchema in task-context.ts.",
  properties: {
    assigneeProfile: {
      type: "object" as const,
      description:
        "Named-person assignee profile — drives the TaskAssigneeCard (photo already comes from Person.image).",
      properties: {
        role: { type: "string", description: "Office title, e.g. 'President'" },
        employerLabel: {
          type: "string",
          description: "Organization the assignee works for, e.g. 'Government of United States'",
        },
        employerCount: {
          type: "number",
          description: "Headcount of the assignee's constituency (citizens, employees, etc.)",
        },
        employerCountLabel: { type: "string", description: "Unit label for employerCount, e.g. 'citizens'" },
        salaryUsdPerYear: { type: "number", description: "Annual salary in USD" },
        budgetUsdPerYear: {
          type: "number",
          description: "Annual budget the assignee controls in USD (e.g. military spending for a head of gov)",
        },
        budgetLabel: {
          type: "string",
          description: "What kind of budget this is, e.g. 'Military spending', 'Agency operating budget', 'District appropriations'. Displayed next to budgetUsdPerYear on the detail page.",
        },
        jobQuote: {
          type: "object" as const,
          description: "Job description quote attributed to a source document (constitution, charter, etc.)",
          properties: {
            text: { type: "string" },
            source: { type: "string" },
          },
          required: ["text", "source"],
        },
        contactChannels: {
          type: "array" as const,
          description: "Direct-contact links the visitor can use to reach the assignee",
          items: {
            type: "object" as const,
            properties: {
              kind: {
                type: "string",
                enum: ["twitter", "bluesky", "email", "form", "phone"],
              },
              label: { type: "string" },
              href: { type: "string" },
            },
            required: ["kind", "label", "href"],
          },
        },
      },
    },
    difficulty: {
      type: "object" as const,
      description:
        "Task-level difficulty callout — drives the TaskDifficultyStrip block (TASK / WHAT IT MEANS / DIFFICULTY / TIME / SKILLS).",
      properties: {
        whatItMeans: { type: "string", description: "One-line plain-language restatement of the task" },
        label: { type: "string", description: "Difficulty label, e.g. 'Sign a piece of paper'" },
        timeRequiredSeconds: { type: "number", description: "Estimated time to complete in seconds" },
        skillsRequired: { type: "string", description: "Skills needed, e.g. 'Holding a pen'" },
      },
    },
    costOfDelayNote: {
      type: "string",
      description:
        "Optional human-readable note above the cost-of-delay counters. Supports {daysOverdue}/{deathsLocked}/{moneyDestroyed} tokens.",
    },
    unlocks: {
      type: "array" as const,
      description: "Downstream tasks or inline outcomes unlocked when this task completes.",
      items: {
        type: "object" as const,
        properties: {
          kind: { type: "string", enum: ["child-task", "inline"] },
          childTaskId: { type: "string", description: "Task id if kind=child-task" },
          icon: { type: "string", description: "Emoji prefix, e.g. '🔓'" },
          title: { type: "string" },
          summary: { type: "string" },
          beforeAfter: {
            type: "array" as const,
            description: "Before/after comparison rows (now → unlocked)",
            items: {
              type: "object" as const,
              properties: {
                label: { type: "string" },
                before: { type: "string" },
                after: { type: "string" },
              },
              required: ["label", "before", "after"],
            },
          },
          roiRatio: { type: "number", description: "ROI as an integer ratio, e.g. 45 for 45:1" },
          fullAnalysisUrl: { type: "string", description: "Link to the full methodology write-up" },
        },
        required: ["kind", "title"],
      },
    },
    performanceReview: {
      type: "object" as const,
      description:
        "Killing-vs-curing or similar comparison block rendered as horizontal bars + a ratio + a performance rating.",
      properties: {
        comparisonBars: {
          type: "array" as const,
          items: {
            type: "object" as const,
            properties: {
              label: { type: "string" },
              valueUsd: { type: "number" },
              color: { type: "string", enum: ["red", "green", "cyan", "pink", "yellow"] },
            },
            required: ["label", "valueUsd", "color"],
          },
        },
        ratio: {
          type: "object" as const,
          description: "Ratio callout like '1094 : 1 (killing to curing)'",
          properties: {
            left: { type: "number" },
            right: { type: "number" },
            label: { type: "string" },
          },
          required: ["left", "right", "label"],
        },
        perCitizen: {
          type: "array" as const,
          description: "Per-capita breakdown rows",
          items: {
            type: "object" as const,
            properties: {
              label: { type: "string" },
              valueUsd: { type: "number" },
            },
            required: ["label", "valueUsd"],
          },
        },
        narrative: { type: "string", description: "Short narrative paragraph in Wishonia voice" },
        rating: { type: "string", description: "Letter grade, e.g. 'F'" },
        firedFromWendys: {
          type: "boolean",
          description: "Bit of humor — 'Would be fired from Wendy's: Yes/No'",
        },
        scorecardUrl: { type: "string", description: "Link to the assignee's full scorecard" },
      },
    },
    reminder: {
      type: "object" as const,
      description:
        "Editable polite reminder the visitor can post to X/Bluesky. Tokens: {name} {handle} {daysOverdue} {deathsLocked} {moneyDestroyed} {sufferingHours} {salaryUsd} {budgetUsd} {taskTitle} {taskUrl}.",
      properties: {
        intro: { type: "string", description: "One-sentence intro above the textarea" },
        messageTemplate: {
          type: "string",
          description: "The editable template. Use \\n for line breaks.",
        },
      },
      required: ["messageTemplate"],
    },
    contextComparisons: {
      type: "array" as const,
      description:
        "'Things that take longer than 30 seconds' style comparison lists. Item values support the same template tokens as the reminder.",
      items: {
        type: "object" as const,
        properties: {
          heading: { type: "string" },
          items: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                label: { type: "string" },
                value: { type: "string" },
                highlight: {
                  type: "boolean",
                  description: "Flags the 'you are here' row (renders in brutal-red with '← you are' suffix)",
                },
              },
              required: ["label", "value"],
            },
          },
        },
        required: ["heading", "items"],
      },
    },
    blockedBy: {
      type: "object" as const,
      description: "Renders the TaskBlockerCard on blocked tasks that point at an upstream blocker.",
      properties: {
        taskId: { type: "string" },
        summary: { type: "string" },
        callToActionHref: { type: "string" },
      },
      required: ["taskId"],
    },
    acceptanceCriteria: {
      type: "array" as const,
      description: "Checkbox list of acceptance criteria",
      items: { type: "string" },
    },
    currentActivities: {
      type: "array" as const,
      description: "'Currently doing instead' block — what the assignee is doing in place of this task",
      items: {
        type: "object" as const,
        properties: {
          id: { type: "string" },
          description: { type: "string" },
          impactSummary: { type: "string" },
          methodology: { type: "string" },
          sourceUrl: { type: "string" },
          updated: { type: "string" },
        },
        required: ["description"],
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Tool definitions (shared between both transports)
// ---------------------------------------------------------------------------

const TASK_TOOL_DEFINITIONS = [
  {
    name: "getNextTask",
    description:
      "Get the highest expected-value unblocked task that the caller can work on. Returns the single best task to execute right now.",
    inputSchema: {
      type: "object" as const,
      properties: {
        skillTags: { type: "array", items: { type: "string" }, description: "Agent's skill tags for personalized ranking" },
        interestTags: { type: "array", items: { type: "string" }, description: "Agent's interest tags for personalized ranking" },
        maxDifficulty: { type: "string", enum: ["TRIVIAL", "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"], description: "Max difficulty the agent can handle" },
        availableHoursPerWeek: { type: "number", description: "Hours per week the agent can commit" },
        agentId: { type: "string", description: "Agent's unique identifier (to skip tasks leased by this agent)" },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        score: { type: "number", description: "Earth-level ranking score used by the legacy ranking path." },
        task: {
          type: "object",
          properties: {
            id: { type: "string", description: "Task identifier." },
            title: { type: "string", description: "Task title." },
            blocked: { type: "boolean", description: "Whether the task still has unresolved blockers." },
          },
        },
      },
    },
  },
  {
    name: "getQueueAudit",
    description:
      "Start here before trusting a personal task queue. Audits active owned private tasks for missing estimates, blocked dependencies, impossible priority inputs, required/expiring deadline risks, and other data issues. A life-planning agent should repair or clarify high-severity issues before relying on getNextAction.",
    inputSchema: { type: "object" as const, properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        summary: {
          type: "object",
          properties: {
            activeOwnedTasks: { type: "number", description: "Count of active owned tasks." },
            unblockedTasks: { type: "number", description: "How many owned tasks are currently unblocked." },
            issueCount: { type: "number", description: "Total queue quality issues found." },
          },
        },
        issues: {
          type: "array",
          description: "Queue issues that should be corrected before selecting the next action.",
          items: {
            type: "object",
            properties: {
              code: { type: "string", description: "Machine-readable issue code." },
              message: { type: "string", description: "Operator-readable issue summary." },
              severity: {
                type: "string",
                enum: ["high", "medium", "low"],
                description: "Issue severity for prioritization.",
              },
              taskId: { type: "string", description: "Task ID associated with the issue, if any." },
            },
          },
        },
      },
    },
    examples: [
      {
        input: {},
        output: {
          summary: { activeOwnedTasks: 6, unblockedTasks: 3, issueCount: 1 },
          issues: [
            {
              code: "MISSING_ESTIMATES",
              message: "Task task_abc is missing required estimate inputs for scoring.",
              severity: "medium",
              taskId: "task_abc",
            },
          ],
        },
      },
    ],
  },
  {
    name: "getMyQueue",
    description:
      "Get the authenticated user's available private self-work queue sorted by computed priority. Hidden rows include completed tasks, blocked tasks, future available_at tasks, AI Agent tasks, and expired EXPIRES opportunities. Use this for the user's own next actions.",
    inputSchema: {
      type: "object" as const,
      properties: {
        maxResults: { type: "number", description: "Max number of tasks to return (default 20, max 100)" },
        buybackRate: { type: "number", description: "USD per hour used to convert cash cost into time-equivalent penalty (default 1000)" },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        buybackRate: { type: "number", description: "USD/hour used for priority denominator cash-equivalent conversion." },
        queue: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Task identifier." },
              title: { type: "string", description: "Task title." },
              status: { type: "string", description: "Current task status." },
              priority: { type: "number", description: "Computed priority score." },
              hours: { type: ["number", "null"], description: "Estimated hours." },
              value: { type: ["number", "null"], description: "Gross conditional value if present." },
              pSuccess: { type: ["number", "null"], description: "Success probability if present." },
              cashCost: { type: "number", description: "Cash cost in USD." },
              availableAt: { type: ["string", "null"], description: "Earliest time this task should appear in active queues." },
              deadlinePolicy: { type: "string", enum: ["NONE", "SOFT", "EXPIRES", "REQUIRED"], description: "How dueAt should be interpreted." },
              deadlineStatus: { type: "string", enum: ["none", "future", "start_now", "overdue", "missed", "expired"], description: "Derived deadline state. Does not alter priority." },
              deadlineRationale: { type: ["string", "null"], description: "Freeform rationale for deadline policy." },
              latestStartAt: { type: ["string", "null"], description: "Latest start time implied by dueAt minus estimated hours." },
              timeUntilDueHours: { type: ["number", "null"], description: "Hours until dueAt." },
              executorType: { type: "string", description: "Self or AI Agent." },
              realEv: { type: "number", description: "Real expected value used by the priority formula." },
              blockersCount: { type: "number", description: "Total blockers on this task." },
              unblockedBlockers: { type: "number", description: "Number of blockers already cleared." },
              unresolvedBlockers: { type: "number", description: "Number of blockers not yet complete." },
            },
          },
        },
      },
    },
    examples: [
      {
        input: { maxResults: 2 },
        output: {
          buybackRate: 1000,
          queue: [
            {
              id: "task_example_1",
              title: "Prepare investor update",
              status: "ACTIVE",
              priority: 1200,
              hours: 1,
              value: 2500,
              pSuccess: 1,
              cashCost: 0,
              executorType: "Self",
              realEv: 2500,
              blockersCount: 0,
              unblockedBlockers: 0,
              unresolvedBlockers: 0,
            },
          ],
        },
      },
    ],
  },
  {
    name: "getAIQueue",
    description:
      "Get the authenticated user's available private AI-agent tasks sorted by computed priority. Use executor_type='AI Agent' for work the assistant can do autonomously; otherwise create normal self-work tasks with executor_type='Self'.",
    inputSchema: {
      type: "object" as const,
      properties: {
        maxResults: { type: "number", description: "Max number of tasks to return (default 20, max 100)" },
        buybackRate: { type: "number", description: "USD per hour used to convert cash cost into time-equivalent penalty (default 1000)" },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        buybackRate: { type: "number", description: "USD/hour used for priority denominator cash-equivalent conversion." },
        queue: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Task identifier." },
              title: { type: "string", description: "Task title." },
              assigneePersonId: { type: ["string", "null"], description: "Assignee person ID, if any." },
              assigneeOrganizationId: { type: ["string", "null"], description: "Assignee organization ID, if any." },
              priority: { type: "number", description: "Computed priority score." },
              hours: { type: ["number", "null"], description: "Estimated hours." },
              value: { type: ["number", "null"], description: "Gross conditional value if present." },
              pSuccess: { type: ["number", "null"], description: "Success probability if present." },
              cashCost: { type: "number", description: "Cash cost in USD." },
              availableAt: { type: ["string", "null"], description: "Earliest time this task should appear in active queues." },
              deadlinePolicy: { type: "string", enum: ["NONE", "SOFT", "EXPIRES", "REQUIRED"], description: "How dueAt should be interpreted." },
              deadlineStatus: { type: "string", enum: ["none", "future", "start_now", "overdue", "missed", "expired"], description: "Derived deadline state. Does not alter priority." },
              deadlineRationale: { type: ["string", "null"], description: "Freeform rationale for deadline policy." },
              latestStartAt: { type: ["string", "null"], description: "Latest start time implied by dueAt minus estimated hours." },
              timeUntilDueHours: { type: ["number", "null"], description: "Hours until dueAt." },
              executorType: { type: "string", description: "Self or AI Agent." },
              realEv: { type: "number", description: "Real expected value used by the priority formula." },
            },
          },
        },
      },
    },
  },
  {
    name: "getNextAction",
    description:
      "Get the best next self-work action from available private tasks. Priority is pure expected net value per hour-equivalent: (P(success) * value - cash_cost) / (hours + cash_cost / buybackRate). Dependencies decide availability. REQUIRED and EXPIRES deadline tasks can override pure priority when they have reached latest-start time.",
    inputSchema: {
      type: "object" as const,
      properties: {
        buybackRate: { type: "number", description: "USD per hour used to convert cash cost into time-equivalent penalty (default 1000)" },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        label: {
          type: "string",
          description: "Recommended action label: do it / delegate it / clarify it / kill it.",
        },
        rationale: {
          type: "array",
          items: { type: "string" },
          description: "Short recommendation rationale."
        },
        task: {
          type: ["object", "null"],
          description: "Top-scoring task to execute if available.",
        },
        priority: { type: "number", description: "Computed priority score for the suggested task." },
        deadlineOverride: {
          type: "boolean",
          description: "True when a required or expiring deadline task overrides the highest-priority task.",
        },
        selectionReason: {
          type: "string",
          enum: ["highest_priority", "deadline_latest_start", "deadline_missed", "empty_queue"],
          description: "Why this task was selected.",
        },
        queueAudit: {
          type: "object",
          properties: {
            activeOwnedTasks: { type: "number" },
            unblockedTasks: { type: "number" },
          },
        },
      },
    },
  },
  {
    name: "evaluateTaskEconomics",
    description: "Evaluate the execution economics for a single task. Returns whether the current agent should execute directly, delegate, prepare procurement, or raise money first.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID" },
        skillTags: { type: "array", items: { type: "string" }, description: "Agent's skill tags for capability matching" },
        interestTags: { type: "array", items: { type: "string" }, description: "Agent's interest tags for capability matching" },
        maxDifficulty: { type: "string", enum: ["TRIVIAL", "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"], description: "Max difficulty the agent can handle" },
        availableHoursPerWeek: { type: "number", description: "Hours per week the agent can commit" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "recordTaskActuals",
    description: "Record actual cash cost and effort on a task for non-claim execution paths.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID" },
        actualCashCostUsd: { type: "number", description: "Observed external cash cost in USD" },
        actualEffortSeconds: { type: "number", description: "Observed effort in seconds" },
        note: { type: "string", description: "Short execution note or procurement/funding rationale" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "listTasks",
    description: "List tasks with optional filters. Returns up to 50 tasks sorted by accountability score.",
    inputSchema: {
      type: "object" as const,
      properties: {
        status: { type: "string", enum: ["DRAFT", "ACTIVE", "VERIFIED", "STALE"], description: "Filter by task status" },
        category: { type: "string", description: "Filter by task category" },
        assigneePersonId: { type: "string", description: "Filter by assignee person ID" },
        assignedToMe: {
          type: "boolean",
          description: "Filter to tasks assigned to the authenticated user's canonical Person row.",
        },
        parentTaskId: { type: "string", description: "Filter by parent task ID (get subtasks)" },
        limit: { type: "number", description: "Max results (default 20, max 50)" },
      },
    },
  },
  {
    name: "getTask",
    description: "Get full details for a single task including impact estimates, milestones, dependencies, and evidence.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "listOrganizations",
    description:
      "List organizations (for example to create task targets), optionally including active/target-filtered tasks.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query for name, slug, description, website, or contact email." },
        type: {
          type: "string",
          enum: [
            "UNIVERSITY",
            "RESEARCH_CENTER",
            "NONPROFIT",
            "DAO",
            "GOVERNMENT",
            "GOVERNMENT_AGENCY",
            "HOSPITAL",
            "BIOTECH",
            "COMPANY",
            "FOUNDATION",
            "INTERGOVERNMENTAL",
            "MEDIA",
            "POLITICAL_PARTY",
            "ADVOCACY",
            "OTHER",
          ],
          description: "Optional organization type filter.",
        },
        status: {
          type: "string",
          enum: ["PENDING", "APPROVED", "REJECTED"],
          description: "Optional organization status filter.",
        },
        includeTasks: {
          type: "boolean",
          description:
            "Include a short active task summary for each organization (default false).",
        },
        limit: { type: "number", description: "Max organizations to return (default 100, max 500)." },
        taskLimit: {
          type: "number",
          description: "Max tasks per organization when includeTasks=true (default 3, max 50).",
        },
        taskScope: {
          type: "string",
          enum: ["public", "accessible"],
          description:
            "Task scope for returned summary. `public` is default and safe for shared data.",
        },
        taskStatus: {
          type: "string",
          enum: ["DRAFT", "ACTIVE", "VERIFIED", "STALE"],
          description: "Task status used when includeTasks=true (default ACTIVE).",
        },
      },
    },
  },
  {
    name: "getOrganizationTasks",
    description: "List tasks currently assigned to a specific organization.",
    inputSchema: {
      type: "object" as const,
      properties: {
        organizationId: { type: "string", description: "Organization ID." },
        limit: { type: "number", description: "Max tasks to return (default 50, max 200)." },
        scope: {
          type: "string",
          enum: ["public", "accessible"],
          description:
            "Use `public` unless you are explicitly authenticated and want your private assigned tasks.",
        },
        status: {
          type: "string",
          enum: ["DRAFT", "ACTIVE", "VERIFIED", "STALE"],
          description: "Optional task status filter.",
        },
      },
      required: ["organizationId"],
    },
  },
  {
    name: "listPeople",
    description: "List people (optionally public-figure-only) and optionally include their assigned active tasks.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search by display name, handle, current affiliation, source ref, or email." },
        publicProfilesOnly: {
          type: "boolean",
          description: "When true, only includes people marked as public-figure profiles (default true).",
        },
        includeTasks: {
          type: "boolean",
          description:
            "Include a short active task summary for each person (default false).",
        },
        limit: { type: "number", description: "Max people to return (default 100, max 500)." },
        taskLimit: {
          type: "number",
          description: "Max tasks per person when includeTasks=true (default 3, max 50).",
        },
        taskScope: {
          type: "string",
          enum: ["public", "accessible"],
          description:
            "Task scope for returned summary. `public` is default and safe for shared data.",
        },
        taskStatus: {
          type: "string",
          enum: ["DRAFT", "ACTIVE", "VERIFIED", "STALE"],
          description: "Task status used when includeTasks=true (default ACTIVE).",
        },
      },
    },
  },
  {
    name: "getPersonTasks",
    description: "List tasks currently assigned to a specific person.",
    inputSchema: {
      type: "object" as const,
      properties: {
        personId: { type: "string", description: "Person ID." },
        limit: { type: "number", description: "Max tasks to return (default 50, max 200)." },
        scope: {
          type: "string",
          enum: ["public", "accessible"],
          description:
            "Use `public` unless you are explicitly authenticated and want your private assigned tasks.",
        },
        status: {
          type: "string",
          enum: ["DRAFT", "ACTIVE", "VERIFIED", "STALE"],
          description: "Optional task status filter.",
        },
      },
      required: ["personId"],
    },
  },
  {
    name: "createPerson",
    description:
      "Create or idempotently update a person profile by displayName, email, sourceRef, or public-figure signature.",
    inputSchema: {
      type: "object" as const,
      properties: {
        displayName: { type: "string", description: "Person display name." },
        email: { type: "string", description: "Person email (used for de-dup and notification)." },
        currentAffiliation: { type: "string", description: "Current organization/affiliation." },
        countryCode: { type: "string", description: "ISO-3166 country code." },
        image: { type: "string", description: "Avatar image URL." },
        isPublicFigure: {
          type: "boolean",
          description: "Marks this person as a public-facing profile.",
        },
        sourceRef: { type: "string", description: "Stable source key for idempotent updates." },
        sourceUrl: { type: "string", description: "Source URL for provenance." },
      },
      required: ["displayName"],
    },
  },
  {
    name: "getMe",
    description:
      "Return the authenticated user's profile (User + canonical Person row). Use this to discover who you are acting as: userId, email, displayName, handle, avatar, bio, headline, website, social links, and visibility flags. No arguments — identity is taken from the OAuth bearer token.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "updateMyProfile",
    description:
      "Update the authenticated user's profile. Person is canonical for displayName/handle/bio; this tool writes Person first inside a transaction and mirrors the legacy User columns. Only fields you supply are changed. Pass `username: \"\"` (or null) to clear the handle. Returns the fresh profile.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Display name shown across the app." },
        username: {
          type: ["string", "null"],
          description:
            "Player-name handle, 3–24 chars, [A-Za-z0-9_-]. Empty/null clears it. Must be unique.",
        },
        bio: { type: "string", description: "Short bio." },
        headline: {
          type: ["string", "null"],
          description: "Optional one-line headline shown above the bio.",
        },
        website: {
          type: ["string", "null"],
          description: "Personal/profile URL.",
        },
        coverImage: {
          type: ["string", "null"],
          description: "Profile cover image URL.",
        },
        isPublic: {
          type: "boolean",
          description: "Whether the profile is publicly visible.",
        },
        newsletterSubscribed: {
          type: "boolean",
          description: "Whether to receive the newsletter.",
        },
        unsubscribedScopes: {
          type: "array",
          items: { type: "string" },
          description:
            "Email scopes to opt out of (transactional/master scopes are filtered out server-side).",
        },
      },
    },
  },
  {
    name: "createOrganization",
    description:
      "Create an organization (adds your user as owner) for task assignment, defaulting to pending state.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Organization name" },
        type: {
          type: "string",
          enum: [
            "UNIVERSITY",
            "RESEARCH_CENTER",
            "NONPROFIT",
            "DAO",
            "GOVERNMENT",
            "GOVERNMENT_AGENCY",
            "HOSPITAL",
            "BIOTECH",
            "COMPANY",
            "FOUNDATION",
            "INTERGOVERNMENTAL",
            "MEDIA",
            "POLITICAL_PARTY",
            "ADVOCACY",
            "OTHER",
          ],
          description: "Organization type",
        },
        website: { type: "string", description: "Website URL" },
        contactEmail: { type: "string", description: "Primary contact email" },
        description: { type: "string", description: "Mission or provenance note" },
        logo: { type: "string", description: "Logo image URL" },
        jurisdictionId: { type: "string", description: "Optional jurisdiction ID" },
      },
      required: ["name"],
    },
  },
  {
    name: "createTask",
    description:
      "Create a new private personal task. Private visibility is the default (isPublic=false), and private tasks default to ACTIVE so they can enter the queue immediately. For useful life planning, include hours, value, p_success, and cash_cost whenever possible; use depends_on for true prerequisites; use executor_type='Self' for user work and 'AI Agent' only for autonomous assistant work; use deadline_policy='REQUIRED' for must-do legal/health/safety tasks and 'EXPIRES' for opportunities that vanish after due_at.",
    inputSchema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Short imperative title" },
        description: { type: "string", description: "Full explanation and acceptance criteria" },
        parentTaskId: { type: "string", description: "Parent task ID for subtask hierarchy" },
        taskKey: { type: "string", description: "Stable dedup key (e.g. accountability:us:golf-2025)" },
        category: { type: "string", enum: ["ADVOCACY", "RESEARCH", "COMMUNICATION", "ENGINEERING", "ORGANIZING", "OUTREACH", "GOVERNANCE", "SCIENCE", "LEGAL", "CREATIVE", "OTHER"], description: "Task category" },
        difficulty: { type: "string", enum: ["TRIVIAL", "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"], description: "Optional metadata for public task presentation and capability filtering; not part of personal priority." },
        skillTags: { type: "array", items: { type: "string" }, description: "Skills needed" },
        interestTags: { type: "array", items: { type: "string" }, description: "Related topics/causes" },
        depends_on: {
          type: "array",
          items: { type: "string" },
          description: "Alias for blockerTaskIds: existing task IDs that must be VERIFIED before this task appears in active queues. Use only for real prerequisites, not generic importance.",
          minItems: 0,
        },
        blockerTaskIds: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional IDs of existing tasks that block this task (must be completed first). " +
            "Use searchTasks first to discover valid blocker task IDs.",
          minItems: 0,
        },
        blockedTaskIds: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional IDs of existing tasks that are blocked by this task (tasks that depend on it). " +
            "Use searchTasks first to discover valid dependent task IDs.",
          minItems: 0,
        },
        estimatedEffortHours: { type: "number", description: "Estimated hours to complete" },
        hours: { type: "number", description: "Alias for estimatedEffortHours. Required for reliable priority; use expected user hours, not calendar duration." },
        value: { type: "number", description: "Gross conditional value if the task succeeds. For required tasks, include avoided downside such as penalties, health loss, or system failure." },
        p_success: { type: "number", description: "Success probability, 0-1. MCP computes expected value as value * p_success when value is supplied." },
        cash_cost: { type: "number", description: "Cash cost in USD. Priority converts this to hour-equivalent cost using buybackRate, default $1000/hr." },
        executor_type: { type: "string", enum: ["Self", "AI Agent"], description: "Who should execute this task. Use Self for normal user tasks even if AI assists; use AI Agent only for autonomous assistant tasks." },
        expectedEconomicValueUsdBase: {
          type: "number",
          description: "Expected economic value in USD-equivalent welfare (probability-adjusted by your model)",
        },
        successProbabilityBase: {
          type: "number",
          description: "Estimated success probability for the task outcome, 0-1",
        },
        estimatedCashCostUsdBase: {
          type: "number",
          description: "One-time cash cost expected to execute this task (USD)",
        },
        timeToImpactStartDays: {
          type: "number",
          description: "Days until value can start being realized. Metadata/public impact-frame input; not part of personal priority.",
        },
        available_at: { type: "string", description: "Earliest time this task should appear in active queues (ISO 8601). Use for tasks that cannot or should not be started yet." },
        dueAt: { type: "string", description: "Due date (ISO 8601)" },
        due_at: { type: "string", description: "Alias for dueAt" },
        deadline_policy: {
          type: "string",
          enum: ["NONE", "SOFT", "EXPIRES", "REQUIRED"],
          description: "Whether due_at is ignored, a soft target, an expiring opportunity, or required work. REQUIRED is for must-do tasks like taxes or medicine refills; EXPIRES is for grants/applications/opportunities that vanish after due_at.",
        },
        deadline_rationale: {
          type: "string",
          description: "Freeform rationale for the deadline policy, e.g. taxes must be filed by a legal deadline.",
        },
        completedAt: { type: "string", description: "Completion date (ISO 8601) for tasks that already happened" },
        verifiedAt: { type: "string", description: "Verification date (ISO 8601) for tasks confirmed as done" },
        claimPolicy: { type: "string", enum: ["ASSIGNED_ONLY", "OPEN_SINGLE", "OPEN_MANY"], description: "Who can claim this task" },
        assigneePersonId: { type: "string", description: "Person ID to assign this task to" },
        assigneeOrganizationId: { type: "string", description: "Organization ID to assign this task to" },
        roleTitle: { type: "string", description: "Role of the assignee (e.g. President, Commissioner)" },
        sourceUrl: { type: "string", description: "URL to the source/evidence for this task" },
        contactUrl: { type: "string", description: "URL for contacting the assignee" },
        contactLabel: { type: "string", description: "Label for the contact channel" },
        impactStatement: { type: "string", description: "Why this matters" },
        ev_math: { type: "string", description: "Freeform rationale for value/probability/hour assumptions" },
        can_delegate: { type: "boolean", description: "Whether an agent or contractor can do this task" },
        best_route: { type: "string", description: "Best execution route, e.g. self, agent, contractor" },
        acceptanceCriteria: {
          type: "array",
          items: { type: "string" },
          description:
            "Structured acceptance criteria. If omitted, createTask also extracts checklist bullets under a markdown 'Acceptance criteria' heading in description.",
        },
        isPublic: { type: "boolean", description: "Visible in public views (default false)" },
        contextJson: TASK_CONTEXT_JSON_SCHEMA,
        sortOrder: { type: "number", description: "Manual display order for public/task-tree views (lower = earlier). Not the computed personal priority score." },
      },
      required: ["title"],
    },
  },

  {
    name: "deleteTask",
    description: "Delete one of your own tasks (soft delete). Deletes are scoped to the authenticated user as owner.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID to delete" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "upsertOrganization",
    description:
      "Create or update a general Organization record for task assignment. This is not outreach-specific; use it for nonprofits, governments, companies, universities, and other assignees.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Organization name" },
        type: {
          type: "string",
          enum: [
            "UNIVERSITY",
            "RESEARCH_CENTER",
            "NONPROFIT",
            "DAO",
            "GOVERNMENT",
            "GOVERNMENT_AGENCY",
            "HOSPITAL",
            "BIOTECH",
            "COMPANY",
            "FOUNDATION",
            "INTERGOVERNMENTAL",
            "MEDIA",
            "POLITICAL_PARTY",
            "ADVOCACY",
            "OTHER",
          ],
          description: "Organization type",
        },
        website: { type: "string", description: "Website URL" },
        contactEmail: { type: "string", description: "General contact email" },
        description: { type: "string", description: "Mission or provenance note" },
        logo: { type: "string", description: "Logo image URL" },
        sourceRef: { type: "string", description: "Stable source reference for idempotent imports" },
        sourceUrl: { type: "string", description: "Source URL proving this organization/contact" },
      },
      required: ["name"],
    },
  },
  {
    name: "proposeTaskBundle",
    description: "Propose a bundle of tasks for review. Creates each as DRAFT, runs validation, returns review decisions. Does NOT auto-promote.",
    inputSchema: {
      type: "object" as const,
      properties: {
        candidates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Short imperative title" },
              description: { type: "string", description: "Action and acceptance criteria" },
              taskKey: { type: "string", description: "Stable key for dedup" },
              id: { type: "string", description: "Draft reference ID" },
              assigneePersonId: { type: "string" },
              assigneeOrganizationId: { type: "string" },
              roleTitle: { type: "string" },
              contactUrl: { type: "string" },
              sourceUrls: { type: "array", items: { type: "string" } },
              blockerRefs: { type: "array", items: { type: "string" }, description: "IDs or taskKeys of tasks that must complete first" },
              parentTaskRef: { type: "string", description: "ID or taskKey of parent task" },
              estimatedEffortHours: { type: "number" },
              isPublic: { type: "boolean" },
              impact: {
                type: "object",
                properties: {
                  delayDalysLostPerDay: { type: "number", description: "Expected DALYs lost per day of delay; use only with a sourced delay model" },
                  delayEconomicValueUsdLostPerDay: { type: "number", description: "Expected USD-equivalent welfare lost per day of delay; use only with a sourced delay model" },
                  expectedValuePerHourDalys: { type: "number", description: "Probability-weighted expected DALYs per hour, not gross conditional value" },
                  expectedValuePerHourUsd: { type: "number", description: "Probability-weighted expected USD-equivalent welfare per hour, not gross conditional value" },
                },
              },
            },
            required: ["title"],
          },
          description: "Tasks to propose",
        },
      },
      required: ["candidates"],
    },
  },
  {
    name: "promoteTask",
    description: "Promote reviewed DRAFT tasks to ACTIVE. Promotion reruns governance review and rejects tasks that fail the current checks.",
    inputSchema: {
      type: "object" as const,
      properties: {
        proposalRefs: { type: "array", items: { type: "string" }, description: "Proposal refs (task IDs or taskKeys) to promote" },
      },
      required: ["proposalRefs"],
    },
  },
  {
    name: "updateTask",
    description: "Update a private task's estimates, dependencies, deadline metadata, executor, or status. Mark work done with status='VERIFIED'. Passing depends_on replaces the blocker set idempotently, so keep it complete.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID" },
        status: { type: "string", enum: ["DRAFT", "ACTIVE", "VERIFIED", "STALE"] },
        title: { type: "string" },
        description: { type: "string" },
        completionEvidence: { type: "string", description: "Evidence that the task is done" },
        impactStatement: { type: "string" },
        difficulty: { type: "string", enum: ["TRIVIAL", "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"], description: "Optional metadata; not part of personal priority." },
        taskKey: { type: "string", description: "Stable dedup key" },
        assigneePersonId: { type: "string", description: "Person ID to assign (use empty string to clear)" },
        assigneeOrganizationId: { type: "string", description: "Organization ID to assign (use empty string to clear)" },
        roleTitle: { type: "string", description: "Role of the assignee" },
        sourceUrl: { type: "string", description: "URL to the source/evidence" },
        completedAt: { type: "string", description: "Completion date (ISO 8601), use empty string to clear" },
        verifiedAt: { type: "string", description: "Verification date (ISO 8601), use empty string to clear" },
        available_at: { type: "string", description: "Earliest time this task should appear in active queues (ISO 8601), use empty string to clear" },
        dueAt: { type: "string", description: "Due date (ISO 8601), use empty string to clear" },
        due_at: { type: "string", description: "Alias for dueAt, use empty string to clear" },
        deadline_policy: {
          type: "string",
          enum: ["NONE", "SOFT", "EXPIRES", "REQUIRED"],
          description: "Whether dueAt is ignored, a soft target, an expiring opportunity, or required work.",
        },
        deadline_rationale: {
          type: "string",
          description: "Freeform rationale for the deadline policy.",
        },
        contextJson: {
          ...TASK_CONTEXT_JSON_SCHEMA,
          description:
            "Rich task dossier slots — merged with existing contextJson. Mirror of TaskContextJsonSchema. See createTask for the full slot list.",
        },
        depends_on: {
          type: "array",
          items: { type: "string" },
          description: "Replace blocker dependencies with this exact list of task IDs. Blockers must be completed/VERIFIED before this task appears in active queues.",
        },
        blockerTaskIds: {
          type: "array",
          items: { type: "string" },
          description: "Replace blocker dependencies with this exact list of task IDs.",
        },
        hours: { type: "number", description: "Alias for estimatedEffortHours. Keep this current when task scope changes." },
        value: { type: "number", description: "Gross conditional value if the task succeeds. Update when the upside/downside estimate changes." },
        p_success: { type: "number", description: "Success probability, 0-1. Update after new information changes the odds." },
        cash_cost: { type: "number", description: "Cash cost in USD. Update if execution cost changes." },
        executor_type: { type: "string", enum: ["Self", "AI Agent"], description: "Who should execute this task. Use Self for normal user tasks even with AI assistance; AI Agent means autonomous assistant work." },
        ev_math: { type: "string", description: "Freeform rationale for value/probability/hour assumptions" },
        can_delegate: { type: "boolean", description: "Whether an agent or contractor can do this task" },
        best_route: { type: "string", description: "Best execution route, e.g. self, agent, contractor" },
        acceptanceCriteria: {
          type: "array",
          items: { type: "string" },
          description:
            "Structured acceptance criteria. If omitted while description is updated, updateTask can extract checklist bullets under a markdown 'Acceptance criteria' heading.",
        },
        sortOrder: { type: "number", description: "Manual display order for public/task-tree views (lower = earlier). Not the computed personal priority score." },
      },
      required: ["taskId"],
    },
  },
  {
    name: "setTaskImpact",
    description:
      "Create or replace a task impact estimate. Values are USD-equivalent welfare; expectedEconomicValueUsd* fields must already be probability-weighted. Include low/base/high ranges, assumptions, and sourceUrls for subjective or high-value estimates. Negative values represent harm caused.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID to attach impact to" },
        frameKey: { type: "string", enum: ["IMMEDIATE", "ONE_YEAR", "FIVE_YEAR", "TWENTY_YEAR", "LIFETIME"], description: "Time horizon for evaluation (default: FIVE_YEAR)" },
        frame: {
          type: "object",
          description:
            "Low/base/high impact frame. expectedEconomicValueUsd* is already probability-weighted; for Notion imports use P(success) * Value.",
          properties: {
            evaluationHorizonYears: { type: "number", description: "Years covered by this estimate" },
            successProbabilityLow: { type: "number", description: "Low success probability, 0-1" },
            successProbabilityBase: { type: "number", description: "Base success probability, 0-1" },
            successProbabilityHigh: { type: "number", description: "High success probability, 0-1" },
            delayDalysLostPerDayLow: { type: "number" },
            delayDalysLostPerDayBase: { type: "number" },
            delayDalysLostPerDayHigh: { type: "number" },
            delayEconomicValueUsdLostPerDayLow: { type: "number" },
            delayEconomicValueUsdLostPerDayBase: { type: "number" },
            delayEconomicValueUsdLostPerDayHigh: { type: "number" },
            expectedDalysAvertedLow: { type: "number" },
            expectedDalysAvertedBase: { type: "number" },
            expectedDalysAvertedHigh: { type: "number" },
            expectedEconomicValueUsdLow: { type: "number", description: "Low probability-weighted USD-equivalent welfare" },
            expectedEconomicValueUsdBase: { type: "number", description: "Base probability-weighted USD-equivalent welfare" },
            expectedEconomicValueUsdHigh: { type: "number", description: "High probability-weighted USD-equivalent welfare" },
            estimatedCashCostUsdLow: { type: "number" },
            estimatedCashCostUsdBase: { type: "number" },
            estimatedCashCostUsdHigh: { type: "number" },
            estimatedEffortHoursLow: { type: "number" },
            estimatedEffortHoursBase: { type: "number" },
            estimatedEffortHoursHigh: { type: "number" },
          },
        },
        metrics: {
          type: "array",
          description: "Custom impact metrics (lives lost, taxpayer cost, suffering hours, etc.)",
          items: {
            type: "object",
            properties: {
              metricKey: { type: "string", description: "Stable key (e.g. lives_lost, taxpayer_cost_usd)" },
              baseValue: { type: "number", description: "Primary estimate (negative = harm)" },
              lowValue: { type: "number" },
              highValue: { type: "number" },
              unit: { type: "string", description: "Unit label (e.g. lives, USD, hours)" },
              displayGroup: { type: "string", description: "UI grouping label" },
            },
            required: ["metricKey", "baseValue", "unit"],
          },
        },
        assumptions: {
          type: "array",
          items: { type: "string" },
          description: "Human-readable assumptions, including probability gates and why subjective values are plausible",
        },
        sourceUrls: {
          type: "array",
          items: { type: "string" },
          description: "Sources/citations for the value, probability, deadline, or conversion assumptions",
        },
        estimateNotes: {
          type: "string",
          description: "Short explanation of the calculation and what would change the estimate",
        },
        calculationVersion: { type: "string", description: "Version tag for the calculation method" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "claimTask",
    description: "Claim a task for a user. The agent declares intent to work on it.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID to claim" },
        userId: { type: "string", description: "User ID claiming the task (auto-filled for authenticated users)" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "claimSignerReminder",
    description:
      "Commit to reminding a specific head of state (or other 1% Treaty signer) to sign. Creates a private reminder subtask owned by you, parented to the signer task. The subtask carries an actionLink to a Google search for the signer's official contact, plus an outreach message template with your referral code embedded so any signer click-through credits you. Idempotent: calling twice with the same signer returns the existing subtask. The subtask auto-VERIFIES when the signer signs the treaty via your referral.",
    inputSchema: {
      type: "object" as const,
      properties: {
        signerTaskId: {
          type: "string",
          description:
            "Task ID of the parent signer task (e.g. 1-pct-treaty-signer-us). Use listTasks or searchTasks with status=ACTIVE to find candidates.",
        },
      },
      required: ["signerTaskId"],
    },
  },
  {
    name: "completeTaskClaim",
    description: "Mark a claimed task as completed with evidence of what was done.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID" },
        userId: { type: "string", description: "User ID who claimed it (auto-filled for authenticated users)" },
        completionEvidence: { type: "string", description: "What was done and proof it worked" },
      },
      required: ["taskId", "completionEvidence"],
    },
  },
  {
    name: "updateMilestone",
    description: "Update a task milestone's status with evidence.",
    inputSchema: {
      type: "object" as const,
      properties: {
        milestoneId: { type: "string", description: "Milestone ID" },
        status: { type: "string", enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "VERIFIED"], description: "New milestone status" },
        evidence: { type: "string", description: "Evidence for the status change" },
      },
      required: ["milestoneId", "status"],
    },
  },
  {
    name: "addDependency",
    description:
      "Add a dependency between tasks. The blocked task cannot proceed until the blocker is done. Optional edge metadata can estimate how much the blocker raises downstream success probability or accelerates downstream value.",
    inputSchema: {
      type: "object" as const,
      properties: {
        blockedTaskId: { type: "string", description: "Task that is blocked" },
        blockerTaskId: { type: "string", description: "Task that must complete first" },
        probabilityDeltaBase: {
          type: "number",
          description:
            "Base probability lift, 0-1, produced by completing blockerTaskId for blockedTaskId.",
        },
        increases_p_success: {
          type: "number",
          description:
            "Alias for probabilityDeltaBase. Use for Notion-style 'this prerequisite raises downstream P(success)' estimates.",
        },
        timeDeltaDaysBase: {
          type: "number",
          description:
            "Base days of acceleration produced by completing blockerTaskId for blockedTaskId.",
        },
        time_delta_days: {
          type: "number",
          description: "Alias for timeDeltaDaysBase.",
        },
        assumptions: {
          type: "array",
          items: { type: "string" },
          description: "Short assumptions behind the edge lift estimate.",
        },
        calculationVersion: {
          type: "string",
          description: "Optional version tag for the edge-lift calculation.",
        },
        label: { type: "string", description: "Optional note describing the dependency" },
        notes: { type: "string", description: "Optional note describing the dependency" },
      },
      required: ["blockedTaskId", "blockerTaskId"],
    },
  },
  {
    name: "getBlockers",
    description: "Get all tasks blocking a given task, and all tasks this task blocks.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "logAgentRun",
    description: "Log an agent's work — what it did, what it cost, what task it advanced.",
    inputSchema: {
      type: "object" as const,
      properties: {
        runId: { type: "string", description: "Unique run identifier" },
        provider: { type: "string", description: "AI provider (gemini, anthropic, openai)" },
        costUsd: { type: "number", description: "Total cost in USD" },
        apiCalls: { type: "number", description: "Number of API calls" },
        taskId: { type: "string", description: "Task this run worked on" },
        status: { type: "string", enum: ["RUNNING", "COMPLETED", "FAILED", "PARTIAL"] },
        outputSummary: { type: "string", description: "What the run produced" },
        depositId: { type: "string", description: "Deposit that funded this run" },
      },
      required: ["runId", "provider", "costUsd", "apiCalls"],
    },
  },
  {
    name: "acquireLease",
    description: "Acquire a short-lived lease on a task to prevent other agents from working it simultaneously.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID to lease" },
        agentId: { type: "string", description: "Unique agent identifier" },
        leaseSeconds: { type: "number", description: "Lease duration in seconds (default 600)" },
      },
      required: ["taskId", "agentId"],
    },
  },
  {
    name: "heartbeatLease",
    description: "Extend an active lease. Call periodically to prevent expiry while working.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID" },
        agentId: { type: "string", description: "Agent identifier" },
        leaseSeconds: { type: "number", description: "New lease duration in seconds (default 600)" },
      },
      required: ["taskId", "agentId"],
    },
  },
  {
    name: "releaseLease",
    description: "Voluntarily release a lease so another agent can pick up the task.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID" },
        agentId: { type: "string", description: "Agent identifier" },
      },
      required: ["taskId", "agentId"],
    },
  },
  {
    name: "getFundingStats",
    description: "Get aggregate funding stats — total deposited, total spent, total agent runs, remaining budget.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "listReferendums",
    description:
      "List Optimitron referendums. Public callers see active referendums by default; admins can filter by DRAFT, ACTIVE, or CLOSED.",
    inputSchema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["DRAFT", "ACTIVE", "CLOSED"],
          description: "Referendum status filter. Defaults to ACTIVE.",
        },
        query: {
          type: "string",
          description: "Optional search over title, slug, and description.",
        },
        limit: {
          type: "number",
          description: "Max referendums to return (default 20, max 100).",
        },
      },
    },
  },
  {
    name: "createReferendum",
    description:
      "Create a new referendum row. Defaults to DRAFT so a new question does not start accepting votes until intentionally activated.",
    inputSchema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Human-readable referendum title." },
        slug: {
          type: "string",
          description: "Optional URL slug. Defaults to a slugified title.",
        },
        description: {
          type: "string",
          description: "Public framing text for the referendum page.",
        },
        status: {
          type: "string",
          enum: ["DRAFT", "ACTIVE", "CLOSED"],
          description: "Initial status. Defaults to DRAFT.",
        },
        jurisdictionId: {
          type: "string",
          description: "Optional jurisdiction ID if this referendum is scoped.",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "searchRepo",
    description:
      "Search allowed GitHub repositories through the server-side GitHub API token. Returns matching files and text-match snippets without exposing the token.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search string, e.g. a function name, symbol, or code fragment.",
        },
        repo: {
          type: "string",
          description:
            "Repository name or owner/repo. Default: the configured Optimitron repo.",
        },
        path: {
          type: "string",
          description: "Optional directory path qualifier, e.g. packages/web/src/lib.",
        },
        fileType: {
          type: "string",
          description: "Optional file extension without a dot, e.g. ts or tsx.",
        },
        limit: {
          type: "number",
          description: "Max GitHub code-search results to return (default 10, max 25).",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "getFileContent",
    description:
      "Fetch one allowed GitHub repository file through the server-side GitHub Contents API.",
    inputSchema: {
      type: "object" as const,
      properties: {
        repo: { type: "string", description: "Repository name or owner/repo." },
        path: { type: "string", description: "File path within the repo." },
        ref: {
          type: "string",
          description: "Optional branch, tag, or commit SHA. Default: main.",
        },
      },
      required: ["repo", "path"],
    },
  },
  {
    name: "listRepoFiles",
    description:
      "List files/directories from an allowed GitHub repository directory through the server-side GitHub Contents API.",
    inputSchema: {
      type: "object" as const,
      properties: {
        repo: { type: "string", description: "Repository name or owner/repo." },
        path: {
          type: "string",
          description: "Directory path within the repo. Default: repo root.",
        },
        ref: {
          type: "string",
          description: "Optional branch, tag, or commit SHA. Default: main.",
        },
      },
      required: ["repo"],
    },
  },
  {
    name: "githubApi",
    description:
      "Admin-only generic pass-through to api.github.com using the server-side token. Use this for issues, PRs, discussions, commit statuses, workflow runs, agent tasks, etc. — anything the dedicated tools don't already cover. Repo-allowlist is enforced on /repos/<owner>/<repo>/* paths; non-repo paths (/user, /search/code, /octocat) rely on the token's fine-grained scopes for safety. Returns { status, ok, body }.",
    inputSchema: {
      type: "object" as const,
      properties: {
        method: {
          type: "string",
          enum: ["GET", "POST", "PATCH", "PUT", "DELETE"],
          description: "HTTP method. Default: GET.",
        },
        path: {
          type: "string",
          description:
            "Path on api.github.com starting with '/', e.g. '/repos/mikepsinn/optimitron/issues' or '/search/code'.",
        },
        query: {
          type: "object",
          description:
            "Optional query-string params, e.g. { per_page: 50, state: 'open' }.",
          additionalProperties: true,
        },
        body: {
          description:
            "Optional request body for non-GET requests. Pass an object (auto-JSON.stringify'd) or a raw string.",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "listSitePages",
    description:
      "Return a structured inventory of pages for configured Optimitron-owned domains. Agents should call this before creating a new page.",
    inputSchema: {
      type: "object" as const,
      properties: {
        site: {
          type: "string",
          description:
            "Optional domain filter, e.g. optimitron.com, warondisease.org, 1percenttreaty.org, trialabundancesurvey.org, dfda.earth, dih.earth, or manual.warondisease.org.",
        },
      },
    },
  },
  {
    name: "getPageContent",
    description:
      "Fetch an Optimitron-owned page URL and return clean markdown, title, section headings, and last-modified metadata.",
    inputSchema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "Full URL of an allowed page." },
      },
      required: ["url"],
    },
  },
  // -- RAG / Wishonia tools --
  {
    name: "searchManual",
    description: "Search the Optimitron manual, disease eradication plan, and related documentation. Returns relevant context with citations.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query (e.g. 'FDA approval timeline', 'RAPPA preference aggregation')" },
        maxResults: { type: "number", description: "Max results to return (default 5)" },
      },
      required: ["query"],
    },
  },
  {
    name: "askWishonia",
    description: "Ask Wishonia a question — she answers in character using retrieved documentation from the Optimitron manual and disease eradication plan.",
    inputSchema: {
      type: "object" as const,
      properties: {
        question: { type: "string", description: "Your question for Wishonia" },
      },
      required: ["question"],
    },
  },
  {
    name: "searchTasks",
    description:
      "Search your accessible tasks by title, description, task key, assignee, or organization. " +
      "Use this before createTask/updateTask when you need blockerTaskIds or blockedTaskIds.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query text." },
        limit: { type: "number", description: "Max results to return (default 20, max 100)" },
        scope: {
          type: "string",
          enum: ["public", "accessible"],
          description:
            "What visibility to search. Use public for public tasks only, accessible for your private + public tasks.",
        },
        status: {
          type: "string",
          enum: ["DRAFT", "ACTIVE", "VERIFIED", "STALE"],
          description: "Optional status filter to narrow dependency candidates.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "postTaskComment",
    description: `Post a comment on a task. Message is GitHub-flavored markdown with these extensions:
- Math: $inline$ or $$block$$ (rendered via KaTeX)
- Diagrams: \`\`\`mermaid ... \`\`\` fences (rendered via Mermaid)
- Charts: \`\`\`chart { ...Chart.js config JSON... } \`\`\` fences
- Images: ![alt](url) inline
- Tables, lists, strikethrough, code blocks, blockquotes — all standard
Max length: 20,000 characters. Rate limit: 5 comments per task per hour.
Posting a comment automatically sends comment notifications to task recipients and triggers a Wishonia auto-reply in the background.`,
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID to comment on" },
        parentCommentId: {
          type: "string",
          description: "Optional parent comment ID if this is a reply",
        },
        message: {
          type: "string",
          description: "Markdown body (1-20000 chars, supports math/mermaid/chart fences)",
        },
        mediaUrl: {
          type: "string",
          description: "Optional evidence URL (tweet, screenshot, article)",
        },
      },
      required: ["taskId", "message"],
    },
  },
  {
    name: "voteTaskComment",
    description: "Upvote (+1), downvote (-1), or remove vote (0) on a task comment.",
    inputSchema: {
      type: "object" as const,
      properties: {
        commentId: { type: "string", description: "Comment ID to vote on" },
        value: {
          type: "number",
          description: "+1 upvote, -1 downvote, 0 remove vote",
        },
      },
      required: ["commentId", "value"],
    },
  },
  {
    name: "deleteTaskComment",
    description: "Soft-delete your own comment (or any comment if you are a curator).",
    inputSchema: {
      type: "object" as const,
      properties: {
        commentId: { type: "string", description: "Comment ID to delete" },
      },
      required: ["commentId"],
    },
  },
  {
    name: "getTaskComments",
    description:
      "Fetch paginated comments for a task. Returns comments with vote scores, nested replies, and recent activity events.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID to read comments for" },
        sort: {
          type: "string",
          description: "'new' (default) or 'top'",
          enum: ["new", "top"],
        },
        cursor: {
          type: "string",
          description: "ISO timestamp cursor from a previous response's nextCursor",
        },
        limit: { type: "number", description: "Default 50, max 100" },
      },
      required: ["taskId"],
    },
  },
  ...TASK_TRIGGER_TOOL_DEFINITIONS,
];

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a configured MCP server instance.
 *
 * @param userId  Authenticated user ID (undefined = public-only access)
 * @param scopes  Granted OAuth scopes. Undefined denies all scoped tools.
 */
export function createMcpServer(
  userId?: string,
  scopes?: McpScope[],
  options: { isAdmin?: boolean } = {},
): Server {
  const isAdmin = options.isAdmin === true;
  const server = new Server(
    { name: "optimitron-tasks", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  // -- Tool listing (filtered by granted scopes) --
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TASK_TOOL_DEFINITIONS.filter(
      (t) =>
        hasScope(scopes, t.name) &&
        (!ADMIN_ONLY_TOOLS.has(t.name) || isAdmin),
    ),
  }));

  // -- Tool dispatch --
  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: { params: { arguments?: unknown; name: string } }) => {
    const { name, arguments: args } = request.params;
    const a = (args ?? {}) as Record<string, unknown>;

    // Scope check
    if (!hasScope(scopes, name)) {
      return err(`Insufficient scope for tool "${name}". Required: ${TOOL_SCOPES[name]?.join(", ")}`);
    }
    if (ADMIN_ONLY_TOOLS.has(name) && !isAdmin) {
      return err(`Admin privileges are required for public/Earth task tool "${name}".`);
    }

    try {
      if (isTaskTriggerToolName(name)) {
        return handleTaskTriggerToolCall({
          args: a,
          isAdmin,
          name,
          userId: userId ?? null,
        });
      }

      switch (name) {
        // ── getNextTask ────────────────────────────────────────
        case "getNextTask": {
          const { tasks, ranking, lease } = await getTaskFunctions();
          const allTasks = await tasks.listTasks({
            limit: 5000,
            visibility: "public",
            status: TaskStatus.ACTIVE,
          });
          const user = {
            skillTags: (a.skillTags as string[]) ?? [],
            interestTags: (a.interestTags as string[]) ?? [],
            maxTaskDifficulty: (a.maxDifficulty as TaskDifficulty) ?? null,
            availableHoursPerWeek: (a.availableHoursPerWeek as number) ?? null,
          };
          const ranked = ranking.rankTasksForUser(allTasks, user, 100, {
            preferLeafExecution: true,
          });

          const agentId = (a.agentId as string) ?? null;
          const available = [];
          for (const entry of ranked) {
            const taskId = (entry.task as Record<string, unknown>).id as string;
            const leaseStatus = await lease.isTaskLeased(taskId);
            if (!leaseStatus.leased || leaseStatus.agentId === agentId) {
              available.push(entry);
              break;
            }
          }

          if (available.length === 0) {
            return ok({ message: "No actionable tasks found", task: null });
          }
          const best = available[0]!;
          return ok({ score: best.score, task: summarizeTask(best.task) });
        }

        // ── getMyQueue ─────────────────────────────────────────
        case "getMyQueue": {
          if (!userId)
            return authRequired(
              "getMyQueue",
              "It returns the tasks you own ranked by task priority.",
            );

          const { tasks, ranking } = await getTaskFunctions();
          const maxResults = parseQueueLimit(a.maxResults, 20, 100);
          const buybackRate = parsePositiveNumber(a.buybackRate, DEFAULT_PERSONAL_BUYBACK_RATE);
          const ownedTasks = await tasks.listTasks({
            limit: 5000,
            status: TaskStatus.ACTIVE,
            userId,
            visibility: "owned",
          });
          const selfTasks = (ownedTasks as unknown[]).filter((task) =>
            isSelfExecutableTask(task as PersonalQueueTaskRecord),
          );
          const queue = buildPersonalQueueRows(selfTasks, ranking, buybackRate, {
            limit: maxResults,
            requireUnblocked: true,
          });

          return ok({ buybackRate, queue });
        }

        // ── getAIQueue ────────────────────────────────────────
        case "getAIQueue": {
          if (!userId)
            return authRequired(
              "getAIQueue",
              "It returns your AI-assigned tasks — there is no \"your\" without identity.",
            );

          const { tasks, ranking } = await getTaskFunctions();
          const maxResults = parseQueueLimit(a.maxResults, 20, 100);
          const buybackRate = parsePositiveNumber(a.buybackRate, DEFAULT_PERSONAL_BUYBACK_RATE);
          const ownedTasks = await tasks.listTasks({
            limit: 5000,
            status: TaskStatus.ACTIVE,
            userId,
            visibility: "owned",
          });
          const assignedTasks = (ownedTasks as unknown[]).filter((task) =>
            isAIExecutableTask(task as PersonalQueueTaskRecord),
          );
          const queue = buildPersonalQueueRows(assignedTasks, ranking, buybackRate, {
            limit: maxResults,
            requireUnblocked: true,
          });

          return ok({ buybackRate, queue });
        }

        // ── getQueueAudit ──────────────────────────────────────
        case "getQueueAudit": {
          if (!userId)
            return authRequired(
              "getQueueAudit",
              "It audits the validity of your owned-task queue and needs to know which user's queue to inspect.",
            );

          const prisma = await getPrisma();
          const { tasks, ranking } = await getTaskFunctions();
          const buybackRate = parsePositiveNumber(a.buybackRate, DEFAULT_PERSONAL_BUYBACK_RATE);
          const ownedTasks = (await tasks.listTasks({
            limit: 5000,
            status: TaskStatus.ACTIVE,
            userId,
            visibility: "owned",
          })) as PersonalQueueTaskRecord[];
          const rankedRows = buildPersonalQueueRows(ownedTasks, ranking, buybackRate, {
            limit: ownedTasks.length,
          });
          const unblockedCount = buildPersonalQueueRows(ownedTasks, ranking, buybackRate, {
            limit: ownedTasks.length,
            requireUnblocked: true,
          }).length;

          const rowById = new Map(rankedRows.map((row) => [row.id, row]));
          const issues: Array<{
            code: string;
            message: string;
            severity: "high" | "medium" | "low";
            taskId?: string;
          }> = [];

          const taskIds = ownedTasks.map((task) => task.id);
          const dependencyEdges = await prisma.taskEdge.findMany({
            where: { toTaskId: { in: taskIds }, deletedAt: null },
            select: {
              fromTaskId: true,
              toTaskId: true,
              fromTask: { select: { id: true, deletedAt: true, status: true } },
            },
          });
          const orphanedDependencyTaskIds = new Set<string>();
          for (const edge of dependencyEdges) {
            if (!edge.fromTask || edge.fromTask.deletedAt != null) {
              orphanedDependencyTaskIds.add(edge.toTaskId);
            }
          }

          for (const task of ownedTasks) {
            const row = rowById.get(task.id);
            if (!row) continue;

            if (row.validationNotes.some((note) => note.toLowerCase().includes("missing"))) {
              issues.push({
                code: "MISSING_ESTIMATES",
                message: `Task ${task.id} is missing required estimate inputs for scoring.`,
                severity: "medium",
                taskId: task.id,
              });
            }

            if (!row.valid) {
              issues.push({
                code: "INVALID_SCORE",
                message: `Task ${task.id} has invalid priority inputs.`,
                severity: "high",
                taskId: task.id,
              });
            }

            if (row.deadlinePolicy === "REQUIRED" || row.deadlinePolicy === "EXPIRES") {
              if (row.hours == null || row.hours <= 0) {
                issues.push({
                  code: "DEADLINE_MISSING_HOURS",
                  message: `Task ${task.id} has a deadline policy but no usable hour estimate for latest-start scheduling.`,
                  severity: "high",
                  taskId: task.id,
                });
              }
              if (row.deadlineStatus === "start_now") {
                issues.push({
                  code: "DEADLINE_START_NOW",
                  message: `Task ${task.id} must start now to finish before its deadline.`,
                  severity: "high",
                  taskId: task.id,
                });
              }
              if (row.deadlineStatus === "missed") {
                issues.push({
                  code: "REQUIRED_DEADLINE_MISSED",
                  message: `Task ${task.id} is past its required deadline.`,
                  severity: "high",
                  taskId: task.id,
                });
              }
              if (row.deadlineStatus === "expired") {
                issues.push({
                  code: "EXPIRING_TASK_EXPIRED",
                  message: `Task ${task.id} is past its expiring opportunity deadline.`,
                  severity: "medium",
                  taskId: task.id,
                });
              }
            }

            const blockerStatuses = task.blockerStatuses ?? [];
            if (blockerStatuses.some((status) => status !== TaskStatus.VERIFIED)) {
              issues.push({
                code: "BLOCKED_DEPENDENCY",
                message: `Task ${task.id} has unresolved blockers and is currently blocked.`,
                severity: "low",
                taskId: task.id,
              });
              continue;
            }

            if (orphanedDependencyTaskIds.has(task.id)) {
              issues.push({
                code: "ORPHAN_DEPENDENCY",
                message: `Task ${task.id} is blocked by a deleted or missing dependency.`,
                severity: "medium",
                taskId: task.id,
              });
            }
          }

          return ok({
            summary: {
              activeOwnedTasks: ownedTasks.length,
              unblockedTasks: unblockedCount,
              issueCount: issues.length,
            },
            issues,
          });
        }

        // ── getNextAction ──────────────────────────────────────
        case "getNextAction": {
          if (!userId)
            return authRequired(
              "getNextAction",
              "It returns the top-ranked task in your personal queue. For an anonymous \"what should I work on next?\", call getNextTask instead.",
            );
          const { tasks, ranking } = await getTaskFunctions();
          const buybackRate = parsePositiveNumber(a.buybackRate, DEFAULT_PERSONAL_BUYBACK_RATE);
          const ownedTasks = await tasks.listTasks({
            limit: 5000,
            status: TaskStatus.ACTIVE,
            userId,
            visibility: "owned",
          });
          const selfTasks = (ownedTasks as unknown[]).filter((task) =>
            isSelfExecutableTask(task as PersonalQueueTaskRecord),
          );
          const queue = buildPersonalQueueRows(selfTasks, ranking, buybackRate, {
            limit: selfTasks.length,
            requireUnblocked: true,
          });
          const selection = selectPersonalNextAction(queue);
          const topAction = selection.task;
          const recommendation = selection.deadlineOverride && topAction
            ? {
                ...nextActionRecommendation(topAction),
                rationale: [
                  topAction.deadlineStatus === "missed"
                    ? "This required task is past its deadline; remedial action should happen before optional work."
                    : "This task has reached its latest-start time for a required or expiring deadline.",
                ],
              }
            : nextActionRecommendation(topAction);

          return ok({
            ...recommendation,
            deadlineOverride: selection.deadlineOverride,
            selectionReason: selection.selectionReason,
            task: topAction,
            priority: topAction?.priority ?? 0,
            queueAudit: {
              activeOwnedTasks: ownedTasks.length,
              unblockedTasks: queue.length,
            },
          });
        }

        case "evaluateTaskEconomics": {
          const { tasks } = await getTaskFunctions();
          const { evaluateEarthTaskEconomics } = await import("@optimitron/agent");
          const { getEarthExecutionPolicy } = await import("./tasks/action-policy");
          const result = await tasks.getTaskDetailData(a.taskId as string);
          if (!result) return err("Task not found");

          const economics = evaluateEarthTaskEconomics({
            agent: buildAgentCapabilities(a),
            policy: getEarthExecutionPolicy(),
            task: result.task as any,
          });

          return ok({
            economics,
            task: summarizeTask(result.task),
          });
        }

        // ── listTasks ──────────────────────────────────────────
        case "listTasks": {
          if (a.assignedToMe === true && !userId) {
            return authRequired(
              "listTasks",
              "assignedToMe needs the authenticated user's canonical Person row.",
            );
          }
          const { tasks } = await getTaskFunctions();
          const status = a.status ? TaskStatus[a.status as keyof typeof TaskStatus] : null;
          const limit = Math.min(Number(a.limit) || 20, 50);
          let assigneePersonId = (a.assigneePersonId as string) ?? null;
          let visibility: "public" | "accessible" = "public";
          if (a.assignedToMe === true && userId) {
            const prisma = await getPrisma();
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: { personId: true },
            });
            assigneePersonId = user?.personId ?? "__unreachable__";
            visibility = "accessible";
          }
          const list = await tasks.listTasks({
            status,
            assigneePersonId,
            limit,
            userId: visibility === "accessible" ? userId : null,
            visibility,
          });
          let filtered = list;
          if (a.parentTaskId) {
            filtered = list.filter((t: { parentTaskId?: string | null }) => t.parentTaskId === a.parentTaskId);
          }
          return ok(filtered.slice(0, limit).map(summarizeTask));
        }

        // ── listPeople ────────────────────────────────────────
        case "listPeople": {
          const prisma = await getPrisma();
          const { tasks } = await getTaskFunctions();
          const query = typeof a.query === "string" ? a.query.trim() : "";
          const includeTasks = a.includeTasks === true;
          const publicProfilesOnly = a.publicProfilesOnly !== false;
          const limit = parseQueueLimit(a.limit, 100, 500);
          const taskLimit = parseQueueLimit(a.taskLimit, 3, 50);
          const taskScope = a.taskScope === "accessible" ? "accessible" : "public";
          const taskStatus = a.taskStatus
            ? TaskStatus[a.taskStatus as keyof typeof TaskStatus] ?? null
            : TaskStatus.ACTIVE;
          const includePrivateTaskScope = taskScope === "accessible" && !userId;

          if (includePrivateTaskScope) {
            return err("Authentication required for taskScope=accessible.");
          }

          const people = await prisma.person.findMany({
            where: {
              deletedAt: null,
              ...(publicProfilesOnly ? { isPublicFigure: true } : {}),
              ...(query
                ? {
                    OR: [
                      { displayName: { contains: query, mode: "insensitive" } },
                      { currentAffiliation: { contains: query, mode: "insensitive" } },
                      { handle: { contains: query, mode: "insensitive" } },
                      { email: { contains: query, mode: "insensitive" } },
                      { sourceRef: { contains: query, mode: "insensitive" } },
                    ],
                  }
                : {}),
            },
            take: limit,
            orderBy: [{ displayName: "asc" }],
            select: {
              id: true,
              bio: true,
              countryCode: true,
              currentAffiliation: true,
              displayName: true,
              email: true,
              handle: true,
              image: true,
              isPublicFigure: true,
              sourceRef: true,
              sourceUrl: true,
            },
          });

          const rows = await Promise.all(
            people.map(async (person) => {
              if (!includeTasks) return { ...person, tasks: [] };
              const listed = await tasks.listTasks({
                assigneePersonId: person.id,
                limit: taskLimit,
                status: taskStatus,
                visibility: taskScope,
                userId: userId ?? null,
              });
              return { ...person, tasks: listed.map(summarizeTask) };
            }),
          );

          return ok(rows);
        }

        // ── getPersonTasks ───────────────────────────────────
        case "getPersonTasks": {
          const prisma = await getPrisma();
          const { tasks } = await getTaskFunctions();
          const personId = (a.personId as string) ?? "";
          if (!personId) return err("personId is required");
          const scope = a.scope === "accessible" ? "accessible" : "public";
          const person = await prisma.person.findFirst({
            where: { deletedAt: null, id: personId },
            select: {
              id: true,
              displayName: true,
              currentAffiliation: true,
              handle: true,
              image: true,
              isPublicFigure: true,
            },
          });
          if (!person) return err("Person not found");
          if (scope === "accessible" && !userId) return err("Authentication required for accessible scope.");

          const status = a.status
            ? TaskStatus[a.status as keyof typeof TaskStatus] ?? null
            : TaskStatus.ACTIVE;
          const limit = parseQueueLimit(a.limit, 50, 200);

          const personTasks = await tasks.listTasks({
            assigneePersonId: person.id,
            status,
            visibility: scope,
            userId: userId ?? null,
            limit,
          });

          return ok({
            person,
            scope,
            status,
            tasks: personTasks.map(summarizeTask),
          });
        }

        // ── listOrganizations ────────────────────────────────
        case "listOrganizations": {
          const prisma = await getPrisma();
          const { tasks } = await getTaskFunctions();
          const query = typeof a.query === "string" ? a.query.trim() : "";
          const queryMode: Prisma.QueryMode = "insensitive";
          const includeTasks = a.includeTasks === true;
          const limit = parseQueueLimit(a.limit, 100, 500);
          const taskLimit = parseQueueLimit(a.taskLimit, 3, 50);
          const taskScope = a.taskScope === "accessible" ? "accessible" : "public";
          const taskStatus = a.taskStatus
            ? TaskStatus[a.taskStatus as keyof typeof TaskStatus] ?? TaskStatus.ACTIVE
            : TaskStatus.ACTIVE;
          if (taskScope === "accessible" && !userId) {
            return err("Authentication required for taskScope=accessible.");
          }
          const organizationWhere = {
            deletedAt: null,
            ...(a.status ? { status: enumValue(OrgStatus, a.status, OrgStatus.APPROVED) } : {}),
            ...(a.type ? { type: enumValue(OrgType, a.type, OrgType.OTHER) } : {}),
            ...(query
              ? {
                  OR: [
                    { name: { contains: query, mode: queryMode } },
                    { slug: { contains: query, mode: queryMode } },
                    { description: { contains: query, mode: queryMode } },
                    { website: { contains: query, mode: queryMode } },
                    { contactEmail: { contains: query, mode: queryMode } },
                    { sourceUrl: { contains: query, mode: queryMode } },
                  ],
                }
              : {}),
          };
          const organizations = await prisma.organization.findMany({
            where: organizationWhere,
            take: limit,
            orderBy: [{ name: "asc" }],
            select: {
              contactEmail: true,
              createdAt: true,
              description: true,
              id: true,
              name: true,
              slug: true,
              status: true,
              type: true,
              website: true,
            },
          });

          const rows = await Promise.all(
            organizations.map(async (organization) => {
              if (!includeTasks) return { ...organization, tasks: [] };
              const listed = await tasks.listTasks({
                assigneeOrganizationId: organization.id,
                limit: taskLimit,
                status: taskStatus,
                visibility: taskScope,
                userId: userId ?? null,
              });
              return {
                ...organization,
                tasks: listed.map(summarizeTask),
              };
            }),
          );

          return ok(rows);
        }

        // ── getOrganizationTasks ────────────────────────────
        case "getOrganizationTasks": {
          const prisma = await getPrisma();
          const { tasks } = await getTaskFunctions();
          const organizationId = (a.organizationId as string) ?? "";
          if (!organizationId) return err("organizationId is required");
          const scope = a.scope === "accessible" ? "accessible" : "public";
          const organization = await prisma.organization.findFirst({
            where: { deletedAt: null, id: organizationId },
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
              status: true,
            },
          });
          if (!organization) return err("Organization not found");
          if (scope === "accessible" && !userId) return err("Authentication required for accessible scope.");

          const status = a.status
            ? TaskStatus[a.status as keyof typeof TaskStatus] ?? null
            : TaskStatus.ACTIVE;
          const limit = parseQueueLimit(a.limit, 50, 200);

          const organizationTasks = await tasks.listTasks({
            assigneeOrganizationId: organization.id,
            status,
            visibility: scope,
            userId: userId ?? null,
            limit,
          });

          return ok({
            organization,
            scope,
            status,
            tasks: organizationTasks.map(summarizeTask),
          });
        }

        // ── searchTasks ───────────────────────────────────────
        case "searchTasks": {
          const { tasks } = await getTaskFunctions();
          const query = typeof a.query === "string" ? a.query.trim() : "";
          if (!query) {
            return err("query is required");
          }

          const limit = parseQueueLimit(a.limit, 20, 100);
          const scope = a.scope === "public" ? "public" : "accessible";
          const status = a.status
            ? (a.status as "DRAFT" | "ACTIVE" | "VERIFIED" | "STALE")
            : undefined;
          if (scope === "accessible" && !userId) {
            return err("Authentication required for accessible scope.");
          }

          const results = await tasks.searchTasks(query, {
            limit,
            userId: scope === "accessible" ? userId : null,
            status,
          });

          return ok(results);
        }

        // ── getTask ────────────────────────────────────────────
        case "getTask": {
          const { tasks } = await getTaskFunctions();
          const result = await tasks.getTaskDetailData(a.taskId as string, userId ?? null);
          if (!result) return err("Task not found");
          return ok({
            task: enrichTaskForMcp(result.task),
            taskCommunicationCount: result.taskCommunicationCount,
          });
        }

        // ── createTask ────────────────────────────────────────
        case "createTask": {
          if (!userId) return authRequired(name, "This tool needs an identified user to attribute writes or fetch personal data.");

          const { endpoints, ranking, tasks } = await getTaskFunctions();
          const prisma = await getPrisma();

          const economics = resolveTaskEconomics(a);
          const blockerTaskIds = dedupeStrings([
            ...(Array.isArray(a.blockerTaskIds) ? (a.blockerTaskIds as string[]) : []),
            ...(Array.isArray(a.depends_on) ? (a.depends_on as string[]) : []),
          ]);
          const blockedTaskIds = dedupeStrings(
            Array.isArray(a.blockedTaskIds) ? (a.blockedTaskIds as string[]) : [],
          );
          const dependencyTaskIds = dedupeStrings([...blockerTaskIds, ...blockedTaskIds]);

          if (!a.title || typeof a.title !== "string" || !a.title.trim()) {
            return err("title is required.");
          }

          if (dependencyTaskIds.length > 0) {
            const dependencyTasks = await prisma.task.findMany({
              where: { deletedAt: null, id: { in: dependencyTaskIds } },
              select: {
                id: true,
                isPublic: true,
                ownerUserId: true,
              },
            });
            const foundDependencyIds = new Set(dependencyTasks.map((task) => task.id));
            const missingDependencyIds = dependencyTaskIds.filter((id) => !foundDependencyIds.has(id));
            if (missingDependencyIds.length > 0) {
              return err(
                `Invalid dependency IDs (not found): ${missingDependencyIds.map((id) => JSON.stringify(id)).join(", ")}`,
              );
            }

            const inaccessibleDependencyIds = dependencyTasks
              .filter((task) => !task.isPublic && task.ownerUserId !== userId)
              .map((task) => task.id);
            if (inaccessibleDependencyIds.length > 0) {
              return err(
                `Dependency IDs are inaccessible private tasks: ${inaccessibleDependencyIds
                  .map((id) => JSON.stringify(id))
                  .join(", ")}`,
              );
            }

            const forbiddenBlockedTaskIds = dependencyTasks
              .filter((task) => blockedTaskIds.includes(task.id) && task.ownerUserId !== userId)
              .map((task) => task.id);
            if (forbiddenBlockedTaskIds.length > 0) {
              return err(
                `Blocked task IDs must be owned by the current user: ${forbiddenBlockedTaskIds
                  .map((id) => JSON.stringify(id))
                  .join(", ")}`,
              );
            }
          }

          const isPublic = a.isPublic === true;
          if (isPublic && !hasAdminTaskWriteAccess(scopes, isAdmin)) {
            return err("Creating public tasks requires an admin user with the tasks:admin scope.");
          }
          const availableAt = a.available_at !== undefined || a.availableAt !== undefined
            ? parseTaskDate(a.available_at ?? a.availableAt)
            : null;
          const dueAt = a.due_at !== undefined || a.dueAt !== undefined
            ? parseTaskDate(a.due_at ?? a.dueAt)
            : null;
          // Prisma's TaskCreateInput accepts FK relations (`parentTask: { connect }`)
          // but rejects bare scalar FKs (`parentTaskId`) on null. The unchecked
          // variant accepts scalars, but to stay compatible with both we just
          // omit the FK fields entirely when no value was supplied.
          const parentTaskId = (a.parentTaskId as string | undefined) || undefined;
          const assigneePersonId = (a.assigneePersonId as string | undefined) || undefined;
          const assigneeOrganizationId = (a.assigneeOrganizationId as string | undefined) || undefined;
          const data: Record<string, unknown> = {
            title: a.title as string,
            description: (a.description as string) ?? "",
            ...(parentTaskId ? { parentTaskId } : {}),
            taskKey: (a.taskKey as string) ?? null,
            category: a.category ? TaskCategory[a.category as keyof typeof TaskCategory] : TaskCategory.OTHER,
            difficulty: a.difficulty ? TaskDifficulty[a.difficulty as keyof typeof TaskDifficulty] : TaskDifficulty.INTERMEDIATE,
            skillTags: (a.skillTags as string[]) ?? [],
            interestTags: (a.interestTags as string[]) ?? [],
            estimatedEffortHours: economics.estimatedEffortHours,
            availableAt,
            dueAt,
            deadlinePolicy: resolveDeadlinePolicyInput(a, dueAt),
            completedAt: a.completedAt ? new Date(a.completedAt as string) : null,
            verifiedAt: a.verifiedAt ? new Date(a.verifiedAt as string) : null,
            claimPolicy: a.claimPolicy ? TaskClaimPolicy[a.claimPolicy as keyof typeof TaskClaimPolicy] : TaskClaimPolicy.OPEN_MANY,
            ...(assigneePersonId ? { assigneePersonId } : {}),
            ...(assigneeOrganizationId ? { assigneeOrganizationId } : {}),
            roleTitle: (a.roleTitle as string) ?? null,
            // sourceUrl is absorbed into contextJson.sourceUrls by
            // buildPersonalTaskContext — the Task model has no sourceUrl column.
            impactStatement: (a.impactStatement as string) ?? null,
            isPublic,
            contextJson: buildPersonalTaskContext(a, economics),
            sortOrder: (a.sortOrder as number) ?? undefined,
            status: a.status
              ? TaskStatus[a.status as keyof typeof TaskStatus]
              : isPublic
                ? TaskStatus.DRAFT
                : TaskStatus.ACTIVE,
          };
          data.ownerUserId = userId;
          const task = await prisma.$transaction(async (tx) => {
            const created = await tx.task.create({ data: data as any });
            await endpoints.upsertPrimaryTaskCommunicationEndpoint(tx, created.id, {
              label: (a.contactLabel as string) ?? null,
              url: (a.contactUrl as string) ?? null,
            });
            const { TaskEdgeType } = await import("@optimitron/db");
            const incomingEdges = blockerTaskIds
              .filter((id) => id !== created.id)
              .map((blockerTaskId) => ({
                fromTaskId: blockerTaskId,
                toTaskId: created.id,
                edgeType: TaskEdgeType.BLOCKS,
              }));
            if (incomingEdges.length > 0) {
              await tx.taskEdge.createMany({ data: incomingEdges, skipDuplicates: true });
            }

            const outgoingEdges = blockedTaskIds
              .filter((id) => id !== created.id)
              .map((blockedTaskId) => ({
                fromTaskId: created.id,
                toTaskId: blockedTaskId,
                edgeType: TaskEdgeType.BLOCKS,
              }));
            if (outgoingEdges.length > 0) {
              await tx.taskEdge.createMany({ data: outgoingEdges, skipDuplicates: true });
            }
            await attachDirectTaskImpactEstimate({
              prisma: tx,
              taskId: created.id,
              estimatedEffortHours: economics.estimatedEffortHours,
              estimatedCashCostUsdBase: economics.estimatedCashCostUsdBase,
              expectedEconomicValueUsdBase: economics.expectedEconomicValueUsdBase,
              successProbabilityBase: economics.pSuccess,
              timeToImpactStartDays: economics.timeToImpactStartDays,
            });
            return created;
          });
          const fresh = await tasks.getTaskDetailData(task.id, userId);
          const scored = fresh
            ? buildPersonalQueueRows([fresh.task], ranking, DEFAULT_PERSONAL_BUYBACK_RATE, {
                limit: 1,
              })
            : [];

          return ok(scored[0] ?? { taskId: task.id, title: task.title, status: task.status });
        }

        case "upsertOrganization": {
          const { upsertTrustedOrganization } = await import("./organization.server");
          const organization = await upsertTrustedOrganization({
            contactEmail: (a.contactEmail as string) ?? null,
            description: (a.description as string) ?? null,
            logo: (a.logo as string) ?? null,
            name: a.name as string,
            sourceRef: (a.sourceRef as string) ?? null,
            sourceUrl: (a.sourceUrl as string) ?? null,
            type: enumValue(OrgType, a.type, OrgType.OTHER),
            website: (a.website as string) ?? null,
          });

          return ok({
            organization: {
              contactEmail: organization.contactEmail,
              id: organization.id,
              name: organization.name,
              slug: organization.slug,
              type: organization.type,
              website: organization.website,
            },
          });
        }

        case "createPerson": {
          if (!userId) return authRequired(name, "This tool needs an identified user to attribute writes or fetch personal data.");
          const { findOrCreatePerson } = await import("./person.server");
          const displayName = (a.displayName as string) ?? "";
          if (!displayName.trim()) {
            return err("displayName is required");
          }
          const person = await findOrCreatePerson({
            countryCode: (a.countryCode as string) ?? null,
            currentAffiliation: (a.currentAffiliation as string) ?? null,
            displayName,
            email: (a.email as string) ?? null,
            image: (a.image as string) ?? null,
            isPublicFigure: a.isPublicFigure === true,
            sourceRef: (a.sourceRef as string) ?? null,
            sourceUrl: (a.sourceUrl as string) ?? null,
          });
          return ok({
            person: {
              id: person.id,
              bio: person.bio,
              countryCode: person.countryCode,
              currentAffiliation: person.currentAffiliation,
              displayName: person.displayName,
              email: person.email,
              handle: person.handle,
              image: person.image,
              isPublicFigure: person.isPublicFigure,
              sourceRef: person.sourceRef,
              sourceUrl: person.sourceUrl,
            },
          });
        }

        case "getMe": {
          if (!userId) return authRequired(name, "This tool returns the authenticated user's profile.");
          const prisma = await getPrisma();
          const { getProfileIdentityData } = await import("./profile-identity.server");
          const [profile, userIdentity] = await Promise.all([
            getProfileIdentityData(userId),
            prisma.user.findUnique({
              where: { id: userId },
              select: { personId: true },
            }),
          ]);
          if (!profile) return err("User not found");
          return ok({ userId, personId: userIdentity?.personId ?? null, ...profile });
        }

        case "updateMyProfile": {
          if (!userId) return authRequired(name, "This tool updates the authenticated user's profile.");
          const { updateUserProfile, ProfileValidationError } = await import(
            "./profile-identity.server"
          );
          try {
            const profile = await updateUserProfile(userId, {
              name: typeof a.name === "string" ? a.name : undefined,
              bio: typeof a.bio === "string" ? a.bio : undefined,
              username:
                "username" in a ? (a.username as string | null) : undefined,
              headline:
                "headline" in a ? (a.headline as string | null) : undefined,
              website: "website" in a ? (a.website as string | null) : undefined,
              coverImage:
                "coverImage" in a ? (a.coverImage as string | null) : undefined,
              isPublic:
                typeof a.isPublic === "boolean" ? a.isPublic : undefined,
              newsletterSubscribed:
                typeof a.newsletterSubscribed === "boolean"
                  ? a.newsletterSubscribed
                  : undefined,
              unsubscribedScopes: Array.isArray(a.unsubscribedScopes)
                ? (a.unsubscribedScopes as string[])
                : undefined,
            });
            if (!profile) return err("User not found after update");
            return ok({ userId, ...profile });
          } catch (e) {
            if (e instanceof ProfileValidationError) {
              return err(e.message);
            }
            throw e;
          }
        }

        case "createOrganization": {
          if (!userId) return authRequired(name, "This tool needs an identified user to attribute writes or fetch personal data.");
          const { createOrganizationWithOwner } = await import(
            "./organization.server"
          );
          const orgName = (a.name as string) ?? "";
          if (!orgName.trim()) return err("name is required");

          const organization = await createOrganizationWithOwner(
            {
              contactEmail: (a.contactEmail as string) ?? null,
              description: (a.description as string) ?? null,
              jurisdictionId: (a.jurisdictionId as string) ?? null,
              logo: (a.logo as string) ?? null,
              name: orgName,
              website: (a.website as string) ?? null,
              type: enumValue(OrgType, a.type, OrgType.OTHER),
            },
            userId,
          );

          return ok({
            organization,
          });
        }

        // ── proposeTaskBundle ───────────────────────────────────
        case "proposeTaskBundle": {
          const { endpoints } = await getTaskFunctions();
          const prisma = await getPrisma();
          const { reviewTaskProposalBundle } = await import("@optimitron/agent");
          const { TaskEdgeType } = await import("@optimitron/db");
          const candidates = a.candidates as Array<Record<string, unknown>>;

          const existingTasks = await prisma.task.findMany({
            where: { deletedAt: null },
            select: {
              assigneeOrganizationId: true,
              assigneePersonId: true,
              id: true,
              roleTitle: true,
              status: true,
              taskKey: true,
              title: true,
            },
          });

          const review = reviewTaskProposalBundle({
            candidates: candidates.map((c) => ({
              title: c.title as string,
              description: (c.description as string) ?? null,
              taskKey: (c.taskKey as string) ?? null,
              id: (c.id as string) ?? null,
              assigneePersonId: (c.assigneePersonId as string) ?? null,
              assigneeOrganizationId: (c.assigneeOrganizationId as string) ?? null,
              roleTitle: (c.roleTitle as string) ?? null,
              contactUrl: (c.contactUrl as string) ?? null,
              sourceUrls: (c.sourceUrls as string[]) ?? [],
              blockerRefs: (c.blockerRefs as string[]) ?? [],
              parentTaskRef: (c.parentTaskRef as string) ?? null,
              estimatedEffortHours: (c.estimatedEffortHours as number) ?? null,
              isPublic: (c.isPublic as boolean) ?? true,
              impact: (c.impact as Record<string, number | null>) ?? null,
              status: "DRAFT",
            })),
            existingTasks: existingTasks.map((t) => ({
              id: t.id,
              title: t.title,
              taskKey: t.taskKey,
              roleTitle: t.roleTitle,
              assigneePersonId: t.assigneePersonId,
              assigneeOrganizationId: t.assigneeOrganizationId,
              status: t.status,
            })),
          });

          const existingRefToTaskId = new Map<string, string>();
          for (const task of existingTasks) {
            existingRefToTaskId.set(task.id, task.id);
            if (task.taskKey) existingRefToTaskId.set(task.taskKey, task.id);
          }

          const created: Array<{ taskId: string; title: string; proposalRef: string }> = [];
          const createdRefToTaskId = new Map<string, string>();
          const createdDecisionByTaskId = new Map<
            string,
            { candidate: Record<string, unknown>; decision: (typeof review.decisions)[number] }
          >();

          for (const decision of review.decisions) {
            if (!decision.promotable) continue;
            const candidate = candidates.find((c) => matchCandidateToDecision(c, decision));
            if (!candidate) continue;

            const task = await prisma.task.create({
              data: {
                title: candidate.title as string,
                description: (candidate.description as string) ?? "",
                taskKey: (candidate.taskKey as string) ?? null,
                category: inferProposalCategory(candidate),
                difficulty: inferProposalDifficulty(candidate),
                assigneePersonId: (candidate.assigneePersonId as string) ?? null,
                assigneeOrganizationId: (candidate.assigneeOrganizationId as string) ?? null,
                roleTitle: (candidate.roleTitle as string) ?? null,
                estimatedEffortHours: (candidate.estimatedEffortHours as number) ?? null,
                isPublic: (candidate.isPublic as boolean) !== false,
                impactStatement: (candidate.description as string) ?? null,
                contextJson: buildStoredProposalContext({ candidate, decision }),
                status: TaskStatus.DRAFT,
              } as any,
            });
            await endpoints.upsertPrimaryTaskCommunicationEndpoint(prisma, task.id, {
              url: (candidate.contactUrl as string) ?? null,
            });
            await attachProposalImpactEstimate({
              estimatedEffortHours: (candidate.estimatedEffortHours as number) ?? null,
              impact: (candidate.impact as Record<string, number | null>) ?? null,
              prisma,
              taskId: task.id,
            });

            created.push({ taskId: task.id, title: task.title, proposalRef: decision.proposalRef });
            createdRefToTaskId.set(decision.proposalRef, task.id);
            if (candidate.taskKey) createdRefToTaskId.set(candidate.taskKey as string, task.id);
            if (candidate.id) createdRefToTaskId.set(candidate.id as string, task.id);
            createdDecisionByTaskId.set(task.id, { candidate, decision });
          }

          for (const [taskId, { candidate }] of createdDecisionByTaskId.entries()) {
            const parentTaskRef = (candidate.parentTaskRef as string) ?? null;
            if (parentTaskRef) {
              const parentTaskId =
                createdRefToTaskId.get(parentTaskRef) ??
                existingRefToTaskId.get(parentTaskRef) ??
                null;
              if (parentTaskId) {
                await prisma.task.update({ where: { id: taskId }, data: { parentTaskId } });
              }
            }

            for (const blockerRef of ((candidate.blockerRefs as string[]) ?? []).filter(Boolean)) {
              const blockerTaskId =
                createdRefToTaskId.get(blockerRef) ??
                existingRefToTaskId.get(blockerRef) ??
                null;
              if (!blockerTaskId) continue;

              await prisma.taskEdge.create({
                data: {
                  edgeType: TaskEdgeType.BLOCKS,
                  fromTaskId: blockerTaskId,
                  toTaskId: taskId,
                },
              }).catch(() => undefined);
            }
          }

          return ok({
            review,
            createdDrafts: created,
            message: `${review.promotableCount} of ${review.decisions.length} candidates passed review. ${created.length} drafts created.`,
          });
        }

        // ── promoteTask ────────────────────────────────────────
        case "promoteTask": {
          const prisma = await getPrisma();
          const refs = a.proposalRefs as string[];
          const promoted: Array<{ taskId: string; title: string }> = [];
          const rejected: Array<{ ref: string; reason: string }> = [];
          const { reviewTaskProposalBundle } = await import("@optimitron/agent");

          const draftTasks = await prisma.task.findMany({
            where: {
              deletedAt: null,
              status: TaskStatus.DRAFT,
              OR: refs.flatMap((ref) => [{ id: ref }, { taskKey: ref }]),
            },
            select: {
              assigneeOrganizationId: true,
              assigneePersonId: true,
              communicationEndpoints: {
                where: { deletedAt: null },
                orderBy: [{ isPrimary: "desc" }, { priority: "asc" }, { createdAt: "asc" }],
                select: {
                  email: true,
                  isPrimary: true,
                  priority: true,
                  url: true,
                },
              },
              contextJson: true,
              description: true,
              estimatedEffortHours: true,
              id: true,
              isPublic: true,
              roleTitle: true,
              status: true,
              taskKey: true,
              title: true,
            },
          });

          const foundRefs = new Set<string>();
          for (const task of draftTasks) {
            foundRefs.add(task.id);
            if (task.taskKey) foundRefs.add(task.taskKey);
          }

          for (const ref of refs) {
            if (!foundRefs.has(ref)) {
              rejected.push({ ref, reason: "No DRAFT task found with this ID or taskKey." });
            }
          }

          if (draftTasks.length === 0) {
            return ok({ promoted, rejected, message: `${promoted.length} promoted, ${rejected.length} rejected.` });
          }

          const existingTasks = await prisma.task.findMany({
            where: {
              deletedAt: null,
              id: { notIn: draftTasks.map((task) => task.id) },
            },
            select: {
              assigneeOrganizationId: true,
              assigneePersonId: true,
              id: true,
              roleTitle: true,
              status: true,
              taskKey: true,
              title: true,
            },
          });

          const review = reviewTaskProposalBundle({
            candidates: draftTasks.map((task) => taskProposalCandidateFromRecord(task)),
            existingTasks: existingTasks.map((task) => ({
              assigneeOrganizationId: task.assigneeOrganizationId,
              assigneePersonId: task.assigneePersonId,
              id: task.id,
              roleTitle: task.roleTitle,
              status: task.status,
              taskKey: task.taskKey,
              title: task.title,
            })),
          });
          const decisionByProposalRef = new Map(
            review.decisions.map((decision) => [decision.proposalRef, decision]),
          );

          for (const task of draftTasks) {
            const decision = decisionByProposalRef.get(task.id);
            if (!decision?.promotable) {
              rejected.push({
                ref: task.taskKey ?? task.id,
                reason:
                  decision?.issues.map((issue) => issue.message).join(" ") ??
                  "Task failed promotion review.",
              });
              continue;
            }

            const context = asObject(task.contextJson) ?? {};
            const proposal = asObject(context.proposalV1) ?? {};

            await prisma.task.update({
              where: { id: task.id },
              data: {
                contextJson: {
                  ...context,
                  proposalV1: {
                    ...proposal,
                    review: {
                      issues: toStoredProposalIssues(decision.issues),
                      promotable: decision.promotable,
                      qualityScore: decision.evaluation.qualityScore,
                      rationale: decision.evaluation.rationale,
                      reviewedAt: new Date().toISOString(),
                    },
                  },
                } as Prisma.InputJsonValue,
                status: TaskStatus.ACTIVE,
              },
            });
            promoted.push({ taskId: task.id, title: task.title });
          }

          return ok({ promoted, rejected, message: `${promoted.length} promoted, ${rejected.length} rejected.` });
        }

        // ── updateTask ─────────────────────────────────────────
        case "updateTask": {
          if (!userId) return authRequired(name, "This tool needs an identified user to attribute writes or fetch personal data.");

          const { ranking, tasks } = await getTaskFunctions();
          const prisma = await getPrisma();
          const updates: Record<string, unknown> = {};
          const existingDetail = await tasks.getTaskDetailData(a.taskId as string, userId);
          if (!existingDetail) return err("Task not found");
          const existingTask = existingDetail.task as PersonalQueueTaskRecord;
          if (existingTask.ownerUserId !== userId) {
            return err("Forbidden: Task is not owned by current user");
          }
          if (existingTask.isPublic && !hasAdminTaskWriteAccess(scopes, isAdmin)) {
            return err("Updating public tasks requires an admin user with the tasks:admin scope.");
          }
          const dependencyPatchProvided = Array.isArray(a.depends_on) || Array.isArray(a.blockerTaskIds);
          const blockerTaskIds = dependencyPatchProvided
            ? dedupeStrings([
                ...(Array.isArray(a.blockerTaskIds) ? (a.blockerTaskIds as string[]) : []),
                ...(Array.isArray(a.depends_on) ? (a.depends_on as string[]) : []),
              ])
            : [];
          if (dependencyPatchProvided && blockerTaskIds.length > 0) {
            const dependencyTasks = await prisma.task.findMany({
              where: { deletedAt: null, id: { in: blockerTaskIds } },
              select: { id: true, isPublic: true, ownerUserId: true },
            });
            const foundDependencyIds = new Set(dependencyTasks.map((task) => task.id));
            const missingDependencyIds = blockerTaskIds.filter((id) => !foundDependencyIds.has(id));
            if (missingDependencyIds.length > 0) {
              return err(
                `Invalid dependency IDs (not found): ${missingDependencyIds.map((id) => JSON.stringify(id)).join(", ")}`,
              );
            }
            const inaccessibleDependencyIds = dependencyTasks
              .filter((task) => !task.isPublic && task.ownerUserId !== userId)
              .map((task) => task.id);
            if (inaccessibleDependencyIds.length > 0) {
              return err(
                `Dependency IDs are inaccessible private tasks: ${inaccessibleDependencyIds
                  .map((id) => JSON.stringify(id))
                  .join(", ")}`,
              );
            }
          }
          const economicsPatch = hasEconomicsPatch(a);
          const economics = resolveTaskEconomics(a, existingTask);
          if (a.status) updates.status = TaskStatus[a.status as keyof typeof TaskStatus];
          if (a.title) updates.title = a.title;
          if (a.description) updates.description = a.description;
          if (a.completionEvidence) updates.completionEvidence = a.completionEvidence;
          if (a.impactStatement) updates.impactStatement = a.impactStatement;
          if (a.difficulty) updates.difficulty = TaskDifficulty[a.difficulty as keyof typeof TaskDifficulty];
          if (a.taskKey) updates.taskKey = a.taskKey;
          if (a.roleTitle !== undefined) updates.roleTitle = (a.roleTitle as string) || null;
          if (a.sortOrder !== undefined) updates.sortOrder = a.sortOrder;
          if (a.available_at !== undefined || a.availableAt !== undefined) {
            const rawAvailableAt = a.available_at ?? a.availableAt;
            updates.availableAt = rawAvailableAt ? parseTaskDate(rawAvailableAt) : null;
          }
          if (a.due_at !== undefined || a.dueAt !== undefined) {
            const rawDueAt = a.due_at ?? a.dueAt;
            const nextDueAt = (rawDueAt as string) ? parseTaskDate(rawDueAt) : null;
            const existingPolicy = normalizeDeadlinePolicy(existingTask.deadlinePolicy, "NONE");
            updates.dueAt = nextDueAt;
            if (a.deadline_policy === undefined && a.deadlinePolicy === undefined) {
              updates.deadlinePolicy = nextDueAt
                ? existingPolicy === "NONE" ? "SOFT" : existingPolicy
                : "NONE";
            }
          }
          if (a.deadline_policy !== undefined || a.deadlinePolicy !== undefined) {
            updates.deadlinePolicy = normalizeDeadlinePolicy(a.deadline_policy ?? a.deadlinePolicy);
          }
          if (a.assigneePersonId !== undefined) {
            updates.assigneePersonId = (a.assigneePersonId as string) || null;
          }
          if (a.assigneeOrganizationId !== undefined) {
            updates.assigneeOrganizationId = (a.assigneeOrganizationId as string) || null;
          }
          if (a.completedAt !== undefined) {
            updates.completedAt = (a.completedAt as string) ? new Date(a.completedAt as string) : null;
          } else if (a.status === "VERIFIED") {
            updates.completedAt = new Date();
          }
          if (a.verifiedAt !== undefined) {
            updates.verifiedAt = (a.verifiedAt as string) ? new Date(a.verifiedAt as string) : null;
          } else if (a.status === "VERIFIED") {
            updates.verifiedAt = new Date();
          }
          if (economicsPatch) {
            updates.estimatedEffortHours = economics.estimatedEffortHours;
          }
          if (
            a.contextJson !== undefined ||
            a.sourceUrl !== undefined ||
            economicsPatch ||
            a.executor_type !== undefined ||
            a.executorType !== undefined ||
            a.ev_math !== undefined ||
            a.evMath !== undefined ||
            a.can_delegate !== undefined ||
            a.canDelegate !== undefined ||
            a.best_route !== undefined ||
            a.bestRoute !== undefined ||
            a.acceptanceCriteria !== undefined ||
            a.deadline_rationale !== undefined ||
            a.deadlineRationale !== undefined
          ) {
            updates.contextJson = toInputJsonValue(
              buildPersonalTaskContext(a, economics, existingTask.contextJson) ?? {},
            );
          }

          const task = await prisma.$transaction(async (tx) => {
            const updated = await tx.task.update({
              where: { id: a.taskId as string },
              data: Object.keys(updates).length > 0 ? (updates as any) : { updatedAt: new Date() },
            });
            if (dependencyPatchProvided) {
              const { TaskEdgeType } = await import("@optimitron/db");
              const dependencyEdgeTypes = [TaskEdgeType.BLOCKS, TaskEdgeType.DEPENDS_ON];
              await tx.taskEdge.updateMany({
                where: {
                  deletedAt: null,
                  toTaskId: updated.id,
                  edgeType: { in: dependencyEdgeTypes },
                  ...(blockerTaskIds.length > 0
                    ? { fromTaskId: { notIn: blockerTaskIds } }
                    : {}),
                },
                data: { deletedAt: new Date() },
              });
              const incomingEdges = blockerTaskIds
                .filter((id) => id !== updated.id)
                .map((blockerTaskId) => ({
                  fromTaskId: blockerTaskId,
                  toTaskId: updated.id,
                  edgeType: TaskEdgeType.BLOCKS,
                }));
              if (incomingEdges.length > 0) {
                await tx.taskEdge.updateMany({
                  where: {
                    toTaskId: updated.id,
                    fromTaskId: { in: incomingEdges.map((edge) => edge.fromTaskId) },
                    edgeType: { in: dependencyEdgeTypes },
                  },
                  data: { deletedAt: null },
                });
                await tx.taskEdge.createMany({ data: incomingEdges, skipDuplicates: true });
              }
            }
            if (economicsPatch) {
              await attachDirectTaskImpactEstimate({
                prisma: tx,
                taskId: updated.id,
                estimatedEffortHours: economics.estimatedEffortHours,
                estimatedCashCostUsdBase: economics.estimatedCashCostUsdBase,
                expectedEconomicValueUsdBase: economics.expectedEconomicValueUsdBase,
                successProbabilityBase: economics.pSuccess,
                timeToImpactStartDays: economics.timeToImpactStartDays,
              });
            }
            return updated;
          });
          const fresh = await tasks.getTaskDetailData(task.id, userId);
          const scored = fresh
            ? buildPersonalQueueRows([fresh.task], ranking, DEFAULT_PERSONAL_BUYBACK_RATE, {
                limit: 1,
              })
            : [];

          return ok(scored[0] ?? { taskId: task.id, status: task.status, title: task.title });
        }

        case "deleteTask": {
          if (!userId) return authRequired(name, "This tool needs an identified user to attribute writes or fetch personal data.");

          const prisma = await getPrisma();
          const taskId = a.taskId as string;
          if (!taskId) return err("taskId is required");

          const existing = await prisma.task.findFirst({
            where: { id: taskId, deletedAt: null },
            select: { isPublic: true, ownerUserId: true },
          });
          if (!existing) return err("Task not found");
          if (existing.ownerUserId !== userId) {
            return err("Forbidden: Task is not owned by current user");
          }
          if (existing.isPublic && !hasAdminTaskWriteAccess(scopes, isAdmin)) {
            return err("Deleting public tasks requires an admin user with the tasks:admin scope.");
          }

          await prisma.task.update({
            where: { id: taskId },
            data: { deletedAt: new Date() },
          });

          return ok({ taskId, deleted: true });
        }

        // ── recordTaskActuals ──────────────────────────────────
        case "recordTaskActuals": {
          const prisma = await getPrisma();
          const existing = await prisma.task.findUnique({
            where: { id: a.taskId as string },
            select: { actualCashCostUsd: true, actualEffortSeconds: true, contextJson: true, id: true, title: true },
          });
          if (!existing) return err("Task not found");

          const context = asObject(existing.contextJson) ?? {};
          const executionV1 = asObject(context.executionV1) ?? {};
          const note = (a.note as string) ?? null;
          const actualCashCostUsd = (a.actualCashCostUsd as number) ?? existing.actualCashCostUsd ?? null;
          const actualEffortSeconds = (a.actualEffortSeconds as number) ?? existing.actualEffortSeconds ?? null;

          const task = await prisma.task.update({
            where: { id: a.taskId as string },
            data: {
              actualCashCostUsd,
              actualEffortSeconds,
              contextJson: {
                ...context,
                executionV1: {
                  ...executionV1,
                  lastActuals: { actualCashCostUsd, actualEffortSeconds, note, recordedAt: new Date().toISOString() },
                },
              },
            },
          });

          return ok({
            actualCashCostUsd: task.actualCashCostUsd,
            actualEffortSeconds: task.actualEffortSeconds,
            taskId: task.id,
            title: task.title,
          });
        }

        // ── setTaskImpact ──────────────────────────────────────
        case "setTaskImpact": {
          const prisma = await getPrisma();
          const taskId = a.taskId as string;

          const task = await prisma.task.findUnique({
            where: { id: taskId },
            select: { id: true, taskKey: true },
          });
          if (!task) return err("Task not found");

          const frameInput = (a.frame as Record<string, number | null> | undefined) ?? {};
          const metricsInput = (a.metrics as Array<Record<string, unknown>> | undefined) ?? [];
          const frameKeyStr = (a.frameKey as string) ?? "FIVE_YEAR";
          const frameKey = TaskImpactFrameKey[frameKeyStr as keyof typeof TaskImpactFrameKey] ?? TaskImpactFrameKey.FIVE_YEAR;
          const calculationVersion = (a.calculationVersion as string) ?? "agent-estimate-v1";
          const frameSlug = `${frameKeyStr.toLowerCase()}-agent`;
          const impactAssumptionsJson: Prisma.InputJsonObject = {
            assumptions: asStringArray(a.assumptions),
            estimateNotes: typeof a.estimateNotes === "string" ? a.estimateNotes : null,
            expectedEconomicValueSemantics: "expectedEconomicValueUsd* values are already probability-weighted",
            sourceUrls: asStringArray(a.sourceUrls),
          };

          const result = await prisma.$transaction(async (tx) => {
            const estimateSet = await tx.taskImpactEstimateSet.create({
              data: {
                assumptionsJson: impactAssumptionsJson,
                calculationVersion,
                counterfactualKey: "status-quo",
                estimateKind: "FORECAST",
                isCurrent: false,
                methodologyKey: "agent-direct",
                parameterSetHash: `agent:${new Date().toISOString()}`,
                publicationStatus: "DRAFT",
                sourceSystem: "MANUAL",
                taskId,
              },
            });

            const frame = await tx.taskImpactFrameEstimate.create({
              data: {
                taskImpactEstimateSetId: estimateSet.id,
                frameKey,
                frameSlug,
                evaluationHorizonYears: (frameInput.evaluationHorizonYears as number) ?? 5,
                successProbabilityLow: (frameInput.successProbabilityLow as number) ?? null,
                successProbabilityBase: (frameInput.successProbabilityBase as number) ?? null,
                successProbabilityHigh: (frameInput.successProbabilityHigh as number) ?? null,
                delayDalysLostPerDayLow: (frameInput.delayDalysLostPerDayLow as number) ?? null,
                delayDalysLostPerDayBase: (frameInput.delayDalysLostPerDayBase as number) ?? null,
                delayDalysLostPerDayHigh: (frameInput.delayDalysLostPerDayHigh as number) ?? null,
                delayEconomicValueUsdLostPerDayLow: (frameInput.delayEconomicValueUsdLostPerDayLow as number) ?? null,
                delayEconomicValueUsdLostPerDayBase: (frameInput.delayEconomicValueUsdLostPerDayBase as number) ?? null,
                delayEconomicValueUsdLostPerDayHigh: (frameInput.delayEconomicValueUsdLostPerDayHigh as number) ?? null,
                expectedDalysAvertedLow: (frameInput.expectedDalysAvertedLow as number) ?? null,
                expectedDalysAvertedBase: (frameInput.expectedDalysAvertedBase as number) ?? null,
                expectedDalysAvertedHigh: (frameInput.expectedDalysAvertedHigh as number) ?? null,
                expectedEconomicValueUsdLow: (frameInput.expectedEconomicValueUsdLow as number) ?? null,
                expectedEconomicValueUsdBase: (frameInput.expectedEconomicValueUsdBase as number) ?? null,
                expectedEconomicValueUsdHigh: (frameInput.expectedEconomicValueUsdHigh as number) ?? null,
                estimatedCashCostUsdLow: (frameInput.estimatedCashCostUsdLow as number) ?? null,
                estimatedCashCostUsdBase: (frameInput.estimatedCashCostUsdBase as number) ?? null,
                estimatedCashCostUsdHigh: (frameInput.estimatedCashCostUsdHigh as number) ?? null,
                estimatedEffortHoursLow: (frameInput.estimatedEffortHoursLow as number) ?? null,
                estimatedEffortHoursBase: (frameInput.estimatedEffortHoursBase as number) ?? null,
                estimatedEffortHoursHigh: (frameInput.estimatedEffortHoursHigh as number) ?? null,
                adoptionRampYears: 0,
                annualDiscountRate: 0.03,
                benefitDurationYears: (frameInput.evaluationHorizonYears as number) ?? 5,
                timeToImpactStartDays: 0,
              },
            });

            for (const metric of metricsInput) {
              await tx.taskImpactMetric.create({
                data: {
                  taskImpactFrameEstimateId: frame.id,
                  metricKey: metric.metricKey as string,
                  baseValue: (metric.baseValue as number) ?? null,
                  lowValue: (metric.lowValue as number) ?? null,
                  highValue: (metric.highValue as number) ?? null,
                  unit: (metric.unit as string) ?? "unknown",
                  displayGroup: (metric.displayGroup as string) ?? null,
                },
              });
            }

            await tx.taskImpactEstimateSet.updateMany({
              where: { taskId, isCurrent: true, NOT: { id: estimateSet.id } },
              data: { isCurrent: false },
            });

            await tx.taskImpactEstimateSet.update({
              where: { id: estimateSet.id },
              data: { isCurrent: true },
            });

            await tx.task.update({
              where: { id: taskId },
              data: { currentImpactEstimateSetId: estimateSet.id },
            });

            return { estimateSetId: estimateSet.id, frameId: frame.id, metricCount: metricsInput.length };
          }, { maxWait: 10_000, timeout: 30_000 });

          return ok({ taskId, ...result, message: `Impact estimate set with ${result.metricCount} metrics attached to task.` });
        }

        // ── claimTask ──────────────────────────────────────────
        case "claimTask": {
          const { tasks } = await getTaskFunctions();
          const claimUserId = (a.userId as string) ?? userId;
          if (!claimUserId) return err("userId is required (not authenticated)");
          const claim = await tasks.claimTask(a.taskId as string, claimUserId);
          return ok({ claimId: claim.id, status: claim.status });
        }

        // ── claimSignerReminder ────────────────────────────────
        case "claimSignerReminder": {
          if (!userId)
            return authRequired(
              name,
              "Reminder subtasks are owned by the citizen who claims them; they must be authenticated.",
            );
          const signerTaskId = a.signerTaskId as string | undefined;
          if (!signerTaskId || typeof signerTaskId !== "string") {
            return err("signerTaskId is required");
          }

          const prisma = await getPrisma();
          const { upsertSignerReminderTask, buildSignerReminderTaskKey } =
            await import("./signer-reminder-tasks.server");

          // 1. Fetch parent signer task and the citizen's user record (for referralCode + personId).
          const [parentTask, callingUser] = await Promise.all([
            prisma.task.findUnique({
              where: { id: signerTaskId },
              select: {
                id: true,
                taskKey: true,
                roleTitle: true,
                assigneePerson: { select: { displayName: true } },
                assigneeOrganization: { select: { name: true } },
              },
            }),
            prisma.user.findUnique({
              where: { id: userId },
              select: { id: true, personId: true, referralCode: true },
            }),
          ]);

          if (!parentTask) return err(`Signer task not found: ${signerTaskId}`);
          if (!callingUser?.referralCode)
            return err("User missing referralCode — cannot attribute signer conversion.");

          // 2. Validate it's actually a signer task and extract countryCode from taskKey.
          const signerKeyMatch = parentTask.taskKey?.match(
            /^program:one-percent-treaty:signer:([a-z0-9-]+)$/i,
          );
          if (!signerKeyMatch || !signerKeyMatch[1]) {
            return err(
              `Task ${signerTaskId} is not a 1% Treaty signer task (taskKey: ${parentTask.taskKey ?? "null"}). claimSignerReminder only works on parent signer tasks.`,
            );
          }
          const countryCode = signerKeyMatch[1];

          if (!parentTask.assigneePerson?.displayName || !parentTask.assigneeOrganization?.name) {
            return err(
              `Signer task ${signerTaskId} is missing assignee data (need both assigneePerson + assigneeOrganization).`,
            );
          }

          // 3. Upsert the reminder subtask via the trigger framework. Fires
          // its own transaction; idempotent on (countryCode, userId).
          const result = await upsertSignerReminderTask({
            ownerPersonId: callingUser.personId ?? null,
            ownerUserId: userId,
            referralCode: callingUser.referralCode!,
            signer: {
              countryCode,
              governmentName: parentTask.assigneeOrganization!.name,
              id: parentTask.id,
              leaderName: parentTask.assigneePerson!.displayName,
              roleTitle: parentTask.roleTitle,
              taskKey: parentTask.taskKey ?? buildSignerReminderTaskKey(countryCode, userId),
            },
          });

          // 4. Return the freshly-summarized task so the caller has the actionLink etc.
          const { tasks } = await getTaskFunctions();
          const detail = await tasks.getTaskDetailData(result.taskId, userId);
          if (!detail) return err("Reminder subtask created but could not be loaded for summary.");

          // Fire `mcp.claimSignerReminder` so AI-authored TaskTrigger blueprints
          // can layer additional behavior. The seeded treaty:signer-reminder
          // trigger is idempotent (Task upsert by taskKey) and currently
          // produces an equivalent task to the one already created above.
          const { fireTaskTriggersForEvent: fireForClaim, buildTriggerContext: buildCtxClaim } =
            await import("./triggers");
          await fireForClaim(
            "mcp.claimSignerReminder",
            buildCtxClaim({
              user: { id: userId, referralCode: callingUser.referralCode },
              signer: {
                countryCode,
                countryName: parentTask.assigneeOrganization?.name ?? "",
                leaderName: parentTask.assigneePerson?.displayName ?? "",
                roleTitle: parentTask.roleTitle ?? null,
              },
              parentTaskId: signerTaskId,
            }),
            { actorUserId: userId },
          );

          return ok({
            alreadyExisted: result.alreadyExisted,
            countryCode,
            parentSignerTaskId: signerTaskId,
            task: summarizeTask(detail.task),
            taskId: result.taskId,
            taskKey: result.taskKey,
          });
        }

        // ── completeTaskClaim ──────────────────────────────────
        case "completeTaskClaim": {
          const { tasks } = await getTaskFunctions();
          const claimUserId = (a.userId as string) ?? userId;
          if (!claimUserId) return err("userId is required (not authenticated)");
          const claim = await tasks.completeTaskClaim(
            a.taskId as string,
            claimUserId,
            a.completionEvidence as string,
          );
          return ok({ claimId: claim.id, status: claim.status });
        }

        // ── updateMilestone ────────────────────────────────────
        case "updateMilestone": {
          const prisma = await getPrisma();
          const { TaskMilestoneStatus } = await import("@optimitron/db");
          const statusValue = TaskMilestoneStatus[a.status as keyof typeof TaskMilestoneStatus];
          const milestone = await prisma.taskMilestone.update({
            where: { id: a.milestoneId as string },
            data: {
              status: statusValue,
              ...(a.evidence ? { verificationNote: a.evidence as string } : {}),
              ...(statusValue === TaskMilestoneStatus.COMPLETED ? { completedAt: new Date() } : {}),
              ...(statusValue === TaskMilestoneStatus.VERIFIED ? { verifiedAt: new Date() } : {}),
            },
          });
          return ok({ milestoneId: milestone.id, status: milestone.status });
        }

        // ── addDependency ──────────────────────────────────────
        case "addDependency": {
          if (!userId) return authRequired(name, "This tool needs an identified user to update private task dependencies.");
          const prisma = await getPrisma();
          const { TaskEdgeType } = await import("@optimitron/db");
          const blockedTaskId = a.blockedTaskId as string;
          const blockerTaskId = a.blockerTaskId as string;
          const dependencyTasks = await prisma.task.findMany({
            where: { deletedAt: null, id: { in: [blockedTaskId, blockerTaskId] } },
            select: { id: true, isPublic: true, ownerUserId: true },
          });
          const blockedTask = dependencyTasks.find((task) => task.id === blockedTaskId);
          const blockerTask = dependencyTasks.find((task) => task.id === blockerTaskId);
          if (!blockedTask || !blockerTask) return err("Task not found");
          if (blockedTask.ownerUserId !== userId) {
            return err("Forbidden: blocked task is not owned by current user");
          }
          if (!blockerTask.isPublic && blockerTask.ownerUserId !== userId) {
            return err("Forbidden: blocker task is not accessible to current user");
          }
          const probabilityDeltaBase = parseFiniteNumber(
            a.probabilityDeltaBase ?? a.increases_p_success,
          );
          if (probabilityDeltaBase != null && (probabilityDeltaBase < 0 || probabilityDeltaBase > 1)) {
            return err("probabilityDeltaBase must be between 0 and 1");
          }
          const timeDeltaDaysBase = parseFiniteNumber(a.timeDeltaDaysBase ?? a.time_delta_days);
          if (timeDeltaDaysBase != null && timeDeltaDaysBase < 0) {
            return err("timeDeltaDaysBase must be non-negative");
          }
          const assumptions = asStringArray(a.assumptions);
          const notes =
            typeof a.notes === "string"
              ? a.notes
              : typeof a.label === "string"
                ? a.label
                : null;
          const calculationVersion =
            typeof a.calculationVersion === "string" && a.calculationVersion.trim()
              ? a.calculationVersion.trim()
              : null;
          const edgeMetadata = {
            ...(probabilityDeltaBase != null ? { probabilityDeltaBase } : {}),
            ...(timeDeltaDaysBase != null ? { timeDeltaDaysBase } : {}),
            ...(assumptions.length > 0
              ? { assumptionsJson: toInputJsonValue({ assumptions }) }
              : {}),
            ...(calculationVersion ? { calculationVersion } : {}),
            ...(notes ? { notes } : {}),
          };
          await prisma.taskEdge.updateMany({
            where: {
              fromTaskId: a.blockerTaskId as string,
              toTaskId: a.blockedTaskId as string,
              edgeType: TaskEdgeType.BLOCKS,
            },
            data: { deletedAt: null, ...edgeMetadata },
          });
          await prisma.taskEdge.createMany({
            data: [{
              fromTaskId: a.blockerTaskId as string,
              toTaskId: a.blockedTaskId as string,
              edgeType: TaskEdgeType.BLOCKS,
              ...edgeMetadata,
            }],
            skipDuplicates: true,
          });
          return ok({ blockedTaskId, blockerTaskId, created: true, ...edgeMetadata });
        }

        // ── getBlockers ────────────────────────────────────────
        case "getBlockers": {
          const prisma = await getPrisma();
          const { TaskEdgeType } = await import("@optimitron/db");
          const [blockedBy, blocks] = await Promise.all([
            prisma.taskEdge.findMany({
              where: {
                deletedAt: null,
                toTaskId: a.taskId as string,
                edgeType: { in: [TaskEdgeType.BLOCKS, TaskEdgeType.DEPENDS_ON] },
              },
              include: { fromTask: { select: { id: true, title: true, status: true } } },
            }),
            prisma.taskEdge.findMany({
              where: {
                deletedAt: null,
                fromTaskId: a.taskId as string,
                edgeType: { in: [TaskEdgeType.BLOCKS, TaskEdgeType.DEPENDS_ON] },
              },
              include: { toTask: { select: { id: true, title: true, status: true } } },
            }),
          ]);
          return ok({
            blockedBy: blockedBy.map((e) => ({
              edgeType: e.edgeType,
              notes: e.notes,
              probabilityDeltaBase: e.probabilityDeltaBase,
              status: e.fromTask.status,
              taskId: e.fromTask.id,
              timeDeltaDaysBase: e.timeDeltaDaysBase,
              title: e.fromTask.title,
            })),
            blocks: blocks.map((e) => ({
              edgeType: e.edgeType,
              notes: e.notes,
              probabilityDeltaBase: e.probabilityDeltaBase,
              status: e.toTask.status,
              taskId: e.toTask.id,
              timeDeltaDaysBase: e.timeDeltaDaysBase,
              title: e.toTask.title,
            })),
          });
        }

        // ── logAgentRun ────────────────────────────────────────
        case "logAgentRun": {
          const prisma = await getPrisma();
          const run = await prisma.agentRunCost.create({
            data: {
              runId: a.runId as string,
              provider: a.provider as string,
              costUsd: a.costUsd as number,
              apiCalls: a.apiCalls as number,
              taskId: (a.taskId as string) ?? null,
              status:
                (typeof a.status === "string"
                  ? AgentRunStatus[a.status as keyof typeof AgentRunStatus]
                  : null) ?? AgentRunStatus.COMPLETED,
              outputSummary: (a.outputSummary as string) ?? null,
              depositId: (a.depositId as string) ?? null,
            },
          });
          return ok({ id: run.id, runId: run.runId });
        }

        // ── acquireLease ───────────────────────────────────────
        case "acquireLease": {
          const { lease } = await getTaskFunctions();
          const result = await lease.acquireLease(a.taskId as string, a.agentId as string, (a.leaseSeconds as number) ?? undefined);
          return ok({ leaseId: result.id, expiresAt: result.expiresAt.toISOString() });
        }

        // ── heartbeatLease ─────────────────────────────────────
        case "heartbeatLease": {
          const { lease } = await getTaskFunctions();
          const result = await lease.heartbeatLease(a.taskId as string, a.agentId as string, (a.leaseSeconds as number) ?? undefined);
          return ok({ leaseId: result.id, expiresAt: result.expiresAt.toISOString() });
        }

        // ── releaseLease ───────────────────────────────────────
        case "releaseLease": {
          const { lease } = await getTaskFunctions();
          const result = await lease.releaseLease(a.taskId as string, a.agentId as string);
          return ok({ leaseId: result.id, released: true });
        }

        // ── getFundingStats ────────────────────────────────────
        case "getFundingStats": {
          const prisma = await getPrisma();
          const [deposits, runs] = await Promise.all([
            prisma.agentComputeDeposit.aggregate({
              _sum: { amountUsd: true, spentUsd: true },
              _count: true,
              where: { deletedAt: null },
            }),
            prisma.agentRunCost.aggregate({
              _sum: { costUsd: true, apiCalls: true },
              _count: true,
            }),
          ]);
          return ok({
            totalDepositedUsd: deposits._sum.amountUsd ?? 0,
            totalSpentUsd: deposits._sum.spentUsd ?? 0,
            remainingBudgetUsd: (deposits._sum.amountUsd ?? 0) - (deposits._sum.spentUsd ?? 0),
            depositCount: deposits._count,
            totalRunCostUsd: runs._sum.costUsd ?? 0,
            totalApiCalls: runs._sum.apiCalls ?? 0,
            runCount: runs._count,
          });
        }

        // ── Referendum tools ──────────────────────────────────
        case "listReferendums": {
          const prisma = await getPrisma();
          const status = parseReferendumStatus(a.status, ReferendumStatus.ACTIVE);
          if (!status) {
            return err("status must be one of DRAFT, ACTIVE, or CLOSED");
          }
          if (status !== ReferendumStatus.ACTIVE && !isAdmin) {
            return err("Admin privileges are required to list non-active referendums.");
          }

          const query = optionalString(a.query);
          const where: Prisma.ReferendumWhereInput = {
            deletedAt: null,
            status,
            ...(query
              ? {
                  OR: [
                    { title: { contains: query, mode: "insensitive" } },
                    { slug: { contains: query, mode: "insensitive" } },
                    { description: { contains: query, mode: "insensitive" } },
                  ],
                }
              : {}),
          };
          const referendums = await prisma.referendum.findMany({
            orderBy: [{ createdAt: "desc" }],
            select: REFERENDUM_SELECT,
            take: parseQueueLimit(a.limit, 20, 100),
            where,
          });

          return ok({
            count: referendums.length,
            referendums: referendums.map(summarizeReferendum),
          });
        }

        case "createReferendum": {
          const prisma = await getPrisma();
          const title = optionalString(a.title);
          if (!title) return err("title is required");
          const slug = slugify(optionalString(a.slug) ?? title);
          if (!slug) return err("slug could not be derived from title");
          const status = parseReferendumStatus(a.status, ReferendumStatus.DRAFT);
          if (!status) {
            return err("status must be one of DRAFT, ACTIVE, or CLOSED");
          }

          const description = optionalString(a.description);
          const jurisdictionId = optionalString(a.jurisdictionId);
          const data: Prisma.ReferendumUncheckedCreateInput = {
            title,
            slug,
            status,
            ...(description ? { description } : {}),
            ...(jurisdictionId ? { jurisdictionId } : {}),
            ...(userId ? { createdByUserId: userId } : {}),
          };
          const referendum = await prisma.referendum.create({
            data,
            select: REFERENDUM_SELECT,
          });

          return ok({ referendum: summarizeReferendum(referendum) });
        }

        // ── Repository / site inventory tools ──────────────────
        case "searchRepo": {
          const { searchRepo } = await import("./github-repo-tools.server");
          return ok(
            await searchRepo({
              fileType: typeof a.fileType === "string" ? a.fileType : undefined,
              limit: typeof a.limit === "number" ? a.limit : undefined,
              path: typeof a.path === "string" ? a.path : undefined,
              query: a.query as string,
              repo: typeof a.repo === "string" ? a.repo : undefined,
            }),
          );
        }

        case "getFileContent": {
          const { getFileContent } = await import("./github-repo-tools.server");
          return ok(
            await getFileContent({
              path: a.path as string,
              ref: typeof a.ref === "string" ? a.ref : undefined,
              repo: a.repo as string,
            }),
          );
        }

        case "listRepoFiles": {
          const { listRepoFiles } = await import("./github-repo-tools.server");
          return ok(
            await listRepoFiles({
              path: typeof a.path === "string" ? a.path : undefined,
              ref: typeof a.ref === "string" ? a.ref : undefined,
              repo: a.repo as string,
            }),
          );
        }

        case "githubApi": {
          const { callGitHubApi } = await import("./github-repo-tools.server");
          return ok(
            await callGitHubApi({
              body: a.body,
              method: typeof a.method === "string" ? a.method : undefined,
              path: a.path as string,
              query:
                a.query && typeof a.query === "object" && !Array.isArray(a.query)
                  ? (a.query as Record<string, string | number | boolean | null | undefined>)
                  : undefined,
            }),
          );
        }

        case "listSitePages": {
          const { listSitePages } = await import("./site-inventory.server");
          return ok(
            await listSitePages({
              site: typeof a.site === "string" ? a.site : undefined,
            }),
          );
        }

        case "getPageContent": {
          const { getPageContent } = await import("./site-inventory.server");
          return ok(await getPageContent({ url: a.url as string }));
        }

        // ── searchManual ───────────────────────────────────────
        case "searchManual": {
          const { retrieveManualContext } = await import("./manual-search.server");
          const result = await retrieveManualContext(a.query as string, {
            maxResults: (a.maxResults as number) ?? 5,
          });
          return ok(result);
        }

        // ── askWishonia ────────────────────────────────────────
        case "askWishonia": {
          const { retrieveManualContext } = await import("./manual-search.server");
          const { WISHONIA_VOICE_SYSTEM_PROMPT, RAG_MODEL } = await import("./voice-config");
          const { GoogleGenAI } = await import("@google/genai");

          const question = a.question as string;
          const ragResult = await retrieveManualContext(question, { maxResults: 5 });

          const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
          if (!apiKey) return err("GOOGLE_GENERATIVE_AI_API_KEY is not configured");

          const genai = new GoogleGenAI({ apiKey });
          const response = await genai.models.generateContent({
            model: RAG_MODEL,
            contents: [
              {
                role: "user",
                parts: [{ text: `Context from documentation:\n\n${ragResult.context}\n\n---\n\nQuestion: ${question}` }],
              },
            ],
            config: {
              systemInstruction: WISHONIA_VOICE_SYSTEM_PROMPT.replace(
                "Keep every response to 2-4 sentences. This is voice, not a lecture.",
                "Keep responses concise but thorough. Use paragraphs if needed.",
              ),
            },
          });

          const answer = response.text ?? "I seem to have lost my train of thought. Try again.";

          return ok({ answer, citations: ragResult.citations });
        }

        // ── postTaskComment ────────────────────────────────────
        case "postTaskComment": {
          if (!userId) return authRequired(name, "This tool needs an identified user to attribute writes or fetch personal data.");
          const {
            countUserCommentsInWindow,
            postComment,
          } = await import("./tasks/task-comments.server");
          const { notifyTaskCommentRecipients } = await import(
            "./tasks/task-comment-notifications.server"
          );
          const { generateAndPostWishoniaReply } = await import(
            "./tasks/wishonia-task-reply.server"
          );

          const taskId = a.taskId as string;
          const message =
            typeof a.message === "string" ? (a.message as string).trim() : "";
          if (!taskId || message.length === 0) {
            return err("taskId and message are required");
          }
          if (message.length > 20_000) {
            return err("Message exceeds 20,000 character limit");
          }
          const parentCommentId =
            typeof a.parentCommentId === "string" && a.parentCommentId.length > 0
              ? (a.parentCommentId as string)
              : null;
          const mediaUrl =
            typeof a.mediaUrl === "string" && a.mediaUrl.length > 0
              ? (a.mediaUrl as string)
              : null;

          // Rate limit: 5 per user per task per hour
          const recentCount = await countUserCommentsInWindow(
            taskId,
            userId,
            60 * 60 * 1000,
          );
          if (recentCount >= 5) {
            return err("Rate limit exceeded: max 5 comments per task per hour");
          }

          const comment = await postComment({
            taskId,
            authorUserId: userId,
            parentCommentId,
            message,
            mediaUrl,
          });

          void notifyTaskCommentRecipients({
            authorUserId: userId,
            commentId: comment.id,
            message,
            taskId,
          });

          void generateAndPostWishoniaReply({
            taskId,
            parentCommentId: comment.id,
            userComment: message,
            userCommentAuthorId: userId,
          });

          return ok({ comment });
        }

        // ── voteTaskComment ────────────────────────────────────
        case "voteTaskComment": {
          if (!userId) return authRequired(name, "This tool needs an identified user to attribute writes or fetch personal data.");
          const { voteComment } = await import("./tasks/task-comments.server");
          const commentId = a.commentId as string;
          const value = a.value as number;
          if (!commentId || (value !== 1 && value !== -1 && value !== 0)) {
            return err("commentId and value (1 | -1 | 0) are required");
          }
          const result = await voteComment({
            commentId,
            userId,
            value: value as 1 | -1 | 0,
          });
          return ok(result);
        }

        // ── deleteTaskComment ──────────────────────────────────
        case "deleteTaskComment": {
          if (!userId) return authRequired(name, "This tool needs an identified user to attribute writes or fetch personal data.");
          const { deleteComment } = await import("./tasks/task-comments.server");
          const commentId = a.commentId as string;
          if (!commentId) return err("commentId is required");
          await deleteComment({ commentId, userId });
          return ok({ success: true });
        }

        // ── getTaskComments ────────────────────────────────────
        case "getTaskComments": {
          const {
            getTaskCommentFeed,
            getTaskActivityTimeline,
          } = await import("./tasks/task-comments.server");
          const taskId = a.taskId as string;
          if (!taskId) return err("taskId is required");
          const sort = a.sort === "top" ? "top" : "new";
          const cursorRaw = a.cursor as string | undefined;
          const cursor = cursorRaw ? new Date(cursorRaw) : null;
          const limit = typeof a.limit === "number" ? (a.limit as number) : 50;

          const [feed, activities] = await Promise.all([
            getTaskCommentFeed({
              taskId,
              sort,
              cursor: cursor && !Number.isNaN(cursor.getTime()) ? cursor : null,
              limit,
              currentUserId: userId ?? null,
            }),
            cursor
              ? Promise.resolve([])
              : getTaskActivityTimeline(taskId, 50),
          ]);

          return ok({
            comments: feed.comments,
            nextCursor: feed.nextCursor?.toISOString() ?? null,
            activityEvents: activities,
          });
        }

        default:
          return err(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : undefined;
      // Server-side: full stack ends up in Vercel/runtime logs.
      console.error(`[mcp] tool "${name}" threw:`, error);
      // Wire-side: structured payload so the LLM (and humans reading the SSE
      // stream) get the actual failure, not a generic "execution error".
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                error: "tool_execution_failed",
                tool: name,
                message,
                cause,
                stack: stack ? stack.split("\n").slice(0, 10).join("\n") : undefined,
                args: a,
                userId: userId ?? null,
              },
              null,
              2,
            ),
          },
        ],
        isError: true,
      };
    }
    },
  );

  return server;
}

/**
 * Get the list of all tool definitions (for the /api/mcp/tools catalog).
 */
export function getToolDefinitions() {
  return TASK_TOOL_DEFINITIONS;
}
