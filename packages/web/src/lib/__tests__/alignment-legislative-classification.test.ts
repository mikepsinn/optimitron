import { describe, expect, it } from "vitest";
import {
  classifyLegislativeBill,
  confidenceToSignalWeight,
  deriveCategorySupportSignal,
  inferLegislativeBudgetDirection,
} from "@/lib/alignment-legislative-classification";

describe("alignment legislative classification", () => {
  it("classifies an opioid treatment bill into addiction treatment", () => {
    const matches = classifyLegislativeBill({
      billId: "119-hr-1",
      title: "A bill to expand opioid treatment and recovery grants",
      subjects: ["Substance abuse treatment", "Behavioral health"],
      policyArea: "Health",
    });

    expect(matches[0]?.categoryId).toBe("ADDICTION_TREATMENT");
    expect(matches[0]?.confidence).toBe("high");
  });

  it("classifies detention funding into immigration enforcement", () => {
    const matches = classifyLegislativeBill({
      billId: "119-hr-2",
      title: "A bill to expand immigration detention center capacity",
      subjects: ["Immigration detention", "Border patrol"],
      policyArea: "Immigration",
    });

    expect(matches[0]?.categoryId).toBe("ICE_IMMIGRATION_ENFORCEMENT");
  });

  it("infers restrictive bills as category decreases", () => {
    expect(
      inferLegislativeBudgetDirection({
        billId: "119-s-12",
        title: "A bill to prohibit new fossil fuel drilling subsidies",
        subjects: ["Oil and gas"],
        policyArea: "Energy",
      }),
    ).toBe("decrease");
  });

  it("translates yes/no votes into category support signals", () => {
    expect(deriveCategorySupportSignal("Yea", "increase")).toBe(1);
    expect(deriveCategorySupportSignal("No", "increase")).toBe(-1);
    expect(deriveCategorySupportSignal("Yea", "decrease")).toBe(-1);
    expect(deriveCategorySupportSignal("Present", "increase")).toBe(0);
  });

  it("maps classification confidence to signal weights", () => {
    expect(confidenceToSignalWeight("high")).toBe(1);
    expect(confidenceToSignalWeight("medium")).toBe(0.8);
    expect(confidenceToSignalWeight("low")).toBe(0.6);
  });
});
