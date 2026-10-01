import { ROUTES } from "@optimitron/site-kit/lib/routes"

/**
 * The Right to Trial page used to be the homepage, so shared links such as
 * `/#state-support` still point at the root. Send any anchor the new homepage
 * does not have to the same anchor on the Right to Trial page.
 */
export function getLegacyHomeHashRedirect(
  hash: string,
  homeHasAnchor: (id: string) => boolean,
): string | null {
  const id = hash.replace(/^#/, "")
  if (!id || homeHasAnchor(id)) return null
  return `${ROUTES.rightToTrial}#${id}`
}
