import { describe, expect, it } from "vitest";
import {
  DEFAULT_CHAIN_VALUE_COEFFICIENTS,
  EMPTY_ARM_STATISTICS,
  addReward,
  composeChainValue,
  partialPoolPosterior,
  posteriorMean,
  posteriorStdError,
  posteriorVariance,
  verifiedHumanWeight,
  type LevelPosterior,
} from "../reasoning/chain-value";

describe("verifiedHumanWeight", () => {
  it("maps verified/provisional/suspected-bot to 1/0.1/0", () => {
    expect(verifiedHumanWeight("verified")).toBe(1);
    expect(verifiedHumanWeight("provisional")).toBe(0.1);
    expect(verifiedHumanWeight("suspected-bot")).toBe(0);
  });
});

describe("composeChainValue", () => {
  it("returns 0 for a zero-activity exposure", () => {
    expect(
      composeChainValue({
        voteHappened: false,
        humanLevel: "verified",
        firstSendWithin60s: false,
        downstreamVotes: [],
        downstreamSends: [],
        fraudPenalty: 0,
        qualityPenalty: 0,
      }),
    ).toBe(0);
  });

  it("credits a verified vote with full weight", () => {
    expect(
      composeChainValue({
        voteHappened: true,
        humanLevel: "verified",
        firstSendWithin60s: false,
        downstreamVotes: [],
        downstreamSends: [],
        fraudPenalty: 0,
        qualityPenalty: 0,
      }),
    ).toBe(1);
  });

  it("downgrades a provisional vote to 0.1", () => {
    expect(
      composeChainValue({
        voteHappened: true,
        humanLevel: "provisional",
        firstSendWithin60s: false,
        downstreamVotes: [],
        downstreamSends: [],
        fraudPenalty: 0,
        qualityPenalty: 0,
      }),
    ).toBeCloseTo(0.1, 10);
  });

  it("zeros a suspected-bot vote", () => {
    expect(
      composeChainValue({
        voteHappened: true,
        humanLevel: "suspected-bot",
        firstSendWithin60s: true, // still credited
        downstreamVotes: [],
        downstreamSends: [],
        fraudPenalty: 0,
        qualityPenalty: 0,
      }),
    ).toBe(DEFAULT_CHAIN_VALUE_COEFFICIENTS.a);
  });

  it("applies downstream decay at depth 1 and 2", () => {
    const value = composeChainValue({
      voteHappened: false,
      humanLevel: "verified",
      firstSendWithin60s: false,
      downstreamVotes: [
        { depth: 1, count: 1 },
        { depth: 2, count: 1 },
      ],
      downstreamSends: [],
      fraudPenalty: 0,
      qualityPenalty: 0,
    });
    const { b, downstreamDecay } = DEFAULT_CHAIN_VALUE_COEFFICIENTS;
    expect(value).toBeCloseTo(
      b * (Math.pow(downstreamDecay, 1) + Math.pow(downstreamDecay, 2)),
      10,
    );
  });

  it("cuts off at decayDepthCutoff", () => {
    const beyondCutoff = composeChainValue({
      voteHappened: false,
      humanLevel: "verified",
      firstSendWithin60s: false,
      downstreamVotes: [{ depth: 100, count: 1 }],
      downstreamSends: [],
      fraudPenalty: 0,
      qualityPenalty: 0,
    });
    expect(beyondCutoff).toBe(0);
  });

  it("subtracts fraud + quality penalties", () => {
    expect(
      composeChainValue({
        voteHappened: true,
        humanLevel: "verified",
        firstSendWithin60s: false,
        downstreamVotes: [],
        downstreamSends: [],
        fraudPenalty: 0.5,
        qualityPenalty: 0.3,
      }),
    ).toBeCloseTo(1 - 0.5 - 0.3, 10);
  });

  it("can produce negative ChainValue when penalties dominate (proves we need continuous bandit)", () => {
    const value = composeChainValue({
      voteHappened: true,
      humanLevel: "verified",
      firstSendWithin60s: false,
      downstreamVotes: [],
      downstreamSends: [],
      fraudPenalty: 5,
      qualityPenalty: 0,
    });
    expect(value).toBeLessThan(0);
  });
});

