import { describe, expect, it } from "vitest";
import { getToolCatalog, getToolDefinitions } from "../mcp-server";
import { MCP_SERVER_INSTRUCTIONS } from "../mcp-instructions";

describe("MCP tool catalog", () => {
  it("assigns every exposed tool an explicit scope entry", () => {
    // hasScope denies tools missing from TOOL_SCOPES, so a null here means a
    // registered tool no client can ever call — a registry error.
    const unmapped = getToolCatalog()
      .filter((tool) => tool.scopes === null)
      .map((tool) => tool.name);

    expect(unmapped).toEqual([]);
  });

  it("keeps catalog names unique and within the registered definitions", () => {
    const catalogNames = getToolCatalog().map((tool) => tool.name);
    const registered = new Set(getToolDefinitions().map((tool) => tool.name));

    expect(new Set(catalogNames).size).toBe(catalogNames.length);
    for (const name of catalogNames) {
      expect(registered.has(name)).toBe(true);
    }
  });

  it("registers the complete governance review transport", () => {
    const registered = new Set(getToolDefinitions().map((tool) => tool.name));

    for (const name of [
      "createDocumentProposal",
      "applyDocumentProposal",
      "getDocumentReview",
      "requestDocumentReview",
      "submitDocumentReview",
      "decideDocumentRevision",
    ]) {
      expect(registered.has(name)).toBe(true);
    }
  });

  it("requires evidence for both task completion writes", () => {
    const definitions = getToolDefinitions();
    const completeTask = definitions.find(
      (tool) => tool.name === "completeTask",
    );
    const completeClaim = definitions.find(
      (tool) => tool.name === "completeTaskClaim",
    );

    expect(
      completeTask && "required" in completeTask.inputSchema
        ? completeTask.inputSchema.required
        : undefined,
    ).toEqual(["taskId", "completionEvidence"]);
    expect(
      completeClaim && "required" in completeClaim.inputSchema
        ? completeClaim.inputSchema.required
        : undefined,
    ).toEqual(["taskId", "completionEvidence"]);
  });

  it("only references real tools in the server instructions", () => {
    // The docs-drift class this prevents: MCP_SERVER.md once documented a
    // phantom updateMilestone tool. Instructions ship to every client on
    // initialize, so every backticked-or-bare tool mention must exist.
    const registered = new Set(getToolDefinitions().map((tool) => tool.name));
    const mentioned =
      MCP_SERVER_INSTRUCTIONS.match(/\bget[A-Z]\w+|\b[a-z]+[A-Z]\w+/g) ?? [];
    const phantom = [...new Set(mentioned)].filter(
      (word) =>
        /^(get|list|create|update|propose|post|claim|complete|search|record|upsert|respond|fire|evaluate)[A-Z]/.test(
          word,
        ) && !registered.has(word),
    );

    expect(phantom).toEqual([]);
  });

  it("tells coding agents how to target the canonical development branch", () => {
    expect(MCP_SERVER_INSTRUCTIONS).toContain("parentTaskKey='optimitron:dev'");
  });

  it("requires the full agent coordination lifecycle before editing", () => {
    for (const instruction of [
      "call getTask",
      "Call acquireLease before editing",
      "call startTaskExecution",
      "Call heartbeatLease before expiry",
      "postTaskComment",
      "Call releaseLease",
      "NO_WORKTREE",
      "SHARED_ONE_PR",
      "ISOLATED_WORKTREE",
    ]) {
      expect(MCP_SERVER_INSTRUCTIONS).toContain(instruction);
    }
  });

  it("exposes structured run context on startTaskExecution", () => {
    const start = getToolDefinitions().find(
      (tool) => tool.name === "startTaskExecution",
    );
    expect(start?.inputSchema).toMatchObject({
      properties: {
        runContext: {
          properties: {
            agentRunId: { type: "string" },
            baseCommit: { type: "string" },
            branch: { type: "string" },
            isolationMode: {
              enum: ["NO_WORKTREE", "SHARED_ONE_PR", "ISOLATED_WORKTREE"],
            },
            ownedFileGlobs: { type: "array" },
            worktreePath: { type: "string" },
          },
          required: ["isolationMode"],
        },
      },
    });
  });
});
