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
    <div className="border-l-4 border-primary bg-muted/40 p-3 text-sm font-bold">
      <p className="font-black uppercase text-xs tracking-[0.14em] mb-1">
        Five-year horizon
      </p>
      <p>
        ${monthlyAmountUsd.toLocaleString()}/mo × {HORIZON_MONTHS} months ={" "}
        <strong>${totalDollars.toLocaleString()}</strong> →{" "}
        <strong>{lives.toFixed(1)} lives</strong> and{" "}
        <strong>{Math.round(dalys).toLocaleString()} healthy life-years</strong>.
      </p>
      <p className="text-xs mt-1 opacity-70">
        Risk-adjusted at{" "}
        {(POLITICAL_SUCCESS_PROBABILITY.value * 100).toFixed(0)}% success
        probability (Wishonia&apos;s skeptical default; the conditional-success
        figure is roughly{" "}
        {Math.round(1 / POLITICAL_SUCCESS_PROBABILITY.value).toLocaleString()}x
        higher).
      </p>
    </div>
  );
}
