/**
 * MCP document tools: stable Markdown documents with immutable revision
 * history. Personal-scope gated like personal tasks; private by default.
 */

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

export const DOCUMENT_TOOL_SCOPES = {
  createDocument: [
    McpScope.TASKS_PERSONAL,
    McpScope.TASKS_ORGANIZATION,
    McpScope.TASKS_ADMIN,
  ],
  updateDocument: [
    McpScope.TASKS_PERSONAL,
    McpScope.TASKS_ORGANIZATION,
    McpScope.TASKS_ADMIN,
  ],
  getDocument: [
    McpScope.TASKS_PERSONAL,
    McpScope.TASKS_ORGANIZATION,
    McpScope.TASKS_ADMIN,
  ],
  listDocuments: [
    McpScope.TASKS_PERSONAL,
    McpScope.TASKS_ORGANIZATION,
    McpScope.TASKS_ADMIN,
  ],
} satisfies Record<string, McpScope[]>;

export type DocumentToolName = keyof typeof DOCUMENT_TOOL_SCOPES;

const VISIBILITY_SCHEMA = {
  type: "string",
  description: "PRIVATE (default) or PUBLIC.",
  enum: ["PRIVATE", "PUBLIC"],
};

export const DOCUMENT_TOOL_DEFINITIONS = [
  {
    name: "createDocument",
    description:
      "Create a markdown document (version 1). Private by default. Optionally attach it to a task you can view.",
    inputSchema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Document title" },
        body: { type: "string", description: "Markdown body" },
        taskId: {
          type: "string",
          description: "Optional task to attach the document to",
        },
        jurisdictionId: {
          type: "string",
          description:
            "Optional jurisdiction. Defaults to the attached task's jurisdiction.",
        },
        organizationId: {
          type: "string",
          description: "Optional organization that owns the document",
        },
        parentDocumentId: {
          type: "string",
          description: "Optional parent document",
        },
        idempotencyKey: {
          type: "string",
          description: "Stable retry key for this create request",
        },
        visibility: VISIBILITY_SCHEMA,
      },
      required: ["title", "body", "idempotencyKey"],
    },
  },
  {
    name: "updateDocument",
    description:
      "Update a document. Writes an immutable revision and rejects stale edits. Omitted fields carry forward.",
    inputSchema: {
      type: "object" as const,
      properties: {
        documentId: {
          type: "string",
          description: "Stable document ID",
        },
        expectedVersion: {
          type: "number",
          description: "Version returned by getDocument",
        },
        title: { type: "string" },
        body: { type: "string", description: "Full replacement markdown body" },
        organizationId: {
          description: "Organization owner, or null to remove it",
          anyOf: [{ type: "string" }, { type: "null" }],
        },
        parentDocumentId: {
          description: "Parent document, or null to move it to the root",
          anyOf: [{ type: "string" }, { type: "null" }],
        },
        taskId: {
          description: "Linked task, or null to remove the task link",
          anyOf: [{ type: "string" }, { type: "null" }],
        },
        visibility: VISIBILITY_SCHEMA,
      },
      required: ["documentId", "expectedVersion"],
    },
  },
  {
    name: "getDocument",
    description:
      "Read a document or historical revision plus its revision list when you have access.",
    inputSchema: {
      type: "object" as const,
      properties: {
        documentId: {
          type: "string",
          description: "Stable document ID or historical revision ID",
        },
      },
      required: ["documentId"],
    },
  },
  {
    name: "listDocuments",
    description:
      "List documents you can see. Filter by taskId to see a task's documents.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Only documents on this task" },
        limit: { type: "number", description: "Default 100, max 500" },
      },
    },
  },
] as const;

const DOCUMENT_TOOL_NAME_SET = new Set<string>(
  Object.keys(DOCUMENT_TOOL_SCOPES),
);

export function isDocumentToolName(name: string): name is DocumentToolName {
  return DOCUMENT_TOOL_NAME_SET.has(name);
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readNullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return readString(value);
}

export async function handleDocumentToolCall({
  args,
  clientAccessBoundary,
  name,
  userId,
}: {
  args: Record<string, unknown>;
  clientAccessBoundary?: TaskClientAccessBoundary;
  name: DocumentToolName;
  userId: string | null | undefined;
}): Promise<ToolResponse> {
  try {
    const documents = await import("../documents.server");

    switch (name) {
      case "createDocument": {
        if (!userId) return err("createDocument requires an identified user");
        const title = readString(args.title);
        const body = readString(args.body);
        const idempotencyKey = readString(args.idempotencyKey);
        if (!title || !body) return err("title and body are required");
        if (!idempotencyKey) return err("idempotencyKey is required");
        const row = await documents.createDocument(
          {
            title,
            body,
            createdByUserId: userId,
            taskId: readString(args.taskId) ?? null,
            jurisdictionId: readString(args.jurisdictionId) ?? null,
            organizationId: readString(args.organizationId) ?? null,
            parentDocumentId: readString(args.parentDocumentId) ?? null,
            idempotencyKey,
            visibility:
              args.visibility === "PUBLIC" || args.visibility === "PRIVATE"
                ? args.visibility
                : null,
          },
          { clientAccessBoundary },
        );
        return ok({ document: documents.toDocumentDto(row) });
      }

      case "updateDocument": {
        if (!userId) return err("updateDocument requires an identified user");
        const documentId = readString(args.documentId);
        if (!documentId) return err("documentId is required");
        const expectedVersion = args.expectedVersion;
        if (
          typeof expectedVersion !== "number" ||
          !Number.isInteger(expectedVersion) ||
          expectedVersion < 1
        ) {
          return err("expectedVersion must be a positive integer");
        }
        const row = await documents.updateDocument(
          {
            documentId,
            editorUserId: userId,
            expectedVersion,
            title: readString(args.title) ?? null,
            body: typeof args.body === "string" ? args.body : null,
            organizationId: readNullableString(args.organizationId),
            parentDocumentId: readNullableString(args.parentDocumentId),
            taskId: readNullableString(args.taskId),
            visibility:
              args.visibility === "PUBLIC" || args.visibility === "PRIVATE"
                ? args.visibility
                : null,
          },
          { clientAccessBoundary },
        );
        return ok({ document: documents.toDocumentDto(row) });
      }

      case "getDocument": {
        const documentId = readString(args.documentId);
        if (!documentId) return err("documentId is required");
        const result = await documents.getDocumentForViewer(
          documentId,
          userId,
          {
            clientAccessBoundary,
          },
        );
        if (!result) return err(documents.DOCUMENT_NOT_FOUND_MESSAGE);
        return ok({
          document: documents.toDocumentDto(result),
          versions: result.versions,
          viewerCanEdit: result.viewerCanEdit,
        });
      }

      case "listDocuments": {
        const rows = await documents.listDocumentsForViewer({
          clientAccessBoundary,
          userId: userId ?? null,
          taskId: readString(args.taskId) ?? null,
          limit: typeof args.limit === "number" ? args.limit : null,
        });
        return ok({ documents: rows });
      }
    }
  } catch (error) {
    return err(
      error instanceof Error ? error.message : "Document operation failed",
    );
  }
}
