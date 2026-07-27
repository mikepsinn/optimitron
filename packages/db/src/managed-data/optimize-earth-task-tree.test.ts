import { describe, expect, it } from "vitest";
import {
  COURT_OF_HUMANITY_TASK_ID,
  EARTH_OPTIMIZATION_PRIZE_TASK_ID,
  END_WAR_AND_DISEASE_TASK_ID,
  EOS_APPROVE_FINANCING_PACKET_TASK_KEY,
  EOS_CAPITALIZE_TASK_ID,
  EOS_OPEN_FINANCING_ROUND_TASK_KEY,
  EOS_REVIEW_CORPORATE_AUTHORITY_TASK_KEY,
  EOS_REVIEW_FINANCING_TERMS_TASK_KEY,
  EOS_REVIEW_SECURITIES_EXEMPTIONS_TASK_KEY,
  EOS_REVIEW_SUBSCRIPTION_AGREEMENT_TASK_KEY,
  EOS_REVIEW_USE_OF_PROCEEDS_TASK_KEY,
  EOS_VERIFY_ENTITY_TASK_KEY,
  LOVING_TAKEOVER_TASK_ID,
  TASK_GRAPH_STEWARD_TASK_ID,
  TREATY_PARENT_TASK_ID,
} from "../task-keys.js";
import { OPTIMIZE_EARTH_ROOT_TASK_ID } from "../task-keys.js";
import { OPTIMIZE_EARTH_TASK_TREE } from "./optimize-earth-task-tree.js";

