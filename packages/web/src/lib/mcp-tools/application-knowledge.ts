import { stringifyJsonSafe } from "../json-safe";
import { McpScope } from "../mcp-scopes";
import type { TaskClientAccessBoundary } from "../tasks/task-visibility.server";

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

const APPLICATION_KNOWLEDGE_SCOPES = [
  McpScope.TASKS_PERSONAL,
  McpScope.TASKS_ORGANIZATION,
];

export const APPLICATION_KNOWLEDGE_TOOL_SCOPES = {
  findReusableAnswers: APPLICATION_KNOWLEDGE_SCOPES,
  prepareApplicationQuestions: APPLICATION_KNOWLEDGE_SCOPES,
  proposeApplicationSubmission: APPLICATION_KNOWLEDGE_SCOPES,
} satisfies Record<string, McpScope[]>;

export type ApplicationKnowledgeToolName =
  keyof typeof APPLICATION_KNOWLEDGE_TOOL_SCOPES;

const SUBJECT_SCHEMA = {
  type: "object",
  properties: {
    organizationId: { type: "string" },
    personId: { type: "string" },
  },
  additionalProperties: false,
  oneOf: [{ required: ["organizationId"] }, { required: ["personId"] }],
} as const;

const QUESTION_SCHEMA = {
  type: "object",
  properties: {
    key: { type: "string" },
    prompt: { type: "string" },
    contextTags: { type: "array", items: { type: "string" } },
    answerRevisionId: { type: "string" },
    proposedAnswer: { type: "string" },
    sensitivity: {
      type: "string",
      enum: ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"],
    },
    sourceArtifactIds: { type: "array", items: { type: "string" } },
    validUntil: { type: ["string", "null"], format: "date-time" },
  },
  required: ["key", "prompt"],
} as const;

export const APPLICATION_KNOWLEDGE_TOOL_DEFINITIONS = [
  {
    name: "findReusableAnswers",
    description:
      "Find reusable reviewed answers for one person or organization.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subject: SUBJECT_SCHEMA,
        question: { type: "string" },
        contextTags: { type: "array", items: { type: "string" } },
        asOf: { type: "string", format: "date-time" },
        limit: { type: "number" },
      },
      required: ["subject", "question"],
    },
  },
  {
    name: "prepareApplicationQuestions",
    description:
      "Prepare application questions and proposed answers for human review.",
    inputSchema: {
      type: "object" as const,
      properties: {
        applicationTaskId: { type: "string" },
        subject: SUBJECT_SCHEMA,
        questions: {
          type: "array",
          minItems: 1,
          maxItems: 200,
          items: QUESTION_SCHEMA,
        },
        idempotencyKey: { type: "string" },
      },
      required: ["applicationTaskId", "subject", "questions", "idempotencyKey"],
    },
  },
  {
    name: "proposeApplicationSubmission",
    description:
      "Propose an application submission for human approval without executing it.",
    inputSchema: {
      type: "object" as const,
      properties: {
        applicationTaskId: { type: "string" },
        destination: { type: "string" },
        answers: {
          type: "array",
          minItems: 1,
          maxItems: 200,
          items: {
            type: "object",
            properties: {
              key: { type: "string" },
              prompt: { type: "string" },
              answerRevisionId: { type: "string" },
            },
            required: ["key", "prompt", "answerRevisionId"],
          },
        },
        idempotencyKey: { type: "string" },
        expiresAt: { type: "string", format: "date-time" },
      },
      required: [
        "applicationTaskId",
        "destination",
        "answers",
        "idempotencyKey",
      ],
    },
  },
] as const;

const APPLICATION_KNOWLEDGE_TOOL_NAMES = new Set<string>(
  Object.keys(APPLICATION_KNOWLEDGE_TOOL_SCOPES),
);

export function isApplicationKnowledgeToolName(
  name: string,
): name is ApplicationKnowledgeToolName {
  return APPLICATION_KNOWLEDGE_TOOL_NAMES.has(name);
}

export async function handleApplicationKnowledgeToolCall(input: {
  args: Record<string, unknown>;
  clientAccessBoundary: TaskClientAccessBoundary;
  name: ApplicationKnowledgeToolName;
  userId: string | null | undefined;
}): Promise<ToolResponse> {
  if (!input.userId) {
    return err(`${input.name} requires an identified user`);
  }

  try {
    const knowledge = await import("../application-knowledge.server");

    switch (input.name) {
      case "findReusableAnswers":
        return ok(
          await knowledge.findReusableAnswers(input.args, input.userId, {
            clientAccessBoundary: input.clientAccessBoundary,
          }),
        );
      case "prepareApplicationQuestions":
        return ok(
          await knowledge.prepareApplicationQuestions(
            input.args,
            input.userId,
            {
              clientAccessBoundary: input.clientAccessBoundary,
            },
          ),
        );
      case "proposeApplicationSubmission":
        return ok(
          await knowledge.proposeApplicationSubmission(
            input.args,
            input.userId,
            { clientAccessBoundary: input.clientAccessBoundary },
          ),
        );
    }
  } catch (error) {
    if (error instanceof Error && !error.name.startsWith("PrismaClient")) {
      return err(error.message);
    }
    console.error(`[mcp] ${input.name} failed:`, error);
    return err("Application knowledge operation failed");
  }
}
