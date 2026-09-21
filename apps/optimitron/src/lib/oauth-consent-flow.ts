import { ROUTES } from "./routes";

/**
 * Set by middleware on requests that belong to the MCP OAuth consent flow.
 * `SiteChrome` strips this app's navbar and footer when it is present, so the
 * screens a user reaches from another site do not look like a different app.
 */
export const OAUTH_CONSENT_FLOW_HEADER = "x-oauth-consent-flow";

const AUTH_PATH_PREFIX = "/auth";

function isConsentPath(pathname: string): boolean {
  return (
    pathname === ROUTES.mcpAuthorize ||
    pathname.startsWith(`${ROUTES.mcpAuthorize}/`)
  );
}

function callbackTargetsConsent(callbackUrl: string): boolean {
  try {
    // Callbacks are normally relative, so the base only resolves them.
    return isConsentPath(
      new URL(callbackUrl, "https://resolve.invalid").pathname,
    );
  } catch {
    return false;
  }
}

/**
 * NextAuth routes every sign-in, verification and error bounce through this
 * app's shared `/auth` pages, so those pages only count as part of the consent
 * flow while they are carrying the user back to the consent screen.
 */
export function isOAuthConsentFlowRequest(
  pathname: string,
  callbackUrl: string | null | undefined,
): boolean {
  if (isConsentPath(pathname)) return true;
  if (
    pathname !== AUTH_PATH_PREFIX &&
    !pathname.startsWith(`${AUTH_PATH_PREFIX}/`)
  ) {
    return false;
  }
  return callbackUrl ? callbackTargetsConsent(callbackUrl) : false;
}

/**
 * Sets the flow header, or removes an inbound copy so a client cannot send its
 * own. Middleware calls this on every request it forwards.
 */
export function applyOAuthConsentFlowHeader(
  requestHeaders: Headers,
  url: { pathname: string; searchParams: URLSearchParams },
): void {
  if (
    isOAuthConsentFlowRequest(url.pathname, url.searchParams.get("callbackUrl"))
  ) {
    requestHeaders.set(OAUTH_CONSENT_FLOW_HEADER, "1");
  } else {
    requestHeaders.delete(OAUTH_CONSENT_FLOW_HEADER);
  }
}
