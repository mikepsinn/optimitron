import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  canUserViewTask: vi.fn(),
  getCurrentUser: vi.fn(),
  getTaskImpactTrace: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/lib/parameters/task-impact-calculation.server", () => ({
  getTaskImpactTrace: mocks.getTaskImpactTrace,
}));

vi.mock("@/lib/tasks/task-visibility.server", () => ({
  canUserViewTask: mocks.canUserViewTask,
  TASK_NOT_FOUND_MESSAGE: "Task not found",
}));

import { GET } from "./route";

const sourceArtifact = {
  artifactType: "CITATION",
  contentHash: "source-hash",
  createdByUserId: "private-owner-id",
  id: "source-1",
  payloadJson: { private: true },
  sourceKey: "paper:1",
  sourceRef: "page 4",
  sourceSystem: "MANUAL",
  sourceUrl: "https://example.org/paper",
  title: "Source paper",
  versionKey: "v1",
};

const parameterRevision = {
  assumptionsJson: null,
  calculationCode: "result = input * 2",
  calculationLanguage: "python",
  confidence: "medium",
  confidenceIntervalHigh: 12,
  confidenceIntervalLow: 8,
  conservative: true,
  currentRevisionId: "parameter-revision-2",
  description: "Calculated input",
  displayName: "Calculated input",
  displayValue: null,
  formulaLatex: "x \\times 2",
  formulaText: "input * 2",
  id: "parameter-revision-1",
  inputs: [],
  key: "calculated-input",
  manualRef: null,
  rationale: "Best available estimate",
  revision: 1,
  sourceArtifacts: [sourceArtifact],
  sourceContentHash: "revision-hash",
  sourceRef: "model.py:10",
  sourceType: "CALCULATED",
  stale: true,
  status: "PUBLISHED",
  unit: "USD",
  value: 10,
};

function rawTrace() {
  return {
    assumptionsJson: { assumption: true },
    calculationCode: "task_value = input * 4.2",
    calculationLanguage: "python",
    calculationVersion: "model-hash",
    counterfactualKey: "nothing-happens",
    createdByUserId: "private-owner-id",
    estimateKind: "EX_ANTE",
    formulaLatex: "V = x \\times 4.2",
    formulaText: "task value = input * 4.2",
    frames: [
      {
        estimatedCashCostUsdBase: 2,
        estimatedCashCostUsdHigh: 3,
        estimatedCashCostUsdLow: 1,
        estimatedEffortHoursBase: 1,
        estimatedEffortHoursHigh: 2,
        estimatedEffortHoursLow: 0.5,
        evaluationHorizonYears: 5,
        expectedDalysAvertedBase: 4,
        expectedDalysAvertedHigh: 6,
        expectedDalysAvertedLow: 2,
        expectedEconomicValueUsdBase: 42,
        expectedEconomicValueUsdHigh: 60,
        expectedEconomicValueUsdLow: 20,
        frameKey: "FIVE_YEAR",
        frameSlug: "five-year",
        medianHealthyLifeYearsEffectBase: null,
        medianHealthyLifeYearsEffectHigh: null,
        medianHealthyLifeYearsEffectLow: null,
        medianIncomeGrowthEffectPpPerYearBase: null,
        medianIncomeGrowthEffectPpPerYearHigh: null,
        medianIncomeGrowthEffectPpPerYearLow: null,
        metrics: [],
        successProbabilityBase: 0.5,
        successProbabilityHigh: 0.7,
        successProbabilityLow: 0.3,
        timeToImpactStartDays: 30,
      },
    ],
    id: "estimate-1",
    inputs: [],
    methodologyKey: "calculation-model",
    parameterSetHash: "parameter-set-hash",
    parameterTraces: [{ revision: parameterRevision, symbol: "input" }],
    publicationStatus: "PUBLISHED",
    sourceArtifacts: [{ sourceArtifact }],
    sourceSystem: "CALCULATION",
    stale: true,
    staleInputs: [
      {
        currentRevisionId: "parameter-revision-2",
        parameterKey: "calculated-input",
        pinnedRevisionId: "parameter-revision-1",
        symbol: "input",
      },
    ],
    task: {
      createdByUserId: "private-owner-id",
      id: "task-1",
      title: "Test task",
    },
  };
}

function getRequest(taskId = "task-1") {
  return GET(new Request(`http://localhost/api/tasks/${taskId}/impact-trace`), {
    params: Promise.resolve({ id: taskId }),
  });
}

beforeEach(() => {
  mocks.canUserViewTask.mockReset();
  mocks.getCurrentUser.mockReset();
  mocks.getTaskImpactTrace.mockReset();
  mocks.canUserViewTask.mockResolvedValue(true);
  mocks.getCurrentUser.mockResolvedValue(null);
  mocks.getTaskImpactTrace.mockResolvedValue(rawTrace());
});

describe("GET /api/tasks/[id]/impact-trace", () => {
  it("returns a curated public trace without internal IDs or artifact payloads", async () => {
    const response = await getRequest();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    const body = await response.json();
    expect(body.task).toEqual({ id: "task-1", title: "Test task" });
    expect(body.parameterTraces[0].revision).toMatchObject({
      id: "parameter-revision-1",
      stale: true,
      value: 10,
    });
    expect(body.sourceArtifacts[0]).not.toHaveProperty("payloadJson");
    expect(body).not.toHaveProperty("createdByUserId");
    expect(body.task).not.toHaveProperty("createdByUserId");
  });

  it("returns the same 404 for inaccessible tasks without loading a trace", async () => {
    mocks.canUserViewTask.mockResolvedValue(false);

    const response = await getRequest("private-task");

    expect(response.status).toBe(404);
    expect(mocks.getTaskImpactTrace).not.toHaveBeenCalled();
  });

  it("passes an authorized private viewer to the trace service", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "owner-1", isAdmin: false });

    const response = await getRequest("private-task");

    expect(response.status).toBe(200);
    expect(mocks.getTaskImpactTrace).toHaveBeenCalledWith(
      { taskId: "private-task" },
      { isAdmin: false, userId: "owner-1" },
    );
  });

  it("returns 401 for an invalid bearer token", async () => {
    mocks.getCurrentUser.mockRejectedValue(new Error("Unauthorized"));

    const response = await getRequest();

    expect(response.status).toBe(401);
  });

  it("does not reveal whether a visible task lacks a readable estimate", async () => {
    mocks.getTaskImpactTrace.mockRejectedValue(
      new Error("Task impact estimate not found."),
    );

    const response = await getRequest();

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Task not found." });
  });
});
