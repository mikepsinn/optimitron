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

const TASK_REVIEW_SCOPES = [
  McpScope.TASKS_PERSONAL,
  McpScope.TASKS_ORGANIZATION,
  McpScope.TASKS_ADMIN,
];

export const DOCUMENT_REVIEW_TOOL_SCOPES = {
  adoptDocumentRevision: TASK_REVIEW_SCOPES,
  applyDocumentProposal: TASK_REVIEW_SCOPES,
  publishDocumentRevisionAsReferendum: TASK_REVIEW_SCOPES,
  requestDocumentReview: TASK_REVIEW_SCOPES,
  submitDocumentReview: TASK_REVIEW_SCOPES,
} satisfies Record<string, McpScope[]>;

export type DocumentReviewToolName = keyof typeof DOCUMENT_REVIEW_TOOL_SCOPES;

const CHECKLIST_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      criterion: { type: "string" },
      id: { type: "string" },
      required: { type: "boolean" },
    },
    required: ["criterion", "id"],
  },
};

const WAIVER_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      reason: { type: "string" },
      reviewTaskId: { type: "string" },
    },
    required: ["reason", "reviewTaskId"],
  },
};

export const DOCUMENT_REVIEW_TOOL_DEFINITIONS = [
  {
    name: "requestDocumentReview",
    description:
      "Create one private assigned review task pinned to an exact immutable document revision.",
    inputSchema: {
      type: "object" as const,
      properties: {
        authorityTaskId: { type: "string" },
        checklist: CHECKLIST_SCHEMA,
        documentRevisionId: { type: "string" },
        idempotencyKey: { type: "string" },
        instructions: { type: "string" },
        required: { type: "boolean" },
        reviewerPersonId: { type: "string" },
        title: { type: "string" },
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
      "Submit a substantive verdict for the exact revision assigned to the authenticated reviewer, with an optional separate proposed document.",
    inputSchema: {
      type: "object" as const,
      properties: {
        checklistResponses: {
          type: "array",
          items: {
            type: "object",
            properties: {
              comment: { type: "string" },
              criterionId: { type: "string" },
              result: {
                type: "string",
                enum: ["PASS", "FAIL", "NOT_APPLICABLE"],
              },
            },
            required: ["criterionId", "result"],
          },
        },
        explanation: { type: "string" },
        proposal: {
          type: "object",
          properties: {
            body: { type: "string" },
            title: { type: "string" },
          },
          required: ["body", "title"],
        },
        reviewTaskId: { type: "string" },
        verdict: {
          type: "string",
          enum: ["APPROVE", "CHANGES_REQUESTED", "REJECT", "ABSTAIN"],
        },
      },
      required: [
        "checklistResponses",
        "explanation",
        "reviewTaskId",
        "verdict",
      ],
    },
  },
  {
    name: "applyDocumentProposal",
    description:
      "Apply a reviewer's proposal, or a generic proposal created first as a separate PRIVATE document with createDocument, as a new canonical revision. Generic proposals must identify the exact base and proposal revisions, source comments, and summary. Prior reviews of the canonical document become stale. This does not adopt or publish it.",
    inputSchema: {
      type: "object" as const,
      additionalProperties: false,
      properties: {
        authorityTaskId: { type: "string" },
        baseDocumentRevisionId: { type: "string" },
        expectedDocumentVersion: { type: "integer", minimum: 1 },
        proposalDocumentRevisionId: { type: "string" },
        reviewTaskId: { type: "string" },
        sourceCommentIds: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          maxItems: 500,
          uniqueItems: true,
        },
        summary: { type: "string" },
      },
      required: ["authorityTaskId", "expectedDocumentVersion"],
      oneOf: [
        {
          required: ["reviewTaskId"],
          not: {
            anyOf: [
              { required: ["baseDocumentRevisionId"] },
              { required: ["proposalDocumentRevisionId"] },
              { required: ["sourceCommentIds"] },
              { required: ["summary"] },
            ],
          },
        },
        {
          required: [
            "baseDocumentRevisionId",
            "proposalDocumentRevisionId",
            "sourceCommentIds",
            "summary",
          ],
          not: { required: ["reviewTaskId"] },
        },
      ],
    },
  },
  {
    name: "adoptDocumentRevision",
    description:
      "Record an immutable manager decision adopting the current revision after accepted independent approvals or reasoned waivers for unresolved required reviews.",
    inputSchema: {
      type: "object" as const,
      properties: {
        authorityTaskId: { type: "string" },
        documentRevisionId: { type: "string" },
        idempotencyKey: { type: "string" },
        useAsFundingTerms: { type: "boolean" },
        waivers: WAIVER_SCHEMA,
      },
      required: ["authorityTaskId", "documentRevisionId", "idempotencyKey"],
    },
  },
  {
    name: "publishDocumentRevisionAsReferendum",
    description:
      "Publish an adopted document revision as a new immutable active referendum and record its decision provenance.",
    inputSchema: {
      type: "object" as const,
      properties: {
        decisionArtifactId: { type: "string" },
        description: {
          anyOf: [{ type: "string" }, { type: "null" }],
        },
        jurisdictionId: {
          anyOf: [{ type: "string" }, { type: "null" }],
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
        },
        question: { type: "string" },
        slug: { type: "string" },
      },
      required: ["decisionArtifactId", "question", "slug"],
    },
  },
] as const;

const DOCUMENT_REVIEW_TOOL_NAME_SET = new Set<string>(
  Object.keys(DOCUMENT_REVIEW_TOOL_SCOPES),
);

export function isDocumentReviewToolName(
  name: string,
): name is DocumentReviewToolName {
  return DOCUMENT_REVIEW_TOOL_NAME_SET.has(name);
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

  try {
    if (name === "publishDocumentRevisionAsReferendum") {
      const publications =
        await import("../referendums/document-publication.server");
      return ok(
        await publications.publishDocumentRevisionAsReferendum(args, userId, {
          clientAccessBoundary,
        }),
      );
    }

    const reviews = await import("../tasks/document-review.server");
    switch (name) {
      case "requestDocumentReview": {
        const { authorityTaskId, idempotencyKey, ...input } = args;
        return ok(
          await reviews.requestDocumentReview(
            String(authorityTaskId ?? ""),
            input,
            userId,
            {
              clientAccessBoundary,
              idempotencyKey: String(idempotencyKey ?? ""),
            },
          ),
        );
      }
      case "submitDocumentReview": {
        const { reviewTaskId, ...input } = args;
        return ok(
          await reviews.submitDocumentReview(
            String(reviewTaskId ?? ""),
            input,
            userId,
            { clientAccessBoundary },
          ),
        );
      }
      case "applyDocumentProposal": {
        const { authorityTaskId, ...input } = args;
        return ok(
          await reviews.applyDocumentProposal(
            String(authorityTaskId ?? ""),
            input,
            userId,
            { clientAccessBoundary },
          ),
        );
      }
      case "adoptDocumentRevision": {
        const { authorityTaskId, idempotencyKey, ...input } = args;
        return ok(
          await reviews.adoptDocumentRevision(
            String(authorityTaskId ?? ""),
            input,
            userId,
            {
              clientAccessBoundary,
              idempotencyKey: String(idempotencyKey ?? ""),
            },
          ),
        );
      }
    }
  } catch (error) {
    return err(
      error instanceof Error
        ? error.message
        : "Document review operation failed",
    );
  }
}
