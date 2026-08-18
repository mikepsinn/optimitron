import {
  POLITICAL_SUCCESS_PROBABILITY,
  THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION,
  TREATY_REDUCTION_PCT,
} from "@optimitron/data/parameters";
import { deriveDonationImpact } from "./donation-impact-calc";

const HORIZON_MONTHS = 60;
const SKEPTICAL_INPUTS = {
  votesNeeded: THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION.value,
  costPerVote: 2,
  successProbability: POLITICAL_SUCCESS_PROBABILITY.value,
  treatyReductionPct: TREATY_REDUCTION_PCT.value,
};

const skepticalImpact = deriveDonationImpact(SKEPTICAL_INPUTS);
const livesPerDollar =
  skepticalImpact.livesSaved / skepticalImpact.campaignCostUsd;
const dalysPerDollar = skepticalImpact.dalys / skepticalImpact.campaignCostUsd;

interface Props {
  monthlyAmountUsd: number;
}

export function MonthlyLifetimeImpact({ monthlyAmountUsd }: Props) {
  if (monthlyAmountUsd < 1) return null;
  const totalDollars = monthlyAmountUsd * HORIZON_MONTHS;
  const lives = totalDollars * livesPerDollar;
  const dalys = totalDollars * dalysPerDollar;

  return (
    <div className="border border-black p-3 text-sm leading-6">
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em]">
        Five-year horizon
      </p>
      <p>
        ${monthlyAmountUsd.toLocaleString()}/mo × {HORIZON_MONTHS} months ={" "}
        <strong>${totalDollars.toLocaleString()}</strong> →{" "}
        <strong>{lives.toFixed(1)} lives</strong> and{" "}
        <strong>{Math.round(dalys).toLocaleString()} healthy life-years</strong>.
      </p>
      <p className="mt-1 text-xs text-neutral-600">
        Risk-adjusted at{" "}
        {(POLITICAL_SUCCESS_PROBABILITY.value * 100).toFixed(0)}% success
        probability. The conditional-success figure is roughly{" "}
        {Math.round(1 / POLITICAL_SUCCESS_PROBABILITY.value).toLocaleString()}x
        higher.
      </p>
    </div>
  );
}
