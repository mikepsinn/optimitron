import { describe, expect, it } from "vitest";

import {
  getAllConditions,
  getAllTreatments,
  getConditionBySlug,
  getTreatmentBySlug,
  medicalNameToSlug,
  searchConditions,
  searchTreatments,
  getTreatmentForCondition,
  getTreatmentsByConditionSlug,
} from "../../datasets/medical";

describe("medical datasets", () => {
  it("loads migrated conditions from the DIH static dataset", () => {
    const conditions = getAllConditions();
    const asthma = getConditionBySlug("asthma");

    expect(conditions.length).toBeGreaterThan(100);
    expect(asthma?.name).toBe("Asthma");
    expect(searchConditions("asthma").map((condition) => condition.slug)).toContain(
      "asthma",
    );
  });

  it("loads aggregated treatments and resolves treatment detail slugs", () => {
    const treatments = getAllTreatments();
    const metformin = getTreatmentBySlug("metformin");

    expect(treatments.length).toBeGreaterThan(100);
    expect(metformin?.name).toBe("Metformin");
    expect(searchTreatments("metformin").map((treatment) => treatment.slug)).toContain(
      "metformin",
    );
  });

  it("loads detailed per-condition treatment files copied from DIH", async () => {
    const asthmaTreatments = await getTreatmentsByConditionSlug("asthma");
    const albuterol = await getTreatmentForCondition("asthma", "albuterol");

    expect(asthmaTreatments?.conditionName).toBe("Asthma");
    expect(albuterol?.name).toBe("Albuterol");
    expect(albuterol?.dosageRange).toBeTruthy();
    expect(albuterol?.sideEffects.length).toBeGreaterThan(0);
    expect(albuterol?.citations?.some((citation) =>
      citation.url.includes("clinicaltrials.gov"),
    )).toBe(true);
  });

  it("keeps medical slugification stable for client-side path helpers", () => {
    expect(medicalNameToSlug("Parkinson's disease")).toBe("parkinsons-disease");
    expect(medicalNameToSlug("Psychosocial Support & Counseling")).toBe(
      "psychosocial-support-counseling",
    );
  });
});
