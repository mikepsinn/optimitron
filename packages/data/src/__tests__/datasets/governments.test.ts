import { describe, expect, it } from "vitest";
import { GOVERNMENTS } from "../../datasets/government-report-cards";
import {
  getGovernment,
  getGovernmentByIso3,
  getGovernmentProfile,
  listGovernments,
} from "../../datasets/governments";

describe("governments dataset", () => {
  it("keeps government codes and iso3 mappings unique", () => {
    const governments = listGovernments();
    const codes = governments.map((government) => government.code);
    const iso3 = governments
      .map((government) => government.iso3)
      .filter((governmentIso3): governmentIso3 is string => governmentIso3 != null);

    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(iso3).size).toBe(iso3.length);
  });

  it("resolves every report-card government to a canonical government record", () => {
    for (const metrics of GOVERNMENTS) {
      const government = getGovernment(metrics.code);
      expect(government).not.toBeNull();
      expect(government?.code).toBe(metrics.code);
      expect(government?.countryName.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("joins leader and metrics data for known countries", () => {
    const unitedStates = getGovernmentProfile("US");
    const germany = getGovernmentProfile("DE");
    const unitedKingdom = getGovernmentProfile("GB");

    expect(unitedStates?.leader?.leaderName).toBe("Donald Trump");
    expect(unitedStates?.metrics?.flag).toBe("🇺🇸");
    expect(germany?.leader?.leaderName).toBe("Friedrich Merz");
    expect(unitedKingdom?.leader?.leaderName).toBe("Keir Starmer");
  });

  it("resolves curated office metadata by iso3", () => {
    const unitedStates = getGovernmentByIso3("USA");
    const canada = getGovernmentByIso3("CAN");

    expect(unitedStates?.office.contactUrl).toBe("https://www.whitehouse.gov/contact/");
    expect(canada?.office.contactEmail).toBe("pm@pm.gc.ca");
  });

  it("covers non-report-card governments with canonical code and display-name fallbacks", () => {
    const denmark = getGovernment("DK");
    const israel = getGovernment("IL");
    const syria = getGovernmentByIso3("SYR");

    expect(denmark?.iso3).toBe("DNK");
    expect(denmark?.countryName).toBe("Denmark");
    expect(israel?.countryName).toBe("Israel");
    expect(syria?.code).toBe("SY");
    expect(syria?.countryName).toBe("Syria");
  });

  it("keeps the canonical government registry generic rather than treaty-branded", () => {
    const registryJson = JSON.stringify(listGovernments());

    expect(registryJson.toLowerCase()).not.toContain("treaty");
    expect(registryJson.toLowerCase()).not.toContain("signer");
  });
});
