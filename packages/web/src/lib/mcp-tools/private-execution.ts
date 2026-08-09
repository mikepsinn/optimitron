import { stringifyJsonSafe } from "../json-safe";
import { McpScope } from "../mcp-scopes";
import { getSourceArtifactVisibilityWhere } from "../source-artifact-visibility.server";
import { getTaskAccessWhere } from "../tasks/task-visibility.server";

type ToolResponse = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

function ok(data: unknown): ToolResponse {
  return { content: [{ type: "text", text: stringifyJsonSafe(data, 2) }] };
}

function err(message: string): ToolResponse {
  return {
    content: [{ type: "text", text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}

const PRIVATE_TASK_SCOPES = [
  McpScope.TASKS_PERSONAL,
  McpScope.TASKS_ORGANIZATION,
];

export const PRIVATE_EXECUTION_TOOL_SCOPES = {
  applyPrivateTaskBundle: PRIVATE_TASK_SCOPES,
  deletePrivateSourceSelection: PRIVATE_TASK_SCOPES,
  exportPrivateWork: PRIVATE_TASK_SCOPES,
  getTaskAuditTrail: PRIVATE_TASK_SCOPES,
  proposeExternalAction: PRIVATE_TASK_SCOPES,
  recordExternalActionResult: PRIVATE_TASK_SCOPES,
  reviewPrivateTaskBundle: PRIVATE_TASK_SCOPES,
  startTaskExecution: PRIVATE_TASK_SCOPES,
  submitTaskArtifact: PRIVATE_TASK_SCOPES,
  submitTaskForVerification: PRIVATE_TASK_SCOPES,
  verifyTaskExecution: PRIVATE_TASK_SCOPES,
} satisfies Record<string, McpScope[]>;

export type PrivateExecutionToolName =
  keyof typeof PRIVATE_EXECUTION_TOOL_SCOPES;

const ESTIMATE_RANGE_SCHEMA = {
  type: "object",
  properties: {
    base: { type: "number" },
    high: { type: "number" },
    low: { type: "number" },
  },
  required: ["low", "base", "high"],
} as const;

const MONEY_SCHEMA = {
  type: "object",
  properties: {
    currency: {
      type: "string",
      description: "Three-letter currency code, such as usd.",
    },
    minorUnits: { type: "number", description: "Nonnegative integer." },
  },
  required: ["currency", "minorUnits"],
} as const;

const PRIVATE_BUNDLE_PROPERTIES = {
  rootTaskId: {
    type: "string",
    description: "Private personal or organization root/container task ID.",
  },
  source: {
    type: "object",
    properties: {
      approvedExcerpts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            anchor: { type: "string" },
            excerpt: { type: "string" },
            timestamp: { type: ["string", "null"] },
          },
          required: ["anchor", "excerpt"],
        },
      },
      capturedAt: { type: ["string", "null"] },
      channel: {
        type: "string",
        enum: [
          "DISCORD",
          "EMAIL",
          "GITHUB",
          "MEETING_NOTES",
          "NOTION",
          "SLACK",
          "TELEGRAM",
          "WHATSAPP",
          "OTHER",
        ],
      },
      messageAnchors: { type: "array", items: { type: "string" } },
      participantAliases: { type: "array", items: { type: "string" } },
      selectionHash: {
        type: "string",
        description: "SHA-256 or equivalent hash of the selected source batch.",
      },
      selectionId: {
        type: "string",
        description: "Stable local identifier for this explicit selection.",
      },
      sourceUrl: { type: ["string", "null"] },
      title: { type: "string" },
      userSelected: {
        type: "boolean",
        const: true,
        description:
          "Must be true. Ambient or whole-account imports are rejected.",
      },
    },
    required: [
      "channel",
      "messageAnchors",
      "selectionHash",
      "selectionId",
      "title",
      "userSelected",
    ],
  },
  candidates: {
    type: "array",
    minItems: 1,
    maxItems: 100,
    items: {
      type: "object",
      properties: {
        acceptanceCriteria: { type: "array", items: { type: "string" } },
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
        },
        clarificationNeeded: { type: ["string", "null"] },
        dependencyRefs: { type: "array", items: { type: "string" } },
        description: { type: "string" },
        dueAt: { type: ["string", "null"] },
        eligibleExecutorTypes: {
          type: "array",
          items: { type: "string", enum: ["AGENT", "HUMAN"] },
        },
        estimatedCostUsd: ESTIMATE_RANGE_SCHEMA,
        estimatedDurationSeconds: ESTIMATE_RANGE_SCHEMA,
        expectedDeliverable: { type: "string" },
        expectedValueUsd: ESTIMATE_RANGE_SCHEMA,
        groundedByAnchors: { type: "array", items: { type: "string" } },
        objectiveServed: { type: "string" },
        parentRef: {
          type: ["string", "null"],
          description: "Candidate ref or existing accessible task ID.",
        },
        privacyClassification: {
          type: "string",
          enum: ["ORGANIZATION_CONFIDENTIAL", "PERSONAL_PRIVATE"],
        },
        projectOrWorkflow: { type: "string" },
        ref: { type: "string" },
        requiredObligation: { type: "boolean" },
        safetyGuardrail: { type: "boolean" },
        successProbability: ESTIMATE_RANGE_SCHEMA,
        title: { type: "string" },
      },
      required: [
        "acceptanceCriteria",
        "description",
        "eligibleExecutorTypes",
        "estimatedCostUsd",
        "estimatedDurationSeconds",
        "expectedDeliverable",
        "expectedValueUsd",
        "groundedByAnchors",
        "objectiveServed",
        "privacyClassification",
        "projectOrWorkflow",
        "ref",
        "successProbability",
        "title",
      ],
    },
  },
} as const;

