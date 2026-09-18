import { describe, expect, it } from "vitest";
import { runAuditedMcpTool, writeMcpToolAudit, type McpToolAuditData } from "../../../../../packages/mcp/src/audit";
import { mcpResult } from "../../../../../packages/mcp/src/results";

const completedAt = new Date("2026-01-01T00:00:00Z");

function captureAudit() {
  const rows: McpToolAuditData[] = [];
  return {
    rows,
    options: {
      now: () => completedAt,
      writeAudit: async (data: McpToolAuditData) => { rows.push(data); return { id: "audit-1" }; },
    },
  };
}

describe("shared MCP auditing", () => {
  it("retains attribution and resource references without private input or output", async () => {
    const { rows, options } = captureAudit();
    const output = { id: "case-1", evidence: [{ id: "evidence-1", notes: "private output" }] };
    const response = await runAuditedMcpTool("addCourtCaseEvidence", {
      notes: "private input", sourceUrl: "https://private.invalid/document", agentId: "spoofed-agent", runId: "spoofed-run",
    }, { agentId: "agent-1", runId: "run-1", clientId: "client-1", oauthGrantId: "grant-1", userId: "user-1" }, async () => output, options);
    expect(response.structuredContent).toEqual(output);
    expect(rows[0]).toMatchObject({
      agentId: "agent-1", runId: "run-1", clientId: "client-1", oauthGrantId: "grant-1", userId: "user-1",
      completedAt, status: "SUCCEEDED", errorSummary: null,
      inputSummaryJson: { notesPresent: true, sourceUrlPresent: true },
      outputSummaryJson: { refs: { id: ["case-1", "evidence-1"] } },
    });
    expect(JSON.stringify(rows)).not.toContain("private input");
    expect(JSON.stringify(rows)).not.toContain("private output");
    expect(JSON.stringify(rows)).not.toContain("private.invalid");
  });

  it.each([false, true])("does not trust argument attribution when execution fails: %s", async (fails) => {
    const { rows, options } = captureAudit();
    const execution = runAuditedMcpTool("example", {
      agentId: "spoofed-agent", runId: "spoofed-run",
    }, { userId: "user-1", clientId: "client-1", oauthGrantId: "grant-1" }, async () => {
      if (fails) throw new Error("Execution failed");
      return { id: "case-1" };
    }, options);
    if (fails) await expect(execution).rejects.toThrow("Execution failed");
    else await execution;
    expect(rows[0]).toMatchObject({
      agentId: null, runId: null, userId: "user-1", clientId: "client-1", oauthGrantId: "grant-1",
    });
    expect(JSON.stringify(rows)).not.toContain("spoofed-");
  });

  it("hashes reordered inputs equally and changed private content differently", async () => {
    const { rows, options } = captureAudit();
    for (const args of [{ notes: "a", status: "open" }, { status: "open", notes: "a" }, { notes: "b", status: "open" }]) {
      await writeMcpToolAudit({ args, status: "SUCCEEDED", toolName: "example" }, options);
    }
    expect(rows[0]!.inputHash).toMatch(/^[a-f0-9]{64}$/);
    expect(rows[0]!.inputHash).toBe(rows[1]!.inputHash);
    expect(rows[0]!.inputHash).not.toBe(rows[2]!.inputHash);
  });

  it("redacts private exceptions from storage and preserves the original failure", async () => {
    const { rows, options } = captureAudit();
    const error = new Error("SQL detail: private testimony");
    await expect(runAuditedMcpTool("example", {}, {}, async () => { throw error; }, options)).rejects.toBe(error);
    expect(rows[0]).toMatchObject({ status: "FAILED", errorSummary: "Tool execution failed." });
    expect(JSON.stringify(rows)).not.toContain("private testimony");
    expect(rows[0]!.outputSummaryJson).toBeUndefined();
  });

  it("preserves successful execution if audit storage and its logger both fail", async () => {
    const result = await runAuditedMcpTool("example", {}, {}, async () => ({ id: "case-1" }), {
      writeAudit: async () => { throw new Error("private database detail"); },
      onAuditFailure: () => { throw new Error("logger offline"); },
    });
    expect(result.structuredContent).toEqual({ id: "case-1" });
  });

  it("preserves the caller's audited tool allowlist", async () => {
    const { rows, options } = captureAudit();
    await runAuditedMcpTool("readTool", {}, {}, async () => ({ id: "case-1" }), {
      ...options, auditedTools: new Set(["writeTool"]),
    });
    expect(rows).toEqual([]);
  });
});

describe("shared MCP results", () => {
  it("serializes Prisma bigints and dates identically in text and structured data", () => {
    const result = mcpResult({ small: 42n, large: 9007199254740993n, date: completedAt });
    expect(result.structuredContent).toEqual({ small: 42, large: "9007199254740993", date: completedAt.toISOString() });
    expect(JSON.parse(result.content[0]!.text)).toEqual(result.structuredContent);
  });

  it.each([null, undefined, [1, 2], "text", 123])("omits structured content for non-object output %j", (value) => {
    const result = mcpResult(value);
    expect(result).not.toHaveProperty("structuredContent");
    expect(JSON.parse(result.content[0]!.text)).toEqual(value ?? null);
  });
});
