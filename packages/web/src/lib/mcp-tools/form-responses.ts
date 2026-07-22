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

const FORM_RESPONSE_SCOPES = [
  McpScope.TASKS_PERSONAL,
  McpScope.TASKS_ORGANIZATION,
];

export const FORM_RESPONSE_TOOL_SCOPES = {
  findReviewedAnswers: FORM_RESPONSE_SCOPES,
  prepareFormResponses: FORM_RESPONSE_SCOPES,
  proposeFormSubmission: FORM_RESPONSE_SCOPES,
} satisfies Record<string, McpScope[]>;

export type FormResponseToolName = keyof typeof FORM_RESPONSE_TOOL_SCOPES;

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
    fieldKey: { type: "string" },
    knowledgeKey: { type: "string" },
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
  required: ["fieldKey", "prompt"],
} as const;

export const FORM_RESPONSE_TOOL_DEFINITIONS = [
  {
    name: "findReviewedAnswers",
    description:
      "Find reusable reviewed text answers for one person or organization.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subject: SUBJECT_SCHEMA,
        question: { type: "string" },
        knowledgeKey: { type: "string" },
        contextTags: { type: "array", items: { type: "string" } },
        asOf: { type: "string", format: "date-time" },
        limit: { type: "number" },
      },
      required: ["subject", "question"],
    },
  },
  {
    name: "prepareFormResponses",
    description:
      "Prepare narrative form responses and create review tasks for unresolved answers.",
    inputSchema: {
      type: "object" as const,
      properties: {
        formTaskId: { type: "string" },
        subject: SUBJECT_SCHEMA,
        questions: {
          type: "array",
          minItems: 1,
          maxItems: 200,
          items: QUESTION_SCHEMA,
        },
        idempotencyKey: { type: "string" },
      },
      required: ["formTaskId", "subject", "questions", "idempotencyKey"],
    },
  },
  {
    name: "proposeFormSubmission",
    description:
      "Propose an exact reviewed text-response payload for human approval without executing it.",
    inputSchema: {
      type: "object" as const,
      properties: {
        formTaskId: { type: "string" },
        taskExecutionAttemptId: { type: "string" },
        destination: { type: "string" },
        responses: {
          type: "array",
          minItems: 1,
          maxItems: 200,
          items: {
            type: "object",
            properties: {
              fieldKey: { type: "string" },
              prompt: { type: "string" },
              answerRevisionId: { type: "string" },
            },
            required: ["fieldKey", "prompt", "answerRevisionId"],
          },
        },
        idempotencyKey: { type: "string" },
        expiresAt: { type: "string", format: "date-time" },
      },
      required: [
        "formTaskId",
        "taskExecutionAttemptId",
        "destination",
        "responses",
        "idempotencyKey",
      ],
    },
  },
] as const;

const FORM_RESPONSE_TOOL_NAMES = new Set<string>(
  Object.keys(FORM_RESPONSE_TOOL_SCOPES),
);

export function isFormResponseToolName(
  name: string,
): name is FormResponseToolName {
  return FORM_RESPONSE_TOOL_NAMES.has(name);
}

export async function handleFormResponseToolCall(input: {
  args: Record<string, unknown>;
  clientAccessBoundary: TaskClientAccessBoundary;
  name: FormResponseToolName;
  userId: string | null | undefined;
}): Promise<ToolResponse> {
  if (!input.userId) {
    return err(`${input.name} requires an identified user`);
  }

  try {
    const formResponses = await import("../form-responses.server");

    switch (input.name) {
      case "findReviewedAnswers":
        return ok(
          await formResponses.findReviewedAnswers(input.args, input.userId, {
            clientAccessBoundary: input.clientAccessBoundary,
          }),
        );
      case "prepareFormResponses":
        return ok(
          await formResponses.prepareFormResponses(input.args, input.userId, {
            clientAccessBoundary: input.clientAccessBoundary,
          }),
        );
      case "proposeFormSubmission":
        return ok(
          await formResponses.proposeFormSubmission(input.args, input.userId, {
            clientAccessBoundary: input.clientAccessBoundary,
          }),
        );
    }
  } catch (error) {
    if (error instanceof Error && !error.name.startsWith("PrismaClient")) {
      return err(error.message);
    }
    console.error(`[mcp] ${input.name} failed:`, error);
    return err("Form response operation failed");
  }
}
