import { describe, expect, it } from "vitest";
import { parseArgs } from "../cleanup-test-data";

describe("parseArgs", () => {
  it("uses dry-run defaults when no flags are provided", () => {
    expect(parseArgs([])).toEqual({
      execute: false,
      json: false,
      patterns: ["%@example.test"],
    });
  });

  it("sets execute mode", () => {
    expect(parseArgs(["--execute"])).toEqual({
      execute: true,
      json: false,
      patterns: ["%@example.test"],
    });
  });

  it("captures repeated SQL LIKE patterns", () => {
    expect(
      parseArgs([
        "--pattern",
        "%@example.test",
        "--pattern",
        "%@playwright.test",
      ]),
    ).toEqual({
      execute: false,
      json: false,
      patterns: ["%@example.test", "%@playwright.test"],
    });
  });

  it("rejects missing pattern values", () => {
    expect(() => parseArgs(["--pattern"])).toThrow(
      "--pattern requires a value",
    );
  });

  it("rejects option tokens as pattern values", () => {
    expect(() => parseArgs(["--pattern", "--execute"])).toThrow(
      "--pattern requires a value",
    );
  });

  it("rejects unknown arguments", () => {
    expect(() => parseArgs(["--wat"])).toThrow("Unknown argument: --wat");
  });
});
