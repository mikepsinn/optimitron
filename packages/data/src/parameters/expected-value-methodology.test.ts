import { describe, expect, it } from "vitest";
import { EXPECTED_VALUE_METHODOLOGY_MARKDOWN } from "./expected-value-methodology";

describe("expected value methodology", () => {
  it("describes current task estimates as overlapping success scenarios", () => {
    expect(EXPECTED_VALUE_METHODOLOGY_MARKDOWN).toContain(
      "Task scenario expected value = stated outcome value if the task succeeds × P(success | task funded or done)",
    );
    expect(EXPECTED_VALUE_METHODOLOGY_MARKDOWN).toContain(
      "They do not estimate the value caused by the task alone.",
    );
    expect(EXPECTED_VALUE_METHODOLOGY_MARKDOWN).toMatch(
      /Their estimates\s+overlap\. Do not add them\./,
    );
  });

  it("writes the disease mission value in quadrillions", () => {
    expect(EXPECTED_VALUE_METHODOLOGY_MARKDOWN).toContain("$1.1 quadrillion");
    expect(EXPECTED_VALUE_METHODOLOGY_MARKDOWN).not.toContain("$1.1Q");
  });

  it("separates comparable mission values from reference context", () => {
    expect(EXPECTED_VALUE_METHODOLOGY_MARKDOWN).toContain(
      "Worked mission scenario: ending poverty",
    );
    expect(EXPECTED_VALUE_METHODOLOGY_MARKDOWN).toContain(
      "Reference scenario: preventing extinction",
    );
    expect(EXPECTED_VALUE_METHODOLOGY_MARKDOWN).toContain(
      "Funding context: minimizing animal suffering",
    );
    expect(EXPECTED_VALUE_METHODOLOGY_MARKDOWN).toMatch(
      /task tree therefore leaves this mission value empty\./,
    );
    expect(EXPECTED_VALUE_METHODOLOGY_MARKDOWN).toContain(
      "It does not mean one\nchicken life equals 0.332 human lives.",
    );
  });
});
