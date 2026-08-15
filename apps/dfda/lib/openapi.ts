/**
 * OpenAPI 3.1.0 document for the dFDA REST v1 tracking API.
 *
 * Request-body schemas reuse the MCP tool inputSchemas from
 * @optimitron/tracking verbatim where an endpoint maps 1:1 to a tool, so
 * the REST and MCP surfaces cannot drift apart. OAuth runs on the
 * canonical authorization server (optimitron.com); dfda.earth only
 * verifies tokens.
 */
import { TRACKING_TOOL_DEFINITIONS } from "@optimitron/tracking";

import { getIssuerUrl } from "@/lib/mcp/auth";

type JsonSchema = Record<string, unknown>;

const toolInputSchemas = Object.fromEntries(
  TRACKING_TOOL_DEFINITIONS.map((tool) => [tool.name, tool.inputSchema] as const),
) as Record<string, JsonSchema>;

const TASKS_PERSONAL_SCOPE = "tasks:personal";

const security = [
  { OptimitronOAuth: [TASKS_PERSONAL_SCOPE] },
  { BearerAuth: [] },
] as const;

const errorSchema = {
  type: "object",
  required: ["error"],
  properties: {
    error: {
      type: "object",
      required: ["code", "message"],
      properties: {
        code: { type: "string" },
        message: { type: "string" },
      },
    },
  },
} as const;

const badRequestResponse = {
  description: "Invalid argument",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
    },
  },
} as const;

