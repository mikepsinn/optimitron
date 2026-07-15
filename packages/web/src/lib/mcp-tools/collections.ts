import { ContentVisibility } from "@optimitron/db/enums";
import { z } from "zod";
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

export const COLLECTION_TOOL_SCOPES = {
  createCollection: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  updateCollection: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  getCollection: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  importNotionBundle: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  listCollections: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  createCollectionRecord: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  upsertCollectionRecordsBatch: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  updateCollectionRecord: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  queryCollectionRecords: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  searchContent: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  saveCollectionView: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
} satisfies Record<string, McpScope[]>;

export type CollectionToolName = keyof typeof COLLECTION_TOOL_SCOPES;

const FIELD_SCHEMA = {
  type: "object",
  properties: {
    key: { type: "string" },
    name: { type: "string" },
    type: {
      type: "string",
      enum: [
        "TEXT",
        "RICH_TEXT",
        "NUMBER",
        "BOOLEAN",
        "DATE",
        "SELECT",
        "MULTI_SELECT",
        "URL",
        "EMAIL",
        "FILE",
        "RELATION",
        "TASK",
        "PERSON",
        "ORGANIZATION",
        "DOCUMENT",
        "FORMULA",
        "ROLLUP",
      ],
    },
    required: { type: "boolean" },
    position: { type: "number" },
    targetCollectionId: { type: "string" },
    optionsJson: { type: "object" },
  },
  required: ["key", "name", "type"],
};

const RELATION_SCHEMA = {
  type: "object",
  properties: {
    fieldKey: { type: "string" },
    position: { type: "number" },
    targetRecordId: { type: "string" },
    targetTaskId: { type: "string" },
    targetPersonId: { type: "string" },
    targetOrganizationId: { type: "string" },
    targetDocumentId: { type: "string" },
  },
  required: ["fieldKey"],
};

const BATCH_OPERATION_SCHEMA = {
  type: "object",
  properties: {
    operation: { type: "string", enum: ["create", "update"] },
    idempotencyKey: { type: "string" },
    recordId: { type: "string" },
    expectedVersion: { type: "number" },
    values: { type: "object" },
    relations: { type: "array", items: RELATION_SCHEMA },
    taskId: { type: ["string", "null"] },
    personId: { type: ["string", "null"] },
    organizationId: { type: ["string", "null"] },
    documentId: { type: ["string", "null"] },
  },
  required: ["operation"],
};

const NULLABLE_ID_SCHEMA = { type: ["string", "null"] } as const;

