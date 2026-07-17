/**
 * Shared MCP Server factory for the Optimitron Task System.
 *
 * Used by:
 * - scripts/mcp-task-server.ts (stdio transport for Claude Code)
 * - app/api/mcp/route.ts (HTTP transport for Claude Desktop / remote clients)
 */

import { createHash } from "node:crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  CombinationOperation,
  ContentReportStatus,
  AgentExecutorStatus,
  FillingType,
  McpToolCallStatus,
  NotificationStatus,
  OrgStatus,
  OrgType,
  OrganizationMemberRole,
  ReferendumKind,
  ReferendumStatus,
  SourceArtifactType,
  SourceSystem,
  TaskCategory,
  TaskApplicationEventType,
  TaskApplicationPolicy,
  TaskApplicationStatus,
  TaskCandidateKind,
  TaskCandidateMatchStatus,
  TaskClaimPolicy,
  TaskCompensationCadence,
  TaskCompensationKind,
  TaskCommunicationChannel,
  TaskCommunicationStatus,
  TaskEdgeType,
  TaskEngagementKind,
  TaskImpactFrameKey,
  TaskExecutionAttemptStatus,
  TaskExecutionMode,
  TaskRemotePolicy,
  TaskStatus,
  VotePosition,
} from "@optimitron/db/enums";
import type { Prisma } from "@optimitron/db";
import {
  getOrganizationPlanningRootTaskKey,
  getPersonPlanningRootTaskKey,
} from "@optimitron/db/task-keys";
// ---------------------------------------------------------------------------
// Scopes — re-exported from the browser-safe `mcp-scopes` module so client
// components (consent UI, dev portal) can pull just the catalog without
// dragging this server-only file into the client bundle.
// ---------------------------------------------------------------------------

import {
  MCP_SCOPE_DESCRIPTIONS,
  DEFAULT_CONSENT_SCOPES,
  ALL_SCOPES,
  McpScope,
  scopeToWire,
  taskBoundaryFromScopes,
} from "./mcp-scopes";
import {
  TASK_TRIGGER_ADMIN_TOOL_NAMES,
  TASK_TRIGGER_TOOL_DEFINITIONS,
  TASK_TRIGGER_TOOL_SCOPES,
  handleTaskTriggerToolCall,
  isTaskTriggerToolName,
} from "./mcp-tools/task-triggers";
import {
  TASK_TEMPLATE_ADMIN_TOOL_NAMES,
  TASK_TEMPLATE_TOOL_DEFINITIONS,
  TASK_TEMPLATE_TOOL_SCOPES,
  handleTaskTemplateToolCall,
  isTaskTemplateToolName,
} from "./mcp-tools/task-templates";
import {
  DOCUMENT_TOOL_DEFINITIONS,
  DOCUMENT_TOOL_SCOPES,
  handleDocumentToolCall,
  isDocumentToolName,
} from "./mcp-tools/documents";
import {
  COLLECTION_TOOL_DEFINITIONS,
  COLLECTION_TOOL_SCOPES,
  handleCollectionToolCall,
  isCollectionToolName,
} from "./mcp-tools/collections";
import {
  CONTENT_TOOL_DEFINITIONS,
  CONTENT_TOOL_SCOPES,
  handleContentToolCall,
  isContentToolName,
} from "./mcp-tools/content";
import {
  PRIVATE_EXECUTION_TOOL_DEFINITIONS,
  PRIVATE_EXECUTION_TOOL_SCOPES,
  handlePrivateExecutionToolCall,
  isPrivateExecutionToolName,
} from "./mcp-tools/private-execution";
import { stringifyJsonSafe } from "./json-safe";
import { normalizeTaskTextLineBreaks } from "./task-text";
import { slugify } from "./slugify";
import { IMAGE_UPLOAD_KINDS, isImageUploadKind } from "./image-upload-types";
import { ensureSubjectForUser } from "./subject.server";
import type { RankableTask } from "./tasks/rank-tasks";
import {
  canUserManageTask,
  getTaskAccessWhere,
  getTaskClientAccessWhere,
  isTaskWithinClientAccessBoundary,
  type TaskClientAccessBoundary,
} from "./tasks/task-visibility.server";
import type { PlanningCommitment } from "./tasks/execution-planner";
import {
  auditExecutionGraph,
  OPTIMIZE_EARTH_ROOT_TASK_ID,
  type ExecutionGraphEdge,
  type ExecutionGraphTask,
} from "./tasks/execution-planner-audit";
import {
  attachPlanningEffortEvidence,
  buildPersonalQueueRows,
  DEFAULT_PERSONAL_BUYBACK_RATE,
  getAuthorizedExecutionPlan,
  isAIExecutableTask,
  isAtomicExecutionRecord,
  isSelfExecutableTask,
  loadAgentPlanningProfiles,
  loadExecutionGraphContext,
  loadHumanPlanningProfiles,
  summarizeCapabilityWork,
  summarizeTask,
  type AuthorizedExecutionPlanRequest,
  type PersonalQueueRow,
  type PersonalQueueTaskRecord,
  type PlanningExecutorProfile,
  type SummarizableTask,
} from "./tasks/personal-planning.server";

export { getAuthorizedExecutionPlan } from "./tasks/personal-planning.server";

export { MCP_SCOPE_DESCRIPTIONS, DEFAULT_CONSENT_SCOPES, ALL_SCOPES, McpScope };

const UPLOAD_IMAGE_FROM_URL_TOOL_NAME = "uploadImageFromUrl" as const;
const RECORD_MEASUREMENT_TOOL_NAME = "recordMeasurement" as const;

const TOOL_SCOPES: Record<string, McpScope[]> = {
  // Explicitly public, read-only tools. Missing entries are a registry error.
  getNextTask: [],
  evaluateTaskEconomics: [],
  listTasks: [],
  getTask: [],
  listOrganizations: [],
  getOrganizationTasks: [],
  listPeople: [],
  getPersonTasks: [],
  getBlockers: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ORGANIZATION],
  listReferendums: [],
  listSitePages: [],
  getPageContent: [],
  searchManual: [],
  askWishonia: [],
  searchTasks: [],
  createOrganization: [McpScope.EARTHDATA_WRITE, McpScope.TASKS_ADMIN],
  [UPLOAD_IMAGE_FROM_URL_TOOL_NAME]: [
    McpScope.EARTHDATA_WRITE,
    McpScope.TASKS_ADMIN,
  ],
  createTask: [
    McpScope.TASKS_PERSONAL,
    McpScope.TASKS_ORGANIZATION,
    McpScope.TASKS_ADMIN,
  ],
  proposeTaskBundle: [
    McpScope.TASKS_PERSONAL,
    McpScope.TASKS_ORGANIZATION,
    McpScope.TASKS_ADMIN,
  ],
  promoteTask: [
    McpScope.TASKS_PERSONAL,
    McpScope.TASKS_ORGANIZATION,
    McpScope.TASKS_ADMIN,
  ],
  deleteTask: [
    McpScope.TASKS_PERSONAL,
    McpScope.TASKS_ORGANIZATION,
    McpScope.TASKS_ADMIN,
  ],
  updateTask: [
    McpScope.TASKS_PERSONAL,
    McpScope.TASKS_ORGANIZATION,
    McpScope.TASKS_ADMIN,
  ],
  setTaskImpact: [McpScope.TASKS_ADMIN],
  proposeTaskImpact: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  searchParameters: [McpScope.TASKS_PERSONAL, McpScope.EARTHDATA_WRITE],
  getParameterTrace: [McpScope.TASKS_PERSONAL, McpScope.EARTHDATA_WRITE],
  proposeParameterBundle: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  reviewParameterRevision: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  getTaskImpactTrace: [McpScope.TASKS_PERSONAL, McpScope.EARTHDATA_WRITE],
  recordTaskActuals: [
    McpScope.TASKS_PERSONAL,
    McpScope.TASKS_ORGANIZATION,
    McpScope.TASKS_ADMIN,
  ],
  addDependency: [
    McpScope.TASKS_PERSONAL,
    McpScope.TASKS_ORGANIZATION,
    McpScope.TASKS_ADMIN,
  ],
  createReferendum: [McpScope.TASKS_ADMIN],
  createPerson: [McpScope.TASKS_ADMIN],
  upsertOrganization: [McpScope.EARTHDATA_ADMIN, McpScope.TASKS_ADMIN],
  updateOrganization: [McpScope.EARTHDATA_WRITE, McpScope.TASKS_ADMIN],
  deleteOrganization: [McpScope.EARTHDATA_ADMIN, McpScope.TASKS_ADMIN],
  addOrganizationMember: [McpScope.EARTHDATA_WRITE, McpScope.TASKS_ADMIN],
  removeOrganizationMember: [McpScope.EARTHDATA_WRITE, McpScope.TASKS_ADMIN],
  updateOrganizationMemberRole: [
    McpScope.EARTHDATA_WRITE,
    McpScope.TASKS_ADMIN,
  ],
  listOrganizationMembers: [McpScope.EARTHDATA_WRITE],
  castReferendumVote: [McpScope.EARTHDATA_WRITE],
  recordRepresentedReferendumVote: [McpScope.EARTHDATA_WRITE],
  searchPeople: [McpScope.EARTHDATA_WRITE],
  getPerson: [McpScope.EARTHDATA_WRITE],
  searchOrganizations: [McpScope.EARTHDATA_WRITE],
  signReferendumAsOrganization: [McpScope.EARTHDATA_WRITE],
  upsertMemorialPerson: [McpScope.EARTHDATA_WRITE],
  addMemorialEvidence: [McpScope.EARTHDATA_WRITE],
  addMemorialResponsibleParty: [McpScope.EARTHDATA_WRITE],
  upsertConflict: [McpScope.EARTHDATA_WRITE],
  resolveGlobalVariable: [McpScope.EARTHDATA_WRITE],
  upsertSourceArtifact: [McpScope.EARTHDATA_WRITE],
  upsertCourtCase: [McpScope.EARTHDATA_WRITE],
  addCourtCaseParty: [McpScope.EARTHDATA_WRITE],
  addCourtCaseClaim: [McpScope.EARTHDATA_WRITE],
  addCourtCaseHarm: [McpScope.EARTHDATA_WRITE],
  addCourtCaseEvidence: [McpScope.EARTHDATA_WRITE],
  addCourtCaseRemedy: [McpScope.EARTHDATA_WRITE],
  getCourtCase: [McpScope.EARTHDATA_WRITE],
  openCourtCaseJuryVote: [McpScope.EARTHDATA_WRITE],
  upsertInterventionApprovalTimeline: [McpScope.EARTHDATA_WRITE],
  upsertVariableRelationshipEvidenceEstimate: [McpScope.EARTHDATA_WRITE],
  recordInterventionExperience: [McpScope.EARTHDATA_WRITE],
  runEfficacyLagMatcher: [McpScope.EARTHDATA_WRITE],
  reportContent: [McpScope.EARTHDATA_WRITE],
  suggestCorrection: [McpScope.EARTHDATA_WRITE],
  hideContent: [McpScope.EARTHDATA_ADMIN],
  restoreContent: [McpScope.EARTHDATA_ADMIN],
  mergeDuplicatePeople: [McpScope.EARTHDATA_ADMIN],
  resolveContentReport: [McpScope.EARTHDATA_ADMIN],
  // tasks:personal
  claimTask: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ORGANIZATION],
  claimSignerReminder: [McpScope.TASKS_PERSONAL],
  completeTaskClaim: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ORGANIZATION],
  logAgentRun: [McpScope.AGENT_RUN],
  acquireLease: [McpScope.AGENT_RUN],
  heartbeatLease: [McpScope.AGENT_RUN],
  releaseLease: [McpScope.AGENT_RUN],
  postTaskComment: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ORGANIZATION],
  voteTaskComment: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ORGANIZATION],
  deleteTaskComment: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ORGANIZATION],
  getTaskComments: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ORGANIZATION],
  listTaskEmails: [McpScope.TASKS_ADMIN],
  listRecipientEmails: [McpScope.TASKS_ADMIN],
  listEmailLogs: [McpScope.TASKS_ADMIN],
  // Personal-scope communications audit: handlers scope non-admin callers to
  // tasks they created or are assigned to, so these are NOT admin-only.
  listCommunications: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  getCommunicationLog: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  getMyQueue: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ORGANIZATION],
  getAIQueue: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ORGANIZATION],
  getNextAction: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ORGANIZATION],
  getExecutionPlan: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ORGANIZATION],
  findTasksForUser: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  applyToTask: [McpScope.TASKS_PERSONAL],
  listTaskApplications: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  reviewTaskApplication: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  findTaskCandidates: [McpScope.TASKS_ADMIN],
  saveTaskCandidateMatch: [McpScope.TASKS_ADMIN],
  listTaskCandidateMatches: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  updateTaskCandidateMatchStatus: [McpScope.TASKS_ADMIN],
  listAgentExecutors: [McpScope.AGENT_RUN, McpScope.TASKS_ADMIN],
  upsertAgentExecutor: [McpScope.AGENT_RUN, McpScope.TASKS_ADMIN],
  setAgentExecutorStatus: [McpScope.AGENT_RUN, McpScope.TASKS_ADMIN],
  getQueueAudit: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ORGANIZATION],
  [RECORD_MEASUREMENT_TOOL_NAME]: [McpScope.TASKS_PERSONAL],
  upsertTrackingReminder: [McpScope.TASKS_PERSONAL],
  listTrackingReminders: [McpScope.TASKS_PERSONAL],
  listDueTrackingReminders: [McpScope.TASKS_PERSONAL],
  respondToTrackingReminder: [McpScope.TASKS_PERSONAL],
  getMe: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ORGANIZATION],
  updateMyProfile: [McpScope.TASKS_PERSONAL],
  searchRepo: [McpScope.GITHUB],
  getFileContent: [McpScope.GITHUB],
  listRepoFiles: [McpScope.GITHUB],
  githubApi: [McpScope.GITHUB],
  ...TASK_TEMPLATE_TOOL_SCOPES,
  ...TASK_TRIGGER_TOOL_SCOPES,
  ...COLLECTION_TOOL_SCOPES,
  ...DOCUMENT_TOOL_SCOPES,
  ...CONTENT_TOOL_SCOPES,
  ...PRIVATE_EXECUTION_TOOL_SCOPES,
};

const ADMIN_ONLY_TOOLS = new Set([
  "setTaskImpact",
  "createReferendum",
  "createPerson",
  "upsertOrganization",
  "deleteOrganization",
  "logAgentRun",
  "acquireLease",
  "heartbeatLease",
  "releaseLease",
  "searchRepo",
  "getFileContent",
  "listRepoFiles",
  "githubApi",
  "listTaskEmails",
  "listRecipientEmails",
  "listEmailLogs",
  "findTaskCandidates",
  "saveTaskCandidateMatch",
  "updateTaskCandidateMatchStatus",
  "listAgentExecutors",
  "upsertAgentExecutor",
  "setAgentExecutorStatus",
  ...TASK_TEMPLATE_ADMIN_TOOL_NAMES,
  ...TASK_TRIGGER_ADMIN_TOOL_NAMES,
  "hideContent",
  "restoreContent",
  "mergeDuplicatePeople",
  "resolveContentReport",
]);

const DISABLED_TOOLS = new Set([
  // The underlying merge helper predates person-centered votes/memorials.
  // Keep this hidden until the merge path explicitly reassigns every Person
  // relation, including referendum votes, memorials, conditions, and subjects.
  "mergeDuplicatePeople",
]);

function hasScope(
  grantedScopes: McpScope[] | undefined,
  toolName: string,
): boolean {
  // Deny by default. Callers must pass an explicit scopes array — stdio passes ALL_SCOPES,
  // HTTP traffic always carries a Bearer token (the route 401s on missing/invalid auth) and
  // passes the scopes granted at OAuth consent time.
  if (!grantedScopes) return false;
  const required = TOOL_SCOPES[toolName];
  if (!required) return false;
  if (required.length === 0) return true;
  return required.some((s) => grantedScopes.includes(s));
}

function hasAdminTaskWriteAccess(
  scopes: McpScope[] | undefined,
  isAdmin: boolean,
) {
  // Single-admin posture: the admin role is the security gate. The
  // TASKS_ADMIN scope documents admin-capable clients in the consent UI, but
  // requiring it here adds friction without meaningful extra risk reduction.
  // If this becomes multi-admin and per-client POLA matters, re-add the scope
  // gate with: `isAdmin && !!scopes?.includes(McpScope.TASKS_ADMIN)`.
  void scopes;
  return isAdmin;
}

function requiredPrivateTaskScope(ownerOrganizationId: string | null | undefined) {
  return ownerOrganizationId
    ? McpScope.TASKS_ORGANIZATION
    : McpScope.TASKS_PERSONAL;
}

const getMcpTaskClientBoundary = taskBoundaryFromScopes;

function getTaskScopeWhere(
  scopes: McpScope[] | undefined,
  organizationIds: readonly string[] | null,
): Prisma.TaskWhereInput {
  return getTaskClientAccessWhere(
    getMcpTaskClientBoundary(scopes, organizationIds),
  );
}

// ---------------------------------------------------------------------------
// Lazy imports (keep startup fast, avoid connection errors during tool listing)
// ---------------------------------------------------------------------------

async function getTaskFunctions() {
  const [tasks, ranking, impact, endpoints, lease, assignmentNotifications] =
    await Promise.all([
      import("./tasks.server"),
      import("./tasks/rank-tasks"),
      import("./tasks/impact"),
      import("./tasks/task-communication-endpoints.server"),
      import("./tasks/agent-lease.server"),
      import("./tasks/task-assignment-notifications.server"),
    ]);
  return { tasks, ranking, impact, endpoints, lease, assignmentNotifications };
}

async function getPrisma() {
  const { prisma } = await import("./prisma");
  return prisma;
}

// Personal-queue handlers need both the userId (creator filter) and the
// linked Person id (assignee filter) so trigger-spawned tasks assigned to
// the user surface alongside tasks they authored.
async function loadSessionPersonId(userId: string): Promise<string | null> {
  const prisma = await getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { personId: true },
  });
  return user?.personId ?? null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ok(data: unknown) {
  const text = stringifyJsonSafe(data, 2);
  const json = JSON.parse(text) as unknown;
  return {
    content: [{ type: "text" as const, text }],
    ...(json != null && typeof json === "object" && !Array.isArray(json)
      ? { structuredContent: json as Record<string, unknown> }
      : {}),
  };
}

function err(message: string) {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify({ error: message }) },
    ],
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

const AUDITED_MCP_TOOLS = new Set([
  "createOrganization",
  UPLOAD_IMAGE_FROM_URL_TOOL_NAME,
  "upsertOrganization",
  "updateOrganization",
  "deleteOrganization",
  "addOrganizationMember",
  "removeOrganizationMember",
  "updateOrganizationMemberRole",
  "castReferendumVote",
  "recordRepresentedReferendumVote",
  "signReferendumAsOrganization",
  "upsertMemorialPerson",
  "addMemorialEvidence",
  "addMemorialResponsibleParty",
  "upsertConflict",
  "resolveGlobalVariable",
  "upsertSourceArtifact",
  "upsertCourtCase",
  "addCourtCaseParty",
  "addCourtCaseClaim",
  "addCourtCaseHarm",
  "addCourtCaseEvidence",
  "addCourtCaseRemedy",
  "openCourtCaseJuryVote",
  "upsertInterventionApprovalTimeline",
  "upsertVariableRelationshipEvidenceEstimate",
  "recordInterventionExperience",
  "runEfficacyLagMatcher",
  "reportContent",
  "suggestCorrection",
  "hideContent",
  "restoreContent",
  "mergeDuplicatePeople",
  "resolveContentReport",
  ...Object.keys(PRIVATE_EXECUTION_TOOL_SCOPES),
]);

function stableStringify(value: unknown) {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_key, item) => {
    if (item && typeof item === "object") {
      if (seen.has(item)) return "[Circular]";
      seen.add(item);
      if (!Array.isArray(item)) {
        return Object.fromEntries(
          Object.entries(item as Record<string, unknown>).sort(([a], [b]) =>
            a.localeCompare(b),
          ),
        );
      }
    }
    return item;
  });
}

function hashMcpInput(input: unknown) {
  return createHash("sha256")
    .update(stableStringify(input) ?? "null")
    .digest("hex");
}

function mcpToolInputSummary(args: Record<string, unknown>) {
  const safeScalarKeys = [
    "targetType",
    "targetId",
    "reasonType",
    "sourceKind",
    "referendumSlug",
    "lifeStatus",
    "causeCategory",
    "position",
    "kind",
    "codeSystem",
    "sourceSystem",
    "artifactType",
    "status",
  ];
  const summary: Record<string, unknown> = { keys: Object.keys(args).sort() };
  for (const key of safeScalarKeys) {
    const value = args[key];
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      summary[key] = value;
    }
  }
  for (const key of [
    "sourceUrl",
    "sourceArtifactId",
    "sourceKey",
    "correctionJson",
    "payloadJson",
    "memorialMessage",
    "publicComment",
    "notes",
  ]) {
    summary[`${key}Present`] = args[key] != null && args[key] !== "";
  }
  return summary;
}

function mcpToolOutputSummary(output: unknown) {
  const refs: Record<string, string[]> = {};
  const visit = (value: unknown, depth = 0) => {
    if (!value || depth > 4) return;
    if (Array.isArray(value)) {
      for (const item of value.slice(0, 20)) visit(item, depth + 1);
      return;
    }
    if (typeof value !== "object") return;
    for (const [key, item] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (
        typeof item === "string" &&
        (key === "id" || /Id$/.test(key) || key === "slug" || key === "handle")
      ) {
        refs[key] = [...(refs[key] ?? []), item];
      } else {
        visit(item, depth + 1);
      }
    }
  };
  visit(output);
  return { refs };
}

async function writeMcpToolAudit(input: {
  agentId?: string | null;
  args: Record<string, unknown>;
  clientId?: string | null;
  error?: unknown;
  oauthGrantId?: string | null;
  output?: unknown;
  runId?: string | null;
  status: McpToolCallStatus;
  toolName: string;
  userId?: string | null;
}) {
  if (!AUDITED_MCP_TOOLS.has(input.toolName)) return;
  try {
    const prisma = await getPrisma();
    return await prisma.mcpToolCallAudit.create({
      data: {
        agentId: input.agentId ?? null,
        clientId: input.clientId ?? null,
        completedAt: new Date(),
        errorSummary:
          input.error == null
            ? null
            : input.error instanceof Error
              ? input.error.message.slice(0, 500)
              : String(input.error).slice(0, 500),
        inputHash: hashMcpInput(input.args),
        inputSummaryJson: mcpToolInputSummary(
          input.args,
        ) as Prisma.InputJsonValue,
        oauthGrantId: input.oauthGrantId ?? null,
        outputSummaryJson:
          input.status === McpToolCallStatus.SUCCEEDED
            ? (mcpToolOutputSummary(input.output) as Prisma.InputJsonValue)
            : undefined,
        status: input.status,
        toolName: input.toolName,
        userId: input.userId ?? null,
      },
      select: {
        completedAt: true,
        id: true,
        status: true,
        toolName: true,
      },
    });
  } catch (auditError) {
    console.error(
      `[mcp] failed to audit tool "${input.toolName}":`,
      auditError,
    );
  }
}

async function runAuditedEarthDataTool(
  toolName: string,
  args: Record<string, unknown>,
  ctx: {
    clientId?: string | null;
    oauthGrantId?: string | null;
    userId?: string | null;
  },
  fn: () => Promise<unknown>,
) {
  const agentId = typeof args.agentId === "string" ? args.agentId : null;
  const runId = typeof args.runId === "string" ? args.runId : null;
  try {
    const output = await fn();
    await writeMcpToolAudit({
      agentId,
      args,
      clientId: ctx.clientId,
      oauthGrantId: ctx.oauthGrantId,
      output,
      runId,
      status: McpToolCallStatus.SUCCEEDED,
      toolName,
      userId: ctx.userId,
    });
    return ok(output);
  } catch (error) {
    await writeMcpToolAudit({
      agentId,
      args,
      clientId: ctx.clientId,
      error,
      oauthGrantId: ctx.oauthGrantId,
      runId,
      status: McpToolCallStatus.FAILED,
      toolName,
      userId: ctx.userId,
    });
    throw error;
  }
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
    accessTags: (args.accessTags as string[]) ?? [],
    availableHoursPerWeek: (args.availableHoursPerWeek as number) ?? null,
    credentialTags: (args.credentialTags as string[]) ?? [],
    interestTags: (args.interestTags as string[]) ?? [],
    languageTags: (args.languageTags as string[]) ?? [],
    skillTags: (args.skillTags as string[]) ?? [],
    toolTags: (args.toolTags as string[]) ?? [],
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

function optionalStringInput(
  input: Record<string, unknown>,
  fieldName: string,
) {
  if (!(fieldName in input)) return undefined;
  const value = input[fieldName];
  if (value == null) return null;
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string or null.`);
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function requiredString(value: unknown, fieldName: string) {
  return (
    optionalString(value) ??
    err(
      `${fieldName} is required. Use searchTasks, listTasks, getMyQueue, or getNextAction to find a task id, then call this tool with {"${fieldName}":"<task-id>"}.`,
    )
  );
}

function parseEnumInput<T extends Record<string, string>>(
  values: T,
  value: unknown,
  fieldName: string,
): T[keyof T] | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string.`);
  }
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[-\s]+/g, "_");
  const parsed = values[normalized as keyof T];
  if (!parsed) {
    throw new Error(
      `${fieldName} must be one of: ${Object.keys(values).join(", ")}.`,
    );
  }
  return parsed;
}

function parseNullableEnumInput<T extends Record<string, string>>(
  values: T,
  input: Record<string, unknown>,
  fieldName: string,
): T[keyof T] | null | undefined {
  if (!(fieldName in input)) return undefined;
  const value = input[fieldName];
  if (value == null || value === "") return null;
  return parseEnumInput(values, value, fieldName);
}

function parseStringArrayInput(
  input: Record<string, unknown>,
  fieldName: string,
) {
  if (!(fieldName in input)) return undefined;
  const value = input[fieldName];
  if (value == null) return [];
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array of strings.`);
  }
  return dedupeStrings(
    value.map((entry) => {
      if (typeof entry !== "string") {
        throw new Error(`${fieldName} entries must be strings.`);
      }
      return entry;
    }),
  );
}

function parseOptionalFiniteNumberInput(
  input: Record<string, unknown>,
  fieldName: string,
) {
  if (!(fieldName in input)) return undefined;
  const value = input[fieldName];
  if (value == null || value === "") return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number or null.`);
  }
  return value;
}

function parseOptionalIntegerInput(
  input: Record<string, unknown>,
  fieldName: string,
) {
  const value = parseOptionalFiniteNumberInput(input, fieldName);
  if (value === undefined || value === null) return value;
  if (!Number.isInteger(value)) {
    throw new Error(`${fieldName} must be an integer.`);
  }
  return value;
}

function parseMinorUnitsInput(
  input: Record<string, unknown>,
  fieldName: string,
  dollarAlias?: string,
) {
  const hasMinorUnits = fieldName in input;
  const hasDollarAlias = dollarAlias ? dollarAlias in input : false;
  if (!hasMinorUnits && !hasDollarAlias) return undefined;
  if (hasMinorUnits) {
    const value = input[fieldName];
    if (value == null || value === "") return null;
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
      throw new Error(
        `${fieldName} must be a non-negative integer minor-unit amount.`,
      );
    }
    return BigInt(value);
  }
  const dollars = input[dollarAlias!];
  if (dollars == null || dollars === "") return null;
  if (typeof dollars !== "number" || !Number.isFinite(dollars) || dollars < 0) {
    throw new Error(`${dollarAlias} must be a non-negative number.`);
  }
  return BigInt(Math.round(dollars * 100));
}

function normalizeJsonPatchValue(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return toInputJsonValue(value);
}

function buildTaskRoutingData(input: Record<string, unknown>) {
  const data: Record<string, unknown> = {};

  for (const fieldName of [
    "preferredSkillTags",
    "requiredCredentialTags",
    "preferredCredentialTags",
    "requiredLanguageTags",
    "preferredLanguageTags",
    "requiredToolTags",
    "preferredToolTags",
    "requiredAccessTags",
    "preferredAccessTags",
    "compensationPaymentRails",
  ]) {
    const parsed = parseStringArrayInput(input, fieldName);
    if (parsed !== undefined) data[fieldName] = parsed;
  }

  for (const fieldName of [
    "ownerOrganizationId",
    "compensationCurrency",
    "locationText",
    "workLocationCountryCode",
    "workLocationRegionCode",
    "workLocationCity",
    "workLocationPostalCode",
    "workTimeZone",
  ]) {
    const parsed = optionalStringInput(input, fieldName);
    if (parsed !== undefined) data[fieldName] = parsed;
  }

  const enumFields = [
    ["engagementKind", TaskEngagementKind],
    ["applicationPolicy", TaskApplicationPolicy],
    ["compensationKind", TaskCompensationKind],
    ["remotePolicy", TaskRemotePolicy],
    ["executionMode", TaskExecutionMode],
  ] as const;
  for (const [fieldName, enumValues] of enumFields) {
    const parsed = parseEnumInput(enumValues, input[fieldName], fieldName);
    if (parsed !== undefined) data[fieldName] = parsed;
  }

  const cadence = parseNullableEnumInput(
    TaskCompensationCadence,
    input,
    "compensationCadence",
  );
  if (cadence !== undefined) data.compensationCadence = cadence;

  for (const fieldName of [
    "estimatedHoursPerWeekMin",
    "estimatedHoursPerWeekMax",
    "maxClaims",
  ]) {
    const parsed = parseOptionalIntegerInput(input, fieldName);
    if (parsed !== undefined) data[fieldName] = parsed;
  }

  for (const fieldName of [
    "workLocationLatitude",
    "workLocationLongitude",
    "workLocationRadiusKm",
  ]) {
    const parsed = parseOptionalFiniteNumberInput(input, fieldName);
    if (parsed !== undefined) data[fieldName] = parsed;
  }

  const minAmount = parseMinorUnitsInput(
    input,
    "compensationMinAmountMinorUnits",
    "compensationMinAmountUsd",
  );
  if (minAmount !== undefined) data.compensationMinAmountMinorUnits = minAmount;
  const maxAmount = parseMinorUnitsInput(
    input,
    "compensationMaxAmountMinorUnits",
    "compensationMaxAmountUsd",
  );
  if (maxAmount !== undefined) data.compensationMaxAmountMinorUnits = maxAmount;

  if ("applicationQuestionsJson" in input) {
    data.applicationQuestionsJson = normalizeJsonPatchValue(
      input.applicationQuestionsJson,
    );
  }

  return data;
}

const USER_MATCHING_SELECT = {
  accessTags: true,
  availableFrom: true,
  availableHoursPerWeek: true,
  city: true,
  countryCode: true,
  credentialTags: true,
  email: true,
  id: true,
  interestTags: true,
  languageTags: true,
  latitude: true,
  longitude: true,
  personId: true,
  postalCode: true,
  preferredPaymentRails: true,
  preferredTaskTags: true,
  regionCode: true,
  skillTags: true,
  toolTags: true,
  unavailableTaskTags: true,
  workPreferenceTags: true,
  person: {
    select: {
      displayName: true,
      handle: true,
      id: true,
      image: true,
    },
  },
} satisfies Prisma.UserSelect;

type UserMatchingRecord = Prisma.UserGetPayload<{
  select: typeof USER_MATCHING_SELECT;
}>;

function buildUserMatchingProfileData(input: Record<string, unknown>) {
  const data: Record<string, unknown> = {};

  for (const fieldName of [
    "skillTags",
    "credentialTags",
    "interestTags",
    "languageTags",
    "toolTags",
    "accessTags",
    "preferredPaymentRails",
    "workPreferenceTags",
    "preferredTaskTags",
    "unavailableTaskTags",
  ]) {
    const parsed = parseStringArrayInput(input, fieldName);
    if (parsed !== undefined) data[fieldName] = parsed;
  }

  for (const fieldName of ["countryCode", "regionCode", "city", "postalCode"]) {
    const parsed = optionalStringInput(input, fieldName);
    if (parsed !== undefined) data[fieldName] = parsed;
  }

  for (const fieldName of ["latitude", "longitude"]) {
    const parsed = parseOptionalFiniteNumberInput(input, fieldName);
    if (parsed !== undefined) data[fieldName] = parsed;
  }
  const availableHoursPerWeek = parseOptionalIntegerInput(
    input,
    "availableHoursPerWeek",
  );
  if (availableHoursPerWeek !== undefined) {
    data.availableHoursPerWeek = availableHoursPerWeek;
  }

  if ("availableFrom" in input) {
    const raw = input.availableFrom;
    data.availableFrom = raw == null || raw === "" ? null : parseTaskDate(raw);
    if (raw != null && raw !== "" && data.availableFrom === null) {
      throw new Error("availableFrom must be a valid date.");
    }
  }

  if (Object.keys(data).length > 0) {
    data.availabilityUpdatedAt = new Date();
  }

  return data;
}

function summarizeMatchingUser(user: UserMatchingRecord) {
  return {
    accessTags: user.accessTags,
    availableFrom: user.availableFrom?.toISOString() ?? null,
    availableHoursPerWeek: user.availableHoursPerWeek,
    city: user.city,
    countryCode: user.countryCode,
    credentialTags: user.credentialTags,
    email: user.email,
    id: user.id,
    interestTags: user.interestTags,
    languageTags: user.languageTags,
    person: user.person,
    personId: user.personId,
    postalCode: user.postalCode,
    preferredPaymentRails: user.preferredPaymentRails,
    preferredTaskTags: user.preferredTaskTags,
    regionCode: user.regionCode,
    skillTags: user.skillTags,
    toolTags: user.toolTags,
    unavailableTaskTags: user.unavailableTaskTags,
    workPreferenceTags: user.workPreferenceTags,
  };
}

function toRankableUser(user: UserMatchingRecord) {
  return {
    accessTags: user.accessTags,
    availableHoursPerWeek: user.availableHoursPerWeek,
    city: user.city,
    countryCode: user.countryCode,
    credentialTags: user.credentialTags,
    interestTags: user.interestTags,
    languageTags: user.languageTags,
    preferredPaymentRails: user.preferredPaymentRails,
    regionCode: user.regionCode,
    skillTags: user.skillTags,
    toolTags: user.toolTags,
    workPreferenceTags: user.workPreferenceTags,
  };
}

function toJsonSafe(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toJsonSafe);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        toJsonSafe(entry),
      ]),
    );
  }
  return value;
}

function deriveCandidateKey(input: {
  agentExecutorId?: string | null;
  candidateKey?: string | null;
  candidateKind: TaskCandidateKind;
  candidateOrganizationId?: string | null;
  candidatePersonId?: string | null;
  candidateUserId?: string | null;
}) {
  if (input.candidateKey) return input.candidateKey;
  if (input.candidateUserId) return `user:${input.candidateUserId}`;
  if (input.candidatePersonId) return `person:${input.candidatePersonId}`;
  if (input.candidateOrganizationId)
    return `organization:${input.candidateOrganizationId}`;
  if (input.agentExecutorId) return `agent:${input.agentExecutorId}`;
  throw new Error(
    `candidateKey is required when no candidate id is provided for ${input.candidateKind}.`,
  );
}

function summarizeCandidateMatch(match: Record<string, unknown>) {
  return toJsonSafe(match);
}

function normalizedTagSet(values: readonly string[] | null | undefined) {
  return new Set(
    (values ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean),
  );
}

function tagCoverageScore(
  required: readonly string[] | null | undefined,
  available: readonly string[] | null | undefined,
) {
  const requiredSet = normalizedTagSet(required);
  if (requiredSet.size === 0) return 0.5;
  const availableSet = normalizedTagSet(available);
  let matched = 0;
  for (const tag of requiredSet) {
    if (availableSet.has(tag)) matched += 1;
  }
  return matched / requiredSet.size;
}

function scoreAgentCandidate(
  task: Record<string, unknown>,
  agent: Record<string, unknown>,
) {
  const capabilityScore = tagCoverageScore(
    [
      ...asStringArray(task.skillTags),
      ...asStringArray(task.preferredSkillTags),
    ],
    agent.capabilityTags as string[] | null,
  );
  const toolScore = tagCoverageScore(
    [
      ...asStringArray(task.requiredToolTags),
      ...asStringArray(task.preferredToolTags),
    ],
    agent.toolTags as string[] | null,
  );
  const accessScore = tagCoverageScore(
    [
      ...asStringArray(task.requiredAccessTags),
      ...asStringArray(task.preferredAccessTags),
    ],
    agent.accessTags as string[] | null,
  );
  const successRate =
    typeof agent.successRate === "number" && Number.isFinite(agent.successRate)
      ? Math.max(0, Math.min(1, agent.successRate))
      : 0.5;
  return (
    capabilityScore * 0.45 +
    toolScore * 0.2 +
    accessScore * 0.2 +
    successRate * 0.15
  );
}

function parseAgentRunExecutionStatus(value: unknown) {
  const raw = optionalString(value);
  if (raw === null) return TaskExecutionAttemptStatus.COMPLETED;
  switch (raw.toUpperCase()) {
    case "RUNNING":
      return TaskExecutionAttemptStatus.RUNNING;
    case "FAILED":
      return TaskExecutionAttemptStatus.FAILED;
    case "PARTIAL":
    case "COMPLETED":
      return TaskExecutionAttemptStatus.COMPLETED;
    default:
      return null;
  }
}

function dollarsToMinorUnits(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return BigInt(Math.round(value * 100));
}

function positiveInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
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
      assigneeOrganizationId:
        (input.candidate.assigneeOrganizationId as string) ?? null,
      assigneePersonId: (input.candidate.assigneePersonId as string) ?? null,
      blockerRefs: (input.candidate.blockerRefs as string[]) ?? [],
      dependencies:
        (input.candidate.dependencies as Array<Record<string, unknown>>) ?? [],
      contactUrl: (input.candidate.contactUrl as string) ?? null,
      description: (input.candidate.description as string) ?? null,
      estimatedEffortHours:
        (input.candidate.estimatedEffortHours as number) ?? null,
      executorType: normalizeExecutorType(input.candidate.executorType),
      bestRoute: (input.candidate.bestRoute as string) ?? null,
      dueAt: (input.candidate.dueAt as string) ?? null,
      deadlinePolicy: normalizeDeadlinePolicy(input.candidate.deadlinePolicy),
      acceptanceCriteria:
        (input.candidate.acceptanceCriteria as string[]) ?? [],
      impact: (input.candidate.impact as Record<string, unknown>) ?? null,
      isPublic: (input.candidate.isPublic as boolean) ?? false,
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
      source: asObject(input.candidate.source),
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

  if (
    text.includes("growth") ||
    text.includes("conversion") ||
    text.includes("traffic")
  ) {
    return TaskCategory.COMMUNICATION;
  }
  if (
    text.includes("contact") ||
    text.includes("journalist") ||
    text.includes("research")
  ) {
    return TaskCategory.RESEARCH;
  }
  if (
    text.includes("system:") ||
    text.includes("queue") ||
    text.includes("ranking")
  ) {
    return TaskCategory.ENGINEERING;
  }

  return TaskCategory.OTHER;
}

function getProposalGovernanceImpact(candidate: Record<string, unknown>) {
  const impact = asObject(candidate.impact) ?? {};
  const hours = parseFiniteNumber(candidate.estimatedEffortHours);
  const expectedEconomicValueUsdBase = parseFiniteNumber(
    impact.expectedEconomicValueUsdBase,
  );
  const expectedDalysAvertedBase = parseFiniteNumber(
    impact.expectedDalysAvertedBase,
  );
  return {
    delayDalysLostPerDay: parseFiniteNumber(impact.delayDalysLostPerDay),
    delayEconomicValueUsdLostPerDay: parseFiniteNumber(
      impact.delayEconomicValueUsdLostPerDay,
    ),
    expectedValuePerHourDalys:
      parseFiniteNumber(impact.expectedValuePerHourDalys) ??
      (hours && expectedDalysAvertedBase != null
        ? expectedDalysAvertedBase / hours
        : null),
    expectedValuePerHourUsd:
      parseFiniteNumber(impact.expectedValuePerHourUsd) ??
      (hours && expectedEconomicValueUsdBase != null
        ? expectedEconomicValueUsdBase / hours
        : null),
  };
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
      (proposal?.assigneeOrganizationId as string) ??
      task.assigneeOrganizationId ??
      null,
    assigneePersonId:
      (proposal?.assigneePersonId as string) ?? task.assigneePersonId ?? null,
    blockerRefs: ((proposal?.blockerRefs as string[]) ?? []) as string[],
    contactUrl:
      (proposal?.contactUrl as string) ??
      getCommunicationEndpointUrl(task) ??
      null,
    description: (proposal?.description as string) ?? task.description ?? null,
    estimatedEffortHours:
      (proposal?.estimatedEffortHours as number) ??
      task.estimatedEffortHours ??
      null,
    id: task.id,
    impact: getProposalGovernanceImpact({
      estimatedEffortHours:
        (proposal?.estimatedEffortHours as number) ??
        task.estimatedEffortHours ??
        null,
      impact: asObject(proposal?.impact),
    }),
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
  actor: { isAdmin: boolean; userId: string };
  prisma: Awaited<ReturnType<typeof getPrisma>>;
  taskId: string;
  estimatedEffortHours: number | null;
  impact: Record<string, unknown> | null;
  sourceUrls: string[];
}) {
  const impact = input.impact;
  if (!impact) return null;

  const hasMeaningfulImpact = Object.values(impact).some(
    (value) => typeof value === "number" && value !== 0,
  );
  if (!hasMeaningfulImpact) return null;
  const taskImpact =
    await import("./parameters/task-impact-calculation.server");
  const expectedValuePerHourUsd = parseFiniteNumber(
    impact.expectedValuePerHourUsd,
  );
  const expectedEconomicValueUsdBase =
    parseFiniteNumber(impact.expectedEconomicValueUsdBase) ??
    (input.estimatedEffortHours == null || expectedValuePerHourUsd == null
      ? null
      : expectedValuePerHourUsd * input.estimatedEffortHours);
  return taskImpact.createDirectTaskImpact(
    {
      assumptions: asStringArray(impact.assumptions),
      calculationVersion: "mcp-proposal-v2",
      estimateNotes: "Created with the MCP task proposal.",
      frame: {
        adoptionRampYears: 0,
        annualDiscountRate: 0.03,
        benefitDurationYears: 20,
        delayDalysLostPerDayBase: parseFiniteNumber(
          impact.delayDalysLostPerDay,
        ),
        delayEconomicValueUsdLostPerDayBase: parseFiniteNumber(
          impact.delayEconomicValueUsdLostPerDay,
        ),
        estimatedCashCostUsdBase: parseFiniteNumber(
          impact.estimatedCashCostUsdBase,
        ),
        estimatedCashCostUsdHigh: parseFiniteNumber(
          impact.estimatedCashCostUsdHigh,
        ),
        estimatedCashCostUsdLow: parseFiniteNumber(
          impact.estimatedCashCostUsdLow,
        ),
        estimatedEffortHoursBase: input.estimatedEffortHours,
        evaluationHorizonYears: 20,
        expectedDalysAvertedBase: parseFiniteNumber(
          impact.expectedDalysAvertedBase,
        ),
        expectedDalysAvertedHigh: parseFiniteNumber(
          impact.expectedDalysAvertedHigh,
        ),
        expectedDalysAvertedLow: parseFiniteNumber(
          impact.expectedDalysAvertedLow,
        ),
        expectedEconomicValueUsdBase,
        expectedEconomicValueUsdHigh: parseFiniteNumber(
          impact.expectedEconomicValueUsdHigh,
        ),
        expectedEconomicValueUsdLow: parseFiniteNumber(
          impact.expectedEconomicValueUsdLow,
        ),
        medianHealthyLifeYearsEffectBase: parseFiniteNumber(
          impact.medianHealthyLifeYearsEffectBase,
        ),
        medianHealthyLifeYearsEffectHigh: parseFiniteNumber(
          impact.medianHealthyLifeYearsEffectHigh,
        ),
        medianHealthyLifeYearsEffectLow: parseFiniteNumber(
          impact.medianHealthyLifeYearsEffectLow,
        ),
        medianIncomeGrowthEffectPpPerYearBase: parseFiniteNumber(
          impact.medianIncomeGrowthEffectPpPerYearBase,
        ),
        medianIncomeGrowthEffectPpPerYearHigh: parseFiniteNumber(
          impact.medianIncomeGrowthEffectPpPerYearHigh,
        ),
        medianIncomeGrowthEffectPpPerYearLow: parseFiniteNumber(
          impact.medianIncomeGrowthEffectPpPerYearLow,
        ),
        successProbabilityBase: parseFiniteNumber(
          impact.successProbabilityBase,
        ),
        successProbabilityHigh: parseFiniteNumber(
          impact.successProbabilityHigh,
        ),
        successProbabilityLow: parseFiniteNumber(impact.successProbabilityLow),
        timeToImpactStartDays: 0,
      },
      frameKey: TaskImpactFrameKey.TWENTY_YEAR,
      sourceUrls: input.sourceUrls,
      taskId: input.taskId,
    },
    input.actor,
    { publish: false },
    input.prisma,
  );
}

function normalizeProposalCandidate(
  candidate: Record<string, unknown>,
): Record<string, unknown> {
  if (Object.hasOwn(candidate, "kind")) {
    throw new Error(
      "Task kind is not supported; represent objectives, projects, and workflows through parentTaskRef ancestry.",
    );
  }
  const candidateFields = { ...candidate };
  const source = asObject(candidate.source);
  const sourceSystem =
    typeof source?.sourceSystem === "string"
      ? source.sourceSystem.trim().toLowerCase()
      : null;
  const sourceKey =
    typeof source?.sourceKey === "string" ? source.sourceKey.trim() : null;
  const sourceUrl =
    typeof source?.sourceUrl === "string" ? source.sourceUrl.trim() : null;
  const dependencies = Array.isArray(candidate.dependencies)
    ? (candidate.dependencies as Array<Record<string, unknown>>)
    : [];
  const blockerRefs = dedupeStrings([
    ...asStringArray(candidate.blockerRefs),
    ...dependencies
      .map((dependency) => dependency.taskRef)
      .filter((value): value is string => typeof value === "string"),
  ]);
  const sourceUrls = dedupeStrings([
    ...asStringArray(candidate.sourceUrls),
    ...(sourceUrl ? [sourceUrl] : []),
  ]);
  const normalizedSource =
    source && sourceSystem && sourceKey
      ? {
          ...source,
          sourceHash:
            typeof source.sourceHash === "string" && source.sourceHash.trim()
              ? source.sourceHash.trim()
              : createHash("sha256")
                  .update(
                    JSON.stringify({
                      acceptanceCriteria: candidate.acceptanceCriteria ?? [],
                      description: candidate.description ?? null,
                      sourceKey,
                      sourceSystem,
                      title: candidate.title ?? null,
                    }),
                  )
                  .digest("hex"),
          sourceKey,
          sourceSystem,
          sourceUrl,
        }
      : null;
  const generatedTaskKey =
    normalizedSource && !candidate.taskKey
      ? `planner-source:${createHash("sha256")
          .update(`${sourceSystem}:${sourceKey}`)
          .digest("hex")
          .slice(0, 32)}`
      : candidate.taskKey;

  return {
    ...candidateFields,
    blockerRefs,
    dependencies,
    isPublic: candidate.isPublic === true,
    source: normalizedSource,
    sourceUrls,
    taskKey: generatedTaskKey,
  };
}

async function ensureExecutionPlanningBranch(input: {
  organizationId?: string | null;
  personId?: string | null;
  prisma: Awaited<ReturnType<typeof getPrisma>>;
  userId: string;
}) {
  const root = await input.prisma.task.findFirst({
    where: {
      deletedAt: null,
      id: OPTIMIZE_EARTH_ROOT_TASK_ID,
    },
    select: { id: true },
  });
  if (!root) {
    throw new Error(
      "Optimize Earth root is missing. Run managed task sync before proposing planning tasks.",
    );
  }

  const organizationId = input.organizationId;
  const target = organizationId
    ? await (async () => {
        const organization = await input.prisma.organization.findFirst({
          where: {
            deletedAt: null,
            id: organizationId,
            members: {
              some: {
                role: {
                  in: [
                    OrganizationMemberRole.OWNER,
                    OrganizationMemberRole.ADMIN,
                    OrganizationMemberRole.MEMBER,
                  ],
                },
                userId: input.userId,
              },
            },
          },
          select: { id: true, name: true },
        });
        if (!organization) {
          throw new Error(
            "Organization planning requires OWNER, ADMIN, or MEMBER access.",
          );
        }
        return {
          description: `Private work root for ${organization.name}.`,
          organizationId: organization.id,
          personId: null,
          taskKey: getOrganizationPlanningRootTaskKey(organization.id),
          title: `Optimize ${organization.name}`,
        };
      })()
    : await (async () => {
        const { ensurePersonForUser } = await import("./person.server");
        const person = await ensurePersonForUser(
          input.userId,
          {},
          input.prisma,
        );
        if (input.personId && input.personId !== person.id) {
          throw new Error("Personal planning root must belong to the caller.");
        }
        return {
          description: `Private work root for ${person.displayName}.`,
          organizationId: null,
          personId: person.id,
          taskKey: getPersonPlanningRootTaskKey(person.id),
          title: `Optimize ${person.displayName}'s life`,
        };
      })();

  const taskKey = target.taskKey;

  const branchSelect = {
    assigneeOrganizationId: true,
    assigneePersonId: true,
    createdByUserId: true,
    id: true,
    isPublic: true,
    ownerOrganizationId: true,
    parentTaskId: true,
    taskKey: true,
  } as const;
  const validateAndRepairBranch = async (branch: {
    assigneeOrganizationId: string | null;
    assigneePersonId: string | null;
    createdByUserId: string;
    id: string;
    isPublic: boolean;
    ownerOrganizationId: string | null;
    parentTaskId: string | null;
    taskKey: string | null;
  }) => {
    const matchesTarget = target.organizationId
      ? branch.assigneeOrganizationId === target.organizationId ||
        branch.ownerOrganizationId === target.organizationId
      : branch.assigneePersonId === target.personId &&
        branch.createdByUserId === input.userId;
    if (branch.parentTaskId !== root.id || branch.isPublic || !matchesTarget) {
      throw new Error(
        `Reserved execution planning branch ${taskKey} is not private, rooted, and assigned to the expected target.`,
      );
    }
    return input.prisma.task.update({
      where: { id: branch.id },
      data: {
        assigneeOrganizationId: null,
        assigneePersonId: target.personId,
        claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
        deletedAt: null,
        description: target.description,
        isPublic: false,
        ownerOrganizationId: target.organizationId,
        parentTaskId: root.id,
        status: TaskStatus.ACTIVE,
        title: target.title,
      },
      select: { id: true, taskKey: true, title: true },
    });
  };
  const existing = await input.prisma.task.findFirst({
    where: { deletedAt: null, taskKey },
    select: branchSelect,
  });
  if (existing) return validateAndRepairBranch(existing);

  try {
    return await input.prisma.task.create({
      data: {
        assigneeOrganizationId: null,
        assigneePersonId: target.personId,
        category: TaskCategory.OTHER,
        claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
        createdByUserId: input.userId,
        description: target.description,
        isPublic: false,
        ownerOrganizationId: target.organizationId,
        parentTaskId: root.id,
        status: TaskStatus.ACTIVE,
        taskKey,
        title: target.title,
      },
      select: { id: true, taskKey: true, title: true },
    });
  } catch (error) {
    if (asObject(error)?.code !== "P2002") throw error;
    const racedBranch = await input.prisma.task.findFirst({
      where: { deletedAt: null, taskKey },
      select: branchSelect,
    });
    if (racedBranch) return validateAndRepairBranch(racedBranch);
    throw error;
  }
}

function getPlannerSourceArtifactKey(source: Record<string, unknown> | null) {
  if (!source) return null;
  const sourceKey = String(source.sourceKey ?? "").trim();
  const sourceSystemLabel = String(source.sourceSystem ?? "external")
    .trim()
    .toLowerCase();
  return sourceKey && sourceSystemLabel
    ? `planner:${sourceSystemLabel}:${sourceKey}`
    : null;
}

async function attachProposalSourceArtifact(input: {
  prisma: Awaited<ReturnType<typeof getPrisma>>;
  source: Record<string, unknown> | null;
  taskId: string;
}) {
  if (!input.source) return null;
  const sourceKey = String(input.source.sourceKey ?? "").trim();
  const sourceSystemLabel = String(
    input.source.sourceSystem ?? "external",
  ).trim();
  if (!sourceKey || !sourceSystemLabel) return null;
  const sourceSystem = Object.values(SourceSystem).includes(
    sourceSystemLabel.toUpperCase() as SourceSystem,
  )
    ? (sourceSystemLabel.toUpperCase() as SourceSystem)
    : SourceSystem.EXTERNAL;
  const namespacedSourceKey = getPlannerSourceArtifactKey(input.source);
  if (!namespacedSourceKey) return null;
  const artifact = await input.prisma.sourceArtifact.upsert({
    where: { sourceKey: namespacedSourceKey },
    create: {
      artifactType: SourceArtifactType.EXTERNAL_SOURCE,
      contentHash: (input.source.sourceHash as string) ?? null,
      externalKey: sourceKey,
      payloadJson: {
        importedForExecutionPlanning: true,
        sourceSystemLabel,
      },
      sourceKey: namespacedSourceKey,
      sourceRef: sourceKey,
      sourceSystem,
      sourceUrl: (input.source.sourceUrl as string) ?? null,
      title: (input.source.title as string) ?? null,
    },
    update: {
      contentHash: (input.source.sourceHash as string) ?? null,
      deletedAt: null,
      sourceUrl: (input.source.sourceUrl as string) ?? null,
      title: (input.source.title as string) ?? null,
    },
  });
  await input.prisma.taskSourceArtifact.upsert({
    where: {
      taskId_sourceArtifactId: {
        sourceArtifactId: artifact.id,
        taskId: input.taskId,
      },
    },
    create: {
      isPrimary: true,
      sourceArtifactId: artifact.id,
      taskId: input.taskId,
    },
    update: { deletedAt: null, isPrimary: true },
  });
  return artifact;
}

async function attachDirectTaskImpactEstimate(input: {
  actor: { isAdmin: boolean; userId: string };
  prisma: Prisma.TransactionClient;
  publish: boolean;
  taskId: string;
  estimatedEffortHours: number;
  estimatedCashCostUsdBase: number;
  expectedEconomicValueUsdBase: number;
  successProbabilityBase: number;
  timeToImpactStartDays: number;
}) {
  const taskImpact =
    await import("./parameters/task-impact-calculation.server");
  return taskImpact.createDirectTaskImpactInTransaction(
    {
      assumptions: ["Values supplied through MCP task creation or update."],
      calculationVersion: "mcp-direct-v2",
      frame: {
        adoptionRampYears: 0,
        annualDiscountRate: 0.03,
        benefitDurationYears: 5,
        estimatedCashCostUsdBase: input.estimatedCashCostUsdBase,
        estimatedEffortHoursBase: input.estimatedEffortHours,
        evaluationHorizonYears: 5,
        expectedEconomicValueUsdBase: input.expectedEconomicValueUsdBase,
        successProbabilityBase: input.successProbabilityBase,
        timeToImpactStartDays: input.timeToImpactStartDays,
      },
      frameKey: TaskImpactFrameKey.FIVE_YEAR,
      taskId: input.taskId,
    },
    input.actor,
    { publish: input.publish },
    input.prisma,
  );
}

enum TaskVisibility {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}

type DeadlinePolicy = "NONE" | "SOFT" | "EXPIRES" | "REQUIRED";

function parsePositiveNumber(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  if (value <= 0) return fallback;
  return value;
}

function parseFiniteNumber(value: unknown, fallback?: number) {
  if (typeof value !== "number" || !Number.isFinite(value))
    return fallback ?? null;
  return value;
}

function formatTaskVisibility(isPublic: unknown) {
  if (isPublic === true) return TaskVisibility.PUBLIC;
  if (isPublic === false) return TaskVisibility.PRIVATE;
  return undefined;
}

function parseTaskVisibility(value: unknown) {
  if (value == null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new Error(
      `visibility must be ${TaskVisibility.PUBLIC} or ${TaskVisibility.PRIVATE}.`,
    );
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === TaskVisibility.PUBLIC) return true;
  if (normalized === TaskVisibility.PRIVATE) return false;
  throw new Error(
    `visibility must be ${TaskVisibility.PUBLIC} or ${TaskVisibility.PRIVATE}.`,
  );
}

function resolveCreateTaskIsPublic(
  input: Record<string, unknown>,
  assigneeOrganizationId: string | undefined,
  hasAdminAccess: boolean,
) {
  const visibilityOverride = parseTaskVisibility(input.visibility);
  if (visibilityOverride !== undefined) return visibilityOverride;
  if (typeof input.isPublic === "boolean") return input.isPublic;
  // Org-assigned tasks default public for admin scope (intentional for
  // public-facing campaigns: leader/president/treaty-activation tasks).
  // Non-admin scope defaults private — Wishonia and other agents creating
  // outreach to organizations should not silently expose those tasks to
  // the public feed; the recipient still gets the email and can act on it.
  return hasAdminAccess && Boolean(assigneeOrganizationId);
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
  if (
    normalized === "ai" ||
    normalized === "agent" ||
    normalized === "ai agent"
  ) {
    return AI_EXECUTOR_TYPE;
  }
  if (normalized === "self") return "Self";
  return value.trim() || "Self";
}

function normalizeDeadlinePolicy(
  value: unknown,
  fallback: DeadlinePolicy = "NONE",
): DeadlinePolicy {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "required" ||
    normalized === "hard" ||
    normalized === "must" ||
    normalized === "must_do" ||
    normalized === "must-do"
  ) {
    return "REQUIRED";
  }
  if (
    normalized === "expires" ||
    normalized === "expire" ||
    normalized === "expiring"
  )
    return "EXPIRES";
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

function getTaskContext(
  task: PersonalQueueTaskRecord | Record<string, unknown>,
) {
  return asObject(task.contextJson) ?? {};
}

function getTaskExecutorType(
  task: PersonalQueueTaskRecord | Record<string, unknown>,
) {
  const context = getTaskContext(task);
  return normalizeExecutorType(context.executor_type ?? context.executorType);
}

function normalizeAcceptanceCriteria(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function extractAcceptanceCriteriaFromDescription(
  description: unknown,
): string[] {
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

    const bulletMatch = trimmed.match(
      /^(?:[-*+]\s+(?:\[[ xX]\]\s*)?|\d+[.)]\s+)(.+)$/,
    );
    if (!bulletMatch?.[1]) {
      continue;
    }

    const criterion = bulletMatch[1].replace(/\s+/g, " ").trim();
    if (criterion) criteria.push(criterion);
  }

  return criteria;
}

function mergeAcceptanceCriteriaIntoContext(
  context: Record<string, unknown>,
  description: unknown,
  explicitCriteria?: unknown,
) {
  const existingCriteria = normalizeAcceptanceCriteria(
    context.acceptanceCriteria,
  );
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

async function validateExplicitTaskParent(input: {
  parentTaskId: string;
  prisma: Awaited<ReturnType<typeof getPrisma>>;
  taskId?: string;
  userId: string;
}) {
  if (input.parentTaskId === OPTIMIZE_EARTH_ROOT_TASK_ID) {
    throw new Error(
      "Optimize Earth is reserved for managed top-level branches. Choose the closest existing objective or task instead.",
    );
  }

  const parent = await input.prisma.task.findFirst({
    where: {
      deletedAt: null,
      id: input.parentTaskId,
      ...getTaskAccessWhere({ action: "COMMENT", userId: input.userId }),
    },
    select: {
      assigneeOrganizationId: true,
      assigneePersonId: true,
      createdByUserId: true,
      id: true,
      isPublic: true,
      ownerOrganizationId: true,
      parentTaskId: true,
    },
  });
  if (!parent) {
    throw new Error(
      `Parent task ${JSON.stringify(input.parentTaskId)} was not found. Search the existing task tree and choose a valid parent.`,
    );
  }
  if (input.taskId === parent.id) {
    throw new Error("A task cannot be its own parent.");
  }

  if (parent.parentTaskId === OPTIMIZE_EARTH_ROOT_TASK_ID) {
    return parent;
  }

  const graph = await loadExecutionGraphContext([
    parent as unknown as PersonalQueueTaskRecord,
  ]);
  if (
    input.taskId &&
    graph.graphTasks.some((task) => task.id === input.taskId)
  ) {
    throw new Error("Reparenting would create a task hierarchy cycle.");
  }
  if (!graph.rootedTaskIds.has(parent.id)) {
    throw new Error(
      "The selected parent is not rooted under Optimize Earth. Choose a rooted parent task.",
    );
  }

  return parent;
}

async function loadReachableDependencyEdges(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
  seedTaskIds: string[],
) {
  const visitedSourceIds = new Set<string>();
  const edgeByKey = new Map<string, ExecutionGraphEdge>();
  let frontier = Array.from(new Set(seedTaskIds.filter(Boolean)));

  while (frontier.length > 0) {
    const sourceTaskIds = frontier.filter(
      (taskId) => !visitedSourceIds.has(taskId),
    );
    if (sourceTaskIds.length === 0) break;
    for (const taskId of sourceTaskIds) visitedSourceIds.add(taskId);

    const edges = await prisma.taskEdge.findMany({
      where: {
        deletedAt: null,
        edgeType: {
          in: [TaskEdgeType.BLOCKS, TaskEdgeType.DEPENDS_ON],
        },
        fromTaskId: { in: sourceTaskIds },
      },
      select: {
        edgeType: true,
        fromTaskId: true,
        probabilityDeltaBase: true,
        timeDeltaDaysBase: true,
        toTaskId: true,
      },
    });
    const nextTaskIds = new Set<string>();
    for (const edge of edges) {
      edgeByKey.set(
        `${edge.edgeType}:${edge.fromTaskId}:${edge.toTaskId}`,
        edge,
      );
      if (!visitedSourceIds.has(edge.toTaskId)) {
        nextTaskIds.add(edge.toTaskId);
      }
    }
    frontier = Array.from(nextTaskIds);
  }

  return Array.from(edgeByKey.values());
}

function resolveTaskEconomics(
  args: Record<string, unknown>,
  existing?: {
    contextJson?: unknown;
    estimatedEffortHours?: number | null;
    selectedImpactFrame?: unknown;
  },
) {
  const existingContext = asObject(existing?.contextJson) ?? {};
  const existingFrame = asObject(existing?.selectedImpactFrame);
  // Default 0.5 — neutral coin-flip — when no probability is supplied. The
  // previous default was 1.0 which silently inflated EV for any task that
  // omitted p_success; ranking treated those tasks as guaranteed successes.
  const pSuccess =
    firstFiniteNumber(
      [
        args.p_success,
        args.pSuccess,
        args.successProbabilityBase,
        existingContext.p_success,
        existingContext.pSuccess,
        existingFrame?.successProbabilityBase,
      ],
      0.5,
    ) ?? 0.5;
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
      ? (firstFiniteNumber([existingFrame?.expectedEconomicValueUsdBase], 0) ??
        0)
      : grossValue * normalizedPSuccess);
  const estimatedEffortHours =
    firstFiniteNumber(
      [
        args.hours,
        args.estimatedEffortHours,
        existing?.estimatedEffortHours,
        existingFrame?.estimatedEffortHoursBase,
        existingContext.hours,
      ],
      1,
    ) ?? 1;
  const estimatedCashCostUsdBase =
    firstFiniteNumber(
      [
        args.cash_cost,
        args.cashCost,
        args.estimatedCashCostUsdBase,
        existingContext.cash_cost,
        existingContext.cashCost,
        existingFrame?.estimatedCashCostUsdBase,
      ],
      0,
    ) ?? 0;
  const timeToImpactStartDays =
    firstFiniteNumber(
      [args.timeToImpactStartDays, existingFrame?.timeToImpactStartDays],
      0,
    ) ?? 0;

  return {
    estimatedCashCostUsdBase: Math.max(0, estimatedCashCostUsdBase),
    estimatedEffortHours: Math.max(estimatedEffortHours, 0),
    expectedEconomicValueUsdBase,
    grossValue,
    pSuccess: normalizedPSuccess,
    timeToImpactStartDays: Math.max(0, timeToImpactStartDays),
  };
}

function buildPersonalTaskContext(
  args: Record<string, unknown>,
  economics: ReturnType<typeof resolveTaskEconomics>,
  baseContextJson?: unknown,
) {
  const contextPatch: Record<string, unknown> = {};
  const providedContext = asObject(args.contextJson) ?? {};
  if (
    args.executor_type !== undefined ||
    args.executorType !== undefined ||
    baseContextJson == null
  ) {
    contextPatch.executor_type = normalizeExecutorType(
      args.executor_type ?? args.executorType,
    );
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
  if (
    args.deadline_rationale !== undefined ||
    args.deadlineRationale !== undefined
  ) {
    contextPatch.deadline_rationale = (args.deadline_rationale ??
      args.deadlineRationale) as string;
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
    sourceUrl:
      args.sourceUrl !== undefined ? (args.sourceUrl as string) || null : null,
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
  bodyMarkdown: true,
  contentHash: true,
  description: true,
  id: true,
  jurisdictionId: true,
  kind: true,
  lockedAt: true,
  publishedAt: true,
  question: true,
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

function parseReferendumKind(value: unknown, fallback: ReferendumKind) {
  const normalized = optionalString(value)?.toUpperCase();
  if (!normalized) return fallback;
  return ReferendumKind[normalized as keyof typeof ReferendumKind] ?? null;
}

function buildReferendumContentHash(input: {
  question: string;
  description?: string | null;
  bodyMarkdown?: string | null;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        question: input.question.trim(),
        description: optionalString(input.description),
        bodyMarkdown: optionalString(input.bodyMarkdown),
      }),
    )
    .digest("hex");
}

function referendumPath(slug: string) {
  return `/agencies/dcongress/referendums/${slug}`;
}

function summarizeReferendum(referendum: ReferendumToolRecord) {
  return {
    createdAt: referendum.createdAt.toISOString(),
    bodyMarkdown: referendum.bodyMarkdown,
    contentHash: referendum.contentHash,
    createdByUserId: referendum.createdByUserId,
    description: referendum.description,
    id: referendum.id,
    jurisdictionId: referendum.jurisdictionId,
    kind: referendum.kind,
    lockedAt: referendum.lockedAt?.toISOString() ?? null,
    organizationPositionCount: referendum._count.organizationPositions,
    path: referendumPath(referendum.slug),
    publishedAt: referendum.publishedAt?.toISOString() ?? null,
    question: referendum.question,
    slug: referendum.slug,
    status: referendum.status,
    surveyCount: referendum._count.surveys,
    title: referendum.title,
    updatedAt: referendum.updatedAt.toISOString(),
    voteCount: referendum._count.votes,
  };
}

type AppPrismaClient = Awaited<ReturnType<typeof getPrisma>>;
type TrackingDbClient = Prisma.TransactionClient | AppPrismaClient;

const TRACKING_UNIT_SELECT = {
  abbreviatedName: true,
  id: true,
  name: true,
  ucumCode: true,
} satisfies Prisma.UnitSelect;

const TRACKING_VARIABLE_SELECT = {
  defaultUnit: { select: TRACKING_UNIT_SELECT },
  defaultUnitId: true,
  id: true,
  name: true,
  variableCategory: { select: { id: true, name: true } },
  variableCategoryId: true,
} satisfies Prisma.GlobalVariableSelect;

const TRACKING_REMINDER_INCLUDE = {
  globalVariable: { select: TRACKING_VARIABLE_SELECT },
  nOf1Variable: {
    select: {
      defaultUnitId: true,
      fillingType: true,
      id: true,
    },
  },
} satisfies Prisma.TrackingReminderInclude;

interface TrackingVariableArgs {
  categoryName?: string | null;
  combinationOperation?: CombinationOperation;
  fillingType?: FillingType;
  globalVariableId?: string | null;
  unitAbbreviation?: string | null;
  unitId?: string | null;
  unitName?: string | null;
  variableName?: string | null;
}

interface RecordTrackingMeasurementArgs extends TrackingVariableArgs {
  duration?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  note?: string | null;
  sourceName?: string | null;
  startTime?: Date | null;
  userId: string;
  value: number;
}

function parseOptionalDateValue(value: unknown, fieldName: string) {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    if (!Number.isNaN(value.getTime())) return value;
    throw new Error(`${fieldName} must be a valid date.`);
  }
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be an ISO date string.`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid date.`);
  }
  return date;
}

function parseRequiredFiniteNumber(value: unknown, fieldName: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number.`);
  }
  return value;
}

function parseOptionalNonnegativeInteger(value: unknown, fieldName: string) {
  if (value == null || value === "") return null;
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(`${fieldName} must be a non-negative integer.`);
  }
  return value;
}

function parsePositiveInteger(
  value: unknown,
  fieldName: string,
  fallback: number,
) {
  if (value == null || value === "") return fallback;
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
  return value;
}

function parseTimeOfDay(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} must be HH:mm local time.`);
  }
  const normalized = value.trim();
  if (!/^\d{1,2}:\d{2}$/.test(normalized)) {
    throw new Error(`${fieldName} must be HH:mm local time.`);
  }
  const [rawHours, rawMinutes] = normalized.split(":");
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(`${fieldName} must be HH:mm local time.`);
  }
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

function parseOptionalTimeOfDay(value: unknown, fieldName: string) {
  if (value == null || value === "") return null;
  return parseTimeOfDay(value, fieldName);
}

function parseDateKey(value: unknown, fallback = dateKeyFromDate(new Date())) {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    throw new Error("dateKey must use YYYY-MM-DD.");
  }
  return value.trim();
}

function dateKeyFromDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dayRange(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return {
    end: new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0)),
    start: new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)),
  };
}

function reminderNotifyAt(dateKey: string, reminderStartTime: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hours, minutes] = reminderStartTime.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
}

function cleanNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseTrackingVariableArgs(
  input: Record<string, unknown>,
): TrackingVariableArgs {
  return {
    categoryName: optionalString(input.categoryName),
    combinationOperation: parseEnumInput(
      CombinationOperation,
      input.combinationOperation,
      "combinationOperation",
    ),
    fillingType: parseEnumInput(FillingType, input.fillingType, "fillingType"),
    globalVariableId: optionalString(input.globalVariableId),
    unitAbbreviation: optionalString(input.unitAbbreviation),
    unitId: optionalString(input.unitId),
    unitName: optionalString(input.unitName),
    variableName: optionalString(input.variableName),
  };
}

async function resolveTrackingUnit(
  db: TrackingDbClient,
  input: Pick<TrackingVariableArgs, "unitAbbreviation" | "unitId" | "unitName">,
) {
  if (input.unitId) {
    return db.unit.findFirst({
      select: TRACKING_UNIT_SELECT,
      where: { deletedAt: null, id: input.unitId },
    });
  }
  if (input.unitAbbreviation) {
    return db.unit.findFirst({
      select: TRACKING_UNIT_SELECT,
      where: { abbreviatedName: input.unitAbbreviation, deletedAt: null },
    });
  }
  if (input.unitName) {
    return db.unit.findFirst({
      select: TRACKING_UNIT_SELECT,
      where: { deletedAt: null, name: input.unitName },
    });
  }
  return null;
}

async function resolveTrackingVariable(
  db: TrackingDbClient,
  input: TrackingVariableArgs,
  defaultCategoryName: string,
) {
  if (input.globalVariableId) {
    const variable = await db.globalVariable.findFirst({
      select: TRACKING_VARIABLE_SELECT,
      where: { deletedAt: null, id: input.globalVariableId },
    });
    if (!variable) {
      throw new Error(`GlobalVariable not found: ${input.globalVariableId}`);
    }
    const requestedUnit = await resolveTrackingUnit(db, input);
    if (
      (input.unitAbbreviation || input.unitId || input.unitName) &&
      !requestedUnit
    ) {
      throw new Error("Requested unit was not found.");
    }
    return { unit: requestedUnit ?? variable.defaultUnit, variable };
  }

  if (!input.variableName) {
    throw new Error("Provide globalVariableId or variableName.");
  }

  const existing = await db.globalVariable.findFirst({
    select: TRACKING_VARIABLE_SELECT,
    where: { deletedAt: null, name: input.variableName },
  });
  if (existing) {
    const requestedUnit = await resolveTrackingUnit(db, input);
    if (
      (input.unitAbbreviation || input.unitId || input.unitName) &&
      !requestedUnit
    ) {
      throw new Error("Requested unit was not found.");
    }
    return { unit: requestedUnit ?? existing.defaultUnit, variable: existing };
  }

  const categoryName = input.categoryName ?? defaultCategoryName;
  const category = await db.variableCategory.findFirst({
    select: {
      combinationOperation: true,
      defaultUnit: { select: TRACKING_UNIT_SELECT },
      defaultUnitId: true,
      durationOfAction: true,
      id: true,
      name: true,
      onsetDelay: true,
      outcome: true,
      predictorOnly: true,
    },
    where: { deletedAt: null, name: categoryName },
  });
  if (!category?.defaultUnitId) {
    throw new Error(
      `Variable category is not seeded or has no default unit: ${categoryName}`,
    );
  }

  const requestedUnit = await resolveTrackingUnit(db, input);
  if (
    (input.unitAbbreviation || input.unitId || input.unitName) &&
    !requestedUnit
  ) {
    throw new Error("Requested unit was not found.");
  }
  const unit = requestedUnit ?? category.defaultUnit;
  if (!unit) {
    throw new Error(`No unit available for variable category: ${categoryName}`);
  }

  const variable = await db.globalVariable.upsert({
    create: {
      combinationOperation:
        input.combinationOperation ?? category.combinationOperation,
      defaultUnitId: unit.id,
      durationOfAction: category.durationOfAction,
      fillingType: input.fillingType ?? FillingType.NONE,
      name: input.variableName,
      onsetDelay: category.onsetDelay,
      outcome: category.outcome,
      predictorOnly: category.predictorOnly,
      variableCategoryId: category.id,
    },
    select: TRACKING_VARIABLE_SELECT,
    update: {
      deletedAt: null,
    },
    where: { name: input.variableName },
  });

  return { unit, variable };
}

async function trackingUserSubject(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const user = await tx.user.findUniqueOrThrow({
    select: { email: true, id: true, personId: true },
    where: { id: userId },
  });
  return ensureSubjectForUser(tx, user);
}

async function ensureTrackingNOf1Variable(
  db: TrackingDbClient,
  input: {
    defaultUnitId: string;
    fillingType?: FillingType;
    globalVariableId: string;
    subjectId: string;
  },
) {
  return db.nOf1Variable.upsert({
    create: {
      defaultUnitId: input.defaultUnitId,
      fillingType: input.fillingType ?? FillingType.NONE,
      globalVariableId: input.globalVariableId,
      subjectId: input.subjectId,
    },
    update: {
      defaultUnitId: input.defaultUnitId,
      ...(input.fillingType ? { fillingType: input.fillingType } : {}),
    },
    where: {
      subjectId_globalVariableId: {
        globalVariableId: input.globalVariableId,
        subjectId: input.subjectId,
      },
    },
  });
}

async function recordTrackingMeasurementWithTx(
  tx: Prisma.TransactionClient,
  input: RecordTrackingMeasurementArgs,
) {
  const subject = await trackingUserSubject(tx, input.userId);
  const { unit, variable } = await resolveTrackingVariable(
    tx,
    input,
    input.categoryName ?? "Symptom",
  );
  const nOf1Variable = await ensureTrackingNOf1Variable(tx, {
    defaultUnitId: unit.id,
    fillingType: input.fillingType,
    globalVariableId: variable.id,
    subjectId: subject.id,
  });
  const startTime = input.startTime ?? new Date();
  const measurement = await tx.measurement.upsert({
    create: {
      duration: input.duration,
      globalVariableId: variable.id,
      latitude: input.latitude,
      longitude: input.longitude,
      nOf1VariableId: nOf1Variable.id,
      note: input.note,
      originalUnitId: unit.id,
      originalValue: input.value,
      recordedByUserId: input.userId,
      sourceName: input.sourceName ?? "mcp",
      startTime,
      subjectId: subject.id,
      unitId: unit.id,
      value: input.value,
    },
    update: {
      duration: input.duration,
      latitude: input.latitude,
      longitude: input.longitude,
      note: input.note,
      originalUnitId: unit.id,
      originalValue: input.value,
      recordedByUserId: input.userId,
      sourceName: input.sourceName ?? "mcp",
      unitId: unit.id,
      value: input.value,
    },
    where: {
      subjectId_globalVariableId_startTime: {
        globalVariableId: variable.id,
        startTime,
        subjectId: subject.id,
      },
    },
  });
  return {
    globalVariable: variable,
    measurement,
    nOf1Variable,
    subjectId: subject.id,
  };
}

async function recordTrackingMeasurement(
  input: Record<string, unknown>,
  userId: string,
) {
  const value = parseRequiredFiniteNumber(input.value, "value");
  const prisma = await getPrisma();
  return prisma.$transaction((tx) =>
    recordTrackingMeasurementWithTx(tx, {
      ...parseTrackingVariableArgs(input),
      duration: parseOptionalNonnegativeInteger(input.duration, "duration"),
      latitude: parseOptionalFiniteNumberInput(input, "latitude") ?? null,
      longitude: parseOptionalFiniteNumberInput(input, "longitude") ?? null,
      note: optionalString(input.note),
      sourceName: optionalString(input.sourceName),
      startTime: parseOptionalDateValue(input.startTime, "startTime"),
      userId,
      value,
    }),
  );
}

async function upsertTrackingReminderForUser(
  input: Record<string, unknown>,
  userId: string,
) {
  const reminderStartTime = parseTimeOfDay(
    input.reminderStartTime,
    "reminderStartTime",
  );
  const reminderFrequency = parsePositiveInteger(
    input.reminderFrequency,
    "reminderFrequency",
    86_400,
  );
  const prisma = await getPrisma();
  return prisma.$transaction(async (tx) => {
    const subject = await trackingUserSubject(tx, userId);
    const variableArgs = parseTrackingVariableArgs(input);
    const { unit, variable } = await resolveTrackingVariable(
      tx,
      variableArgs,
      variableArgs.categoryName ?? "Treatment",
    );
    const nOf1Variable = await ensureTrackingNOf1Variable(tx, {
      defaultUnitId: unit.id,
      fillingType: variableArgs.fillingType,
      globalVariableId: variable.id,
      subjectId: subject.id,
    });
    const reminder = await tx.trackingReminder.upsert({
      create: {
        active: typeof input.active === "boolean" ? input.active : true,
        defaultValue:
          parseOptionalFiniteNumberInput(input, "defaultValue") ?? null,
        globalVariableId: variable.id,
        instructions: optionalString(input.instructions),
        nOf1VariableId: nOf1Variable.id,
        reminderEndTime: parseOptionalTimeOfDay(
          input.reminderEndTime,
          "reminderEndTime",
        ),
        reminderFrequency,
        reminderStartTime,
        startTrackingDate: parseOptionalDateValue(
          input.startTrackingDate,
          "startTrackingDate",
        ),
        stopTrackingDate: parseOptionalDateValue(
          input.stopTrackingDate,
          "stopTrackingDate",
        ),
        userId,
      },
      include: TRACKING_REMINDER_INCLUDE,
      update: {
        active: typeof input.active === "boolean" ? input.active : true,
        defaultValue:
          parseOptionalFiniteNumberInput(input, "defaultValue") ?? null,
        deletedAt: null,
        instructions: optionalString(input.instructions),
        nOf1VariableId: nOf1Variable.id,
        reminderEndTime: parseOptionalTimeOfDay(
          input.reminderEndTime,
          "reminderEndTime",
        ),
        startTrackingDate: parseOptionalDateValue(
          input.startTrackingDate,
          "startTrackingDate",
        ),
        stopTrackingDate: parseOptionalDateValue(
          input.stopTrackingDate,
          "stopTrackingDate",
        ),
      },
      where: {
        userId_globalVariableId_reminderStartTime_reminderFrequency: {
          globalVariableId: variable.id,
          reminderFrequency,
          reminderStartTime,
          userId,
        },
      },
    });
    return { reminder, subjectId: subject.id };
  });
}

async function listTrackingRemindersForUser(
  input: Record<string, unknown>,
  userId: string,
) {
  const prisma = await getPrisma();
  return prisma.trackingReminder.findMany({
    include: TRACKING_REMINDER_INCLUDE,
    orderBy: [{ active: "desc" }, { reminderStartTime: "asc" }],
    where: {
      deletedAt: null,
      userId,
      ...(input.includeInactive === true ? {} : { active: true }),
    },
  });
}

async function listDueTrackingRemindersForUser(
  input: Record<string, unknown>,
  userId: string,
) {
  const dateKey = parseDateKey(input.dateKey);
  const { end, start } = dayRange(dateKey);
  const prisma = await getPrisma();
  const reminders = await prisma.trackingReminder.findMany({
    include: TRACKING_REMINDER_INCLUDE,
    orderBy: [{ reminderStartTime: "asc" }],
    where: {
      active: true,
      deletedAt: null,
      userId,
      AND: [
        {
          OR: [
            { startTrackingDate: null },
            { startTrackingDate: { lte: end } },
          ],
        },
        {
          OR: [
            { stopTrackingDate: null },
            { stopTrackingDate: { gte: start } },
          ],
        },
      ],
    },
  });
  if (reminders.length === 0) return { dateKey, reminders: [] };

  const notifications = await prisma.trackingReminderNotification.findMany({
    orderBy: [{ notifyAt: "asc" }],
    where: {
      deletedAt: null,
      notifyAt: { gte: start, lt: end },
      trackingReminderId: { in: reminders.map((reminder) => reminder.id) },
      userId,
    },
  });
  const byReminderId = new Map(
    notifications.map((notification) => [
      notification.trackingReminderId,
      notification,
    ]),
  );
  const remindersWithStatus = reminders
    .map((reminder) => {
      // null = no notification recorded yet for this dateKey (reminder still pending), not an error.
      const existingNotification = byReminderId.get(reminder.id);
      const notification =
        existingNotification === undefined ? null : existingNotification;
      return {
        dateKey,
        defaultValue: cleanNumber(reminder.defaultValue),
        globalVariable: reminder.globalVariable,
        instructions: reminder.instructions,
        notification,
        notifyAt:
          notification?.notifyAt ??
          reminderNotifyAt(dateKey, reminder.reminderStartTime),
        reminderEndTime: reminder.reminderEndTime,
        reminderFrequency: reminder.reminderFrequency,
        reminderId: reminder.id,
        reminderStartTime: reminder.reminderStartTime,
        status: notification?.status ?? NotificationStatus.PENDING,
      };
    })
    .filter((reminder) => {
      if (input.includeCompleted === true) return true;
      return (
        reminder.status === NotificationStatus.PENDING ||
        reminder.status === NotificationStatus.SENT
      );
    });
  return { dateKey, reminders: remindersWithStatus };
}

async function findOrCreateTrackingNotification(
  tx: Prisma.TransactionClient,
  input: {
    notifyAt: Date;
    status: NotificationStatus;
    trackedValue: number | null;
    trackingReminderId: string;
    userId: string;
  },
) {
  const existing = await tx.trackingReminderNotification.findFirst({
    where: {
      deletedAt: null,
      notifyAt: input.notifyAt,
      trackingReminderId: input.trackingReminderId,
      userId: input.userId,
    },
  });
  const data = {
    receivedAt: new Date(),
    status: input.status,
    trackedValue: input.trackedValue,
  };
  if (existing) {
    return tx.trackingReminderNotification.update({
      data,
      where: { id: existing.id },
    });
  }
  return tx.trackingReminderNotification.create({
    data: {
      ...data,
      notifyAt: input.notifyAt,
      trackingReminderId: input.trackingReminderId,
      userId: input.userId,
    },
  });
}

async function respondToTrackingReminderForUser(
  input: Record<string, unknown>,
  userId: string,
) {
  const status =
    parseEnumInput(NotificationStatus, input.status, "status") ??
    NotificationStatus.TRACKED;
  if (
    status !== NotificationStatus.TRACKED &&
    status !== NotificationStatus.SKIPPED &&
    status !== NotificationStatus.SNOOZED
  ) {
    throw new Error("status must be TRACKED, SKIPPED, or SNOOZED.");
  }
  const trackingReminderId = optionalString(input.trackingReminderId);
  if (!trackingReminderId) throw new Error("trackingReminderId is required.");
  const trackedAt = parseOptionalDateValue(input.trackedAt, "trackedAt");
  const dateKey = parseDateKey(
    input.dateKey,
    dateKeyFromDate(trackedAt ?? new Date()),
  );
  const prisma = await getPrisma();
  return prisma.$transaction(async (tx) => {
    const reminder = await tx.trackingReminder.findFirst({
      include: TRACKING_REMINDER_INCLUDE,
      where: {
        deletedAt: null,
        id: trackingReminderId,
        userId,
      },
    });
    if (!reminder) {
      throw new Error(`TrackingReminder not found: ${trackingReminderId}`);
    }
    const trackedValue =
      status === NotificationStatus.TRACKED
        ? (parseOptionalFiniteNumberInput(input, "value") ??
          cleanNumber(reminder.defaultValue))
        : null;
    if (status === NotificationStatus.TRACKED && trackedValue == null) {
      throw new Error(
        "Provide value or configure defaultValue before marking this reminder TRACKED.",
      );
    }
    const notifyAt = reminderNotifyAt(dateKey, reminder.reminderStartTime);
    const notification = await findOrCreateTrackingNotification(tx, {
      notifyAt,
      status,
      trackedValue,
      trackingReminderId,
      userId,
    });
    let measurement = null;
    if (status === NotificationStatus.TRACKED) {
      const value = trackedValue;
      if (value == null) {
        throw new Error(
          "Provide value or configure defaultValue before marking this reminder TRACKED.",
        );
      }
      const tracked = await recordTrackingMeasurementWithTx(tx, {
        categoryName: reminder.globalVariable.variableCategory.name,
        duration: null,
        fillingType: reminder.nOf1Variable.fillingType,
        globalVariableId: reminder.globalVariableId,
        latitude: null,
        longitude: null,
        note: optionalString(input.note),
        sourceName: optionalString(input.sourceName) ?? "mcp-reminder",
        startTime: trackedAt ?? new Date(),
        unitAbbreviation: optionalString(input.unitAbbreviation),
        unitId:
          optionalString(input.unitId) ?? reminder.globalVariable.defaultUnitId,
        unitName: optionalString(input.unitName),
        userId,
        value,
      });
      measurement = tracked.measurement;
    }
    if (status === NotificationStatus.TRACKED) {
      await tx.trackingReminder.update({
        data: { lastTracked: trackedAt ?? new Date() },
        where: { id: reminder.id },
      });
    }
    return { dateKey, measurement, notification, reminderId: reminder.id };
  });
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
    task.validationNotes.some(
      (note) =>
        note.toLowerCase().includes("missing") ||
        note.toLowerCase().includes("invalid denominator"),
    )
  ) {
    return {
      label: "clarify it",
      rationale: [
        "Task economics are missing/ambiguous; clarify key inputs first.",
      ],
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
        (task.deadlineStatus === "start_now" ||
          task.deadlineStatus === "missed")) ||
      (task.deadlinePolicy === "EXPIRES" &&
        task.deadlineStatus === "start_now"),
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
          description:
            "Organization the assignee works for, e.g. 'Government of United States'",
        },
        employerCount: {
          type: "number",
          description:
            "Headcount of the assignee's constituency (citizens, employees, etc.)",
        },
        employerCountLabel: {
          type: "string",
          description: "Unit label for employerCount, e.g. 'citizens'",
        },
        salaryUsdPerYear: {
          type: "number",
          description: "Annual salary in USD",
        },
        budgetUsdPerYear: {
          type: "number",
          description:
            "Annual budget the assignee controls in USD (e.g. military spending for a head of gov)",
        },
        budgetLabel: {
          type: "string",
          description:
            "What kind of budget this is, e.g. 'Military spending', 'Agency operating budget', 'District appropriations'. Displayed next to budgetUsdPerYear on the detail page.",
        },
        jobQuote: {
          type: "object" as const,
          description:
            "Job description quote attributed to a source document (constitution, charter, etc.)",
          properties: {
            text: { type: "string" },
            source: { type: "string" },
          },
          required: ["text", "source"],
        },
        contactChannels: {
          type: "array" as const,
          description:
            "Direct-contact links the visitor can use to reach the assignee",
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
    costOfDelayNote: {
      type: "string",
      description:
        "Optional human-readable note above the cost-of-delay counters. Supports {daysOverdue}/{deathsLocked}/{moneyDestroyed} tokens.",
    },
    unlocks: {
      type: "array" as const,
      description:
        "Downstream tasks or inline outcomes unlocked when this task completes.",
      items: {
        type: "object" as const,
        properties: {
          kind: { type: "string", enum: ["child-task", "inline"] },
          childTaskId: {
            type: "string",
            description: "Task id if kind=child-task",
          },
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
          roiRatio: {
            type: "number",
            description: "ROI as an integer ratio, e.g. 45 for 45:1",
          },
          fullAnalysisUrl: {
            type: "string",
            description: "Link to the full methodology write-up",
          },
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
              color: {
                type: "string",
                enum: ["red", "green", "cyan", "pink", "yellow"],
              },
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
        narrative: {
          type: "string",
          description: "Short narrative paragraph in Wishonia voice",
        },
        rating: { type: "string", description: "Letter grade, e.g. 'F'" },
        firedFromWendys: {
          type: "boolean",
          description: "Bit of humor — 'Would be fired from Wendy's: Yes/No'",
        },
        scorecardUrl: {
          type: "string",
          description: "Link to the assignee's full scorecard",
        },
      },
    },
    reminder: {
      type: "object" as const,
      description:
        "Editable polite reminder the visitor can post to X/Bluesky. Tokens: {name} {handle} {daysOverdue} {deathsLocked} {moneyDestroyed} {sufferingHours} {salaryUsd} {budgetUsd} {taskTitle} {taskUrl}.",
      properties: {
        intro: {
          type: "string",
          description: "One-sentence intro above the textarea",
        },
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
                  description:
                    "Flags the 'you are here' row (renders in brutal-red with '← you are' suffix)",
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
      description:
        "Renders the TaskBlockerCard on blocked tasks that point at an upstream blocker.",
      properties: {
        taskId: { type: "string" },
        summary: { type: "string" },
        callToActionHref: { type: "string" },
      },
      required: ["taskId"],
    },
    expectedDeliverable: {
      type: "string",
      description: "Concrete output the executor must submit",
    },
    acceptanceCriteria: {
      type: "array" as const,
      description: "Checkbox list of acceptance criteria",
      items: { type: "string" },
    },
    currentActivities: {
      type: "array" as const,
      description:
        "'Currently doing instead' block — what the assignee is doing in place of this task",
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

const EARTH_DATA_TOOL_DEFINITIONS = [
  {
    name: "castReferendumVote",
    description: "Cast or update the authenticated user's own referendum vote.",
    inputSchema: {
      type: "object" as const,
      properties: {
        answer: { type: "string", enum: ["YES", "NO", "ABSTAIN"] },
        publicComment: { type: "string" },
        referendumSlug: { type: "string" },
      },
    },
  },
  {
    name: "recordRepresentedReferendumVote",
    description:
      "Record a represented or memorial referendum vote for an existing Person.",
    inputSchema: {
      type: "object" as const,
      properties: {
        answer: { type: "string", enum: ["YES", "NO", "ABSTAIN"] },
        isPublic: { type: "boolean" },
        personId: { type: "string" },
        publicComment: { type: "string" },
        referendumSlug: { type: "string" },
      },
      required: ["personId"],
    },
  },
  {
    name: "searchPeople",
    description:
      "Search public Person records by name, handle, affiliation, or source key.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string" },
        limit: { type: "number" },
        publicOnly: { type: "boolean" },
      },
    },
  },
  {
    name: "getPerson",
    description:
      "Fetch one Person by id or handle, including public memorial/vote context.",
    inputSchema: {
      type: "object" as const,
      properties: {
        idOrHandle: { type: "string" },
        personId: { type: "string" },
        publicOnly: {
          type: "boolean",
          description:
            "Admin-only escape hatch. Non-admin callers always receive public data.",
        },
      },
    },
  },
  {
    name: "searchOrganizations",
    description:
      "Search organization records by name, slug, website, or source key.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "signReferendumAsOrganization",
    description:
      "Sign a referendum as an organization, auto-active under post-moderation.",
    inputSchema: {
      type: "object" as const,
      properties: {
        organizationId: { type: "string" },
        newOrganizationName: { type: "string" },
        type: { type: "string" },
        website: { type: "string" },
        description: { type: "string" },
        donationUrl: { type: "string" },
        squareLogoUrl: {
          type: "string",
          description:
            "Square logo mark URL. Use uploadImageFromUrl with kind=organization-square-logo first when starting from a remote public image URL.",
        },
        wordmarkLogoUrl: {
          type: "string",
          description:
            "Horizontal wordmark logo URL. Use uploadImageFromUrl with kind=organization-wordmark-logo first when starting from a remote public image URL.",
        },
        contactEmail: { type: "string" },
        referendumSlug: { type: "string" },
        position: { type: "string", enum: ["YES", "NO", "ABSTAIN"] },
        statement: { type: "string" },
      },
    },
  },
  {
    name: "upsertMemorialPerson",
    description:
      "Create or update a memorial/represented Person, optional condition, memorial, evidence, responsible party, relationship, and YES referendum vote. Agent imports require sourceKey/sourceRef plus sourceUrl or sourceArtifactId.",
    inputSchema: {
      type: "object" as const,
      properties: {
        displayName: { type: "string" },
        lifeStatus: { type: "string", enum: ["UNKNOWN", "LIVING", "DECEASED"] },
        birthDate: { type: "string" },
        dateOfDeath: { type: "string" },
        deathCountryCode: { type: "string" },
        conditionName: { type: "string" },
        conditionCodeSystem: { type: "string" },
        conditionCode: { type: "string" },
        causeCategory: { type: "string" },
        conflictId: { type: "string" },
        conflictName: { type: "string" },
        responsiblePartyName: { type: "string" },
        relationshipType: { type: "string" },
        imageUrl: { type: "string" },
        memorialMessage: { type: "string" },
        publicComment: { type: "string" },
        isPublic: { type: "boolean" },
        consentCourtEvidence: { type: "boolean" },
        recordTreatyVote: { type: "boolean" },
        referendumSlug: { type: "string" },
        sourceKind: {
          type: "string",
          enum: ["PERSONAL_TESTIMONY", "PUBLIC_IMPORT"],
        },
        sourceKey: { type: "string" },
        sourceRef: { type: "string" },
        sourceUrl: { type: "string" },
        sourceArtifactId: { type: "string" },
      },
      required: ["displayName"],
    },
  },
  {
    name: "addMemorialEvidence",
    description:
      "Attach public non-sensitive sourced evidence to a memorial. Requires sourceUrl or sourceArtifactId.",
    inputSchema: {
      type: "object" as const,
      properties: {
        memorialId: { type: "string" },
        evidenceKind: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        sourceUrl: { type: "string" },
        sourceArtifactId: { type: "string" },
        sourceKey: { type: "string" },
        isPublic: {
          type: "boolean",
          description: "Must be true; private evidence is not accepted.",
        },
        containsSensitiveData: {
          type: "boolean",
          description: "Must be false; do not submit sensitive evidence.",
        },
      },
      required: ["memorialId"],
    },
  },
  {
    name: "addMemorialResponsibleParty",
    description:
      "Attach a government, organization, or free-text responsible party to a memorial.",
    inputSchema: {
      type: "object" as const,
      properties: {
        memorialId: { type: "string" },
        jurisdictionId: { type: "string" },
        organizationId: { type: "string" },
        name: { type: "string" },
        roleSlug: { type: "string" },
        sourceUrl: { type: "string" },
        sourceArtifactId: { type: "string" },
        isPrimary: { type: "boolean" },
        isPublic: { type: "boolean" },
        confidenceScore: { type: "number" },
      },
      required: ["memorialId"],
    },
  },
  {
    name: "upsertConflict",
    description:
      "Create or update a named conflict reference by slug/name/source key.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string" },
        slug: { type: "string" },
        description: { type: "string" },
        sourceUrl: { type: "string" },
        startDate: { type: "string" },
        endDate: { type: "string" },
        primaryJurisdictionId: { type: "string" },
      },
      required: ["name"],
    },
  },
  {
    name: "resolveGlobalVariable",
    description:
      "Find or create a canonical condition, intervention, side-effect, outcome, or policy GlobalVariable, with optional external code.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string" },
        kind: {
          type: "string",
          enum: [
            "condition",
            "intervention",
            "outcome",
            "side_effect",
            "policy",
            "other",
          ],
        },
        codeSystem: { type: "string" },
        code: { type: "string" },
        sourceArtifactId: { type: "string" },
        sourceUrl: { type: "string" },
        variableCategoryName: { type: "string" },
      },
      required: ["name"],
    },
  },
  {
    name: "upsertSourceArtifact",
    description:
      "Store source/provenance data without executing it. For Python, notebooks, or other calculation code, use artifactType CALCULATION_SOURCE and payloadJson with language and source; Optimitron marks it inert, computes its content hash, and rejects mutation under the same sourceKey.",
    inputSchema: {
      type: "object" as const,
      properties: {
        sourceKey: { type: "string" },
        sourceSystem: { type: "string" },
        artifactType: { type: "string" },
        sourceUrl: { type: "string" },
        sourceRef: { type: "string" },
        externalKey: { type: "string" },
        versionKey: { type: "string" },
        title: { type: "string" },
        contentHash: { type: "string" },
        payloadJson: {
          type: "object",
          description:
            "For calculation code: { language, source, runtime?, dependencies?, entrypoint?, inputs?, outputs?, notes? }. Code is retained as inert data and is never run by this tool or by the web application.",
        },
      },
      required: ["sourceKey"],
    },
  },
  {
    name: "upsertCourtCase",
    description: "Create or update a Court of Humanity case root record.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string" },
        slug: { type: "string" },
        title: { type: "string" },
        summary: { type: "string" },
        status: {
          type: "string",
          enum: ["DRAFT", "OPEN", "VOTING", "JUDGED", "ARCHIVED"],
        },
        isPublic: { type: "boolean" },
        nominalPlaintiffSubjectId: { type: "string" },
        primaryRespondentSubjectId: { type: "string" },
        beneficiarySubjectId: { type: "string" },
        rootTaskId: { type: "string" },
        juryReferendumId: { type: "string" },
        metadataJson: { type: "object" },
      },
      required: ["title"],
    },
  },
  {
    name: "addCourtCaseParty",
    description:
      "Attach a plaintiff, respondent, class, beneficiary, or amicus Subject to a Court of Humanity case.",
    inputSchema: {
      type: "object" as const,
      properties: {
        caseId: { type: "string" },
        partyKey: { type: "string" },
        subjectId: { type: "string" },
        subjectExternalId: { type: "string" },
        subjectDisplayName: { type: "string" },
        subjectType: { type: "string" },
        role: {
          type: "string",
          enum: [
            "NOMINAL_PLAINTIFF",
            "NAMED_PLAINTIFF",
            "REPRESENTATIVE_CLASS",
            "RESPONDENT",
            "AMICUS",
            "BENEFICIARY",
          ],
        },
        capacity: {
          type: "string",
          enum: [
            "INSTITUTIONAL",
            "OFFICIAL_CAPACITY",
            "PERSONAL_CAPACITY",
            "OVERSIGHT_CAPACITY",
            "CLASS_REPRESENTATIVE",
          ],
        },
        displayNameSnapshot: { type: "string" },
        standingTheory: { type: "string" },
        powerToRemedyScore: { type: "number" },
        blameAttributionScore: { type: "number" },
        publicAccountabilityScore: { type: "number" },
        sortOrder: { type: "number" },
        isPublic: { type: "boolean" },
        metadataJson: { type: "object" },
      },
      required: ["caseId", "role"],
    },
  },
  {
    name: "addCourtCaseClaim",
    description:
      "Add a structured allegation or requested finding to a Court of Humanity case.",
    inputSchema: {
      type: "object" as const,
      properties: {
        caseId: { type: "string" },
        claimKey: { type: "string" },
        title: { type: "string" },
        claimType: { type: "string" },
        argumentMarkdown: { type: "string" },
        requestedFinding: { type: "string" },
        status: {
          type: "string",
          enum: ["PROPOSED", "ACCEPTED", "REJECTED", "SUPERSEDED"],
        },
        juryReferendumId: { type: "string" },
        sortOrder: { type: "number" },
        isPublic: { type: "boolean" },
        metadataJson: { type: "object" },
      },
      required: ["caseId", "title", "argumentMarkdown"],
    },
  },
  {
    name: "addCourtCaseHarm",
    description:
      "Add a quantified or qualitative harm catalog row to a Court of Humanity case.",
    inputSchema: {
      type: "object" as const,
      properties: {
        caseId: { type: "string" },
        claimId: { type: "string" },
        harmKey: { type: "string" },
        harmType: { type: "string" },
        title: { type: "string" },
        bodyMarkdown: { type: "string" },
        affectedSubjectId: { type: "string" },
        globalVariableId: { type: "string" },
        parameterName: { type: "string" },
        lowValue: { type: "number" },
        baseValue: { type: "number" },
        highValue: { type: "number" },
        unit: { type: "string" },
        confidenceScore: { type: "number" },
        sortOrder: { type: "number" },
        isPublic: { type: "boolean" },
        status: {
          type: "string",
          enum: ["PROPOSED", "ACCEPTED", "REJECTED", "SUPERSEDED"],
        },
        metadataJson: { type: "object" },
      },
      required: ["caseId", "title"],
    },
  },
  {
    name: "addCourtCaseEvidence",
    description:
      "Attach public non-sensitive evidence to a Court of Humanity case, claim, or harm.",
    inputSchema: {
      type: "object" as const,
      properties: {
        caseId: { type: "string" },
        claimId: { type: "string" },
        harmId: { type: "string" },
        evidenceKey: { type: "string" },
        evidenceType: { type: "string" },
        title: { type: "string" },
        bodyMarkdown: { type: "string" },
        sourceArtifactId: { type: "string" },
        personMemorialId: { type: "string" },
        globalVariableId: { type: "string" },
        parameterName: { type: "string" },
        sourceUrl: { type: "string" },
        contentHash: { type: "string" },
        isPublic: {
          type: "boolean",
          description: "Must be true; private evidence is not accepted.",
        },
        containsSensitiveData: {
          type: "boolean",
          description: "Must be false; sensitive evidence is not accepted.",
        },
        reviewStatus: {
          type: "string",
          enum: ["PROPOSED", "ACCEPTED", "REJECTED", "SUPERSEDED"],
        },
        confidenceScore: { type: "number" },
        sortOrder: { type: "number" },
        metadataJson: { type: "object" },
      },
      required: ["caseId", "title"],
    },
  },
  {
    name: "addCourtCaseRemedy",
    description:
      "Add a requested remedy that can point at an existing enforcement Task.",
    inputSchema: {
      type: "object" as const,
      properties: {
        caseId: { type: "string" },
        claimId: { type: "string" },
        targetPartyId: { type: "string" },
        remedyKey: { type: "string" },
        remedyType: { type: "string" },
        title: { type: "string" },
        bodyMarkdown: { type: "string" },
        amountUsdLow: { type: "number" },
        amountUsdBase: { type: "number" },
        amountUsdHigh: { type: "number" },
        deadlineAt: { type: "string" },
        enforcementTaskId: { type: "string" },
        status: {
          type: "string",
          enum: ["PROPOSED", "ACCEPTED", "REJECTED", "SUPERSEDED"],
        },
        sortOrder: { type: "number" },
        isPublic: { type: "boolean" },
        metadataJson: { type: "object" },
      },
      required: ["caseId", "title", "bodyMarkdown"],
    },
  },
  {
    name: "getCourtCase",
    description:
      "Fetch a Court of Humanity case with parties, claims, harms, evidence, remedies, and jury referendum.",
    inputSchema: {
      type: "object" as const,
      properties: {
        caseIdOrSlug: { type: "string" },
        id: { type: "string" },
        slug: { type: "string" },
      },
    },
  },
  {
    name: "openCourtCaseJuryVote",
    description:
      "Open or update the public referendum used as a Court of Humanity jury vote.",
    inputSchema: {
      type: "object" as const,
      properties: {
        caseIdOrSlug: { type: "string" },
        claimId: { type: "string" },
        questionKey: { type: "string" },
        questionTitle: { type: "string" },
      },
      required: ["caseIdOrSlug"],
    },
  },
  {
    name: "upsertInterventionApprovalTimeline",
    description:
      "Create or update a regulatory first-evidence/approval timeline for an intervention and condition.",
    inputSchema: {
      type: "object" as const,
      properties: {
        interventionName: { type: "string" },
        conditionName: { type: "string" },
        interventionGlobalVariableId: { type: "string" },
        conditionGlobalVariableId: { type: "string" },
        brandName: { type: "string" },
        regulatorName: { type: "string" },
        jurisdictionId: { type: "string" },
        firstEvidenceDate: { type: "string" },
        approvalDate: { type: "string" },
        sourceUrl: { type: "string" },
        sourceKey: { type: "string" },
        sourceArtifactId: { type: "string" },
      },
      required: ["interventionName", "conditionName"],
    },
  },
  {
    name: "upsertVariableRelationshipEvidenceEstimate",
    description:
      "Import or update evidence for predictor GlobalVariable -> outcome GlobalVariable effects.",
    inputSchema: {
      type: "object" as const,
      properties: {
        predictorGlobalVariableId: { type: "string" },
        outcomeGlobalVariableId: { type: "string" },
        contextGlobalVariableId: { type: "string" },
        metricKind: { type: "string" },
        sourceType: { type: "string" },
        value: { type: "number" },
        unitId: { type: "string" },
        confidenceScore: { type: "number" },
        participants: { type: "number" },
        studies: { type: "number" },
        rationale: { type: "string" },
        sourceUrl: { type: "string" },
        sourceArtifactId: { type: "string" },
      },
      required: ["predictorGlobalVariableId", "outcomeGlobalVariableId"],
    },
  },
  {
    name: "recordInterventionExperience",
    description:
      "Record a user's intervention experience with optional outcomes and side effects.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subjectId: { type: "string" },
        conditionGlobalVariableId: { type: "string" },
        interventionGlobalVariableId: { type: "string" },
        status: { type: "string" },
        startedAt: { type: "string" },
        endedAt: { type: "string" },
        doseValue: { type: "number" },
        doseUnitId: { type: "string" },
        frequencyText: { type: "string" },
        notes: { type: "string" },
        sourceArtifactId: { type: "string" },
        isPublic: { type: "boolean" },
        outcomes: { type: "array", items: { type: "object" } },
        sideEffects: { type: "array", items: { type: "object" } },
      },
      required: ["interventionGlobalVariableId"],
    },
  },
  {
    name: "runEfficacyLagMatcher",
    description:
      "Match memorial deaths to approval timelines and create efficacy-lag evidence candidates.",
    inputSchema: {
      type: "object" as const,
      properties: {
        limit: { type: "number" },
      },
    },
  },
  {
    name: "reportContent",
    description:
      "Report wrong, duplicate, spam, impersonation, abusive, or unsourced public data for post-moderation review.",
    inputSchema: {
      type: "object" as const,
      properties: {
        targetType: { type: "string" },
        targetId: { type: "string" },
        reasonType: { type: "string" },
        message: { type: "string" },
        sourceUrl: { type: "string" },
        correctionJson: { type: "object" },
      },
      required: ["targetType", "targetId", "reasonType"],
    },
  },
  {
    name: "suggestCorrection",
    description:
      "Suggest structured replacement fields for an existing public data record.",
    inputSchema: {
      type: "object" as const,
      properties: {
        targetType: { type: "string" },
        targetId: { type: "string" },
        reasonType: { type: "string" },
        message: { type: "string" },
        sourceUrl: { type: "string" },
        correctionJson: { type: "object" },
      },
      required: ["targetType", "targetId", "correctionJson"],
    },
  },
  {
    name: "hideContent",
    description:
      "Admin-only: hide or soft-delete a supported public Earth-data record.",
    inputSchema: {
      type: "object" as const,
      properties: {
        targetType: { type: "string" },
        targetId: { type: "string" },
      },
      required: ["targetType", "targetId"],
    },
  },
  {
    name: "restoreContent",
    description: "Admin-only: restore a hidden supported Earth-data record.",
    inputSchema: {
      type: "object" as const,
      properties: {
        targetType: { type: "string" },
        targetId: { type: "string" },
      },
      required: ["targetType", "targetId"],
    },
  },
  {
    name: "mergeDuplicatePeople",
    description:
      "Admin-only: merge a duplicate Person into the canonical Person.",
    inputSchema: {
      type: "object" as const,
      properties: {
        canonicalPersonId: { type: "string" },
        duplicatePersonId: { type: "string" },
      },
      required: ["canonicalPersonId", "duplicatePersonId"],
    },
  },
  {
    name: "resolveContentReport",
    description: "Admin-only: mark a content report as resolved or dismissed.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string" },
        status: { type: "string", enum: ["OPEN", "RESOLVED", "DISMISSED"] },
        resolutionNote: { type: "string" },
      },
      required: ["id"],
    },
  },
];

const TASK_ROUTING_INPUT_PROPERTIES = {
  engagementKind: {
    type: "string",
    enum: Object.values(TaskEngagementKind),
    description:
      "Commitment shape: ONE_OFF, ONGOING, PART_TIME, FULL_TIME, CONTRACT.",
  },
  applicationPolicy: {
    type: "string",
    enum: Object.values(TaskApplicationPolicy),
    description: "Whether users can apply: CLOSED, OPEN, or INVITE_ONLY.",
  },
  preferredSkillTags: {
    type: "array",
    items: { type: "string" },
    description: "Skills that improve fit beyond required skillTags.",
  },
  requiredCredentialTags: {
    type: "array",
    items: { type: "string" },
    description: "Credentials, licenses, or qualifications required.",
  },
  preferredCredentialTags: {
    type: "array",
    items: { type: "string" },
    description: "Credentials that improve fit.",
  },
  requiredLanguageTags: {
    type: "array",
    items: { type: "string" },
    description: "Languages required.",
  },
  preferredLanguageTags: {
    type: "array",
    items: { type: "string" },
    description: "Languages that improve fit.",
  },
  requiredToolTags: {
    type: "array",
    items: { type: "string" },
    description: "Tools, platforms, or software required.",
  },
  preferredToolTags: {
    type: "array",
    items: { type: "string" },
    description: "Tools that improve fit.",
  },
  requiredAccessTags: {
    type: "array",
    items: { type: "string" },
    description:
      "Accounts, clearance, location, network, or social access required.",
  },
  preferredAccessTags: {
    type: "array",
    items: { type: "string" },
    description: "Access that improves fit.",
  },
  ownerOrganizationId: {
    type: ["string", "null"],
    description: "Organization that owns/reviews this opening or task.",
  },
  compensationKind: {
    type: "string",
    enum: Object.values(TaskCompensationKind),
    description: "Compensation category.",
  },
  compensationCadence: {
    type: ["string", "null"],
    enum: [...Object.values(TaskCompensationCadence), null],
    description: "Compensation cadence. Null clears it.",
  },
  compensationCurrency: {
    type: ["string", "null"],
    description: "Lowercase currency code, usually usd.",
  },
  compensationMinAmountMinorUnits: {
    type: ["integer", "null"],
    description: "Minimum compensation in currency minor units.",
  },
  compensationMaxAmountMinorUnits: {
    type: ["integer", "null"],
    description: "Maximum compensation in currency minor units.",
  },
  compensationMinAmountUsd: {
    type: ["number", "null"],
    description:
      "Alias for compensationMinAmountMinorUnits when the currency is USD.",
  },
  compensationMaxAmountUsd: {
    type: ["number", "null"],
    description:
      "Alias for compensationMaxAmountMinorUnits when the currency is USD.",
  },
  compensationPaymentRails: {
    type: "array",
    items: { type: "string" },
    description: "Acceptable payment rails, such as stripe, ach, usdc, wire.",
  },
  estimatedHoursPerWeekMin: {
    type: ["integer", "null"],
    description: "Minimum weekly hours for ongoing work.",
  },
  estimatedHoursPerWeekMax: {
    type: ["integer", "null"],
    description: "Maximum weekly hours for ongoing work.",
  },
  remotePolicy: {
    type: "string",
    enum: Object.values(TaskRemotePolicy),
    description: "UNSPECIFIED, REMOTE, HYBRID, or ONSITE.",
  },
  locationText: {
    type: ["string", "null"],
    description: "Human-readable location constraint.",
  },
  workLocationCountryCode: { type: ["string", "null"] },
  workLocationRegionCode: { type: ["string", "null"] },
  workLocationCity: { type: ["string", "null"] },
  workLocationPostalCode: { type: ["string", "null"] },
  workLocationLatitude: { type: ["number", "null"] },
  workLocationLongitude: { type: ["number", "null"] },
  workLocationRadiusKm: { type: ["number", "null"] },
  workTimeZone: {
    type: ["string", "null"],
    description: "IANA time zone preferred for the work.",
  },
  applicationQuestionsJson: {
    type: ["object", "array", "null"],
    description: "Structured questions for applicants. Null clears it.",
  },
  executionMode: {
    type: "string",
    enum: Object.values(TaskExecutionMode),
    description: "HUMAN_OR_AGENT, HUMAN_ONLY, or AGENT_ONLY.",
  },
  maxClaims: {
    type: ["integer", "null"],
    description: "Max simultaneous claims when claimPolicy is OPEN_MANY.",
  },
} as const;

const USER_MATCHING_PROFILE_PROPERTIES = {
  skillTags: { type: "array", items: { type: "string" } },
  credentialTags: { type: "array", items: { type: "string" } },
  interestTags: { type: "array", items: { type: "string" } },
  languageTags: { type: "array", items: { type: "string" } },
  toolTags: { type: "array", items: { type: "string" } },
  accessTags: { type: "array", items: { type: "string" } },
  preferredPaymentRails: { type: "array", items: { type: "string" } },
  workPreferenceTags: { type: "array", items: { type: "string" } },
  preferredTaskTags: { type: "array", items: { type: "string" } },
  unavailableTaskTags: { type: "array", items: { type: "string" } },
  availableHoursPerWeek: { type: ["number", "null"] },
  availableFrom: { type: ["string", "null"], description: "ISO 8601 date." },
  countryCode: { type: ["string", "null"] },
  regionCode: { type: ["string", "null"] },
  city: { type: ["string", "null"] },
  postalCode: { type: ["string", "null"] },
  latitude: { type: ["number", "null"] },
  longitude: { type: ["number", "null"] },
} as const;

const TRACKING_TOOL_DEFINITIONS = [
  {
    name: RECORD_MEASUREMENT_TOOL_NAME,
    description:
      "Record a personal dFDA/N-of-1 measurement such as a medication dose, food, symptom, mood, sleep, activity, lab, or vital sign. Use variableName plus category/unit for new variables, or globalVariableId for an existing variable.",
    inputSchema: {
      type: "object" as const,
      properties: {
        globalVariableId: { type: "string" },
        variableName: { type: "string" },
        categoryName: {
          type: "string",
          description:
            "Variable category such as Treatment, Food, Symptom, Emotion, Sleep, Activity, Vital Sign, or Lab Result.",
        },
        value: { type: "number" },
        unitId: { type: "string" },
        unitAbbreviation: {
          type: "string",
          description: "Short unit such as mg, IU, serving, count, or 1-5.",
        },
        unitName: { type: "string" },
        startTime: { type: "string", description: "ISO date/time." },
        duration: { type: "number", description: "Duration in seconds." },
        note: { type: "string" },
        sourceName: { type: "string" },
        combinationOperation: { type: "string", enum: ["SUM", "MEAN"] },
        fillingType: {
          type: "string",
          enum: ["ZERO", "NONE", "INTERPOLATION", "VALUE"],
        },
        latitude: { type: "number" },
        longitude: { type: "number" },
      },
      required: ["value"],
    },
  },
  {
    name: "upsertTrackingReminder",
    description:
      "Create or update a personal tracking reminder for medications, food, symptoms, mood, sleep, activity, labs, or vitals. The reminder can later be answered as TRACKED, SKIPPED, or SNOOZED.",
    inputSchema: {
      type: "object" as const,
      properties: {
        globalVariableId: { type: "string" },
        variableName: { type: "string" },
        categoryName: { type: "string" },
        defaultValue: {
          type: "number",
          description:
            "Pre-filled value, such as a normal medication dose or symptom rating.",
        },
        unitId: { type: "string" },
        unitAbbreviation: { type: "string" },
        unitName: { type: "string" },
        reminderStartTime: {
          type: "string",
          description: "Local wall-clock time in HH:mm, for example 08:00.",
        },
        reminderEndTime: {
          type: "string",
          description: "Optional local end/quiet time in HH:mm.",
        },
        reminderFrequency: {
          type: "number",
          description: "Seconds between reminders. Default 86400.",
        },
        active: { type: "boolean" },
        instructions: { type: "string" },
        startTrackingDate: { type: "string", description: "ISO date/time." },
        stopTrackingDate: { type: "string", description: "ISO date/time." },
        combinationOperation: { type: "string", enum: ["SUM", "MEAN"] },
        fillingType: {
          type: "string",
          enum: ["ZERO", "NONE", "INTERPOLATION", "VALUE"],
        },
      },
      required: ["reminderStartTime"],
    },
  },
  {
    name: "listTrackingReminders",
    description:
      "List the authenticated user's personal tracking reminders, active by default.",
    inputSchema: {
      type: "object" as const,
      properties: {
        includeInactive: { type: "boolean" },
      },
    },
  },
  {
    name: "listDueTrackingReminders",
    description:
      "List medication, food, symptom, and other tracking reminders due for a date. Use this to answer what the user is supposed to take or track today.",
    inputSchema: {
      type: "object" as const,
      properties: {
        dateKey: {
          type: "string",
          description: "Local date in YYYY-MM-DD. Defaults to today.",
        },
        includeCompleted: {
          type: "boolean",
          description:
            "When true, include reminders already TRACKED, SKIPPED, or SNOOZED for the date.",
        },
      },
    },
  },
  {
    name: "respondToTrackingReminder",
    description:
      "Answer a due tracking reminder. Use TRACKED when the user took/logged it, SKIPPED when they skipped it, or SNOOZED when they want to delay it. Pass value to record a different dosage or rating.",
    inputSchema: {
      type: "object" as const,
      properties: {
        trackingReminderId: { type: "string" },
        status: {
          type: "string",
          enum: ["TRACKED", "SKIPPED", "SNOOZED"],
        },
        value: {
          type: "number",
          description:
            "Override dose/rating/value. If omitted for TRACKED, the reminder defaultValue is used.",
        },
        unitId: { type: "string" },
        unitAbbreviation: { type: "string" },
        unitName: { type: "string" },
        trackedAt: { type: "string", description: "ISO date/time." },
        dateKey: {
          type: "string",
          description: "Local date in YYYY-MM-DD. Defaults from trackedAt.",
        },
        note: { type: "string" },
        sourceName: { type: "string" },
      },
      required: ["trackingReminderId", "status"],
    },
  },
] as const;

const TASK_TOOL_DEFINITIONS = [
  ...EARTH_DATA_TOOL_DEFINITIONS,
  ...TRACKING_TOOL_DEFINITIONS,
  {
    name: "getNextTask",
    description:
      "Get the highest expected-value unblocked task that the caller can work on. Returns the single best task to execute right now.",
    inputSchema: {
      type: "object" as const,
      properties: {
        skillTags: {
          type: "array",
          items: { type: "string" },
          description: "Agent's skill tags for personalized ranking",
        },
        interestTags: {
          type: "array",
          items: { type: "string" },
          description: "Agent's interest tags for personalized ranking",
        },
        credentialTags: { type: "array", items: { type: "string" } },
        languageTags: { type: "array", items: { type: "string" } },
        toolTags: { type: "array", items: { type: "string" } },
        accessTags: { type: "array", items: { type: "string" } },
        availableHoursPerWeek: {
          type: "number",
          description: "Hours per week the agent can commit",
        },
        agentId: {
          type: "string",
          description:
            "Agent's unique identifier (to skip tasks leased by this agent)",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        score: {
          type: "number",
          description: "Expected net value per hour-equivalent priority.",
        },
        task: {
          type: "object",
          properties: {
            id: { type: "string", description: "Task identifier." },
            title: { type: "string", description: "Task title." },
            blocked: {
              type: "boolean",
              description: "Whether the task still has unresolved blockers.",
            },
          },
        },
      },
    },
  },
  {
    name: "getQueueAudit",
    description:
      "Start here before trusting a personal task queue. Audits active private tasks created by this user or assigned to their Person for missing estimates, blocked dependencies, impossible priority inputs, required/expiring deadline risks, and other data issues. A life-planning agent should repair or clarify high-severity issues before relying on getNextAction.",
    inputSchema: { type: "object" as const, properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        summary: {
          type: "object",
          properties: {
            activeCreatedTasks: {
              type: "number",
              description:
                "Compatibility count of active personal-queue tasks created by this user.",
            },
            activePersonalTasks: {
              type: "number",
              description:
                "Count of active tasks created by this user or assigned to their Person.",
            },
            unblockedTasks: {
              type: "number",
              description:
                "How many personal-queue tasks are currently unblocked.",
            },
            issueCount: {
              type: "number",
              description: "Total queue quality issues found.",
            },
          },
        },
        issues: {
          type: "array",
          description:
            "Queue issues that should be corrected before selecting the next action.",
          items: {
            type: "object",
            properties: {
              code: {
                type: "string",
                description: "Machine-readable issue code.",
              },
              message: {
                type: "string",
                description: "Operator-readable issue summary.",
              },
              severity: {
                type: "string",
                enum: ["high", "medium", "low"],
                description: "Issue severity for prioritization.",
              },
              taskId: {
                type: "string",
                description: "Task ID associated with the issue, if any.",
              },
            },
          },
        },
      },
    },
    examples: [
      {
        input: {},
        output: {
          summary: {
            activeCreatedTasks: 4,
            activePersonalTasks: 6,
            unblockedTasks: 3,
            issueCount: 1,
          },
          issues: [
            {
              code: "MISSING_ESTIMATES",
              message:
                "Task task_abc is missing required estimate inputs for scoring.",
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
      "Get the authenticated user's available private self-work queue sorted by computed priority. Returns tasks the user created OR has been assigned to (via assigneePersonId). Hidden rows include completed tasks, blocked tasks, future available_at tasks, AI Agent tasks, and expired EXPIRES opportunities. Use this for the user's own next actions.",
    inputSchema: {
      type: "object" as const,
      properties: {
        maxResults: {
          type: "number",
          description: "Max number of tasks to return (default 20, max 100)",
        },
        buybackRate: {
          type: "number",
          description:
            "USD per hour used to convert cash cost into time-equivalent penalty (default 1000)",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        buybackRate: {
          type: "number",
          description:
            "USD/hour used for priority denominator cash-equivalent conversion.",
        },
        queue: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Task identifier." },
              title: { type: "string", description: "Task title." },
              status: { type: "string", description: "Current task status." },
              priority: {
                type: "number",
                description: "Computed priority score.",
              },
              hours: {
                type: ["number", "null"],
                description: "Estimated hours.",
              },
              value: {
                type: ["number", "null"],
                description: "Gross conditional value if present.",
              },
              pSuccess: {
                type: ["number", "null"],
                description: "Success probability if present.",
              },
              cashCost: { type: "number", description: "Cash cost in USD." },
              availableAt: {
                type: ["string", "null"],
                description:
                  "Earliest time this task should appear in active queues.",
              },
              deadlinePolicy: {
                type: "string",
                enum: ["NONE", "SOFT", "EXPIRES", "REQUIRED"],
                description: "How dueAt should be interpreted.",
              },
              deadlineStatus: {
                type: "string",
                enum: [
                  "none",
                  "future",
                  "start_now",
                  "overdue",
                  "missed",
                  "expired",
                ],
                description: "Derived deadline state. Does not alter priority.",
              },
              deadlineRationale: {
                type: ["string", "null"],
                description: "Freeform rationale for deadline policy.",
              },
              latestStartAt: {
                type: ["string", "null"],
                description:
                  "Latest start time implied by dueAt minus estimated hours.",
              },
              timeUntilDueHours: {
                type: ["number", "null"],
                description: "Hours until dueAt.",
              },
              executorType: {
                type: "string",
                description: "Self or AI Agent.",
              },
              capabilityStatus: {
                type: "string",
                enum: ["eligible", "unknown", "ineligible"],
              },
              capabilityReasons: {
                type: "array",
                items: { type: "string" },
              },
              effortEstimateSource: {
                type: "string",
                enum: [
                  "target-actual-history",
                  "candidate-estimate",
                  "task-estimate",
                  "impact-frame",
                  "missing",
                ],
              },
              realEv: {
                type: "number",
                description:
                  "Real expected value used by the priority formula.",
              },
              blockersCount: {
                type: "number",
                description: "Total blockers on this task.",
              },
              unblockedBlockers: {
                type: "number",
                description: "Number of blockers already cleared.",
              },
              unresolvedBlockers: {
                type: "number",
                description: "Number of blockers not yet complete.",
              },
            },
          },
        },
        itemsNeedingCapabilityConfirmation: {
          type: "array",
          items: { type: "object" },
        },
        capabilityExcludedWork: {
          type: "array",
          items: { type: "object" },
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
        maxResults: {
          type: "number",
          description: "Max number of tasks to return (default 20, max 100)",
        },
        buybackRate: {
          type: "number",
          description:
            "USD per hour used to convert cash cost into time-equivalent penalty (default 1000)",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        buybackRate: {
          type: "number",
          description:
            "USD/hour used for priority denominator cash-equivalent conversion.",
        },
        queue: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Task identifier." },
              title: { type: "string", description: "Task title." },
              assigneePersonId: {
                type: ["string", "null"],
                description: "Assignee person ID, if any.",
              },
              assigneeOrganizationId: {
                type: ["string", "null"],
                description: "Assignee organization ID, if any.",
              },
              priority: {
                type: "number",
                description: "Computed priority score.",
              },
              hours: {
                type: ["number", "null"],
                description: "Estimated hours.",
              },
              value: {
                type: ["number", "null"],
                description: "Gross conditional value if present.",
              },
              pSuccess: {
                type: ["number", "null"],
                description: "Success probability if present.",
              },
              cashCost: { type: "number", description: "Cash cost in USD." },
              availableAt: {
                type: ["string", "null"],
                description:
                  "Earliest time this task should appear in active queues.",
              },
              deadlinePolicy: {
                type: "string",
                enum: ["NONE", "SOFT", "EXPIRES", "REQUIRED"],
                description: "How dueAt should be interpreted.",
              },
              deadlineStatus: {
                type: "string",
                enum: [
                  "none",
                  "future",
                  "start_now",
                  "overdue",
                  "missed",
                  "expired",
                ],
                description: "Derived deadline state. Does not alter priority.",
              },
              deadlineRationale: {
                type: ["string", "null"],
                description: "Freeform rationale for deadline policy.",
              },
              latestStartAt: {
                type: ["string", "null"],
                description:
                  "Latest start time implied by dueAt minus estimated hours.",
              },
              timeUntilDueHours: {
                type: ["number", "null"],
                description: "Hours until dueAt.",
              },
              executorType: {
                type: "string",
                description: "Self or AI Agent.",
              },
              capabilityStatus: {
                type: "string",
                enum: ["eligible", "unknown", "ineligible"],
              },
              capabilityReasons: {
                type: "array",
                items: { type: "string" },
              },
              effortEstimateSource: {
                type: "string",
                enum: [
                  "target-actual-history",
                  "candidate-estimate",
                  "task-estimate",
                  "impact-frame",
                  "missing",
                ],
              },
              realEv: {
                type: "number",
                description:
                  "Real expected value used by the priority formula.",
              },
            },
          },
        },
        itemsNeedingCapabilityConfirmation: {
          type: "array",
          items: { type: "object" },
        },
        capabilityExcludedWork: {
          type: "array",
          items: { type: "object" },
        },
      },
    },
  },
  {
    name: "getExecutionPlan",
    description:
      "Build a capacity-bounded execution plan for the authenticated user, their Person record, or an organization they administer. Uses frontier-replanning-v1: repeatedly chooses the highest-priority feasible atomic task, simulates completion to unlock dependencies, and never starts AI work or writes Calendar events.",
    inputSchema: {
      type: "object" as const,
      properties: {
        target: {
          type: "object",
          properties: {
            kind: {
              type: "string",
              enum: ["self", "person", "organization"],
              description: "Planning subject. Defaults to self.",
            },
            id: {
              type: "string",
              description:
                "Person or organization ID. Omit for the self target.",
            },
          },
        },
        planningWindowStart: {
          type: "string",
          description: "ISO 8601 start. Defaults to now.",
        },
        planningWindowEnd: {
          type: "string",
          description: "ISO 8601 end. Defaults to 24 hours after start.",
        },
        fixedCommitments: {
          type: "array",
          description:
            "Calendar meetings or invitations that consume capacity but are not imported as tasks.",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              startAt: { type: "string" },
              endAt: { type: "string" },
            },
            required: ["startAt", "endAt"],
          },
        },
        availableMinutes: {
          type: "number",
          description:
            "Maximum work minutes. The planner also caps this at free time left after fixed commitments.",
        },
        maxResults: {
          type: "number",
          description:
            "Maximum checklist and AI proposal items (default 20, max 100).",
        },
        buybackRate: {
          type: "number",
          description:
            "USD per hour used to convert cash cost into time-equivalent penalty (default 1000).",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        plannerVersion: {
          type: "string",
          description: "Transparent planner algorithm version.",
        },
        nextAction: { type: ["object", "null"] },
        checklist: { type: "array", items: { type: "object" } },
        proposedAiAssistedWork: {
          type: "array",
          items: { type: "object" },
        },
        blockedWork: { type: "array", items: { type: "object" } },
        itemsNeedingEstimates: {
          type: "array",
          items: { type: "object" },
        },
        itemsNeedingCapabilityConfirmation: {
          type: "array",
          items: { type: "object" },
        },
        capabilityExcludedWork: {
          type: "array",
          items: { type: "object" },
        },
        assumptions: { type: "array", items: { type: "string" } },
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
        buybackRate: {
          type: "number",
          description:
            "USD per hour used to convert cash cost into time-equivalent penalty (default 1000)",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        label: {
          type: "string",
          description:
            "Recommended action label: do it / delegate it / clarify it / kill it.",
        },
        rationale: {
          type: "array",
          items: { type: "string" },
          description: "Short recommendation rationale.",
        },
        task: {
          type: ["object", "null"],
          description: "Top-scoring task to execute if available.",
        },
        priority: {
          type: "number",
          description: "Computed priority score for the suggested task.",
        },
        itemsNeedingCapabilityConfirmation: {
          type: "array",
          items: { type: "object" },
        },
        capabilityExcludedWork: {
          type: "array",
          items: { type: "object" },
        },
        deadlineOverride: {
          type: "boolean",
          description:
            "True when a required or expiring deadline task overrides the highest-priority task.",
        },
        selectionReason: {
          type: "string",
          enum: [
            "highest_priority",
            "deadline_latest_start",
            "deadline_missed",
            "empty_queue",
          ],
          description: "Why this task was selected.",
        },
        queueAudit: {
          type: "object",
          properties: {
            activeCreatedTasks: { type: "number" },
            activePersonalTasks: { type: "number" },
            unblockedTasks: { type: "number" },
          },
        },
      },
    },
  },
  {
    name: "evaluateTaskEconomics",
    description:
      "Evaluate the execution economics for a single task. Returns whether the current agent should execute directly, delegate, prepare procurement, or raise money first.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID" },
        skillTags: {
          type: "array",
          items: { type: "string" },
          description: "Agent's skill tags for capability matching",
        },
        interestTags: {
          type: "array",
          items: { type: "string" },
          description: "Agent's interest tags for capability matching",
        },
        credentialTags: { type: "array", items: { type: "string" } },
        languageTags: { type: "array", items: { type: "string" } },
        toolTags: { type: "array", items: { type: "string" } },
        accessTags: { type: "array", items: { type: "string" } },
        availableHoursPerWeek: {
          type: "number",
          description: "Hours per week the agent can commit",
        },
      },
      required: ["taskId"],
    },
  },
  {
    name: "recordTaskActuals",
    description:
      "Append an execution-history attempt and update aggregate actual cash cost and effort. Personal callers may record actuals only for their own private or assigned tasks; this does not create health measurements or run causal analysis.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID" },
        actualCashCostUsd: {
          type: "number",
          description: "Observed external cash cost in USD",
        },
        actualEffortSeconds: {
          type: "number",
          description: "Observed effort in seconds",
        },
        note: {
          type: "string",
          description: "Short execution note or procurement/funding rationale",
        },
        completedAt: {
          type: "string",
          description: "ISO 8601 completion time. Defaults to now.",
        },
      },
      required: ["taskId"],
    },
  },
  {
    name: "listTasks",
    description:
      "List tasks with optional filters. Returns up to 50 tasks sorted by accountability score.",
    inputSchema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["DRAFT", "ACTIVE", "VERIFIED", "STALE"],
          description: "Filter by task status",
        },
        category: {
          type: "string",
          enum: [
            "ADVOCACY",
            "RESEARCH",
            "COMMUNICATION",
            "ENGINEERING",
            "ORGANIZING",
            "OUTREACH",
            "GOVERNANCE",
            "SCIENCE",
            "LEGAL",
            "CREATIVE",
            "OTHER",
          ],
          description: "Filter by task category",
        },
        assigneePersonId: {
          type: "string",
          description: "Filter by assignee person ID",
        },
        assigneeOrganizationId: {
          type: "string",
          description: "Filter by assignee organization ID",
        },
        ownerOrganizationId: {
          type: "string",
          description: "Filter by owner/reviewer organization ID",
        },
        engagementKind: {
          type: "string",
          enum: Object.values(TaskEngagementKind),
          description: "Filter by engagement kind.",
        },
        applicationPolicy: {
          type: "string",
          enum: Object.values(TaskApplicationPolicy),
          description: "Filter by application policy.",
        },
        compensationKind: {
          type: "string",
          enum: Object.values(TaskCompensationKind),
          description: "Filter by compensation kind.",
        },
        remotePolicy: {
          type: "string",
          enum: Object.values(TaskRemotePolicy),
          description: "Filter by remote/hybrid/onsite policy.",
        },
        executionMode: {
          type: "string",
          enum: Object.values(TaskExecutionMode),
          description: "Filter by human/agent execution mode.",
        },
        requiredTags: {
          type: "array",
          items: { type: "string" },
          description:
            "Return tasks whose required/preferred/skill tags include any supplied tag.",
        },
        assignedToMe: {
          type: "boolean",
          description:
            "Filter to tasks assigned to the authenticated user's canonical Person row.",
        },
        parentTaskId: {
          type: "string",
          description: "Filter by parent task ID (get subtasks)",
        },
        limit: {
          type: "number",
          description: "Max results (default 20, max 50)",
        },
      },
    },
  },
  {
    name: "getTask",
    description:
      "Get full details for one task by taskId. If you do not have a taskId yet, call searchTasks, listTasks, getMyQueue, or getNextAction first.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "findTasksForUser",
    description:
      "Rank accessible active tasks for a user using their private matching preferences plus the task impact score. Non-admin callers can only rank their own user.",
    inputSchema: {
      type: "object" as const,
      properties: {
        userId: {
          type: "string",
          description:
            "Optional target user ID. Admin-only unless it is the authenticated user.",
        },
        limit: {
          type: "number",
          description: "Max results, default 20, max 50.",
        },
        preferLeafExecution: {
          type: "boolean",
          description:
            "When true, return only executable tasks without active subtasks; never fall back to parent tasks.",
        },
      },
    },
  },
  {
    name: "applyToTask",
    description:
      "Create or update the authenticated user's application to an OPEN or INVITE_ONLY task/role opening.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task or role opening ID." },
        applicationMessage: {
          type: "string",
          description: "Applicant message, cover note, or proposal.",
        },
        answersJson: {
          type: ["object", "array", "null"],
          description: "Structured answers to task.applicationQuestionsJson.",
        },
        applicantNameSnapshot: {
          type: "string",
          description: "Optional applicant name snapshot.",
        },
        applicantEmailSnapshot: {
          type: "string",
          description: "Optional applicant email snapshot.",
        },
        originUrl: {
          type: "string",
          description: "Where the application started.",
        },
        utmJson: {
          type: ["object", "null"],
          description: "UTM/campaign metadata.",
        },
      },
      required: ["taskId"],
    },
  },
  {
    name: "listTaskApplications",
    description:
      "List applications for one task. Caller must be admin, task creator, task manager, or owner/admin of the owner/assignee organization.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID." },
      },
      required: ["taskId"],
    },
  },
  {
    name: "reviewTaskApplication",
    description:
      "Review one task application. Optionally assign the task to the accepted applicant's Person row.",
    inputSchema: {
      type: "object" as const,
      properties: {
        applicationId: { type: "string", description: "Application ID." },
        status: {
          type: "string",
          enum: Object.values(TaskApplicationStatus),
          description: "New application status.",
        },
        reviewScore: {
          type: ["integer", "null"],
          description: "Reviewer score, conventionally 0-100.",
        },
        reviewNote: { type: ["string", "null"], description: "Reviewer note." },
        answersJson: {
          type: ["object", "array", "null"],
          description: "Reviewer-normalized answer data.",
        },
        assignTaskOnAccept: {
          type: "boolean",
          description:
            "If status is ACCEPTED, set task.assigneePersonId to the applicant person.",
        },
      },
      required: ["applicationId"],
    },
  },
  {
    name: "findTaskCandidates",
    description:
      "Admin-only: score users and active agent executors as possible executors for one task.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID." },
        limit: {
          type: "number",
          description: "Max candidates, default 20, max 100.",
        },
        includeAgents: {
          type: "boolean",
          description: "Include active AgentExecutor rows. Default true.",
        },
      },
      required: ["taskId"],
    },
  },
  {
    name: "saveTaskCandidateMatch",
    description:
      "Admin-only: upsert a scored candidate match for a task so later chats/agents can review or assign it.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string" },
        candidateKind: {
          type: "string",
          enum: Object.values(TaskCandidateKind),
        },
        candidateKey: {
          type: "string",
          description:
            "Stable key. If omitted, derived from candidateUserId/personId/organizationId/agentExecutorId.",
        },
        candidateUserId: { type: "string" },
        candidatePersonId: { type: "string" },
        candidateOrganizationId: { type: "string" },
        agentExecutorId: { type: "string" },
        score: { type: "number" },
        scoreVersion: { type: "string" },
        reasonJson: { type: ["object", "array", "null"] },
        blockersJson: { type: ["object", "array", "null"] },
        estimatedCostMinorUnits: { type: ["integer", "null"] },
        estimatedCostCurrency: { type: ["string", "null"] },
        estimatedDurationSeconds: { type: ["integer", "null"] },
        status: {
          type: "string",
          enum: Object.values(TaskCandidateMatchStatus),
        },
      },
      required: ["taskId", "candidateKind", "score"],
    },
  },
  {
    name: "listTaskCandidateMatches",
    description:
      "List saved candidate matches for a task. Non-admin callers must have application-review rights for the task.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string" },
        status: {
          type: "string",
          enum: Object.values(TaskCandidateMatchStatus),
        },
        limit: { type: "number", description: "Max results, default 50." },
      },
      required: ["taskId"],
    },
  },
  {
    name: "updateTaskCandidateMatchStatus",
    description: "Admin-only: update a saved task candidate match status.",
    inputSchema: {
      type: "object" as const,
      properties: {
        matchId: { type: "string" },
        status: {
          type: "string",
          enum: Object.values(TaskCandidateMatchStatus),
        },
        reasonJson: { type: ["object", "array", "null"] },
        blockersJson: { type: ["object", "array", "null"] },
      },
      required: ["matchId", "status"],
    },
  },
  {
    name: "listAgentExecutors",
    description:
      "Admin-only: list non-human executors addressable by task routing.",
    inputSchema: {
      type: "object" as const,
      properties: {
        status: { type: "string", enum: Object.values(AgentExecutorStatus) },
        provider: { type: "string" },
        capabilityTags: { type: "array", items: { type: "string" } },
        limit: { type: "number", description: "Max results, default 50." },
      },
    },
  },
  {
    name: "upsertAgentExecutor",
    description: "Admin-only: create or update a non-human task executor.",
    inputSchema: {
      type: "object" as const,
      properties: {
        agentKey: { type: "string" },
        displayName: { type: "string" },
        provider: { type: ["string", "null"] },
        modelName: { type: ["string", "null"] },
        capabilityTags: { type: "array", items: { type: "string" } },
        toolTags: { type: "array", items: { type: "string" } },
        accessTags: { type: "array", items: { type: "string" } },
        averageCostUsd: { type: ["number", "null"] },
        averageLatencySeconds: { type: ["number", "null"] },
        successRate: { type: ["number", "null"] },
        status: { type: "string", enum: Object.values(AgentExecutorStatus) },
        metadata: { type: ["object", "array", "null"] },
      },
      required: ["agentKey", "displayName"],
    },
  },
  {
    name: "setAgentExecutorStatus",
    description: "Admin-only: set an AgentExecutor status.",
    inputSchema: {
      type: "object" as const,
      properties: {
        agentKey: { type: "string" },
        status: { type: "string", enum: Object.values(AgentExecutorStatus) },
      },
      required: ["agentKey", "status"],
    },
  },
  {
    name: "listTaskEmails",
    description:
      "Admin-only: list task email communications and linked email logs for one task.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID." },
        email: {
          type: "string",
          description: "Optional recipient email filter.",
        },
        q: {
          type: "string",
          description:
            "Optional search across subject, recipient, task title, and provider email address.",
        },
        limit: {
          type: "number",
          description: "Max rows to return (default 50, max 200).",
        },
      },
      required: ["taskId"],
    },
  },
  {
    name: "listRecipientEmails",
    description:
      "Admin-only: list task email communications and email logs sent to a user, person, organization, or raw email address.",
    inputSchema: {
      type: "object" as const,
      anyOf: [
        { required: ["email"] },
        { required: ["organizationId"] },
        { required: ["personId"] },
        { required: ["userId"] },
      ],
      properties: {
        email: {
          type: "string",
          description: "Recipient email address.",
        },
        organizationId: {
          type: "string",
          description: "Recipient organization ID.",
        },
        personId: {
          type: "string",
          description: "Recipient person ID.",
        },
        userId: {
          type: "string",
          description: "Recipient user ID.",
        },
        q: {
          type: "string",
          description:
            "Optional search across subject, recipient, task title, and provider email address.",
        },
        limit: {
          type: "number",
          description: "Max rows to return (default 50, max 200).",
        },
      },
    },
  },
  {
    name: "listEmailLogs",
    description:
      "Admin-only: list provider-level email logs, optionally filtered by task, recipient email, user, person, organization, or search text.",
    inputSchema: {
      type: "object" as const,
      properties: {
        email: { type: "string", description: "Recipient email address." },
        organizationId: {
          type: "string",
          description: "Recipient organization ID through task communications.",
        },
        personId: {
          type: "string",
          description: "Recipient person ID through task communications.",
        },
        q: {
          type: "string",
          description:
            "Optional search across subject, recipient, task title, template, and provider message id.",
        },
        taskId: { type: "string", description: "Linked task ID." },
        userId: { type: "string", description: "Recipient user ID." },
        limit: {
          type: "number",
          description: "Max rows to return (default 50, max 200).",
        },
      },
    },
  },
  {
    name: "listCommunications",
    description:
      "List task communications (email, in-app, external URL, manual) across all channels. Admins see everything; other callers see only communications on tasks they created or are assigned to, with recipient emails masked (m***@domain). Suppressed sends surface as FAILED/CANCELLED rows with a suppressionReason.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Filter to one task." },
        organizationId: {
          type: "string",
          description: "Filter by recipient organization ID.",
        },
        personId: {
          type: "string",
          description: "Filter by recipient person ID.",
        },
        sinceIso: {
          type: "string",
          description: "Only rows created at or after this ISO-8601 timestamp.",
        },
        untilIso: {
          type: "string",
          description:
            "Only rows created at or before this ISO-8601 timestamp.",
        },
        channel: {
          type: "string",
          enum: Object.values(TaskCommunicationChannel),
          description: "Filter by communication channel.",
        },
        status: {
          type: "string",
          enum: Object.values(TaskCommunicationStatus),
          description: "Filter by lifecycle status.",
        },
        limit: {
          type: "number",
          description: "Max rows to return (default 50, max 200).",
        },
      },
    },
  },
  {
    name: "getCommunicationLog",
    description:
      "Fetch one task communication by ID: full message body (via the linked task comment), envelope metadata, email delivery details (provider IDs, delivery status), and trigger/idempotency metadata. Same visibility and masking rules as listCommunications.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "TaskCommunication ID." },
      },
      required: ["id"],
    },
  },
  {
    name: "listOrganizations",
    description:
      "List organizations (for example to create task targets), optionally including active/target-filtered tasks.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Search query for name, slug, description, website, or contact email.",
        },
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
        limit: {
          type: "number",
          description: "Max organizations to return (default 100, max 500).",
        },
        taskLimit: {
          type: "number",
          description:
            "Max tasks per organization when includeTasks=true (default 3, max 50).",
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
          description:
            "Task status used when includeTasks=true (default ACTIVE).",
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
        limit: {
          type: "number",
          description: "Max tasks to return (default 50, max 200).",
        },
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
    description:
      "List people (optionally public-figure-only) and optionally include their assigned active tasks.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Search by display name, handle, current affiliation, source ref, or email.",
        },
        publicProfilesOnly: {
          type: "boolean",
          description:
            "When true, only includes people marked as public-figure profiles (default true).",
        },
        includeTasks: {
          type: "boolean",
          description:
            "Include a short active task summary for each person (default false).",
        },
        limit: {
          type: "number",
          description: "Max people to return (default 100, max 500).",
        },
        taskLimit: {
          type: "number",
          description:
            "Max tasks per person when includeTasks=true (default 3, max 50).",
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
          description:
            "Task status used when includeTasks=true (default ACTIVE).",
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
        limit: {
          type: "number",
          description: "Max tasks to return (default 50, max 200).",
        },
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
        email: {
          type: "string",
          description: "Person email (used for de-dup and notification).",
        },
        currentAffiliation: {
          type: "string",
          description: "Current organization/affiliation.",
        },
        countryCode: { type: "string", description: "ISO-3166 country code." },
        image: {
          type: "string",
          description:
            "Avatar image URL. Use uploadImageFromUrl with kind=person-photo first when starting from a remote public image URL.",
        },
        isPublicFigure: {
          type: "boolean",
          description: "Marks this person as a public-facing profile.",
        },
        sourceRef: {
          type: "string",
          description: "Stable source key for idempotent updates.",
        },
        sourceUrl: {
          type: "string",
          description: "Source URL for provenance.",
        },
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
      'Update the authenticated user\'s profile. Person is canonical for the public-facing fields (displayName, handle, bio, headline, coverImage, website, isPublic); this tool writes Person directly. Only fields you supply are changed. Pass `handle: ""` (or null) to clear the handle. Returns the fresh profile.',
    inputSchema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Display name shown across the app.",
        },
        image: {
          type: ["string", "null"],
          description: "Profile avatar image URL.",
        },
        handle: {
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
        ...USER_MATCHING_PROFILE_PROPERTIES,
      },
    },
  },
  {
    name: UPLOAD_IMAGE_FROM_URL_TOOL_NAME,
    description:
      "Fetch a public image URL, normalize it through the same image pipeline used by the web app, upload it to object storage, and return the canonical public URL. Use this before createOrganization/updateOrganization when you have a remote square logo, wordmark, or person photo URL.",
    inputSchema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description:
            "Public http(s) image URL. Local/private network hosts are rejected.",
        },
        kind: {
          type: "string",
          enum: [...IMAGE_UPLOAD_KINDS],
          description:
            "Upload target. Organization logos usually use organization-square-logo and organization-wordmark-logo.",
        },
        filename: {
          type: "string",
          description:
            "Optional filename to use before normalization. Defaults to the URL path filename.",
        },
      },
      required: ["url", "kind"],
    },
  },
  {
    name: "createOrganization",
    description:
      "Create an approved organization for task assignment. Uses post-moderation: create now, reject later if needed.",
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
        slug: {
          type: "string",
          description:
            "Optional URL slug. Defaults to a kebab-case slug generated from name.",
        },
        website: { type: "string", description: "Website URL" },
        contactEmail: { type: "string", description: "Primary contact email" },
        description: {
          type: "string",
          description: "Mission or provenance note",
        },
        status: {
          type: "string",
          enum: ["PENDING", "APPROVED", "REJECTED"],
          description: "Organization status. Defaults to APPROVED.",
        },
        donationUrl: {
          type: "string",
          description: "Direct support or donation page URL",
        },
        squareLogoUrl: {
          type: "string",
          description:
            "Square logo mark URL. Use uploadImageFromUrl with kind=organization-square-logo first when starting from a remote public image URL.",
        },
        wordmarkLogoUrl: {
          type: "string",
          description:
            "Horizontal wordmark logo URL. Use uploadImageFromUrl with kind=organization-wordmark-logo first when starting from a remote public image URL.",
        },
        jurisdictionId: {
          type: "string",
          description: "Optional jurisdiction ID",
        },
      },
      required: ["name", "type"],
    },
  },
  {
    name: "createTask",
    description:
      "Create a task. Visibility defaults to PRIVATE; admin callers get PUBLIC by default when assigneeOrganizationId is set so leader/president/treaty-activation tasks land on the public Earth feed. PUBLIC tasks and PUBLIC organization-assigned defaults are admin-only; pass visibility='PRIVATE' or 'PUBLIC' to override. Non-admin callers requesting PUBLIC get rejected. Tasks default to ACTIVE so they appear in the relevant queue immediately. " +
      "Required: title, description, parentTaskId, category, hours, value, p_success, acceptanceCriteria, impactStatement. Call searchTasks or listTasks first and choose the closest existing parent; Optimize Earth itself is reserved for managed top-level branches. Every required field is load-bearing — a task that omits one either fails validation or lands at score 0 and never surfaces. " +
      "Estimate, don't omit: a calibrated guess with p_success<1 beats no number. State acceptance criteria as a checklist of testable conditions; state impact in one sentence (why this matters). " +
      "Use depends_on for true prerequisites; executor_type='Self' for user work and 'AI Agent' only for autonomous assistant work; deadline_policy='REQUIRED' for must-do legal/health/safety tasks and 'EXPIRES' for opportunities that vanish after due_at. " +
      "The response includes a missingFields[] array — any soft-recommended fields (cash_cost, executor_type, timeToImpactStartDays, taskKey) you skipped will be listed there so you can fill them in via updateTask.",
    inputSchema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Short imperative title" },
        description: {
          type: "string",
          description: "Full explanation and acceptance criteria",
        },
        parentTaskId: {
          type: "string",
          description:
            "Required existing parent task ID. Search the accessible task tree first and choose the closest objective or task; do not use Optimize Earth directly.",
        },
        taskKey: {
          type: "string",
          description: "Stable dedup key (e.g. accountability:us:golf-2025)",
        },
        category: {
          type: "string",
          enum: [
            "ADVOCACY",
            "RESEARCH",
            "COMMUNICATION",
            "ENGINEERING",
            "ORGANIZING",
            "OUTREACH",
            "GOVERNANCE",
            "SCIENCE",
            "LEGAL",
            "CREATIVE",
            "OTHER",
          ],
          description: "Task category",
        },
        skillTags: {
          type: "array",
          items: { type: "string" },
          description: "Skills needed",
        },
        interestTags: {
          type: "array",
          items: { type: "string" },
          description: "Related topics/causes",
        },
        ...TASK_ROUTING_INPUT_PROPERTIES,
        depends_on: {
          type: "array",
          items: { type: "string" },
          description:
            "Alias for blockerTaskIds: existing task IDs that must be VERIFIED before this task appears in active queues. Use only for real prerequisites, not generic importance.",
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
        estimatedEffortHours: {
          type: "number",
          description: "Estimated hours to complete",
        },
        hours: {
          type: "number",
          description:
            "Alias for estimatedEffortHours. Required for reliable priority; use expected user hours, not calendar duration.",
        },
        value: {
          type: "number",
          description:
            "Gross conditional value if the task succeeds. For required tasks, include avoided downside such as penalties, health loss, or system failure.",
        },
        p_success: {
          type: "number",
          description:
            "Success probability, 0-1. MCP computes expected value as value * p_success when value is supplied.",
        },
        cash_cost: {
          type: "number",
          description:
            "Cash cost in USD. Priority converts this to hour-equivalent cost using buybackRate, default $1000/hr.",
        },
        executor_type: {
          type: "string",
          enum: ["Self", "AI Agent"],
          description:
            "Who should execute this task. Use Self for normal user tasks even if AI assists; use AI Agent only for autonomous assistant tasks.",
        },
        expectedEconomicValueUsdBase: {
          type: "number",
          description:
            "Expected economic value in USD-equivalent welfare (probability-adjusted by your model)",
        },
        successProbabilityBase: {
          type: "number",
          description:
            "Estimated success probability for the task outcome, 0-1",
        },
        estimatedCashCostUsdBase: {
          type: "number",
          description: "One-time cash cost expected to execute this task (USD)",
        },
        timeToImpactStartDays: {
          type: "number",
          description:
            "Days until value can start being realized. Metadata/public impact-frame input; not part of personal priority.",
        },
        available_at: {
          type: "string",
          description:
            "Earliest time this task should appear in active queues (ISO 8601). Use for tasks that cannot or should not be started yet.",
        },
        dueAt: { type: "string", description: "Due date (ISO 8601)" },
        due_at: { type: "string", description: "Alias for dueAt" },
        deadline_policy: {
          type: "string",
          enum: ["NONE", "SOFT", "EXPIRES", "REQUIRED"],
          description:
            "Whether due_at is ignored, a soft target, an expiring opportunity, or required work. REQUIRED is for must-do tasks like taxes or medicine refills; EXPIRES is for grants/applications/opportunities that vanish after due_at.",
        },
        deadline_rationale: {
          type: "string",
          description:
            "Freeform rationale for the deadline policy, e.g. taxes must be filed by a legal deadline.",
        },
        claimPolicy: {
          type: "string",
          enum: ["ASSIGNED_ONLY", "OPEN_SINGLE", "OPEN_MANY"],
          description: "Who can claim this task",
        },
        assigneePersonId: {
          type: "string",
          description: "Person ID to assign this task to",
        },
        assigneeOrganizationId: {
          type: "string",
          description: "Organization ID to assign this task to",
        },
        roleTitle: {
          type: "string",
          description: "Role of the assignee (e.g. President, Commissioner)",
        },
        sourceUrl: {
          type: "string",
          description: "URL to the source/evidence for this task",
        },
        contactUrl: {
          type: "string",
          description: "URL for contacting the assignee",
        },
        contactLabel: {
          type: "string",
          description: "Label for the contact channel",
        },
        impactStatement: { type: "string", description: "Why this matters" },
        ev_math: {
          type: "string",
          description:
            "Freeform rationale for value/probability/hour assumptions",
        },
        can_delegate: {
          type: "boolean",
          description: "Whether an agent or contractor can do this task",
        },
        best_route: {
          type: "string",
          description: "Best execution route, e.g. self, agent, contractor",
        },
        acceptanceCriteria: {
          type: "array",
          items: { type: "string" },
          description:
            "Structured acceptance criteria. If omitted, createTask also extracts checklist bullets under a markdown 'Acceptance criteria' heading in description.",
        },
        visibility: {
          type: "string",
          enum: Object.values(TaskVisibility),
          description:
            "Optional visibility override. Defaults to PUBLIC for organization-assigned tasks and PRIVATE otherwise.",
        },
        isPublic: {
          type: "boolean",
          description:
            "Legacy boolean visibility alias. Prefer visibility='PUBLIC' or 'PRIVATE'. Ignored when visibility is supplied.",
        },
        contextJson: TASK_CONTEXT_JSON_SCHEMA,
        sortOrder: {
          type: "number",
          description:
            "Manual display order for public/task-tree views (lower = earlier). Not the computed personal priority score.",
        },
      },
      required: [
        "title",
        "description",
        "parentTaskId",
        "category",
        "impactStatement",
      ],
    },
  },

  {
    name: "deleteTask",
    description:
      "Delete a task by soft delete. Non-admin deletes are scoped to the authenticated creator; admins may delete PUBLIC and non-owned tasks.",
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
        description: {
          type: "string",
          description: "Mission or provenance note",
        },
        donationUrl: {
          type: "string",
          description: "Direct support or donation page URL",
        },
        squareLogoUrl: {
          type: "string",
          description:
            "Square logo mark URL. Use uploadImageFromUrl with kind=organization-square-logo first when starting from a remote public image URL.",
        },
        wordmarkLogoUrl: {
          type: "string",
          description:
            "Horizontal wordmark logo URL. Use uploadImageFromUrl with kind=organization-wordmark-logo first when starting from a remote public image URL.",
        },
        sourceRef: {
          type: "string",
          description: "Stable source reference for idempotent imports",
        },
        sourceUrl: {
          type: "string",
          description: "Source URL proving this organization/contact",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "updateOrganization",
    description:
      "Edit an existing Organization. Caller must be an owner/admin of the org. status and jurisdictionId changes additionally require platform-admin privileges.",
    inputSchema: {
      type: "object" as const,
      properties: {
        organizationId: {
          type: "string",
          description: "Organization ID to update",
        },
        name: { type: "string", description: "New name" },
        slug: {
          type: "string",
          description:
            "New URL slug. Pass empty string to regenerate from the (possibly updated) name. Slug collisions auto-disambiguate with -2, -3, etc.",
        },
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
        },
        status: {
          type: "string",
          enum: ["PENDING", "APPROVED", "REJECTED"],
          description: "Approval status. Platform-admin only.",
        },
        website: {
          type: "string",
          description: "Website URL (empty string clears)",
        },
        description: {
          type: "string",
          description: "Mission or provenance note (empty string clears)",
        },
        donationUrl: {
          type: "string",
          description:
            "Direct support or donation page URL (empty string clears)",
        },
        squareLogoUrl: {
          type: "string",
          description:
            "Square logo mark URL (empty string clears). Use uploadImageFromUrl with kind=organization-square-logo first when starting from a remote public image URL.",
        },
        wordmarkLogoUrl: {
          type: "string",
          description:
            "Horizontal wordmark logo URL (empty string clears). Use uploadImageFromUrl with kind=organization-wordmark-logo first when starting from a remote public image URL.",
        },
        contactEmail: {
          type: "string",
          description: "Primary contact email (empty string clears)",
        },
        jurisdictionId: {
          type: "string",
          description:
            "Jurisdiction ID (empty string clears). Platform-admin only.",
        },
      },
      required: ["organizationId"],
    },
  },
  {
    name: "deleteOrganization",
    description:
      "Soft-delete an Organization (sets deletedAt). Caller must be an owner of the org AND a platform admin. Tasks previously assigned to this org keep their assigneeOrganizationId — orphan visibility is intentional for accountability.",
    inputSchema: {
      type: "object" as const,
      properties: {
        organizationId: {
          type: "string",
          description: "Organization ID to soft-delete",
        },
      },
      required: ["organizationId"],
    },
  },
  {
    name: "addOrganizationMember",
    description:
      "Add a user to an Organization with a given role, or update an existing member's role to that value. Caller must be an owner/admin of the org. Accepts only userId (no email lookup — that would expose User-account enumeration).",
    inputSchema: {
      type: "object" as const,
      properties: {
        organizationId: { type: "string", description: "Organization ID" },
        userId: { type: "string", description: "User ID to add as a member" },
        role: {
          type: "string",
          enum: ["owner", "admin", "member", "viewer"],
          description: "Role within the organization. Default: member.",
        },
      },
      required: ["organizationId", "userId"],
    },
  },
  {
    name: "removeOrganizationMember",
    description:
      "Remove a user from an Organization. Caller must be an owner/admin of the org, OR be removing themselves. Cannot remove the last remaining owner — transfer ownership first by adding another owner.",
    inputSchema: {
      type: "object" as const,
      properties: {
        organizationId: { type: "string", description: "Organization ID" },
        userId: { type: "string", description: "User ID to remove" },
      },
      required: ["organizationId", "userId"],
    },
  },
  {
    name: "updateOrganizationMemberRole",
    description:
      "Change a member's role within an Organization. Caller must be an owner/admin. Cannot demote the last remaining owner.",
    inputSchema: {
      type: "object" as const,
      properties: {
        organizationId: { type: "string", description: "Organization ID" },
        userId: { type: "string", description: "User ID whose role to change" },
        role: {
          type: "string",
          enum: ["owner", "admin", "member", "viewer"],
          description: "New role.",
        },
      },
      required: ["organizationId", "userId", "role"],
    },
  },
  {
    name: "listOrganizationMembers",
    description:
      "List members of an Organization with their roles, emails, and display names. Caller must be an owner/admin of the org.",
    inputSchema: {
      type: "object" as const,
      properties: {
        organizationId: { type: "string", description: "Organization ID" },
      },
      required: ["organizationId"],
    },
  },
  {
    name: "proposeTaskBundle",
    description:
      "Propose a bundle of tasks for review. Creates each as DRAFT, runs validation, returns review decisions. Does NOT auto-promote.",
    inputSchema: {
      type: "object" as const,
      properties: {
        candidates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Short imperative title" },
              description: {
                type: "string",
                description: "Action and acceptance criteria",
              },
              taskKey: { type: "string", description: "Stable key for dedup" },
              id: { type: "string", description: "Draft reference ID" },
              assigneePersonId: { type: "string" },
              assigneeOrganizationId: { type: "string" },
              roleTitle: { type: "string" },
              contactUrl: { type: "string" },
              sourceUrls: { type: "array", items: { type: "string" } },
              blockerRefs: {
                type: "array",
                items: { type: "string" },
                description:
                  "IDs or taskKeys of tasks that must complete first",
              },
              dependencies: {
                type: "array",
                description:
                  "Prerequisites with optional explicit marginal probability or time contribution.",
                items: {
                  type: "object",
                  properties: {
                    taskRef: { type: "string" },
                    probabilityDeltaBase: {
                      type: "number",
                      description: "Probability lift from 0 to 1.",
                    },
                    timeDeltaDaysBase: {
                      type: "number",
                      description: "Days accelerated by the prerequisite.",
                    },
                    assumptions: {
                      type: "array",
                      items: { type: "string" },
                    },
                    calculationVersion: { type: "string" },
                  },
                  required: ["taskRef"],
                },
              },
              parentTaskRef: {
                type: "string",
                description:
                  "Required ID/taskKey of the best existing or same-bundle parent. Search first. Use $target-root only when no more specific parent exists.",
              },
              estimatedEffortHours: { type: "number" },
              isPublic: { type: "boolean" },
              executorType: {
                type: "string",
                enum: ["Self", "AI Agent"],
              },
              bestRoute: { type: "string" },
              dueAt: { type: "string" },
              deadlinePolicy: {
                type: "string",
                enum: ["NONE", "SOFT", "EXPIRES", "REQUIRED"],
              },
              acceptanceCriteria: {
                type: "array",
                items: { type: "string" },
              },
              source: {
                type: "object",
                description:
                  "Stable Notion/manual/external provenance. Long source content stays linked rather than copied into the task body.",
                properties: {
                  sourceKey: { type: "string" },
                  sourceHash: { type: "string" },
                  sourceUrl: { type: "string" },
                  sourceSystem: { type: "string" },
                  title: { type: "string" },
                },
                required: ["sourceKey", "sourceSystem"],
              },
              impact: {
                type: "object",
                properties: {
                  delayDalysLostPerDay: {
                    type: "number",
                    description:
                      "Expected DALYs lost per day of delay; use only with a sourced delay model",
                  },
                  delayEconomicValueUsdLostPerDay: {
                    type: "number",
                    description:
                      "Expected USD-equivalent welfare lost per day of delay; use only with a sourced delay model",
                  },
                  expectedValuePerHourDalys: {
                    type: "number",
                    description:
                      "Probability-weighted expected DALYs per hour, not gross conditional value",
                  },
                  expectedValuePerHourUsd: {
                    type: "number",
                    description:
                      "Probability-weighted expected USD-equivalent welfare per hour, not gross conditional value",
                  },
                  expectedEconomicValueUsdLow: { type: "number" },
                  expectedEconomicValueUsdBase: { type: "number" },
                  expectedEconomicValueUsdHigh: { type: "number" },
                  expectedDalysAvertedLow: { type: "number" },
                  expectedDalysAvertedBase: { type: "number" },
                  expectedDalysAvertedHigh: { type: "number" },
                  medianHealthyLifeYearsEffectLow: { type: "number" },
                  medianHealthyLifeYearsEffectBase: { type: "number" },
                  medianHealthyLifeYearsEffectHigh: { type: "number" },
                  medianIncomeGrowthEffectPpPerYearLow: { type: "number" },
                  medianIncomeGrowthEffectPpPerYearBase: { type: "number" },
                  medianIncomeGrowthEffectPpPerYearHigh: { type: "number" },
                  successProbabilityLow: { type: "number" },
                  successProbabilityBase: { type: "number" },
                  successProbabilityHigh: { type: "number" },
                  estimatedCashCostUsdLow: { type: "number" },
                  estimatedCashCostUsdBase: { type: "number" },
                  estimatedCashCostUsdHigh: { type: "number" },
                  assumptions: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
            },
            required: ["title", "parentTaskRef"],
          },
          description: "Tasks to propose",
        },
      },
      required: ["candidates"],
    },
  },
  {
    name: "promoteTask",
    description:
      "Promote reviewed DRAFT tasks to ACTIVE. Promotion reruns governance review and rejects tasks that fail the current checks.",
    inputSchema: {
      type: "object" as const,
      properties: {
        proposalRefs: {
          type: "array",
          items: { type: "string" },
          description: "Proposal refs (task IDs or taskKeys) to promote",
        },
      },
      required: ["proposalRefs"],
    },
  },
  {
    name: "updateTask",
    description:
      "Update task metadata, estimates, ancestry, dependencies, deadline, or executor. Completion and verification use the execution tools. Passing depends_on replaces the blocker set idempotently, so keep it complete.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID" },
        status: {
          type: "string",
          enum: ["DRAFT", "ACTIVE", "STALE"],
        },
        title: { type: "string" },
        description: { type: "string" },
        parentTaskId: {
          type: "string",
          description:
            "Existing rooted parent task ID. Search first; cannot be Optimize Earth or create a hierarchy cycle.",
        },
        impactStatement: { type: "string" },
        category: {
          type: "string",
          enum: [
            "ADVOCACY",
            "RESEARCH",
            "COMMUNICATION",
            "ENGINEERING",
            "ORGANIZING",
            "OUTREACH",
            "GOVERNANCE",
            "SCIENCE",
            "LEGAL",
            "CREATIVE",
            "OTHER",
          ],
          description:
            "Re-categorize the task. Affects category-filtered listTasks queries; not part of personal priority score.",
        },
        ...TASK_ROUTING_INPUT_PROPERTIES,
        taskKey: { type: "string", description: "Stable dedup key" },
        assigneePersonId: {
          type: "string",
          description: "Person ID to assign (use empty string to clear)",
        },
        assigneeOrganizationId: {
          type: "string",
          description: "Organization ID to assign (use empty string to clear)",
        },
        roleTitle: { type: "string", description: "Role of the assignee" },
        sourceUrl: {
          type: "string",
          description: "URL to the source/evidence",
        },
        available_at: {
          type: "string",
          description:
            "Earliest time this task should appear in active queues (ISO 8601), use empty string to clear",
        },
        dueAt: {
          type: "string",
          description: "Due date (ISO 8601), use empty string to clear",
        },
        due_at: {
          type: "string",
          description: "Alias for dueAt, use empty string to clear",
        },
        deadline_policy: {
          type: "string",
          enum: ["NONE", "SOFT", "EXPIRES", "REQUIRED"],
          description:
            "Whether dueAt is ignored, a soft target, an expiring opportunity, or required work.",
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
          description:
            "Replace blocker dependencies with this exact list of task IDs. Blockers must be completed/VERIFIED before this task appears in active queues.",
        },
        blockerTaskIds: {
          type: "array",
          items: { type: "string" },
          description:
            "Replace blocker dependencies with this exact list of task IDs.",
        },
        hours: {
          type: "number",
          description:
            "Alias for estimatedEffortHours. Keep this current when task scope changes.",
        },
        value: {
          type: "number",
          description:
            "Gross conditional value if the task succeeds. Update when the upside/downside estimate changes.",
        },
        p_success: {
          type: "number",
          description:
            "Success probability, 0-1. Update after new information changes the odds.",
        },
        cash_cost: {
          type: "number",
          description: "Cash cost in USD. Update if execution cost changes.",
        },
        executor_type: {
          type: "string",
          enum: ["Self", "AI Agent"],
          description:
            "Who should execute this task. Use Self for normal user tasks even with AI assistance; AI Agent means autonomous assistant work.",
        },
        ev_math: {
          type: "string",
          description:
            "Freeform rationale for value/probability/hour assumptions",
        },
        can_delegate: {
          type: "boolean",
          description: "Whether an agent or contractor can do this task",
        },
        best_route: {
          type: "string",
          description: "Best execution route, e.g. self, agent, contractor",
        },
        acceptanceCriteria: {
          type: "array",
          items: { type: "string" },
          description:
            "Structured acceptance criteria. If omitted while description is updated, updateTask can extract checklist bullets under a markdown 'Acceptance criteria' heading.",
        },
        sortOrder: {
          type: "number",
          description:
            "Manual display order for public/task-tree views (lower = earlier). Not the computed personal priority score.",
        },
      },
      required: ["taskId"],
    },
  },
  {
    name: "searchParameters",
    description: "Search published parameters used by Optimitron calculations.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Key, display name, or description text.",
        },
        limit: {
          type: "number",
          description: "Maximum results (default 20, max 100).",
        },
      },
    },
  },
  {
    name: "getParameterTrace",
    description:
      "Get one exact parameter revision with formula, uncertainty, pinned input revisions, source metadata, inert calculation code, assumptions, and publication state.",
    inputSchema: {
      type: "object" as const,
      properties: {
        revisionId: {
          type: "string",
          description: "Exact revision id. Preferred for reproducible traces.",
        },
        key: {
          type: "string",
          description: "Parameter key when looking up the current revision.",
        },
      },
    },
  },
  {
    name: "proposeParameterBundle",
    description:
      "Create one or more immutable parameter revision drafts. Returns numerical diffs, formulas or inert calculation code, exact input revisions, and provenance for human review. This never publishes revisions.",
    inputSchema: {
      type: "object" as const,
      properties: {
        parameters: {
          type: "array",
          minItems: 1,
          maxItems: 100,
          items: {
            type: "object",
            properties: {
              key: { type: "string" },
              value: { type: "number" },
              unit: { type: "string" },
              description: { type: "string" },
              displayName: { type: "string" },
              displayValue: { type: "string" },
              sourceType: {
                type: "string",
                enum: [
                  "EXTERNAL",
                  "CALCULATED",
                  "DEFINITION",
                  "AI_ESTIMATED",
                  "CURATED",
                ],
              },
              sourceRef: { type: "string" },
              sourceUrls: {
                type: "array",
                items: { type: "string", format: "uri" },
              },
              calculationSource: {
                type: "object",
                description:
                  "Exact Python, notebook, or other calculation source to retain as inert content-addressed data. Optimitron stores but never executes it.",
                properties: {
                  language: { type: "string" },
                  source: { type: "string" },
                  runtime: { type: "object" },
                  dependencies: {
                    type: "array",
                    items: { type: "string" },
                  },
                  entrypoint: { type: "string" },
                  inputs: { type: "array", items: { type: "object" } },
                  outputs: { type: "array", items: { type: "object" } },
                  notes: { type: "string" },
                },
                required: ["language", "source"],
              },
              formulaText: { type: "string" },
              formulaLatex: { type: "string" },
              manualRef: { type: "string" },
              latexSymbol: { type: "string" },
              confidence: { type: "string" },
              sourceLastUpdated: { type: "string" },
              peerReviewed: { type: "boolean" },
              conservative: { type: "boolean" },
              sensitivity: { type: "number" },
              confidenceIntervalLow: { type: "number" },
              confidenceIntervalHigh: { type: "number" },
              stdError: { type: "number" },
              distributionType: {
                type: "string",
                enum: [
                  "FIXED",
                  "NORMAL",
                  "LOGNORMAL",
                  "BETA",
                  "GAMMA",
                  "TRIANGULAR",
                  "UNIFORM",
                ],
              },
              distributionParameters: { type: "object" },
              summaryStats: { type: "object" },
              validationMin: { type: "number" },
              validationMax: { type: "number" },
              rationale: { type: "string" },
              assumptions: { type: "array", items: { type: "string" } },
              inputs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    symbol: { type: "string" },
                    parameterKey: { type: "string" },
                    revisionId: { type: "string" },
                  },
                  required: ["symbol", "parameterKey"],
                },
              },
            },
            required: ["key", "value", "unit", "description", "rationale"],
          },
        },
      },
      required: ["parameters"],
    },
  },
  {
    name: "reviewParameterRevision",
    description: "Publish or reject one reviewed parameter revision.",
    inputSchema: {
      type: "object" as const,
      properties: {
        revisionId: { type: "string" },
        action: { type: "string", enum: ["publish", "reject"] },
      },
      required: ["revisionId", "action"],
    },
  },
  {
    name: "proposeTaskImpact",
    description:
      "Create an immutable task-impact draft with materialized values, formulas or inert calculation code, exact parameter revision inputs, assumptions, and sources. Public drafts require admin review before use.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string" },
        frameKey: {
          type: "string",
          enum: [
            "IMMEDIATE",
            "ONE_YEAR",
            "FIVE_YEAR",
            "TWENTY_YEAR",
            "LIFETIME",
          ],
        },
        frame: { type: "object", additionalProperties: { type: "number" } },
        metrics: { type: "array", items: { type: "object" } },
        assumptions: { type: "array", items: { type: "string" } },
        formulaText: { type: "string" },
        formulaLatex: { type: "string" },
        calculationCode: { type: "string" },
        calculationLanguage: { type: "string" },
        parameterInputs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              parameterKey: { type: "string" },
              revisionId: { type: "string" },
              symbol: { type: "string" },
            },
            required: ["parameterKey", "symbol"],
          },
        },
        sourceUrls: { type: "array", items: { type: "string" } },
        calculationSource: {
          type: "object",
          description:
            "Exact Python, notebook, or other calculation source to retain as inert content-addressed data. Optimitron stores but never executes it.",
          properties: {
            language: { type: "string" },
            source: { type: "string" },
            runtime: { type: "object" },
            dependencies: { type: "array", items: { type: "string" } },
            entrypoint: { type: "string" },
            inputs: { type: "array", items: { type: "object" } },
            outputs: { type: "array", items: { type: "object" } },
            notes: { type: "string" },
          },
          required: ["language", "source"],
        },
        estimateNotes: { type: "string" },
        calculationVersion: { type: "string" },
        methodologyKey: { type: "string" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "getTaskImpactTrace",
    description:
      "Trace the current or specified task-impact estimate through its formula, materialized values, recursive parameter tree, and source metadata.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string" },
        estimateSetId: { type: "string" },
      },
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
        frameKey: {
          type: "string",
          enum: [
            "IMMEDIATE",
            "ONE_YEAR",
            "FIVE_YEAR",
            "TWENTY_YEAR",
            "LIFETIME",
          ],
          description: "Time horizon for evaluation (default: FIVE_YEAR)",
        },
        frame: {
          type: "object",
          description:
            "Low/base/high impact frame. expectedEconomicValueUsd* is already probability-weighted; for Notion imports use P(success) * Value.",
          properties: {
            evaluationHorizonYears: {
              type: "number",
              description: "Years covered by this estimate",
            },
            successProbabilityLow: {
              type: "number",
              description: "Low success probability, 0-1",
            },
            successProbabilityBase: {
              type: "number",
              description: "Base success probability, 0-1",
            },
            successProbabilityHigh: {
              type: "number",
              description: "High success probability, 0-1",
            },
            delayDalysLostPerDayLow: { type: "number" },
            delayDalysLostPerDayBase: { type: "number" },
            delayDalysLostPerDayHigh: { type: "number" },
            delayEconomicValueUsdLostPerDayLow: { type: "number" },
            delayEconomicValueUsdLostPerDayBase: { type: "number" },
            delayEconomicValueUsdLostPerDayHigh: { type: "number" },
            expectedDalysAvertedLow: { type: "number" },
            expectedDalysAvertedBase: { type: "number" },
            expectedDalysAvertedHigh: { type: "number" },
            expectedEconomicValueUsdLow: {
              type: "number",
              description: "Low probability-weighted USD-equivalent welfare",
            },
            expectedEconomicValueUsdBase: {
              type: "number",
              description: "Base probability-weighted USD-equivalent welfare",
            },
            expectedEconomicValueUsdHigh: {
              type: "number",
              description: "High probability-weighted USD-equivalent welfare",
            },
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
          description:
            "Custom impact metrics (lives lost, taxpayer cost, suffering hours, etc.)",
          items: {
            type: "object",
            properties: {
              metricKey: {
                type: "string",
                description: "Stable key (e.g. lives_lost, taxpayer_cost_usd)",
              },
              baseValue: {
                type: "number",
                description: "Primary estimate (negative = harm)",
              },
              lowValue: { type: "number" },
              highValue: { type: "number" },
              unit: {
                type: "string",
                description: "Unit label (e.g. lives, USD, hours)",
              },
              displayGroup: {
                type: "string",
                description: "UI grouping label",
              },
            },
            required: ["metricKey", "baseValue", "unit"],
          },
        },
        assumptions: {
          type: "array",
          items: { type: "string" },
          description:
            "Human-readable assumptions, including probability gates and why subjective values are plausible",
        },
        sourceUrls: {
          type: "array",
          items: { type: "string" },
          description:
            "Sources/citations for the value, probability, deadline, or conversion assumptions",
        },
        estimateNotes: {
          type: "string",
          description:
            "Short explanation of the calculation and what would change the estimate",
        },
        calculationVersion: {
          type: "string",
          description: "Version tag for the calculation method",
        },
      },
      required: ["taskId"],
    },
  },
  {
    name: "claimTask",
    description: "Claim a task as the authenticated user.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID to claim" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "claimSignerReminder",
    description:
      "Commit to reminding a specific head of state (or other 1% Treaty signer) to sign. Creates a private reminder subtask for you, parented to the signer task. The subtask carries an actionLink to a Google search for the signer's official contact, plus an outreach message template with your referral code embedded so any signer click-through credits you. Idempotent: calling twice with the same signer returns the existing subtask. The subtask auto-VERIFIES when the signer signs the treaty via your referral.",
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
    description:
      "Mark a claimed task as completed with evidence of what was done.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID" },
        completionEvidence: {
          type: "string",
          description: "What was done and proof it worked",
        },
      },
      required: ["taskId", "completionEvidence"],
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
        blockerTaskId: {
          type: "string",
          description: "Task that must complete first",
        },
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
        label: {
          type: "string",
          description: "Optional note describing the dependency",
        },
        notes: {
          type: "string",
          description: "Optional note describing the dependency",
        },
      },
      required: ["blockedTaskId", "blockerTaskId"],
    },
  },
  {
    name: "getBlockers",
    description:
      "Get all tasks blocking a given task, and all tasks this task blocks.",
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
    description:
      "Log an agent's work — what it did, what it cost, what task it advanced.",
    inputSchema: {
      type: "object" as const,
      properties: {
        runId: { type: "string", description: "Unique run identifier" },
        provider: {
          type: "string",
          description: "AI provider (gemini, anthropic, openai)",
        },
        costUsd: { type: "number", description: "Total cost in USD" },
        apiCalls: { type: "number", description: "Number of API calls" },
        taskId: { type: "string", description: "Task this run worked on" },
        agentId: {
          type: "string",
          description:
            "Stable agent identifier, usually matching the lease agentId",
        },
        status: {
          type: "string",
          enum: ["RUNNING", "COMPLETED", "FAILED", "PARTIAL"],
        },
        outputSummary: { type: "string", description: "What the run produced" },
      },
      required: ["runId", "provider", "costUsd", "apiCalls", "taskId"],
    },
  },
  {
    name: "acquireLease",
    description:
      "Acquire a short-lived lease on a task to prevent other agents from working it simultaneously.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID to lease" },
        agentId: { type: "string", description: "Unique agent identifier" },
        leaseSeconds: {
          type: "number",
          description: "Lease duration in seconds (default 600)",
        },
      },
      required: ["taskId", "agentId"],
    },
  },
  {
    name: "heartbeatLease",
    description:
      "Extend an active lease. Call periodically to prevent expiry while working.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID" },
        agentId: { type: "string", description: "Agent identifier" },
        leaseSeconds: {
          type: "number",
          description: "New lease duration in seconds (default 600)",
        },
      },
      required: ["taskId", "agentId"],
    },
  },
  {
    name: "releaseLease",
    description:
      "Voluntarily release a lease so another agent can pick up the task.",
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
        title: {
          type: "string",
          description: "Human-readable referendum title.",
        },
        slug: {
          type: "string",
          description: "Optional URL slug. Defaults to a slugified title.",
        },
        description: {
          type: "string",
          description: "Short public summary for cards, lists, and metadata.",
        },
        question: {
          type: "string",
          description: "Canonical yes/no ballot question voters answer.",
        },
        bodyMarkdown: {
          type: "string",
          description: "Full public referendum detail text in Markdown.",
        },
        kind: {
          type: "string",
          enum: [
            "GENERAL",
            "DECLARATION",
            "TREATY",
            "MEMBERSHIP",
            "COURT_CASE",
            "AMENDMENT",
            "BUDGET",
          ],
          description: "Referendum kind. Defaults to GENERAL.",
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
      required: ["title", "question"],
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
          description:
            "Search string, e.g. a function name, symbol, or code fragment.",
        },
        repo: {
          type: "string",
          description:
            "Repository name or owner/repo. Default: the configured Optimitron repo.",
        },
        path: {
          type: "string",
          description:
            "Optional directory path qualifier, e.g. packages/web/src/lib.",
        },
        fileType: {
          type: "string",
          description: "Optional file extension without a dot, e.g. ts or tsx.",
        },
        limit: {
          type: "number",
          description:
            "Max GitHub code-search results to return (default 10, max 25).",
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
            "Optional domain filter, e.g. optimitron.com, warondisease.org, dfda.earth, dih.earth, or manual.warondisease.org.",
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
    description:
      "Search the Optimitron manual, disease eradication plan, and related documentation. Returns relevant context with citations.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Search query (e.g. 'FDA approval timeline', 'RAPPA preference aggregation')",
        },
        maxResults: {
          type: "number",
          description: "Max results to return (default 5)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "askWishonia",
    description:
      "Ask Wishonia a question — she answers in character using retrieved documentation from the Optimitron manual and disease eradication plan.",
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
        limit: {
          type: "number",
          description: "Max results to return (default 20, max 100)",
        },
        scope: {
          type: "string",
          enum: ["public", "accessible"],
          description:
            "What visibility to search. Use public for public tasks only, accessible for your private + public tasks.",
        },
        status: {
          type: "string",
          enum: ["DRAFT", "ACTIVE", "VERIFIED", "STALE"],
          description:
            "Optional status filter to narrow dependency candidates.",
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
          description:
            "Markdown body (1-20000 chars, supports math/mermaid/chart fences)",
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
    description:
      "Upvote (+1), downvote (-1), or remove vote (0) on a task comment.",
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
    description:
      "Soft-delete your own comment (or any comment if you are a curator).",
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
          description:
            "ISO timestamp cursor from a previous response's nextCursor",
        },
        limit: { type: "number", description: "Default 50, max 100" },
      },
      required: ["taskId"],
    },
  },
  ...TASK_TEMPLATE_TOOL_DEFINITIONS,
  ...TASK_TRIGGER_TOOL_DEFINITIONS,
  ...COLLECTION_TOOL_DEFINITIONS,
  ...DOCUMENT_TOOL_DEFINITIONS,
  ...CONTENT_TOOL_DEFINITIONS,
  ...PRIVATE_EXECUTION_TOOL_DEFINITIONS,
];

function assertToolRegistrationIntegrity(): void {
  const definitionNames = new Set(
    TASK_TOOL_DEFINITIONS.map((tool) => tool.name),
  );
  const duplicateDefinitions = TASK_TOOL_DEFINITIONS.filter(
    (tool, index) =>
      TASK_TOOL_DEFINITIONS.findIndex(
        (candidate) => candidate.name === tool.name,
      ) !== index,
  ).map((tool) => tool.name);
  const definitionsWithoutScopes = [...definitionNames].filter(
    (name) => !TOOL_SCOPES[name],
  );
  const scopesWithoutDefinitions = Object.keys(TOOL_SCOPES).filter(
    (name) => !definitionNames.has(name),
  );
  if (
    duplicateDefinitions.length ||
    definitionsWithoutScopes.length ||
    scopesWithoutDefinitions.length
  ) {
    throw new Error(
      `Invalid MCP tool registry: ${JSON.stringify({
        definitionsWithoutScopes,
        duplicateDefinitions,
        scopesWithoutDefinitions,
      })}`,
    );
  }
}

assertToolRegistrationIntegrity();

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
  options: {
    clientId?: string | null;
    isAdmin?: boolean;
    oauthGrantId?: string | null;
    organizationIds?: readonly string[] | null;
  } = {},
): Server {
  const isAdmin = options.isAdmin === true;
  const organizationIds =
    options.organizationIds === null ? null : (options.organizationIds ?? []);
  const taskClientBoundary = getMcpTaskClientBoundary(scopes, organizationIds);
  async function canAccessTaskResource(
    taskId: string,
    action: Parameters<typeof getTaskAccessWhere>[0]["action"],
  ) {
    if (!userId || !taskId) return false;
    const prisma = await getPrisma();
    const personId = await loadSessionPersonId(userId);
    const task = await prisma.task.findFirst({
      where: {
        AND: [
          getTaskAccessWhere({ action, personId, userId }),
          getTaskClientAccessWhere(taskClientBoundary),
        ],
        deletedAt: null,
        id: taskId,
      },
      select: { id: true },
    });
    return task != null;
  }

  async function canAccessTaskCommentResource(commentId: string) {
    if (!userId || !commentId) return false;
    const prisma = await getPrisma();
    const personId = await loadSessionPersonId(userId);
    const comment = await prisma.taskComment.findFirst({
      where: {
        deletedAt: null,
        id: commentId,
        task: {
          AND: [
            getTaskAccessWhere({
              action: "COMMENT",
              personId,
              userId,
            }),
            getTaskClientAccessWhere(taskClientBoundary),
          ],
          deletedAt: null,
        },
      },
      select: { id: true },
    });
    return comment != null;
  }

  const server = new Server(
    { name: "optimitron-tasks", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  // -- Tool listing (filtered by granted scopes) --
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TASK_TOOL_DEFINITIONS.filter(
      (t) =>
        !DISABLED_TOOLS.has(t.name) &&
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
        return err(
          `Insufficient scope for tool "${name}". Required: ${TOOL_SCOPES[name]?.join(", ")}`,
        );
      }
      if (DISABLED_TOOLS.has(name)) {
        return err(
          `Tool "${name}" is disabled until person merge handles all person-centered relations.`,
        );
      }
      if (ADMIN_ONLY_TOOLS.has(name) && !isAdmin) {
        return err(
          `Admin privileges are required for public/Earth task tool "${name}".`,
        );
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
        if (isTaskTemplateToolName(name)) {
          return handleTaskTemplateToolCall({
            args: a,
            name,
            userId: userId ?? null,
          });
        }
        if (isDocumentToolName(name)) {
          return handleDocumentToolCall({
            args: a,
            name,
            userId: userId ?? null,
          });
        }
        if (isCollectionToolName(name)) {
          return handleCollectionToolCall({
            args: a,
            name,
            userId: userId ?? null,
          });
        }
        if (isContentToolName(name)) {
          return handleContentToolCall({
            args: a,
            name,
            userId: userId ?? null,
          });
        }
        if (isPrivateExecutionToolName(name)) {
          const response = await handlePrivateExecutionToolCall({
            args: a,
            name,
            organizationIds,
            scopes,
            userId: userId ?? null,
          });
          const audit = await writeMcpToolAudit({
            args: a,
            clientId: options.clientId,
            error: response.isError
              ? new Error("Private execution tool returned an error")
              : undefined,
            oauthGrantId: options.oauthGrantId,
            output: response,
            status: response.isError
              ? McpToolCallStatus.FAILED
              : McpToolCallStatus.SUCCEEDED,
            toolName: name,
            userId,
          });
          if (name === "applyPrivateTaskBundle" && !response.isError && audit) {
            const body = JSON.parse(
              response.content[0]?.text ?? "{}",
            ) as Record<string, unknown>;
            return ok({ ...body, auditEvent: audit });
          }
          return response;
        }

        switch (name) {
          case "castReferendumVote": {
            if (!userId)
              return authRequired(
                name,
                "This tool casts your own referendum vote.",
              );
            const earthData = await import("./earth-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              () =>
                earthData.castReferendumVote({
                  answer: enumValue(VotePosition, a.answer, VotePosition.YES),
                  publicComment: (a.publicComment as string) ?? null,
                  referendumSlug: (a.referendumSlug as string) ?? null,
                  userId,
                }),
            );
          }

          case "recordRepresentedReferendumVote": {
            if (!userId)
              return authRequired(
                name,
                "This tool records a represented referendum vote.",
              );
            const personId = (a.personId as string) ?? "";
            if (!personId.trim()) return err("personId is required");
            const earthData = await import("./earth-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              () =>
                earthData.recordRepresentedReferendumVote({
                  answer: enumValue(VotePosition, a.answer, VotePosition.YES),
                  isPublic: a.isPublic !== false,
                  personId,
                  publicComment: (a.publicComment as string) ?? null,
                  referendumSlug: (a.referendumSlug as string) ?? null,
                  userId,
                }),
            );
          }

          case "searchPeople": {
            const earthData = await import("./earth-data.server");
            const people = await earthData.searchPeople({
              limit: typeof a.limit === "number" ? a.limit : undefined,
              publicOnly: isAdmin ? a.publicOnly !== false : true,
              query: (a.query as string) ?? null,
            });
            return ok({ people });
          }

          case "getPerson": {
            const earthData = await import("./earth-data.server");
            const idOrHandle = (
              (a.idOrHandle as string) ??
              (a.personId as string) ??
              ""
            ).trim();
            if (!idOrHandle) return err("idOrHandle or personId is required");
            const person = await earthData.getPerson({
              idOrHandle,
              publicOnly: isAdmin ? a.publicOnly !== false : true,
            });
            return ok({ person });
          }

          case "searchOrganizations": {
            const earthData = await import("./earth-data.server");
            const organizations = await earthData.searchOrganizations({
              limit: typeof a.limit === "number" ? a.limit : undefined,
              query: (a.query as string) ?? null,
            });
            return ok({ organizations });
          }

          case "signReferendumAsOrganization": {
            if (!userId)
              return authRequired(
                name,
                "This tool signs a referendum as an organization.",
              );
            const earthData = await import("./earth-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              () =>
                earthData.signReferendumAsOrganization({
                  ...a,
                  submittedByUserId: userId,
                }),
            );
          }

          case "upsertMemorialPerson": {
            if (!userId)
              return authRequired(
                name,
                "This tool creates sourced people, memorials, and votes.",
              );
            const earthData = await import("./earth-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              () =>
                earthData.upsertMemorialPerson({
                  ...a,
                  submittedByUserId: userId,
                }),
            );
          }

          case "addMemorialEvidence": {
            if (!userId)
              return authRequired(
                name,
                "This tool attaches memorial evidence.",
              );
            const earthData = await import("./earth-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              () =>
                earthData.addMemorialEvidence({
                  ...a,
                  submittedByUserId: userId,
                }),
            );
          }

          case "addMemorialResponsibleParty": {
            if (!userId)
              return authRequired(
                name,
                "This tool attaches memorial responsible-party data.",
              );
            const earthData = await import("./earth-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              () => earthData.addMemorialResponsibleParty(a),
            );
          }

          case "upsertConflict": {
            if (!userId)
              return authRequired(
                name,
                "This tool writes sourced conflict references.",
              );
            const earthData = await import("./earth-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              () => earthData.upsertConflict(a),
            );
          }

          case "resolveGlobalVariable": {
            if (!userId)
              return authRequired(
                name,
                "This tool writes canonical variable references.",
              );
            const earthData = await import("./earth-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              () => earthData.resolveGlobalVariable(a),
            );
          }

          case "upsertSourceArtifact": {
            if (!userId)
              return authRequired(
                name,
                "This tool writes source/provenance artifacts.",
              );
            const earthData = await import("./earth-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              () => earthData.upsertSourceArtifact(a),
            );
          }

          case "upsertCourtCase": {
            if (!userId)
              return authRequired(
                name,
                "This tool drafts Court of Humanity cases.",
              );
            const courtData = await import("./court-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              async () => ({
                case: await courtData.upsertCourtCase({
                  ...a,
                  createdByUserId: userId,
                }),
              }),
            );
          }

          case "addCourtCaseParty": {
            if (!userId)
              return authRequired(
                name,
                "This tool drafts Court of Humanity parties.",
              );
            const courtData = await import("./court-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              async () => ({
                party: await courtData.addCourtCaseParty({
                  ...a,
                  createdByUserId: userId,
                }),
              }),
            );
          }

          case "addCourtCaseClaim": {
            if (!userId)
              return authRequired(
                name,
                "This tool drafts Court of Humanity claims.",
              );
            const courtData = await import("./court-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              async () => ({
                claim: await courtData.addCourtCaseClaim({
                  ...a,
                  createdByUserId: userId,
                }),
              }),
            );
          }

          case "addCourtCaseHarm": {
            if (!userId)
              return authRequired(
                name,
                "This tool drafts Court of Humanity harms.",
              );
            const courtData = await import("./court-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              async () => ({
                harm: await courtData.addCourtCaseHarm({
                  ...a,
                  createdByUserId: userId,
                }),
              }),
            );
          }

          case "addCourtCaseEvidence": {
            if (!userId)
              return authRequired(
                name,
                "This tool drafts Court of Humanity evidence.",
              );
            const courtData = await import("./court-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              async () => ({
                evidence: await courtData.addCourtCaseEvidence({
                  ...a,
                  createdByUserId: userId,
                }),
              }),
            );
          }

          case "addCourtCaseRemedy": {
            if (!userId)
              return authRequired(
                name,
                "This tool drafts Court of Humanity remedies.",
              );
            const courtData = await import("./court-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              async () => ({
                remedy: await courtData.addCourtCaseRemedy({
                  ...a,
                  createdByUserId: userId,
                }),
              }),
            );
          }

          case "getCourtCase": {
            if (!userId)
              return authRequired(
                name,
                "This tool reads Court of Humanity case work.",
              );
            const courtData = await import("./court-data.server");
            return ok({ case: await courtData.getCourtCase(a) });
          }

          case "openCourtCaseJuryVote": {
            if (!userId)
              return authRequired(
                name,
                "This tool opens Court of Humanity jury votes.",
              );
            const courtData = await import("./court-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              () =>
                courtData.openCourtCaseJuryVote({
                  ...a,
                  createdByUserId: userId,
                }),
            );
          }

          case "upsertInterventionApprovalTimeline": {
            if (!userId)
              return authRequired(
                name,
                "This tool writes intervention approval timelines.",
              );
            const earthData = await import("./earth-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              () => earthData.upsertInterventionApprovalTimeline(a),
            );
          }

          case "upsertVariableRelationshipEvidenceEstimate": {
            if (!userId)
              return authRequired(
                name,
                "This tool writes variable relationship evidence.",
              );
            const earthData = await import("./earth-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              () => earthData.upsertVariableRelationshipEvidenceEstimate(a),
            );
          }

          case "recordInterventionExperience": {
            if (!userId)
              return authRequired(
                name,
                "This tool records intervention experiences.",
              );
            const earthData = await import("./earth-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              () =>
                earthData.recordInterventionExperience({
                  ...a,
                  reportedByUserId: userId,
                }),
            );
          }

          case "runEfficacyLagMatcher": {
            if (!userId)
              return authRequired(
                name,
                "This tool writes efficacy-lag evidence candidates.",
              );
            const earthData = await import("./earth-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              () =>
                earthData.runEfficacyLagMatcher({
                  limit: typeof a.limit === "number" ? a.limit : undefined,
                }),
            );
          }

          case RECORD_MEASUREMENT_TOOL_NAME: {
            if (!userId)
              return authRequired(
                name,
                "This tool records your personal tracking measurements.",
              );
            return ok({
              result: await recordTrackingMeasurement(a, userId),
            });
          }

          case "upsertTrackingReminder": {
            if (!userId)
              return authRequired(
                name,
                "This tool manages your personal tracking reminders.",
              );
            return ok({
              result: await upsertTrackingReminderForUser(a, userId),
            });
          }

          case "listTrackingReminders": {
            if (!userId)
              return authRequired(
                name,
                "This tool lists your personal tracking reminders.",
              );
            return ok({
              reminders: await listTrackingRemindersForUser(a, userId),
            });
          }

          case "listDueTrackingReminders": {
            if (!userId)
              return authRequired(
                name,
                "This tool lists your due personal tracking reminders.",
              );
            return ok(await listDueTrackingRemindersForUser(a, userId));
          }

          case "respondToTrackingReminder": {
            if (!userId)
              return authRequired(
                name,
                "This tool records your response to a tracking reminder.",
              );
            return ok({
              result: await respondToTrackingReminderForUser(a, userId),
            });
          }

          case "reportContent": {
            if (!userId)
              return authRequired(
                name,
                "This tool files a crowd-correction report.",
              );
            const earthData = await import("./earth-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              () => earthData.reportContent({ ...a, reportedByUserId: userId }),
            );
          }

          case "suggestCorrection": {
            if (!userId)
              return authRequired(
                name,
                "This tool files a structured correction suggestion.",
              );
            const earthData = await import("./earth-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              () =>
                earthData.suggestCorrection({ ...a, reportedByUserId: userId }),
            );
          }

          case "hideContent": {
            const earthData = await import("./earth-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              () =>
                earthData.hideContent({
                  targetId: (a.targetId as string) ?? "",
                  targetType: (a.targetType as string) ?? "",
                }),
            );
          }

          case "restoreContent": {
            const earthData = await import("./earth-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              () =>
                earthData.restoreContent({
                  targetId: (a.targetId as string) ?? "",
                  targetType: (a.targetType as string) ?? "",
                }),
            );
          }

          case "mergeDuplicatePeople": {
            const earthData = await import("./earth-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              () =>
                earthData.mergeDuplicatePeople({
                  canonicalPersonId: (a.canonicalPersonId as string) ?? "",
                  duplicatePersonId: (a.duplicatePersonId as string) ?? "",
                }),
            );
          }

          case "resolveContentReport": {
            const earthData = await import("./earth-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              () =>
                earthData.resolveContentReport({
                  id: (a.id as string) ?? "",
                  resolutionNote: (a.resolutionNote as string) ?? null,
                  reviewedByUserId: userId ?? null,
                  status: enumValue(
                    ContentReportStatus,
                    a.status,
                    ContentReportStatus.RESOLVED,
                  ),
                }),
            );
          }

          // ── getNextTask ────────────────────────────────────────
          case "getNextTask": {
            const { tasks, ranking, lease } = await getTaskFunctions();
            const allTasks = (await tasks.listTasks({
              limit: 5000,
              visibility: "public",
              status: TaskStatus.ACTIVE,
            })) as PersonalQueueTaskRecord[];
            const executorProfiles: PlanningExecutorProfile[] = [
              {
                accessTags: (a.accessTags as string[]) ?? [],
                credentialTags: (a.credentialTags as string[]) ?? [],
                executorKind: "agent",
                languageTags: (a.languageTags as string[]) ?? [],
                skillTags: (a.skillTags as string[]) ?? [],
                toolTags: (a.toolTags as string[]) ?? [],
              },
            ];
            const graph = await loadExecutionGraphContext(allTasks);
            const planningTasks = await attachPlanningEffortEvidence(
              allTasks,
              executorProfiles,
            );
            const ranked = buildPersonalQueueRows(
              planningTasks,
              ranking,
              parsePositiveNumber(a.buybackRate, DEFAULT_PERSONAL_BUYBACK_RATE),
              {
                executorProfiles,
                limit: 100,
                requireExecutable: true,
                requireUnblocked: true,
                rootedTaskIds: graph.rootedTaskIds,
              },
            );

            const agentId = (a.agentId as string) ?? null;
            const available = [];
            for (const entry of ranked) {
              const taskId = entry.id;
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
            return ok({ score: best.priority, task: best });
          }

          // ── getMyQueue ─────────────────────────────────────────
          case "getMyQueue": {
            if (!userId)
              return authRequired(
                "getMyQueue",
                "It returns your personal queue — tasks you created plus tasks assigned to you — ranked by priority.",
              );

            const { tasks, ranking } = await getTaskFunctions();
            const maxResults = parseQueueLimit(a.maxResults, 20, 100);
            const buybackRate = parsePositiveNumber(
              a.buybackRate,
              DEFAULT_PERSONAL_BUYBACK_RATE,
            );
            const personId = await loadSessionPersonId(userId);
            const personalTasks = await tasks.listTasks({
              clientAccessBoundary: taskClientBoundary,
              limit: 5000,
              status: TaskStatus.ACTIVE,
              userId,
              personId,
              visibility: "personal",
            });
            const graph = await loadExecutionGraphContext(
              personalTasks as PersonalQueueTaskRecord[],
              taskClientBoundary,
            );
            const executorProfiles = await loadHumanPlanningProfiles({
              kind: "self",
              personId,
              userId,
            });
            const selfTasks = (personalTasks as unknown[]).filter((task) =>
              isSelfExecutableTask(task as PersonalQueueTaskRecord),
            ) as PersonalQueueTaskRecord[];
            const planningTasks = await attachPlanningEffortEvidence(
              selfTasks,
              executorProfiles,
            );
            const allRows = buildPersonalQueueRows(
              planningTasks,
              ranking,
              buybackRate,
              {
                executorProfiles,
                limit: selfTasks.length,
                rootedTaskIds: graph.rootedTaskIds,
              },
            );
            const queue = buildPersonalQueueRows(
              planningTasks,
              ranking,
              buybackRate,
              {
                executorProfiles,
                limit: maxResults,
                requireExecutable: true,
                requireUnblocked: true,
                rootedTaskIds: graph.rootedTaskIds,
              },
            );

            return ok({
              buybackRate,
              queue,
              ...summarizeCapabilityWork(allRows),
            });
          }

          // ── getAIQueue ────────────────────────────────────────
          case "getAIQueue": {
            if (!userId)
              return authRequired(
                "getAIQueue",
                'It returns your AI-assigned tasks — there is no "your" without identity.',
              );

            const { tasks, ranking } = await getTaskFunctions();
            const maxResults = parseQueueLimit(a.maxResults, 20, 100);
            const buybackRate = parsePositiveNumber(
              a.buybackRate,
              DEFAULT_PERSONAL_BUYBACK_RATE,
            );
            const personId = await loadSessionPersonId(userId);
            const personalTasks = await tasks.listTasks({
              clientAccessBoundary: taskClientBoundary,
              limit: 5000,
              status: TaskStatus.ACTIVE,
              userId,
              personId,
              visibility: "personal",
            });
            const graph = await loadExecutionGraphContext(
              personalTasks as PersonalQueueTaskRecord[],
              taskClientBoundary,
            );
            const executorProfiles = await loadAgentPlanningProfiles();
            const assignedTasks = (personalTasks as unknown[]).filter((task) =>
              isAIExecutableTask(task as PersonalQueueTaskRecord),
            ) as PersonalQueueTaskRecord[];
            const planningTasks = await attachPlanningEffortEvidence(
              assignedTasks,
              executorProfiles,
            );
            const allRows = buildPersonalQueueRows(
              planningTasks,
              ranking,
              buybackRate,
              {
                executorProfiles,
                limit: assignedTasks.length,
                rootedTaskIds: graph.rootedTaskIds,
              },
            );
            const queue = buildPersonalQueueRows(
              planningTasks,
              ranking,
              buybackRate,
              {
                executorProfiles,
                limit: maxResults,
                requireExecutable: true,
                requireUnblocked: true,
                rootedTaskIds: graph.rootedTaskIds,
              },
            );

            return ok({
              buybackRate,
              queue,
              ...summarizeCapabilityWork(allRows),
            });
          }

          // ── getExecutionPlan ───────────────────────────────────
          case "getExecutionPlan": {
            if (!userId) {
              return authRequired(
                "getExecutionPlan",
                "It builds an authorized personal or organization execution plan.",
              );
            }
            const fixedCommitments = Array.isArray(a.fixedCommitments)
              ? (a.fixedCommitments as Array<Record<string, unknown>>).map(
                  (commitment) => ({
                    endAt: commitment.endAt as string,
                    startAt: commitment.startAt as string,
                    title:
                      typeof commitment.title === "string"
                        ? commitment.title
                        : null,
                  }),
                )
              : [];
            return ok(
              await getAuthorizedExecutionPlan({
                availableMinutes:
                  typeof a.availableMinutes === "number"
                    ? a.availableMinutes
                    : null,
                buybackRate:
                  typeof a.buybackRate === "number" ? a.buybackRate : null,
                clientAccessBoundary: taskClientBoundary,
                fixedCommitments: fixedCommitments as PlanningCommitment[],
                maxResults:
                  typeof a.maxResults === "number" ? a.maxResults : null,
                planningWindowEnd:
                  typeof a.planningWindowEnd === "string"
                    ? a.planningWindowEnd
                    : null,
                planningWindowStart:
                  typeof a.planningWindowStart === "string"
                    ? a.planningWindowStart
                    : null,
                target: asObject(a.target) as
                  | AuthorizedExecutionPlanRequest["target"]
                  | undefined,
                userId,
              }),
            );
          }

          // ── getQueueAudit ──────────────────────────────────────
          case "getQueueAudit": {
            if (!userId)
              return authRequired(
                "getQueueAudit",
                "It audits the validity of your personal queue and needs to know which user's queue to inspect.",
              );

            const prisma = await getPrisma();
            const { tasks, ranking } = await getTaskFunctions();
            const buybackRate = parsePositiveNumber(
              a.buybackRate,
              DEFAULT_PERSONAL_BUYBACK_RATE,
            );
            const personId = await loadSessionPersonId(userId);
            const personalTasks = (await tasks.listTasks({
              clientAccessBoundary: taskClientBoundary,
              limit: 5000,
              status: TaskStatus.ACTIVE,
              userId,
              personId,
              visibility: "personal",
            })) as PersonalQueueTaskRecord[];
            const graph = await loadExecutionGraphContext(
              personalTasks,
              taskClientBoundary,
            );
            const executorProfiles = [
              ...(await loadHumanPlanningProfiles({
                kind: "self",
                personId,
                userId,
              })),
              ...(await loadAgentPlanningProfiles()),
            ];
            const planningTasks = await attachPlanningEffortEvidence(
              personalTasks,
              executorProfiles,
            );
            const activeCreatedTasks = personalTasks.filter(
              (task) => task.createdByUserId === userId,
            ).length;
            const rankedRows = buildPersonalQueueRows(
              planningTasks,
              ranking,
              buybackRate,
              {
                executorProfiles,
                limit: personalTasks.length,
                rootedTaskIds: graph.rootedTaskIds,
              },
            );
            const executableRows = buildPersonalQueueRows(
              planningTasks,
              ranking,
              buybackRate,
              {
                executorProfiles,
                limit: personalTasks.length,
                requireExecutable: true,
                requireUnblocked: true,
                rootedTaskIds: graph.rootedTaskIds,
              },
            );
            const unblockedCount = executableRows.length;

            const rowById = new Map(rankedRows.map((row) => [row.id, row]));
            const issues: Array<{
              code: string;
              message: string;
              severity: "high" | "medium" | "low";
              taskId?: string;
            }> = [];

            const taskIds = personalTasks.map((task) => task.id);
            const dependencyEdges = await prisma.taskEdge.findMany({
              where: {
                OR: [
                  { toTaskId: { in: taskIds } },
                  { fromTaskId: { in: taskIds } },
                ],
                deletedAt: null,
              },
              select: {
                edgeType: true,
                fromTaskId: true,
                probabilityDeltaBase: true,
                timeDeltaDaysBase: true,
                toTaskId: true,
                fromTask: {
                  select: { id: true, deletedAt: true, status: true },
                },
              },
            });
            const orphanedDependencyTaskIds = new Set<string>();
            for (const edge of dependencyEdges) {
              if (!edge.fromTask || edge.fromTask.deletedAt != null) {
                orphanedDependencyTaskIds.add(edge.toTaskId);
              }
            }

            const queueEligibleIds = new Set(
              executableRows.map((row) => row.id),
            );
            const rowByGraphTaskId = new Map(
              rankedRows.map((row) => [row.id, row]),
            );
            const graphFindings = auditExecutionGraph({
              edges: dependencyEdges.map(
                (edge) =>
                  ({
                    edgeType: edge.edgeType,
                    fromTaskId: edge.fromTaskId,
                    probabilityDeltaBase: edge.probabilityDeltaBase,
                    timeDeltaDaysBase: edge.timeDeltaDaysBase,
                    toTaskId: edge.toTaskId,
                  }) satisfies ExecutionGraphEdge,
              ),
              tasks: graph.graphTasks.map((task) => {
                const row = rowByGraphTaskId.get(task.id);
                return {
                  ...task,
                  hasMarginalEstimate: task.hasMarginalEstimate,
                  estimateInputsStale: row?.estimateInputsStale ?? false,
                  estimatePublicationEligible:
                    row?.estimatePublicationEligible ?? false,
                  priority: row?.priority ?? null,
                  queueEligible: queueEligibleIds.has(task.id),
                } satisfies ExecutionGraphTask;
              }),
            }).filter(
              (finding) => !finding.taskId || taskIds.includes(finding.taskId),
            );
            issues.push(...graphFindings);

            for (const task of personalTasks) {
              const row = rowById.get(task.id);
              if (!row) continue;
              const needsExecutionEstimate = isAtomicExecutionRecord(task);

              if (
                needsExecutionEstimate &&
                row.capabilityStatus === "unknown"
              ) {
                issues.push({
                  code: "CAPABILITY_UNKNOWN",
                  message: `Task ${task.id} has required capabilities that are not recorded for its target executor.`,
                  severity: "medium",
                  taskId: task.id,
                });
              }

              if (
                needsExecutionEstimate &&
                row.capabilityStatus === "ineligible"
              ) {
                issues.push({
                  code: "CAPABILITY_MISMATCH",
                  message: `Task ${task.id} requires capabilities its target executor does not have.`,
                  severity: "medium",
                  taskId: task.id,
                });
              }

              if (
                needsExecutionEstimate &&
                row.validationNotes.some((note) =>
                  note.toLowerCase().includes("missing"),
                )
              ) {
                issues.push({
                  code: "MISSING_ESTIMATES",
                  message: `Task ${task.id} is missing required estimate inputs for scoring.`,
                  severity: "medium",
                  taskId: task.id,
                });
              }

              if (needsExecutionEstimate && !row.valid) {
                issues.push({
                  code: "INVALID_SCORE",
                  message: `Task ${task.id} has invalid priority inputs.`,
                  severity: "high",
                  taskId: task.id,
                });
              }

              if (
                row.deadlinePolicy === "REQUIRED" ||
                row.deadlinePolicy === "EXPIRES"
              ) {
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
              if (
                blockerStatuses.some((status) => status !== TaskStatus.VERIFIED)
              ) {
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
                activeCreatedTasks,
                activePersonalTasks: personalTasks.length,
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
                'It returns the top-ranked task in your personal queue. For an anonymous "what should I work on next?", call getNextTask instead.',
              );
            const { tasks, ranking } = await getTaskFunctions();
            const buybackRate = parsePositiveNumber(
              a.buybackRate,
              DEFAULT_PERSONAL_BUYBACK_RATE,
            );
            const personId = await loadSessionPersonId(userId);
            const personalTasks = await tasks.listTasks({
              clientAccessBoundary: taskClientBoundary,
              limit: 5000,
              status: TaskStatus.ACTIVE,
              userId,
              personId,
              visibility: "personal",
            });
            const graph = await loadExecutionGraphContext(
              personalTasks as PersonalQueueTaskRecord[],
              taskClientBoundary,
            );
            const executorProfiles = await loadHumanPlanningProfiles({
              kind: "self",
              personId,
              userId,
            });
            const selfTasks = (personalTasks as unknown[]).filter((task) =>
              isSelfExecutableTask(task as PersonalQueueTaskRecord),
            ) as PersonalQueueTaskRecord[];
            const planningTasks = await attachPlanningEffortEvidence(
              selfTasks,
              executorProfiles,
            );
            const allRows = buildPersonalQueueRows(
              planningTasks,
              ranking,
              buybackRate,
              {
                executorProfiles,
                limit: selfTasks.length,
                rootedTaskIds: graph.rootedTaskIds,
              },
            );
            const queue = buildPersonalQueueRows(
              planningTasks,
              ranking,
              buybackRate,
              {
                executorProfiles,
                limit: selfTasks.length,
                requireExecutable: true,
                requireUnblocked: true,
                rootedTaskIds: graph.rootedTaskIds,
              },
            );
            const selection = selectPersonalNextAction(queue);
            const topAction = selection.task;
            const recommendation =
              selection.deadlineOverride && topAction
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
              ...summarizeCapabilityWork(allRows),
              queueAudit: {
                activeCreatedTasks: personalTasks.filter(
                  (task) =>
                    (task as PersonalQueueTaskRecord).createdByUserId ===
                    userId,
                ).length,
                activePersonalTasks: personalTasks.length,
                unblockedTasks: queue.length,
              },
            });
          }

          case "evaluateTaskEconomics": {
            const { tasks } = await getTaskFunctions();
            const { evaluateEarthTaskEconomics } =
              await import("@optimitron/agent");
            const { getEarthExecutionPolicy } =
              await import("./tasks/action-policy");
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
            const status = a.status
              ? TaskStatus[a.status as keyof typeof TaskStatus]
              : null;
            const category =
              typeof a.category === "string" && a.category in TaskCategory
                ? TaskCategory[a.category as keyof typeof TaskCategory]
                : null;
            const limit = Math.min(Number(a.limit) || 20, 50);
            let assigneePersonId = (a.assigneePersonId as string) ?? null;
            const assigneeOrganizationId =
              (a.assigneeOrganizationId as string) ?? null;
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
            let extendedFilters: {
              applicationPolicy?: TaskApplicationPolicy;
              compensationKind?: TaskCompensationKind;
              engagementKind?: TaskEngagementKind;
              executionMode?: TaskExecutionMode;
              ownerOrganizationId?: string | null;
              remotePolicy?: TaskRemotePolicy;
              requiredTags?: string[];
            };
            try {
              extendedFilters = {
                applicationPolicy: parseEnumInput(
                  TaskApplicationPolicy,
                  a.applicationPolicy,
                  "applicationPolicy",
                ),
                compensationKind: parseEnumInput(
                  TaskCompensationKind,
                  a.compensationKind,
                  "compensationKind",
                ),
                engagementKind: parseEnumInput(
                  TaskEngagementKind,
                  a.engagementKind,
                  "engagementKind",
                ),
                executionMode: parseEnumInput(
                  TaskExecutionMode,
                  a.executionMode,
                  "executionMode",
                ),
                ownerOrganizationId:
                  typeof a.ownerOrganizationId === "string"
                    ? a.ownerOrganizationId
                    : null,
                remotePolicy: parseEnumInput(
                  TaskRemotePolicy,
                  a.remotePolicy,
                  "remotePolicy",
                ),
                requiredTags: parseStringArrayInput(a, "requiredTags"),
              };
            } catch (error) {
              return err(
                error instanceof Error ? error.message : "Invalid filter.",
              );
            }
            const needsExtendedFiltering = Object.values(extendedFilters).some(
              (value) =>
                Array.isArray(value) ? value.length > 0 : value != null,
            );
            const parentTaskIdFilter =
              typeof a.parentTaskId === "string" && a.parentTaskId
                ? a.parentTaskId
                : null;
            const list = await tasks.listTasks({
              status,
              category,
              clientAccessBoundary:
                visibility === "accessible" ? taskClientBoundary : undefined,
              assigneePersonId,
              assigneeOrganizationId,
              parentTaskId: parentTaskIdFilter,
              limit: needsExtendedFiltering ? 5000 : limit,
              userId: visibility === "accessible" ? userId : null,
              visibility,
            });
            // parentTaskId is filtered in the Prisma query above; no in-memory pass.
            let filtered = Array.isArray(list) ? list : [];
            filtered = filtered.filter((task: Record<string, unknown>) => {
              if (
                extendedFilters.ownerOrganizationId &&
                task.ownerOrganizationId !== extendedFilters.ownerOrganizationId
              ) {
                return false;
              }
              for (const fieldName of [
                "applicationPolicy",
                "compensationKind",
                "engagementKind",
                "executionMode",
                "remotePolicy",
              ] as const) {
                const expected = extendedFilters[fieldName];
                if (expected && task[fieldName] !== expected) return false;
              }
              const requiredTags = extendedFilters.requiredTags ?? [];
              if (requiredTags.length > 0) {
                const taskTags = new Set(
                  [
                    ...asStringArray(task.skillTags),
                    ...asStringArray(task.preferredSkillTags),
                    ...asStringArray(task.requiredCredentialTags),
                    ...asStringArray(task.preferredCredentialTags),
                    ...asStringArray(task.requiredLanguageTags),
                    ...asStringArray(task.preferredLanguageTags),
                    ...asStringArray(task.requiredToolTags),
                    ...asStringArray(task.preferredToolTags),
                    ...asStringArray(task.requiredAccessTags),
                    ...asStringArray(task.preferredAccessTags),
                  ].map((tag) => tag.toLowerCase()),
                );
                if (
                  !requiredTags.some((tag) => taskTags.has(tag.toLowerCase()))
                ) {
                  return false;
                }
              }
              return true;
            });
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
            const taskScope =
              a.taskScope === "accessible" ? "accessible" : "public";
            const taskStatus = a.taskStatus
              ? (TaskStatus[a.taskStatus as keyof typeof TaskStatus] ?? null)
              : TaskStatus.ACTIVE;
            const includePrivateTaskScope =
              taskScope === "accessible" && !userId;

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
                        {
                          displayName: { contains: query, mode: "insensitive" },
                        },
                        {
                          currentAffiliation: {
                            contains: query,
                            mode: "insensitive",
                          },
                        },
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
                  clientAccessBoundary:
                    taskScope === "accessible"
                      ? taskClientBoundary
                      : undefined,
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
            if (scope === "accessible" && !userId)
              return err("Authentication required for accessible scope.");

            const status = a.status
              ? (TaskStatus[a.status as keyof typeof TaskStatus] ?? null)
              : TaskStatus.ACTIVE;
            const limit = parseQueueLimit(a.limit, 50, 200);

            const personTasks = await tasks.listTasks({
              assigneePersonId: person.id,
              clientAccessBoundary:
                scope === "accessible" ? taskClientBoundary : undefined,
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
            const taskScope =
              a.taskScope === "accessible" ? "accessible" : "public";
            const taskStatus = a.taskStatus
              ? (TaskStatus[a.taskStatus as keyof typeof TaskStatus] ??
                TaskStatus.ACTIVE)
              : TaskStatus.ACTIVE;
            if (taskScope === "accessible" && !userId) {
              return err("Authentication required for taskScope=accessible.");
            }
            const organizationWhere = {
              deletedAt: null,
              ...(a.status
                ? { status: enumValue(OrgStatus, a.status, OrgStatus.APPROVED) }
                : {}),
              ...(a.type
                ? { type: enumValue(OrgType, a.type, OrgType.OTHER) }
                : {}),
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
                  clientAccessBoundary:
                    taskScope === "accessible"
                      ? taskClientBoundary
                      : undefined,
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
            if (scope === "accessible" && !userId)
              return err("Authentication required for accessible scope.");

            const status = a.status
              ? (TaskStatus[a.status as keyof typeof TaskStatus] ?? null)
              : TaskStatus.ACTIVE;
            const limit = parseQueueLimit(a.limit, 50, 200);

            const organizationTasks = await tasks.listTasks({
              assigneeOrganizationId: organization.id,
              clientAccessBoundary:
                scope === "accessible" ? taskClientBoundary : undefined,
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
              clientAccessBoundary:
                scope === "accessible" ? taskClientBoundary : undefined,
              limit,
              userId: scope === "accessible" ? userId : null,
              status,
            });

            return ok(results);
          }

          // ── getTask ────────────────────────────────────────────
          case "getTask": {
            const { tasks } = await getTaskFunctions();
            const taskId = requiredString(a.taskId, "taskId");
            if (typeof taskId !== "string") return taskId;
            const result = await tasks.getTaskDetailData(
              taskId,
              userId ?? null,
              { clientAccessBoundary: taskClientBoundary },
            );
            if (!result) return err("Task not found");
            return ok({
              task: enrichTaskForMcp(result.task),
              taskCommunicationCount: result.taskCommunicationCount,
            });
          }

          case "findTasksForUser": {
            if (!userId) {
              return authRequired(
                name,
                "This tool ranks tasks for an authenticated user.",
              );
            }
            const targetUserId = optionalString(a.userId) ?? userId;
            if (targetUserId !== userId && !isAdmin) {
              return err(
                "Admin privileges are required to rank another user's tasks.",
              );
            }
            const prisma = await getPrisma();
            const { tasks, ranking } = await getTaskFunctions();
            const user = await prisma.user.findUnique({
              where: { id: targetUserId },
              select: USER_MATCHING_SELECT,
            });
            if (!user) return err("User not found.");
            const limit = parseQueueLimit(a.limit, 20, 50);
            const taskRows = await tasks.listTasks({
              clientAccessBoundary: taskClientBoundary,
              limit: 5000,
              personId: user.personId,
              status: TaskStatus.ACTIVE,
              userId: targetUserId,
              visibility: "accessible",
            });
            const ranked = ranking.rankTasksForUser(
              taskRows as RankableTask[],
              toRankableUser(user),
              limit,
              { preferLeafExecution: a.preferLeafExecution !== false },
            );
            return ok({
              user: summarizeMatchingUser(user),
              tasks: ranked.map((entry) => ({
                score: entry.score,
                task: summarizeTask(entry.task as unknown as SummarizableTask),
              })),
            });
          }

          case "applyToTask": {
            if (!userId) {
              return authRequired(
                name,
                "This tool submits a task application.",
              );
            }
            const taskId = requiredString(a.taskId, "taskId");
            if (typeof taskId !== "string") return taskId;
            const prisma = await getPrisma();
            const applications = await import("./task-applications.server");
            const [task, user] = await Promise.all([
              prisma.task.findFirst({
                where: { deletedAt: null, id: taskId },
                select: {
                  applicationPolicy: true,
                  id: true,
                  jurisdictionId: true,
                  title: true,
                },
              }),
              prisma.user.findUnique({
                where: { id: userId },
                select: USER_MATCHING_SELECT,
              }),
            ]);
            if (!task) return err("Task not found.");
            if (!user) return err("User not found.");
            if (task.applicationPolicy === TaskApplicationPolicy.CLOSED) {
              const canReview = await applications.canReviewTaskApplications(
                userId,
                taskId,
              );
              if (!canReview) {
                return err("This task is not accepting applications.");
              }
            }

            const answersJson =
              "answersJson" in a
                ? normalizeJsonPatchValue(a.answersJson)
                : undefined;
            const application = await prisma.$transaction(async (tx) => {
              const existing = await tx.taskApplication.findFirst({
                where: {
                  applicantUserId: userId,
                  deletedAt: null,
                  taskId,
                },
                select: { id: true, jurisdictionId: true, status: true },
              });
              const applicationData = {
                applicantEmailSnapshot:
                  optionalString(a.applicantEmailSnapshot) ?? user.email,
                applicantNameSnapshot:
                  optionalString(a.applicantNameSnapshot) ??
                  user.person?.displayName ??
                  user.email,
                applicationMessage: optionalString(a.applicationMessage),
                answersJson,
                originUrl: optionalString(a.originUrl),
                utmJson:
                  "utmJson" in a
                    ? normalizeJsonPatchValue(a.utmJson)
                    : undefined,
              };
              if (existing) {
                const updated = await tx.taskApplication.update({
                  where: { id: existing.id },
                  data: Object.fromEntries(
                    Object.entries(applicationData).filter(
                      ([, value]) => value !== undefined,
                    ),
                  ) as any,
                  select: applications.applicationSelect,
                });
                await tx.taskApplicationEvent.create({
                  data: {
                    actorUserId: userId,
                    applicationId: existing.id,
                    eventType: TaskApplicationEventType.COMMENTED,
                    jurisdictionId: existing.jurisdictionId,
                    note: optionalString(a.applicationMessage),
                  },
                });
                return updated;
              }
              const created = await tx.taskApplication.create({
                data: {
                  ...applicationData,
                  applicantPersonId: user.personId,
                  applicantUserId: userId,
                  jurisdictionId: task.jurisdictionId,
                  taskId,
                } as any,
                select: applications.applicationSelect,
              });
              await tx.taskApplicationEvent.create({
                data: {
                  actorUserId: userId,
                  applicationId: created.id,
                  eventType: TaskApplicationEventType.CREATED,
                  jurisdictionId: task.jurisdictionId,
                  note: optionalString(a.applicationMessage),
                  toStatus: TaskApplicationStatus.APPLIED,
                },
              });
              return created;
            });
            return ok({
              application,
              task: { id: task.id, title: task.title },
            });
          }

          case "listTaskApplications": {
            if (!userId) {
              return authRequired(name, "This tool lists task applications.");
            }
            const taskId = requiredString(a.taskId, "taskId");
            if (typeof taskId !== "string") return taskId;
            const applications = await import("./task-applications.server");
            if (!isAdmin) {
              try {
                await applications.assertCanReviewTaskApplications(
                  userId,
                  taskId,
                );
              } catch (error) {
                return err(
                  error instanceof Error ? error.message : "Forbidden",
                );
              }
            }
            return ok({
              applications: await applications.getTaskApplications(taskId),
              taskId,
            });
          }

          case "reviewTaskApplication": {
            if (!userId) {
              return authRequired(
                name,
                "This tool reviews a task application.",
              );
            }
            const applicationId = requiredString(
              a.applicationId,
              "applicationId",
            );
            if (typeof applicationId !== "string") return applicationId;
            const prisma = await getPrisma();
            const applications = await import("./task-applications.server");
            const existing = await prisma.taskApplication.findUnique({
              where: { id: applicationId },
              select: {
                applicantPersonId: true,
                applicantUser: { select: { personId: true } },
                deletedAt: true,
                taskId: true,
              },
            });
            if (!existing || existing.deletedAt)
              return err("Application not found.");
            if (!isAdmin) {
              try {
                await applications.assertCanReviewTaskApplications(
                  userId,
                  existing.taskId,
                );
              } catch (error) {
                return err(
                  error instanceof Error ? error.message : "Forbidden",
                );
              }
            }
            let status: TaskApplicationStatus | undefined;
            try {
              status = parseEnumInput(
                TaskApplicationStatus,
                a.status,
                "status",
              );
            } catch (error) {
              return err(
                error instanceof Error ? error.message : "Invalid status.",
              );
            }
            let reviewScore: number | null | undefined;
            try {
              reviewScore = parseOptionalIntegerInput(a, "reviewScore");
            } catch (error) {
              return err(
                error instanceof Error ? error.message : "Invalid reviewScore.",
              );
            }
            const updated = await applications.updateTaskApplication(
              applicationId,
              {
                answersJson:
                  "answersJson" in a
                    ? (normalizeJsonPatchValue(a.answersJson) as Record<
                        string,
                        unknown
                      > | null)
                    : undefined,
                reviewerUserId: userId,
                reviewNote:
                  "reviewNote" in a
                    ? (a.reviewNote as string | null)
                    : undefined,
                reviewScore:
                  reviewScore === undefined ? undefined : reviewScore,
                status,
              },
            );
            const shouldAssign =
              a.assignTaskOnAccept === true &&
              status === TaskApplicationStatus.ACCEPTED;
            const assigneePersonId =
              updated.applicantPerson?.id ??
              updated.applicantUser?.person?.id ??
              existing.applicantPersonId ??
              existing.applicantUser?.personId ??
              null;
            if (shouldAssign && assigneePersonId) {
              await prisma.task.update({
                where: { id: existing.taskId },
                data: { assigneePersonId },
              });
            }
            return ok({
              application: updated,
              assignedTaskToPersonId:
                shouldAssign && assigneePersonId ? assigneePersonId : null,
            });
          }

          case "findTaskCandidates": {
            if (!isAdmin) return err("Admin privileges are required.");
            const taskId = requiredString(a.taskId, "taskId");
            if (typeof taskId !== "string") return taskId;
            const prisma = await getPrisma();
            const { tasks, ranking } = await getTaskFunctions();
            const detail = await tasks.getTaskDetailData(
              taskId,
              userId ?? null,
              { clientAccessBoundary: taskClientBoundary },
            );
            if (!detail) return err("Task not found.");
            const task = detail.task as Record<string, unknown>;
            const limit = parseQueueLimit(a.limit, 20, 100);
            const users = await prisma.user.findMany({
              where: {
                deletedAt: null,
                isSystem: false,
              },
              select: USER_MATCHING_SELECT,
              take: Math.max(limit * 5, 50),
            });
            const userCandidates = users
              .map((candidate) => ({
                candidateKind: TaskCandidateKind.USER,
                candidateKey: `user:${candidate.id}`,
                candidateUserId: candidate.id,
                person: candidate.person,
                reasonJson: {
                  accessTags: candidate.accessTags,
                  credentialTags: candidate.credentialTags,
                  languageTags: candidate.languageTags,
                  skillTags: candidate.skillTags,
                  toolTags: candidate.toolTags,
                },
                score: ranking.scoreTaskForUser(
                  task as unknown as RankableTask,
                  toRankableUser(candidate),
                ),
              }))
              .filter((candidate) => candidate.score > 0);
            const includeAgents = a.includeAgents !== false;
            const agentCandidates = includeAgents
              ? (
                  await prisma.agentExecutor.findMany({
                    where: {
                      deletedAt: null,
                      status: AgentExecutorStatus.ACTIVE,
                    },
                    orderBy: [{ updatedAt: "desc" }],
                    take: Math.max(limit * 2, 20),
                  })
                ).map((agent) => ({
                  agentExecutorId: agent.id,
                  agentKey: agent.agentKey,
                  candidateKind: TaskCandidateKind.AGENT,
                  candidateKey: `agent:${agent.id}`,
                  displayName: agent.displayName,
                  reasonJson: {
                    accessTags: agent.accessTags,
                    capabilityTags: agent.capabilityTags,
                    toolTags: agent.toolTags,
                  },
                  score: scoreAgentCandidate(task, agent as any),
                }))
              : [];
            const candidates = [...userCandidates, ...agentCandidates]
              .sort((left, right) => right.score - left.score)
              .slice(0, limit);
            return ok({
              candidates,
              task: summarizeTask(task as SummarizableTask),
            });
          }

          case "saveTaskCandidateMatch": {
            if (!isAdmin) return err("Admin privileges are required.");
            const prisma = await getPrisma();
            const taskId = requiredString(a.taskId, "taskId");
            if (typeof taskId !== "string") return taskId;
            const task = await prisma.task.findFirst({
              where: { deletedAt: null, id: taskId },
              select: { id: true, jurisdictionId: true },
            });
            if (!task) return err("Task not found.");
            let candidateKind: TaskCandidateKind;
            let status: TaskCandidateMatchStatus;
            try {
              const parsedKind = parseEnumInput(
                TaskCandidateKind,
                a.candidateKind,
                "candidateKind",
              );
              if (!parsedKind) throw new Error("candidateKind is required.");
              candidateKind = parsedKind;
              status =
                parseEnumInput(TaskCandidateMatchStatus, a.status, "status") ??
                TaskCandidateMatchStatus.SUGGESTED;
            } catch (error) {
              return err(
                error instanceof Error ? error.message : "Invalid candidate.",
              );
            }
            const score = parseFiniteNumber(a.score);
            if (score == null) return err("score must be a finite number.");
            const scoreVersion =
              optionalString(a.scoreVersion) ?? "mcp-match-v1";
            const candidateUserId = optionalString(a.candidateUserId);
            const candidatePersonId = optionalString(a.candidatePersonId);
            const candidateOrganizationId = optionalString(
              a.candidateOrganizationId,
            );
            const agentExecutorId = optionalString(a.agentExecutorId);
            let candidateKey: string;
            try {
              candidateKey = deriveCandidateKey({
                agentExecutorId,
                candidateKey: optionalString(a.candidateKey),
                candidateKind,
                candidateOrganizationId,
                candidatePersonId,
                candidateUserId,
              });
            } catch (error) {
              return err(
                error instanceof Error
                  ? error.message
                  : "Invalid candidate key.",
              );
            }
            let estimatedCostMinorUnits: bigint | null | undefined;
            let estimatedDurationSeconds: number | null | undefined;
            try {
              estimatedCostMinorUnits = parseMinorUnitsInput(
                a,
                "estimatedCostMinorUnits",
              );
              estimatedDurationSeconds = parseOptionalIntegerInput(
                a,
                "estimatedDurationSeconds",
              );
            } catch (error) {
              return err(
                error instanceof Error
                  ? error.message
                  : "Invalid candidate estimate.",
              );
            }
            const match = await prisma.taskCandidateMatch.upsert({
              where: {
                taskId_candidateKey_scoreVersion: {
                  candidateKey,
                  scoreVersion,
                  taskId,
                },
              },
              create: {
                agentExecutorId,
                blockersJson:
                  "blockersJson" in a
                    ? normalizeJsonPatchValue(a.blockersJson)
                    : undefined,
                candidateKey,
                candidateKind,
                candidateOrganizationId,
                candidatePersonId,
                candidateUserId,
                estimatedCostCurrency: optionalString(a.estimatedCostCurrency),
                estimatedCostMinorUnits,
                estimatedDurationSeconds:
                  estimatedDurationSeconds === undefined
                    ? undefined
                    : estimatedDurationSeconds,
                jurisdictionId: task.jurisdictionId,
                reasonJson:
                  "reasonJson" in a
                    ? normalizeJsonPatchValue(a.reasonJson)
                    : undefined,
                score,
                scoreVersion,
                status,
                taskId,
              } as any,
              update: {
                agentExecutorId,
                blockersJson:
                  "blockersJson" in a
                    ? normalizeJsonPatchValue(a.blockersJson)
                    : undefined,
                candidateOrganizationId,
                candidatePersonId,
                candidateUserId,
                estimatedCostCurrency: optionalString(a.estimatedCostCurrency),
                estimatedCostMinorUnits,
                estimatedDurationSeconds:
                  estimatedDurationSeconds === undefined
                    ? undefined
                    : estimatedDurationSeconds,
                reasonJson:
                  "reasonJson" in a
                    ? normalizeJsonPatchValue(a.reasonJson)
                    : undefined,
                score,
                status,
              } as any,
            });
            return ok({ match: summarizeCandidateMatch(match as any) });
          }

          case "listTaskCandidateMatches": {
            if (!userId) {
              return authRequired(
                name,
                "This tool lists task candidate matches.",
              );
            }
            const taskId = requiredString(a.taskId, "taskId");
            if (typeof taskId !== "string") return taskId;
            const prisma = await getPrisma();
            if (!isAdmin) {
              const applications = await import("./task-applications.server");
              try {
                await applications.assertCanReviewTaskApplications(
                  userId,
                  taskId,
                );
              } catch (error) {
                return err(
                  error instanceof Error ? error.message : "Forbidden",
                );
              }
            }
            let status: TaskCandidateMatchStatus | undefined;
            try {
              status = parseEnumInput(
                TaskCandidateMatchStatus,
                a.status,
                "status",
              );
            } catch (error) {
              return err(
                error instanceof Error ? error.message : "Invalid status.",
              );
            }
            const matches = await prisma.taskCandidateMatch.findMany({
              where: {
                deletedAt: null,
                taskId,
                ...(status ? { status } : {}),
              },
              orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
              take: parseQueueLimit(a.limit, 50, 200),
              include: {
                agentExecutor: true,
                candidateOrganization: {
                  select: { id: true, name: true, slug: true, type: true },
                },
                candidatePerson: {
                  select: {
                    displayName: true,
                    handle: true,
                    id: true,
                    image: true,
                  },
                },
                candidateUser: {
                  select: {
                    email: true,
                    id: true,
                    person: {
                      select: { displayName: true, handle: true, id: true },
                    },
                  },
                },
              },
            });
            return ok({
              matches: matches.map((match) =>
                summarizeCandidateMatch(match as any),
              ),
            });
          }

          case "updateTaskCandidateMatchStatus": {
            if (!isAdmin) return err("Admin privileges are required.");
            const matchId = requiredString(a.matchId, "matchId");
            if (typeof matchId !== "string") return matchId;
            let status: TaskCandidateMatchStatus | undefined;
            try {
              status = parseEnumInput(
                TaskCandidateMatchStatus,
                a.status,
                "status",
              );
            } catch (error) {
              return err(
                error instanceof Error ? error.message : "Invalid status.",
              );
            }
            if (!status) return err("status is required.");
            const prisma = await getPrisma();
            const match = await prisma.taskCandidateMatch.update({
              where: { id: matchId },
              data: {
                blockersJson:
                  "blockersJson" in a
                    ? normalizeJsonPatchValue(a.blockersJson)
                    : undefined,
                reasonJson:
                  "reasonJson" in a
                    ? normalizeJsonPatchValue(a.reasonJson)
                    : undefined,
                status,
              } as any,
            });
            return ok({ match: summarizeCandidateMatch(match as any) });
          }

          case "listAgentExecutors": {
            if (!isAdmin) return err("Admin privileges are required.");
            const prisma = await getPrisma();
            let status: AgentExecutorStatus | undefined;
            let capabilityTags: string[] | undefined;
            try {
              status = parseEnumInput(AgentExecutorStatus, a.status, "status");
              capabilityTags = parseStringArrayInput(a, "capabilityTags");
            } catch (error) {
              return err(
                error instanceof Error ? error.message : "Invalid filter.",
              );
            }
            const agents = await prisma.agentExecutor.findMany({
              where: {
                deletedAt: null,
                ...(status ? { status } : {}),
                ...(optionalString(a.provider)
                  ? { provider: optionalString(a.provider) }
                  : {}),
                ...(capabilityTags && capabilityTags.length > 0
                  ? { capabilityTags: { hasSome: capabilityTags } }
                  : {}),
              },
              orderBy: [{ updatedAt: "desc" }],
              take: parseQueueLimit(a.limit, 50, 200),
            });
            return ok({ agents: toJsonSafe(agents) });
          }

          case "upsertAgentExecutor": {
            if (!isAdmin) return err("Admin privileges are required.");
            const agentKey = requiredString(a.agentKey, "agentKey");
            if (typeof agentKey !== "string") return agentKey;
            const displayName = requiredString(a.displayName, "displayName");
            if (typeof displayName !== "string") return displayName;
            let status: AgentExecutorStatus;
            try {
              status =
                parseEnumInput(AgentExecutorStatus, a.status, "status") ??
                AgentExecutorStatus.ACTIVE;
            } catch (error) {
              return err(
                error instanceof Error ? error.message : "Invalid status.",
              );
            }
            const prisma = await getPrisma();
            let data: Record<string, unknown>;
            try {
              data = {
                accessTags: parseStringArrayInput(a, "accessTags") ?? [],
                averageCostUsd:
                  parseOptionalFiniteNumberInput(a, "averageCostUsd") ?? null,
                averageLatencySeconds:
                  parseOptionalFiniteNumberInput(a, "averageLatencySeconds") ??
                  null,
                capabilityTags:
                  parseStringArrayInput(a, "capabilityTags") ?? [],
                displayName,
                metadata:
                  "metadata" in a
                    ? normalizeJsonPatchValue(a.metadata)
                    : undefined,
                modelName: optionalStringInput(a, "modelName"),
                provider: optionalStringInput(a, "provider"),
                status,
                successRate:
                  parseOptionalFiniteNumberInput(a, "successRate") ?? null,
                toolTags: parseStringArrayInput(a, "toolTags") ?? [],
              };
            } catch (error) {
              return err(
                error instanceof Error
                  ? error.message
                  : "Invalid agent executor field.",
              );
            }
            const agent = await prisma.agentExecutor.upsert({
              where: { agentKey },
              create: { ...data, agentKey } as any,
              update: data as any,
            });
            return ok({ agent: toJsonSafe(agent) });
          }

          case "setAgentExecutorStatus": {
            if (!isAdmin) return err("Admin privileges are required.");
            const agentKey = requiredString(a.agentKey, "agentKey");
            if (typeof agentKey !== "string") return agentKey;
            let status: AgentExecutorStatus | undefined;
            try {
              status = parseEnumInput(AgentExecutorStatus, a.status, "status");
            } catch (error) {
              return err(
                error instanceof Error ? error.message : "Invalid status.",
              );
            }
            if (!status) return err("status is required.");
            const prisma = await getPrisma();
            const agent = await prisma.agentExecutor.update({
              where: { agentKey },
              data: { status },
            });
            return ok({ agent: toJsonSafe(agent) });
          }

          case "listTaskEmails": {
            const taskId = requiredString(a.taskId, "taskId");
            if (typeof taskId !== "string") return taskId;
            const adminCommunications =
              await import("./admin-communications.server");
            const filters = {
              email: optionalString(a.email),
              limit: parseQueueLimit(a.limit, 50, 200),
              q: optionalString(a.q),
              taskId,
            };
            const [communications, emailLogs] = await Promise.all([
              adminCommunications.listAdminTaskEmailCommunications(filters),
              adminCommunications.listAdminEmailLogs(filters),
            ]);
            return ok({
              communications: communications.communications,
              communicationTotal: communications.total,
              emailLogs: emailLogs.emailLogs,
              emailLogTotal: emailLogs.total,
              limit: communications.limit,
            });
          }

          case "listRecipientEmails": {
            const filters = {
              email: optionalString(a.email),
              limit: parseQueueLimit(a.limit, 50, 200),
              organizationId: optionalString(a.organizationId),
              personId: optionalString(a.personId),
              q: optionalString(a.q),
              userId: optionalString(a.userId),
            };
            if (
              !filters.email &&
              !filters.organizationId &&
              !filters.personId &&
              !filters.userId
            ) {
              return err(
                "Pass at least one recipient filter: email, userId, personId, or organizationId.",
              );
            }
            const adminCommunications =
              await import("./admin-communications.server");
            const [communications, emailLogs] = await Promise.all([
              adminCommunications.listAdminTaskEmailCommunications(filters),
              adminCommunications.listAdminEmailLogs(filters),
            ]);
            return ok({
              communications: communications.communications,
              communicationTotal: communications.total,
              emailLogs: emailLogs.emailLogs,
              emailLogTotal: emailLogs.total,
              limit: communications.limit,
            });
          }

          case "listEmailLogs": {
            const adminCommunications =
              await import("./admin-communications.server");
            return ok(
              await adminCommunications.listAdminEmailLogs({
                email: optionalString(a.email),
                limit: parseQueueLimit(a.limit, 50, 200),
                organizationId: optionalString(a.organizationId),
                personId: optionalString(a.personId),
                q: optionalString(a.q),
                taskId: optionalString(a.taskId),
                userId: optionalString(a.userId),
              }),
            );
          }

          case "listCommunications": {
            if (!userId && !isAdmin) {
              return authRequired(
                name,
                "Non-admin communication reads are scoped to tasks you created or are assigned to.",
              );
            }
            const channel = optionalString(a.channel);
            if (channel && !(channel in TaskCommunicationChannel)) {
              return err(
                `channel must be one of: ${Object.values(TaskCommunicationChannel).join(", ")}.`,
              );
            }
            const status = optionalString(a.status);
            if (status && !(status in TaskCommunicationStatus)) {
              return err(
                `status must be one of: ${Object.values(TaskCommunicationStatus).join(", ")}.`,
              );
            }
            const sinceIso = optionalString(a.sinceIso);
            const since = sinceIso ? new Date(sinceIso) : null;
            if (since && Number.isNaN(since.getTime())) {
              return err("sinceIso must be an ISO-8601 timestamp.");
            }
            const untilIso = optionalString(a.untilIso);
            const until = untilIso ? new Date(untilIso) : null;
            if (until && Number.isNaN(until.getTime())) {
              return err("untilIso must be an ISO-8601 timestamp.");
            }
            const personId = userId ? await loadSessionPersonId(userId) : null;
            // userId is undefined for anonymous admin stdio sessions —
            // normalize explicitly so the viewer scope stays typed.
            const sessionUserId = typeof userId === "string" ? userId : null;
            const audit = await import("./communications-audit.server");
            return ok(
              await audit.listCommunicationsForViewer(
                { isAdmin, personId, userId: sessionUserId },
                {
                  channel: channel as TaskCommunicationChannel | null,
                  limit: typeof a.limit === "number" ? a.limit : null,
                  organizationId: optionalString(a.organizationId),
                  personId: optionalString(a.personId),
                  since,
                  status: status as TaskCommunicationStatus | null,
                  taskId: optionalString(a.taskId),
                  until,
                },
              ),
            );
          }

          case "getCommunicationLog": {
            if (!userId && !isAdmin) {
              return authRequired(
                name,
                "Non-admin communication reads are scoped to tasks you created or are assigned to.",
              );
            }
            const id = requiredString(a.id, "id");
            if (typeof id !== "string") return id;
            const personId = userId ? await loadSessionPersonId(userId) : null;
            // userId is undefined for anonymous admin stdio sessions —
            // normalize explicitly so the viewer scope stays typed.
            const sessionUserId = typeof userId === "string" ? userId : null;
            const audit = await import("./communications-audit.server");
            const communication = await audit.getCommunicationLogForViewer(
              { isAdmin, personId, userId: sessionUserId },
              id,
            );
            if (!communication) {
              return err("Communication not found or not visible to you.");
            }
            return ok({ communication });
          }

          // ── createTask ────────────────────────────────────────
          case "createTask": {
            if (!userId)
              return authRequired(
                name,
                "This tool needs an identified user to attribute writes or fetch personal data.",
              );

            const { endpoints, ranking, tasks, assignmentNotifications } =
              await getTaskFunctions();
            const prisma = await getPrisma();

            const economics = resolveTaskEconomics(a);
            const blockerTaskIds = dedupeStrings([
              ...(Array.isArray(a.blockerTaskIds)
                ? (a.blockerTaskIds as string[])
                : []),
              ...(Array.isArray(a.depends_on)
                ? (a.depends_on as string[])
                : []),
            ]);
            const blockedTaskIds = dedupeStrings(
              Array.isArray(a.blockedTaskIds)
                ? (a.blockedTaskIds as string[])
                : [],
            );
            const dependencyTaskIds = dedupeStrings([
              ...blockerTaskIds,
              ...blockedTaskIds,
            ]);

            if (!a.title || typeof a.title !== "string" || !a.title.trim()) {
              return err("title is required.");
            }
            if (
              !a.description ||
              typeof a.description !== "string" ||
              !a.description.trim()
            ) {
              return err(
                "description is required. State what the task is and what 'done' looks like.",
              );
            }
            if (
              !a.category ||
              typeof a.category !== "string" ||
              !(a.category in TaskCategory)
            ) {
              return err(
                "category is required. Pick one of: ADVOCACY, RESEARCH, COMMUNICATION, ENGINEERING, ORGANIZING, OUTREACH, GOVERNANCE, SCIENCE, LEGAL, CREATIVE, OTHER.",
              );
            }
            // Accept either an explicit array, or a markdown 'Acceptance
            // criteria' section in the description. Missing both = error.
            const description = a.description as string;
            const descriptionForParsing =
              normalizeTaskTextLineBreaks(description);
            const explicitCriteria = normalizeAcceptanceCriteria(
              a.acceptanceCriteria,
            );
            const extractedCriteria =
              explicitCriteria.length > 0
                ? explicitCriteria
                : extractAcceptanceCriteriaFromDescription(
                    descriptionForParsing,
                  );
            if (extractedCriteria.length === 0) {
              return err(
                "acceptanceCriteria is required: pass a non-empty string array of testable 'done' conditions, " +
                  "or include a markdown '## Acceptance criteria' section with checklist bullets in the description.",
              );
            }
            if (
              Array.isArray(a.acceptanceCriteria) &&
              a.acceptanceCriteria.some(
                (c) => typeof c !== "string" || !c.trim(),
              )
            ) {
              return err(
                "acceptanceCriteria entries must all be non-empty strings.",
              );
            }
            if (
              !a.impactStatement ||
              typeof a.impactStatement !== "string" ||
              !a.impactStatement.trim()
            ) {
              return err(
                "impactStatement is required. One sentence: why does completing this task matter? " +
                  "If you can't articulate the impact, the task should not exist.",
              );
            }
            // Ranking-critical numeric fields. Each accepts aliases — see
            // resolveTaskEconomics — but at least one of each group must be a
            // finite number, otherwise the task scores 0 and never surfaces.
            const hoursProvided =
              parseFiniteNumber(a.hours) != null ||
              parseFiniteNumber(a.estimatedEffortHours) != null;
            const valueProvided =
              parseFiniteNumber(a.value) != null ||
              parseFiniteNumber(a.grossValue) != null ||
              parseFiniteNumber(a.expectedEconomicValueUsdBase) != null;
            const pSuccessProvided =
              parseFiniteNumber(a.p_success) != null ||
              parseFiniteNumber(a.pSuccess) != null ||
              parseFiniteNumber(a.successProbabilityBase) != null;
            const missingRanking: string[] = [];
            if (!hoursProvided)
              missingRanking.push("hours (estimated effort hours)");
            if (!valueProvided)
              missingRanking.push(
                "value (gross USD welfare value if successful)",
              );
            if (!pSuccessProvided)
              missingRanking.push("p_success (success probability 0–1)");
            if (missingRanking.length > 0) {
              return err(
                `Missing ranking-critical fields: ${missingRanking.join(", ")}. ` +
                  `Estimate them — a calibrated guess beats no number. ` +
                  `Tasks without these score 0 and will not surface in any queue.`,
              );
            }

            const isAdminTaskWriter = hasAdminTaskWriteAccess(scopes, isAdmin);
            const parentTaskId = requiredString(a.parentTaskId, "parentTaskId");
            if (typeof parentTaskId !== "string") return parentTaskId;
            let parentTask: Awaited<
              ReturnType<typeof validateExplicitTaskParent>
            >;
            try {
              parentTask = await validateExplicitTaskParent({
                parentTaskId,
                prisma,
                userId,
              });
            } catch (error) {
              return err(
                error instanceof Error ? error.message : "Invalid parent task.",
              );
            }

            if (dependencyTaskIds.length > 0) {
              const sessionPersonId = await loadSessionPersonId(userId);
              const dependencyTasks = await prisma.task.findMany({
                where: {
                  deletedAt: null,
                  id: { in: dependencyTaskIds },
                  AND: [
                    getTaskAccessWhere({
                      action: "READ",
                      personId: sessionPersonId,
                      userId,
                    }),
                    getTaskScopeWhere(scopes, organizationIds),
                  ],
                },
                select: {
                  createdByUserId: true,
                  id: true,
                  isPublic: true,
                },
              });
              const foundDependencyIds = new Set(
                dependencyTasks.map((task) => task.id),
              );
              const missingDependencyIds = dependencyTaskIds.filter(
                (id) => !foundDependencyIds.has(id),
              );
              if (missingDependencyIds.length > 0) {
                return err(
                  "One or more dependency tasks were not found or are inaccessible.",
                );
              }

              const forbiddenBlockedTaskIds: string[] = [];
              for (const task of dependencyTasks) {
                if (!blockedTaskIds.includes(task.id)) continue;
                const canManage = task.isPublic
                  ? isAdminTaskWriter
                  : await canUserManageTask(task.id, userId);
                if (!canManage) forbiddenBlockedTaskIds.push(task.id);
              }
              if (forbiddenBlockedTaskIds.length > 0) {
                return err(
                  "One or more blocked tasks were not found or are inaccessible.",
                );
              }
            }

            const assigneePersonId =
              (a.assigneePersonId as string | undefined) || undefined;
            const assigneeOrganizationId =
              (a.assigneeOrganizationId as string | undefined) || undefined;
            const explicitOwnerOrganizationId =
              typeof a.ownerOrganizationId === "string" &&
              a.ownerOrganizationId.trim()
                ? a.ownerOrganizationId.trim()
                : undefined;
            const ownerOrganizationId =
              explicitOwnerOrganizationId ??
              parentTask.ownerOrganizationId ??
              (parentTask.isPublic ? assigneeOrganizationId : undefined);
            let isPublic: boolean;
            try {
              isPublic = resolveCreateTaskIsPublic(
                a,
                assigneeOrganizationId,
                isAdminTaskWriter,
              );
            } catch (error) {
              return err(
                error instanceof Error
                  ? error.message
                  : "Invalid visibility value.",
              );
            }
            if (isPublic && !hasAdminTaskWriteAccess(scopes, isAdmin)) {
              return err("Creating public tasks requires an admin user.");
            }
            if (!parentTask.isPublic && isPublic) {
              return err("A private parent cannot contain a public task.");
            }
            if (
              !parentTask.isPublic &&
              (ownerOrganizationId ?? null) !==
                parentTask.ownerOrganizationId
            ) {
              return err(
                "A private child task must inherit its parent's organization owner.",
              );
            }
            if (!isPublic) {
              const taskOrganizationIds = dedupeStrings([
                ...(assigneeOrganizationId ? [assigneeOrganizationId] : []),
                ...(ownerOrganizationId ? [ownerOrganizationId] : []),
              ]);
              if (taskOrganizationIds.length > 0) {
                const { canContributeToOrganization } =
                  await import("./organization.server");
                for (const taskOrganizationId of taskOrganizationIds) {
                  if (
                    organizationIds !== null &&
                    !organizationIds.includes(taskOrganizationId)
                  ) {
                    return err(
                      "The OAuth grant does not include one or more selected organizations.",
                    );
                  }
                  if (
                    !(await canContributeToOrganization(
                      userId,
                      taskOrganizationId,
                    ))
                  ) {
                    return err(
                      `Organization ${JSON.stringify(taskOrganizationId)} requires an OWNER, ADMIN, or MEMBER role.`,
                    );
                  }
                }
              }
              const requiredScope = ownerOrganizationId
                ? McpScope.TASKS_ORGANIZATION
                : McpScope.TASKS_PERSONAL;
              if (!scopes?.includes(requiredScope)) {
                return err(
                  `${scopeToWire(requiredScope)} is required for this private task.`,
                );
              }
            }
            const availableAt =
              a.available_at !== undefined || a.availableAt !== undefined
                ? parseTaskDate(a.available_at ?? a.availableAt)
                : null;
            const dueAt =
              a.due_at !== undefined || a.dueAt !== undefined
                ? parseTaskDate(a.due_at ?? a.dueAt)
                : null;
            let routingData: Record<string, unknown>;
            try {
              routingData = buildTaskRoutingData(a);
            } catch (error) {
              return err(
                error instanceof Error
                  ? error.message
                  : "Invalid task routing field.",
              );
            }
            const contextArgs = {
              ...a,
              acceptanceCriteria: extractedCriteria,
              description: descriptionForParsing,
            };
            const data: Record<string, unknown> = {
              title: a.title as string,
              description,
              parentTaskId,
              taskKey: (a.taskKey as string) ?? null,
              category: a.category
                ? TaskCategory[a.category as keyof typeof TaskCategory]
                : TaskCategory.OTHER,
              skillTags: (a.skillTags as string[]) ?? [],
              interestTags: (a.interestTags as string[]) ?? [],
              ...routingData,
              estimatedEffortHours: economics.estimatedEffortHours,
              availableAt,
              dueAt,
              deadlinePolicy: resolveDeadlinePolicyInput(a, dueAt),
              claimPolicy: a.claimPolicy
                ? TaskClaimPolicy[a.claimPolicy as keyof typeof TaskClaimPolicy]
                : TaskClaimPolicy.OPEN_MANY,
              ...(assigneePersonId ? { assigneePersonId } : {}),
              ...(assigneeOrganizationId ? { assigneeOrganizationId } : {}),
              ...(ownerOrganizationId ? { ownerOrganizationId } : {}),
              roleTitle: (a.roleTitle as string) ?? null,
              // sourceUrl is absorbed into contextJson.sourceUrls by
              // buildPersonalTaskContext — the Task model has no sourceUrl column.
              impactStatement: (a.impactStatement as string) ?? null,
              isPublic,
              contextJson: buildPersonalTaskContext(contextArgs, economics),
              sortOrder: (a.sortOrder as number) ?? undefined,
              status: TaskStatus.ACTIVE,
            };
            data.createdByUserId = userId;
            const task = await prisma.$transaction(
              async (tx) => {
                const created = await tx.task.create({ data: data as any });
                await endpoints.upsertPrimaryTaskCommunicationEndpoint(
                  tx,
                  created.id,
                  {
                    label: (a.contactLabel as string) ?? null,
                    url: (a.contactUrl as string) ?? null,
                  },
                );
                const { TaskEdgeType } = await import("@optimitron/db");
                const incomingEdges = blockerTaskIds
                  .filter((id) => id !== created.id)
                  .map((blockerTaskId) => ({
                    fromTaskId: blockerTaskId,
                    toTaskId: created.id,
                    edgeType: TaskEdgeType.BLOCKS,
                  }));
                if (incomingEdges.length > 0) {
                  await tx.taskEdge.createMany({
                    data: incomingEdges,
                    skipDuplicates: true,
                  });
                }

                const outgoingEdges = blockedTaskIds
                  .filter((id) => id !== created.id)
                  .map((blockedTaskId) => ({
                    fromTaskId: created.id,
                    toTaskId: blockedTaskId,
                    edgeType: TaskEdgeType.BLOCKS,
                  }));
                if (outgoingEdges.length > 0) {
                  await tx.taskEdge.createMany({
                    data: outgoingEdges,
                    skipDuplicates: true,
                  });
                }
                await attachDirectTaskImpactEstimate({
                  actor: { isAdmin: isAdminTaskWriter, userId },
                  prisma: tx,
                  publish: isPublic,
                  taskId: created.id,
                  estimatedEffortHours: economics.estimatedEffortHours,
                  estimatedCashCostUsdBase: economics.estimatedCashCostUsdBase,
                  expectedEconomicValueUsdBase:
                    economics.expectedEconomicValueUsdBase,
                  successProbabilityBase: economics.pSuccess,
                  timeToImpactStartDays: economics.timeToImpactStartDays,
                });
                return created;
              },
              { maxWait: 10_000, timeout: 60_000 },
            );

            // Mirror the web-side createTask call site so MCP-driven task
            // creation also fires the assignment email. Best-effort — never
            // fail the tool because the email layer flinched.
            if (assigneePersonId || assigneeOrganizationId) {
              try {
                await assignmentNotifications.notifyTaskAssigneeOfAssignment({
                  senderUserId: userId,
                  taskId: task.id,
                });
              } catch (error) {
                console.error(
                  "[mcp] notifyTaskAssigneeOfAssignment failed",
                  task.id,
                  error,
                );
              }
            }

            const fresh = await tasks.getTaskDetailData(task.id, userId, {
              clientAccessBoundary: taskClientBoundary,
            });
            const scored = fresh
              ? buildPersonalQueueRows(
                  [fresh.task],
                  ranking,
                  DEFAULT_PERSONAL_BUYBACK_RATE,
                  {
                    limit: 1,
                  },
                )
              : [];

            // Soft-recommended fields the AI skipped. Surfaced so the next
            // call (or an updateTask) can fill them in. Hard-required fields
            // already errored above, so they are not echoed here.
            const missingFields: string[] = [];
            if (
              parseFiniteNumber(a.cash_cost) == null &&
              parseFiniteNumber(a.estimatedCashCostUsdBase) == null
            ) {
              missingFields.push("cash_cost");
            }
            if (a.executor_type === undefined && a.executorType === undefined) {
              missingFields.push("executor_type");
            }
            if (parseFiniteNumber(a.timeToImpactStartDays) == null) {
              missingFields.push("timeToImpactStartDays");
            }
            if (
              !a.taskKey ||
              typeof a.taskKey !== "string" ||
              !a.taskKey.trim()
            ) {
              missingFields.push(
                "taskKey (stable dedup key — recommended for idempotency)",
              );
            }

            const baseResult = scored[0] ?? {
              taskId: task.id,
              title: task.title,
              status: task.status,
            };
            return ok({
              ...baseResult,
              isPublic,
              visibility: formatTaskVisibility(isPublic),
              missingFields,
              recommendation:
                missingFields.length === 0
                  ? "Task created with full metadata."
                  : `Task created. Consider an updateTask call to fill in: ${missingFields.join(", ")}.`,
            });
          }

          case "upsertOrganization": {
            if (!userId)
              return authRequired(
                name,
                "This tool creates or updates organization records.",
              );
            const earthData = await import("./earth-data.server");
            return await runAuditedEarthDataTool(
              name,
              a,
              {
                clientId: options.clientId,
                oauthGrantId: options.oauthGrantId,
                userId,
              },
              async () => {
                const organization = await earthData.upsertOrganization({
                  contactEmail: (a.contactEmail as string) ?? null,
                  description: (a.description as string) ?? null,
                  donationUrl: (a.donationUrl as string) ?? null,
                  name: a.name as string,
                  sourceRef: (a.sourceRef as string) ?? null,
                  sourceUrl: (a.sourceUrl as string) ?? null,
                  squareLogoUrl: (a.squareLogoUrl as string) ?? null,
                  type: enumValue(OrgType, a.type, OrgType.OTHER),
                  website: (a.website as string) ?? null,
                  wordmarkLogoUrl: (a.wordmarkLogoUrl as string) ?? null,
                });
                return {
                  organization: {
                    contactEmail: organization.contactEmail,
                    donationUrl: organization.donationUrl,
                    id: organization.id,
                    name: organization.name,
                    slug: organization.slug,
                    squareLogoUrl: organization.squareLogoUrl,
                    type: organization.type,
                    website: organization.website,
                    wordmarkLogoUrl: organization.wordmarkLogoUrl,
                  },
                };
              },
            );
          }

          case "updateOrganization": {
            if (!userId)
              return authRequired(
                name,
                "This tool edits an existing organization.",
              );
            const orgServer = await import("./organization.server");
            if (typeof a.organizationId !== "string")
              return err("organizationId must be a string");
            const organizationId = a.organizationId;
            if (!organizationId.trim())
              return err("organizationId is required");

            const patch: Parameters<typeof orgServer.updateOrganization>[2] =
              {};
            if (a.name !== undefined) {
              if (typeof a.name !== "string")
                return err("name must be a string");
              patch.name = a.name;
            }
            if (a.type !== undefined && typeof a.type !== "string") {
              return err("type must be a string");
            }
            if (typeof a.type === "string") {
              const orgType = OrgType[a.type as keyof typeof OrgType];
              if (!orgType)
                return err(
                  `type must be one of: ${Object.keys(OrgType).join(", ")}`,
                );
              patch.type = orgType;
            }
            if (a.status !== undefined && typeof a.status !== "string") {
              return err("status must be a string");
            }
            if (typeof a.status === "string" && a.status !== "") {
              const orgStatus = OrgStatus[a.status as keyof typeof OrgStatus];
              if (!orgStatus)
                return err(
                  `status must be one of: ${Object.keys(OrgStatus).join(", ")}`,
                );
              patch.status = orgStatus;
            }
            for (const fieldName of [
              "slug",
              "website",
              "description",
              "donationUrl",
              "squareLogoUrl",
              "wordmarkLogoUrl",
              "contactEmail",
              "jurisdictionId",
            ] as const) {
              const raw = a[fieldName];
              if (raw === undefined) continue;
              if (typeof raw !== "string")
                return err(`${fieldName} must be a string`);
              patch[fieldName] = raw === "" ? null : raw;
            }

            try {
              return await runAuditedEarthDataTool(
                name,
                a,
                {
                  clientId: options.clientId,
                  oauthGrantId: options.oauthGrantId,
                  userId,
                },
                async () => {
                  const organization = await orgServer.updateOrganization(
                    organizationId,
                    userId,
                    patch,
                    {
                      allowStatusChange: hasAdminTaskWriteAccess(
                        scopes,
                        isAdmin,
                      ),
                    },
                  );
                  return {
                    organization: {
                      contactEmail: organization.contactEmail,
                      description: organization.description,
                      donationUrl: organization.donationUrl,
                      id: organization.id,
                      jurisdictionId: organization.jurisdictionId,
                      name: organization.name,
                      slug: organization.slug,
                      squareLogoUrl: organization.squareLogoUrl,
                      status: organization.status,
                      type: organization.type,
                      website: organization.website,
                      wordmarkLogoUrl: organization.wordmarkLogoUrl,
                    },
                  };
                },
              );
            } catch (error) {
              if (error instanceof Error) return err(error.message);
              throw error;
            }
          }

          case "deleteOrganization": {
            if (!userId)
              return authRequired(
                name,
                "This tool soft-deletes an organization.",
              );
            const orgServer = await import("./organization.server");
            const organizationId = (a.organizationId as string) ?? "";
            if (!organizationId.trim())
              return err("organizationId is required");

            try {
              return await runAuditedEarthDataTool(
                name,
                a,
                {
                  clientId: options.clientId,
                  oauthGrantId: options.oauthGrantId,
                  userId,
                },
                async () => {
                  await orgServer.softDeleteOrganization(
                    organizationId,
                    userId,
                  );
                  return { organizationId, deleted: true };
                },
              );
            } catch (error) {
              if (error instanceof Error) return err(error.message);
              throw error;
            }
          }

          case "addOrganizationMember": {
            if (!userId)
              return authRequired(
                name,
                "This tool adds a member to an organization.",
              );
            const orgServer = await import("./organization.server");
            const organizationId = (a.organizationId as string) ?? "";
            const targetUserId = (a.userId as string) ?? "";
            if (!organizationId.trim())
              return err("organizationId is required");
            if (!targetUserId.trim()) return err("userId is required");
            const roleInput =
              (typeof a.role === "string" && a.role) || "member";
            if (!orgServer.isOrganizationMemberRole(roleInput)) {
              return err(`role must be one of: owner, admin, member, viewer`);
            }

            try {
              return await runAuditedEarthDataTool(
                name,
                a,
                {
                  clientId: options.clientId,
                  oauthGrantId: options.oauthGrantId,
                  userId,
                },
                async () => {
                  const membership = await orgServer.addOrganizationMember(
                    organizationId,
                    userId,
                    targetUserId,
                    roleInput,
                  );
                  return {
                    membership: {
                      organizationId: membership.organizationId,
                      userId: membership.userId,
                      role: membership.role,
                      joinedAt: membership.joinedAt,
                    },
                  };
                },
              );
            } catch (error) {
              if (error instanceof Error) return err(error.message);
              throw error;
            }
          }

          case "removeOrganizationMember": {
            if (!userId)
              return authRequired(
                name,
                "This tool removes a member from an organization.",
              );
            const orgServer = await import("./organization.server");
            const organizationId = (a.organizationId as string) ?? "";
            const targetUserId = (a.userId as string) ?? "";
            if (!organizationId.trim())
              return err("organizationId is required");
            if (!targetUserId.trim()) return err("userId is required");

            try {
              return await runAuditedEarthDataTool(
                name,
                a,
                {
                  clientId: options.clientId,
                  oauthGrantId: options.oauthGrantId,
                  userId,
                },
                async () => {
                  await orgServer.removeOrganizationMember(
                    organizationId,
                    userId,
                    targetUserId,
                  );
                  return {
                    organizationId,
                    userId: targetUserId,
                    removed: true,
                  };
                },
              );
            } catch (error) {
              if (error instanceof Error) return err(error.message);
              throw error;
            }
          }

          case "updateOrganizationMemberRole": {
            if (!userId)
              return authRequired(
                name,
                "This tool changes an organization member's role.",
              );
            const orgServer = await import("./organization.server");
            const organizationId = (a.organizationId as string) ?? "";
            const targetUserId = (a.userId as string) ?? "";
            const roleInput = (a.role as string) ?? "";
            if (!organizationId.trim())
              return err("organizationId is required");
            if (!targetUserId.trim()) return err("userId is required");
            if (!orgServer.isOrganizationMemberRole(roleInput)) {
              return err(`role must be one of: owner, admin, member, viewer`);
            }

            try {
              return await runAuditedEarthDataTool(
                name,
                a,
                {
                  clientId: options.clientId,
                  oauthGrantId: options.oauthGrantId,
                  userId,
                },
                async () => {
                  const membership =
                    await orgServer.updateOrganizationMemberRole(
                      organizationId,
                      userId,
                      targetUserId,
                      roleInput,
                    );
                  return {
                    membership: {
                      organizationId: membership.organizationId,
                      userId: membership.userId,
                      role: membership.role,
                      joinedAt: membership.joinedAt,
                    },
                  };
                },
              );
            } catch (error) {
              if (error instanceof Error) return err(error.message);
              throw error;
            }
          }

          case "listOrganizationMembers": {
            if (!userId)
              return authRequired(
                name,
                "This tool lists members of an organization.",
              );
            const orgServer = await import("./organization.server");
            const organizationId = (a.organizationId as string) ?? "";
            if (!organizationId.trim())
              return err("organizationId is required");
            try {
              const members = await orgServer.listOrganizationMembers(
                organizationId,
                userId,
              );
              return ok({
                members: members.map((m) => ({
                  userId: m.user.id,
                  email: m.user.email,
                  displayName: m.user.person?.displayName ?? null,
                  handle: m.user.person?.handle ?? null,
                  role: m.role,
                  joinedAt: m.joinedAt,
                })),
              });
            } catch (error) {
              if (error instanceof Error) return err(error.message);
              throw error;
            }
          }

          case "createPerson": {
            if (!userId)
              return authRequired(
                name,
                "This tool needs an identified user to attribute writes or fetch personal data.",
              );
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
              createdByUserId: userId,
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
            if (!userId)
              return authRequired(
                name,
                "This tool returns the authenticated user's profile.",
              );
            const prisma = await getPrisma();
            const { getProfileIdentityData } =
              await import("./profile-identity.server");
            const { ensurePersonForUser } = await import("./person.server");
            const person = await ensurePersonForUser(userId, {}, prisma);
            const [profile, userIdentity, memberships] = await Promise.all([
              getProfileIdentityData(userId),
              prisma.user.findUnique({
                where: { id: userId },
                select: USER_MATCHING_SELECT,
              }),
              prisma.organizationMember.findMany({
                where: {
                  organizationId:
                    scopes?.includes(McpScope.TASKS_ORGANIZATION) &&
                    organizationIds === null
                      ? undefined
                      : {
                          in:
                            scopes?.includes(McpScope.TASKS_ORGANIZATION) &&
                            organizationIds !== null
                              ? [...organizationIds]
                              : [],
                        },
                  organization: { deletedAt: null },
                  userId,
                },
                orderBy: { joinedAt: "asc" },
                select: {
                  organization: {
                    select: { id: true, name: true, slug: true },
                  },
                  role: true,
                },
              }),
            ]);
            if (!profile) return err("User not found");

            const setupGaps: Array<{
              code: string;
              message: string;
              organizationId?: string;
            }> = [];
            const hasPersonalScope =
              scopes?.includes(McpScope.TASKS_PERSONAL) === true;
            const hasOrganizationScope =
              scopes?.includes(McpScope.TASKS_ORGANIZATION) === true;
            const personalRoot = hasPersonalScope
              ? await ensureExecutionPlanningBranch({
                  personId: person.id,
                  prisma,
                  userId,
                })
              : null;
            if (!hasPersonalScope) {
              setupGaps.push({
                code: "tasks_personal_scope_required",
                message:
                  "Grant tasks:personal to create and manage the personal planning root.",
              });
            }
            if (memberships.length > 0 && !hasOrganizationScope) {
              setupGaps.push({
                code: "tasks_organization_scope_required",
                message:
                  "Grant tasks:organization to create and manage organization planning roots.",
              });
            }

            const organizationRoots: Array<{
              organization: { id: string; name: string; slug: string };
              role: OrganizationMemberRole;
              root: {
                id: string;
                taskKey: string | null;
                title: string;
              } | null;
            }> = [];
            for (const membership of memberships) {
              const canContribute =
                membership.role !== OrganizationMemberRole.VIEWER;
              const root =
                hasOrganizationScope && canContribute
                  ? await ensureExecutionPlanningBranch({
                      organizationId: membership.organization.id,
                      prisma,
                      userId,
                    })
                  : await prisma.task.findFirst({
                      where: {
                        deletedAt: null,
                        ownerOrganizationId: membership.organization.id,
                        taskKey: getOrganizationPlanningRootTaskKey(
                          membership.organization.id,
                        ),
                      },
                      select: { id: true, taskKey: true, title: true },
                    });
              organizationRoots.push({
                organization: membership.organization,
                role: membership.role,
                root,
              });
              if (hasOrganizationScope && !canContribute && root == null) {
                setupGaps.push({
                  code: "organization_root_requires_contributor",
                  message:
                    "A VIEWER can read an existing organization root but cannot create one.",
                  organizationId: membership.organization.id,
                });
              }
            }

            return ok({
              grantedScopes: (scopes ?? []).map(scopeToWire),
              grantedOrganizationIds: memberships.map(
                (membership) => membership.organization.id,
              ),
              matchingPreferences: userIdentity
                ? summarizeMatchingUser(userIdentity)
                : null,
              organizationRoots,
              personalRoot,
              personId: person.id,
              setupGaps,
              userId,
              ...profile,
            });
          }

          case "updateMyProfile": {
            if (!userId)
              return authRequired(
                name,
                "This tool updates the authenticated user's profile.",
              );
            const { updateUserProfile, ProfileValidationError } =
              await import("./profile-identity.server");
            try {
              const matchingPatch = buildUserMatchingProfileData(a);
              const profile = await updateUserProfile(userId, {
                name: typeof a.name === "string" ? a.name : undefined,
                bio: typeof a.bio === "string" ? a.bio : undefined,
                handle: "handle" in a ? (a.handle as string | null) : undefined,
                headline:
                  "headline" in a ? (a.headline as string | null) : undefined,
                image: "image" in a ? (a.image as string | null) : undefined,
                website:
                  "website" in a ? (a.website as string | null) : undefined,
                coverImage:
                  "coverImage" in a
                    ? (a.coverImage as string | null)
                    : undefined,
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
              const matchingPreferences =
                Object.keys(matchingPatch).length > 0
                  ? await (
                      await getPrisma()
                    ).user.update({
                      where: { id: userId },
                      data: matchingPatch as any,
                      select: USER_MATCHING_SELECT,
                    })
                  : await (
                      await getPrisma()
                    ).user.findUnique({
                      where: { id: userId },
                      select: USER_MATCHING_SELECT,
                    });
              return ok({
                userId,
                matchingPreferences: matchingPreferences
                  ? summarizeMatchingUser(matchingPreferences)
                  : null,
                ...profile,
              });
            } catch (e) {
              if (e instanceof ProfileValidationError) {
                return err(e.message);
              }
              throw e;
            }
          }

          case UPLOAD_IMAGE_FROM_URL_TOOL_NAME: {
            if (!userId)
              return authRequired(
                name,
                "This tool uploads an image into the site media bucket.",
              );
            if (typeof a.url !== "string" || !a.url.trim()) {
              return err("url is required");
            }
            const url = a.url.trim();
            const kind = a.kind;
            if (!isImageUploadKind(kind)) {
              return err(
                "kind must be one of: memorial-evidence-image, organization-square-logo, organization-wordmark-logo, person-photo",
              );
            }
            if (a.filename !== undefined && typeof a.filename !== "string") {
              return err("filename must be a string");
            }

            const { uploadImageFromUrl } =
              await import("./image-upload-from-url.server");
            try {
              return await runAuditedEarthDataTool(
                name,
                a,
                {
                  clientId: options.clientId,
                  oauthGrantId: options.oauthGrantId,
                  userId,
                },
                () =>
                  uploadImageFromUrl({
                    filename:
                      typeof a.filename === "string" ? a.filename : null,
                    kind,
                    url,
                  }),
              );
            } catch (error) {
              if (error instanceof Error) return err(error.message);
              throw error;
            }
          }

          case "createOrganization": {
            if (!userId)
              return authRequired(
                name,
                "This tool needs an identified user to attribute writes or fetch personal data.",
              );
            const { createOrganizationWithOwner } =
              await import("./organization.server");
            const orgName = (a.name as string) ?? "";
            if (!orgName.trim()) return err("name is required");
            const orgType =
              typeof a.type === "string"
                ? OrgType[a.type as keyof typeof OrgType]
                : null;
            if (!orgType) {
              return err(
                `type must be one of: ${Object.keys(OrgType).join(", ")}`,
              );
            }
            const status =
              a.status == null || a.status === ""
                ? OrgStatus.APPROVED
                : typeof a.status === "string"
                  ? OrgStatus[a.status as keyof typeof OrgStatus]
                  : null;
            if (!status) {
              return err(
                `status must be one of: ${Object.keys(OrgStatus).join(", ")}`,
              );
            }

            try {
              return await runAuditedEarthDataTool(
                name,
                a,
                {
                  clientId: options.clientId,
                  oauthGrantId: options.oauthGrantId,
                  userId,
                },
                async () => {
                  const organization = await createOrganizationWithOwner(
                    {
                      contactEmail: (a.contactEmail as string) ?? null,
                      description: (a.description as string) ?? null,
                      donationUrl: (a.donationUrl as string) ?? null,
                      jurisdictionId: (a.jurisdictionId as string) ?? null,
                      name: orgName,
                      slug: (a.slug as string) ?? null,
                      squareLogoUrl: (a.squareLogoUrl as string) ?? null,
                      status,
                      website: (a.website as string) ?? null,
                      wordmarkLogoUrl: (a.wordmarkLogoUrl as string) ?? null,
                      type: orgType,
                    },
                    userId,
                    { rejectDuplicates: true },
                  );

                  return {
                    organization: {
                      contactEmail: organization.contactEmail,
                      createdAt: organization.createdAt,
                      description: organization.description,
                      donationUrl: organization.donationUrl,
                      id: organization.id,
                      name: organization.name,
                      slug: organization.slug,
                      squareLogoUrl: organization.squareLogoUrl,
                      status: organization.status,
                      type: organization.type,
                      website: organization.website,
                      wordmarkLogoUrl: organization.wordmarkLogoUrl,
                    },
                  };
                },
              );
            } catch (error) {
              if (error instanceof Error) {
                return err(error.message);
              }
              throw error;
            }
          }

          // ── proposeTaskBundle ───────────────────────────────────
          case "proposeTaskBundle": {
            if (!userId) {
              return authRequired(
                "proposeTaskBundle",
                "Draft proposals must be owned by an authenticated user.",
              );
            }
            const { endpoints } = await getTaskFunctions();
            const prisma = await getPrisma();
            const { reviewTaskProposalBundle } =
              await import("@optimitron/agent");
            const rawCandidates = Array.isArray(a.candidates)
              ? (a.candidates as Array<Record<string, unknown>>)
              : [];
            if (rawCandidates.length === 0) {
              return err(
                "candidates must contain at least one task or project.",
              );
            }
            const sessionPersonId = await loadSessionPersonId(userId);
            const candidates: Array<Record<string, unknown>> = [];
            const planningBranches = new Map<
              string,
              { id: string; taskKey: string | null }
            >();
            const { canManageOrganization } =
              await import("./organization.server");

            for (const rawCandidate of rawCandidates) {
              const candidate = normalizeProposalCandidate(rawCandidate);
              if (
                typeof candidate.taskKey === "string" &&
                /^planner:(?:person|organization):/.test(candidate.taskKey)
              ) {
                return err(
                  "taskKey uses a reserved execution-planning branch namespace.",
                );
              }
              for (const dependency of (candidate.dependencies as Array<
                Record<string, unknown>
              >) ?? []) {
                const probabilityDelta = parseFiniteNumber(
                  dependency.probabilityDeltaBase,
                );
                if (
                  dependency.probabilityDeltaBase !== undefined &&
                  (probabilityDelta == null ||
                    probabilityDelta < 0 ||
                    probabilityDelta > 1)
                ) {
                  return err(
                    "Dependency probabilityDeltaBase must be a finite number between 0 and 1.",
                  );
                }
                const timeDeltaDays = parseFiniteNumber(
                  dependency.timeDeltaDaysBase,
                );
                if (
                  dependency.timeDeltaDaysBase !== undefined &&
                  (timeDeltaDays == null || timeDeltaDays < 0)
                ) {
                  return err(
                    "Dependency timeDeltaDaysBase must be a finite non-negative number.",
                  );
                }
              }
              const assigneeOrganizationId =
                typeof candidate.assigneeOrganizationId === "string"
                  ? candidate.assigneeOrganizationId
                  : null;
              let assigneePersonId =
                typeof candidate.assigneePersonId === "string"
                  ? candidate.assigneePersonId
                  : null;

              if (!isAdmin && candidate.isPublic) {
                return err(
                  "Non-admin task proposals must remain private drafts.",
                );
              }
              if (assigneeOrganizationId) {
                if (
                  !isAdmin &&
                  !(await canManageOrganization(userId, assigneeOrganizationId))
                ) {
                  return err(
                    "Forbidden: organization proposals require an owner or admin membership.",
                  );
                }
              } else {
                assigneePersonId ??= sessionPersonId;
                if (
                  !isAdmin &&
                  assigneePersonId &&
                  assigneePersonId !== sessionPersonId
                ) {
                  return err(
                    "Forbidden: personal proposals may only target your own Person record.",
                  );
                }
              }

              const branchKey = assigneeOrganizationId
                ? `organization:${assigneeOrganizationId}`
                : `person:${assigneePersonId ?? userId}`;
              let branch = planningBranches.get(branchKey);
              if (!branch) {
                branch = await ensureExecutionPlanningBranch({
                  organizationId: assigneeOrganizationId,
                  personId: assigneeOrganizationId ? null : assigneePersonId,
                  prisma,
                  userId,
                });
                planningBranches.set(branchKey, branch);
              }
              const requestedParentTaskRef = optionalString(
                candidate.parentTaskRef,
              );
              if (!requestedParentTaskRef) {
                return err(
                  `Candidate ${JSON.stringify(candidate.title ?? candidate.id ?? "untitled")} requires parentTaskRef. Search existing tasks and choose the best parent; use "$target-root" only when no more specific parent exists.`,
                );
              }
              candidates.push({
                ...candidate,
                assigneeOrganizationId,
                assigneePersonId,
                isPublic: isAdmin && candidate.isPublic === true,
                parentTaskRef:
                  requestedParentTaskRef === "$target-root"
                    ? branch.id
                    : requestedParentTaskRef,
              });
            }

            const proposalOrganizationIds = Array.from(
              new Set(
                candidates.flatMap((candidate) =>
                  typeof candidate.assigneeOrganizationId === "string"
                    ? [candidate.assigneeOrganizationId]
                    : [],
                ),
              ),
            );
            const existingTasks = await prisma.task.findMany({
              where: {
                deletedAt: null,
                ...(!isAdmin
                  ? {
                      OR: [
                        { isPublic: true },
                        { createdByUserId: userId },
                        ...(sessionPersonId
                          ? [{ assigneePersonId: sessionPersonId }]
                          : []),
                        ...(proposalOrganizationIds.length > 0
                          ? [
                              {
                                assigneeOrganizationId: {
                                  in: proposalOrganizationIds,
                                },
                              },
                              {
                                ownerOrganizationId: {
                                  in: proposalOrganizationIds,
                                },
                              },
                            ]
                          : []),
                      ],
                    }
                  : {}),
              },
              select: {
                assigneeOrganizationId: true,
                assigneePersonId: true,
                createdByUserId: true,
                id: true,
                isPublic: true,
                ownerOrganizationId: true,
                roleTitle: true,
                sourceArtifacts: {
                  where: { deletedAt: null },
                  select: {
                    sourceArtifact: {
                      select: { contentHash: true, sourceKey: true },
                    },
                  },
                },
                status: true,
                taskKey: true,
                title: true,
              },
            });
            const targetKeyForCandidate = (
              candidate: Record<string, unknown>,
            ) =>
              typeof candidate.assigneeOrganizationId === "string"
                ? `organization:${candidate.assigneeOrganizationId}`
                : `person:${String(candidate.assigneePersonId ?? userId)}`;
            const candidateByRef = new Map<string, Record<string, unknown>>();
            for (const candidate of candidates) {
              for (const ref of [candidate.id, candidate.taskKey]) {
                if (typeof ref === "string" && ref) {
                  candidateByRef.set(ref, candidate);
                }
              }
            }
            const existingTaskByRef = new Map<
              string,
              (typeof existingTasks)[number]
            >();
            for (const task of existingTasks) {
              existingTaskByRef.set(task.id, task);
              if (task.taskKey) existingTaskByRef.set(task.taskKey, task);
            }

            for (const candidate of candidates) {
              const targetKey = targetKeyForCandidate(candidate);
              const branch = planningBranches.get(targetKey)!;
              const parentRef = String(candidate.parentTaskRef ?? "");
              const parentCandidate = candidateByRef.get(parentRef);
              const parentTask = existingTaskByRef.get(parentRef);
              const isBranch =
                parentRef === branch.id || parentRef === branch.taskKey;
              if (parentCandidate === candidate) {
                return err("A proposed task cannot be its own parent.");
              }
              if (!isBranch && !parentCandidate && !parentTask) {
                return err(
                  `Invalid parentTaskRef ${JSON.stringify(parentRef)}. Search existing tasks or reference another candidate in this bundle.`,
                );
              }
            }

            if (!isAdmin) {
              const authorizedOrganizationIds = new Set(
                candidates.flatMap((candidate) =>
                  typeof candidate.assigneeOrganizationId === "string"
                    ? [candidate.assigneeOrganizationId]
                    : [],
                ),
              );
              const canUsePrivateDependency = (
                task: (typeof existingTasks)[number],
              ) =>
                task.isPublic ||
                task.createdByUserId === userId ||
                task.assigneePersonId === sessionPersonId ||
                (task.assigneeOrganizationId != null &&
                  authorizedOrganizationIds.has(task.assigneeOrganizationId)) ||
                (task.ownerOrganizationId != null &&
                  authorizedOrganizationIds.has(task.ownerOrganizationId));

              for (const candidate of candidates) {
                const targetKey = targetKeyForCandidate(candidate);
                const branch = planningBranches.get(targetKey)!;
                const parentRef = String(candidate.parentTaskRef ?? "");
                const parentCandidate = candidateByRef.get(parentRef);
                const parentTask = existingTaskByRef.get(parentRef);
                const isBranch =
                  parentRef === branch.id || parentRef === branch.taskKey;
                const isSameTargetCandidate =
                  parentCandidate != null &&
                  targetKeyForCandidate(parentCandidate) === targetKey;
                const isSameTargetTask =
                  parentTask != null &&
                  (typeof candidate.assigneeOrganizationId === "string"
                    ? parentTask.assigneeOrganizationId ===
                        candidate.assigneeOrganizationId ||
                      parentTask.ownerOrganizationId ===
                        candidate.assigneeOrganizationId
                    : parentTask.assigneePersonId ===
                        candidate.assigneePersonId ||
                      parentTask.createdByUserId === userId);
                if (!isBranch && !isSameTargetCandidate && !isSameTargetTask) {
                  return err(
                    `Invalid or unauthorized parentTaskRef ${JSON.stringify(parentRef)}. Personal drafts must stay in the caller's person or organization branch.`,
                  );
                }

                for (const blockerRef of candidate.blockerRefs as string[]) {
                  if (candidateByRef.has(blockerRef)) continue;
                  const dependencyTask = existingTaskByRef.get(blockerRef);
                  if (
                    !dependencyTask ||
                    !canUsePrivateDependency(dependencyTask)
                  ) {
                    return err(
                      `Invalid or inaccessible dependency reference ${JSON.stringify(blockerRef)}.`,
                    );
                  }
                }
              }
            }
            const existingTaskByKey = new Map(
              existingTasks.flatMap((task) =>
                task.taskKey ? [[task.taskKey, task] as const] : [],
              ),
            );
            const existingDrafts: Array<{
              proposalRef: string;
              status: TaskStatus;
              taskId: string;
              title: string;
            }> = [];
            const changedDrafts: Array<{
              newSourceHash: string;
              previousSourceHash: string | null;
              proposalRef: string;
              status: TaskStatus;
              taskId: string;
              title: string;
            }> = [];
            for (const candidate of candidates) {
              const taskKey = candidate.taskKey as string | null;
              const existingTask = taskKey
                ? existingTaskByKey.get(taskKey)
                : null;
              if (!existingTask || !taskKey) continue;
              const source = asObject(candidate.source);
              const artifactKey = getPlannerSourceArtifactKey(source);
              const newSourceHash =
                typeof source?.sourceHash === "string"
                  ? source.sourceHash
                  : null;
              const linkedArtifact = artifactKey
                ? existingTask.sourceArtifacts.find(
                    (link) => link.sourceArtifact.sourceKey === artifactKey,
                  )?.sourceArtifact
                : null;
              if (
                artifactKey &&
                newSourceHash &&
                linkedArtifact?.contentHash !== newSourceHash
              ) {
                changedDrafts.push({
                  newSourceHash,
                  previousSourceHash: linkedArtifact?.contentHash ?? null,
                  proposalRef: taskKey,
                  status: existingTask.status,
                  taskId: existingTask.id,
                  title: existingTask.title,
                });
              } else {
                existingDrafts.push({
                  proposalRef: taskKey,
                  status: existingTask.status,
                  taskId: existingTask.id,
                  title: existingTask.title,
                });
              }
            }
            const newCandidates = candidates.filter((candidate) => {
              const taskKey = candidate.taskKey as string | null;
              return !taskKey || !existingTaskByKey.has(taskKey);
            });

            if (newCandidates.length === 0) {
              return ok({
                changedDrafts,
                createdDrafts: [],
                existingDrafts,
                message:
                  changedDrafts.length > 0
                    ? `${changedDrafts.length} existing draft sources changed and require review; no duplicate drafts were created.`
                    : "All source-identical proposals already exist.",
                review: {
                  decisions: [],
                  promotableCount: 0,
                  summary:
                    changedDrafts.length > 0
                      ? "Changed sources were reported without overwriting their reviewed drafts."
                      : "No duplicate drafts were created.",
                },
              });
            }

            const review = reviewTaskProposalBundle({
              candidates: newCandidates.map((c) => ({
                title: c.title as string,
                description: (c.description as string) ?? null,
                taskKey: (c.taskKey as string) ?? null,
                id: (c.id as string) ?? null,
                assigneePersonId: (c.assigneePersonId as string) ?? null,
                assigneeOrganizationId:
                  (c.assigneeOrganizationId as string) ?? null,
                roleTitle: (c.roleTitle as string) ?? null,
                contactUrl: (c.contactUrl as string) ?? null,
                sourceUrls: (c.sourceUrls as string[]) ?? [],
                blockerRefs: (c.blockerRefs as string[]) ?? [],
                parentTaskRef: (c.parentTaskRef as string) ?? null,
                estimatedEffortHours:
                  (c.estimatedEffortHours as number) ?? null,
                isPublic: (c.isPublic as boolean) ?? false,
                impact: getProposalGovernanceImpact(c),
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
            for (const branch of planningBranches.values()) {
              existingRefToTaskId.set(branch.id, branch.id);
              if (branch.taskKey) {
                existingRefToTaskId.set(branch.taskKey, branch.id);
              }
            }

            const created: Array<{
              taskId: string;
              title: string;
              proposalRef: string;
            }> = [];
            const createdRefToTaskId = new Map<string, string>();
            const createdDecisionByTaskId = new Map<
              string,
              {
                candidate: Record<string, unknown>;
                decision: (typeof review.decisions)[number];
              }
            >();

            for (const decision of review.decisions) {
              if (!decision.promotable) continue;
              const candidate = newCandidates.find((c) =>
                matchCandidateToDecision(c, decision),
              );
              if (!candidate) continue;

              const task = await prisma.task.create({
                data: {
                  title: candidate.title as string,
                  description: (candidate.description as string) ?? "",
                  createdByUserId: userId,
                  taskKey: (candidate.taskKey as string) ?? null,
                  category: inferProposalCategory(candidate),
                  assigneePersonId:
                    (candidate.assigneePersonId as string) ?? null,
                  assigneeOrganizationId:
                    (candidate.assigneeOrganizationId as string) ?? null,
                  roleTitle: (candidate.roleTitle as string) ?? null,
                  estimatedEffortHours:
                    (candidate.estimatedEffortHours as number) ?? null,
                  isPublic: candidate.isPublic === true,
                  impactStatement: (candidate.description as string) ?? null,
                  contextJson: {
                    ...buildStoredProposalContext({ candidate, decision }),
                    acceptanceCriteria:
                      (candidate.acceptanceCriteria as string[]) ?? [],
                    best_route: (candidate.bestRoute as string) ?? null,
                    executor_type: normalizeExecutorType(
                      candidate.executorType,
                    ),
                    sourceProvenance: asObject(candidate.source),
                  },
                  deadlinePolicy: normalizeDeadlinePolicy(
                    candidate.deadlinePolicy,
                  ),
                  dueAt: parseTaskDate(candidate.dueAt),
                  status: TaskStatus.DRAFT,
                } as any,
              });
              await endpoints.upsertPrimaryTaskCommunicationEndpoint(
                prisma,
                task.id,
                {
                  url: (candidate.contactUrl as string) ?? null,
                },
              );
              await attachProposalImpactEstimate({
                actor: { isAdmin, userId },
                estimatedEffortHours:
                  (candidate.estimatedEffortHours as number) ?? null,
                impact: (candidate.impact as Record<string, unknown>) ?? null,
                prisma,
                sourceUrls: asStringArray(candidate.sourceUrls),
                taskId: task.id,
              });
              await attachProposalSourceArtifact({
                prisma,
                source: asObject(candidate.source),
                taskId: task.id,
              });

              created.push({
                taskId: task.id,
                title: task.title,
                proposalRef: decision.proposalRef,
              });
              createdRefToTaskId.set(decision.proposalRef, task.id);
              if (candidate.taskKey)
                createdRefToTaskId.set(candidate.taskKey as string, task.id);
              if (candidate.id)
                createdRefToTaskId.set(candidate.id as string, task.id);
              createdDecisionByTaskId.set(task.id, { candidate, decision });
            }

            for (const [
              taskId,
              { candidate },
            ] of createdDecisionByTaskId.entries()) {
              const parentTaskRef = (candidate.parentTaskRef as string) ?? null;
              if (parentTaskRef) {
                const parentTaskId =
                  createdRefToTaskId.get(parentTaskRef) ??
                  existingRefToTaskId.get(parentTaskRef) ??
                  null;
                if (parentTaskId) {
                  await prisma.task.update({
                    where: { id: taskId },
                    data: { parentTaskId },
                  });
                }
              }

              for (const blockerRef of (
                (candidate.blockerRefs as string[]) ?? []
              ).filter(Boolean)) {
                const blockerTaskId =
                  createdRefToTaskId.get(blockerRef) ??
                  existingRefToTaskId.get(blockerRef) ??
                  null;
                if (!blockerTaskId) continue;

                const dependency = (
                  (candidate.dependencies as Array<Record<string, unknown>>) ??
                  []
                ).find((item) => item.taskRef === blockerRef);
                const probabilityDeltaBase = parseFiniteNumber(
                  dependency?.probabilityDeltaBase,
                );
                const timeDeltaDaysBase = parseFiniteNumber(
                  dependency?.timeDeltaDaysBase,
                );
                if (
                  probabilityDeltaBase != null &&
                  (probabilityDeltaBase < 0 || probabilityDeltaBase > 1)
                ) {
                  throw new Error(
                    `Dependency ${blockerRef} probabilityDeltaBase must be between 0 and 1.`,
                  );
                }
                if (timeDeltaDaysBase != null && timeDeltaDaysBase < 0) {
                  throw new Error(
                    `Dependency ${blockerRef} timeDeltaDaysBase must be non-negative.`,
                  );
                }

                await prisma.taskEdge.create({
                  data: {
                    assumptionsJson:
                      asStringArray(dependency?.assumptions).length > 0
                        ? toInputJsonValue({
                            assumptions: asStringArray(dependency?.assumptions),
                          })
                        : undefined,
                    calculationVersion:
                      (dependency?.calculationVersion as string) ?? null,
                    edgeType: TaskEdgeType.BLOCKS,
                    fromTaskId: blockerTaskId,
                    probabilityDeltaBase,
                    timeDeltaDaysBase,
                    toTaskId: taskId,
                  },
                });
              }
            }

            return ok({
              review,
              changedDrafts,
              createdDrafts: created,
              existingDrafts,
              message: `${review.promotableCount} of ${review.decisions.length} new candidates passed review. ${created.length} drafts created; ${existingDrafts.length} source-identical tasks reused; ${changedDrafts.length} changed sources require review.`,
            });
          }

          // ── promoteTask ────────────────────────────────────────
          case "promoteTask": {
            if (!userId) {
              return authRequired(
                "promoteTask",
                "Promotion requires an authenticated owner reviewing their drafts.",
              );
            }
            const prisma = await getPrisma();
            const refs = asStringArray(a.proposalRefs);
            if (refs.length === 0) {
              return err(
                "proposalRefs must contain at least one draft reference.",
              );
            }
            const promoted: Array<{ taskId: string; title: string }> = [];
            const rejected: Array<{ ref: string; reason: string }> = [];
            const { reviewTaskProposalBundle } =
              await import("@optimitron/agent");
            const promotionPersonId = await loadSessionPersonId(userId);
            const manageableTaskWhere = getTaskAccessWhere({
              action: "MANAGE",
              personId: promotionPersonId,
              userId,
            });

            const draftTasks = await prisma.task.findMany({
              where: {
                AND: [
                  {
                    OR: refs.flatMap((ref) => [{ id: ref }, { taskKey: ref }]),
                  },
                  {
                    OR: [
                      manageableTaskWhere,
                      ...(isAdmin ? [{ isPublic: true }] : []),
                    ],
                  },
                  getTaskScopeWhere(scopes, organizationIds),
                ],
                deletedAt: null,
                status: TaskStatus.DRAFT,
              },
              select: {
                assigneeOrganizationId: true,
                assigneePersonId: true,
                communicationEndpoints: {
                  where: { deletedAt: null },
                  orderBy: [
                    { isPrimary: "desc" },
                    { priority: "asc" },
                    { createdAt: "asc" },
                  ],
                  select: {
                    email: true,
                    isPrimary: true,
                    priority: true,
                    url: true,
                  },
                },
                contextJson: true,
                createdByUserId: true,
                description: true,
                estimatedEffortHours: true,
                id: true,
                isPublic: true,
                ownerOrganizationId: true,
                parentTaskId: true,
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
                rejected.push({
                  ref,
                  reason: "No DRAFT task found with this ID or taskKey.",
                });
              }
            }

            if (draftTasks.length === 0) {
              return ok({
                promoted,
                rejected,
                message: `${promoted.length} promoted, ${rejected.length} rejected.`,
              });
            }

            const graph = await loadExecutionGraphContext(
              draftTasks as unknown as PersonalQueueTaskRecord[],
              taskClientBoundary,
            );
            const dependencyEdges = await loadReachableDependencyEdges(
              prisma,
              draftTasks.map((task) => task.id),
            );
            const cycleFindings = auditExecutionGraph({
              edges: dependencyEdges,
              tasks: graph.graphTasks,
            }).filter(
              (finding) =>
                finding.code === "DEPENDENCY_CYCLE" ||
                finding.code === "PARENT_CYCLE",
            );
            if (cycleFindings.length > 0) {
              const reason = cycleFindings
                .map((finding) => finding.message)
                .join(" ");
              for (const task of draftTasks) {
                const ref = task.taskKey ?? task.id;
                if (!rejected.some((item) => item.ref === ref)) {
                  rejected.push({ ref, reason });
                }
              }
              return ok({
                promoted,
                rejected,
                message: `${promoted.length} promoted, ${rejected.length} rejected.`,
              });
            }

            const existingTasks = await prisma.task.findMany({
              where: {
                deletedAt: null,
                id: { notIn: draftTasks.map((task) => task.id) },
                AND: [
                  getTaskAccessWhere({
                    action: "READ",
                    personId: promotionPersonId,
                    userId,
                  }),
                  getTaskScopeWhere(scopes, organizationIds),
                ],
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
              candidates: draftTasks.map((task) =>
                taskProposalCandidateFromRecord(task),
              ),
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
              review.decisions.map((decision) => [
                decision.proposalRef,
                decision,
              ]),
            );

            for (const task of draftTasks) {
              if (!graph.rootedTaskIds.has(task.id)) {
                rejected.push({
                  ref: task.taskKey ?? task.id,
                  reason:
                    "Task is not rooted under Optimize Earth through parentTaskId.",
                });
                continue;
              }
              if (
                rejected.some((item) => item.ref === (task.taskKey ?? task.id))
              ) {
                continue;
              }
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

            return ok({
              promoted,
              rejected,
              message: `${promoted.length} promoted, ${rejected.length} rejected.`,
            });
          }

          // ── updateTask ─────────────────────────────────────────
          case "updateTask": {
            if (!userId)
              return authRequired(
                name,
                "This tool needs an identified user to attribute writes or fetch personal data.",
              );

            const { ranking, tasks } = await getTaskFunctions();
            const prisma = await getPrisma();
            const isAdminWriter = hasAdminTaskWriteAccess(scopes, isAdmin);
            if (
              a.status === "VERIFIED" ||
              a.verifiedAt !== undefined ||
              a.completedAt !== undefined ||
              a.completionEvidence !== undefined
            ) {
              return err(
                "Completion and VERIFIED status can only be recorded through execution submission and verification acceptance.",
              );
            }
            const updates: Record<string, unknown> = {};
            const existingDetail = await tasks.getTaskDetailData(
              a.taskId as string,
              userId,
              { clientAccessBoundary: taskClientBoundary },
            );
            let existingTask = existingDetail?.task as
              | PersonalQueueTaskRecord
              | undefined;
            if (!existingTask && isAdminWriter) {
              const adminVisibleTask = await prisma.task.findFirst({
                where: {
                  deletedAt: null,
                  id: a.taskId as string,
                  isPublic: true,
                },
                select: {
                  contextJson: true,
                  createdByUserId: true,
                  currentImpactEstimateSet: {
                    select: {
                      frames: {
                        orderBy: { evaluationHorizonYears: "desc" },
                        select: {
                          estimatedCashCostUsdBase: true,
                          estimatedEffortHoursBase: true,
                          expectedEconomicValueUsdBase: true,
                          frameKey: true,
                          timeToImpactStartDays: true,
                          successProbabilityBase: true,
                        },
                        where: { deletedAt: null },
                      },
                    },
                  },
                  deadlinePolicy: true,
                  estimatedEffortHours: true,
                  id: true,
                  isPublic: true,
                  ownerOrganizationId: true,
                },
              });
              if (adminVisibleTask) {
                const selectedImpactFrame =
                  adminVisibleTask.currentImpactEstimateSet?.frames.find(
                    (frame) =>
                      frame.frameKey === TaskImpactFrameKey.TWENTY_YEAR,
                  ) ??
                  adminVisibleTask.currentImpactEstimateSet?.frames[0] ??
                  null;
                existingTask = {
                  ...adminVisibleTask,
                  selectedImpactFrame,
                } as unknown as PersonalQueueTaskRecord;
              }
            }
            if (!existingTask) return err("Task not found");
            if (existingTask.isPublic && !isAdminWriter) {
              return err("Updating public tasks requires an admin user.");
            }
            if (
              !existingTask.isPublic &&
              !(await canUserManageTask(existingTask.id, userId))
            ) {
              return err("Task not found");
            }
            if (
              !isTaskWithinClientAccessBoundary(
                {
                  isPublic: existingTask.isPublic === true,
                  ownerOrganizationId: existingTask.ownerOrganizationId,
                },
                taskClientBoundary,
              )
            ) {
              return err("Task not found");
            }
            if (a.parentTaskId !== undefined) {
              const parentTaskId = requiredString(
                a.parentTaskId,
                "parentTaskId",
              );
              if (typeof parentTaskId !== "string") return parentTaskId;
              let parentTask: Awaited<
                ReturnType<typeof validateExplicitTaskParent>
              >;
              try {
                parentTask = await validateExplicitTaskParent({
                  parentTaskId,
                  prisma,
                  taskId: existingTask.id,
                  userId,
                });
              } catch (error) {
                return err(
                  error instanceof Error
                    ? error.message
                    : "Invalid parent task.",
                );
              }
              if (!parentTask.isPublic && existingTask.isPublic) {
                return err("A private parent cannot contain a public task.");
              }
              if (
                !existingTask.isPublic &&
                !parentTask.isPublic &&
                (existingTask.ownerOrganizationId ?? null) !==
                  (parentTask.ownerOrganizationId ?? null)
              ) {
                return err(
                  "A private task cannot be moved across organization ownership boundaries.",
                );
              }
              updates.parentTaskId = parentTaskId;
            }
            const dependencyPatchProvided =
              Array.isArray(a.depends_on) || Array.isArray(a.blockerTaskIds);
            const blockerTaskIds = dependencyPatchProvided
              ? dedupeStrings([
                  ...(Array.isArray(a.blockerTaskIds)
                    ? (a.blockerTaskIds as string[])
                    : []),
                  ...(Array.isArray(a.depends_on)
                    ? (a.depends_on as string[])
                    : []),
                ])
              : [];
            if (dependencyPatchProvided && blockerTaskIds.length > 0) {
              const sessionPersonId = await loadSessionPersonId(userId);
              const dependencyTasks = await prisma.task.findMany({
                where: {
                  deletedAt: null,
                  id: { in: blockerTaskIds },
                  AND: [
                    getTaskAccessWhere({
                      action: "READ",
                      personId: sessionPersonId,
                      userId,
                    }),
                    getTaskScopeWhere(scopes, organizationIds),
                  ],
                },
                select: { createdByUserId: true, id: true, isPublic: true },
              });
              const foundDependencyIds = new Set(
                dependencyTasks.map((task) => task.id),
              );
              const missingDependencyIds = blockerTaskIds.filter(
                (id) => !foundDependencyIds.has(id),
              );
              if (missingDependencyIds.length > 0) {
                return err(
                  "One or more dependency tasks were not found or are inaccessible.",
                );
              }
            }
            if (dependencyPatchProvided) {
              const dependencyEdges = await loadReachableDependencyEdges(
                prisma,
                [existingTask.id],
              );
              const proposedEdges = [
                ...dependencyEdges.filter(
                  (edge) => edge.toTaskId !== existingTask.id,
                ),
                ...blockerTaskIds
                  .filter((blockerTaskId) => blockerTaskId !== existingTask.id)
                  .map((blockerTaskId) => ({
                    edgeType: TaskEdgeType.BLOCKS,
                    fromTaskId: blockerTaskId,
                    toTaskId: existingTask.id,
                  })),
              ];
              const cycle = auditExecutionGraph({
                edges: proposedEdges,
                tasks: [
                  {
                    activeChildTaskCount: 0,
                    hasMarginalEstimate: false,
                    id: existingTask.id,
                    parentTaskId: OPTIMIZE_EARTH_ROOT_TASK_ID,
                  },
                ],
              }).find((finding) => finding.code === "DEPENDENCY_CYCLE");
              if (cycle) {
                return err(`Dependency update rejected: ${cycle.message}`);
              }
            }
            const economicsPatch = hasEconomicsPatch(a);
            const economics = resolveTaskEconomics(a, existingTask);
            try {
              Object.assign(updates, buildTaskRoutingData(a));
            } catch (error) {
              return err(
                error instanceof Error
                  ? error.message
                  : "Invalid task routing field.",
              );
            }
            if (a.status)
              updates.status = TaskStatus[a.status as keyof typeof TaskStatus];
            if (a.title) updates.title = a.title;
            if (a.description) updates.description = a.description;
            if (a.impactStatement) updates.impactStatement = a.impactStatement;
            if (typeof a.category === "string" && a.category in TaskCategory) {
              updates.category =
                TaskCategory[a.category as keyof typeof TaskCategory];
            }
            if (a.taskKey) updates.taskKey = a.taskKey;
            if (a.roleTitle !== undefined)
              updates.roleTitle = (a.roleTitle as string) || null;
            if (a.sortOrder !== undefined) updates.sortOrder = a.sortOrder;
            if (a.available_at !== undefined || a.availableAt !== undefined) {
              const rawAvailableAt = a.available_at ?? a.availableAt;
              updates.availableAt = rawAvailableAt
                ? parseTaskDate(rawAvailableAt)
                : null;
            }
            if (a.due_at !== undefined || a.dueAt !== undefined) {
              const rawDueAt = a.due_at ?? a.dueAt;
              const nextDueAt = (rawDueAt as string)
                ? parseTaskDate(rawDueAt)
                : null;
              const existingPolicy = normalizeDeadlinePolicy(
                existingTask.deadlinePolicy,
                "NONE",
              );
              updates.dueAt = nextDueAt;
              if (
                a.deadline_policy === undefined &&
                a.deadlinePolicy === undefined
              ) {
                updates.deadlinePolicy = nextDueAt
                  ? existingPolicy === "NONE"
                    ? "SOFT"
                    : existingPolicy
                  : "NONE";
              }
            }
            if (
              a.deadline_policy !== undefined ||
              a.deadlinePolicy !== undefined
            ) {
              updates.deadlinePolicy = normalizeDeadlinePolicy(
                a.deadline_policy ?? a.deadlinePolicy,
              );
            }
            if (a.assigneePersonId !== undefined) {
              updates.assigneePersonId = (a.assigneePersonId as string) || null;
            }
            if (a.assigneeOrganizationId !== undefined) {
              updates.assigneeOrganizationId =
                (a.assigneeOrganizationId as string) || null;
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
                buildPersonalTaskContext(
                  a,
                  economics,
                  existingTask.contextJson,
                ) ?? {},
              );
            }

            const task = await prisma.$transaction(
              async (tx) => {
                const updated = await tx.task.update({
                  where: { id: a.taskId as string },
                  data:
                    Object.keys(updates).length > 0
                      ? (updates as any)
                      : { updatedAt: new Date() },
                });
                if (dependencyPatchProvided) {
                  const { TaskEdgeType } = await import("@optimitron/db");
                  const dependencyEdgeTypes = [
                    TaskEdgeType.BLOCKS,
                    TaskEdgeType.DEPENDS_ON,
                  ];
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
                    const existingEdges = await tx.taskEdge.findMany({
                      where: {
                        toTaskId: updated.id,
                        fromTaskId: {
                          in: incomingEdges.map((edge) => edge.fromTaskId),
                        },
                        edgeType: { in: dependencyEdgeTypes },
                      },
                      orderBy: { createdAt: "asc" },
                      select: {
                        deletedAt: true,
                        edgeType: true,
                        fromTaskId: true,
                        id: true,
                      },
                    });
                    const retainedByBlockerId = new Map<
                      string,
                      (typeof existingEdges)[number]
                    >();
                    for (const edge of existingEdges) {
                      const retained = retainedByBlockerId.get(edge.fromTaskId);
                      if (
                        !retained ||
                        (retained.deletedAt != null && edge.deletedAt == null)
                      ) {
                        retainedByBlockerId.set(edge.fromTaskId, edge);
                      }
                    }
                    const retainedIds = [...retainedByBlockerId.values()].map(
                      (edge) => edge.id,
                    );
                    if (retainedIds.length > 0) {
                      await tx.taskEdge.updateMany({
                        where: { id: { in: retainedIds } },
                        data: { deletedAt: null },
                      });
                    }
                    const duplicateActiveIds = existingEdges
                      .filter(
                        (edge) =>
                          edge.deletedAt == null &&
                          retainedByBlockerId.get(edge.fromTaskId)?.id !==
                            edge.id,
                      )
                      .map((edge) => edge.id);
                    if (duplicateActiveIds.length > 0) {
                      await tx.taskEdge.updateMany({
                        where: { id: { in: duplicateActiveIds } },
                        data: { deletedAt: new Date() },
                      });
                    }
                    const missingEdges = incomingEdges.filter(
                      (edge) => !retainedByBlockerId.has(edge.fromTaskId),
                    );
                    if (missingEdges.length > 0) {
                      await tx.taskEdge.createMany({
                        data: missingEdges,
                        skipDuplicates: true,
                      });
                    }
                  }
                }
                if (economicsPatch) {
                  await attachDirectTaskImpactEstimate({
                    actor: { isAdmin: isAdminWriter, userId },
                    prisma: tx,
                    publish: existingTask.isPublic === true,
                    taskId: updated.id,
                    estimatedEffortHours: economics.estimatedEffortHours,
                    estimatedCashCostUsdBase:
                      economics.estimatedCashCostUsdBase,
                    expectedEconomicValueUsdBase:
                      economics.expectedEconomicValueUsdBase,
                    successProbabilityBase: economics.pSuccess,
                    timeToImpactStartDays: economics.timeToImpactStartDays,
                  });
                }
                return updated;
              },
              { maxWait: 10_000, timeout: 60_000 },
            );
            const fresh = await tasks.getTaskDetailData(task.id, userId, {
              clientAccessBoundary: taskClientBoundary,
            });
            const scored = fresh
              ? buildPersonalQueueRows(
                  [fresh.task],
                  ranking,
                  DEFAULT_PERSONAL_BUYBACK_RATE,
                  {
                    limit: 1,
                  },
                )
              : [];

            return ok(
              scored[0] ?? {
                taskId: task.id,
                status: task.status,
                title: task.title,
              },
            );
          }

          case "deleteTask": {
            if (!userId)
              return authRequired(
                name,
                "This tool needs an identified user to attribute writes or fetch personal data.",
              );

            const prisma = await getPrisma();
            const taskId = a.taskId as string;
            if (!taskId) return err("taskId is required");

            const personId = await loadSessionPersonId(userId);
            const existing = await prisma.task.findFirst({
              where: {
                deletedAt: null,
                id: taskId,
                OR: [
                  { isPublic: true },
                  getTaskAccessWhere({
                    action: "MANAGE",
                    personId,
                    userId,
                  }),
                ],
              },
              select: {
                createdByUserId: true,
                isPublic: true,
                ownerOrganizationId: true,
              },
            });
            if (!existing) return err("Task not found");
            const isAdminDeleter = hasAdminTaskWriteAccess(scopes, isAdmin);
            if (existing.isPublic && !isAdminDeleter) {
              return err("Deleting public tasks requires an admin user.");
            }
            if (
              !isTaskWithinClientAccessBoundary(existing, taskClientBoundary)
            ) {
              return err("Task not found");
            }

            await prisma.task.update({
              where: { id: taskId },
              data: { deletedAt: new Date() },
            });

            return ok({ taskId, deleted: true });
          }

          // ── recordTaskActuals ──────────────────────────────────
          case "recordTaskActuals": {
            if (!userId) {
              return authRequired(
                "recordTaskActuals",
                "Execution history must be attributed to an authenticated user.",
              );
            }
            const prisma = await getPrisma();
            const personId = await loadSessionPersonId(userId);
            const existing = await prisma.task.findFirst({
              where: {
                deletedAt: null,
                id: a.taskId as string,
                OR: [
                  getTaskAccessWhere({
                    action: "EXECUTE",
                    personId,
                    userId,
                  }),
                  ...(isAdmin ? [{ isPublic: true }] : []),
                ],
              },
              select: {
                actualCashCostUsd: true,
                actualEffortSeconds: true,
                assigneeOrganizationId: true,
                assigneePersonId: true,
                contextJson: true,
                createdByUserId: true,
                id: true,
                isPublic: true,
                ownerOrganizationId: true,
                title: true,
              },
            });
            if (!existing) return err("Task not found");
            if (
              !isTaskWithinClientAccessBoundary(existing, taskClientBoundary)
            ) {
              return err("Task not found");
            }

            const context = asObject(existing.contextJson) ?? {};
            const executionV1 = asObject(context.executionV1) ?? {};
            const note = (a.note as string) ?? null;
            const attemptCashCostUsd =
              a.actualCashCostUsd === undefined
                ? null
                : parseFiniteNumber(a.actualCashCostUsd);
            const attemptEffortSeconds =
              a.actualEffortSeconds === undefined
                ? null
                : parseFiniteNumber(a.actualEffortSeconds);
            if (
              a.actualCashCostUsd !== undefined &&
              attemptCashCostUsd == null
            ) {
              return err("actualCashCostUsd must be a finite number.");
            }
            if (
              a.actualEffortSeconds !== undefined &&
              attemptEffortSeconds == null
            ) {
              return err("actualEffortSeconds must be a finite number.");
            }
            const actualCashCostUsd =
              attemptCashCostUsd ?? existing.actualCashCostUsd ?? null;
            const actualEffortSeconds =
              attemptEffortSeconds ?? existing.actualEffortSeconds ?? null;
            if (attemptCashCostUsd != null && attemptCashCostUsd < 0) {
              return err("actualCashCostUsd must be non-negative.");
            }
            if (attemptEffortSeconds != null && attemptEffortSeconds < 0) {
              return err("actualEffortSeconds must be non-negative.");
            }
            if (
              attemptEffortSeconds != null &&
              !Number.isInteger(attemptEffortSeconds)
            ) {
              return err("actualEffortSeconds must be a whole number.");
            }
            const completedAt =
              a.completedAt === undefined
                ? new Date()
                : parseTaskDate(a.completedAt);
            if (!completedAt) {
              return err("completedAt must be a valid ISO 8601 timestamp.");
            }

            const attempt = await prisma.taskExecutionAttempt.create({
              data: {
                actualCostCurrency: attemptCashCostUsd == null ? null : "usd",
                actualCostMinorUnits:
                  attemptCashCostUsd == null
                    ? null
                    : BigInt(Math.round(attemptCashCostUsd * 100)),
                actualDurationSeconds: attemptEffortSeconds,
                completedAt,
                executorKey: `user:${userId}`,
                executorKind: TaskCandidateKind.USER,
                executorPersonId: personId,
                executorUserId: userId,
                metadata: note
                  ? ({
                      note,
                      source: "mcp-record-task-actuals",
                    } as Prisma.InputJsonValue)
                  : ({
                      source: "mcp-record-task-actuals",
                    } as Prisma.InputJsonValue),
                outputSummary: note,
                startedAt:
                  attemptEffortSeconds == null
                    ? null
                    : new Date(
                        completedAt.getTime() - attemptEffortSeconds * 1000,
                      ),
                status: TaskExecutionAttemptStatus.COMPLETED,
                taskId: existing.id,
              },
            });

            const task = await prisma.task.update({
              where: { id: a.taskId as string },
              data: {
                actualCashCostUsd,
                actualEffortSeconds,
                contextJson: {
                  ...context,
                  executionV1: {
                    ...executionV1,
                    lastActuals: {
                      actualCashCostUsd,
                      actualEffortSeconds,
                      note,
                      recordedAt: new Date().toISOString(),
                    },
                  },
                },
              },
            });

            return ok({
              actualCashCostUsd: task.actualCashCostUsd,
              actualEffortSeconds: task.actualEffortSeconds,
              executionAttemptId: attempt.id,
              taskId: task.id,
              title: task.title,
            });
          }

          // ── Parameter catalog and deterministic impacts ────────
          case "searchParameters": {
            const catalog =
              await import("./parameters/parameter-catalog.server");
            return ok(
              await catalog.searchParameters(
                {
                  limit: typeof a.limit === "number" ? a.limit : undefined,
                  query: typeof a.query === "string" ? a.query : undefined,
                },
                { isAdmin, userId: userId ?? null },
              ),
            );
          }

          case "getParameterTrace": {
            const catalog =
              await import("./parameters/parameter-catalog.server");
            return ok(
              await catalog.getParameterTrace(
                {
                  key: typeof a.key === "string" ? a.key : undefined,
                  revisionId:
                    typeof a.revisionId === "string" ? a.revisionId : undefined,
                },
                { isAdmin, userId: userId ?? null },
              ),
            );
          }

          case "getTaskImpactTrace": {
            const impact =
              await import("./parameters/task-impact-calculation.server");
            return ok(
              await impact.getTaskImpactTrace(
                {
                  estimateSetId:
                    typeof a.estimateSetId === "string"
                      ? a.estimateSetId
                      : undefined,
                  taskId: typeof a.taskId === "string" ? a.taskId : undefined,
                },
                { isAdmin, userId: userId ?? null },
              ),
            );
          }

          case "proposeParameterBundle": {
            if (!userId)
              return authRequired(
                name,
                "Parameter proposals need an identified owner.",
              );
            const catalog =
              await import("./parameters/parameter-catalog.server");
            return ok(
              await catalog.proposeParameterBundle(a.parameters, {
                isAdmin,
                userId,
              }),
            );
          }

          case "reviewParameterRevision": {
            if (!userId)
              return authRequired(
                name,
                "Parameter review requires authentication.",
              );
            if (a.action !== "publish" && a.action !== "reject") {
              return err("action must be publish or reject");
            }
            const catalog =
              await import("./parameters/parameter-catalog.server");
            return ok(
              await catalog.reviewParameterRevision(
                {
                  action: a.action,
                  revisionId: String(a.revisionId ?? ""),
                },
                { isAdmin, userId },
              ),
            );
          }

          case "proposeTaskImpact":
          case "setTaskImpact": {
            if (!userId)
              return authRequired(
                name,
                "Task-impact estimates need an identified proposer.",
              );
            const impact =
              await import("./parameters/task-impact-calculation.server");
            return ok(
              await impact.createDirectTaskImpact(
                {
                  ...a,
                  frameKey: enumValue(
                    TaskImpactFrameKey,
                    a.frameKey,
                    TaskImpactFrameKey.FIVE_YEAR,
                  ),
                },
                { isAdmin, userId },
                { publish: name === "setTaskImpact" },
              ),
            );
          }

          // ── claimTask ──────────────────────────────────────────
          case "claimTask": {
            const { tasks } = await getTaskFunctions();
            if (!userId) return authRequired(name, "Claiming requires OAuth.");
            if (!(await canAccessTaskResource(a.taskId as string, "COMMENT"))) {
              return err("Task not found");
            }
            const claim = await tasks.claimTask(a.taskId as string, userId);
            return ok({ claimId: claim.id, status: claim.status });
          }

          // ── claimSignerReminder ────────────────────────────────
          case "claimSignerReminder": {
            if (!userId)
              return authRequired(
                name,
                "Reminder subtasks are created for the citizen who claims them; they must be authenticated.",
              );
            const signerTaskId = a.signerTaskId as string | undefined;
            if (!signerTaskId || typeof signerTaskId !== "string") {
              return err("signerTaskId is required");
            }

            const prisma = await getPrisma();
            const { upsertSignerReminderTask } =
              await import("./signer-reminder-tasks.server");
            const { buildSignerReminderTaskKey } =
              await import("./tasks/task-keys");

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

            if (!parentTask)
              return err(`Signer task not found: ${signerTaskId}`);
            if (!callingUser?.referralCode)
              return err(
                "User missing referralCode — cannot attribute signer conversion.",
              );

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

            if (
              !parentTask.assigneePerson?.displayName ||
              !parentTask.assigneeOrganization?.name
            ) {
              return err(
                `Signer task ${signerTaskId} is missing assignee data (need both assigneePerson + assigneeOrganization).`,
              );
            }

            // 3. Upsert the reminder subtask via the trigger framework. Fires
            // its own transaction; idempotent on (countryCode, userId).
            const result = await upsertSignerReminderTask({
              creatorPersonId: callingUser.personId ?? null,
              creatorUserId: userId,
              referralCode: callingUser.referralCode!,
              signer: {
                countryCode,
                governmentName: parentTask.assigneeOrganization!.name,
                id: parentTask.id,
                leaderName: parentTask.assigneePerson!.displayName,
                roleTitle: parentTask.roleTitle,
                taskKey:
                  parentTask.taskKey ??
                  buildSignerReminderTaskKey(countryCode, userId),
              },
            });

            // 4. Return the freshly-summarized task so the caller has the actionLink etc.
            const { tasks } = await getTaskFunctions();
            const detail = await tasks.getTaskDetailData(result.taskId, userId, {
              clientAccessBoundary: taskClientBoundary,
            });
            if (!detail)
              return err(
                "Reminder subtask created but could not be loaded for summary.",
              );

            // Fire `mcp.claimSignerReminder` so AI-authored TaskTrigger blueprints
            // can layer additional behavior. The seeded treaty:signer-reminder
            // trigger is idempotent (Task upsert by taskKey) and currently
            // produces an equivalent task to the one already created above.
            const {
              fireTaskTriggersForEvent: fireForClaim,
              buildTriggerContext: buildCtxClaim,
            } = await import("./triggers");
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
            if (!userId)
              return authRequired(name, "Completing a claim requires OAuth.");
            if (!(await canAccessTaskResource(a.taskId as string, "COMMENT"))) {
              return err("Task not found");
            }
            const claim = await tasks.completeTaskClaim(
              a.taskId as string,
              userId,
              a.completionEvidence as string,
            );
            return ok({ claimId: claim.id, status: claim.status });
          }

          // ── addDependency ──────────────────────────────────────
          case "addDependency": {
            if (!userId)
              return authRequired(
                name,
                "This tool needs an identified user to update private task dependencies.",
              );
            const prisma = await getPrisma();
            const { TaskEdgeType } = await import("@optimitron/db");
            const blockedTaskId = a.blockedTaskId as string;
            const blockerTaskId = a.blockerTaskId as string;
            const sessionPersonId = await loadSessionPersonId(userId);
            const dependencyTasks = await prisma.task.findMany({
              where: {
                deletedAt: null,
                id: { in: [blockedTaskId, blockerTaskId] },
                AND: [
                  getTaskAccessWhere({
                    action: "READ",
                    personId: sessionPersonId,
                    userId,
                  }),
                  getTaskScopeWhere(scopes, organizationIds),
                ],
              },
              select: {
                createdByUserId: true,
                id: true,
                isPublic: true,
                ownerOrganizationId: true,
              },
            });
            const blockedTask = dependencyTasks.find(
              (task) => task.id === blockedTaskId,
            );
            const blockerTask = dependencyTasks.find(
              (task) => task.id === blockerTaskId,
            );
            if (!blockedTask || !blockerTask) return err("Task not found");
            if (blockedTaskId === blockerTaskId) {
              return err("A task cannot depend on itself.");
            }
            const canManageBlockedTask = blockedTask.isPublic
              ? hasAdminTaskWriteAccess(scopes, isAdmin)
              : await canUserManageTask(blockedTask.id, userId);
            if (!canManageBlockedTask) {
              return err("Task not found");
            }
            const probabilityDeltaBase = parseFiniteNumber(
              a.probabilityDeltaBase ?? a.increases_p_success,
            );
            if (
              probabilityDeltaBase != null &&
              (probabilityDeltaBase < 0 || probabilityDeltaBase > 1)
            ) {
              return err("probabilityDeltaBase must be between 0 and 1");
            }
            const timeDeltaDaysBase = parseFiniteNumber(
              a.timeDeltaDaysBase ?? a.time_delta_days,
            );
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
              typeof a.calculationVersion === "string" &&
              a.calculationVersion.trim()
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
            const dependencyEdges = await loadReachableDependencyEdges(prisma, [
              blockedTaskId,
            ]);
            const cycle = auditExecutionGraph({
              edges: [
                ...dependencyEdges,
                {
                  edgeType: TaskEdgeType.BLOCKS,
                  fromTaskId: blockerTaskId,
                  toTaskId: blockedTaskId,
                },
              ],
              tasks: [
                {
                  activeChildTaskCount: 0,
                  hasMarginalEstimate: false,
                  id: blockedTaskId,
                  parentTaskId: OPTIMIZE_EARTH_ROOT_TASK_ID,
                },
              ],
            }).find((finding) => finding.code === "DEPENDENCY_CYCLE");
            if (cycle) {
              return err(`Dependency update rejected: ${cycle.message}`);
            }
            await prisma.taskEdge.updateMany({
              where: {
                fromTaskId: a.blockerTaskId as string,
                toTaskId: a.blockedTaskId as string,
                edgeType: TaskEdgeType.BLOCKS,
              },
              data: { deletedAt: null, ...edgeMetadata },
            });
            await prisma.taskEdge.createMany({
              data: [
                {
                  fromTaskId: a.blockerTaskId as string,
                  toTaskId: a.blockedTaskId as string,
                  edgeType: TaskEdgeType.BLOCKS,
                  ...edgeMetadata,
                },
              ],
              skipDuplicates: true,
            });
            return ok({
              blockedTaskId,
              blockerTaskId,
              created: true,
              ...edgeMetadata,
            });
          }

          // ── getBlockers ────────────────────────────────────────
          case "getBlockers": {
            if (!userId)
              return authRequired(
                name,
                "Reading private blockers requires OAuth.",
              );
            const prisma = await getPrisma();
            const { TaskEdgeType } = await import("@optimitron/db");
            const taskId = a.taskId as string;
            const sessionPersonId = await loadSessionPersonId(userId);
            const targetTask = await prisma.task.findFirst({
              where: {
                deletedAt: null,
                id: taskId,
                ...getTaskAccessWhere({
                  action: "READ",
                  personId: sessionPersonId,
                  userId,
                }),
              },
              select: { isPublic: true, ownerOrganizationId: true },
            });
            if (
              !targetTask ||
              !isTaskWithinClientAccessBoundary(
                targetTask,
                taskClientBoundary,
              )
            ) {
              return err("Task not found");
            }
            const relatedTaskAccess = {
              AND: [
                getTaskAccessWhere({
                  action: "READ" as const,
                  personId: sessionPersonId,
                  userId,
                }),
                getTaskScopeWhere(scopes, organizationIds),
              ],
            } satisfies Prisma.TaskWhereInput;
            const [blockedBy, blocks] = await Promise.all([
              prisma.taskEdge.findMany({
                where: {
                  deletedAt: null,
                  fromTask: relatedTaskAccess,
                  toTaskId: taskId,
                  edgeType: {
                    in: [TaskEdgeType.BLOCKS, TaskEdgeType.DEPENDS_ON],
                  },
                },
                include: {
                  fromTask: { select: { id: true, title: true, status: true } },
                },
              }),
              prisma.taskEdge.findMany({
                where: {
                  deletedAt: null,
                  fromTaskId: taskId,
                  toTask: relatedTaskAccess,
                  edgeType: {
                    in: [TaskEdgeType.BLOCKS, TaskEdgeType.DEPENDS_ON],
                  },
                },
                include: {
                  toTask: { select: { id: true, title: true, status: true } },
                },
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
            const runId = optionalString(a.runId);
            const provider = optionalString(a.provider);
            const taskId = optionalString(a.taskId);
            const apiCalls = positiveInteger(a.apiCalls);
            const actualCostMinorUnits = dollarsToMinorUnits(a.costUsd);
            const status = parseAgentRunExecutionStatus(a.status);
            const outputSummary = optionalString(a.outputSummary);
            if (!runId) return err("runId is required.");
            if (!provider) return err("provider is required.");
            if (!taskId) return err("taskId is required.");
            if (apiCalls === null) {
              return err("apiCalls must be a non-negative integer.");
            }
            if (actualCostMinorUnits === null) {
              return err("costUsd must be a non-negative finite number.");
            }
            if (!status) {
              return err(
                "status must be RUNNING, COMPLETED, FAILED, or PARTIAL.",
              );
            }
            const agentId = optionalString(a.agentId);
            const attempt = await prisma.taskExecutionAttempt.create({
              data: {
                taskId,
                executorKind: TaskCandidateKind.AGENT,
                executorKey: agentId ?? `${provider}:${runId}`,
                status,
                actualCostMinorUnits,
                actualCostCurrency: "usd",
                outputSummary,
                metadata: toInputJsonValue({
                  agentId: agentId ?? null,
                  apiCalls,
                  provider,
                  runId,
                }),
              },
            });
            return ok({ id: attempt.id, runId });
          }

          // ── acquireLease ───────────────────────────────────────
          case "acquireLease": {
            const { lease } = await getTaskFunctions();
            const result = await lease.acquireLease(
              a.taskId as string,
              a.agentId as string,
              (a.leaseSeconds as number) ?? undefined,
            );
            return ok({
              leaseId: result.id,
              expiresAt: result.expiresAt.toISOString(),
            });
          }

          // ── heartbeatLease ─────────────────────────────────────
          case "heartbeatLease": {
            const { lease } = await getTaskFunctions();
            const result = await lease.heartbeatLease(
              a.taskId as string,
              a.agentId as string,
              (a.leaseSeconds as number) ?? undefined,
            );
            return ok({
              leaseId: result.id,
              expiresAt: result.expiresAt.toISOString(),
            });
          }

          // ── releaseLease ───────────────────────────────────────
          case "releaseLease": {
            const { lease } = await getTaskFunctions();
            const result = await lease.releaseLease(
              a.taskId as string,
              a.agentId as string,
            );
            return ok({ leaseId: result.id, released: true });
          }

          // ── Referendum tools ──────────────────────────────────
          case "listReferendums": {
            const prisma = await getPrisma();
            const status = parseReferendumStatus(
              a.status,
              ReferendumStatus.ACTIVE,
            );
            if (!status) {
              return err("status must be one of DRAFT, ACTIVE, or CLOSED");
            }
            if (status !== ReferendumStatus.ACTIVE && !isAdmin) {
              return err(
                "Admin privileges are required to list non-active referendums.",
              );
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
            const question = optionalString(a.question);
            if (!question) return err("question is required");
            const slug = slugify(optionalString(a.slug) ?? title);
            if (!slug) return err("slug could not be derived from title");
            const status = parseReferendumStatus(
              a.status,
              ReferendumStatus.DRAFT,
            );
            if (!status) {
              return err("status must be one of DRAFT, ACTIVE, or CLOSED");
            }
            const kind = parseReferendumKind(a.kind, ReferendumKind.GENERAL);
            if (!kind) {
              return err(
                "kind must be one of GENERAL, DECLARATION, TREATY, MEMBERSHIP, COURT_CASE, AMENDMENT, or BUDGET",
              );
            }

            const description = optionalString(a.description);
            const bodyMarkdown = optionalString(a.bodyMarkdown);
            const jurisdictionId = optionalString(a.jurisdictionId);
            const data: Prisma.ReferendumUncheckedCreateInput = {
              title,
              slug,
              question,
              kind,
              status,
              contentHash: buildReferendumContentHash({
                question,
                description,
                bodyMarkdown,
              }),
              lockedAt: null,
              publishedAt:
                status === ReferendumStatus.DRAFT ? null : new Date(),
              ...(bodyMarkdown ? { bodyMarkdown } : {}),
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
                fileType:
                  typeof a.fileType === "string" ? a.fileType : undefined,
                limit: typeof a.limit === "number" ? a.limit : undefined,
                path: typeof a.path === "string" ? a.path : undefined,
                query: a.query as string,
                repo: typeof a.repo === "string" ? a.repo : undefined,
              }),
            );
          }

          case "getFileContent": {
            const { getFileContent } =
              await import("./github-repo-tools.server");
            return ok(
              await getFileContent({
                path: a.path as string,
                ref: typeof a.ref === "string" ? a.ref : undefined,
                repo: a.repo as string,
              }),
            );
          }

          case "listRepoFiles": {
            const { listRepoFiles } =
              await import("./github-repo-tools.server");
            return ok(
              await listRepoFiles({
                path: typeof a.path === "string" ? a.path : undefined,
                ref: typeof a.ref === "string" ? a.ref : undefined,
                repo: a.repo as string,
              }),
            );
          }

          case "githubApi": {
            const { callGitHubApi } =
              await import("./github-repo-tools.server");
            return ok(
              await callGitHubApi({
                body: a.body,
                method: typeof a.method === "string" ? a.method : undefined,
                path: a.path as string,
                query:
                  a.query &&
                  typeof a.query === "object" &&
                  !Array.isArray(a.query)
                    ? (a.query as Record<
                        string,
                        string | number | boolean | null | undefined
                      >)
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
            const { retrieveManualContext } =
              await import("./manual-search.server");
            const result = await retrieveManualContext(a.query as string, {
              maxResults: (a.maxResults as number) ?? 5,
            });
            return ok(result);
          }

          // ── askWishonia ────────────────────────────────────────
          case "askWishonia": {
            const { retrieveManualContext } =
              await import("./manual-search.server");
            const { WISHONIA_VOICE_SYSTEM_PROMPT, RAG_MODEL } =
              await import("./voice-config");
            const { GoogleGenAI } = await import("@google/genai");

            const question = a.question as string;
            const ragResult = await retrieveManualContext(question, {
              maxResults: 5,
            });

            const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
            if (!apiKey)
              return err("GOOGLE_GENERATIVE_AI_API_KEY is not configured");

            const genai = new GoogleGenAI({ apiKey });
            const response = await genai.models.generateContent({
              model: RAG_MODEL,
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `Context from documentation:\n\n${ragResult.context}\n\n---\n\nQuestion: ${question}`,
                    },
                  ],
                },
              ],
              config: {
                systemInstruction: WISHONIA_VOICE_SYSTEM_PROMPT.replace(
                  "Keep every response to 2-4 sentences. This is voice, not a lecture.",
                  "Keep responses concise but thorough. Use paragraphs if needed.",
                ),
              },
            });

            const answer =
              response.text ??
              "I seem to have lost my train of thought. Try again.";

            return ok({ answer, citations: ragResult.citations });
          }

          // ── postTaskComment ────────────────────────────────────
          case "postTaskComment": {
            if (!userId)
              return authRequired(
                name,
                "This tool needs an identified user to attribute writes or fetch personal data.",
              );
            const { countUserCommentsInWindow, postComment } =
              await import("./tasks/task-comments.server");
            const { notifyTaskCommentRecipients } =
              await import("./tasks/task-comment-notifications.server");
            const { generateAndPostWishoniaReply } =
              await import("./tasks/wishonia-task-reply.server");

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
              typeof a.parentCommentId === "string" &&
              a.parentCommentId.length > 0
                ? (a.parentCommentId as string)
                : null;
            const mediaUrl =
              typeof a.mediaUrl === "string" && a.mediaUrl.length > 0
                ? (a.mediaUrl as string)
                : null;

            // Same gate as the comment feed: you can only write where you
            // can read. Private tasks look identical to missing ones.
            if (!(await canAccessTaskResource(taskId, "COMMENT"))) {
              return err("Task not found");
            }

            // Rate limit: 5 per user per task per hour
            const recentCount = await countUserCommentsInWindow(
              taskId,
              userId,
              60 * 60 * 1000,
            );
            if (recentCount >= 5) {
              return err(
                "Rate limit exceeded: max 5 comments per task per hour",
              );
            }

            const comment = await postComment({
              taskId,
              authorUserId: userId,
              parentCommentId,
              message,
              mediaUrl,
              enforceParentVisibility: true,
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
            if (!userId)
              return authRequired(
                name,
                "This tool needs an identified user to attribute writes or fetch personal data.",
              );
            const { voteComment } =
              await import("./tasks/task-comments.server");
            const commentId = a.commentId as string;
            const value = a.value as number;
            if (!commentId || (value !== 1 && value !== -1 && value !== 0)) {
              return err("commentId and value (1 | -1 | 0) are required");
            }
            if (!(await canAccessTaskCommentResource(commentId))) {
              return err("Task not found");
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
            if (!userId)
              return authRequired(
                name,
                "This tool needs an identified user to attribute writes or fetch personal data.",
              );
            const { deleteComment } =
              await import("./tasks/task-comments.server");
            const commentId = a.commentId as string;
            if (!commentId) return err("commentId is required");
            if (!(await canAccessTaskCommentResource(commentId))) {
              return err("Task not found");
            }
            await deleteComment({ commentId, userId });
            return ok({ success: true });
          }

          // ── getTaskComments ────────────────────────────────────
          case "getTaskComments": {
            const { getTaskCommentFeed, getTaskActivityTimeline } =
              await import("./tasks/task-comments.server");
            const taskId = a.taskId as string;
            if (!taskId) return err("taskId is required");
            if (!(await canAccessTaskResource(taskId, "READ"))) {
              return err("Task not found");
            }
            const sort = a.sort === "top" ? "top" : "new";
            const cursorRaw = a.cursor as string | undefined;
            const cursor = cursorRaw ? new Date(cursorRaw) : null;
            const limit =
              typeof a.limit === "number" ? (a.limit as number) : 50;

            const [feed, activities] = await Promise.all([
              getTaskCommentFeed({
                taskId,
                sort,
                cursor:
                  cursor && !Number.isNaN(cursor.getTime()) ? cursor : null,
                limit,
                currentUserId: userId ?? null,
              }),
              cursor
                ? Promise.resolve([])
                : getTaskActivityTimeline(taskId, 50, userId ?? null),
            ]);

            return ok({
              comments: feed.comments,
              nextCursor: feed.nextCursor?.toISOString() ?? null,
              total: feed.total,
              activityEvents: activities,
            });
          }

          default:
            return err(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // Server-side: full stack ends up in Vercel/runtime logs.
        console.error(`[mcp] tool "${name}" threw:`, error);
        // Sentry: send-fire-and-forget so we don't block the response. The
        // outer try/catch already returned the JSON-RPC error to the client.
        // We tag with the tool name + userId so the alert/filter UX is sane.
        // Dynamic import keeps the bundle clean in test/CI environments where
        // @sentry/nextjs may not be installed or initialized.
        void import("@sentry/nextjs")
          .then((Sentry) => {
            Sentry.withScope((scope) => {
              scope.setTag("mcp.tool", name);
              scope.setTag("mcp.surface", "tool_dispatch");
              if (userId) scope.setUser({ id: userId });
              scope.setContext("mcpToolInput", mcpToolInputSummary(a));
              Sentry.captureException(error);
            });
          })
          .catch(() => {
            // Sentry unavailable (CI / unit tests / startup race) — already logged above.
          });
        // Wire responses never replay private arguments, actor IDs, or stacks.
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  error: "tool_execution_failed",
                  tool: name,
                  message,
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
