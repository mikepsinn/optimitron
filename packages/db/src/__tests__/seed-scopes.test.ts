import { describe, expect, it } from "vitest";
import { parseSeedScopes } from "../../prisma/seed-scopes.ts";

describe("parseSeedScopes", () => {
  it("defaults to all scopes when no args are provided", () => {
    expect(parseSeedScopes([])).toEqual(["reference", "bootstrap", "demo", "tasks"]);
  });

  it("supports comma-separated scope lists", () => {
    expect(parseSeedScopes(["--scope", "reference,demo"])).toEqual([
      "reference",
      "demo",
    ]);
  });

  it("accepts repeated scope flags and de-duplicates them", () => {
    expect(
      parseSeedScopes(["--scope", "reference", "--scope", "demo", "--scope", "reference"]),
    ).toEqual(["reference", "demo"]);
  });

  it("expands all to every scope", () => {
    expect(parseSeedScopes(["--scope", "all"])).toEqual([
      "reference",
      "bootstrap",
      "demo",
      "tasks",
    ]);
  });

  it("rejects invalid scopes", () => {
    expect(() => parseSeedScopes(["--scope", "invalid"])).toThrow(
      'Invalid seed scope "invalid". Expected one of: all, reference, bootstrap, demo, tasks.',
    );
  });
});
