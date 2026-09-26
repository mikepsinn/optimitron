import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getPolicySample } from "./landing-data";
import { PolicyGeneratorTile } from "./PolicyGeneratorTile";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("policy preview with ungraded evidence", () => {
  it("renders the generated policy sample without inventing grades or confidence", () => {
    const sample = getPolicySample();
    expect(sample.policies.length).toBeGreaterThan(0);

    for (const policy of sample.policies) {
      const html = renderToStaticMarkup(
        <PolicyGeneratorTile policies={[policy]} total={sample.total} />,
      );
      expect(html).toContain('href="/opg"');
      expect(html).toContain(
        policy.evidenceKind === "comparison" ? "Country comparison" : "Policy proposal",
      );
      expect(html).not.toContain("Evidence grade");
      expect(html).not.toContain("Causal confidence");
      expect(html).not.toContain("NaN");
    }
  });
});
