import { stringifyJsonSafe } from "../json-safe";
import { McpScope } from "../mcp-scopes";
import type { TaskClientAccessBoundary } from "../tasks/task-visibility.server";

type ToolResponse = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

const REVIEW_TOOL_SCOPES = [
  McpScope.TASKS_PERSONAL,
  McpScope.TASKS_ORGANIZATION,
  McpScope.TASKS_ADMIN,
];

export const DOCUMENT_REVIEW_TOOL_SCOPES = {
  applyDocumentProposal: REVIEW_TOOL_SCOPES,
  createDocumentProposal: REVIEW_TOOL_SCOPES,
  decideDocumentRevision: REVIEW_TOOL_SCOPES,
  getDocumentReview: REVIEW_TOOL_SCOPES,
  requestDocumentReview: REVIEW_TOOL_SCOPES,
  submitDocumentReview: REVIEW_TOOL_SCOPES,
} satisfies Record<string, McpScope[]>;

export type DocumentReviewToolName = keyof typeof DOCUMENT_REVIEW_TOOL_SCOPES;

const IDEMPOTENCY_KEY = {
  type: "string",
  description: "Stable retry key for this operation.",
} as const;

const VERDICT = {
  type: "string",
  enum: ["APPROVE", "CHANGES_REQUESTED", "REJECT", "ABSTAIN"],
} as const;

export const DOCUMENT_REVIEW_TOOL_DEFINITIONS = [
  {
    name: "getDocumentReview",
    description:
      "Read the exact document revision and instructions assigned to the authenticated reviewer.",
    inputSchema: {
      type: "object" as const,
      additionalProperties: false,
      properties: {
        reviewTaskId: { type: "string" },
      },
      required: ["reviewTaskId"],
    },
  },
  {
    name: "createDocumentProposal",
    description:
      "Create a separate private proposal document from selected comments on one exact document revision.",
    inputSchema: {
      type: "object" as const,
      additionalProperties: false,
      properties: {
        authorityTaskId: { type: "string" },
        baseDocumentRevisionId: { type: "string" },
        body: { type: "string" },
        idempotencyKey: IDEMPOTENCY_KEY,
        sourceCommentIds: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          uniqueItems: true,
        },
        summary: { type: "string" },
        title: { type: "string" },
      },
      required: [
        "authorityTaskId",
        "baseDocumentRevisionId",
        "body",
        "idempotencyKey",
        "sourceCommentIds",
        "summary",
        "title",
      ],
    },
  },
  {
    name: "applyDocumentProposal",
    description:
      "Apply a pinned proposal artifact to its unchanged base document as a new immutable revision.",
    inputSchema: {
      type: "object" as const,
      additionalProperties: false,
      properties: {
        authorityTaskId: { type: "string" },
        idempotencyKey: IDEMPOTENCY_KEY,
        proposalArtifactId: { type: "string" },
      },
      required: ["authorityTaskId", "idempotencyKey", "proposalArtifactId"],
    },
  },
  {
    name: "requestDocumentReview",
    description:
      "Create a private assigned review task pinned to one exact immutable document revision.",
    inputSchema: {
      type: "object" as const,
      additionalProperties: false,
      properties: {
        authorityTaskId: { type: "string" },
        documentRevisionId: { type: "string" },
        idempotencyKey: IDEMPOTENCY_KEY,
        instructions: { type: "string" },
        reviewerPersonId: { type: "string" },
      },
      required: [
        "authorityTaskId",
        "documentRevisionId",
        "idempotencyKey",
        "instructions",
        "reviewerPersonId",
      ],
    },
  },
  {
    name: "submitDocumentReview",
    description:
      "Submit an explained verdict for the exact revision assigned to the authenticated reviewer.",
    inputSchema: {
      type: "object" as const,
      additionalProperties: false,
      properties: {
        explanation: { type: "string" },
        idempotencyKey: IDEMPOTENCY_KEY,
        reviewTaskId: { type: "string" },
        verdict: VERDICT,
      },
      required: ["explanation", "idempotencyKey", "reviewTaskId", "verdict"],
    },
  },
  {
    name: "decideDocumentRevision",
    description:
      "Record an authorized immutable internal ADOPT or REJECT decision on one exact current revision.",
    inputSchema: {
      type: "object" as const,
      additionalProperties: false,
      properties: {
        action: { type: "string", enum: ["ADOPT", "REJECT"] },
        authorityTaskId: { type: "string" },
        documentRevisionId: { type: "string" },
        idempotencyKey: IDEMPOTENCY_KEY,
        reason: { type: "string" },
        reviewArtifactId: { type: "string" },
      },
      required: [
        "action",
        "authorityTaskId",
        "documentRevisionId",
        "idempotencyKey",
        "reviewArtifactId",
      ],
    },
  },
] as const;

const DOCUMENT_REVIEW_TOOL_NAMES = new Set<string>(
  Object.keys(DOCUMENT_REVIEW_TOOL_SCOPES),
);

export function isDocumentReviewToolName(
  name: string,
): name is DocumentReviewToolName {
  return DOCUMENT_REVIEW_TOOL_NAMES.has(name);
}

function ok(data: unknown): ToolResponse {
  return { content: [{ type: "text", text: stringifyJsonSafe(data, 2) }] };
}

function err(message: string): ToolResponse {
  return {
    content: [{ type: "text", text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}

function readRequiredString(
  args: Record<string, unknown>,
  key: string,
): string | null {
  const value = args[key];
  return typeof value === "string" && value.trim() ? value : null;
}

export async function handleDocumentReviewToolCall({
  args,
  clientAccessBoundary,
  name,
  userId,
}: {
  args: Record<string, unknown>;
  clientAccessBoundary?: TaskClientAccessBoundary;
  name: DocumentReviewToolName;
  userId: string | null | undefined;
}): Promise<ToolResponse> {
  if (!userId) return err(`${name} requires an identified user`);

  if (name === "getDocumentReview") {
    const reviewTaskId = readRequiredString(args, "reviewTaskId");
    if (!reviewTaskId) return err("reviewTaskId is required");

    try {
      const reviews = await import("../tasks/document-review.server");
      return ok(
        await reviews.getAssignedDocumentReview(reviewTaskId, userId, {
          clientAccessBoundary,
        }),
      );
    } catch (error) {
      return err(
        error instanceof Error
          ? error.message
          : "Document review operation failed",
      );
    }
  }

  const idempotencyKey = readRequiredString(args, "idempotencyKey");
  if (!idempotencyKey) return err("idempotencyKey is required");

  try {
    const reviews = await import("../tasks/document-review.server");
    const rawInput = { ...args };
    delete rawInput.authorityTaskId;
    delete rawInput.reviewTaskId;
    delete rawInput.idempotencyKey;
    const options = { clientAccessBoundary, idempotencyKey };
    const targetKey =
      name === "submitDocumentReview" ? "reviewTaskId" : "authorityTaskId";
    const targetId = readRequiredString(args, targetKey);
    if (!targetId) return err(`${targetKey} is required`);
    const operations = {
      applyDocumentProposal: reviews.applyDocumentProposal,
      createDocumentProposal: reviews.createDocumentProposal,
      decideDocumentRevision: reviews.decideDocumentRevision,
      requestDocumentReview: reviews.requestDocumentReview,
      submitDocumentReview: reviews.submitDocumentReview,
    };
    return ok(await operations[name](targetId, rawInput, userId, options));
  } catch (error) {
    return err(
      error instanceof Error
        ? error.message
        : "Document review operation failed",
    );
  }
}
