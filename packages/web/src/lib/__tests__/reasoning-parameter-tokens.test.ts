import { describe, expect, it } from "vitest";
import {
  extractParameterTokenNames,
  isKnownParameterName,
  stripParameterTokens,
} from "../reasoning/parameter-tokens";

describe("parameter tokens", () => {
  it("extracts parameter names from reasoning copy", () => {
    expect(
      extractParameterTokenNames(
        "Redirect {TREATY_REDUCTION_PCT} of spending (${TREATY_ANNUAL_FUNDING}).",
      ),
    ).toEqual(["TREATY_REDUCTION_PCT", "TREATY_ANNUAL_FUNDING"]);
  });

  it("recognizes known parameter names", () => {
    expect(isKnownParameterName("TREATY_ANNUAL_FUNDING")).toBe(true);
    expect(isKnownParameterName("NOT_A_REAL_PARAMETER")).toBe(false);
  });

  it("strips tokens before hardcoded-number scanning", () => {
    expect(
      stripParameterTokens(
        "{DISEASES_WITHOUT_EFFECTIVE_TREATMENT} diseases clear in {STATUS_QUO_QUEUE_CLEARANCE_YEARS} years.",
      ),
    ).toBe(" diseases clear in  years.");
  });
});

