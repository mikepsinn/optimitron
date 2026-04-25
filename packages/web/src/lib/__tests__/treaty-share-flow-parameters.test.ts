import { describe, expect, it } from "vitest";
import {
  DFDA_PATIENTS_FUNDABLE_ANNUALLY,
  DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  TREATY_ANNUAL_FUNDING,
  TREATY_REDUCTION_PCT,
} from "@optimitron/data/parameters";
import {
  FLOW_MAJORITY_OF_HUMANS_ON_EARTH,
  FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR,
  FLOW_TOTAL_LIVES_SAVED,
  FLOW_TOTAL_SUFFERING_HOURS,
  FLOW_VOTER_LIVES_SAVED,
  FLOW_VOTER_LIVES_SAVED_ROUNDED,
  FLOW_VOTER_SUFFERING_HOURS_PREVENTED,
  FLOW_VOTER_SUFFERING_YEARS_PREVENTED,
  formatFlowCompactCurrency,
  formatFlowCompactParam,
  formatFlowWords,
} from "@/lib/treaty-share-flow-parameters";

describe("treaty share flow parameter display values", () => {
  it("derives the visible v13 flow values from canonical parameters", () => {
    expect(formatFlowWords(FLOW_MAJORITY_OF_HUMANS_ON_EARTH, 1)).toBe("4 billion");
    expect(formatFlowWords(FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR, 3)).toBe("122");
    expect(formatFlowWords(TREATY_REDUCTION_PCT, 1)).toBe("1%");
    expect(formatFlowWords(STATUS_QUO_QUEUE_CLEARANCE_YEARS, 3)).toBe("443");
    expect(formatFlowWords(DFDA_QUEUE_CLEARANCE_YEARS, 2)).toBe("36");
    expect(formatFlowWords(DFDA_TRIAL_CAPACITY_MULTIPLIER, 2)).toBe("12");
    expect(formatFlowWords(FLOW_TOTAL_LIVES_SAVED, 3)).toBe("10.7 billion");
    expect(formatFlowWords(FLOW_TOTAL_SUFFERING_HOURS, 3)).toBe("1.93 quadrillion");
    expect(formatFlowWords(FLOW_VOTER_LIVES_SAVED, 4)).toBe("2.675");
    expect(formatFlowWords(FLOW_VOTER_LIVES_SAVED_ROUNDED, 2)).toBe("2.7");
    expect(formatFlowWords(FLOW_VOTER_SUFFERING_HOURS_PREVENTED, 4)).toBe("482,500");
    expect(formatFlowWords(FLOW_VOTER_SUFFERING_YEARS_PREVENTED, 2)).toBe("55");
  });

  it("formats exact compact strings used in the documented copy", () => {
    expect(formatFlowCompactCurrency(TREATY_ANNUAL_FUNDING, 3)).toBe("$27.2B");
    expect(formatFlowCompactCurrency(GLOBAL_MILITARY_SPENDING_ANNUAL_2024, 3)).toBe("$2.72T");
    expect(formatFlowCompactParam(DFDA_PATIENTS_FUNDABLE_ANNUALLY, 2)).toBe("23M");
    expect(formatFlowCompactCurrency(DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT, 3)).toBe("$929");
    expect(formatFlowCompactCurrency(TRADITIONAL_PHASE3_COST_PER_PATIENT, 2)).toBe("$41K");
  });
});
