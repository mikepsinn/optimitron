import { describe, expect, it } from "vitest";
import { formatCellValue } from "./collection-column-settings";

describe("formatCellValue", () => {
  it("keeps a date-only value on its own calendar day regardless of time zone", () => {
    // Regression: new Date("2026-07-19") is UTC midnight, which renders as
    // 2026-07-18 west of UTC. All three date formats must show the 19th.
    expect(formatCellValue("DATE", "iso", "2026-07-19")).toBe("2026-07-19");
    expect(formatCellValue("DATE", "medium", "2026-07-19")).toBe(
      "Jul 19, 2026",
    );
    // toLocaleDateString output varies by runner locale, but must contain the
    // correct day, never the 18th.
    const local = formatCellValue("DATE", "local", "2026-07-19");
    expect(local).toMatch(/19/);
    expect(local).not.toMatch(/18/);
  });

  it("falls back to the raw string for an unparseable date", () => {
    expect(formatCellValue("DATE", "medium", "not-a-date")).toBe("not-a-date");
  });

  it("formats numbers per the chosen format", () => {
    expect(formatCellValue("NUMBER", "comma", 125000)).toBe("125,000");
    expect(formatCellValue("NUMBER", "currency", 8000)).toBe("$8,000.00");
    expect(formatCellValue("NUMBER", "percent", 0.65)).toBe("65%");
    expect(formatCellValue("NUMBER", "plain", 42)).toBe("42");
  });

  it("preserves the original null / array / string fallbacks", () => {
    expect(formatCellValue("TEXT", undefined, null)).toBe("");
    expect(formatCellValue("MULTI_SELECT", undefined, ["a", "b"])).toBe("a, b");
    expect(formatCellValue("TEXT", undefined, "hello")).toBe("hello");
  });

  it("does not throw on a non-finite number", () => {
    expect(formatCellValue("NUMBER", "currency", "abc")).toBe("abc");
  });
});
