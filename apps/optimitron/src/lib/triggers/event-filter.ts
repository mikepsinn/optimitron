/**
 * Evaluate a TaskTrigger.eventFilter JSON spec against an event context.
 *
 * Filter primitives:
 *   { "field": "<dot.path>", "equals": <value> }
 *   { "field": "<dot.path>", "matches": "<regex>" }
 *   { "field": "<dot.path>", "exists": true|false }
 *   { "and": [filter, filter, ...] }
 *   { "or":  [filter, filter, ...] }
 *   { "not": filter }
 *
 * Empty/null filter ⇒ matches every context (the trigger fires on every
 * event of its eventName).
 *
 * Adding a new operator is a code change here — no schema migration.
 */

export type EventFilter =
  | null
  | undefined
  | { field: string; equals: unknown }
  | { field: string; matches: string }
  | { field: string; exists: boolean }
  | { and: EventFilter[] }
  | { or: EventFilter[] }
  | { not: EventFilter };

export function matchesEventFilter(filter: unknown, context: unknown): boolean {
  if (filter == null) return true;
  if (typeof filter !== "object") return false;
  const f = filter as Record<string, unknown>;

  if (Array.isArray(f.and)) {
    return f.and.every((sub) => matchesEventFilter(sub, context));
  }
  if (Array.isArray(f.or)) {
    return f.or.some((sub) => matchesEventFilter(sub, context));
  }
  if ("not" in f) {
    return !matchesEventFilter(f.not, context);
  }

  if (typeof f.field === "string") {
    const value = lookup(context, f.field);
    if ("equals" in f) return deepEqual(value, f.equals);
    if (typeof f.matches === "string") {
      if (typeof value !== "string") return false;
      try {
        return new RegExp(f.matches).test(value);
      } catch {
        return false;
      }
    }
    if ("exists" in f) return (value !== undefined && value !== null) === Boolean(f.exists);
  }

  return false;
}

function lookup(root: unknown, path: string): unknown {
  if (root == null) return undefined;
  let cur: unknown = root;
  for (const part of path.split(".")) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const ak = Object.keys(ao);
  const bk = Object.keys(bo);
  if (ak.length !== bk.length) return false;
  return ak.every((k) => deepEqual(ao[k], bo[k]));
}
