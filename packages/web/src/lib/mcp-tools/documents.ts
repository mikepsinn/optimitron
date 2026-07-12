/**
 * MCP document tools: versioned markdown documents, optionally attached to
 * tasks. Personal-scope gated like personal tasks; private by default.
 */

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

export const DOCUMENT_TOOL_SCOPES = {
  createDocument: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  updateDocument: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  getDocument: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  listDocuments: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
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
        visibility: VISIBILITY_SCHEMA,
      },
      required: ["title", "body"],
    },
  },
  {
    name: "updateDocument",
    description:
      "Update a document you created. Writes a NEW version row and flips isCurrent — old versions stay readable. Omitted fields carry forward.",
    inputSchema: {
      type: "object" as const,
      properties: {
        documentId: {
          type: "string",
          description: "Any version row id of the document",
        },
        title: { type: "string" },
        body: { type: "string", description: "Full replacement markdown body" },
        visibility: VISIBILITY_SCHEMA,
      },
      required: ["documentId"],
    },
  },
  {
    name: "getDocument",
    description:
      "Read one document version plus its version list. Private documents 404 unless you created them.",
    inputSchema: {
      type: "object" as const,
      properties: {
        documentId: { type: "string", description: "Document version row id" },
      },
      required: ["documentId"],
    },
  },
  {
    name: "listDocuments",
    description:
      "List current document versions you can see: public documents plus your own. Filter by taskId to see a task's documents.",
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

export async function handleDocumentToolCall({
  args,
  name,
  userId,
}: {
  args: Record<string, unknown>;
  name: DocumentToolName;
  userId: string | null | undefined;
}): Promise<ToolResponse> {
  const documents = await import("../documents.server");

  switch (name) {
    case "createDocument": {
      if (!userId) return err("createDocument requires an identified user");
      const title = readString(args.title);
      const body = readString(args.body);
      if (!title || !body) return err("title and body are required");
      const row = await documents.createDocument({
        title,
        body,
        createdByUserId: userId,
        taskId: readString(args.taskId) ?? null,
        jurisdictionId: readString(args.jurisdictionId) ?? null,
        visibility:
          args.visibility === "PUBLIC" || args.visibility === "PRIVATE"
            ? args.visibility
            : null,
      });
      return ok({ document: documents.toDocumentDto(row) });
    }

    case "updateDocument": {
      if (!userId) return err("updateDocument requires an identified user");
      const documentId = readString(args.documentId);
      if (!documentId) return err("documentId is required");
      const row = await documents.updateDocument({
        documentId,
        editorUserId: userId,
        title: readString(args.title) ?? null,
        body: typeof args.body === "string" ? args.body : null,
        visibility:
          args.visibility === "PUBLIC" || args.visibility === "PRIVATE"
            ? args.visibility
            : null,
      });
      return ok({ document: documents.toDocumentDto(row) });
    }

    case "getDocument": {
      const documentId = readString(args.documentId);
      if (!documentId) return err("documentId is required");
      const result = await documents.getDocumentForViewer(documentId, userId);
      if (!result) return err(documents.DOCUMENT_NOT_FOUND_MESSAGE);
      return ok({
        document: documents.toDocumentDto(result.document),
        versions: result.versions,
        viewerCanEdit: result.viewerCanEdit,
      });
    }

    case "listDocuments": {
      const rows = await documents.listDocumentsForViewer({
        userId: userId ?? null,
        taskId: readString(args.taskId) ?? null,
        limit: typeof args.limit === "number" ? args.limit : null,
      });
      return ok({ documents: rows.map(documents.toDocumentDto) });
    }
  }
}
