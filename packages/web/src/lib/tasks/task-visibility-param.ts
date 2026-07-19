/**
 * Shared resolution for the MCP task tools' `visibility` parameter.
 *
 * Public vocabulary (self-documenting, follows the GitHub API convention):
 *   - "all"     → every task the caller can see (public + their private work).
 *                 Default for authenticated callers.
 *   - "public"  → public tasks only. Default (forced) for anonymous callers.
 *   - "private" → only tasks the caller can access that are NOT public.
 *
 * `scope` / `taskScope` ("public" | "accessible") are deprecated aliases kept
 * for existing clients: "accessible" maps to "all".
 */

export type TaskVisibilityParam = "all" | "public" | "private";

/** Internal predicate values understood by getTaskVisibilityWhere. */
export type ResolvedTaskVisibility = "public" | "accessible" | "private";

const PARAM_VALUES = new Set<TaskVisibilityParam>(["all", "public", "private"]);

export function resolveTaskVisibilityParam(input: {
  visibility?: unknown;
  /** Deprecated alias ("public" | "accessible"). */
  scope?: unknown;
  isAuthenticated: boolean;
}):
  | { ok: true; visibility: ResolvedTaskVisibility; requested: TaskVisibilityParam }
  | { ok: false; error: string } {
  const raw = typeof input.visibility === "string" ? input.visibility : null;
  if (raw !== null && !PARAM_VALUES.has(raw as TaskVisibilityParam)) {
    return {
      ok: false,
      error: `visibility must be "all", "public", or "private" (got "${raw}").`,
    };
  }

  let requested = raw as TaskVisibilityParam | null;
  if (requested === null && typeof input.scope === "string") {
    requested = input.scope === "accessible" ? "all" : "public";
  }
  if (requested === null) {
    requested = input.isAuthenticated ? "all" : "public";
  }

  if (requested === "private" && !input.isAuthenticated) {
    return {
      ok: false,
      error:
        'visibility "private" requires authentication — anonymous callers have no private tasks.',
    };
  }
  if (requested === "all" && !input.isAuthenticated) {
    // Anonymous "all" degrades gracefully to the public set instead of erroring:
    // it is the default, so unauthenticated default calls must still work.
    return { ok: true, visibility: "public", requested };
  }

  return {
    ok: true,
    visibility: requested === "all" ? "accessible" : requested,
    requested,
  };
}
