/**
 * Invariant call-script topology + safety anchors.
 *
 * The graph structure, required-parameter mapping, kill criteria, and
 * update log all live here in code (T3). Copy content lives in DB
 * (`VariantArm.content`) and is resolved at render time.
 *
 * Changing anything in this file is a T3 change — requires code deploy.
 */

import type { NodeId } from "./types";

/* ================================================================
 * Topology
 * ================================================================ */

type ClaimNodeSpec = {
  kind: "claim";
  id: NodeId;
  yes: NodeId;
  no: NodeId;
};

type ObjectionNodeSpec = {
  kind: "objection";
  id: NodeId;
  reAnswer: NodeId;
  stillDisagree: NodeId;
};

type InevitabilityNodeSpec = {
  kind: "inevitability";
  id: NodeId;
  rejectWhich: NodeId[];
  proceed: NodeId;
};

type ReplicationNodeSpec = {
  kind: "replication";
  id: NodeId;
};

type TerminalNodeSpec = {
  kind: "terminal";
  id: NodeId;
  tone: "cta-signed" | "cta-shared" | "decline-polite" | "goodbye";
};

export type NodeSpec =
  | ClaimNodeSpec
  | ObjectionNodeSpec
  | InevitabilityNodeSpec
  | ReplicationNodeSpec
  | TerminalNodeSpec;

export const ENTRY_NODE_ID: NodeId = "love-and-preventable-harm";

export const CALL_SCRIPT_TOPOLOGY: Record<NodeId, NodeSpec> = {
  // ---- Claim chain ----
  "love-and-preventable-harm": {
    kind: "claim",
    id: "love-and-preventable-harm",
    yes: "bottleneck",
    no: "term:goodbye",
  },
  bottleneck: {
    kind: "claim",
    id: "bottleneck",
    yes: "one-percent-fix",
    no: "obj:lag-warranted",
  },
  "one-percent-fix": {
    kind: "claim",
    id: "one-percent-fix",
    yes: "pressure-works",
    no: "obj:math-suspect",
  },
  "pressure-works": {
    kind: "claim",
    id: "pressure-works",
    yes: "paid-recursion",
    no: "obj:pressure-fails",
  },
  "paid-recursion": {
    kind: "claim",
    id: "paid-recursion",
    yes: "inevitability-recap",
    no: "obj:not-linear-or-cult",
  },

  // ---- Objections (re-answer loops back to claim) ----
  "obj:lag-warranted": {
    kind: "objection",
    id: "obj:lag-warranted",
    reAnswer: "bottleneck",
    stillDisagree: "term:decline-polite",
  },
  "obj:math-suspect": {
    kind: "objection",
    id: "obj:math-suspect",
    reAnswer: "one-percent-fix",
    stillDisagree: "term:decline-polite",
  },
  "obj:pressure-fails": {
    kind: "objection",
    id: "obj:pressure-fails",
    reAnswer: "pressure-works",
    stillDisagree: "term:decline-polite",
  },
  "obj:not-linear-or-cult": {
    kind: "objection",
    id: "obj:not-linear-or-cult",
    reAnswer: "paid-recursion",
    stillDisagree: "term:decline-polite",
  },

  // ---- Recap + replication + terminals ----
  "inevitability-recap": {
    kind: "inevitability",
    id: "inevitability-recap",
    rejectWhich: [
      "bottleneck",
      "one-percent-fix",
      "pressure-works",
      "paid-recursion",
    ],
    proceed: "replication",
  },
  replication: {
    kind: "replication",
    id: "replication",
  },
  "term:cta-signed": {
    kind: "terminal",
    id: "term:cta-signed",
    tone: "cta-signed",
  },
  "term:cta-shared": {
    kind: "terminal",
    id: "term:cta-shared",
    tone: "cta-shared",
  },
  "term:decline-polite": {
    kind: "terminal",
    id: "term:decline-polite",
    tone: "decline-polite",
  },
  "term:goodbye": {
    kind: "terminal",
    id: "term:goodbye",
    tone: "goodbye",
  },
};

/* ================================================================
 * Required parameters per claim (validator-enforced)
 * ================================================================ */

/**
 * Each claim node body MUST reference the listed `Parameter` names from
 * `@optimitron/data/parameters`. Validator rejects candidate arms that
 * drop required parameter citations — prevents AI-generated copy from
 * silently stripping the quantitative grounding.
 */
export const REQUIRED_PARAMS_PER_CLAIM: Record<NodeId, readonly string[]> = {
  "love-and-preventable-harm": [], // purely moral premise
  bottleneck: [
    "DISEASES_WITHOUT_EFFECTIVE_TREATMENT",
    "STATUS_QUO_QUEUE_CLEARANCE_YEARS",
    "EFFICACY_LAG_YEARS",
    "DFDA_TRIAL_CAPACITY_MULTIPLIER",
  ],
  "one-percent-fix": [
    "TREATY_REDUCTION_PCT",
    "TREATY_ANNUAL_FUNDING",
    "DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT",
    "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS",
    "DFDA_QUEUE_CLEARANCE_YEARS",
  ],
  "pressure-works": [
    "MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO",
    "GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT",
  ],
  "paid-recursion": [
    "VOTER_LIVES_SAVED",
    "VOTER_SUFFERING_HOURS_PREVENTED",
    "TREATY_CAMPAIGN_VOTING_BLOC_TARGET",
  ],
};

