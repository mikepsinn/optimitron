/**
 * Pure OAuth helpers — token-refresh decisions, expiry math, and redirect
 * parsing. No chrome.* APIs so the logic is unit-testable.
 */

/** Refresh this long before the access token actually expires. */
export const TOKEN_REFRESH_SKEW_MS = 60_000;

export interface StoredTokens {
  accessToken: string;
  /** Epoch ms when the access token expires. */
  expiresAt: number;
  refreshToken: string;
}

/**
 * Decide whether the access token needs a refresh before use.
 * Unknown/invalid expiry counts as expired — refreshing costs one request;
 * sending a dead token costs a failed call plus the refresh anyway.
 */
export function shouldRefreshAccessToken(
  expiresAt: number | null | undefined,
  nowMs: number,
  skewMs: number = TOKEN_REFRESH_SKEW_MS,
): boolean {
  if (expiresAt == null || !Number.isFinite(expiresAt)) return true;
  return nowMs >= expiresAt - skewMs;
}

/** Epoch ms expiry from an OAuth `expires_in` (seconds) response field. */
export function computeExpiresAt(nowMs: number, expiresInSeconds: number): number {
  if (!Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
    // Treat garbage as already expired so the next call refreshes.
    return nowMs;
  }
  return nowMs + expiresInSeconds * 1000;
}

/**
 * Extract `code` from the OAuth redirect URL, verifying `state`.
 * Returns null when the redirect is missing the code or the state does not
 * match (login should fail closed, not proceed with a forged code).
 */
export function parseAuthRedirect(
  redirectUrl: string,
  expectedState: string,
): string | null {
  let url: URL;
  try {
    url = new URL(redirectUrl);
  } catch {
    return null;
  }
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || state !== expectedState) return null;
  return code;
}

/** RFC 4648 base64url (no padding) of raw bytes. */
export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
