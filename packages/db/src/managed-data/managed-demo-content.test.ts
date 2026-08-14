import { describe, expect, it } from "vitest";
import { MANAGED_DEMO_VISIBLE_CONTENT } from "./managed-demo-content.js";

describe("managed demo content privacy", () => {
  it("labels every public-facing fixture value as synthetic demo data", () => {
    const searchableLabels = [
      MANAGED_DEMO_VISIBLE_CONTENT.collectionDescription,
      MANAGED_DEMO_VISIBLE_CONTENT.collectionName,
      MANAGED_DEMO_VISIBLE_CONTENT.documentTitle,
      ...MANAGED_DEMO_VISIBLE_CONTENT.records.map((record) => record.name),
    ];

    for (const label of searchableLabels) {
      expect(label).toMatch(/\b(?:demo|synthetic)\b/i);
    }
  });

  it("does not restore the private-inspired fixture that reached public screenshots", () => {
    expect(JSON.stringify(MANAGED_DEMO_VISIBLE_CONTENT)).not.toMatch(
      /Vaultanium|Autonomous Public Goods|on-premises agent|\bTom\b/i,
    );
  });
});
