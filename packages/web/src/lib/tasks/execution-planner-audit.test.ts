import { describe, expect, it } from "vitest";
import {
  auditExecutionGraph,
  OPTIMIZE_EARTH_ROOT_TASK_ID,
} from "./execution-planner-audit";

function graphTask(id: string, parentTaskId: string | null, overrides = {}) {
  return {
    activeChildTaskCount: 0,
    hasMarginalEstimate: true,
    id,
    parentTaskId,
    queueEligible: false,
    ...overrides,
  };
}

describe("auditExecutionGraph", () => {
  it("requires an actual root row", () => {
    const missing = auditExecutionGraph({
      edges: [],
      tasks: [graphTask("child", OPTIMIZE_EARTH_ROOT_TASK_ID)],
    });

    expect(missing.map((finding) => finding.code)).toEqual(
      expect.arrayContaining(["MISSING_ROOT", "UNROOTED_TASK"]),
    );
  });

  it("detects unrooted tasks and parent/dependency cycles", () => {
    const findings = auditExecutionGraph({
      edges: [
        { edgeType: "BLOCKS", fromTaskId: "a", toTaskId: "b" },
        { edgeType: "BLOCKS", fromTaskId: "b", toTaskId: "a" },
      ],
      tasks: [
        graphTask(OPTIMIZE_EARTH_ROOT_TASK_ID, null),
        graphTask("a", "b"),
        graphTask("b", "a"),
      ],
    });

    expect(findings.map((finding) => finding.code)).toEqual(
      expect.arrayContaining([
        "DEPENDENCY_CYCLE",
        "PARENT_CYCLE",
        "UNROOTED_TASK",
      ]),
    );
  });

  it("flags parents and missing estimates when they pollute a queue", () => {
    const findings = auditExecutionGraph({
      edges: [],
      tasks: [
        graphTask(OPTIMIZE_EARTH_ROOT_TASK_ID, null),
        graphTask("parent", OPTIMIZE_EARTH_ROOT_TASK_ID, {
          activeChildTaskCount: 1,
          queueEligible: true,
        }),
        graphTask("leaf", "parent", { hasMarginalEstimate: false }),
      ],
    });

    expect(findings.map((finding) => finding.code)).toEqual(
      expect.arrayContaining([
        "EXECUTABLE_PARENT",
        "MISSING_MARGINAL_ESTIMATE",
      ]),
    );
  });

  it("does not demand estimates for non-executable planning containers", () => {
    const findings = auditExecutionGraph({
      edges: [],
      tasks: [
        graphTask(OPTIMIZE_EARTH_ROOT_TASK_ID, null),
        graphTask("planning-root", OPTIMIZE_EARTH_ROOT_TASK_ID, {
          hasMarginalEstimate: false,
          requiresMarginalEstimate: false,
        }),
      ],
    });

    expect(
      findings.filter(
        (finding) => finding.code === "MISSING_MARGINAL_ESTIMATE",
      ),
    ).toEqual([]);
  });

  it("gives unannotated value edges no inherited value and reports them", () => {
    const findings = auditExecutionGraph({
      edges: [
        {
          edgeType: "INCREASES_PROBABILITY_OF",
          fromTaskId: "research",
          probabilityDeltaBase: null,
          toTaskId: "treaty",
        },
        {
          edgeType: "ACCELERATES",
          fromTaskId: "lobby",
          timeDeltaDaysBase: 4,
          toTaskId: "treaty",
        },
      ],
      tasks: [
        graphTask(OPTIMIZE_EARTH_ROOT_TASK_ID, null),
        graphTask("research", OPTIMIZE_EARTH_ROOT_TASK_ID),
        graphTask("lobby", OPTIMIZE_EARTH_ROOT_TASK_ID),
        graphTask("treaty", OPTIMIZE_EARTH_ROOT_TASK_ID),
      ],
    });

    expect(
      findings.filter((finding) => finding.code === "UNANNOTATED_VALUE_EDGE"),
    ).toHaveLength(1);
    expect(findings[0]?.taskId).toBe("research");
  });

  it("rejects impossible probability and time contributions", () => {
    const findings = auditExecutionGraph({
      edges: [
        {
          edgeType: "INCREASES_PROBABILITY_OF",
          fromTaskId: "research",
          probabilityDeltaBase: 1.2,
          toTaskId: "treaty",
        },
        {
          edgeType: "ACCELERATES",
          fromTaskId: "lobby",
          timeDeltaDaysBase: -1,
          toTaskId: "treaty",
        },
      ],
      tasks: [
        graphTask(OPTIMIZE_EARTH_ROOT_TASK_ID, null),
        graphTask("research", OPTIMIZE_EARTH_ROOT_TASK_ID),
        graphTask("lobby", OPTIMIZE_EARTH_ROOT_TASK_ID),
        graphTask("treaty", OPTIMIZE_EARTH_ROOT_TASK_ID),
      ],
    });

    expect(
      findings.filter((finding) => finding.code === "INVALID_VALUE_EDGE"),
    ).toHaveLength(2);
    expect(findings[0]?.severity).toBe("high");
  });

  it("audits stale parameter inputs and unpublished estimates", () => {
    const findings = auditExecutionGraph({
      edges: [],
      tasks: [
        graphTask(OPTIMIZE_EARTH_ROOT_TASK_ID, null),
        graphTask("research", OPTIMIZE_EARTH_ROOT_TASK_ID, {
          estimateInputsStale: true,
        }),
        graphTask("treaty", OPTIMIZE_EARTH_ROOT_TASK_ID, {
          estimatePublicationEligible: false,
        }),
      ],
    });

    expect(findings.map((finding) => finding.code)).toEqual(
      expect.arrayContaining([
        "STALE_ESTIMATE_INPUT",
        "UNREVIEWED_PUBLIC_ESTIMATE",
      ]),
    );
  });
});
