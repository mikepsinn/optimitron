import {
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  GLOBAL_REGISTERED_VOTERS,
  GLOBAL_WARHEAD_COUNT,
  HOURS_PER_YEAR,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  NUCLEAR_WINTER_WARHEAD_THRESHOLD,
  RARE_DISEASES_COUNT_GLOBAL,
  fmtParamValueOnly,
  type Parameter,
} from "@optimitron/data/parameters";

function roundToSigFigs(value: number, figures: number): number {
  if (value === 0) return 0;
  return Number(value.toPrecision(figures));
}

function createDerivedParameter(
  base: Parameter,
  overrides: Partial<Parameter> & Pick<Parameter, "parameterName" | "value">,
): Parameter {
  return {
    ...base,
    ...overrides,
    sourceType: overrides.sourceType ?? "calculated",
  };
}

export const FLOW_MAJORITY_OF_HUMANS_ON_EARTH: Parameter = createDerivedParameter(
  GLOBAL_REGISTERED_VOTERS,
  {
    value: roundToSigFigs(GLOBAL_REGISTERED_VOTERS.value, 1),
    parameterName: "FLOW_MAJORITY_OF_HUMANS_ON_EARTH",
    displayName: "Majority of humans on Earth",
    description:
      "Rounded visible majority-of-humanity target for the post-vote share flow.",
    formula: "roundToSigFigs(GLOBAL_REGISTERED_VOTERS, 1)",
    unit: "people",
  },
);

export const FLOW_DISEASES_WITHOUT_EFFECTIVE_TREATMENT_PCT: Parameter =
  createDerivedParameter(DISEASES_WITHOUT_EFFECTIVE_TREATMENT, {
    value:
      DISEASES_WITHOUT_EFFECTIVE_TREATMENT.value /
      RARE_DISEASES_COUNT_GLOBAL.value,
    parameterName: "FLOW_DISEASES_WITHOUT_EFFECTIVE_TREATMENT_PCT",
    displayName: "Diseases without effective treatment",
    description:
      "Share of rare diseases without an effective approved treatment, derived from untreated disease count divided by total rare disease count.",
    formula:
      "DISEASES_WITHOUT_EFFECTIVE_TREATMENT / RARE_DISEASES_COUNT_GLOBAL",
    unit: "percentage",
  });

export const FLOW_TOTAL_LIVES_SAVED: Parameter = createDerivedParameter(
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  {
    value: roundToSigFigs(
      DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED.value,
      3,
    ),
    parameterName: "FLOW_TOTAL_LIVES_SAVED",
    displayName: "Rounded total lives saved",
    description:
      "Rounded visible total lives saved used in the post-vote share-flow copy.",
    formula:
      "roundToSigFigs(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED, 3)",
  },
);

export const FLOW_TOTAL_SUFFERING_HOURS: Parameter = createDerivedParameter(
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS,
  {
    value: roundToSigFigs(
      DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS.value,
      3,
    ),
    parameterName: "FLOW_TOTAL_SUFFERING_HOURS",
    displayName: "Rounded total suffering hours prevented",
    description:
      "Rounded visible total suffering hours prevented used in the post-vote share-flow copy.",
    formula:
      "roundToSigFigs(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS, 3)",
  },
);

export const FLOW_VOTER_LIVES_SAVED: Parameter = createDerivedParameter(
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  {
    value:
      FLOW_TOTAL_LIVES_SAVED.value / FLOW_MAJORITY_OF_HUMANS_ON_EARTH.value,
    parameterName: "FLOW_VOTER_LIVES_SAVED",
    displayName: "Lives saved per vote",
    description:
      "Flow-visible lives saved per vote, using the rounded visible total and rounded visible majority-of-humanity denominator.",
    formula: "FLOW_TOTAL_LIVES_SAVED / FLOW_MAJORITY_OF_HUMANS_ON_EARTH",
    unit: "lives",
  },
);

export const FLOW_VOTER_LIVES_SAVED_ROUNDED: Parameter = createDerivedParameter(
  FLOW_VOTER_LIVES_SAVED,
  {
    value: roundToSigFigs(FLOW_VOTER_LIVES_SAVED.value, 2),
    parameterName: "FLOW_VOTER_LIVES_SAVED_ROUNDED",
    displayName: "Rounded lives saved per vote",
    description:
      "Rounded lives saved per vote for the post-vote impact and pending-score copy.",
    formula: "roundToSigFigs(FLOW_VOTER_LIVES_SAVED, 2)",
  },
);

export const FLOW_VOTER_SUFFERING_HOURS_PREVENTED: Parameter =
  createDerivedParameter(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS, {
    value:
      FLOW_TOTAL_SUFFERING_HOURS.value /
      FLOW_MAJORITY_OF_HUMANS_ON_EARTH.value,
    parameterName: "FLOW_VOTER_SUFFERING_HOURS_PREVENTED",
    displayName: "Suffering hours prevented per vote",
    description:
      "Flow-visible suffering hours prevented per vote, using the rounded visible total and rounded visible majority-of-humanity denominator.",
    formula: "FLOW_TOTAL_SUFFERING_HOURS / FLOW_MAJORITY_OF_HUMANS_ON_EARTH",
    unit: "hours",
  });

