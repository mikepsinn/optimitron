/**
 * Locale-aware integer formatter used by every vote-counter / signer-count
 * surface, matching the monolith's `lib/format-count.ts` so counts render
 * identically across campaign sites.
 */
export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}
