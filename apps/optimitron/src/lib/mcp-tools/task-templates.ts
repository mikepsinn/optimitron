import { stringifyJsonSafe } from "../json-safe";
import { McpScope } from "../mcp-scopes";

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

export const TASK_TEMPLATE_TOOL_SCOPES = {
  createTaskTemplate: [McpScope.TASKS_ADMIN],
  listTaskTemplates: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  getTaskTemplate: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  previewTaskTemplate: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  assignTaskTemplate: [McpScope.TASKS_ADMIN],
} satisfies Record<string, McpScope[]>;

export type TaskTemplateToolName = keyof typeof TASK_TEMPLATE_TOOL_SCOPES;

export const TASK_TEMPLATE_ADMIN_TOOL_NAMES = [
  "createTaskTemplate",
  "assignTaskTemplate",
] as const satisfies ReadonlyArray<TaskTemplateToolName>;

const SPAWN_SPEC_SCHEMA = {
  type: "array" as const,
  description:
    "One spawned task per spec. Use assigneePersonResolver='context.target.id' for person targets, assigneeOrganizationResolver='context.target.id' for organization targets, or resolver='actor' for the calling user.",
  items: {
    type: "object" as const,
    properties: {
      kind: { type: "string", description: "Suffix used in spawned taskKey." },
      isParent: { type: "boolean" },
      sortOrder: { type: "number" },
      titleTemplate: { type: "string" },
      descriptionTemplate: { type: "string" },
      impactStatementTemplate: { type: "string" },
      roleTitleTemplate: { type: "string" },
      category: { type: "string" },
      estimatedEffortHours: { type: "number" },
      dueDays: { type: "number" },
      availableInDays: { type: "number" },
      deadlinePolicy: {
        type: "string",
        enum: ["NONE", "SOFT", "EXPIRES", "REQUIRED"],
      },
      claimPolicy: { type: "string" },
      isPublic: { type: "boolean" },
      skillTagTemplates: { type: "array", items: { type: "string" } },
      interestTagTemplates: { type: "array", items: { type: "string" } },
      actionLinkUrlTemplate: { type: "string" },
      actionLinkLabelTemplate: { type: "string" },
      actionLinkInstructionsTemplate: { type: "string" },
      creatorResolver: { type: "string" },
      assigneePersonResolver: { type: "string" },
      assigneeOrganizationResolver: { type: "string" },
      parentResolver: { type: "string" },
      contributesToGate: { type: "boolean" },
    },
    required: ["kind", "titleTemplate", "descriptionTemplate"],
  },
};

const TARGET_PROPERTIES = {
  targetPersonId: {
    type: "string",
    description:
      "Person ID to assign/render for. Adds context.target={kind:'person',id} and context.recipientPersonId.",
  },
  targetOrganizationId: {
    type: "string",
    description:
      "Organization ID to assign/render for. Adds context.target={kind:'organization',id} and context.organizationId.",
  },
  targetUserId: {
    type: "string",
    description:
      "User ID to render for. Adds context.target={kind:'user',id} and context.user.id.",
  },
  context: {
    type: "object",
    description:
      "Extra template context. Explicit fields here are preserved unless a target helper fills a missing field.",
  },
};

