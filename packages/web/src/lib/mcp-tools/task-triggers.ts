import { McpScope } from "../mcp-scopes";

type ToolResponse = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

function ok(data: unknown): ToolResponse {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

// Match the main mcp-server.ts err() shape: a JSON-stringified `{error}` object
// in the text. Clients (and tests) parse the text as JSON to get a structured
// error. Returning raw text here makes the response inconsistent with every
// other tool's error path.
function err(message: string): ToolResponse {
  return {
    content: [{ type: "text", text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}

export const TASK_TRIGGER_TOOL_SCOPES = {
  createTaskTrigger: [McpScope.TASKS_ADMIN],
  updateTaskTrigger: [McpScope.TASKS_ADMIN],
  disableTaskTrigger: [McpScope.TASKS_ADMIN],
  listTaskTriggers: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  getTaskTrigger: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  fireTaskTrigger: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
} satisfies Record<string, McpScope[]>;

export type TaskTriggerToolName = keyof typeof TASK_TRIGGER_TOOL_SCOPES;

export const TASK_TRIGGER_ADMIN_TOOL_NAMES = [
  "createTaskTrigger",
  "updateTaskTrigger",
  "disableTaskTrigger",
] as const satisfies ReadonlyArray<TaskTriggerToolName>;

export const TASK_TRIGGER_TOOL_DEFINITIONS = [
  {
    name: "createTaskTrigger",
    description:
      "Create a new TaskTrigger blueprint. The trigger fires on a named event (e.g. 'user.signup', 'referral.sent', 'cron.<name>') and either spawns tasks, verifies a task on a completion gate, or spawns a communication. Templates use {{path.to.field}} substitution against the event context. This is the data-driven way to add new onboarding flows / reminder cadences / task spawners without a code commit. Returns the created trigger row.",
    inputSchema: {
      type: "object" as const,
      properties: {
        triggerKey: { type: "string", description: "Stable unique key, e.g. 'user-onboarding:treaty'." },
        eventName: { type: "string", description: "Event that fires this trigger." },
        triggerKind: {
          type: "string",
          enum: ["spawnTasks", "verifyTask", "spawnCommunication"],
          description: "What the trigger does. Defaults to spawnTasks.",
        },
        idempotencyKeyTemplate: {
          type: "string",
          description: "Template producing a unique key per logical fire, e.g. 'user-onboarding:treaty:{{user.id}}'.",
        },
        eventFilter: { type: "object", description: "Optional JSON filter (equals/matches/and/or/not/exists)." },
        completionGate: {
          type: "object",
          description:
            "Optional gate spec (allOf/anyOf/count/always). Add inputScope: 'siblings' to gate against the verify target's siblings instead of its children.",
        },
        jurisdictionId: { type: "string", description: "Optional jurisdiction scope." },
        notes: { type: "string", description: "Free-form notes." },
        enabled: { type: "boolean", description: "Defaults to false for MCP-authored triggers." },
        schedule: {
          type: "string",
          description:
            "Optional cron expression (e.g. '30 * * * *'). When set, /api/cron/run-due-triggers fires this trigger when the schedule is due since its last successful fire. Omit for triggers that fire only on application events (user.signup, referral.sent, etc.).",
        },
        iterationSource: {
          type: "string",
          enum: ["none", "overdue-tasks"],
          description:
            "Optional resolver key for the data the cron handler iterates over before firing. 'overdue-tasks' fires the trigger once per overdue Task; 'none' fires once with no record. Omit for non-cron triggers.",
        },
        spawnSpecs: {
          type: "array",
          description:
            "For triggerKind=spawnTasks: one spec per task to create. At most one isParent=true. Children get taskKey '<idempotencyKey>:<kind>'; parent gets just '<idempotencyKey>'.",
          items: {
            type: "object",
            properties: {
              kind: { type: "string", description: "Suffix used in spawned taskKey." },
              isParent: { type: "boolean" },
              sortOrder: { type: "number" },
              titleTemplate: { type: "string" },
              descriptionTemplate: { type: "string" },
              impactStatementTemplate: { type: "string" },
              roleTitleTemplate: { type: "string" },
              category: { type: "string" },
              difficulty: { type: "string" },
              estimatedEffortHours: { type: "number" },
              dueDays: { type: "number" },
              availableInDays: { type: "number" },
              deadlinePolicy: { type: "string", enum: ["NONE", "SOFT", "EXPIRES", "REQUIRED"] },
              claimPolicy: { type: "string" },
              isPublic: { type: "boolean" },
              skillTagTemplates: { type: "array", items: { type: "string" } },
              interestTagTemplates: { type: "array", items: { type: "string" } },
              actionLinkUrlTemplate: { type: "string" },
              actionLinkLabelTemplate: { type: "string" },
              actionLinkInstructionsTemplate: { type: "string" },
              ownerResolver: { type: "string" },
              assigneePersonResolver: { type: "string" },
              assigneeOrganizationResolver: { type: "string" },
              parentResolver: { type: "string" },
              contributesToGate: { type: "boolean" },
            },
            required: ["kind", "titleTemplate", "descriptionTemplate"],
          },
        },
        communicationSpawnSpecs: {
          type: "array",
          description: "For triggerKind=spawnCommunication: one spec per outbound message.",
          items: {
            type: "object",
            properties: {
              kind: { type: "string" },
              sortOrder: { type: "number" },
              subjectTemplate: { type: "string" },
              bodyTextTemplate: { type: "string" },
              bodyHtmlTemplate: { type: "string" },
              commentTemplate: { type: "string" },
              channel: { type: "string" },
              audienceResolver: { type: "string" },
              purpose: { type: "string" },
              emailScope: { type: "string" },
              dedupeKeyTemplate: { type: "string" },
              minHoursBetweenSends: { type: "number" },
              maxSendsPerTask: { type: "number" },
              minSendCount: {
                type: "number",
                description:
                  "Inclusive lower bound on the prior-send count at which this spec is active. Lets one trigger carry escalating-tone variants — week-1 spec at 0/0, week-2 at 1/1, etc. Default 0.",
              },
              maxSendCount: {
                type: ["number", "null"],
                description:
                  "Inclusive upper bound on the prior-send count. null = open-ended (this spec keeps firing once minSendCount is reached, until maxSendsPerTask runs out).",
              },
            },
            required: ["kind", "subjectTemplate", "bodyTextTemplate", "dedupeKeyTemplate"],
          },
        },
      },
      required: ["triggerKey", "eventName", "idempotencyKeyTemplate"],
    },
  },
  {
    name: "updateTaskTrigger",
    description:
      "Update an existing TaskTrigger by triggerKey. Pass only the fields you want to change. spawnSpecs / communicationSpawnSpecs, when supplied, REPLACE the existing specs (delete + recreate).",
    inputSchema: {
      type: "object" as const,
      properties: {
        triggerKey: { type: "string" },
        eventName: { type: "string" },
        triggerKind: { type: "string", enum: ["spawnTasks", "verifyTask", "spawnCommunication"] },
        idempotencyKeyTemplate: { type: "string" },
        eventFilter: { type: "object" },
        completionGate: { type: "object" },
        jurisdictionId: { type: "string" },
        notes: { type: "string" },
        enabled: { type: "boolean" },
        schedule: { type: "string", description: "Cron expression. See createTaskTrigger." },
        iterationSource: {
          type: "string",
          enum: ["none", "overdue-tasks"],
          description: "Resolver key. See createTaskTrigger.",
        },
        spawnSpecs: { type: "array", items: { type: "object" } },
        communicationSpawnSpecs: {
          type: "array",
          description:
            "Replaces existing communication specs. Each item supports the same fields as in createTaskTrigger, including minSendCount / maxSendCount for escalating-tone variants.",
          items: { type: "object" },
        },
      },
      required: ["triggerKey"],
    },
  },
  {
    name: "disableTaskTrigger",
    description:
      "Soft-disable a TaskTrigger. Sets enabled=false with an optional reason. Re-enable by calling updateTaskTrigger with enabled:true.",
    inputSchema: {
      type: "object" as const,
      properties: {
        triggerKey: { type: "string" },
        disabledReason: { type: "string" },
      },
      required: ["triggerKey"],
    },
  },
  {
    name: "listTaskTriggers",
    description:
      "List TaskTriggers, optionally filtered by eventName, enabled, or jurisdictionId. Returns triggerKey + summary fields, no specs.",
    inputSchema: {
      type: "object" as const,
      properties: {
        eventName: { type: "string" },
        enabled: { type: "boolean" },
        jurisdictionId: { type: "string" },
        limit: { type: "number", description: "Default 100, max 500" },
      },
    },
  },
  {
    name: "getTaskTrigger",
    description: "Get full details of a TaskTrigger by triggerKey, including all spec rows and the most recent fires.",
    inputSchema: {
      type: "object" as const,
      properties: {
        triggerKey: { type: "string" },
        recentFires: { type: "number", description: "How many recent fires to include. Default 10, max 100." },
      },
      required: ["triggerKey"],
    },
  },
  {
    name: "fireTaskTrigger",
    description:
      "Fire a TaskTrigger manually with arbitrary context. Use dryRun:true to render templates and return the planned spawn without committing — critical for iterating on a template before it goes live. Without dryRun: writes are committed and idempotent (re-firing the same idempotencyKey returns the cached result).",
    inputSchema: {
      type: "object" as const,
      properties: {
        triggerKey: { type: "string" },
        context: { type: "object", description: "Arbitrary event context. Templates and resolvers read from this." },
        dryRun: { type: "boolean", description: "Default false. True = render-only, no writes." },
      },
      required: ["triggerKey", "context"],
    },
  },
] as const;

const TASK_TRIGGER_TOOL_NAME_SET = new Set<string>(
  Object.keys(TASK_TRIGGER_TOOL_SCOPES),
);

export function isTaskTriggerToolName(name: string): name is TaskTriggerToolName {
  return TASK_TRIGGER_TOOL_NAME_SET.has(name);
}

export async function handleTaskTriggerToolCall({
  args,
  isAdmin,
  name,
  userId,
}: {
  args: Record<string, unknown>;
  isAdmin: boolean;
  name: TaskTriggerToolName;
  userId: string | null | undefined;
}): Promise<ToolResponse> {
  switch (name) {
    case "createTaskTrigger": {
      const { createTaskTrigger } = await import("../triggers/admin");
      const result = await createTaskTrigger(
        args as unknown as Parameters<typeof createTaskTrigger>[0],
        { actorUserId: userId ?? null },
      );
      return ok(result);
    }

    case "updateTaskTrigger": {
      const { updateTaskTrigger } = await import("../triggers/admin");
      const result = await updateTaskTrigger(
        args as unknown as Parameters<typeof updateTaskTrigger>[0],
        { actorUserId: userId ?? null },
      );
      return ok(result);
    }

    case "disableTaskTrigger": {
      const { disableTaskTrigger } = await import("../triggers/admin");
      const result = await disableTaskTrigger(args as Parameters<typeof disableTaskTrigger>[0]);
      return ok(result);
    }

    case "listTaskTriggers": {
      const { listTaskTriggers } = await import("../triggers/admin");
      const result = await listTaskTriggers(args as Parameters<typeof listTaskTriggers>[0]);
      return ok(result);
    }

    case "getTaskTrigger": {
      const { getTaskTrigger } = await import("../triggers/admin");
      const triggerKey = args.triggerKey as string;
      if (!triggerKey) return err("triggerKey is required");
      const recentFires = typeof args.recentFires === "number" ? args.recentFires : 10;
      const result = await getTaskTrigger({ triggerKey, recentFires });
      if (!result) return err(`TaskTrigger not found: ${triggerKey}`);
      return ok(result);
    }

    case "fireTaskTrigger": {
      const { fireTaskTrigger } = await import("../triggers/fire");
      const triggerKey = args.triggerKey as string;
      if (!triggerKey) return err("triggerKey is required");
      const dryRun = args.dryRun === true;
      // Personal users can only dryRun. Real fires write tasks under a
      // caller-controlled context; keep committed writes admin-only.
      if (!dryRun && !isAdmin) {
        return err(
          "fireTaskTrigger commits writes from caller-controlled context; non-admin callers may only use dryRun:true",
        );
      }
      const result = await fireTaskTrigger(triggerKey, args.context, {
        dryRun,
        actorUserId: userId ?? null,
      });
      return ok(result);
    }
  }
}
