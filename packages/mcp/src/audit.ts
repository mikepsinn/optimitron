import { createHash } from "node:crypto";
import { McpToolCallStatus } from "@optimitron/db/enums";
import { mcpResult } from "./results";

function stableStringify(value: unknown) {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_key, item) => {
    if (item && typeof item === "object") {
      if (seen.has(item)) return "[Circular]";
      seen.add(item);
      if (!Array.isArray(item)) {
        return Object.fromEntries(
          Object.entries(item as Record<string, unknown>).sort(([a], [b]) =>
            a.localeCompare(b),
          ),
        );
      }
    }
    return item;
  });
}

function hashMcpInput(input: unknown) {
  return createHash("sha256")
    .update(stableStringify(input) ?? "null")
    .digest("hex");
}

export function mcpToolInputSummary(args: Record<string, unknown>) {
  const safeScalarKeys = [
    "targetType",
    "targetId",
    "reasonType",
    "sourceKind",
    "referendumSlug",
    "lifeStatus",
    "causeCategory",
    "position",
    "kind",
    "codeSystem",
    "sourceSystem",
    "artifactType",
    "status",
  ];
  const summary: Record<string, unknown> = { keys: Object.keys(args).sort() };
  for (const key of safeScalarKeys) {
    const value = args[key];
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      summary[key] = value;
    }
  }
  for (const key of [
    "sourceUrl",
    "sourceArtifactId",
    "sourceKey",
    "correctionJson",
    "payloadJson",
    "memorialMessage",
    "publicComment",
    "notes",
  ]) {
    summary[`${key}Present`] = args[key] != null && args[key] !== "";
  }
  return summary;
}

function mcpToolOutputSummary(output: unknown) {
  const refs: Record<string, string[]> = {};
  const visit = (value: unknown, depth = 0) => {
    if (!value || depth > 4) return;
    if (Array.isArray(value)) {
      for (const item of value.slice(0, 20)) visit(item, depth + 1);
      return;
    }
    if (typeof value !== "object") return;
    for (const [key, item] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (
        typeof item === "string" &&
        (key === "id" || /Id$/.test(key) || key === "slug" || key === "handle")
      ) {
        refs[key] = [...(refs[key] ?? []), item];
      } else {
        visit(item, depth + 1);
      }
    }
  };
  visit(output);
  return { refs };
}

export interface McpAuditContext {
  agentId?: string | null;
  clientId?: string | null;
  oauthGrantId?: string | null;
  runId?: string | null;
  userId?: string | null;
}

export interface McpToolAuditInput extends McpAuditContext {
  args: Record<string, unknown>;
  error?: unknown;
  output?: unknown;
  status: McpToolCallStatus;
  toolName: string;
}

export interface McpToolAuditData {
  agentId: string | null;
  clientId: string | null;
  oauthGrantId: string | null;
  runId: string | null;
  userId: string | null;
  completedAt: Date;
  errorSummary: string | null;
  inputHash: string;
  inputSummaryJson: Record<string, unknown>;
  outputSummaryJson?: { refs: Record<string, string[]> };
  status: McpToolCallStatus;
  toolName: string;
}

export interface McpAuditOptions<T = unknown> {
  writeAudit: (data: McpToolAuditData) => Promise<T>;
  auditedTools?: ReadonlySet<string>;
  now?: () => Date;
  onAuditFailure?: () => void;
}

export async function writeMcpToolAudit<T>(
  input: McpToolAuditInput,
  options: McpAuditOptions<T>,
): Promise<T | undefined> {
  if (options.auditedTools && !options.auditedTools.has(input.toolName)) return;
  try {
    return await options.writeAudit({
      agentId: input.agentId ?? null,
      clientId: input.clientId ?? null,
      oauthGrantId: input.oauthGrantId ?? null,
      runId: input.runId ?? null,
      userId: input.userId ?? null,
      completedAt: (options.now ?? (() => new Date()))(),
      // Driver/domain exceptions can contain private arguments or SQL values.
      errorSummary: input.status === McpToolCallStatus.FAILED ? "Tool execution failed." : null,
      inputHash: hashMcpInput(input.args),
      inputSummaryJson: mcpToolInputSummary(input.args),
      outputSummaryJson:
        input.status === McpToolCallStatus.SUCCEEDED
          ? mcpToolOutputSummary(input.output)
          : undefined,
      status: input.status,
      toolName: input.toolName,
    });
  } catch {
    // Preserve the tool outcome even when the optional audit sink is unavailable.
    try {
      options.onAuditFailure?.();
    } catch {
      /* Logging must not replace the outcome. */
    }
  }
}

export async function runAuditedMcpTool<T>(
  toolName: string,
  args: Record<string, unknown>,
  ctx: McpAuditContext,
  fn: () => Promise<unknown>,
  options: McpAuditOptions<T>,
) {
  try {
    const output = await fn();
    await writeMcpToolAudit(
      { ...ctx, args, output, status: McpToolCallStatus.SUCCEEDED, toolName },
      options,
    );
    return mcpResult(output);
  } catch (error) {
    await writeMcpToolAudit(
      { ...ctx, args, error, status: McpToolCallStatus.FAILED, toolName },
      options,
    );
    throw error;
  }
}
