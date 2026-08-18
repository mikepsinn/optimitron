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

    expect(matches[0]?.categoryId).toBe("ICE_CRIMINAL_DEPORTATION");
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

    expect(matches[0]?.categoryId).toBe("ICE_CRIMINAL_DEPORTATION");
  });

  it("classifies comparative-effectiveness research appropriations into pragmatic clinical trials", () => {
    const matches = classifyLegislativeBill({
      billId: "119-hr-44",
      title: "A bill to fund the Agency for Healthcare Research and Quality and PCORI comparative effectiveness studies",
      subjects: ["Health services research", "Medical research"],
      policyArea: "Health",
    });

    expect(matches[0]?.categoryId).toBe("PRAGMATIC_CLINICAL_TRIALS");
    expect(matches[0]?.confidence).toBe("high");
  });

  it("classifies crop-insurance support into agribusiness subsidies", () => {
    const matches = classifyLegislativeBill({
      billId: "119-s-88",
      title: "A bill to expand federal crop insurance and commodity credit corporation support",
      subjects: ["Crop insurance", "Commodity programs"],
      policyArea: "Agriculture and Food",
    });

    expect(matches[0]?.categoryId).toBe("FARM_SUBSIDIES_AGRIBUSINESS");
  });

  it("classifies plutonium-pit and sentinel funding into nuclear weapons modernization", () => {
    const matches = classifyLegislativeBill({
      billId: "119-hjres-18",
      title: "A joint resolution to accelerate Sentinel ICBM and plutonium pit production",
      subjects: ["Strategic forces", "National nuclear security administration"],
      policyArea: "Armed Forces and National Security",
    });

    expect(matches[0]?.categoryId).toBe("NUCLEAR_WEAPONS_MODERNIZATION");
    expect(matches[0]?.confidence).toBe("high");
  });

  it("classifies bureau of prisons expansion into prison construction and operations", () => {
    const matches = classifyLegislativeBill({
      billId: "119-s-203",
      title: "A bill to expand Bureau of Prisons staffing and federal prison construction",
      subjects: ["Correctional facilities", "Detention facilities"],
      policyArea: "Crime and Law Enforcement",
    });

    expect(matches[0]?.categoryId).toBe("VIOLENT_CRIME_INCARCERATION");
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
