import type { ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  collectionFieldInputSchema,
  collectionFilterSchema,
  collectionRecordBatchOperationSchema,
  collectionRelationInputSchema,
  collectionSortSchema,
} from "@/lib/collections.server";
import {
  ALL_SCOPES,
  MCP_SCOPE_DESCRIPTIONS,
  scopeToWire,
} from "@/lib/mcp-scopes";
import { notionImportBundleSchema } from "@/lib/notion-import.schema";

type JsonSchema = Record<string, unknown>;

function openApiSchema(schema: ZodTypeAny): JsonSchema {
  const converted = zodToJsonSchema(schema, {
    $refStrategy: "none",
    target: "openApi3",
  }) as JsonSchema;
  delete converted.$schema;
  return converted;
}

const errorResponse = {
  description: "Request failed",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
        required: ["error"],
      },
    },
  },
} as const;

const unauthorizedResponse = {
  description: "Missing, expired, or insufficient OAuth token",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
    },
  },
} as const;

const jsonObjectResponse = (description: string) => ({
  description,
  content: {
    "application/json": {
      schema: { type: "object", additionalProperties: true },
    },
  },
});

const successEnvelope = (schema: JsonSchema) => ({
  type: "object",
  properties: {
    data: schema,
    success: { type: "boolean", const: true },
  },
  required: ["data", "success"],
});

const optionalTaskReadSecurity = [
  {},
  { OptimitronOAuth: ["tasks:personal"] },
  { OptimitronOAuth: ["tasks:admin"] },
] as const;

const taskPersonalOrAdminSecurity = [
  { OptimitronOAuth: ["tasks:personal"] },
  { OptimitronOAuth: ["tasks:admin"] },
] as const;

const tasksPersonalOrEarthdataWriteSecurity = [
  { OptimitronOAuth: ["tasks:personal"] },
  { OptimitronOAuth: ["earthdata:write"] },
] as const;

const earthdataWriteOrTasksAdminSecurity = [
  { OptimitronOAuth: ["earthdata:write"] },
  { OptimitronOAuth: ["tasks:admin"] },
] as const;

const taskSchema = {
  type: "object",
  additionalProperties: true,
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    description: { type: ["string", "null"] },
    status: { type: "string" },
    isPublic: { type: "boolean" },
    createdByUserId: { type: ["string", "null"] },
    assigneePersonId: { type: ["string", "null"] },
    assigneeOrganizationId: { type: ["string", "null"] },
  },
} as const;

function oauthScopes() {
  return Object.fromEntries(
    ALL_SCOPES.map((scope) => [
      scopeToWire(scope),
      MCP_SCOPE_DESCRIPTIONS[scope],
    ]),
  );
}

