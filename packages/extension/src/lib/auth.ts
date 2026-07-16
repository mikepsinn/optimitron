/**
 * OAuth 2.0 Authorization Code + PKCE against optimitron.com's MCP OAuth
 * provider (the same one MCP clients use):
 *
 *   register  POST {base}/api/mcp/oauth/register   (RFC 7591 dynamic client)
 *   authorize GET  {base}/api/mcp/oauth/authorize  (via launchWebAuthFlow)
 *   token     POST {base}/api/mcp/oauth/token      (code + refresh grants)
 *
 * Tokens live in chrome.storage.local. Access tokens are refreshed silently
 * shortly before expiry; a failed refresh signs the user out.
 */

import {
  base64UrlEncode,
  computeExpiresAt,
  parseAuthRedirect,
  shouldRefreshAccessToken,
  type StoredTokens,
} from "./auth-logic.js";
import { getApiBase } from "./config.js";

/** The extension may manage private tasks and approve exact outbound payloads. */
export const OAUTH_SCOPES = "tasks:personal actions:approve";

const TOKENS_KEY = "oauthTokens";
const CLIENT_KEY_PREFIX = "oauthClient:";

interface TokenEndpointResponse {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export async function getStoredTokens(): Promise<StoredTokens | null> {
  const result = await chrome.storage.local.get(TOKENS_KEY);
  const tokens = result[TOKENS_KEY] as StoredTokens | undefined;
  if (!tokens?.accessToken || !tokens.refreshToken) return null;
  return tokens;
}

async function storeTokens(tokens: StoredTokens): Promise<void> {
  await chrome.storage.local.set({ [TOKENS_KEY]: tokens });
}

export async function signOut(): Promise<void> {
  await chrome.storage.local.remove(TOKENS_KEY);
}

export async function isSignedIn(): Promise<boolean> {
  return (await getStoredTokens()) !== null;
}

// ---------------------------------------------------------------------------
// Dynamic client registration (one client id per API base)
// ---------------------------------------------------------------------------

async function ensureClientId(base: string): Promise<string> {
  const key = `${CLIENT_KEY_PREFIX}${base}`;
  const stored = await chrome.storage.local.get(key);
  const existing = stored[key];
  if (typeof existing === "string" && existing) return existing;

  const response = await fetch(`${base}/api/mcp/oauth/register`, {
    body: JSON.stringify({
      client_name: "Optimitron Extension",
      client_uri: base,
      grant_types: ["authorization_code", "refresh_token"],
      redirect_uris: [chrome.identity.getRedirectURL("oauth2")],
      scope: OAUTH_SCOPES,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Client registration failed (${response.status})`);
  }
  const body = (await response.json()) as { client_id?: string };
  if (!body.client_id) throw new Error("Client registration returned no client_id");
  await chrome.storage.local.set({ [key]: body.client_id });
  return body.client_id;
}

// ---------------------------------------------------------------------------
// PKCE
// ---------------------------------------------------------------------------

function randomUrlSafeString(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function sha256Base64Url(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return base64UrlEncode(new Uint8Array(digest));
}

// ---------------------------------------------------------------------------
// Sign-in flow
// ---------------------------------------------------------------------------

async function exchangeToken(
  base: string,
  params: Record<string, string>,
): Promise<StoredTokens> {
  const response = await fetch(`${base}/api/mcp/oauth/token`, {
    body: new URLSearchParams(params),
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Token request failed (${response.status})`);
  }
  const body = (await response.json()) as TokenEndpointResponse;
  if (!body.access_token || !body.refresh_token) {
    throw new Error("Token response missing tokens");
  }
  return {
    accessToken: body.access_token,
    expiresAt: computeExpiresAt(Date.now(), body.expires_in ?? 0),
    refreshToken: body.refresh_token,
  };
}

/** Interactive sign-in. Opens the consent window; resolves once tokens are stored. */
export async function signIn(): Promise<void> {
  const base = await getApiBase();
  const clientId = await ensureClientId(base);
  const redirectUri = chrome.identity.getRedirectURL("oauth2");
  const codeVerifier = randomUrlSafeString(32);
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const state = randomUrlSafeString(16);

  const authorizeUrl = new URL(`${base}/api/mcp/oauth/authorize`);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", OAUTH_SCOPES);
  authorizeUrl.searchParams.set("state", state);

  const redirectUrl = await chrome.identity.launchWebAuthFlow({
    interactive: true,
    url: authorizeUrl.toString(),
  });
  if (!redirectUrl) throw new Error("Sign-in was cancelled");

  const code = parseAuthRedirect(redirectUrl, state);
  if (!code) throw new Error("Sign-in redirect missing code or state mismatch");

  const tokens = await exchangeToken(base, {
    client_id: clientId,
    code,
    code_verifier: codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });
  await storeTokens(tokens);
}

// ---------------------------------------------------------------------------
// Silent refresh
// ---------------------------------------------------------------------------

async function refreshTokens(tokens: StoredTokens): Promise<StoredTokens | null> {
  const base = await getApiBase();
  try {
    const clientKey = `${CLIENT_KEY_PREFIX}${base}`;
    const stored = await chrome.storage.local.get(clientKey);
    const clientId = stored[clientKey];
    const next = await exchangeToken(base, {
      grant_type: "refresh_token",
      refresh_token: tokens.refreshToken,
      ...(typeof clientId === "string" && clientId ? { client_id: clientId } : {}),
    });
    await storeTokens(next);
    return next;
  } catch {
    // Refresh token dead or revoked — sign out so the UI shows the button.
    await signOut();
    return null;
  }
}

/**
 * Valid access token or null when signed out (or refresh failed).
 * Refreshes silently when the token is within the expiry skew.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await getStoredTokens();
  if (!tokens) return null;
  if (!shouldRefreshAccessToken(tokens.expiresAt, Date.now())) {
    return tokens.accessToken;
  }
  const refreshed = await refreshTokens(tokens);
  return refreshed?.accessToken ?? null;
}

/** Force one refresh (after a 401). Null when it fails. */
export async function forceRefreshAccessToken(): Promise<string | null> {
  const tokens = await getStoredTokens();
  if (!tokens) return null;
  const refreshed = await refreshTokens(tokens);
  return refreshed?.accessToken ?? null;
}