/**
 * Load-bearing claims require ≥1 `adversarial: true` Source on their
 * objection handler. Anti-cult rail: we must cite our own critics.
 */
export const ADVERSARIAL_SOURCE_REQUIRED_OBJECTIONS: readonly NodeId[] = [
  "obj:lag-warranted",
  "obj:pressure-fails",
  "obj:not-linear-or-cult",
];

/* ================================================================
 * Kill criteria + update log (anti-cult invariants)
 * ================================================================ */

/**
 * Published on every terminal-decline screen and at the bottom of Node 5.
 * Asymmetric updatability is the cult tell; published kill criteria are
 * the tell of a truth-seeking tool.
 */
export const KILL_CRITERIA: readonly string[] = [
  "The treaty passes.",
  "280M verified signatures are reached.",
  "A peer-reviewed rebuttal of the underlying math is published.",
];

export type ScriptUpdate = {
  date: string;
  change: string;
  reason: string;
};

/**
 * Versioned update history shown on the conclusion screen. Visible
 * evidence that our priors move when evidence moves.
 */
export const SCRIPT_UPDATES: readonly ScriptUpdate[] = [
  {
    date: "2026-04-19",
    change: "Initial v1 published.",
    reason: "Baseline.",
  },
];

/* ================================================================
 * Graph integrity validation
 * ================================================================ */

export class ScriptValidationError extends Error {
  constructor(public readonly issues: readonly string[]) {
    super(
      `Call-script graph integrity failed:\n  ${issues.join("\n  ")}`,
    );
    this.name = "ScriptValidationError";
  }
}

/**
 * Run at module import in dev and on every DB write that touches topology.
 * Throws if the graph has dangling edges, unreachable nodes, terminals
 * with outgoing edges, or a missing ENTRY node.
 */
export function validateScript(
  script: Record<NodeId, NodeSpec> = CALL_SCRIPT_TOPOLOGY,
): void {
  const issues: string[] = [];
  const nodeIds = new Set(Object.keys(script));

  if (!nodeIds.has(ENTRY_NODE_ID)) {
    issues.push(`ENTRY_NODE_ID "${ENTRY_NODE_ID}" not found in script`);
  }

  const reachable = new Set<NodeId>();
  const stack: NodeId[] = nodeIds.has(ENTRY_NODE_ID) ? [ENTRY_NODE_ID] : [];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (reachable.has(id)) continue;
    reachable.add(id);
    const node = script[id];
    if (!node) continue;
    for (const target of outgoingEdges(node)) {
      if (!nodeIds.has(target)) {
        issues.push(
          `Node "${id}" has edge to non-existent node "${target}"`,
        );
      } else {
        stack.push(target);
      }
    }
  }

  for (const id of nodeIds) {
    if (!reachable.has(id)) {
      issues.push(`Node "${id}" is unreachable from ENTRY_NODE_ID`);
    }
  }

  for (const id of nodeIds) {
    const node = script[id];
    if (!node) continue;
    if (node.kind === "terminal" && outgoingEdges(node).length > 0) {
      issues.push(`Terminal node "${id}" has outgoing edges (must be none)`);
    }
  }

  // Required-param mapping must only reference claim nodes that exist.
  for (const claimId of Object.keys(REQUIRED_PARAMS_PER_CLAIM)) {
    const node = script[claimId];
    if (!node) {
      issues.push(
        `REQUIRED_PARAMS_PER_CLAIM references missing node "${claimId}"`,
      );
    } else if (node.kind !== "claim") {
      issues.push(
        `REQUIRED_PARAMS_PER_CLAIM references non-claim node "${claimId}" (kind=${node.kind})`,
      );
    }
  }

  // Adversarial-source-required list must reference objection nodes.
  for (const objId of ADVERSARIAL_SOURCE_REQUIRED_OBJECTIONS) {
    const node = script[objId];
    if (!node) {
      issues.push(
        `ADVERSARIAL_SOURCE_REQUIRED_OBJECTIONS references missing node "${objId}"`,
      );
    } else if (node.kind !== "objection") {
      issues.push(
        `ADVERSARIAL_SOURCE_REQUIRED_OBJECTIONS references non-objection node "${objId}"`,
      );
    }
  }

  if (issues.length > 0) {
    throw new ScriptValidationError(issues);
  }
}

function outgoingEdges(node: NodeSpec): readonly NodeId[] {
  switch (node.kind) {
    case "claim":
      return [node.yes, node.no];
    case "objection":
      return [node.reAnswer, node.stillDisagree];
    case "inevitability":
      return [...node.rejectWhich, node.proceed];
    case "replication":
      return ["term:cta-signed", "term:cta-shared", "term:decline-polite"];
    case "terminal":
      return [];
  }
}

/* ================================================================
 * Run validation at import in dev
 * ================================================================ */

if (process.env.NODE_ENV !== "production") {
  validateScript();
}