const unauthorizedResponse = {
  description:
    "Missing or invalid credentials. WWW-Authenticate points at the protected-resource metadata for OAuth discovery.",
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

const stringQueryParam = (name: string, description?: string) => ({
  name,
  in: "query",
  schema: { type: "string" },
  ...(description ? { description } : {}),
});

const booleanQueryParam = (name: string, description?: string) => ({
  name,
  in: "query",
  schema: { type: "boolean" },
  ...(description ? { description } : {}),
});

const limitParam = {
  name: "limit",
  in: "query",
  description: "Page size. Default 100, maximum 500.",
  schema: { type: "integer", minimum: 1, maximum: 500 },
} as const;

const cursorParam = {
  name: "cursor",
  in: "query",
  description:
    "nextCursor from the previous page. Repeat the same filters until nextCursor is null.",
  schema: { type: "string" },
} as const;

// PATCH /measurements/{id} takes measurementId from the path, so the body
// mirrors the updateMeasurement tool schema minus that field.
const updateMeasurementBody = {
  type: "object",
  required: ["value"],
  properties: {
    value: { type: "number" },
    originalValue: {
      type: "number",
      description:
        "Corrected value in the existing original unit. Required when originalUnitId differs from unitId; otherwise defaults to value.",
    },
    duration: {
      type: ["number", "null"],
      description: "Duration in seconds. Null clears it.",
    },
    note: { type: ["string", "null"] },
    sourceName: { type: ["string", "null"] },
    latitude: { type: ["number", "null"] },
    longitude: { type: ["number", "null"] },
  },
} as const;

const updateVariableSettingsBody = {
  type: "object",
  description:
    "Per-user overrides for one tracked variable. The canonical variable definition is never modified.",
  properties: {
    fillingType: {
      type: "string",
      enum: ["ZERO", "NONE", "INTERPOLATION", "VALUE"],
    },
    fillingValue: { type: ["number", "null"] },
    minimumAllowedValue: { type: ["number", "null"] },
    maximumAllowedValue: { type: ["number", "null"] },
    onsetDelay: {
      type: ["integer", "null"],
      description: "Personal onset-delay override in seconds.",
    },
    durationOfAction: {
      type: ["integer", "null"],
      description: "Personal duration-of-action override in seconds.",
    },
    unitId: { type: "string" },
    unitAbbreviation: {
      type: "string",
      description: "Short unit such as mg, IU, servings, count, or 1-5.",
    },
    unitName: {
      type: "string",
      description: "Full unit name; matched case-insensitively.",
    },
  },
} as const;

export function getDfdaOpenApiDocument(origin: string) {
  const baseUrl = origin.replace(/\/+$/u, "");
  // Same issuer the token verifier accepts in this environment
  // (verifyMcpAccessToken); a production URL here would hand local/preview
  // clients a token this deployment rejects.
  const issuer = getIssuerUrl();
  return {
    openapi: "3.1.0",
    info: {
      title: "dFDA Tracking API",
      version: "2026-08-14",
      description:
        "Personal health tracking over the shared dFDA database: measurements (doses, foods, symptoms, moods, sleep, labs, vitals), tracking reminders, reminder notifications, and per-user variable settings. Every endpoint operates on the authenticated user's own data.",
    },
    servers: [{ url: baseUrl }],
    tags: [
      { name: "Measurements" },
      { name: "Tracking Reminders" },
      { name: "Notifications" },
      { name: "Variables" },
    ],
    paths: {
      "/api/v1/measurements": {
        get: {
          tags: ["Measurements"],
          summary: "List the user's measurements, newest first",
          security,
          parameters: [
            stringQueryParam("globalVariableId"),
            stringQueryParam(
              "variableName",
              "Variable name, matched case-insensitively. An unknown variable is an error, not an empty result.",
            ),
            stringQueryParam(
              "startTimeAfter",
              "ISO date/time. Only measurements at or after this time.",
            ),
            stringQueryParam(
              "startTimeBefore",
              "ISO date/time. Only measurements at or before this time.",
            ),
            limitParam,
            cursorParam,
          ],
          responses: {
            "200": jsonObjectResponse(
              "measurements, nextCursor, and the filtered variable (when one was named)",
            ),
            "400": badRequestResponse,
            "401": unauthorizedResponse,
          },
        },
        post: {
          tags: ["Measurements"],
          summary: "Record a measurement",
          security,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: toolInputSchemas.recordMeasurement,
              },
            },
          },
          responses: {
            "201": jsonObjectResponse(
              "result: the recorded measurement with its variable and unit",
            ),
            "400": badRequestResponse,
            "401": unauthorizedResponse,
          },
        },
      },
      "/api/v1/measurements/{id}": {
        patch: {
          tags: ["Measurements"],
          summary: "Correct one of the user's measurements",
          security,
          parameters: [{ $ref: "#/components/parameters/measurementId" }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: updateMeasurementBody },
            },
          },
          responses: {
            "200": jsonObjectResponse("measurement: the corrected measurement"),
            "400": badRequestResponse,
            "401": unauthorizedResponse,
          },
        },
        delete: {
          tags: ["Measurements"],
          summary: "Soft-delete one of the user's measurements",
          security,
          parameters: [{ $ref: "#/components/parameters/measurementId" }],
          responses: {
            "200": jsonObjectResponse("measurement: the soft-deleted measurement"),
            "400": badRequestResponse,
            "401": unauthorizedResponse,
          },
        },
      },
      "/api/v1/tracking-reminders": {
        get: {
          tags: ["Tracking Reminders"],
          summary: "List the user's tracking reminders, active by default",
          security,
          parameters: [booleanQueryParam("includeInactive")],
          responses: {
            "200": jsonObjectResponse("reminders: the user's tracking reminders"),
            "400": badRequestResponse,
            "401": unauthorizedResponse,
          },
        },
        post: {
          tags: ["Tracking Reminders"],
          summary: "Create or edit a tracking reminder",
          security,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: toolInputSchemas.upsertTrackingReminder,
              },
            },
          },
          responses: {
            "200": jsonObjectResponse(
              "result: the created or updated reminder",
            ),
            "400": badRequestResponse,
            "401": unauthorizedResponse,
          },
        },
      },
      "/api/v1/tracking-reminders/{id}": {
        delete: {
          tags: ["Tracking Reminders"],
          summary: "Archive a tracking reminder",
          description:
            "Sets active to false. The reminder is archived, not hard-deleted, matching the MCP surface; past notifications and measurements stay intact.",
          security,
          parameters: [{ $ref: "#/components/parameters/trackingReminderId" }],
          responses: {
            "200": jsonObjectResponse("result: the archived reminder"),
            "400": badRequestResponse,
            "401": unauthorizedResponse,
          },
        },
      },
      "/api/v1/notifications": {
        get: {
          tags: ["Notifications"],
          summary:
            "List the user's reminder notification queue for a day or date range",
          security,
          parameters: [
            stringQueryParam(
              "dateKey",
              "One local date in YYYY-MM-DD. Defaults to today. Do not combine with startDateKey or endDateKey.",
            ),
            stringQueryParam(
              "startDateKey",
              "First local date in an inclusive range.",
            ),
            stringQueryParam(
              "endDateKey",
              "Last local date in an inclusive range. Ranges may include at most 31 days.",
            ),
            stringQueryParam(
              "status",
              "Return only this effective status: PENDING, SENT, TRACKED, SKIPPED, SNOOZED, or OVERDUE.",
            ),
            stringQueryParam(
              "trackingReminderId",
              "Return occurrences for only this reminder.",
            ),
            booleanQueryParam(
              "compact",
              "Return trackingReminderId as id, plus name, due, and status.",
            ),
            booleanQueryParam(
              "includeCompleted",
              "Include answered TRACKED or legacy SKIPPED occurrences.",
            ),
          ],
          responses: {
            "200": jsonObjectResponse(
              "notifications for the requested day or range, with the user's time zone",
            ),
            "400": badRequestResponse,
            "401": unauthorizedResponse,
          },
        },
      },
      "/api/v1/notifications/respond": {
        post: {
          tags: ["Notifications"],
          summary: "Answer reminder notifications",
          description:
            "With a top-level trackingReminderId the body answers one reminder; without it the body is a batch of defaultStatus and/or except entries.",
          security,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  // anyOf, not oneOf: the batch schema has no required
                  // properties, so a single-reminder payload matches both
                  // branches and oneOf would reject every valid single body.
                  anyOf: [
                    toolInputSchemas.respondToTrackingReminder,
                    toolInputSchemas.respondToTrackingReminderNotifications,
                  ],
                },
              },
            },
          },
          responses: {
            "200": jsonObjectResponse(
              "result for a single response; answered/failed/skipped counts for a batch",
            ),
            "400": badRequestResponse,
            "401": unauthorizedResponse,
          },
        },
      },
      "/api/v1/variables": {
        get: {
          tags: ["Variables"],
          summary: "List the user's tracked variables",
          security,
          parameters: [
            stringQueryParam(
              "query",
              "Case-insensitive substring filter on the variable name.",
            ),
            limitParam,
            cursorParam,
          ],
          responses: {
            "200": jsonObjectResponse("variables and nextCursor"),
            "400": badRequestResponse,
            "401": unauthorizedResponse,
          },
        },
      },
      "/api/v1/variables/{globalVariableId}": {
        patch: {
          tags: ["Variables"],
          summary: "Update per-user settings for one tracked variable",
          security,
          parameters: [{ $ref: "#/components/parameters/globalVariableId" }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: updateVariableSettingsBody },
            },
          },
          responses: {
            "200": jsonObjectResponse("variable: the updated per-user settings"),
            "400": badRequestResponse,
            "401": unauthorizedResponse,
          },
        },
      },
    },
    components: {
      securitySchemes: {
        OptimitronOAuth: {
          type: "oauth2",
          description:
            "OAuth 2.1 authorization code + PKCE on the canonical authorization server.",
          flows: {
            authorizationCode: {
              authorizationUrl: `${issuer}/api/mcp/oauth/authorize`,
              tokenUrl: `${issuer}/api/mcp/oauth/token`,
              refreshUrl: `${issuer}/api/mcp/oauth/token`,
              scopes: {
                [TASKS_PERSONAL_SCOPE]:
                  "Read and write the signed-in user's own tracking data",
              },
            },
          },
        },
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Access token minted by the optimitron.com OAuth server, sent as Authorization: Bearer <token>.",
        },
      },
      parameters: {
        measurementId: {
          name: "id",
          in: "path",
          required: true,
          description: "Measurement ID from GET /api/v1/measurements.",
          schema: { type: "string" },
        },
        trackingReminderId: {
          name: "id",
          in: "path",
          required: true,
          description:
            "Tracking reminder ID from GET /api/v1/tracking-reminders.",
          schema: { type: "string" },
        },
        globalVariableId: {
          name: "globalVariableId",
          in: "path",
          required: true,
          description: "Variable ID from GET /api/v1/variables.",
          schema: { type: "string" },
        },
      },
      schemas: {
        Error: errorSchema,
      },
    },
  };
}
