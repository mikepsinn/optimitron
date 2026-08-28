/**
 * Locale-aware integer formatter used by every vote-counter / signer-count
 * surface. Lifted from `app/people/page.tsx` so the formatting stays consistent
 * wherever counts appear.
 */
export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}
