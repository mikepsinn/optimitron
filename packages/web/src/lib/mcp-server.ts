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
  TaskCategory,
  TaskClaimPolicy,
  TaskDifficulty,
  TaskImpactFrameKey,
  TaskStatus,
  type Prisma,
} from "@optimitron/db";

// ---------------------------------------------------------------------------
// Scopes
// ---------------------------------------------------------------------------

export const MCP_SCOPES = {
  "tasks:read": "List and view public tasks, blockers, and funding stats",
  "tasks:write": "Create, update, promote tasks and set impact estimates",
  "tasks:personal": "List and manage your own tasks, claim tasks as yourself",
  "agent:run": "Log agent runs, acquire/release leases, record contact actions",
  "search": "Search the Optimitron manual and ask Wishonia questions",
} as const;

export type McpScope = keyof typeof MCP_SCOPES;

export const DEFAULT_SCOPES: McpScope[] = ["tasks:read", "search"];

/// Full-trust scope set. Stdio transport passes this explicitly. HTTP must NEVER default to it
/// — unauthenticated HTTP callers get DEFAULT_SCOPES, authenticated callers get the scopes
/// granted at consent time. The deny-by-default behavior in `hasScope` enforces this.
export const ALL_SCOPES: McpScope[] = Object.keys(MCP_SCOPES) as McpScope[];

const TOOL_SCOPES: Record<string, McpScope[]> = {
  // tasks:read
  getNextTask: ["tasks:read"],
  getQueueAudit: ["tasks:read"],
  getNextAction: ["tasks:read"],
  evaluateTaskEconomics: ["tasks:read"],
  listTasks: ["tasks:read"],
  getTask: ["tasks:read"],
  getBlockers: ["tasks:read"],
  getFundingStats: ["tasks:read"],
  // tasks:write
  createTask: ["tasks:write"],
  proposeTaskBundle: ["tasks:write"],
  promoteTask: ["tasks:write"],
  updateTask: ["tasks:write"],
  setTaskImpact: ["tasks:write"],
  recordTaskActuals: ["tasks:write"],
  updateMilestone: ["tasks:write"],
  addDependency: ["tasks:write"],
  // tasks:personal
  claimTask: ["tasks:personal"],
  completeTaskClaim: ["tasks:personal"],
  // agent:run
  logAgentRun: ["agent:run"],
  acquireLease: ["agent:run"],
  heartbeatLease: ["agent:run"],
  releaseLease: ["agent:run"],
  recordContactAction: ["agent:run"],
  checkContactCooldown: ["agent:run"],
  // search
  searchManual: ["search"],
  askWishonia: ["search"],
  // task comments
  postTaskComment: ["tasks:personal"],
  voteTaskComment: ["tasks:personal"],
  deleteTaskComment: ["tasks:personal"],
  getTaskComments: ["tasks:read"],
};

function hasScope(grantedScopes: McpScope[] | undefined, toolName: string): boolean {
  // Deny by default. Callers must pass an explicit scopes array — stdio passes ALL_SCOPES,
  // HTTP unauth passes DEFAULT_SCOPES, HTTP auth passes the granted scopes from the JWT.
  if (!grantedScopes) return false;
  const required = TOOL_SCOPES[toolName];
  if (!required) return true;
  return required.some((s) => grantedScopes.includes(s));
}

// ---------------------------------------------------------------------------
// Lazy imports (keep startup fast, avoid connection errors during tool listing)
// ---------------------------------------------------------------------------

