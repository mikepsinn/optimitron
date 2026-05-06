import { getConfiguredSiteOrigin } from "@/lib/site";

const HTTP_URL_PATTERN = /^https?:\/\//i;

export function toAbsoluteOgImageSrc(
  src: string | null | undefined,
  baseOrigin: string = getConfiguredSiteOrigin({ allowLocalFallback: true }),
): string | null {
  const trimmed = src?.trim();
  if (!trimmed) return null;

  if (HTTP_URL_PATTERN.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;

  try {
    const url = new URL(trimmed, baseOrigin);
    return HTTP_URL_PATTERN.test(url.toString()) ? url.toString() : null;
  } catch {
    return null;
  }
}
