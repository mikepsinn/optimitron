import { CALL_SCRIPT_TOPOLOGY, ENTRY_NODE_ID } from "./call-script";
import type { NodeId, RelationshipBucket, VariantSlot } from "./types";

export const DEFAULT_HANDOFF_CHANNEL = "sms";

export const REQUIRED_SELECTION_SLOT_KEYS = [
  "chain_node.love-and-preventable-harm.body",
  "chain_node.bottleneck.body",
  "chain_node.one-percent-fix.body",
  "chain_node.pressure-works.body",
  "chain_node.paid-recursion.body",
  "objection.obj:lag-warranted.body",
  "objection.obj:math-suspect.body",
  "objection.obj:pressure-fails.body",
  "objection.obj:not-linear-or-cult.body",
  "inevitability-recap",
  "replication.primary",
  "handoff.family-partner.sms",
  "handoff.close-friend.sms",
  "handoff.professional.sms",
  "handoff.weak-tie.sms",
] as const;

export function slotKeyForNode(nodeId: NodeId): string | null {
  const node = CALL_SCRIPT_TOPOLOGY[nodeId];
  if (!node) return null;
  switch (node.kind) {
    case "claim":
      return `chain_node.${nodeId}.body`;
    case "objection":
      return `objection.${nodeId}.body`;
    case "inevitability":
      return nodeId;
    case "replication":
      return "replication.primary";
    case "terminal":
      return null;
  }
}

export function handoffSlotKey(bucket: RelationshipBucket): string {
  return `handoff.${bucket}.${DEFAULT_HANDOFF_CHANNEL}`;
}

export function slotForSlotKey(slotKey: string): VariantSlot {
  if (slotKey.startsWith("chain_node.")) return "CHAIN_NODE";
  if (slotKey.startsWith("objection.")) return "OBJECTION_NODE";
  if (slotKey.startsWith("handoff.")) return "HANDOFF";
  if (slotKey === "inevitability-recap") return "INEVITABILITY";
  if (slotKey === "replication.primary") return "REPLICATION_CTA";
  if (slotKey.startsWith("deep_chain.")) return "DEEP_CHAIN_NODE";
  if (slotKey.startsWith("topology.")) return "TOPOLOGY";
  throw new Error(`Unknown reasoning slotKey: ${slotKey}`);
}

export function currentArmIdForNode(
  variantArmIds: Record<string, string>,
  nodeId: NodeId,
): string | null {
  const slotKey = slotKeyForNode(nodeId);
  if (!slotKey) return null;
  return variantArmIds[slotKey] ?? null;
}

export function isReturningSession(currentNodeId: NodeId): boolean {
  return currentNodeId !== ENTRY_NODE_ID;
}
