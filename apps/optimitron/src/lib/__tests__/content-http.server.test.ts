import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  contentErrorResponse,
  parseOptionalPositiveInteger,
} from "../content-http.server";

describe("content validation responses", () => {
  it("returns machine-readable issue paths without replaying input values", async () => {
    const result = z
      .object({ records: z.array(z.object({ title: z.string().min(1) })) })
      .safeParse({ records: [{ title: "" }] });
    if (result.success) throw new Error("Expected validation to fail");

    const response = contentErrorResponse(result.error);

    expect(response?.status).toBe(400);
    expect(await response?.json()).toEqual({
      code: "VALIDATION_ERROR",
      error: "Invalid content request.",
      issues: [
        expect.objectContaining({
          code: "too_small",
          path: ["records", 0, "title"],
        }),
      ],
    });
  });
});

describe("content query parameters", () => {
  it("keeps an omitted limit undefined so service defaults apply", () => {
    expect(parseOptionalPositiveInteger(null, "limit")).toBeUndefined();
  });

  it("rejects zero, decimals, and non-numeric limits", () => {
    for (const value of ["0", "1.5", "nope"]) {
      expect(() => parseOptionalPositiveInteger(value, "limit")).toThrow(
        "limit must be a positive integer",
      );
    }
  });
});
