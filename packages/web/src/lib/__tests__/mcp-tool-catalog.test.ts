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
      "requestDocumentReview",
      "submitDocumentReview",
      "decideDocumentRevision",
    ]) {
      expect(registered.has(name)).toBe(true);
    }
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
});