export const TASK_TEMPLATE_TOOL_DEFINITIONS = [
  {
    name: "createTaskTemplate",
    description:
      "Create a reusable task template backed by TaskTrigger. Use this when a task should be stamped out for many people/orgs or fired by an event such as user.signup. Defaults to eventName='manual' and disabled until previewed/enabled.",
    inputSchema: {
      type: "object" as const,
      properties: {
        templateKey: {
          type: "string",
          description:
            "Stable unique key for this template, e.g. mission:first-hour.",
        },
        eventName: {
          type: "string",
          description:
            "Event that fires this template. Defaults to manual. Use user.signup for everyone-on-signup tasks.",
        },
        idempotencyKeyTemplate: {
          type: "string",
          description:
            "Template producing one stable task-key base per target. Defaults to '<templateKey>:{{target.kind}}:{{target.id}}', or '<templateKey>:user:{{user.id}}' for user.* events.",
        },
        eventFilter: { type: "object" },
        completionGate: { type: "object" },
        jurisdictionId: { type: "string" },
        notes: { type: "string" },
        enabled: {
          type: "boolean",
          description:
            "Defaults to false. Preview first, then enable when the template is right.",
        },
        spawnSpecs: SPAWN_SPEC_SCHEMA,
        metadata: { type: "object" },
      },
      required: ["templateKey", "spawnSpecs"],
    },
  },
  {
    name: "listTaskTemplates",
    description:
      "List reusable task templates. This is a friendly view over TaskTrigger rows.",
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
    name: "getTaskTemplate",
    description:
      "Get one task template, including spawned task specs and recent fires.",
    inputSchema: {
      type: "object" as const,
      properties: {
        templateKey: { type: "string" },
        recentFires: {
          type: "number",
          description: "How many recent fires to include. Default 10, max 100.",
        },
      },
      required: ["templateKey"],
    },
  },
  {
    name: "previewTaskTemplate",
    description:
      "Render a task template for a target/context without writing anything. Use before enabling or assigning a template.",
    inputSchema: {
      type: "object" as const,
      properties: {
        templateKey: { type: "string" },
        ...TARGET_PROPERTIES,
      },
      required: ["templateKey"],
    },
  },
  {
    name: "assignTaskTemplate",
    description:
      "Stamp out a task template for one target. Writes are idempotent through the template's idempotencyKeyTemplate and the spawned taskKey values.",
    inputSchema: {
      type: "object" as const,
      properties: {
        templateKey: { type: "string" },
        ...TARGET_PROPERTIES,
      },
      required: ["templateKey"],
    },
  },
] as const;

const TASK_TEMPLATE_TOOL_NAME_SET = new Set<string>(
  Object.keys(TASK_TEMPLATE_TOOL_SCOPES),
);

export function isTaskTemplateToolName(
  name: string,
): name is TaskTemplateToolName {
  return TASK_TEMPLATE_TOOL_NAME_SET.has(name);
}

export async function handleTaskTemplateToolCall({
  args,
  name,
  userId,
}: {
  args: Record<string, unknown>;
  name: TaskTemplateToolName;
  userId: string | null | undefined;
}): Promise<ToolResponse> {
  switch (name) {
    case "createTaskTemplate": {
      const templateKey = readTemplateKey(args);
      if (!templateKey) return err("templateKey is required");
      if (!Array.isArray(args.spawnSpecs) || args.spawnSpecs.length === 0) {
        return err("spawnSpecs is required and must include at least one task");
      }

      const eventName = readString(args.eventName) ?? "manual";
      const idempotencyKeyTemplate =
        readString(args.idempotencyKeyTemplate) ??
        getDefaultIdempotencyKeyTemplate(templateKey, eventName);

      const { createTaskTrigger } = await import("../triggers/admin");
      const result = await createTaskTrigger(
        {
          triggerKey: templateKey,
          eventName,
          triggerKind: "spawnTasks",
          idempotencyKeyTemplate,
          eventFilter: args.eventFilter,
          completionGate: args.completionGate,
          jurisdictionId: readString(args.jurisdictionId),
          notes: readString(args.notes),
          enabled: typeof args.enabled === "boolean" ? args.enabled : undefined,
          spawnSpecs: args.spawnSpecs as Parameters<
            typeof createTaskTrigger
          >[0]["spawnSpecs"],
          metadata: {
            ...(isPlainObject(args.metadata) ? args.metadata : {}),
            taskTemplateFacade: true,
          },
        },
        { actorUserId: userId ?? null },
      );
      return ok(withTemplateKey(result));
    }

    case "listTaskTemplates": {
      const { listTaskTriggers } = await import("../triggers/admin");
      const result = await listTaskTriggers({
        eventName: readString(args.eventName),
        enabled: typeof args.enabled === "boolean" ? args.enabled : undefined,
        jurisdictionId: readString(args.jurisdictionId),
        limit: typeof args.limit === "number" ? args.limit : undefined,
      });
      return ok(
        result.map((trigger) => ({
          ...trigger,
          templateKey: trigger.triggerKey,
        })),
      );
    }

    case "getTaskTemplate": {
      const templateKey = readTemplateKey(args);
      if (!templateKey) return err("templateKey is required");
      const { getTaskTrigger } = await import("../triggers/admin");
      const result = await getTaskTrigger({
        triggerKey: templateKey,
        recentFires:
          typeof args.recentFires === "number" ? args.recentFires : 10,
      });
      if (!result) return err(`TaskTemplate not found: ${templateKey}`);
      return ok(withTemplateKey(result));
    }

    case "previewTaskTemplate": {
      const templateKey = readTemplateKey(args);
      if (!templateKey) return err("templateKey is required");
      const targetError = readTargetSelectionError(args);
      if (targetError) return err(targetError);
      const { fireTaskTrigger } = await import("../triggers/fire");
      const result = await fireTaskTrigger(templateKey, buildContext(args), {
        dryRun: true,
        actorUserId: userId ?? null,
      });
      return ok(result);
    }

    case "assignTaskTemplate": {
      const templateKey = readTemplateKey(args);
      if (!templateKey) return err("templateKey is required");
      const targetError = readTargetSelectionError(args);
      if (targetError) return err(targetError);
      if (!hasContextOrTarget(args)) {
        return err(
          "assignTaskTemplate requires targetPersonId, targetOrganizationId, targetUserId, or context",
        );
      }
      const { fireTaskTrigger } = await import("../triggers/fire");
      const result = await fireTaskTrigger(templateKey, buildContext(args), {
        dryRun: false,
        actorUserId: userId ?? null,
      });
      return ok(result);
    }
  }
}