async function getTaskFunctions() {
  const [tasks, ranking, impact, contact, lease] = await Promise.all([
    import("./tasks.server"),
    import("./tasks/rank-tasks"),
    import("./tasks/impact"),
    import("./tasks/contact.server"),
    import("./tasks/agent-lease.server"),
  ]);
  return { tasks, ranking, impact, contact, lease };
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

function toTaskDifficulty(value: unknown) {
  if (typeof value !== "string") return null;
  return TaskDifficulty[value as keyof typeof TaskDifficulty] ?? null;
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
  contactUrl?: string | null;
  contactLabel?: string | null;
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
  contactUrl?: string | null;
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
    contactUrl: (proposal?.contactUrl as string) ?? task.contactUrl ?? null,
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
    contactUrl: task.contactUrl,
    contactLabel: task.contactLabel,
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
  },
  {
    name: "getQueueAudit",
    description: "Audit whether the active public queue is sane enough to trust. Returns queue issues, family coverage, and recommended system-improvement proposals when the frontier is broken.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "getNextAction",
    description: "Get the mathematically best next action, not just the next task. Audits queue sanity first, then chooses between direct execution, agent delegation, procurement prep, funding unblockers, or queue repair.",
    inputSchema: {
      type: "object" as const,
      properties: {
        skillTags: { type: "array", items: { type: "string" }, description: "Agent's skill tags for capability matching" },
        interestTags: { type: "array", items: { type: "string" }, description: "Agent's interest tags for capability matching" },
        maxDifficulty: { type: "string", enum: ["TRIVIAL", "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"], description: "Max difficulty the agent can handle" },
        availableHoursPerWeek: { type: "number", description: "Hours per week the agent can commit" },
        agentId: { type: "string", description: "Agent identifier for future logging/correlation" },
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
    name: "createTask",
    description: "Create a new task as DRAFT. Agent-created tasks always start as DRAFT and must be promoted to ACTIVE via a separate review process.",
    inputSchema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Short imperative title" },
        description: { type: "string", description: "Full explanation and acceptance criteria" },
        parentTaskId: { type: "string", description: "Parent task ID for subtask hierarchy" },
        taskKey: { type: "string", description: "Stable dedup key (e.g. accountability:us:golf-2025)" },
        category: { type: "string", enum: ["ADVOCACY", "RESEARCH", "COMMUNICATION", "ENGINEERING", "ORGANIZING", "OUTREACH", "GOVERNANCE", "SCIENCE", "LEGAL", "CREATIVE", "OTHER"], description: "Task category" },
        difficulty: { type: "string", enum: ["TRIVIAL", "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"], description: "Estimated difficulty" },
        skillTags: { type: "array", items: { type: "string" }, description: "Skills needed" },
        interestTags: { type: "array", items: { type: "string" }, description: "Related topics/causes" },
        estimatedEffortHours: { type: "number", description: "Estimated hours to complete" },
        dueAt: { type: "string", description: "Due date (ISO 8601)" },
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
        isPublic: { type: "boolean", description: "Visible in public views (default true)" },
        contextJson: TASK_CONTEXT_JSON_SCHEMA,
        sortOrder: { type: "number", description: "Sort priority (lower = higher)" },
      },
      required: ["title", "description"],
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
                  delayDalysLostPerDay: { type: "number" },
                  delayEconomicValueUsdLostPerDay: { type: "number" },
                  expectedValuePerHourDalys: { type: "number" },
                  expectedValuePerHourUsd: { type: "number" },
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
    description: "Update a task's status, description, or other fields.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID" },
        status: { type: "string", enum: ["DRAFT", "ACTIVE", "VERIFIED", "STALE"] },
        title: { type: "string" },
        description: { type: "string" },
        completionEvidence: { type: "string", description: "Evidence that the task is done" },
        impactStatement: { type: "string" },
        difficulty: { type: "string", enum: ["TRIVIAL", "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] },
        taskKey: { type: "string", description: "Stable dedup key" },
        assigneePersonId: { type: "string", description: "Person ID to assign (use empty string to clear)" },
        assigneeOrganizationId: { type: "string", description: "Organization ID to assign (use empty string to clear)" },
        roleTitle: { type: "string", description: "Role of the assignee" },
        sourceUrl: { type: "string", description: "URL to the source/evidence" },
        completedAt: { type: "string", description: "Completion date (ISO 8601), use empty string to clear" },
        verifiedAt: { type: "string", description: "Verification date (ISO 8601), use empty string to clear" },
        contextJson: {
          ...TASK_CONTEXT_JSON_SCHEMA,
          description:
            "Rich task dossier slots — merged with existing contextJson. Mirror of TaskContextJsonSchema. See createTask for the full slot list.",
        },
        sortOrder: { type: "number", description: "Sort priority (lower = higher)" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "setTaskImpact",
    description: "Create or replace the impact estimate for a task. Sets the impact frame and optional metrics. Negative values represent harm caused.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID to attach impact to" },
        frameKey: { type: "string", enum: ["IMMEDIATE", "ONE_YEAR", "FIVE_YEAR", "TWENTY_YEAR", "LIFETIME"], description: "Time horizon for evaluation (default: FIVE_YEAR)" },
        frame: {
          type: "object",
          description: "Impact frame with delay costs and expected values",
          properties: {
            evaluationHorizonYears: { type: "number" },
            successProbabilityBase: { type: "number" },
            delayDalysLostPerDayBase: { type: "number" },
            delayEconomicValueUsdLostPerDayBase: { type: "number" },
            expectedDalysAvertedBase: { type: "number" },
            expectedEconomicValueUsdBase: { type: "number" },
            estimatedCashCostUsdBase: { type: "number" },
            estimatedEffortHoursBase: { type: "number" },
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
    description: "Add a dependency between tasks. The blocked task cannot proceed until the blocker is done.",
    inputSchema: {
      type: "object" as const,
      properties: {
        blockedTaskId: { type: "string", description: "Task that is blocked" },
        blockerTaskId: { type: "string", description: "Task that must complete first" },
        label: { type: "string", description: "Optional label describing the dependency" },
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
    name: "recordContactAction",
    description: "Log that an agent or user contacted a task assignee. Subject to server-side cooldown (24h per task+channel).",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID" },
        userId: { type: "string", description: "User or agent ID" },
        channel: { type: "string", enum: ["email", "link"], description: "Contact channel" },
        message: { type: "string", description: "Message sent (for audit)" },
        href: { type: "string", description: "URL that was contacted" },
      },
      required: ["taskId", "userId", "channel"],
    },
  },
  {
    name: "checkContactCooldown",
    description: "Check whether a contact action is allowed for a task+channel, or if cooldown is active.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID" },
        channel: { type: "string", enum: ["email", "link"], description: "Contact channel to check" },
      },
      required: ["taskId", "channel"],
    },
  },
  {
    name: "getFundingStats",
    description: "Get aggregate funding stats — total deposited, total spent, total agent runs, remaining budget.",
    inputSchema: { type: "object" as const, properties: {} },
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
    name: "postTaskComment",
    description: `Post a comment on a task. Message is GitHub-flavored markdown with these extensions:
- Math: $inline$ or $$block$$ (rendered via KaTeX)
- Diagrams: \`\`\`mermaid ... \`\`\` fences (rendered via Mermaid)
- Charts: \`\`\`chart { ...Chart.js config JSON... } \`\`\` fences
- Images: ![alt](url) inline
- Tables, lists, strikethrough, code blocks, blockquotes — all standard
Max length: 20,000 characters. Rate limit: 5 comments per task per hour.
Posting a comment automatically triggers a Wishonia auto-reply in the background.`,
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
];

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a configured MCP server instance.
 *
 * @param userId  Authenticated user ID (undefined = public-only access)
 * @param scopes  Granted OAuth scopes (undefined = stdio/local, no restrictions)
 */
export function createMcpServer(userId?: string, scopes?: McpScope[]): Server {
  const server = new Server(
    { name: "optimitron-tasks", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  // -- Tool listing (filtered by granted scopes) --
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TASK_TOOL_DEFINITIONS.filter((t) => hasScope(scopes, t.name)),
  }));

  // -- Tool dispatch --
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const a = (args ?? {}) as Record<string, unknown>;

    // Scope check
    if (!hasScope(scopes, name)) {
      return err(`Insufficient scope for tool "${name}". Required: ${TOOL_SCOPES[name]?.join(", ")}`);
    }

    try {
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

        // ── getQueueAudit ──────────────────────────────────────
        case "getQueueAudit": {
          const { reviewEarthQueueAndBuildSystemImprovements } = await import("@optimitron/agent");
          const allTasks = await listActivePublicEarthTasks();
          const review = reviewEarthQueueAndBuildSystemImprovements(allTasks as any);
          return ok({
            audit: review.audit,
            recommendedTaskKeys: review.proposal.candidates
              .map((candidate) => candidate.taskKey)
              .filter((value): value is string => typeof value === "string" && value.length > 0),
            reviewSummary: review.proposal.review.summary,
          });
        }

        // ── getNextAction ──────────────────────────────────────
        case "getNextAction": {
          const { lease } = await getTaskFunctions();
          const { selectNextEarthAction } = await import("@optimitron/agent");
          const { getEarthExecutionPolicy } = await import("./tasks/action-policy");
          const policy = getEarthExecutionPolicy();
          const agentCapabilities = buildAgentCapabilities(a);
          const agentId = (a.agentId as string) ?? null;
          let candidateTasks = await listActivePublicEarthTasks();

          while (candidateTasks.length > 0) {
            const decision = selectNextEarthAction({
              agent: agentCapabilities,
              policy,
              tasks: candidateTasks as any,
            });

            if (!decision.task) {
              return ok({
                actionKind: decision.actionKind,
                audit: decision.audit,
                autoExecutable: decision.autoExecutable,
                economics: decision.economics,
                groundingRefs: decision.groundingRefs,
                queueRepairPlan: decision.queueRepairPlan ?? null,
                rationale: decision.rationale,
                requiredApproval: decision.requiredApproval,
                task: null,
              });
            }

            const leaseStatus = await lease.isTaskLeased(decision.task.id);
            if (!leaseStatus.leased || leaseStatus.agentId === agentId) {
              return ok({
                actionKind: decision.actionKind,
                audit: decision.audit,
                autoExecutable: decision.autoExecutable,
                economics: decision.economics,
                groundingRefs: decision.groundingRefs,
                queueRepairPlan: decision.queueRepairPlan ?? null,
                rationale: decision.rationale,
                requiredApproval: decision.requiredApproval,
                task: summarizeTask(decision.task),
              });
            }

            candidateTasks = candidateTasks.filter((task) => task.id !== decision.task?.id);
          }

          return ok({
            actionKind: "QUEUE_REPAIR",
            message: "No unleased action is currently available.",
            task: null,
          });
        }

        // ── evaluateTaskEconomics ──────────────────────────────
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
          const { tasks } = await getTaskFunctions();
          const status = a.status ? TaskStatus[a.status as keyof typeof TaskStatus] : null;
          const limit = Math.min(Number(a.limit) || 20, 50);
          const list = await tasks.listTasks({
            status,
            assigneePersonId: (a.assigneePersonId as string) ?? null,
            limit,
            visibility: "public",
          });
          let filtered = list;
          if (a.parentTaskId) {
            filtered = list.filter((t: { parentTaskId?: string | null }) => t.parentTaskId === a.parentTaskId);
          }
          return ok(filtered.slice(0, limit).map(summarizeTask));
        }

        // ── getTask ────────────────────────────────────────────
        case "getTask": {
          const { tasks } = await getTaskFunctions();
          const result = await tasks.getTaskDetailData(a.taskId as string);
          if (!result) return err("Task not found");
          return ok({
            task: result.task,
            contactActionCount: result.contactActionCount,
          });
        }

        // ── createTask (always DRAFT) ──────────────────────────
        case "createTask": {
          const prisma = await getPrisma();
          const data: Record<string, unknown> = {
            title: a.title as string,
            description: (a.description as string) ?? "",
            parentTaskId: (a.parentTaskId as string) ?? null,
            taskKey: (a.taskKey as string) ?? null,
            category: a.category ? TaskCategory[a.category as keyof typeof TaskCategory] : TaskCategory.OTHER,
            difficulty: a.difficulty ? TaskDifficulty[a.difficulty as keyof typeof TaskDifficulty] : TaskDifficulty.INTERMEDIATE,
            skillTags: (a.skillTags as string[]) ?? [],
            interestTags: (a.interestTags as string[]) ?? [],
            estimatedEffortHours: (a.estimatedEffortHours as number) ?? null,
            dueAt: a.dueAt ? new Date(a.dueAt as string) : null,
            completedAt: a.completedAt ? new Date(a.completedAt as string) : null,
            verifiedAt: a.verifiedAt ? new Date(a.verifiedAt as string) : null,
            claimPolicy: a.claimPolicy ? TaskClaimPolicy[a.claimPolicy as keyof typeof TaskClaimPolicy] : TaskClaimPolicy.OPEN_MANY,
            assigneePersonId: (a.assigneePersonId as string) ?? null,
            assigneeOrganizationId: (a.assigneeOrganizationId as string) ?? null,
            roleTitle: (a.roleTitle as string) ?? null,
            sourceUrl: (a.sourceUrl as string) ?? null,
            contactUrl: (a.contactUrl as string) ?? null,
            contactLabel: (a.contactLabel as string) ?? null,
            impactStatement: (a.impactStatement as string) ?? null,
            isPublic: a.isPublic !== false,
            contextJson: mergeTaskContextJson({
              patchContextJson: a.contextJson,
              sourceUrl: (a.sourceUrl as string) ?? null,
            }),
            sortOrder: (a.sortOrder as number) ?? undefined,
            status: TaskStatus.DRAFT,
          };
          if (userId) {
            data.ownerUserId = userId;
          }
          const task = await prisma.task.create({ data: data as any });
          return ok({ taskId: task.id, title: task.title, status: "DRAFT" });
        }

        // ── proposeTaskBundle ───────────────────────────────────
        case "proposeTaskBundle": {
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
                contactUrl: (candidate.contactUrl as string) ?? null,
                estimatedEffortHours: (candidate.estimatedEffortHours as number) ?? null,
                isPublic: (candidate.isPublic as boolean) !== false,
                impactStatement: (candidate.description as string) ?? null,
                contextJson: buildStoredProposalContext({ candidate, decision }),
                status: TaskStatus.DRAFT,
              } as any,
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
              contactUrl: true,
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
          const prisma = await getPrisma();
          const updates: Record<string, unknown> = {};
          if (a.status) updates.status = TaskStatus[a.status as keyof typeof TaskStatus];
          if (a.title) updates.title = a.title;
          if (a.description) updates.description = a.description;
          if (a.completionEvidence) updates.completionEvidence = a.completionEvidence;
          if (a.impactStatement) updates.impactStatement = a.impactStatement;
          if (a.difficulty) updates.difficulty = TaskDifficulty[a.difficulty as keyof typeof TaskDifficulty];
          if (a.taskKey) updates.taskKey = a.taskKey;
          if (a.roleTitle !== undefined) updates.roleTitle = (a.roleTitle as string) || null;
          if (a.sortOrder !== undefined) updates.sortOrder = a.sortOrder;
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
          if (a.contextJson !== undefined || a.sourceUrl !== undefined) {
            const existing = await prisma.task.findUniqueOrThrow({
              where: { id: a.taskId as string },
              select: { contextJson: true },
            });
            updates.contextJson = toInputJsonValue(
              mergeTaskContextJson({
                baseContextJson: existing.contextJson,
                patchContextJson: a.contextJson,
                sourceUrl: a.sourceUrl !== undefined ? ((a.sourceUrl as string) || null) : null,
              }) ?? {},
            );
          }
          const task = await prisma.task.update({
            where: { id: a.taskId as string },
            data: updates as any,
          });
          return ok({ taskId: task.id, status: task.status, title: task.title });
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

          const result = await prisma.$transaction(async (tx) => {
            const estimateSet = await tx.taskImpactEstimateSet.create({
              data: {
                assumptionsJson: {},
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
                successProbabilityBase: (frameInput.successProbabilityBase as number) ?? null,
                delayDalysLostPerDayBase: (frameInput.delayDalysLostPerDayBase as number) ?? null,
                delayEconomicValueUsdLostPerDayBase: (frameInput.delayEconomicValueUsdLostPerDayBase as number) ?? null,
                expectedDalysAvertedBase: (frameInput.expectedDalysAvertedBase as number) ?? null,
                expectedEconomicValueUsdBase: (frameInput.expectedEconomicValueUsdBase as number) ?? null,
                estimatedCashCostUsdBase: (frameInput.estimatedCashCostUsdBase as number) ?? null,
                estimatedEffortHoursBase: (frameInput.estimatedEffortHoursBase as number) ?? null,
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
          const prisma = await getPrisma();
          const { TaskEdgeType } = await import("@optimitron/db");
          const edge = await prisma.taskEdge.create({
            data: {
              fromTaskId: a.blockerTaskId as string,
              toTaskId: a.blockedTaskId as string,
              edgeType: TaskEdgeType.BLOCKS,
            },
          });
          return ok({ edgeId: edge.id });
        }

        // ── getBlockers ────────────────────────────────────────
        case "getBlockers": {
          const prisma = await getPrisma();
          const { TaskEdgeType } = await import("@optimitron/db");
          const [blockedBy, blocks] = await Promise.all([
            prisma.taskEdge.findMany({
              where: {
                toTaskId: a.taskId as string,
                edgeType: { in: [TaskEdgeType.BLOCKS, TaskEdgeType.DEPENDS_ON] },
              },
              include: { fromTask: { select: { id: true, title: true, status: true } } },
            }),
            prisma.taskEdge.findMany({
              where: {
                fromTaskId: a.taskId as string,
                edgeType: { in: [TaskEdgeType.BLOCKS, TaskEdgeType.DEPENDS_ON] },
              },
              include: { toTask: { select: { id: true, title: true, status: true } } },
            }),
          ]);
          return ok({
            blockedBy: blockedBy.map((e) => ({ taskId: e.fromTask.id, title: e.fromTask.title, status: e.fromTask.status, edgeType: e.edgeType })),
            blocks: blocks.map((e) => ({ taskId: e.toTask.id, title: e.toTask.title, status: e.toTask.status, edgeType: e.edgeType })),
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

        // ── recordContactAction ────────────────────────────────
        case "recordContactAction": {
          const { contact } = await getTaskFunctions();
          const activity = await contact.recordTaskContactAction({
            taskId: a.taskId as string,
            userId: a.userId as string,
            channel: a.channel as "email" | "link",
            message: (a.message as string) ?? null,
            href: (a.href as string) ?? null,
          });
          return ok({ activityId: activity.id });
        }

        // ── checkContactCooldown ───────────────────────────────
        case "checkContactCooldown": {
          const { contact } = await getTaskFunctions();
          const result = await contact.checkContactCooldown(a.taskId as string, a.channel as "email" | "link");
          if (result.allowed) return ok({ allowed: true });
          return ok({ allowed: false, retryAfter: result.retryAfter.toISOString() });
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
          if (!userId) return err("Authentication required");
          const {
            countUserCommentsInWindow,
            postComment,
          } = await import("./tasks/task-comments.server");
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
          if (!userId) return err("Authentication required");
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
          if (!userId) return err("Authentication required");
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
      return err(message);
    }
  });

  return server;
}

/**
 * Get the list of all tool definitions (for the /api/mcp/tools catalog).
 */
export function getToolDefinitions() {
  return TASK_TOOL_DEFINITIONS;
}
