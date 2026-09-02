/** Keep survey sign-in on this site, including links issued before the dashboard redirect. */
export function getSurveyPostAuthPath(
  callbackUrl: string | null | undefined,
  origin: string,
): string {
  try {
    const url = new URL(callbackUrl || "/dashboard", origin)
    const pathname = decodeURIComponent(url.pathname)
    if (
      url.origin !== new URL(origin).origin ||
      pathname === "/" ||
      /^\/(auth|api)(\/|$)/u.test(pathname)
    ) {
      return "/dashboard"
    }
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return "/dashboard"
  }
}