function readTemplateKey(args: Record<string, unknown>) {
  return readString(args.templateKey) ?? readString(args.triggerKey);
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getDefaultIdempotencyKeyTemplate(
  templateKey: string,
  eventName: string,
) {
  return eventName.startsWith("user.")
    ? `${templateKey}:user:{{user.id}}`
    : `${templateKey}:{{target.kind}}:{{target.id}}`;
}

function hasContextOrTarget(args: Record<string, unknown>) {
  return (
    isPlainObject(args.context) ||
    Boolean(readString(args.targetPersonId)) ||
    Boolean(readString(args.targetOrganizationId)) ||
    Boolean(readString(args.targetUserId))
  );
}

function readTargetSelectionError(args: Record<string, unknown>) {
  const targetCount = [
    readString(args.targetPersonId),
    readString(args.targetOrganizationId),
    readString(args.targetUserId),
    isPlainObject(args.context) && Object.keys(args.context).length > 0
      ? "context"
      : undefined,
  ].filter(Boolean).length;

  return targetCount > 1
    ? "ambiguous target: provide exactly one of targetPersonId, targetOrganizationId, targetUserId, or context"
    : undefined;
}

function buildContext(args: Record<string, unknown>) {
  const context: Record<string, unknown> = isPlainObject(args.context)
    ? { ...args.context }
    : {};

  const targetPersonId = readString(args.targetPersonId);
  const targetOrganizationId = readString(args.targetOrganizationId);
  const targetUserId = readString(args.targetUserId);

  if (targetPersonId) {
    context.target ??= { kind: "person", id: targetPersonId };
    context.recipientPersonId ??= targetPersonId;
    context.recipient ??= { personId: targetPersonId };
  } else if (targetOrganizationId) {
    context.target ??= { kind: "organization", id: targetOrganizationId };
    context.organizationId ??= targetOrganizationId;
    context.organization ??= { id: targetOrganizationId };
  } else if (targetUserId) {
    context.target ??= { kind: "user", id: targetUserId };
    context.user ??= { id: targetUserId };
  }

  return context;
}

function withTemplateKey<T>(value: T): T & { templateKey?: string } {
  if (!isPlainObject(value)) return value as T & { templateKey?: string };
  return {
    ...value,
    templateKey:
      typeof value.triggerKey === "string" ? value.triggerKey : undefined,
  } as T & { templateKey?: string };
}
