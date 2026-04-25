import { OPTIMITRON_CANONICAL_ORIGIN } from "@/lib/site";

/**
 * Resolve the base URL for links inside outgoing emails.
 *
 * Order of precedence:
 * 1. `NEXT_PUBLIC_BASE_URL` if set (covers dev, preview, and custom domains)
 * 2. The canonical production origin (`https://optimitron.com`) — never a
 *    `localhost` URL, because the recipient's mail client cannot reach it.
 */
export function getEmailBaseUrl(): string {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (envBase && envBase.length > 0 && !envBase.startsWith("http://localhost")) {
    return envBase.replace(/\/+$/, "");
  }
  return OPTIMITRON_CANONICAL_ORIGIN;
}

/**
 * Absolute-ize an `<img src>` (or any asset URL) for use in email HTML.
 *
 * - `http(s)://…` passes through unchanged
 * - `//cdn.example.com/…` becomes `https://cdn.example.com/…`
 * - `/foo/bar.png` becomes `{emailBaseUrl}/foo/bar.png`
 * - `foo/bar.png` becomes `{emailBaseUrl}/foo/bar.png`
 * - Empty / `data:` URIs pass through unchanged (data: is fine in HTML email)
 */
export function prefixEmailImage(src: string | null | undefined, baseUrl: string = getEmailBaseUrl()): string {
  if (!src) return "";
  const trimmed = src.trim();
  if (trimmed.length === 0) return "";
  if (trimmed.startsWith("data:")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  const base = baseUrl.replace(/\/+$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}

/**
 * Absolute-ize an `<a href>` for use in email HTML or text. Same rules as
 * `prefixEmailImage` minus the `data:` passthrough (no use case in emails).
 * `mailto:` / `tel:` / `https?:` pass through unchanged.
 */
export function prefixEmailHref(href: string | null | undefined, baseUrl: string = getEmailBaseUrl()): string {
  if (!href) return "";
  const trimmed = href.trim();
  if (trimmed.length === 0) return "";
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  const base = baseUrl.replace(/\/+$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}

export function getEmailUrls() {
  // Use getEmailBaseUrl (not getBaseUrl) — outgoing mail must never contain
  // a localhost link, since the recipient's client can't reach it.
  const base = getEmailBaseUrl();
  return {
    dashboardLink: `${base}/dashboard`,
    settingsLink: `${base}/settings#email-preferences`,
    prizeLink: `${base}/prize`,
    wishocracyLink: `${base}/wishocracy`,
    alignmentLink: `${base}/alignment`,
  };
}