export const PRIVATE_EXECUTION_TOOL_DEFINITIONS = [
  {
    name: "reviewPrivateTaskBundle",
    description:
      "Validate, normalize, deduplicate, and hash a user-selected private conversation-to-work batch without writing tasks. Review every returned error and action before applyPrivateTaskBundle.",
    inputSchema: {
      type: "object" as const,
      properties: PRIVATE_BUNDLE_PROPERTIES,
      required: ["rootTaskId", "source", "candidates"],
    },
  },
  {
    name: "applyPrivateTaskBundle",
    description:
      "Atomically apply a previously reviewed private task bundle as ACTIVE tasks. The server recomputes reviewHash; changed or invalid bundles are rejected. Raw transcript text is not accepted.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ...PRIVATE_BUNDLE_PROPERTIES,
        reviewHash: { type: "string" },
      },
      required: ["rootTaskId", "source", "candidates", "reviewHash"],
    },
  },
  {
    name: "startTaskExecution",
    description:
      "Start the canonical execution attempt for an accessible active, unblocked leaf task. Reserved roots, containers, and tasks with active or pending-verification attempts are rejected.",
    inputSchema: {
      type: "object" as const,
      properties: {
        agentExecutorId: { type: ["string", "null"] },
        confidence: { type: ["number", "null"] },
        estimatedCost: { ...MONEY_SCHEMA, type: ["object", "null"] },
        estimatedDurationSeconds: { type: ["number", "null"] },
        runContext: {
          type: ["object", "null"],
          properties: {
            agentRunId: { type: "string" },
            baseCommit: { type: "string" },
            branch: { type: "string" },
            isolationMode: {
              type: "string",
              enum: ["NO_WORKTREE", "SHARED_ONE_PR", "ISOLATED_WORKTREE"],
            },
            ownedFileGlobs: {
              type: "array",
              items: { type: "string" },
            },
            worktreePath: { type: "string" },
          },
          required: ["isolationMode"],
        },
        taskId: { type: "string" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "submitTaskArtifact",
    description:
      "Submit exactly one immutable artifact for a running execution attempt: a task-linked document revision, content attachment, task-comment attachment, external URL, or structured result.",
    inputSchema: {
      type: "object" as const,
      properties: {
        contentAttachmentId: { type: "string" },
        documentRevisionId: { type: "string" },
        externalUrl: { type: "string" },
        label: { type: ["string", "null"] },
        metadata: { type: ["object", "null"] },
        structuredResult: {},
        taskCommentAttachmentId: { type: "string" },
        taskExecutionAttemptId: { type: "string" },
      },
      required: ["taskExecutionAttemptId"],
    },
  },
  {
    name: "submitTaskForVerification",
    description:
      "Finish a running attempt, snapshot the task's acceptance criteria, record actual duration/cost, and create a pending typed verification. At least one artifact is required.",
    inputSchema: {
      type: "object" as const,
      properties: {
        actualCost: { ...MONEY_SCHEMA, type: ["object", "null"] },
        actualDurationSeconds: { type: "number" },
        method: {
          type: "string",
          enum: ["DETERMINISTIC", "RULE_BASED", "REVIEWER", "OUTCOME"],
        },
        outputSummary: { type: "string" },
        taskExecutionAttemptId: { type: "string" },
      },
      required: [
        "actualDurationSeconds",
        "outputSummary",
        "taskExecutionAttemptId",
      ],
    },
  },
  {
    name: "verifyTaskExecution",
    description:
      "Accept or reject one pending execution verification against its immutable criteria snapshot. Acceptance verifies the task; rejection preserves evidence and requeues it as ACTIVE.",
    inputSchema: {
      type: "object" as const,
      properties: {
        criterionResults: {
          type: "array",
          items: {
            type: "object",
            properties: {
              criterion: { type: "string" },
              evidence: { type: ["string", "null"] },
              passed: { type: "boolean" },
            },
            required: ["criterion", "passed"],
          },
        },
        evidence: { type: ["object", "null"] },
        note: { type: ["string", "null"] },
        result: { type: "string", enum: ["ACCEPTED", "REJECTED"] },
        taskVerificationId: { type: "string" },
      },
      required: ["criterionResults", "result", "taskVerificationId"],
    },
  },
  {
    name: "getTaskAuditTrail",
    description:
      "Read the accessible task's provenance, claims, comments, execution attempts, artifact hashes, and verification history without exposing raw private source content.",
    inputSchema: {
      type: "object" as const,
      properties: { taskId: { type: "string" } },
      required: ["taskId"],
    },
  },
  {
    name: "proposeExternalAction",
    description:
      "Create an immutable outbound message or browser-action request for human approval. This does not approve or execute anything; editing requires a new idempotency key and request.",
    inputSchema: {
      type: "object" as const,
      properties: {
        destination: { type: "string" },
        expiresAt: { type: "string" },
        idempotencyKey: { type: "string" },
        operation: { type: "string" },
        payload: { type: "object" },
        taskExecutionAttemptId: { type: ["string", "null"] },
        taskId: { type: "string" },
      },
      required: [
        "destination",
        "idempotencyKey",
        "operation",
        "payload",
        "taskId",
      ],
    },
  },
  {
    name: "recordExternalActionResult",
    description:
      "Record one terminal execution receipt for an already human-approved external action. The exact approved payload cannot be changed or replayed through this tool.",
    inputSchema: {
      type: "object" as const,
      properties: {
        externalActionRequestId: { type: "string" },
        failureMessage: { type: ["string", "null"] },
        receipt: { type: ["object", "null"] },
        result: { type: "string", enum: ["EXECUTED", "FAILED"] },
      },
      required: ["externalActionRequestId", "result"],
    },
  },
  {
    name: "exportPrivateWork",
    description:
      "Export one private root subtree you manage, including tasks, internal comments, safe attachment metadata, source provenance, execution evidence, linked current documents, and internal dependency edges.",
    inputSchema: {
      type: "object" as const,
      properties: { rootTaskId: { type: "string" } },
      required: ["rootTaskId"],
    },
  },
  {
    name: "deletePrivateSourceSelection",
    description:
      "Scrub and unlink one reviewed private source selection you own or administer. Derived tasks remain; approved excerpts, anchors, aliases, URLs, and external identifiers are removed.",
    inputSchema: {
      type: "object" as const,
      properties: { sourceArtifactId: { type: "string" } },
      required: ["sourceArtifactId"],
    },
  },
] as const;

const PRIVATE_EXECUTION_TOOL_NAMES = new Set<string>(
  Object.keys(PRIVATE_EXECUTION_TOOL_SCOPES),
);

export function isPrivateExecutionToolName(
  name: string,
): name is PrivateExecutionToolName {
  return PRIVATE_EXECUTION_TOOL_NAMES.has(name);
}

function requireUser(
  userId: string | null | undefined,
  toolName: PrivateExecutionToolName,
): string | ToolResponse {
  return userId ?? err(`${toolName} requires an identified user`);
}

async function getToolOrganizationId(
  name: PrivateExecutionToolName,
  args: Record<string, unknown>,
  actorUserId: string,
) {
  const { prisma } = await import("../prisma");
  const actor = await prisma.user.findUnique({
    where: { id: actorUserId },
    select: { personId: true },
  });
  if (!actor) return undefined;
  const taskAccess = getTaskAccessWhere({
    action: "READ",
    personId: actor.personId,
    userId: actorUserId,
  });
  const directTaskId =
    name === "reviewPrivateTaskBundle" ||
    name === "applyPrivateTaskBundle" ||
    name === "exportPrivateWork"
      ? args.rootTaskId
      : name === "startTaskExecution" ||
          name === "getTaskAuditTrail" ||
          name === "proposeExternalAction"
        ? args.taskId
        : null;
  if (typeof directTaskId === "string") {
    const task = await prisma.task.findFirst({
      where: { deletedAt: null, id: directTaskId, ...taskAccess },
      select: { ownerOrganizationId: true },
    });
    return task?.ownerOrganizationId;
  }

  if (
    name === "submitTaskArtifact" ||
    name === "submitTaskForVerification"
  ) {
    const attemptId = args.taskExecutionAttemptId;
    if (typeof attemptId !== "string") return undefined;
    const attempt = await prisma.taskExecutionAttempt.findFirst({
      where: {
        deletedAt: null,
        id: attemptId,
        task: { deletedAt: null, ...taskAccess },
      },
      select: { task: { select: { ownerOrganizationId: true } } },
    });
    return attempt?.task.ownerOrganizationId;
  }

  if (name === "verifyTaskExecution") {
    const verificationId = args.taskVerificationId;
    if (typeof verificationId !== "string") return undefined;
    const verification = await prisma.taskVerification.findFirst({
      where: {
        deletedAt: null,
        id: verificationId,
        taskExecutionAttempt: {
          task: { deletedAt: null, ...taskAccess },
        },
      },
      select: {
        taskExecutionAttempt: {
          select: { task: { select: { ownerOrganizationId: true } } },
        },
      },
    });
    return verification?.taskExecutionAttempt.task.ownerOrganizationId;
  }

  if (name === "recordExternalActionResult") {
    const requestId = args.externalActionRequestId;
    if (typeof requestId !== "string") return undefined;
    const request = await prisma.externalActionRequest.findFirst({
      where: {
        deletedAt: null,
        id: requestId,
        task: { deletedAt: null, ...taskAccess },
      },
      select: { task: { select: { ownerOrganizationId: true } } },
    });
    return request?.task.ownerOrganizationId;
  }

  if (name === "deletePrivateSourceSelection") {
    const sourceArtifactId = args.sourceArtifactId;
    if (typeof sourceArtifactId !== "string") return undefined;
    const source = await prisma.sourceArtifact.findFirst({
      where: {
        deletedAt: null,
        id: sourceArtifactId,
        ...getSourceArtifactVisibilityWhere(actorUserId),
      },
      select: { ownerOrganizationId: true },
    });
    return source?.ownerOrganizationId;
  }

  return undefined;
}

export async function handlePrivateExecutionToolCall(input: {
  args: Record<string, unknown>;
  name: PrivateExecutionToolName;
  organizationIds: readonly string[] | null;
  scopes?: readonly McpScope[];
  userId: string | null | undefined;
}): Promise<ToolResponse> {
  const actor = requireUser(input.userId, input.name);
  if (typeof actor !== "string") return actor;

  try {
    const organizationId = await getToolOrganizationId(
      input.name,
      input.args,
      actor,
    );
    if (
      organizationId &&
      !input.scopes?.includes(McpScope.TASKS_ORGANIZATION)
    ) {
      // Same message as the allowlist branch: a client without org scope
      // must not learn that the resource exists and is org-owned.
      return err("Private work resource not found");
    }
    if (
      organizationId &&
      input.organizationIds !== null &&
      !input.organizationIds.includes(organizationId)
    ) {
      return err("Private work resource not found");
    }
    if (
      organizationId === null &&
      !input.scopes?.includes(McpScope.TASKS_PERSONAL)
    ) {
      return err(`${input.name} requires tasks:personal for this work`);
    }

    switch (input.name) {
      case "reviewPrivateTaskBundle": {
        const bundles = await import("../tasks/private-task-bundle.server");
        return ok(await bundles.reviewPrivateTaskBundle(input.args, actor));
      }
      case "applyPrivateTaskBundle": {
        const reviewHash = input.args.reviewHash;
        if (typeof reviewHash !== "string" || !reviewHash) {
          return err("reviewHash is required");
        }
        const bundle = { ...input.args };
        delete bundle.reviewHash;
        const bundles = await import("../tasks/private-task-bundle.server");
        return ok(
          await bundles.applyPrivateTaskBundle(bundle, reviewHash, actor),
        );
      }
      case "startTaskExecution": {
        const lifecycle = await import("../tasks/execution-lifecycle.server");
        return ok(await lifecycle.startTaskExecution(input.args, actor));
      }
      case "submitTaskArtifact": {
        const lifecycle = await import("../tasks/execution-lifecycle.server");
        return ok(await lifecycle.submitTaskArtifact(input.args, actor));
      }
      case "submitTaskForVerification": {
        const lifecycle = await import("../tasks/execution-lifecycle.server");
        return ok(await lifecycle.submitTaskForVerification(input.args, actor));
      }
      case "verifyTaskExecution": {
        const lifecycle = await import("../tasks/execution-lifecycle.server");
        return ok(await lifecycle.verifyTaskExecution(input.args, actor));
      }
      case "getTaskAuditTrail": {
        const taskId = input.args.taskId;
        if (typeof taskId !== "string" || !taskId) {
          return err("taskId is required");
        }
        const lifecycle = await import("../tasks/execution-lifecycle.server");
        return ok({
          task: await lifecycle.getTaskAuditTrail(taskId, actor),
        });
      }
      case "proposeExternalAction": {
        const actions = await import("../tasks/external-action.server");
        return ok(await actions.proposeExternalAction(input.args, actor));
      }
      case "recordExternalActionResult": {
        const actions = await import("../tasks/external-action.server");
        return ok(await actions.recordExternalActionResult(input.args, actor));
      }
      case "exportPrivateWork": {
        const portability =
          await import("../tasks/private-work-portability.server");
        return ok(await portability.exportPrivateWork(input.args, actor));
      }
      case "deletePrivateSourceSelection": {
        const portability =
          await import("../tasks/private-work-portability.server");
        return ok(
          await portability.deletePrivateSourceSelection(input.args, actor),
        );
      }
    }
  } catch (error) {
    // Domain and validation errors carry intentional messages; anything from
    // the Prisma engine may leak schema/connection details, so log it and
    // return a generic failure instead.
    if (error instanceof Error && !error.name.startsWith("PrismaClient")) {
      return err(error.message);
    }
    console.error(`[mcp] ${input.name} failed:`, error);
    return err("Private execution operation failed");
  }
}