export const COLLECTION_TOOL_DEFINITIONS = [
  {
    name: "importNotionBundle",
    description:
      "Validate and import a lossless Notion export bundle. Dry-run is the default; set dryRun to false only after reviewing the returned create, update, unchanged, and error items. Imported tasks remain private drafts, and formula or rollup definitions are preserved without execution.",
    inputSchema: {
      type: "object" as const,
      properties: {
        bundle: { type: "object", additionalProperties: true },
        dryRun: { type: "boolean", default: true },
      },
      required: ["bundle"],
    },
  },
  {
    name: "createCollection",
    description:
      "Create a private structured collection with stable fields. Formula and rollup fields preserve imported definitions and outputs but are not executed.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        organizationId: { type: "string" },
        jurisdictionId: { type: "string" },
        visibility: { type: "string", enum: ["PRIVATE", "PUBLIC"] },
        idempotencyKey: { type: "string" },
        fields: { type: "array", items: FIELD_SCHEMA },
      },
      required: ["name", "idempotencyKey"],
    },
  },
  {
    name: "updateCollection",
    description:
      "Update collection metadata with optimistic concurrency. Sharing and ownership still require full access.",
    inputSchema: {
      type: "object" as const,
      properties: {
        collectionId: { type: "string" },
        expectedVersion: { type: "number" },
        fields: { type: "array", items: FIELD_SCHEMA },
        name: { type: "string" },
        description: { type: "string" },
        organizationId: { type: "string" },
        visibility: { type: "string", enum: ["PRIVATE", "PUBLIC"] },
      },
      required: ["collectionId", "expectedVersion"],
    },
  },
  {
    name: "getCollection",
    description:
      "Get a collection schema, saved views, and effective permission.",
    inputSchema: {
      type: "object" as const,
      properties: { collectionId: { type: "string" } },
      required: ["collectionId"],
    },
  },
  {
    name: "listCollections",
    description: "List collections the current user can see.",
    inputSchema: {
      type: "object" as const,
      properties: { limit: { type: "number" } },
    },
  },
  {
    name: "createCollectionRecord",
    description:
      "Create a collection record. Normal edits cannot write file, relation, formula, rollup, or canonical-entity fields through values; use relations for links.",
    inputSchema: {
      type: "object" as const,
      properties: {
        collectionId: { type: "string" },
        values: { type: "object" },
        relations: { type: "array", items: RELATION_SCHEMA },
        taskId: NULLABLE_ID_SCHEMA,
        personId: NULLABLE_ID_SCHEMA,
        organizationId: NULLABLE_ID_SCHEMA,
        documentId: NULLABLE_ID_SCHEMA,
        idempotencyKey: { type: "string" },
      },
      required: ["collectionId", "values", "idempotencyKey"],
    },
  },
  {
    name: "updateCollectionRecord",
    description: "Update record values or relations and reject stale versions.",
    inputSchema: {
      type: "object" as const,
      properties: {
        recordId: { type: "string" },
        expectedVersion: { type: "number" },
        values: { type: "object" },
        relations: { type: "array", items: RELATION_SCHEMA },
        taskId: NULLABLE_ID_SCHEMA,
        personId: NULLABLE_ID_SCHEMA,
        organizationId: NULLABLE_ID_SCHEMA,
        documentId: NULLABLE_ID_SCHEMA,
      },
      required: ["recordId", "expectedVersion"],
    },
  },
  {
    name: "upsertCollectionRecordsBatch",
    description:
      "Atomically create or update up to 100 collection records. Creates require stable idempotency keys; updates require the expected record version. Any invalid or stale operation rolls back the entire batch.",
    inputSchema: {
      type: "object" as const,
      properties: {
        collectionId: { type: "string" },
        operations: { type: "array", items: BATCH_OPERATION_SCHEMA },
      },
      required: ["collectionId", "operations"],
    },
  },
  {
    name: "queryCollectionRecords",
    description:
      "Query collection records with bounded filters, ordered sorts, cursor pagination, and linked-entity authorization.",
    inputSchema: {
      type: "object" as const,
      properties: {
        collectionId: { type: "string" },
        cursor: { type: "string" },
        limit: { type: "number" },
        query: { type: "string" },
        filters: { type: "array", items: { type: "object" } },
        sorts: { type: "array", items: { type: "object" } },
      },
      required: ["collectionId"],
    },
  },
  {
    name: "searchContent",
    description:
      "Search authorized Markdown documents and collection records without exposing inaccessible matches.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string" },
        limit: { type: "number" },
      },
      required: ["query"],
    },
  },
  {
    name: "saveCollectionView",
    description:
      "Create or update a saved table view with visible fields, filters, and sorts.",
    inputSchema: {
      type: "object" as const,
      properties: {
        collectionId: { type: "string" },
        viewId: { type: "string" },
        expectedVersion: { type: "number" },
        name: { type: "string" },
        visibleFieldIds: { type: "array", items: { type: "string" } },
        filters: { type: "array", items: { type: "object" } },
        sorts: { type: "array", items: { type: "object" } },
        isDefault: { type: "boolean" },
      },
      required: ["collectionId", "name"],
    },
  },
] as const;

const COLLECTION_TOOL_NAME_SET = new Set<string>(
  Object.keys(COLLECTION_TOOL_SCOPES),
);

export function isCollectionToolName(name: string): name is CollectionToolName {
  return COLLECTION_TOOL_NAME_SET.has(name);
}

const optionalString = z.string().trim().min(1).nullable().optional();

