import { describe, expect, it } from "vitest";
import { decodeTaskRouteId } from "./task-route-id";

describe("decodeTaskRouteId", () => {
  it("decodes a colon-bearing receipt task id exactly once", () => {
    expect(decodeTaskRouteId("task-funding-receipt%3Apayment_123")).toBe(
      "task-funding-receipt:payment_123",
    );
    expect(decodeTaskRouteId("task%253Aencoded")).toBe("task%3Aencoded");
  });

  it("preserves ordinary and malformed route ids", () => {
    expect(decodeTaskRouteId("cm123")).toBe("cm123");
    expect(decodeTaskRouteId("bad%2")).toBe("bad%2");
  });
});
