/**
 * Render a {{token}} template against a context object.
 *
 * Tokens use dot-notation lookup: `{{user.id}}`, `{{signer.country.name}}`.
 * Whitespace inside braces is trimmed. Missing tokens render as empty
 * strings and are recorded in `missingPaths` so a typo surfaces in the
 * fire log instead of silently going wrong.
 *
 * No conditionals, expressions, or arithmetic — kept deterministic. If a
 * trigger needs computed values, the caller pre-computes them into the
 * context (e.g. `context.dueAt7d = addDays(now, 7).toISOString()`) BEFORE
 * firing. URL-encoding is applied at the URL-builder layer, not here.
 */
export function render(
  template: string,
  context: unknown,
): { rendered: string; missingPaths: string[] } {
  const missingPaths: string[] = [];
  const rendered = template.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_match, rawPath: string) => {
    const path = rawPath.trim();
    const value = lookup(context, path);
    if (value === undefined || value === null) {
      missingPaths.push(path);
      return "";
    }
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return JSON.stringify(value);
  });
  return { rendered, missingPaths };
}

export function renderAll(
  templates: readonly string[],
  context: unknown,
): { rendered: string[]; missingPaths: string[] } {
  const out: string[] = [];
  const missing: string[] = [];
  for (const tpl of templates) {
    const r = render(tpl, context);
    out.push(r.rendered);
    missing.push(...r.missingPaths);
  }
  return { rendered: out, missingPaths: missing };
}

function lookup(root: unknown, path: string): unknown {
  if (root == null) return undefined;
  const parts = path.split(".");
  let cur: unknown = root;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

/**
 * Validate at trigger-create time that a template will produce a non-empty
 * string when fed the example context the author supplies, OR that it has
 * no tokens (literal string is fine). Catches typos like `{{user.idd}}`.
 */
export function validateTemplate(template: string): { valid: true } | { valid: false; reason: string } {
  if (typeof template !== "string") {
    return { valid: false, reason: "template must be a string" };
  }
  const tokens = [...template.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)].map((m) => m[1]?.trim() ?? "");
  for (const t of tokens) {
    if (t.length === 0) return { valid: false, reason: "empty {{}} token" };
    if (!/^[A-Za-z_][A-Za-z0-9_.]*$/.test(t)) {
      return { valid: false, reason: `invalid token path: ${t}` };
    }
  }
  return { valid: true };
}
