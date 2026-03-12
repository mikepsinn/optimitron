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

  it("does not misclassify unrelated justice language as immigration enforcement", () => {
    const matches = classifyLegislativeBill({
      billId: "119-hjres-1",
      title: "A bill to keep the Supreme Court at nine justices",
      subjects: ["Constitution and constitutional amendments", "Judges", "Supreme Court"],
      policyArea: "Law",
    });

    expect(matches).toEqual([]);
  });

  it("does not treat broad science policy labels as enough evidence for clinical-trial spending", () => {
    const matches = classifyLegislativeBill({
      billId: "119-sjres-7",
      title: "A joint resolution about the Homework Gap Through the E-Rate Program",
      subjects: ["Educational technology and distance education", "School administration"],
      policyArea: "Science, Technology, Communications",
    });

    expect(matches).toEqual([]);
  });

  it("classifies sanctuary-city style immigration bills without relying on the standalone term ice", () => {
    const matches = classifyLegislativeBill({
      billId: "119-hr-205",
      title: "No Congressional Funds for Sanctuary Cities Act",
      subjects: ["Border security and unlawful immigration", "Detention of persons"],
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

  it("treats disapproval of a foreign military sale as a military decrease signal", () => {
    expect(
      inferLegislativeBudgetDirection({
        billId: "119-sjres-26",
        title:
          "A joint resolution providing for congressional disapproval of the proposed foreign military sale to Israel of certain defense articles and services.",
        subjects: [],
        policyArea: "International Affairs",
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