export async function handleCollectionToolCall(input: {
  args: Record<string, unknown>;
  name: CollectionToolName;
  userId: string | null | undefined;
}): Promise<ToolResponse> {
  try {
    const collections = await import("../collections.server");
    const { args, name, userId } = input;

    if (
      !userId &&
      !["getCollection", "listCollections", "queryCollectionRecords"].includes(
        name,
      )
    ) {
      return err(`${name} requires an identified user`);
    }

    switch (name) {
      case "importNotionBundle": {
        const parsed = z
          .object({
            bundle: z.unknown(),
            dryRun: z.boolean().default(true),
          })
          .parse(args);
        const { importNotionBundle } = await import("../notion-import.server");
        return ok(
          await importNotionBundle({
            actorUserId: userId as string,
            bundle: parsed.bundle,
            dryRun: parsed.dryRun,
          }),
        );
      }
      case "createCollection": {
        const parsed = z
          .object({
            name: z.string(),
            description: optionalString,
            organizationId: optionalString,
            jurisdictionId: optionalString,
            visibility: z.nativeEnum(ContentVisibility).optional(),
            idempotencyKey: z.string().trim().min(1),
            fields: z.array(collections.collectionFieldInputSchema).optional(),
          })
          .parse(args);
        const view = await collections.createCollection({
          ...parsed,
          createdByUserId: userId as string,
        });
        return ok({ collection: collections.toCollectionDto(view) });
      }
      case "updateCollection": {
        const parsed = z
          .object({
            collectionId: z.string().min(1),
            expectedVersion: z.number().int().positive(),
            fields: z.array(collections.collectionFieldInputSchema).optional(),
            name: optionalString,
            description: optionalString,
            organizationId: optionalString,
            visibility: z.nativeEnum(ContentVisibility).nullable().optional(),
          })
          .parse(args);
        const view = await collections.updateCollection({
          ...parsed,
          editorUserId: userId as string,
        });
        return ok({ collection: collections.toCollectionDto(view) });
      }
      case "getCollection": {
        const collectionId = z.string().min(1).parse(args.collectionId);
        const view = await collections.getCollectionForViewer(
          collectionId,
          userId,
        );
        if (!view) return err(collections.COLLECTION_NOT_FOUND_MESSAGE);
        return ok({ collection: collections.toCollectionDto(view) });
      }
      case "listCollections": {
        const rows = await collections.listCollectionsForViewer({
          userId,
          limit: typeof args.limit === "number" ? args.limit : null,
        });
        return ok({ collections: rows });
      }
      case "createCollectionRecord": {
        const parsed = z
          .object({
            collectionId: z.string().min(1),
            values: z.record(z.unknown()),
            relations: z
              .array(collections.collectionRelationInputSchema)
              .optional(),
            taskId: optionalString,
            personId: optionalString,
            organizationId: optionalString,
            documentId: optionalString,
            idempotencyKey: z.string().trim().min(1),
          })
          .parse(args);
        const record = await collections.createCollectionRecord({
          ...parsed,
          createdByUserId: userId as string,
        });
        return ok({ record });
      }
      case "updateCollectionRecord": {
        const parsed = z
          .object({
            recordId: z.string().min(1),
            expectedVersion: z.number().int().positive(),
            values: z.record(z.unknown()).optional(),
            relations: z
              .array(collections.collectionRelationInputSchema)
              .optional(),
            taskId: optionalString,
            personId: optionalString,
            organizationId: optionalString,
            documentId: optionalString,
          })
          .parse(args);
        const record = await collections.updateCollectionRecord({
          ...parsed,
          editorUserId: userId as string,
        });
        return ok({ record });
      }
      case "upsertCollectionRecordsBatch": {
        const parsed = z
          .object({
            collectionId: z.string().min(1),
            operations: z
              .array(collections.collectionRecordBatchOperationSchema)
              .min(1)
              .max(100),
          })
          .parse(args);
        return ok({
          results: await collections.upsertCollectionRecordsBatch({
            ...parsed,
            editorUserId: userId as string,
          }),
        });
      }
      case "queryCollectionRecords": {
        const parsed = z
          .object({
            collectionId: z.string().min(1),
            cursor: optionalString,
            limit: z.number().optional(),
            query: optionalString,
            filters: z.array(collections.collectionFilterSchema).optional(),
            sorts: z.array(collections.collectionSortSchema).optional(),
          })
          .parse(args);
        return ok(
          await collections.queryCollectionRecords({ ...parsed, userId }),
        );
      }
      case "searchContent": {
        const parsed = z
          .object({
            query: z.string(),
            limit: z.number().optional(),
          })
          .parse(args);
        const { searchContent } = await import("../content-search.server");
        return ok(await searchContent({ ...parsed, userId }));
      }
      case "saveCollectionView": {
        const parsed = z
          .object({
            collectionId: z.string().min(1),
            viewId: z.string().trim().min(1).optional(),
            expectedVersion: z.number().int().positive().optional(),
            name: z.string(),
            visibleFieldIds: z.array(z.string()).optional(),
            filters: z.array(collections.collectionFilterSchema).optional(),
            sorts: z.array(collections.collectionSortSchema).optional(),
            isDefault: z.boolean().optional(),
          })
          .parse(args);
        const view = await collections.saveCollectionView({
          ...parsed,
          editorUserId: userId as string,
        });
        return ok({ view });
      }
    }
  } catch (error) {
    return err(
      error instanceof Error ? error.message : "Collection operation failed",
    );
  }
}
