import { describe, expect, it } from "vitest";
import { generateRandomPlayerName } from "@/lib/user-identity.server";

describe("generateRandomPlayerName", () => {
  it("returns a string in adjective-noun format", () => {
    const name = generateRandomPlayerName();
    expect(name).toMatch(/^[a-z0-9-]+-[a-z0-9-]+$/);
    const parts = name.split("-");
    expect(parts.length).toBeGreaterThanOrEqual(2);
  });

  it("produces different names across multiple calls", () => {
    const names = new Set(Array.from({ length: 20 }, () => generateRandomPlayerName()));
    // With ~110 adjectives x ~60 nouns = 6600+ combos, 20 calls should produce at least 10 unique
    expect(names.size).toBeGreaterThanOrEqual(10);
  });

  it("only contains URL-safe characters", () => {
    for (let i = 0; i < 50; i++) {
      const name = generateRandomPlayerName();
      expect(name).toMatch(/^[a-z0-9-]+$/);
      expect(name.length).toBeGreaterThanOrEqual(3);
      expect(name.length).toBeLessThanOrEqual(50);
    }
  });
});
