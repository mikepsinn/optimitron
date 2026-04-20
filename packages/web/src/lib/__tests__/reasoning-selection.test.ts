import { describe, expect, it } from "vitest";
import {
  currentArmIdForNode,
  handoffSlotKey,
  isReturningSession,
  slotForSlotKey,
  slotKeyForNode,
} from "../reasoning/selection";

describe("slotKeyForNode", () => {
  it("maps claim, objection, inevitability, and replication nodes to slot keys", () => {
    expect(slotKeyForNode("bottleneck")).toBe("chain_node.bottleneck.body");
    expect(slotKeyForNode("obj:math-suspect")).toBe("objection.obj:math-suspect.body");
    expect(slotKeyForNode("inevitability-recap")).toBe("inevitability-recap");
    expect(slotKeyForNode("replication")).toBe("replication.primary");
    expect(slotKeyForNode("term:goodbye")).toBeNull();
  });
});

describe("slotForSlotKey", () => {
  it("maps slot keys back to their slot enum", () => {
    expect(slotForSlotKey("chain_node.bottleneck.body")).toBe("CHAIN_NODE");
    expect(slotForSlotKey("objection.obj:lag-warranted.body")).toBe("OBJECTION_NODE");
    expect(slotForSlotKey("inevitability-recap")).toBe("INEVITABILITY");
    expect(slotForSlotKey("replication.primary")).toBe("REPLICATION_CTA");
    expect(slotForSlotKey("handoff.professional.sms")).toBe("HANDOFF");
  });
});

describe("currentArmIdForNode", () => {
  it("looks up the selected arm id for the active node", () => {
    expect(
      currentArmIdForNode(
        {
          "chain_node.bottleneck.body": "arm_bottle",
          [handoffSlotKey("professional")]: "arm_handoff",
        },
        "bottleneck",
      ),
    ).toBe("arm_bottle");
  });
});

describe("isReturningSession", () => {
  it("treats entry as first and later nodes as returning", () => {
    expect(isReturningSession("love-and-preventable-harm")).toBe(false);
    expect(isReturningSession("replication")).toBe(true);
  });
});
