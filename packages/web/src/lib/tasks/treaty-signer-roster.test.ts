import "../../../../data/src/generated/country-panel";
import { getCountryPanelLatest } from "@optimitron/data";
import { describe, expect, it } from "vitest";
import { buildFullTreatySignerSlots } from "./treaty-signer-roster";

describe("buildFullTreatySignerSlots", () => {
  it("expands the treaty roster to the modeled full signer set", () => {
    const slots = buildFullTreatySignerSlots(getCountryPanelLatest());

    expect(slots).toHaveLength(195);
    expect(slots.some((slot) => slot.countryCode === "VAT")).toBe(true);
    expect(slots.some((slot) => slot.countryCode === "TWN")).toBe(true);
    expect(slots.some((slot) => slot.countryCode === "XKX")).toBe(true);
  });

  it("preserves curated metadata overrides on the canonical roster", () => {
    const slots = buildFullTreatySignerSlots(getCountryPanelLatest());
    const unitedStates = slots.find((slot) => slot.countryName === "United States");

    expect(unitedStates?.countryCode).toBe("US");
    expect(unitedStates?.contactUrl).toBe("https://www.whitehouse.gov/contact/");
    expect(unitedStates?.decisionMakerLabel).toBe("President of the United States");
  });

  it("ranks the canonical roster by estimated impact", () => {
    const slots = buildFullTreatySignerSlots(getCountryPanelLatest());

    expect(slots[0]?.countryCode).toBe("US");
    expect(slots[1]?.militaryBudgetUsd ?? 0).toBeLessThanOrEqual(slots[0]?.militaryBudgetUsd ?? 0);
    expect(slots[19]?.militaryBudgetUsd ?? 0).toBeLessThanOrEqual(slots[18]?.militaryBudgetUsd ?? 0);
  });
});
