import "../../../../data/src/generated/country-panel";
import { getCountryPanelLatest } from "@optimitron/data";
import { describe, expect, it } from "vitest";
import { buildFullTreatySignerSlots } from "./treaty-signer-roster";

describe("buildFullTreatySignerSlots", () => {
  it("expands the treaty roster to the modeled full signer set", () => {
    const slots = buildFullTreatySignerSlots(getCountryPanelLatest());

    expect(slots).toHaveLength(193);
    expect(slots.some((slot) => slot.countryIso3 === "VAT")).toBe(true);
    expect(slots.some((slot) => slot.countryIso3 === "TWN")).toBe(true);
    expect(slots.some((slot) => slot.countryIso3 === "XKX")).toBe(true);
    expect(slots.every((slot) => slot.countryCode.length === 2)).toBe(true);
    expect(slots.some((slot) => slot.countryIso3 === "CUW")).toBe(false);
    expect(slots.some((slot) => slot.countryIso3 === "FRO")).toBe(false);
  });

  it("pulls canonical office metadata from @optimitron/data", () => {
    const slots = buildFullTreatySignerSlots(getCountryPanelLatest());
    const unitedStates = slots.find((slot) => slot.countryName === "United States");

    expect(unitedStates?.countryCode).toBe("US");
    expect(unitedStates?.countryIso3).toBe("USA");
    expect(unitedStates?.contactUrl).toBe("https://www.whitehouse.gov/contact/");
    expect(unitedStates?.leaderSourceRef).toBe("wikidata:Q22686");
  });

  it("ranks the canonical roster by estimated impact", () => {
    const slots = buildFullTreatySignerSlots(getCountryPanelLatest());

    expect(slots[0]?.countryCode).toBe("US");
    expect(slots[1]?.militaryBudgetUsd ?? 0).toBeLessThanOrEqual(slots[0]?.militaryBudgetUsd ?? 0);
    expect(slots[19]?.militaryBudgetUsd ?? 0).toBeLessThanOrEqual(slots[18]?.militaryBudgetUsd ?? 0);
  });
});
