/** Keep survey sign-in on this site, including links issued before the dashboard redirect. */
export function getSurveyPostAuthPath(
  callbackUrl: string | null | undefined,
  origin: string,
): string {
  try {
    const url = new URL(callbackUrl || "/dashboard", origin)
    if (
      url.origin !== new URL(origin).origin ||
      url.pathname === "/" ||
      /^\/(auth|api)(\/|$)/u.test(url.pathname)
    ) {
      return "/dashboard"
    }
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return "/dashboard"
  }
}
