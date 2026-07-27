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

const RECEIPT_SCOPES = [
  McpScope.TASKS_PERSONAL,
  McpScope.TASKS_ORGANIZATION,
  McpScope.TASKS_ADMIN,
];

export const CONTRIBUTION_RECEIPT_TOOL_SCOPES = {
  appendContributionOutcomeAddendum: RECEIPT_SCOPES,
  issueContributionReceipt: RECEIPT_SCOPES,
} satisfies Record<string, McpScope[]>;

export type ContributionReceiptToolName =
  keyof typeof CONTRIBUTION_RECEIPT_TOOL_SCOPES;

export const CONTRIBUTION_RECEIPT_TOOL_DEFINITIONS = [
  {
    name: "issueContributionReceipt",
    description:
      "Issue or retrieve the deterministic immutable receipt for one paid task-funding payment, freezing terms, governing documents, intended work, and the current impact estimate without claiming completed work, realized impact, or EOP.",
    inputSchema: {
      type: "object" as const,
      properties: {
        governingDocumentRevisionIds: {
          type: "array",
          items: { type: "string" },
        },
        paymentId: { type: "string" },
        termsDocumentRevisionId: { type: "string" },
      },
      required: [
        "governingDocumentRevisionIds",
        "paymentId",
        "termsDocumentRevisionId",
      ],
    },
  },
  {
    name: "appendContributionOutcomeAddendum",
    description:
      "Append an immutable completion, observed-impact, refund, or correction record to an existing contribution receipt. The original receipt never changes.",
    inputSchema: {
      type: "object" as const,
      properties: {
        correctsArtifactId: {
          anyOf: [{ type: "string" }, { type: "null" }],
        },
        evidence: {
          type: "array",
          items: {
            type: "object",
            properties: {
              contentHash: { type: "string" },
              note: { type: "string" },
              sourceArtifactId: { type: "string" },
              sourceUrl: { type: "string" },
            },
          },
        },
        idempotencyKey: { type: "string" },
        impactRealized: { type: "boolean" },
        kind: {
          type: "string",
          enum: ["TASK_COMPLETED", "IMPACT_OBSERVED", "REFUND", "CORRECTION"],
        },
        observedAt: { type: "string", format: "date-time" },
        paymentId: { type: "string" },
        summary: { type: "string" },
        taskCompleted: { type: "boolean" },
      },
      required: [
        "idempotencyKey",
        "impactRealized",
        "kind",
        "observedAt",
        "paymentId",
        "summary",
        "taskCompleted",
      ],
    },
  },
] as const;

const TOOL_NAMES = new Set<string>(
  Object.keys(CONTRIBUTION_RECEIPT_TOOL_SCOPES),
);

export function isContributionReceiptToolName(
  name: string,
): name is ContributionReceiptToolName {
  return TOOL_NAMES.has(name);
}

export async function handleContributionReceiptToolCall({
  args,
  clientAccessBoundary,
  name,
  userId,
}: {
  args: Record<string, unknown>;
  clientAccessBoundary?: TaskClientAccessBoundary;
  name: ContributionReceiptToolName;
  userId: string | null | undefined;
}): Promise<ToolResponse> {
  if (!userId) return err(`${name} requires an identified user`);
  try {
    const receipts =
      await import("../task-funding/contribution-receipts.server");
    return name === "issueContributionReceipt"
      ? ok(
          await receipts.issueContributionReceipt(args, userId, {
            clientAccessBoundary,
          }),
        )
      : ok(
          await receipts.appendContributionOutcomeAddendum(args, userId, {
            clientAccessBoundary,
          }),
        );
  } catch (error) {
    return err(
      error instanceof Error
        ? error.message
        : "Contribution receipt operation failed",
    );
  }
}
