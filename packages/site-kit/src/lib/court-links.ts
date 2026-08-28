/**
 * Cross-domain links to the Court of Humanity app.
 *
 * The court, case and plaintiff surfaces live on courtofhumanity.org rather
 * than on the campaign domain (#254), for the venue-neutrality reason recorded
 * on that issue: a court hosted on the plaintiff-side campaign's own domain
 * undermines the judicial framing of Humanity v. Government. Campaign pages
 * that still point at those surfaces have to do so absolutely, since a
 * root-relative path resolves against whichever domain is serving the page.
 *
 * These targets go live when the court routes land. Until then they resolve to
 * the court app's 404 rather than the campaign app's, which is the correct
 * failure: the destination exists, it just has not been built yet.
 */

export const COURT_OF_HUMANITY_ORIGIN = "https://courtofhumanity.org"

/** Absolute URL for a path served by the Court of Humanity app. */
export function courtUrl(path: string): string {
  return `${COURT_OF_HUMANITY_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`
}

export const COURT_LINKS = {
  court: { url: courtUrl("/court"), label: "the Court of Humanity" },
  case: {
    url: courtUrl("/humanity-v-government"),
    label: "Humanity v. Government",
  },
  plaintiffs: { url: courtUrl("/plaintiffs"), label: "the plaintiffs" },
} as const

export type CourtLinkId = keyof typeof COURT_LINKS
