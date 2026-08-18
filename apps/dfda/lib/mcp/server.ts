/**
 * dFDA tracking MCP server: the personal health-tracking tool family from
 * @optimitron/tracking, served under the dFDA brand. Same database and same
 * tool implementations as optimitron.com's server; only the mount differs.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import type { McpScope } from "@optimitron/db/enums";
import {
  handleTrackingToolCall,
  isTrackingToolName,
  TRACKING_TOOL_DEFINITIONS,
  TRACKING_TOOL_SCOPES,
  type TrackingToolResponse,
} from "@optimitron/tracking";
import { randomUUID } from "crypto";

// Side effect: points the tracking engine at this app's Prisma singleton.
import "@/lib/tracking-provider";

import { CANONICAL_ISSUER, getIssuerUrl } from "./auth";

const SERVER_INSTRUCTIONS = [
  "dFDA personal tracking server. Record measurements (doses, foods, symptoms, moods, sleep, labs, vitals), manage tracking reminders, and answer reminder notifications.",
  "All tools operate on the signed-in user's own data and require the tasks:personal scope.",
  `OAuth sign-in runs on the canonical authorization server (${CANONICAL_ISSUER} in production).`,
].join(" ");

function hasScope(grantedScopes: McpScope[], toolName: string): boolean {
  if (!isTrackingToolName(toolName)) return false;
  const required = TRACKING_TOOL_SCOPES[toolName];
  if (required.length === 0) return true;
  return required.some((scope) => grantedScopes.includes(scope));
}

// Mirrors toolError in apps/optimitron/src/lib/mcp-server.ts: errors surface as
// results (exposeAsResult) so streaming clients render them instead of
// dropping the call.
function toolError(
  message: string,
  options: { code?: string; details?: Record<string, unknown> } = {},
): TrackingToolResponse {
  const payload = {
    ok: false,
    errorCode: options.code ?? "INVALID_ARGUMENT",
    message,
    requestId: randomUUID(),
    retryable: false,
    ...(options.details ? { details: options.details } : {}),
  };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload) }],
    structuredContent: payload,
  };
}

function authRequired(toolName: string, reason: string) {
  const issuer = getIssuerUrl();
  return toolError(
    `Tool "${toolName}" needs an authenticated user. ${reason}`,
    {
      code: "AUTHENTICATION_REQUIRED",
      details: {
        tool: toolName,
        remediation: {
          remote_http: {
            description:
              "Complete the OAuth 2.1 + PKCE flow advertised by this server's well-known metadata, then retry with the resulting Bearer token.",
            authorizationServerMetadata: `${issuer}/.well-known/oauth-authorization-server`,
            authorizeEndpoint: `${issuer}/api/mcp/oauth/authorize`,
            tokenEndpoint: `${issuer}/api/mcp/oauth/token`,
            registrationEndpoint: `${issuer}/api/mcp/oauth/register`,
          },
        },
      },
    },
  );
}

export function createDfdaMcpServer(userId: string, scopes: McpScope[]) {
  const server = new Server(
    { name: "dfda-tracking", version: "1.0.0" },
    {
      capabilities: { tools: {} },
      instructions: SERVER_INSTRUCTIONS,
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TRACKING_TOOL_DEFINITIONS.filter((tool) =>
      hasScope(scopes, tool.name),
    ),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    let response: TrackingToolResponse;
    if (!isTrackingToolName(name)) {
      response = toolError(`Unknown tool "${name}".`, {
        code: "UNKNOWN_TOOL",
      });
    } else if (!hasScope(scopes, name)) {
      response = toolError(
        `Insufficient scope for tool "${name}". Required: ${TRACKING_TOOL_SCOPES[name].join(", ")}`,
      );
    } else {
      try {
        response = await handleTrackingToolCall({
          args: (args ?? {}) as Record<string, unknown>,
          authRequired,
          name,
          userId,
        });
      } catch (error) {
        // Same wire behavior as apps/optimitron/src/lib/mcp-server.ts: the
        // message is returned as a result payload, the full error goes to
        // server logs only.
        console.error(`[dfda-mcp] tool "${name}" threw:`, error);
        response = toolError(
          error instanceof Error ? error.message : "Tool execution failed.",
        );
      }
    }
    return response as CallToolResult;
  });

  return server;
}
