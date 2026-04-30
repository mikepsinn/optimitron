import { describe, expect, it } from "vitest";
import { matchesEventFilter } from "../event-filter";

describe("triggers/event-filter", () => {
  it("null/undefined filter matches everything", () => {
    expect(matchesEventFilter(null, { a: 1 })).toBe(true);
    expect(matchesEventFilter(undefined, { a: 1 })).toBe(true);
  });

  describe("equals", () => {
    it("matches scalars", () => {
      expect(matchesEventFilter({ field: "a", equals: 1 }, { a: 1 })).toBe(true);
      expect(matchesEventFilter({ field: "a", equals: "x" }, { a: "x" })).toBe(true);
      expect(matchesEventFilter({ field: "a", equals: 1 }, { a: 2 })).toBe(false);
    });

    it("matches nested paths", () => {
      expect(
        matchesEventFilter({ field: "user.country", equals: "US" }, { user: { country: "US" } }),
      ).toBe(true);
    });

    it("matches deep equality on objects", () => {
      expect(
        matchesEventFilter({ field: "obj", equals: { a: 1, b: [1, 2] } }, { obj: { a: 1, b: [1, 2] } }),
      ).toBe(true);
    });
  });

  describe("matches", () => {
    it("regex against string field", () => {
      expect(
        matchesEventFilter(
          { field: "task.taskKey", matches: "^program:one-percent-treaty:" },
          { task: { taskKey: "program:one-percent-treaty:user:abc" } },
        ),
      ).toBe(true);
    });

    it("returns false for non-string field", () => {
      expect(matchesEventFilter({ field: "a", matches: "x" }, { a: 42 })).toBe(false);
    });

    it("returns false on invalid regex", () => {
      expect(matchesEventFilter({ field: "a", matches: "[unclosed" }, { a: "x" })).toBe(false);
    });
  });

  describe("exists", () => {
    it("true when value is present", () => {
      expect(matchesEventFilter({ field: "a", exists: true }, { a: 1 })).toBe(true);
      expect(matchesEventFilter({ field: "a", exists: false }, { a: 1 })).toBe(false);
    });

    it("false when value is null/undefined", () => {
      expect(matchesEventFilter({ field: "a", exists: false }, {})).toBe(true);
      expect(matchesEventFilter({ field: "a", exists: true }, { a: null })).toBe(false);
    });
  });

  describe("composition", () => {
    it("and: requires every sub-filter to match", () => {
      const f = {
        and: [
          { field: "a", equals: 1 },
          { field: "b", equals: 2 },
        ],
      };
      expect(matchesEventFilter(f, { a: 1, b: 2 })).toBe(true);
      expect(matchesEventFilter(f, { a: 1, b: 3 })).toBe(false);
    });

    it("or: requires at least one sub-filter", () => {
      const f = {
        or: [
          { field: "a", equals: 1 },
          { field: "b", equals: 2 },
        ],
      };
      expect(matchesEventFilter(f, { a: 9, b: 2 })).toBe(true);
      expect(matchesEventFilter(f, { a: 9, b: 9 })).toBe(false);
    });

    it("not: inverts", () => {
      expect(matchesEventFilter({ not: { field: "a", equals: 1 } }, { a: 2 })).toBe(true);
      expect(matchesEventFilter({ not: { field: "a", equals: 1 } }, { a: 1 })).toBe(false);
    });

    it("nested composition", () => {
      const f = {
        and: [{ field: "a", equals: 1 }, { not: { field: "b", equals: "x" } }],
      };
      expect(matchesEventFilter(f, { a: 1, b: "y" })).toBe(true);
      expect(matchesEventFilter(f, { a: 1, b: "x" })).toBe(false);
      expect(matchesEventFilter(f, { a: 2, b: "y" })).toBe(false);
    });
  });
});