export function getDeveloperOpenApiDocument(origin: string) {
  const baseUrl = origin.replace(/\/+$/u, "");
  return {
    openapi: "3.1.0",
    info: {
      title: "Earth Optimization API",
      version: "2026-07-14",
      description:
        "Earth Optimization Services' OAuth, MCP, task, document, collection, referral, voting, people, and organization endpoints for apps and websites that integrate with Optimitron.",
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [{ url: baseUrl }],
    tags: [
      { name: "OAuth" },
      { name: "MCP" },
      { name: "Tasks" },
      { name: "Documents" },
      { name: "Collections" },
      { name: "Content" },
      { name: "Referrals" },
      { name: "Referendums" },
      { name: "People" },
      { name: "Organizations" },
      { name: "Profile" },
    ],
    paths: {
      "/.well-known/oauth-authorization-server": {
        get: {
          tags: ["OAuth"],
          summary: "OAuth authorization server metadata",
          responses: {
            "200": {
              description: "OAuth metadata",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
          },
        },
      },
      "/.well-known/oauth-protected-resource/mcp": {
        get: {
          tags: ["OAuth"],
          summary: "Protected resource metadata for the MCP server",
          responses: {
            "200": {
              description: "Protected resource metadata",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
          },
        },
      },
      "/api/mcp/oauth/register": {
        post: {
          tags: ["OAuth"],
          summary: "Register a public OAuth client",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/OAuthClientRegistration",
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Registered client",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/OAuthClient" },
                },
              },
            },
            "400": errorResponse,
            "500": errorResponse,
          },
        },
      },
      "/api/mcp/oauth/authorize": {
        get: {
          tags: ["OAuth"],
          summary: "Start the OAuth authorization code plus PKCE flow",
          parameters: [
            { $ref: "#/components/parameters/client_id" },
            { $ref: "#/components/parameters/redirect_uri" },
            { $ref: "#/components/parameters/response_type" },
            { $ref: "#/components/parameters/scope" },
            { $ref: "#/components/parameters/state" },
            { $ref: "#/components/parameters/code_challenge" },
            { $ref: "#/components/parameters/code_challenge_method" },
          ],
          responses: {
            "302": { description: "Redirects to the Optimitron consent page" },
            "400": errorResponse,
          },
        },
      },
      "/api/mcp/oauth/token": {
        post: {
          tags: ["OAuth"],
          summary: "Exchange an authorization code or refresh token",
          requestBody: {
            required: true,
            content: {
              "application/x-www-form-urlencoded": {
                schema: { $ref: "#/components/schemas/OAuthTokenRequest" },
              },
              "application/json": {
                schema: { $ref: "#/components/schemas/OAuthTokenRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Bearer token response",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/OAuthTokenResponse" },
                },
              },
            },
            "400": errorResponse,
          },
        },
      },
      "/api/mcp/oauth/revoke": {
        post: {
          tags: ["OAuth"],
          summary: "Revoke a refresh token grant",
          requestBody: {
            required: false,
            content: {
              "application/x-www-form-urlencoded": {
                schema: {
                  type: "object",
                  properties: { token: { type: "string" } },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Revocation is idempotent",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { active: { type: "boolean", const: false } },
                    required: ["active"],
                  },
                },
              },
            },
          },
        },
      },
      "/api/mcp/tools": {
        get: {
          tags: ["MCP"],
          summary: "List MCP tools and required scopes",
          responses: {
            "200": {
              description: "Tool catalog",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
          },
        },
      },
      "/api/mcp": {
        get: {
          tags: ["MCP"],
          summary: "MCP Streamable HTTP endpoint",
          security: [{ OptimitronOAuth: [] }],
          responses: {
            "200": { description: "MCP stream response" },
            "401": unauthorizedResponse,
          },
        },
        post: {
          tags: ["MCP"],
          summary: "Call MCP JSON-RPC tools over Streamable HTTP",
          security: [{ OptimitronOAuth: [] }],
          responses: {
            "200": { description: "MCP stream response" },
            "401": unauthorizedResponse,
          },
        },
        delete: {
          tags: ["MCP"],
          summary: "Close an MCP session",
          security: [{ OptimitronOAuth: [] }],
          responses: {
            "200": { description: "MCP stream response" },
            "401": unauthorizedResponse,
          },
        },
      },
      "/api/tasks": {
        get: {
          tags: ["Tasks"],
          summary: "List public, accessible, or created tasks",
          security: optionalTaskReadSecurity,
          parameters: [
            {
              name: "visibility",
              in: "query",
              schema: { enum: ["public", "accessible", "created"] },
            },
            {
              name: "status",
              in: "query",
              schema: { type: "string" },
            },
            {
              name: "assigneePersonId",
              in: "query",
              schema: { type: "string" },
            },
            {
              name: "assigneeOrganizationId",
              in: "query",
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Task list",
              content: {
                "application/json": {
                  schema: successEnvelope({
                    type: "array",
                    items: { $ref: "#/components/schemas/Task" },
                  }),
                },
              },
            },
            "401": unauthorizedResponse,
          },
        },
        post: {
          tags: ["Tasks"],
          summary: "Create a task",
          security: taskPersonalOrAdminSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateTaskRequest" },
              },
            },
          },
          responses: {
            "201": {
              description: "Created task",
              content: {
                "application/json": {
                  schema: successEnvelope({
                    $ref: "#/components/schemas/Task",
                  }),
                },
              },
            },
            "400": errorResponse,
            "401": unauthorizedResponse,
          },
        },
      },
      "/api/tasks/{id}": {
        get: {
          tags: ["Tasks"],
          summary: "Get task detail",
          security: optionalTaskReadSecurity,
          parameters: [{ $ref: "#/components/parameters/taskId" }],
          responses: {
            "200": {
              description: "Task detail",
              content: {
                "application/json": {
                  schema: successEnvelope({
                    type: "object",
                    additionalProperties: true,
                  }),
                },
              },
            },
            "401": unauthorizedResponse,
            "404": errorResponse,
          },
        },
        patch: {
          tags: ["Tasks"],
          summary: "Update a task created by the authenticated user",
          security: taskPersonalOrAdminSecurity,
          parameters: [{ $ref: "#/components/parameters/taskId" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateTaskRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Updated task",
              content: {
                "application/json": {
                  schema: successEnvelope({
                    $ref: "#/components/schemas/Task",
                  }),
                },
              },
            },
            "400": errorResponse,
            "401": unauthorizedResponse,
            "404": errorResponse,
          },
        },
        delete: {
          tags: ["Tasks"],
          summary: "Soft-delete a manageable task (admins may delete any task)",
          security: taskPersonalOrAdminSecurity,
          parameters: [{ $ref: "#/components/parameters/taskId" }],
          responses: {
            "200": {
              description: "Deleted task marker",
              content: {
                "application/json": {
                  schema: successEnvelope({
                    type: "object",
                    additionalProperties: true,
                  }),
                },
              },
            },
            "401": unauthorizedResponse,
            "404": errorResponse,
          },
        },
      },
      "/api/tasks/{id}/claim": {
        post: {
          tags: ["Tasks"],
          summary: "Claim an available task",
          security: taskPersonalOrAdminSecurity,
          parameters: [{ $ref: "#/components/parameters/taskId" }],
          responses: {
            "200": {
              description: "Task claim",
              content: {
                "application/json": {
                  schema: successEnvelope({
                    type: "object",
                    additionalProperties: true,
                  }),
                },
              },
            },
            "400": errorResponse,
            "401": unauthorizedResponse,
          },
        },
      },
      "/api/tasks/{id}/complete": {
        post: {
          tags: ["Tasks"],
          summary: "Complete an active claim or a simple personal task",
          security: taskPersonalOrAdminSecurity,
          parameters: [{ $ref: "#/components/parameters/taskId" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["completionEvidence"],
                  properties: {
                    completionEvidence: { type: "string", minLength: 1 },
                    actualCashCostUsd: { type: "number" },
                    actualEffortSeconds: { type: "number" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Completed claim or personal task",
              content: {
                "application/json": {
                  schema: successEnvelope({
                    type: "object",
                    additionalProperties: true,
                  }),
                },
              },
            },
            "400": errorResponse,
            "401": unauthorizedResponse,
          },
        },
      },
      "/api/tasks/{id}/release": {
        post: {
          tags: ["Tasks"],
          summary: "Release the authenticated user's active task claim",
          security: taskPersonalOrAdminSecurity,
          parameters: [{ $ref: "#/components/parameters/taskId" }],
          responses: {
            "200": {
              description: "Released task claim",
              content: {
                "application/json": {
                  schema: successEnvelope({
                    type: "object",
                    additionalProperties: true,
                  }),
                },
              },
            },
            "400": errorResponse,
            "401": unauthorizedResponse,
          },
        },
      },
      "/api/tasks/{id}/comments": {
        get: {
          tags: ["Tasks"],
          summary: "Read task comments and activity",
          security: optionalTaskReadSecurity,
          parameters: [
            { $ref: "#/components/parameters/taskId" },
            {
              name: "sort",
              in: "query",
              schema: { enum: ["new", "top"] },
            },
            {
              name: "cursor",
              in: "query",
              schema: { type: "string", format: "date-time" },
            },
          ],
          responses: {
            "200": {
              description: "Comment feed",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
            "401": unauthorizedResponse,
          },
        },
        post: {
          tags: ["Tasks"],
          summary: "Post a task comment",
          security: taskPersonalOrAdminSecurity,
          parameters: [{ $ref: "#/components/parameters/taskId" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["message"],
                  properties: {
                    message: { type: "string", maxLength: 20000 },
                    parentCommentId: { type: "string" },
                    mediaUrl: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Created comment",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
            "401": unauthorizedResponse,
            "429": errorResponse,
          },
        },
      },
      "/api/documents": {
        get: {
          tags: ["Documents"],
          summary: "List documents the caller can view",
          security: optionalTaskReadSecurity,
          parameters: [
            { $ref: "#/components/parameters/limit" },
            {
              name: "taskId",
              in: "query",
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": jsonObjectResponse("Authorized document list"),
            "401": unauthorizedResponse,
          },
        },
        post: {
          tags: ["Documents"],
          summary: "Create a private Markdown document",
          security: taskPersonalOrAdminSecurity,
          parameters: [{ $ref: "#/components/parameters/idempotencyKey" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateDocumentRequest" },
              },
            },
          },
          responses: {
            "201": jsonObjectResponse("Created document"),
            "400": errorResponse,
            "401": unauthorizedResponse,
          },
        },
      },
      "/api/documents/{id}": {
        get: {
          tags: ["Documents"],
          summary: "Get an authorized document revision",
          security: optionalTaskReadSecurity,
          parameters: [{ $ref: "#/components/parameters/documentId" }],
          responses: {
            "200": jsonObjectResponse("Document and revision history"),
            "401": unauthorizedResponse,
            "404": errorResponse,
          },
        },
        post: {
          tags: ["Documents"],
          summary: "Append a document revision with optimistic concurrency",
          security: taskPersonalOrAdminSecurity,
          parameters: [{ $ref: "#/components/parameters/documentId" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateDocumentRequest" },
              },
            },
          },
          responses: {
            "200": jsonObjectResponse("Updated document"),
            "400": errorResponse,
            "401": unauthorizedResponse,
            "404": errorResponse,
            "409": errorResponse,
          },
        },
      },
      "/api/collections": {
        get: {
          tags: ["Collections"],
          summary: "List collections the caller can view",
          security: optionalTaskReadSecurity,
          parameters: [{ $ref: "#/components/parameters/limit" }],
          responses: {
            "200": jsonObjectResponse("Authorized collection list"),
            "401": unauthorizedResponse,
          },
        },
        post: {
          tags: ["Collections"],
          summary: "Create a collection with stable fields",
          security: taskPersonalOrAdminSecurity,
          parameters: [{ $ref: "#/components/parameters/idempotencyKey" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateCollectionRequest",
                },
              },
            },
          },
          responses: {
            "201": jsonObjectResponse("Created collection"),
            "400": errorResponse,
            "401": unauthorizedResponse,
          },
        },
      },
      "/api/collections/{id}": {
        get: {
          tags: ["Collections"],
          summary: "Get an authorized collection schema and saved views",
          security: optionalTaskReadSecurity,
          parameters: [{ $ref: "#/components/parameters/collectionId" }],
          responses: {
            "200": jsonObjectResponse("Collection schema and permission"),
            "401": unauthorizedResponse,
            "404": errorResponse,
          },
        },
        post: {
          tags: ["Collections"],
          summary: "Update a collection with optimistic concurrency",
          security: taskPersonalOrAdminSecurity,
          parameters: [{ $ref: "#/components/parameters/collectionId" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdateCollectionRequest",
                },
              },
            },
          },
          responses: {
            "200": jsonObjectResponse("Updated collection"),
            "400": errorResponse,
            "401": unauthorizedResponse,
            "404": errorResponse,
            "409": errorResponse,
          },
        },
      },
      "/api/collections/{id}/records": {
        get: {
          tags: ["Collections"],
          summary: "Filter, sort, and page through authorized records",
          security: optionalTaskReadSecurity,
          parameters: [
            { $ref: "#/components/parameters/collectionId" },
            { $ref: "#/components/parameters/cursor" },
            { $ref: "#/components/parameters/limit" },
            {
              name: "q",
              in: "query",
              schema: { type: "string", maxLength: 500 },
            },
            {
              name: "filters",
              in: "query",
              description: "JSON-encoded CollectionFilter array",
              schema: { type: "string" },
            },
            {
              name: "sorts",
              in: "query",
              description: "JSON-encoded CollectionSort array",
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": jsonObjectResponse("Collection records"),
            "401": unauthorizedResponse,
            "404": errorResponse,
          },
        },
        post: {
          tags: ["Collections"],
          summary: "Create an idempotent collection record",
          security: taskPersonalOrAdminSecurity,
          parameters: [
            { $ref: "#/components/parameters/collectionId" },
            { $ref: "#/components/parameters/idempotencyKey" },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateCollectionRecordRequest",
                },
              },
            },
          },
          responses: {
            "201": jsonObjectResponse("Created record"),
            "400": errorResponse,
            "401": unauthorizedResponse,
          },
        },
      },
      "/api/collections/{id}/records/{recordId}": {
        get: {
          tags: ["Collections"],
          summary: "Get an authorized collection record",
          security: optionalTaskReadSecurity,
          parameters: [
            { $ref: "#/components/parameters/collectionId" },
            { $ref: "#/components/parameters/recordId" },
          ],
          responses: {
            "200": jsonObjectResponse("Collection record"),
            "401": unauthorizedResponse,
            "404": errorResponse,
          },
        },
        post: {
          tags: ["Collections"],
          summary: "Update a record with optimistic concurrency",
          security: taskPersonalOrAdminSecurity,
          parameters: [
            { $ref: "#/components/parameters/collectionId" },
            { $ref: "#/components/parameters/recordId" },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdateCollectionRecordRequest",
                },
              },
            },
          },
          responses: {
            "200": jsonObjectResponse("Updated record"),
            "400": errorResponse,
            "401": unauthorizedResponse,
            "404": errorResponse,
            "409": errorResponse,
          },
        },
      },
      "/api/collections/{id}/records/batch": {
        post: {
          tags: ["Collections"],
          summary: "Atomically create or update collection records",
          security: taskPersonalOrAdminSecurity,
          parameters: [{ $ref: "#/components/parameters/collectionId" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["operations"],
                  properties: {
                    operations: {
                      type: "array",
                      minItems: 1,
                      maxItems: 100,
                      items: {
                        $ref: "#/components/schemas/CollectionRecordBatchOperation",
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": jsonObjectResponse("Applied record batch"),
            "400": errorResponse,
            "401": unauthorizedResponse,
            "404": errorResponse,
            "409": errorResponse,
          },
        },
      },
      "/api/collections/{id}/views": {
        post: {
          tags: ["Collections"],
          summary: "Create or update a saved table view",
          security: taskPersonalOrAdminSecurity,
          parameters: [{ $ref: "#/components/parameters/collectionId" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CollectionViewRequest" },
              },
            },
          },
          responses: {
            "200": jsonObjectResponse("Saved collection view"),
            "400": errorResponse,
            "401": unauthorizedResponse,
          },
        },
      },
      "/api/content/search": {
        get: {
          tags: ["Content"],
          summary: "Search only documents and records the caller may view",
          security: optionalTaskReadSecurity,
          parameters: [
            {
              name: "q",
              in: "query",
              required: true,
              schema: { type: "string", minLength: 2, maxLength: 500 },
            },
            { $ref: "#/components/parameters/limit" },
          ],
          responses: {
            "200": jsonObjectResponse("Authorized search results"),
            "400": errorResponse,
            "401": unauthorizedResponse,
          },
        },
      },
      "/api/content/export": {
        get: {
          tags: ["Content"],
          summary: "Export an authorized document or collection page",
          security: optionalTaskReadSecurity,
          parameters: [
            {
              name: "resourceType",
              in: "query",
              required: true,
              schema: { enum: ["document", "collection"] },
            },
            {
              name: "resourceId",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
            { $ref: "#/components/parameters/cursor" },
            { $ref: "#/components/parameters/limit" },
          ],
          responses: {
            "200": jsonObjectResponse("Authorized content export"),
            "400": errorResponse,
            "401": unauthorizedResponse,
            "404": errorResponse,
          },
        },
      },
      "/api/content/access": {
        get: {
          tags: ["Content"],
          summary: "List direct grants for content the caller owns",
          security: taskPersonalOrAdminSecurity,
          parameters: [
            { $ref: "#/components/parameters/resourceType" },
            { $ref: "#/components/parameters/resourceId" },
          ],
          responses: {
            "200": jsonObjectResponse("Content access grants"),
            "401": unauthorizedResponse,
            "404": errorResponse,
          },
        },
        post: {
          tags: ["Content"],
          summary: "Grant content access to a user or organization",
          security: taskPersonalOrAdminSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ContentGrantRequest" },
              },
            },
          },
          responses: {
            "200": jsonObjectResponse("Updated content grant"),
            "400": errorResponse,
            "401": unauthorizedResponse,
            "404": errorResponse,
          },
        },
        delete: {
          tags: ["Content"],
          summary: "Revoke a direct content access grant",
          security: taskPersonalOrAdminSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ContentRevokeRequest" },
              },
            },
          },
          responses: {
            "200": jsonObjectResponse("Revoked content grant"),
            "401": unauthorizedResponse,
            "404": errorResponse,
          },
        },
      },
      "/api/content/attachments": {
        get: {
          tags: ["Content"],
          summary: "List authorized private files",
          security: optionalTaskReadSecurity,
          parameters: [
            {
              name: "documentId",
              in: "query",
              schema: { type: "string" },
            },
            {
              name: "collectionRecordId",
              in: "query",
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": jsonObjectResponse("Private file metadata"),
            "401": unauthorizedResponse,
            "404": errorResponse,
          },
        },
        post: {
          tags: ["Content"],
          summary: "Prepare an authorized private file upload",
          security: taskPersonalOrAdminSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateContentAttachmentRequest",
                },
              },
            },
          },
          responses: {
            "201": jsonObjectResponse("Short-lived private upload URL"),
            "400": errorResponse,
            "401": unauthorizedResponse,
            "404": errorResponse,
          },
        },
      },
      "/api/content/attachments/{attachmentId}": {
        get: {
          tags: ["Content"],
          summary: "Get a short-lived authorized private download URL",
          security: optionalTaskReadSecurity,
          parameters: [{ $ref: "#/components/parameters/attachmentId" }],
          responses: {
            "200": jsonObjectResponse("Short-lived private download URL"),
            "401": unauthorizedResponse,
            "404": errorResponse,
          },
        },
        delete: {
          tags: ["Content"],
          summary: "Delete an authorized private file",
          security: taskPersonalOrAdminSecurity,
          parameters: [{ $ref: "#/components/parameters/attachmentId" }],
          responses: {
            "200": jsonObjectResponse("Deleted private file"),
            "401": unauthorizedResponse,
            "404": errorResponse,
          },
        },
      },
      "/api/content/attachments/{attachmentId}/complete": {
        post: {
          tags: ["Content"],
          summary: "Verify and finish a private file upload",
          security: taskPersonalOrAdminSecurity,
          parameters: [{ $ref: "#/components/parameters/attachmentId" }],
          responses: {
            "200": jsonObjectResponse("Completed private file upload"),
            "400": errorResponse,
            "401": unauthorizedResponse,
            "404": errorResponse,
          },
        },
      },
      "/api/content/imports/notion": {
        post: {
          tags: ["Content"],
          summary: "Dry-run or apply an idempotent Notion export bundle",
          security: taskPersonalOrAdminSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NotionImportRequest" },
              },
            },
          },
          responses: {
            "200": jsonObjectResponse("Per-item import review"),
            "400": errorResponse,
            "401": unauthorizedResponse,
          },
        },
      },
      "/api/referral-invitations": {
        get: {
          tags: ["Referrals"],
          summary: "List the authenticated user's referral invitations",
          security: [{ OptimitronOAuth: ["tasks:personal"] }],
          responses: {
            "200": {
              description: "Referral invitations",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
            "401": unauthorizedResponse,
          },
        },
        post: {
          tags: ["Referrals"],
          summary: "Create a referral invitation and optional task link",
          security: [{ OptimitronOAuth: ["tasks:personal"] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateReferralInvitationRequest",
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Created referral invitation",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
            "400": errorResponse,
            "401": unauthorizedResponse,
            "429": errorResponse,
          },
        },
        patch: {
          tags: ["Referrals"],
          summary: "Update referral invitation status or send the message",
          security: [{ OptimitronOAuth: ["tasks:personal"] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdateReferralInvitationRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Updated referral invitation",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
            "400": errorResponse,
            "401": unauthorizedResponse,
            "404": errorResponse,
          },
        },
      },
      "/api/referendums/{slug}/vote": {
        post: {
          tags: ["Referendums"],
          summary: "Cast or update the authenticated user's referendum vote",
          security: [{ OptimitronOAuth: ["earthdata:write"] }],
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReferendumVoteRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Vote result",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
            "400": errorResponse,
            "401": unauthorizedResponse,
            "404": errorResponse,
          },
        },
      },
      "/api/profile": {
        post: {
          tags: ["Profile"],
          summary: "Save the authenticated user's profile snapshot",
          security: [{ OptimitronOAuth: ["tasks:personal"] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { type: "object", additionalProperties: true },
              },
            },
          },
          responses: {
            "200": {
              description: "Saved profile",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
            "400": errorResponse,
            "401": unauthorizedResponse,
          },
        },
      },
      "/api/people/search": {
        get: {
          tags: ["People"],
          summary: "Search people the authenticated user may assign or edit",
          security: tasksPersonalOrEarthdataWriteSecurity,
          parameters: [
            {
              name: "q",
              in: "query",
              required: true,
              schema: { type: "string", minLength: 2 },
            },
          ],
          responses: {
            "200": {
              description: "People search results",
              content: {
                "application/json": {
                  schema: successEnvelope({
                    type: "array",
                    items: { $ref: "#/components/schemas/PersonSearchResult" },
                  }),
                },
              },
            },
            "401": unauthorizedResponse,
          },
        },
      },
      "/api/organizations": {
        get: {
          tags: ["Organizations"],
          summary: "Search approved organizations",
          parameters: [
            {
              name: "q",
              in: "query",
              required: true,
              schema: { type: "string", minLength: 2 },
            },
          ],
          responses: {
            "200": {
              description: "Organization search results",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/OrganizationSummary" },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Organizations"],
          summary:
            "Create an approved organization owned by the authenticated user",
          security: earthdataWriteOrTasksAdminSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateOrganizationRequest",
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Created organization",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
            "400": errorResponse,
            "401": unauthorizedResponse,
          },
        },
      },
      "/api/organizations/{id}": {
        get: {
          tags: ["Organizations"],
          summary: "Get an organization managed by the authenticated user",
          security: earthdataWriteOrTasksAdminSecurity,
          parameters: [{ $ref: "#/components/parameters/organizationId" }],
          responses: {
            "200": {
              description: "Organization detail",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
            "401": unauthorizedResponse,
            "403": errorResponse,
            "404": errorResponse,
          },
        },
        patch: {
          tags: ["Organizations"],
          summary: "Update an organization managed by the authenticated user",
          security: earthdataWriteOrTasksAdminSecurity,
          parameters: [{ $ref: "#/components/parameters/organizationId" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdateOrganizationRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Updated organization",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
            "400": errorResponse,
            "401": unauthorizedResponse,
            "403": errorResponse,
          },
        },
      },
    },
    components: {
      securitySchemes: {
        OptimitronOAuth: {
          type: "oauth2",
          flows: {
            authorizationCode: {
              authorizationUrl: `${baseUrl}/api/mcp/oauth/authorize`,
              tokenUrl: `${baseUrl}/api/mcp/oauth/token`,
              refreshUrl: `${baseUrl}/api/mcp/oauth/token`,
              scopes: oauthScopes(),
            },
          },
        },
      },
      parameters: {
        cursor: {
          name: "cursor",
          in: "query",
          schema: { type: "string" },
        },
        limit: {
          name: "limit",
          in: "query",
          schema: { type: "integer", minimum: 1, maximum: 500 },
        },
        idempotencyKey: {
          name: "Idempotency-Key",
          in: "header",
          description:
            "Preferred idempotency key location. The JSON body may carry the same field.",
          schema: { type: "string", minLength: 1, maxLength: 500 },
        },
        resourceType: {
          name: "resourceType",
          in: "query",
          required: true,
          schema: { enum: ["document", "collection"] },
        },
        resourceId: {
          name: "resourceId",
          in: "query",
          required: true,
          schema: { type: "string" },
        },
        taskId: {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        organizationId: {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        documentId: {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        collectionId: {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        recordId: {
          name: "recordId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        attachmentId: {
          name: "attachmentId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        client_id: {
          name: "client_id",
          in: "query",
          required: true,
          schema: { type: "string" },
        },
        redirect_uri: {
          name: "redirect_uri",
          in: "query",
          required: true,
          schema: { type: "string", format: "uri" },
        },
        response_type: {
          name: "response_type",
          in: "query",
          required: true,
          schema: { type: "string", const: "code" },
        },
        scope: {
          name: "scope",
          in: "query",
          schema: { type: "string" },
        },
        state: {
          name: "state",
          in: "query",
          schema: { type: "string" },
        },
        code_challenge: {
          name: "code_challenge",
          in: "query",
          required: true,
          schema: { type: "string" },
        },
        code_challenge_method: {
          name: "code_challenge_method",
          in: "query",
          schema: { type: "string", const: "S256" },
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: { error: { type: "string" } },
          required: ["error"],
        },
        ContentResource: {
          type: "object",
          additionalProperties: false,
          required: ["type", "id"],
          properties: {
            type: { enum: ["document", "collection"] },
            id: { type: "string", minLength: 1 },
          },
        },
        ContentGrantee: {
          oneOf: [
            {
              type: "object",
              additionalProperties: false,
              required: ["type", "id"],
              properties: {
                type: { const: "user" },
                id: { type: "string", minLength: 1 },
              },
            },
            {
              type: "object",
              additionalProperties: false,
              required: ["type", "email"],
              properties: {
                type: { const: "user" },
                email: { type: "string", format: "email" },
              },
            },
            {
              type: "object",
              additionalProperties: false,
              required: ["type", "id"],
              properties: {
                type: { const: "organization" },
                id: { type: "string", minLength: 1 },
              },
            },
          ],
        },
        ContentGrantRequest: {
          type: "object",
          additionalProperties: false,
          required: ["accessLevel", "grantee", "resource"],
          properties: {
            accessLevel: {
              enum: ["VIEW", "COMMENT", "EDIT_CONTENT", "EDIT", "FULL_ACCESS"],
            },
            grantee: { $ref: "#/components/schemas/ContentGrantee" },
            resource: { $ref: "#/components/schemas/ContentResource" },
          },
        },
        ContentRevokeRequest: {
          type: "object",
          additionalProperties: false,
          required: ["grantee", "resource"],
          properties: {
            grantee: { $ref: "#/components/schemas/ContentGrantee" },
            resource: { $ref: "#/components/schemas/ContentResource" },
          },
        },
        CreateDocumentRequest: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string", minLength: 1, maxLength: 300 },
            body: { type: "string", maxLength: 500000 },
            visibility: { enum: ["PUBLIC", "PRIVATE"] },
            jurisdictionId: { type: ["string", "null"] },
            organizationId: { type: ["string", "null"] },
            parentDocumentId: { type: ["string", "null"] },
            taskId: { type: ["string", "null"] },
            idempotencyKey: { type: ["string", "null"] },
          },
        },
        UpdateDocumentRequest: {
          type: "object",
          required: ["expectedVersion"],
          properties: {
            expectedVersion: { type: "integer", minimum: 1 },
            title: { type: "string", minLength: 1, maxLength: 300 },
            body: { type: "string", maxLength: 500000 },
            visibility: { enum: ["PUBLIC", "PRIVATE"] },
            organizationId: { type: ["string", "null"] },
            parentDocumentId: { type: ["string", "null"] },
            taskId: { type: ["string", "null"] },
          },
        },
        CollectionField: openApiSchema(collectionFieldInputSchema),
        CollectionRelation: openApiSchema(collectionRelationInputSchema),
        CollectionFilter: openApiSchema(collectionFilterSchema),
        CollectionSort: openApiSchema(collectionSortSchema),
        CreateCollectionRequest: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 200 },
            description: { type: ["string", "null"], maxLength: 20000 },
            fields: {
              type: "array",
              maxItems: 200,
              items: { $ref: "#/components/schemas/CollectionField" },
            },
            visibility: { enum: ["PUBLIC", "PRIVATE"] },
            jurisdictionId: { type: ["string", "null"] },
            organizationId: { type: ["string", "null"] },
            idempotencyKey: { type: ["string", "null"] },
          },
        },
        UpdateCollectionRequest: {
          type: "object",
          required: ["expectedVersion"],
          properties: {
            expectedVersion: { type: "integer", minimum: 1 },
            name: { type: ["string", "null"], maxLength: 200 },
            description: { type: ["string", "null"], maxLength: 20000 },
            fields: {
              type: "array",
              maxItems: 200,
              items: { $ref: "#/components/schemas/CollectionField" },
            },
            visibility: { enum: ["PUBLIC", "PRIVATE", null] },
            organizationId: { type: ["string", "null"] },
          },
        },
        CreateCollectionRecordRequest: {
          type: "object",
          required: ["values"],
          properties: {
            values: { type: "object", additionalProperties: true },
            relations: {
              type: "array",
              maxItems: 2000,
              items: { $ref: "#/components/schemas/CollectionRelation" },
            },
            documentId: { type: ["string", "null"] },
            organizationId: { type: ["string", "null"] },
            personId: { type: ["string", "null"] },
            taskId: { type: ["string", "null"] },
            idempotencyKey: { type: ["string", "null"] },
          },
        },
        UpdateCollectionRecordRequest: {
          type: "object",
          required: ["expectedVersion"],
          properties: {
            expectedVersion: { type: "integer", minimum: 1 },
            values: { type: "object", additionalProperties: true },
            relations: {
              type: "array",
              maxItems: 2000,
              items: { $ref: "#/components/schemas/CollectionRelation" },
            },
            documentId: { type: ["string", "null"] },
            organizationId: { type: ["string", "null"] },
            personId: { type: ["string", "null"] },
            taskId: { type: ["string", "null"] },
          },
        },
        CollectionRecordBatchOperation: openApiSchema(
          collectionRecordBatchOperationSchema,
        ),
        CollectionViewRequest: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 200 },
            viewId: { type: "string" },
            expectedVersion: { type: "integer", minimum: 1 },
            isDefault: { type: "boolean" },
            filters: {
              type: "array",
              items: { $ref: "#/components/schemas/CollectionFilter" },
            },
            sorts: {
              type: "array",
              items: { $ref: "#/components/schemas/CollectionSort" },
            },
            visibleFieldIds: { type: "array", items: { type: "string" } },
          },
        },
        CreateContentAttachmentRequest: {
          type: "object",
          additionalProperties: false,
          required: ["checksumSha256", "fileName", "sizeBytes"],
          properties: {
            checksumSha256: {
              type: "string",
              pattern: "^[A-Za-z0-9+/]{43}=$",
            },
            collectionRecordId: { type: ["string", "null"] },
            documentId: { type: ["string", "null"] },
            contentType: { type: "string", maxLength: 160 },
            fileName: { type: "string", minLength: 1, maxLength: 512 },
            sizeBytes: { type: "integer", minimum: 1 },
          },
        },
        NotionImportBundle: openApiSchema(notionImportBundleSchema),
        NotionImportRequest: {
          type: "object",
          additionalProperties: false,
          required: ["bundle"],
          properties: {
            dryRun: { type: "boolean", default: true },
            bundle: { $ref: "#/components/schemas/NotionImportBundle" },
          },
        },
        OAuthClientRegistration: {
          type: "object",
          required: ["redirect_uris"],
          properties: {
            client_name: { type: "string" },
            redirect_uris: {
              type: "array",
              minItems: 1,
              items: { type: "string", format: "uri" },
            },
            grant_types: {
              type: "array",
              items: {
                enum: ["authorization_code", "refresh_token"],
              },
            },
            scope: { type: "string" },
            client_uri: { type: "string", format: "uri" },
          },
        },
        OAuthClient: {
          type: "object",
          properties: {
            client_id: { type: "string" },
            client_name: { type: "string" },
            redirect_uris: {
              type: "array",
              items: { type: "string", format: "uri" },
            },
            grant_types: { type: "array", items: { type: "string" } },
            scope: { type: "string" },
            client_uri: { type: "string", format: "uri" },
            client_id_issued_at: { type: "integer" },
          },
          required: ["client_id", "redirect_uris", "grant_types"],
        },
        OAuthTokenRequest: {
          oneOf: [
            {
              type: "object",
              properties: {
                grant_type: { const: "authorization_code" },
                code: { type: "string" },
                client_id: { type: "string" },
                redirect_uri: { type: "string", format: "uri" },
                code_verifier: { type: "string" },
              },
              required: [
                "grant_type",
                "code",
                "client_id",
                "redirect_uri",
                "code_verifier",
              ],
            },
            {
              type: "object",
              properties: {
                grant_type: { const: "refresh_token" },
                client_id: { type: "string" },
                refresh_token: { type: "string" },
              },
              required: ["grant_type", "client_id", "refresh_token"],
            },
          ],
        },
        OAuthTokenResponse: {
          type: "object",
          properties: {
            access_token: { type: "string" },
            token_type: { type: "string", const: "Bearer" },
            expires_in: { type: "integer" },
            refresh_token: { type: "string" },
            scope: { type: "string" },
          },
          required: ["access_token", "token_type", "expires_in", "scope"],
        },
        Task: taskSchema,
        CreateTaskRequest: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            isPublic: { type: "boolean" },
            status: { type: "string" },
            category: { type: "string" },
            dueAt: { type: "string", format: "date-time" },
            estimatedEffortHours: { type: "number" },
            assigneePersonId: { type: "string" },
            assigneePersonIdentifier: { type: "string" },
            assigneeOrganizationId: { type: "string" },
            assigneePersonInvite: {
              type: "object",
              required: ["email", "firstName", "lastName"],
              properties: {
                email: { type: "string", format: "email" },
                firstName: { type: "string" },
                lastName: { type: "string" },
                currentAffiliation: { type: "string" },
              },
            },
            parentTaskId: { type: "string" },
            contactUrl: { type: "string" },
            contactLabel: { type: "string" },
            contactTemplate: { type: "string" },
          },
        },
        UpdateTaskRequest: {
          type: "object",
          minProperties: 1,
          properties: {
            title: { type: "string" },
            description: { type: ["string", "null"] },
            status: { type: "string" },
            dueAt: { type: ["string", "null"], format: "date-time" },
            estimatedEffortHours: { type: ["number", "null"] },
            isPublic: { type: "boolean" },
            primaryEndpoint: {
              type: "object",
              properties: {
                label: { type: "string" },
                url: { type: "string" },
                email: { type: "string", format: "email" },
                instructions: { type: "string" },
              },
            },
          },
        },
        CreateReferralInvitationRequest: {
          type: "object",
          required: ["recipientName"],
          properties: {
            recipientName: { type: "string", maxLength: 160 },
            recipientEmail: { type: "string", format: "email" },
            contactMethod: { type: "string" },
            messageFormat: { type: "string" },
            messageText: { type: "string", maxLength: 10000 },
            referendumSlug: { type: "string" },
            taskId: { type: "string" },
            shareAttemptId: { type: "string" },
            originUrl: { type: "string", maxLength: 2048 },
          },
        },
        UpdateReferralInvitationRequest: {
          type: "object",
          required: ["id", "action"],
          properties: {
            id: { type: "string" },
            action: {
              enum: [
                "markCopied",
                "markManualContacted",
                "decline",
                "cancel",
                "sendMessage",
              ],
            },
            messageText: { type: "string" },
            shareChannel: { type: "string" },
            shareAttemptId: { type: "string" },
            wasEdited: { type: "boolean" },
          },
        },
        ReferendumVoteRequest: {
          type: "object",
          required: ["answer"],
          properties: {
            answer: { enum: ["YES", "NO", "ABSTAIN"] },
            displayName: { type: "string" },
            ref: { type: "string" },
            makePublic: { type: "boolean" },
            inviteToken: { type: "string" },
            organizationSlug: { type: "string" },
            originUrl: { type: "string" },
          },
        },
        PersonSearchResult: {
          type: "object",
          properties: {
            id: { type: "string" },
            displayName: { type: "string" },
            handle: { type: ["string", "null"] },
            headline: { type: ["string", "null"] },
            affiliation: { type: ["string", "null"] },
            href: { type: "string" },
            image: { type: ["string", "null"] },
            isPublicFigure: { type: "boolean" },
          },
        },
        OrganizationSummary: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            slug: { type: "string" },
          },
        },
        CreateOrganizationRequest: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            type: { type: "string" },
            website: { type: "string" },
            description: { type: "string" },
            jurisdictionId: { type: "string" },
          },
        },
        UpdateOrganizationRequest: {
          type: "object",
          properties: {
            name: { type: "string" },
            website: { type: ["string", "null"] },
            description: { type: ["string", "null"] },
            donationUrl: { type: ["string", "null"] },
            squareLogoUrl: { type: ["string", "null"] },
            wordmarkLogoUrl: { type: ["string", "null"] },
            contactEmail: { type: ["string", "null"], format: "email" },
          },
        },
      },
    },
  } as const;
}
