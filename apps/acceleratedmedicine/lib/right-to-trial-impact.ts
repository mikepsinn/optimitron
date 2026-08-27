import {
  DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  EVENTUALLY_AVOIDABLE_DALY_PCT,
  EVENTUALLY_AVOIDABLE_DEATH_PCT,
  GLOBAL_ANNUAL_DALY_BURDEN,
  GLOBAL_DISEASE_DEATHS_DAILY,
  NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
  STATE_RTT_PHILANTHROPIC_COST_TOTAL,
  STATE_RTT_TREATMENT_DISCOVERY_MULTIPLIER,
  STATUS_QUO_AVG_YEARS_TO_FIRST_TREATMENT,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
} from "@optimitron/data/parameters";

export const RIGHT_TO_TRIAL_IMPACT_PAPER_URL =
  "https://rtt-impact.acceleratedmedicine.org/";

export const RIGHT_TO_TRIAL_CALCULATIONS_URL =
  "https://rtt-impact.acceleratedmedicine.org/knowledge/appendix/parameters-and-calculations.html";

export const RIGHT_TO_TRIAL_DEFAULT_TRIAL_BUDGET = 1_000_000;

const discoveryInterval =
  STATE_RTT_TREATMENT_DISCOVERY_MULTIPLIER.confidenceInterval ?? [1.1, 15];

export const RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_MIN = discoveryInterval[0];
export const RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_MAX = discoveryInterval[1];
export const RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_DEFAULT =
  STATE_RTT_TREATMENT_DISCOVERY_MULTIPLIER.value;

export interface RightToTrialImpact {
  averageWaitYears: number;
  costPerDaly: number;
  dalysAverted: number;
  firstTreatmentsPerYear: number;
  livesSaved: number;
  multiplier: number;
  queueYears: number;
  yearsEarlier: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function calculateRightToTrialImpact(
  requestedMultiplier: number,
): RightToTrialImpact {
  const multiplier = clamp(
    requestedMultiplier,
    RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_MIN,
    RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_MAX,
  );
  const averageWaitYears =
    STATUS_QUO_AVG_YEARS_TO_FIRST_TREATMENT.value / multiplier;
  const yearsEarlier =
    STATUS_QUO_AVG_YEARS_TO_FIRST_TREATMENT.value - averageWaitYears;
  const firstTreatmentsPerYear =
    NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR.value * multiplier;
  const queueYears =
    DISEASES_WITHOUT_EFFECTIVE_TREATMENT.value / firstTreatmentsPerYear;
  const livesSaved =
    GLOBAL_DISEASE_DEATHS_DAILY.value *
    365 *
    EVENTUALLY_AVOIDABLE_DEATH_PCT.value *
    yearsEarlier;
  const dalysAverted =
    GLOBAL_ANNUAL_DALY_BURDEN.value *
    EVENTUALLY_AVOIDABLE_DALY_PCT.value *
    yearsEarlier;

  return {
    averageWaitYears,
    costPerDaly: STATE_RTT_PHILANTHROPIC_COST_TOTAL.value / dalysAverted,
    dalysAverted,
    firstTreatmentsPerYear,
    livesSaved,
    multiplier,
    queueYears,
    yearsEarlier,
  };
}

export interface TrialBudgetComparison {
  budget: number;
  conventionalParticipants: number;
  costReductionMultiplier: number;
  pragmaticParticipants: number;
}

export function calculateTrialBudgetComparison(
  requestedBudget: number,
): TrialBudgetComparison {
  const budget = Math.max(0, requestedBudget);

  return {
    budget,
    conventionalParticipants: Math.floor(
      budget / TRADITIONAL_PHASE3_COST_PER_PATIENT.value,
    ),
    costReductionMultiplier:
      TRADITIONAL_PHASE3_COST_PER_PATIENT.value /
      DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT.value,
    pragmaticParticipants: Math.floor(
      budget / DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT.value,
    ),
  };
}

export const RIGHT_TO_TRIAL_SOURCE_PARAMETERS = {
  annualDalyBurden: GLOBAL_ANNUAL_DALY_BURDEN,
  dailyDiseaseDeaths: GLOBAL_DISEASE_DEATHS_DAILY,
  diseasesWithoutTreatment: DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  eventuallyAvoidableDalyShare: EVENTUALLY_AVOIDABLE_DALY_PCT,
  eventuallyAvoidableDeathShare: EVENTUALLY_AVOIDABLE_DEATH_PCT,
  firstTreatmentsPerYear: NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
  launchCost: STATE_RTT_PHILANTHROPIC_COST_TOTAL,
  pragmaticCostPerPatient: DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  statusQuoAverageWait: STATUS_QUO_AVG_YEARS_TO_FIRST_TREATMENT,
  traditionalCostPerPatient: TRADITIONAL_PHASE3_COST_PER_PATIENT,
  treatmentDiscoveryMultiplier: STATE_RTT_TREATMENT_DISCOVERY_MULTIPLIER,
} as const;
