import { describe, expect, it } from "vitest";
import {
  alzheimers,
  treatmentOutcomeCategories,
  type TreatmentEstimate,
} from "../../components/present/patient-journey/alzheimers";

const values = (treatment: TreatmentEstimate) => treatmentOutcomeCategories(treatment)[0].items.map(item => item.value);
const withOutcome = (percentageChange: number | null, absoluteChange: string | null): TreatmentEstimate => ({
  name: "Test", slug: "test", effectiveness: 0, safetyScore: 0, timeToEffect: null, annualCost: null,
  primaryOutcomes: [{ name: "Score", percentageChange, absoluteChange }], secondaryOutcomes: [], sideEffects: [],
});

describe("treatmentOutcomeCategories", () => {
  // A positive percentage beside "less ... compared to placebo" is slowed decline, not a rise.
  it("spells out lecanemab's placebo comparisons from its FDA label and keeps its scan result", () => {
    const lecanemab = alzheimers.treatments.find(treatment => treatment.slug === "lecanemab")!;
    expect(values(lecanemab)).toEqual([
      { absolute: "27% less decline than placebo (-0.45 points)" },
      { absolute: "26% less decline than placebo (-1.44 points)" },
      { absolute: "37% less decline than placebo (+2.0 points)" },
      { percentage: null, absolute: "-59.1 Centiloids compared with placebo" },
    ]);
  });

  it.each([
    ["a negative percentage", -8, "-2 points (less decline compared to placebo over 18 months)"],
    ["a zero percentage", 0, "-2 points (less decline compared to placebo over 18 months)"],
    ["a change not measured against placebo", 12, "+3 points from baseline"],
    ["no absolute change", 12, null],
  ])("keeps the plain percentage for %s", (_, percentageChange, absoluteChange) => {
    expect(values(withOutcome(percentageChange, absoluteChange))).toEqual([
      { percentage: percentageChange, absolute: absoluteChange ?? undefined },
    ]);
  });
});