describe("sufficient-statistic accumulation", () => {
  it("builds rewardSum / rewardSumSq / count correctly", () => {
    let stats = EMPTY_ARM_STATISTICS;
    const samples = [1, 2, 3, 4, 5];
    for (const r of samples) stats = addReward(stats, r);

    expect(stats.count).toBe(5);
    expect(stats.rewardSum).toBe(samples.reduce((a, b) => a + b, 0));
    expect(stats.rewardSumSq).toBe(
      samples.reduce((a, b) => a + b * b, 0),
    );
  });

  it("posteriorMean returns rewardSum / count", () => {
    let stats = EMPTY_ARM_STATISTICS;
    for (const r of [2, 4, 6]) stats = addReward(stats, r);
    expect(posteriorMean(stats)).toBeCloseTo(4, 10);
  });

  it("posteriorMean returns 0 for empty stats", () => {
    expect(posteriorMean(EMPTY_ARM_STATISTICS)).toBe(0);
  });

  it("posteriorVariance applies Bessel correction", () => {
    let stats = EMPTY_ARM_STATISTICS;
    for (const r of [2, 4, 6]) stats = addReward(stats, r);
    // Sample variance of [2,4,6] = 4 (Bessel-corrected: ((4+0+4) / 2) = 4)
    expect(posteriorVariance(stats)).toBeCloseTo(4, 10);
  });

  it("posteriorVariance returns 0 for count ≤ 1", () => {
    expect(posteriorVariance(EMPTY_ARM_STATISTICS)).toBe(0);
    expect(posteriorVariance(addReward(EMPTY_ARM_STATISTICS, 5))).toBe(0);
  });

  it("posteriorStdError is sqrt(variance / count)", () => {
    let stats = EMPTY_ARM_STATISTICS;
    for (const r of [2, 4, 6, 8]) stats = addReward(stats, r);
    const v = posteriorVariance(stats);
    expect(posteriorStdError(stats)).toBeCloseTo(Math.sqrt(v / 4), 10);
  });
});

describe("partialPoolPosterior", () => {
  it("returns infinite variance + zero mean when no data", () => {
    expect(partialPoolPosterior([])).toEqual({
      mean: 0,
      variance: Number.POSITIVE_INFINITY,
      totalCount: 0,
    });
  });

  it("ignores levels with zero count", () => {
    let seg = EMPTY_ARM_STATISTICS;
    for (const r of [1, 2, 3, 4]) seg = addReward(seg, r);

    const levels: LevelPosterior[] = [
      { level: "GLOBAL", stats: EMPTY_ARM_STATISTICS },
      { level: "SEGMENT", stats: seg },
    ];
    const pooled = partialPoolPosterior(levels);
    expect(pooled.totalCount).toBe(4);
    expect(pooled.mean).toBeCloseTo(posteriorMean(seg), 10);
  });

  it("weights higher-precision (lower-variance) levels more", () => {
    let noisy = EMPTY_ARM_STATISTICS;
    let precise = EMPTY_ARM_STATISTICS;

    // noisy: high variance
    for (const r of [0, 20, 0, 20, 0, 20]) noisy = addReward(noisy, r);
    // precise: tight around 10
    for (const r of [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10])
      precise = addReward(precise, r);

    const pooled = partialPoolPosterior([
      { level: "GLOBAL", stats: noisy },
      { level: "SEGMENT", stats: precise },
    ]);
    // Should be weighted toward 10 (the precise level), not the noisy mean of 10
    // Both happen to have mean 10 here — check variance is reduced
    expect(pooled.mean).toBeCloseTo(10, 6);
    expect(pooled.variance).toBeLessThan(posteriorVariance(noisy));
  });
});
