import { scaleImpactFrameSummary, type TaskImpactFrameSummary } from "./impact";

export function getExplicitEdgeMarginalFrames(input: {
  edge: {
    probabilityDeltaBase?: number | null;
    timeDeltaDaysBase?: number | null;
  };
  estimatedEffortHours?: number | null;
  sourceTaskId: string;
  sourceTaskTitle: string;
  downstreamFrame: TaskImpactFrameSummary;
}) {
  const frames: TaskImpactFrameSummary[] = [];
  const probabilityDelta =
    typeof input.edge.probabilityDeltaBase === "number" &&
    Number.isFinite(input.edge.probabilityDeltaBase) &&
    input.edge.probabilityDeltaBase > 0 &&
    input.edge.probabilityDeltaBase <= 1
      ? input.edge.probabilityDeltaBase
      : null;
  const timeDeltaDays =
    typeof input.edge.timeDeltaDaysBase === "number" &&
    Number.isFinite(input.edge.timeDeltaDaysBase) &&
    input.edge.timeDeltaDaysBase > 0
      ? input.edge.timeDeltaDaysBase
      : null;
  const downstreamProbability =
    typeof input.downstreamFrame.successProbabilityBase === "number" &&
    Number.isFinite(input.downstreamFrame.successProbabilityBase) &&
    input.downstreamFrame.successProbabilityBase > 0 &&
    input.downstreamFrame.successProbabilityBase <= 1
      ? input.downstreamFrame.successProbabilityBase
      : null;

  if (probabilityDelta != null && downstreamProbability != null) {
    frames.push(
      scaleImpactFrameSummary(
        input.downstreamFrame,
        probabilityDelta / downstreamProbability,
        {
          customFrameLabel: `Probability-weighted downstream value unlocked by ${input.sourceTaskTitle}`,
          estimatedCashCostUsdBase: null,
          estimatedCashCostUsdHigh: null,
          estimatedCashCostUsdLow: null,
          estimatedEffortHoursBase: input.estimatedEffortHours ?? null,
          estimatedEffortHoursHigh: input.estimatedEffortHours ?? null,
          estimatedEffortHoursLow: input.estimatedEffortHours ?? null,
          frameSlug: `${input.downstreamFrame.frameSlug}-probability-delta-${input.sourceTaskId}`,
          successProbabilityBase: null,
          successProbabilityHigh: null,
          successProbabilityLow: null,
          metrics: [],
        },
      ),
    );
  }

  if (timeDeltaDays != null) {
    frames.push({
      ...input.downstreamFrame,
      customFrameLabel: `Time-accelerated downstream value unlocked by ${input.sourceTaskTitle}`,
      successProbabilityBase: null,
      successProbabilityHigh: null,
      successProbabilityLow: null,
      estimatedCashCostUsdBase: null,
      estimatedCashCostUsdHigh: null,
      estimatedCashCostUsdLow: null,
      estimatedEffortHoursBase:
        input.estimatedEffortHours ??
        input.downstreamFrame.estimatedEffortHoursBase ??
        null,
      estimatedEffortHoursHigh:
        input.estimatedEffortHours ??
        input.downstreamFrame.estimatedEffortHoursHigh ??
        null,
      estimatedEffortHoursLow:
        input.estimatedEffortHours ??
        input.downstreamFrame.estimatedEffortHoursLow ??
        null,
      expectedDalysAvertedBase:
        (input.downstreamFrame.delayDalysLostPerDayBase ?? 0) * timeDeltaDays,
      expectedDalysAvertedHigh:
        input.downstreamFrame.delayDalysLostPerDayHigh == null
          ? null
          : input.downstreamFrame.delayDalysLostPerDayHigh * timeDeltaDays,
      expectedDalysAvertedLow:
        input.downstreamFrame.delayDalysLostPerDayLow == null
          ? null
          : input.downstreamFrame.delayDalysLostPerDayLow * timeDeltaDays,
      expectedEconomicValueUsdBase:
        (input.downstreamFrame.delayEconomicValueUsdLostPerDayBase ?? 0) *
        timeDeltaDays,
      expectedEconomicValueUsdHigh:
        input.downstreamFrame.delayEconomicValueUsdLostPerDayHigh == null
          ? null
          : input.downstreamFrame.delayEconomicValueUsdLostPerDayHigh *
            timeDeltaDays,
      expectedEconomicValueUsdLow:
        input.downstreamFrame.delayEconomicValueUsdLostPerDayLow == null
          ? null
          : input.downstreamFrame.delayEconomicValueUsdLostPerDayLow *
            timeDeltaDays,
      frameSlug: `${input.downstreamFrame.frameSlug}-time-delta-${input.sourceTaskId}`,
      metrics: [],
    });
  }

  return frames;
}
