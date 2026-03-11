import { describe, expect, it } from "vitest";
import { getPersonhoodProviderLabel } from "../personhood";

describe("personhood labels", () => {
  it("returns a provider label for known providers", () => {
    expect(getPersonhoodProviderLabel("WORLD_ID")).toBe("World ID");
    expect(getPersonhoodProviderLabel("HUMAN_PASSPORT")).toBe("Human Passport");
  });

  it("falls back to the unverified label", () => {
    expect(getPersonhoodProviderLabel(null)).toBe("Unverified");
  });
});
