import { TaskKind } from "@optimitron/db";
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
    kind: TaskKind.TASK,
    parentTaskId,
    queueEligible: false,
    ...overrides,
  };
}

describe("auditExecutionGraph", () => {
  it("requires an actual PROJECT root row", () => {
    const missing = auditExecutionGraph({
      edges: [],
      tasks: [graphTask("child", OPTIMIZE_EARTH_ROOT_TASK_ID)],
    });
    const wrongKind = auditExecutionGraph({
      edges: [],
      tasks: [graphTask(OPTIMIZE_EARTH_ROOT_TASK_ID, null)],
    });

    expect(missing.map((finding) => finding.code)).toEqual(
      expect.arrayContaining(["MISSING_ROOT", "UNROOTED_TASK"]),
    );
    expect(wrongKind.map((finding) => finding.code)).toContain(
      "ROOT_NOT_PROJECT",
    );
  });

  it("detects unrooted tasks and parent/dependency cycles", () => {
    const findings = auditExecutionGraph({
      edges: [
        { edgeType: "BLOCKS", fromTaskId: "a", toTaskId: "b" },
        { edgeType: "BLOCKS", fromTaskId: "b", toTaskId: "a" },
      ],
      tasks: [
        graphTask(OPTIMIZE_EARTH_ROOT_TASK_ID, null, {
          kind: TaskKind.PROJECT,
        }),
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

  it("flags projects, parents, and missing estimates when they pollute a queue", () => {
    const findings = auditExecutionGraph({
      edges: [],
      tasks: [
        graphTask(OPTIMIZE_EARTH_ROOT_TASK_ID, null, {
          kind: TaskKind.PROJECT,
        }),
        graphTask("project", OPTIMIZE_EARTH_ROOT_TASK_ID, {
          kind: TaskKind.PROJECT,
          queueEligible: true,
        }),
        graphTask("parent", "project", {
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
        "PROJECT_IN_QUEUE",
      ]),
    );
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
        graphTask(OPTIMIZE_EARTH_ROOT_TASK_ID, null, {
          kind: TaskKind.PROJECT,
        }),
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
        graphTask(OPTIMIZE_EARTH_ROOT_TASK_ID, null, {
          kind: TaskKind.PROJECT,
        }),
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
});