export const FLOW_VOTER_SUFFERING_YEARS_PREVENTED: Parameter =
  createDerivedParameter(FLOW_VOTER_SUFFERING_HOURS_PREVENTED, {
    value: FLOW_VOTER_SUFFERING_HOURS_PREVENTED.value / HOURS_PER_YEAR.value,
    parameterName: "FLOW_VOTER_SUFFERING_YEARS_PREVENTED",
    displayName: "Suffering years prevented per vote",
    description:
      "Flow-visible suffering years prevented per vote, derived from suffering hours divided by hours per year.",
    formula: "FLOW_VOTER_SUFFERING_HOURS_PREVENTED / HOURS_PER_YEAR",
    unit: "years",
  });

export const FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR: Parameter =
  createDerivedParameter(NUCLEAR_WINTER_OVERKILL_FACTOR, {
    value: Math.round(NUCLEAR_WINTER_OVERKILL_FACTOR.value),
    parameterName: "FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR",
    displayName: "Rounded nuclear apocalypse capacity",
    description:
      "Rounded count of nuclear-winter-scale destructive capacity in the global arsenal.",
    formula: "round(NUCLEAR_WINTER_OVERKILL_FACTOR)",
  });

export const FLOW_WASTEFUL_APOCALYPSES: Parameter = createDerivedParameter(
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  {
    value: Math.max(0, FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR.value - 1),
    parameterName: "FLOW_WASTEFUL_APOCALYPSES",
    displayName: "Wasteful apocalypse capacity after the first",
    description:
      "Rounded nuclear-winter-scale destructive capacity left over after the first planet-ruining threshold.",
    formula: "FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR - 1",
  },
);

export const FLOW_NUCLEAR_WINTER_WARHEAD_THRESHOLD: Parameter =
  createDerivedParameter(NUCLEAR_WINTER_WARHEAD_THRESHOLD, {
    value: Math.round(NUCLEAR_WINTER_WARHEAD_THRESHOLD.value),
    parameterName: "FLOW_NUCLEAR_WINTER_WARHEAD_THRESHOLD",
    displayName: "Nuclear winter warhead threshold",
    formula: "round(NUCLEAR_WINTER_WARHEAD_THRESHOLD)",
  });

export const FLOW_GLOBAL_WARHEAD_COUNT: Parameter = createDerivedParameter(
  GLOBAL_WARHEAD_COUNT,
  {
    value: roundToSigFigs(GLOBAL_WARHEAD_COUNT.value, 2),
    parameterName: "FLOW_GLOBAL_WARHEAD_COUNT",
    displayName: "Rounded global nuclear warhead count",
    formula: "roundToSigFigs(GLOBAL_WARHEAD_COUNT, 2)",
  },
);

export const FLOW_REFERRALS_PER_VOTER: Parameter = createDerivedParameter(
  FLOW_MAJORITY_OF_HUMANS_ON_EARTH,
  {
    value: 2,
    parameterName: "FLOW_REFERRALS_PER_VOTER",
    displayName: "Referrals per voter",
    description:
      "Binary referral target used in the treaty share-flow chain math.",
    formula: "binary referral chain branching factor",
    unit: "people",
  },
);

export const FLOW_DOUBLING_ROUNDS_TO_TARGET = Math.ceil(
  Math.log2(FLOW_MAJORITY_OF_HUMANS_ON_EARTH.value),
);

export const FLOW_DOUBLING_ROUNDS_TO_TARGET_PARAM: Parameter =
  createDerivedParameter(FLOW_MAJORITY_OF_HUMANS_ON_EARTH, {
    value: FLOW_DOUBLING_ROUNDS_TO_TARGET,
    parameterName: "FLOW_DOUBLING_ROUNDS_TO_TARGET",
    displayName: "Doubling rounds to reach humanity",
    description:
      "Rounded count of binary referral rounds needed to reach the majority-of-humanity target.",
    formula: "ceil(log2(FLOW_MAJORITY_OF_HUMANS_ON_EARTH))",
    unit: "rounds",
  });

export const FLOW_DOUBLING_MONTHS_AT_WEEKLY_PACE = Math.round(
  FLOW_DOUBLING_ROUNDS_TO_TARGET / 4,
);

export function formatFlowCompactNumber(value: number, figures = 3): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const suffixes: Array<[number, string]> = [
    [1e15, "Q"],
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];

  for (const [threshold, suffix] of suffixes) {
    if (abs >= threshold) {
      return `${sign}${Number((abs / threshold).toPrecision(figures))}${suffix}`;
    }
  }

  return `${sign}${Number(abs.toPrecision(figures)).toLocaleString("en-US")}`;
}

export function formatFlowCompactCurrency(param: Pick<Parameter, "value">, figures = 3) {
  return `$${formatFlowCompactNumber(param.value, figures)}`;
}

export function formatFlowCompactParam(param: Pick<Parameter, "value">, figures = 3) {
  return formatFlowCompactNumber(param.value, figures);
}

export function formatFlowWords(param: Parameter, figures = 3) {
  return fmtParamValueOnly(param, figures);
}
