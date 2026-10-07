/**
 * The Right to Trial campaign used to be the homepage, so shared links such as
 * `/#state-support` still point at the root. That campaign is now the act, so
 * any anchor the homepage does not have goes to /act.
 */
export function getLegacyHomeHashRedirect(
  hash: string,
  homeHasAnchor: (id: string) => boolean,
): string | null {
  const id = hash.replace(/^#/, "")
  if (!id || homeHasAnchor(id)) return null
  return "/act"
}
