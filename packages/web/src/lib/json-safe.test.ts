import { describe, expect, it } from "vitest";
import { stringifyJsonSafe } from "./json-safe";

describe("stringifyJsonSafe", () => {
  it("serializes BigInt fields that crash bare JSON.stringify", () => {
    const row = {
      compensationMinAmountMinorUnits: 250_000n,
      nested: [{ compensationMaxAmountMinorUnits: 1_000_000n }],
    };

    expect(() => JSON.stringify(row)).toThrow();
    expect(JSON.parse(stringifyJsonSafe(row))).toEqual({
      compensationMinAmountMinorUnits: 250_000,
      nested: [{ compensationMaxAmountMinorUnits: 1_000_000 }],
    });
  });

  it("falls back to a string for BigInts beyond safe integer range", () => {
    const parsed = JSON.parse(
      stringifyJsonSafe({ huge: 9_223_372_036_854_775_807n }),
    ) as { huge: string };

    expect(parsed.huge).toBe("9223372036854775807");
  });

  it("leaves ordinary payloads untouched", () => {
    const data = { a: 1, b: "two", c: null, d: [true, 2.5] };

    expect(stringifyJsonSafe(data)).toBe(JSON.stringify(data));
  });
});
