import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { Prisma } from "@optimitron/db";
import { McpScope } from "@optimitron/db/enums";
import type { CourtMcpAuthContext } from "@optimitron/mcp/auth";
import { runAuditedMcpTool } from "@optimitron/mcp/audit";
import { mcpError, mcpResult } from "@optimitron/mcp/results";
import { ZodError } from "zod";
import * as court from "@/lib/court-data.server";
import { prisma } from "@/lib/prisma";
import {
  COURT_TOOL_DEFINITIONS,
  isCourtToolName,
  type CourtToolName,
} from "./tools";

export async function dispatchCourtTool(
  name: CourtToolName,
  args: Record<string, unknown>,
  actor: court.CourtActor,
) {
  switch (name) {
    case "upsertCourtCase":
      return { case: await court.upsertCourtCase(args, actor) };
    case "addCourtCaseParty":
      return { party: await court.addCourtCaseParty(args, actor) };
    case "addCourtCaseClaim":
      return { claim: await court.addCourtCaseClaim(args, actor) };
    case "addCourtCaseHarm":
      return { harm: await court.addCourtCaseHarm(args, actor) };
    case "addCourtCaseEvidence":
      return { evidence: await court.addCourtCaseEvidence(args, actor) };
    case "addCourtCaseRemedy":
      return { remedy: await court.addCourtCaseRemedy(args, actor) };
    case "getCourtCase":
      return { case: await court.getCourtCase(args, actor) };
    case "openCourtCaseJuryVote":
      return court.openCourtCaseJuryVote(args, actor);
  }
}

export function createCourtMcpServer(context: CourtMcpAuthContext) {
  const server = new Server(
    { name: "court-of-humanity", version: "1.0.0" },
    {
      capabilities: { tools: {} },
      instructions:
        "Court of Humanity case tools. Create and edit your own cases, attach public non-sensitive evidence, and open jury votes. Public-case moderation requires administrator identity and earthdata:admin. Private plaintiff records remain owner-only. Generic people, sources, and task tools remain on Optimitron. Register plaintiffs at https://courtofhumanity.org/plaintiffs. OAuth authorization is issued by Optimitron specifically for this Court server.",
    },
  );
  const canUseTools = context.scopes.includes(McpScope.EARTHDATA_WRITE);
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: canUseTools ? [...COURT_TOOL_DEFINITIONS] : [],
  }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: input } = request.params;
    if (!isCourtToolName(name))
      return mcpError(`Unknown tool "${name}".`, "UNKNOWN_TOOL");
    if (!canUseTools)
      return mcpError(
        "Court tools require earthdata:write.",
        "INSUFFICIENT_SCOPE",
      );
    const args = input ?? {};
    const execute = () => dispatchCourtTool(name, args, context);
    try {
      if (name === "getCourtCase") return mcpResult(await execute());
      return await runAuditedMcpTool(
        name,
        args,
        {
          userId: context.userId,
          clientId: context.clientId,
          oauthGrantId: context.grantId,
        },
        execute,
        {
          writeAudit: (data) =>
            prisma.mcpToolCallAudit.create({
              data: {
                ...data,
                inputSummaryJson:
                  data.inputSummaryJson as Prisma.InputJsonValue,
                outputSummaryJson: data.outputSummaryJson as
                  | Prisma.InputJsonValue
                  | undefined,
              },
            }),
          onAuditFailure: () => console.error("[court-mcp] audit write failed"),
        },
      );
    } catch (error) {
      if (error instanceof court.CourtAccessError)
        return mcpError(error.message, error.code);
      if (error instanceof ZodError)
        return mcpError("Invalid tool arguments.", "INVALID_ARGUMENT", {
          issues: error.issues.map(({ path, message }) => ({ path, message })),
        });
      // Do not expose database error text, connection details, or private records.
      console.error("[court-mcp] operation failed", {
        tool: name,
        errorType: error instanceof Error ? error.name : "unknown",
      });
      return mcpError(
        "Court operation failed. Check the case and referenced records, then retry.",
        "OPERATION_FAILED",
      );
    }
  });
  return server;
}
