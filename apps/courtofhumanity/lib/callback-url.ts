/**
 * Resolves a post-signin `callbackUrl` to a safe same-origin path.
 *
 * A prefix test is not sufficient. Browsers resolve "/\evil.example/path"
 * against the current origin as an *external* URL even though it begins with a
 * single slash, so the value is parsed and its origin compared before any
 * navigation. Only the normalized path is reused; anything cross-origin or
 * unparseable falls back to the dashboard.
 */
export function resolveCallbackUrl(
  raw: string | null | undefined,
  origin: string,
): string {
  if (!raw) return "/dashboard"
  try {
    const parsed = new URL(raw, origin)
    if (parsed.origin !== origin) return "/dashboard"
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return "/dashboard"
  }
}
