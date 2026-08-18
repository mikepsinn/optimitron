import { describe, expect, it } from "vitest";
import ConditionsRoute from "@/app/conditions/page";
import AgencyConditionsRoute from "@/app/agencies/dfda/conditions/page";
import ConditionRoute from "@/app/conditions/[conditionSlug]/page";
import AgencyConditionRoute from "@/app/agencies/dfda/conditions/[conditionSlug]/page";
import ConditionTreatmentRoute from "@/app/conditions/[conditionSlug]/treatments/[treatmentSlug]/page";
import AgencyConditionTreatmentRoute from "@/app/agencies/dfda/conditions/[conditionSlug]/treatments/[treatmentSlug]/page";
import TreatmentsRoute from "@/app/treatments/page";
import AgencyTreatmentsRoute from "@/app/agencies/dfda/treatments/page";
import TreatmentRoute from "@/app/treatments/[treatmentSlug]/page";
import AgencyTreatmentRoute from "@/app/agencies/dfda/treatments/[treatmentSlug]/page";
import {
  ConditionPage,
  ConditionsPage,
  ConditionTreatmentPage,
  TreatmentPage,
  TreatmentsPage,
} from "@/components/medical/medical-pages";

describe("medical page DIH parity", () => {
  it("keeps the short and agency-scoped condition routes on the same components", () => {
    expect(ConditionsRoute).toBe(ConditionsPage);
    expect(AgencyConditionsRoute).toBe(ConditionsPage);
    expect(ConditionRoute).toBe(ConditionPage);
    expect(AgencyConditionRoute).toBe(ConditionPage);
    expect(ConditionTreatmentRoute).toBe(ConditionTreatmentPage);
    expect(AgencyConditionTreatmentRoute).toBe(ConditionTreatmentPage);
  });

  it("keeps the short and agency-scoped treatment routes on the same components", () => {
    expect(TreatmentsRoute).toBe(TreatmentsPage);
    expect(AgencyTreatmentsRoute).toBe(TreatmentsPage);
    expect(TreatmentRoute).toBe(TreatmentPage);
    expect(AgencyTreatmentRoute).toBe(TreatmentPage);
  });
});
