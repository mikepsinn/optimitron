import { TaskStatus } from "@optimitron/db";

/**
 * Evaluate a TaskTrigger.completionGate against a list of related tasks
 * (the "gate inputs"). When the gate holds, the verify target auto-VERIFIES.
 *
 * Gate kinds (string, not enum, for forward-compat):
 *   { kind: "allOf",  subtaskKinds: [...] }   — all named tasks VERIFIED
 *   { kind: "anyOf",  subtaskKinds: [...] }   — at least one named task VERIFIED
 *   { kind: "count",  minVerified: N }        — at least N inputs VERIFIED
 *   { kind: "always" }                        — gate is met as soon as evaluated
 *
 * Top-level optional fields on every gate:
 *   inputScope:        "children" (default) | "siblings"
 *                      — "children" → gate inputs are children of the verify
 *                        target (target auto-VERIFIES when ITS children meet gate)
 *                      — "siblings" → gate inputs are SIBLINGS of the verify
 *                        target (target auto-VERIFIES when its peers under the
 *                        same parent meet gate; used for Pattern 6 HMT)
 *   evidenceTemplate:  template rendered into Task.completionEvidence
 *
 * Adding a new gate kind or scope is a code change here — no schema migration.
 */

export type GateInputScope = "children" | "siblings";

export type CompletionGate =
  | null
  | undefined
  | {
      kind: "allOf";
      subtaskKinds: string[];
      inputScope?: GateInputScope;
      evidenceTemplate?: string;
    }
  | {
      kind: "anyOf";
      subtaskKinds: string[];
      inputScope?: GateInputScope;
      evidenceTemplate?: string;
    }
  | {
      kind: "count";
      minVerified: number;
      inputScope?: GateInputScope;
      evidenceTemplate?: string;
    }
  | { kind: "always"; inputScope?: GateInputScope; evidenceTemplate?: string };

export interface GateChild {
  /// The TaskSpawnSpec.kind that produced this child task.
  spawnKind: string;
  status: TaskStatus;
}

export function isGateMet(gate: unknown, children: readonly GateChild[]): boolean {
  if (gate == null || typeof gate !== "object") return false;
  const g = gate as Record<string, unknown>;
  switch (g.kind) {
    case "always":
      return true;
    case "allOf": {
      if (!Array.isArray(g.subtaskKinds)) return false;
      return g.subtaskKinds.every((kind) =>
        children.some((c) => c.spawnKind === kind && c.status === TaskStatus.VERIFIED),
      );
    }
    case "anyOf": {
      if (!Array.isArray(g.subtaskKinds)) return false;
      return g.subtaskKinds.some((kind) =>
        children.some((c) => c.spawnKind === kind && c.status === TaskStatus.VERIFIED),
      );
    }
    case "count": {
      const min = typeof g.minVerified === "number" ? g.minVerified : Number(g.minVerified ?? 0);
      const verified = children.filter((c) => c.status === TaskStatus.VERIFIED).length;
      return verified >= min;
    }
    default:
      return false;
  }
}

export function gateEvidenceTemplate(gate: unknown): string | null {
  if (gate == null || typeof gate !== "object") return null;
  const g = gate as Record<string, unknown>;
  return typeof g.evidenceTemplate === "string" ? g.evidenceTemplate : null;
}

export function gateInputScope(gate: unknown): GateInputScope {
  if (gate == null || typeof gate !== "object") return "children";
  const g = gate as Record<string, unknown>;
  return g.inputScope === "siblings" ? "siblings" : "children";
}
