import { describe, expect, it } from "vitest";
import { resolveTaskVisibilityParam } from "../tasks/task-visibility-param";

describe("resolveTaskVisibilityParam", () => {
  it("defaults authenticated callers to 'all' (accessible predicate)", () => {
    expect(resolveTaskVisibilityParam({ isAuthenticated: true })).toEqual({
      ok: true,
      visibility: "accessible",
      requested: "all",
    });
  });

  it("defaults anonymous callers to public", () => {
    expect(resolveTaskVisibilityParam({ isAuthenticated: false })).toEqual({
      ok: true,
      visibility: "public",
      requested: "public",
    });
  });

  it("degrades anonymous explicit 'all' to public instead of erroring", () => {
    expect(
      resolveTaskVisibilityParam({ visibility: "all", isAuthenticated: false }),
    ).toEqual({ ok: true, visibility: "public", requested: "all" });
  });

  it("rejects anonymous 'private' with an actionable error", () => {
    const result = resolveTaskVisibilityParam({
      visibility: "private",
      isAuthenticated: false,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("requires authentication");
    }
  });

  it("passes 'private' through for authenticated callers", () => {
    expect(
      resolveTaskVisibilityParam({ visibility: "private", isAuthenticated: true }),
    ).toEqual({ ok: true, visibility: "private", requested: "private" });
  });

  it("maps the deprecated scope alias ('accessible' → all, 'public' → public)", () => {
    expect(
      resolveTaskVisibilityParam({ scope: "accessible", isAuthenticated: true }),
    ).toEqual({ ok: true, visibility: "accessible", requested: "all" });
    expect(
      resolveTaskVisibilityParam({ scope: "public", isAuthenticated: true }),
    ).toEqual({ ok: true, visibility: "public", requested: "public" });
  });

  it("prefers explicit visibility over the deprecated alias", () => {
    expect(
      resolveTaskVisibilityParam({
        visibility: "public",
        scope: "accessible",
        isAuthenticated: true,
      }),
    ).toEqual({ ok: true, visibility: "public", requested: "public" });
  });

  it("rejects unknown visibility values", () => {
    const result = resolveTaskVisibilityParam({
      visibility: "everything",
      isAuthenticated: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('"everything"');
    }
  });
});
