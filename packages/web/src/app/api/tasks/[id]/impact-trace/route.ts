import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import { McpScope } from "@/lib/mcp-scopes";
import type { ParameterTraceNode } from "@/lib/parameters/parameter-catalog.server";
import { getTaskImpactTrace } from "@/lib/parameters/task-impact-calculation.server";
import type {
  PublicParameterTraceNode,
  PublicTaskImpactTrace,
  PublicTraceSourceArtifact,
} from "@/lib/parameters/task-impact-trace";
import {
  canUserViewTask,
  TASK_NOT_FOUND_MESSAGE,
} from "@/lib/tasks/task-visibility.server";

export const runtime = "nodejs";

type RawTaskImpactTrace = Awaited<ReturnType<typeof getTaskImpactTrace>>;

function serializeSourceArtifact(
  sourceArtifact: {
    artifactType: string;
    contentHash: string | null;
    id: string;
    sourceKey: string;
    sourceRef: string | null;
    sourceSystem: string;
    sourceUrl: string | null;
    title: string | null;
    versionKey: string | null;
  },
): PublicTraceSourceArtifact {
  return {
    artifactType: sourceArtifact.artifactType,
    contentHash: sourceArtifact.contentHash,
    id: sourceArtifact.id,
    sourceKey: sourceArtifact.sourceKey,
    sourceRef: sourceArtifact.sourceRef,
    sourceSystem: sourceArtifact.sourceSystem,
    sourceUrl: sourceArtifact.sourceUrl,
    title: sourceArtifact.title,
    versionKey: sourceArtifact.versionKey,
  };
}

function serializeParameterTrace(
  revision: ParameterTraceNode,
): PublicParameterTraceNode {
  return {
    assumptionsJson: revision.assumptionsJson,
    calculationCode: revision.calculationCode,
    calculationLanguage: revision.calculationLanguage,
    confidence: revision.confidence,
    confidenceIntervalHigh: revision.confidenceIntervalHigh,
    confidenceIntervalLow: revision.confidenceIntervalLow,
    conservative: revision.conservative,
    currentRevisionId: revision.currentRevisionId,
    description: revision.description,
    displayName: revision.displayName,
    displayValue: revision.displayValue,
    formulaLatex: revision.formulaLatex,
    formulaText: revision.formulaText,
    id: revision.id,
    inputs: revision.inputs.map((input) => ({
      position: input.position,
      revision: serializeParameterTrace(input.revision),
      symbol: input.symbol,
    })),
    key: revision.key,
    manualRef: revision.manualRef,
    rationale: revision.rationale,
    revision: revision.revision,
    sourceArtifacts: revision.sourceArtifacts.map(serializeSourceArtifact),
    sourceContentHash: revision.sourceContentHash,
    sourceRef: revision.sourceRef,
    sourceType: revision.sourceType,
    stale: revision.stale,
    status: revision.status,
    unit: revision.unit,
    value: revision.value,
  };
}

function serializeTaskImpactTrace(
  trace: RawTaskImpactTrace,
): PublicTaskImpactTrace {
  return {
    estimate: {
      assumptionsJson: trace.assumptionsJson,
      calculationCode: trace.calculationCode,
      calculationLanguage: trace.calculationLanguage,
      calculationVersion: trace.calculationVersion,
      counterfactualKey: trace.counterfactualKey,
      estimateKind: trace.estimateKind,
      formulaLatex: trace.formulaLatex,
      formulaText: trace.formulaText,
      id: trace.id,
      methodologyKey: trace.methodologyKey,
      parameterSetHash: trace.parameterSetHash,
      publicationStatus: trace.publicationStatus,
      sourceSystem: trace.sourceSystem,
    },
    frames: trace.frames.map((frame) => ({
      estimatedCashCostUsdBase: frame.estimatedCashCostUsdBase,
      estimatedCashCostUsdHigh: frame.estimatedCashCostUsdHigh,
      estimatedCashCostUsdLow: frame.estimatedCashCostUsdLow,
      estimatedEffortHoursBase: frame.estimatedEffortHoursBase,
      estimatedEffortHoursHigh: frame.estimatedEffortHoursHigh,
      estimatedEffortHoursLow: frame.estimatedEffortHoursLow,
      evaluationHorizonYears: frame.evaluationHorizonYears,
      expectedDalysAvertedBase: frame.expectedDalysAvertedBase,
      expectedDalysAvertedHigh: frame.expectedDalysAvertedHigh,
      expectedDalysAvertedLow: frame.expectedDalysAvertedLow,
      expectedEconomicValueUsdBase: frame.expectedEconomicValueUsdBase,
      expectedEconomicValueUsdHigh: frame.expectedEconomicValueUsdHigh,
      expectedEconomicValueUsdLow: frame.expectedEconomicValueUsdLow,
      frameKey: frame.frameKey,
      frameSlug: frame.frameSlug,
      medianHealthyLifeYearsEffectBase:
        frame.medianHealthyLifeYearsEffectBase,
      medianHealthyLifeYearsEffectHigh:
        frame.medianHealthyLifeYearsEffectHigh,
      medianHealthyLifeYearsEffectLow: frame.medianHealthyLifeYearsEffectLow,
      medianIncomeGrowthEffectPpPerYearBase:
        frame.medianIncomeGrowthEffectPpPerYearBase,
      medianIncomeGrowthEffectPpPerYearHigh:
        frame.medianIncomeGrowthEffectPpPerYearHigh,
      medianIncomeGrowthEffectPpPerYearLow:
        frame.medianIncomeGrowthEffectPpPerYearLow,
      metrics: frame.metrics.map((metric) => ({
        baseValue: metric.baseValue,
        highValue: metric.highValue,
        lowValue: metric.lowValue,
        metricKey: metric.metricKey,
        unit: metric.unit,
      })),
      successProbabilityBase: frame.successProbabilityBase,
      successProbabilityHigh: frame.successProbabilityHigh,
      successProbabilityLow: frame.successProbabilityLow,
      timeToImpactStartDays: frame.timeToImpactStartDays,
    })),
    parameterTraces: trace.parameterTraces.map((parameterTrace) => ({
      revision: serializeParameterTrace(parameterTrace.revision),
      symbol: parameterTrace.symbol,
    })),
    sourceArtifacts: trace.sourceArtifacts.map(({ sourceArtifact }) =>
      serializeSourceArtifact(sourceArtifact),
    ),
    stale: trace.stale,
    staleInputs: trace.staleInputs,
    task: {
      id: trace.task.id,
      title: trace.task.title,
    },
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: taskId } = await context.params;
    const currentUser = await getCurrentUser(request, [
      McpScope.TASKS_PERSONAL,
      McpScope.TASKS_ADMIN,
    ]);
    const userId = currentUser?.id ?? null;
    if (!(await canUserViewTask(taskId, userId))) {
      return NextResponse.json(
        { error: "Task not found." },
        { status: 404 },
      );
    }

    const trace = await getTaskImpactTrace(
      { taskId },
      { isAdmin: currentUser?.isAdmin === true, userId },
    );
    return NextResponse.json(serializeTaskImpactTrace(trace), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (
      error instanceof Error &&
      (error.message === TASK_NOT_FOUND_MESSAGE ||
        error.message === "Task impact estimate not found.")
    ) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    console.error("[TASKS] Failed to fetch impact trace:", error);
    return NextResponse.json(
      { error: "Failed to fetch estimate calculation." },
      { status: 500 },
    );
  }
}