describe("OPTIMIZE_EARTH_TASK_TREE", () => {
  const root = OPTIMIZE_EARTH_TASK_TREE.find(
    (task) => task.id === OPTIMIZE_EARTH_ROOT_TASK_ID,
  );

  it("has the root task", () => {
    expect(root).toBeDefined();
  });

  // Regression: without `dueAt` set, `getTaskDelayStats` returns
  // `currentDelayDays = 0`, which zeroes out `currentEconomicValueUsdLost` and
  // `currentHumanLivesLost`. The /tasks page then renders the root row with no
  // deaths-from-delay / wasted-by-delay even though the per-day rates from the
  // impact frame are populated.
  it("has an overdue dueAt so the root row shows non-zero cost of delay", () => {
    // Use a fixed reference instead of `Date.now()` so the assertion does not
    // depend on the wall clock. The root dueAt is intentionally in the past
    // (it's a missed treaty deadline); compare against a clearly post-deadline
    // anchor that pre-dates the test author's typing speed.
    const POST_DEADLINE_ANCHOR = new Date("2025-01-01T00:00:00Z").getTime();
    expect(root?.dueAt).toBeInstanceOf(Date);
    expect(root?.dueAt!.getTime()).toBeLessThan(POST_DEADLINE_ANCHOR);
  });

  it("has parentTaskId null (it's the root)", () => {
    expect(root?.parentTaskId).toBeNull();
  });

  // The /foundations mechanism comparison ranks the children of End War and
  // Disease by expected value per donated dollar. Each fundable mechanism must
  // therefore carry economics (conditional value + probability) so the sync can
  // build an impact frame; dFDA must be an active child (it was retired before),
  // and the shirt seed must exist as the $50M-seed mechanism (not the $56B
  // universal-distribution framing).
  const fundableMechanismKeys = [
    LOVING_TAKEOVER_TASK_ID,
    "dfda",
    "shirt-seed",
    COURT_OF_HUMANITY_TASK_ID,
    TREATY_PARENT_TASK_ID,
    EARTH_OPTIMIZATION_PRIZE_TASK_ID,
  ];

  it.each(fundableMechanismKeys)(
    "mechanism %s carries economics for the comparison",
    (id) => {
      const task = OPTIMIZE_EARTH_TASK_TREE.find((t) => t.id === id);
      expect(task, `task ${id} should exist`).toBeDefined();
      expect(task?.retired ?? false).toBe(false);
      expect(typeof task?.expectedEconomicValueUsdBase).toBe("number");
      expect(typeof task?.successProbabilityBase).toBe("number");
    },
  );

  it("dFDA is an active child of End War and Disease (un-retired)", () => {
    const dfda = OPTIMIZE_EARTH_TASK_TREE.find((t) => t.id === "dfda");
    expect(dfda?.retired ?? false).toBe(false);
    expect(dfda?.parentTaskId).toBe(END_WAR_AND_DISEASE_TASK_ID);
  });

  it("the shirt seed is a child of End War and Disease", () => {
    const seed = OPTIMIZE_EARTH_TASK_TREE.find((t) => t.id === "shirt-seed");
    expect(seed?.parentTaskId).toBe(END_WAR_AND_DISEASE_TASK_ID);
  });

  it("decomposes EOS capitalization into deterministic, gated work", () => {
    const steps = OPTIMIZE_EARTH_TASK_TREE.filter(
      (task) => task.parentTaskId === EOS_CAPITALIZE_TASK_ID,
    );
    expect(steps).toHaveLength(11);

    const byKey = new Map(steps.map((task) => [task.taskKey, task]));
    expect(
      byKey.get(EOS_APPROVE_FINANCING_PACKET_TASK_KEY)?.blockedByTaskKeys,
    ).toEqual(
      expect.arrayContaining([
        EOS_REVIEW_CORPORATE_AUTHORITY_TASK_KEY,
        EOS_REVIEW_FINANCING_TERMS_TASK_KEY,
        EOS_REVIEW_SUBSCRIPTION_AGREEMENT_TASK_KEY,
        EOS_REVIEW_SECURITIES_EXEMPTIONS_TASK_KEY,
        EOS_REVIEW_USE_OF_PROCEEDS_TASK_KEY,
      ]),
    );
    expect(
      byKey.get(EOS_OPEN_FINANCING_ROUND_TASK_KEY)?.blockedByTaskKeys,
    ).toEqual([EOS_APPROVE_FINANCING_PACKET_TASK_KEY]);
    expect(
      byKey.get(EOS_APPROVE_FINANCING_PACKET_TASK_KEY)?.contextJson,
    ).toEqual({
      requiresDocumentDecision: {
        schema: "optimitron.requires-document-decision.v1",
      },
    });
    expect(
      byKey.get(EOS_VERIFY_ENTITY_TASK_KEY)?.blockedByTaskKeys,
    ).toBeUndefined();
  });

  // Regression guard: the optimitron:dev entry adopted a runtime-created row,
  // so its managed id must stay the original cuid. "Fixing" it to a slug makes
  // the sync throw (same taskKey, different id) against every database that
  // contains the runtime row — including the prod-fork preview DBs in CI.
  it("optimitron:dev keeps the adopted runtime cuid as its id", () => {
    const dev = OPTIMIZE_EARTH_TASK_TREE.find(
      (t) => t.taskKey === "optimitron:dev",
    );
    expect(dev).toBeDefined();
    expect(dev?.id).toBe("cmrh79s7h000604jtqfckws4t");
    expect(dev?.parentTaskId).toBe(OPTIMIZE_EARTH_ROOT_TASK_ID);
    expect(dev?.isPublic).toBe(false);
    // The other half of the adoption invariant: no economics scalars, so the
    // sync skips impact writes and the row's runtime estimate set
    // (mcp-direct-v1) stays current. Adding a value here would demote it.
    expect(dev?.expectedEconomicValueUsdBase).toBeUndefined();
    expect(dev?.successProbabilityBase).toBeUndefined();
  });

  it("adopts the live task-graph steward as a private managed root branch", () => {
    const steward = OPTIMIZE_EARTH_TASK_TREE.find(
      (task) => task.taskKey === "optimitron:task-graph-steward",
    );
    expect(steward).toMatchObject({
      executionMode: "AGENT_ONLY",
      id: TASK_GRAPH_STEWARD_TASK_ID,
      isPublic: false,
      parentTaskId: OPTIMIZE_EARTH_ROOT_TASK_ID,
    });
    expect(steward?.contextJson).toMatchObject({
      developmentOwner: "Mike",
      stewardPolicyVersion: "task-graph-steward.v1",
    });
  });
});
