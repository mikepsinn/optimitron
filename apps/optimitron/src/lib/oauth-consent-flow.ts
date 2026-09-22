import type { Metadata } from "next";
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

/**
 * Page metadata for a screen in the consent flow. The root layout supplies this
 * app's title template, description and social cards; every one of them would
 * name the app in the browser tab or in a link preview, so each is replaced.
 */
export function oauthConsentFlowMetadata(
  title: string,
  description: string,
): Metadata {
  return {
    // `absolute` escapes the root layout's `%s | <site name>` template.
    title: { absolute: title },
    description,
    openGraph: { title, description },
    twitter: { card: "summary", title, description },
    // These URLs carry client and scope parameters and must never be indexed.
    // robots.txt covers /auth but not the consent route.
    robots: { follow: false, index: false },
  };
}
