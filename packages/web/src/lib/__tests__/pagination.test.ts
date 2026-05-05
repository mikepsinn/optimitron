import { describe, expect, it } from "vitest";
import { parsePositivePageParam } from "@/lib/pagination";

describe("parsePositivePageParam", () => {
  it.each([
    [undefined, 1],
    ["", 1],
    ["0", 1],
    ["-1", 1],
    ["abc", 1],
    [["3"], 3],
    [[undefined], 1],
  ] as const)("parses %j as page %i", (input, expected) => {
    expect(parsePositivePageParam(input)).toBe(expected);
  });
});
