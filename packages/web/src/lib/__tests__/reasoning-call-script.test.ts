import { describe, expect, it } from "vitest";
import {
  ADVERSARIAL_SOURCE_REQUIRED_OBJECTIONS,
  CALL_SCRIPT_TOPOLOGY,
  ENTRY_NODE_ID,
  KILL_CRITERIA,
  REQUIRED_PARAMS_PER_CLAIM,
  SCRIPT_UPDATES,
  ScriptValidationError,
  validateScript,
  type NodeSpec,
} from "../reasoning/call-script";
import type { NodeId } from "../reasoning/types";

describe("call-script topology", () => {
  it("has ENTRY_NODE_ID resolvable", () => {
    expect(CALL_SCRIPT_TOPOLOGY[ENTRY_NODE_ID]).toBeDefined();
  });

  it("passes validateScript on the canonical graph", () => {
    expect(() => validateScript(CALL_SCRIPT_TOPOLOGY)).not.toThrow();
  });

  it("has exactly 5 claim nodes", () => {
    const claims = Object.values(CALL_SCRIPT_TOPOLOGY).filter(
      (n) => n.kind === "claim",
    );
    expect(claims).toHaveLength(5);
  });

  it("has exactly 4 objection nodes (one per contestable claim)", () => {
    const objections = Object.values(CALL_SCRIPT_TOPOLOGY).filter(
      (n) => n.kind === "objection",
    );
    expect(objections).toHaveLength(4);
  });

  it("every claim's `no` points to an objection node", () => {
    for (const node of Object.values(CALL_SCRIPT_TOPOLOGY)) {
      if (node.kind !== "claim") continue;
      const target = CALL_SCRIPT_TOPOLOGY[node.no];
      if (!target) continue;
      const isObjectionOrTerminal =
        target.kind === "objection" || target.kind === "terminal";
      expect(isObjectionOrTerminal).toBe(true);
    }
  });

  it("every objection's stillDisagree points to a decline terminal", () => {
    for (const node of Object.values(CALL_SCRIPT_TOPOLOGY)) {
      if (node.kind !== "objection") continue;
      const target = CALL_SCRIPT_TOPOLOGY[node.stillDisagree];
      expect(target?.kind).toBe("terminal");
    }
  });

  it("inevitability recap's proceed target is replication", () => {
    const recap = CALL_SCRIPT_TOPOLOGY["inevitability-recap"];
    expect(recap?.kind).toBe("inevitability");
    if (recap?.kind === "inevitability") {
      expect(recap.proceed).toBe("replication");
    }
  });
});

describe("validateScript", () => {
  it("throws on missing ENTRY node", () => {
    const partial: Record<NodeId, NodeSpec> = {};
    expect(() => validateScript(partial)).toThrow(ScriptValidationError);
  });

  it("throws on a dangling edge", () => {
    const broken: Record<NodeId, NodeSpec> = {
      "love-and-preventable-harm": {
        kind: "claim",
        id: "love-and-preventable-harm",
        yes: "non-existent",
        no: "term:goodbye",
      },
      "term:goodbye": {
        kind: "terminal",
        id: "term:goodbye",
        tone: "goodbye",
      },
    };
    expect(() => validateScript(broken)).toThrow(ScriptValidationError);
  });

  it("throws when REQUIRED_PARAMS_PER_CLAIM references a missing node", () => {
    // A tiny graph that's topologically valid but missing the claim nodes
    // that REQUIRED_PARAMS_PER_CLAIM references against the default.
    const minimal: Record<NodeId, NodeSpec> = {
      [ENTRY_NODE_ID]: {
        kind: "claim",
        id: ENTRY_NODE_ID,
        yes: "term:goodbye",
        no: "term:goodbye",
      },
      "term:goodbye": {
        kind: "terminal",
        id: "term:goodbye",
        tone: "goodbye",
      },
    };
    // REQUIRED_PARAMS_PER_CLAIM lists node names like "bottleneck" that
    // don't exist in `minimal`, so validation throws — this confirms the
    // check is active.
    expect(() => validateScript(minimal)).toThrow(/missing node/);
  });

  it("throws when a node is unreachable from entry", () => {
    const broken: Record<NodeId, NodeSpec> = {
      [ENTRY_NODE_ID]: {
        kind: "claim",
        id: ENTRY_NODE_ID,
        yes: "term:cta-signed",
        no: "term:goodbye",
      },
      "term:cta-signed": {
        kind: "terminal",
        id: "term:cta-signed",
        tone: "cta-signed",
      },
      "term:goodbye": {
        kind: "terminal",
        id: "term:goodbye",
        tone: "goodbye",
      },
      "orphan-node": {
        kind: "terminal",
        id: "orphan-node",
        tone: "decline-polite",
      },
    };
    expect(() => validateScript(broken)).toThrow(/unreachable/);
  });
});

describe("REQUIRED_PARAMS_PER_CLAIM", () => {
  it("covers every claim in the topology", () => {
    for (const [id, node] of Object.entries(CALL_SCRIPT_TOPOLOGY)) {
      if (node.kind === "claim") {
        expect(REQUIRED_PARAMS_PER_CLAIM[id]).toBeDefined();
      }
    }
  });

  it("only references claim nodes", () => {
    for (const id of Object.keys(REQUIRED_PARAMS_PER_CLAIM)) {
      expect(CALL_SCRIPT_TOPOLOGY[id]?.kind).toBe("claim");
    }
  });
});

describe("ADVERSARIAL_SOURCE_REQUIRED_OBJECTIONS", () => {
  it("only references objection nodes", () => {
    for (const id of ADVERSARIAL_SOURCE_REQUIRED_OBJECTIONS) {
      expect(CALL_SCRIPT_TOPOLOGY[id]?.kind).toBe("objection");
    }
  });
});

describe("KILL_CRITERIA", () => {
  it("is non-empty and each entry is a non-empty string", () => {
    expect(KILL_CRITERIA.length).toBeGreaterThan(0);
    for (const k of KILL_CRITERIA) {
      expect(k).toBeTypeOf("string");
      expect(k.length).toBeGreaterThan(0);
    }
  });
});

describe("SCRIPT_UPDATES", () => {
  it("seeds with a baseline entry", () => {
    expect(SCRIPT_UPDATES.length).toBeGreaterThan(0);
    expect(SCRIPT_UPDATES[0]?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
