import { afterEach, describe, expect, it, vi } from "vitest";
import { SignJWT } from "jose";

import {
  buildMcpAuthorizeSignInPath,
  buildMcpConsentAuthorizeUrl,
  getAcceptedMcpIssuers,
  getMcpRequestOrigin,
  getProtectedResourceMetadata,
  resolveMcpResourceOrigin,
  shouldRedirectMcpAuthorizeToIssuer,
  signMcpAccessToken,
  verifyMcpAccessToken,
} from "@/lib/mcp-oauth";
import { McpScope } from "@/lib/mcp-scopes";

const CANONICAL = "https://optimitron.com";

function stubCanonicalOrigin() {
  vi.stubEnv("MCP_OAUTH_ISSUER", CANONICAL);
}

function request(headers: Record<string, string>) {
  return new Request("https://example.invalid/.well-known", { headers });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveMcpResourceOrigin", () => {
  it("keeps a served site variant host so its metadata matches the dialed URL", () => {
    stubCanonicalOrigin();
    expect(resolveMcpResourceOrigin("https://optimitron.com")).toBe(
      "https://optimitron.com",
    );
    expect(resolveMcpResourceOrigin("https://dfda.earth")).toBe(
      "https://dfda.earth",
    );
  });

  it("falls back to the canonical origin for a host this deployment does not serve", () => {
    stubCanonicalOrigin();
    expect(resolveMcpResourceOrigin("https://attacker.example.com")).toBe(
      CANONICAL,
    );
  });

  it("falls back to the canonical origin for a missing or unparseable origin", () => {
    stubCanonicalOrigin();
    expect(resolveMcpResourceOrigin(null)).toBe(CANONICAL);
    expect(resolveMcpResourceOrigin("  ")).toBe(CANONICAL);
    expect(resolveMcpResourceOrigin("not-a-url")).toBe(CANONICAL);
  });
});

describe("OAuth issuer", () => {
  it("keeps Optimitron as the production authorization server", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXTAUTH_URL", "https://warondisease.org");
    vi.stubEnv("MCP_OAUTH_ISSUER", "");

    const { getOAuthMetadata } = await import("@/lib/mcp-oauth");

    expect(getOAuthMetadata().issuer).toBe(CANONICAL);
  });

  it("ignores a non-empty MCP_OAUTH_ISSUER override in production", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXTAUTH_URL", "https://warondisease.org");
    vi.stubEnv("MCP_OAUTH_ISSUER", "https://preview.example.com");

    const { getOAuthMetadata } = await import("@/lib/mcp-oauth");

    expect(getOAuthMetadata().issuer).toBe(CANONICAL);
  });

  it("accepts legacy warondisease.org access tokens while minting canonical ones", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXTAUTH_SECRET", "test-nextauth-secret-for-iss-check");
    vi.stubEnv("NEXTAUTH_URL", "https://warondisease.org");
    vi.stubEnv("MCP_OAUTH_ISSUER", "");

    expect(getAcceptedMcpIssuers()).toEqual([
      CANONICAL,
      "https://warondisease.org",
      "https://www.warondisease.org",
    ]);

    const minted = await signMcpAccessToken(
      "user_1",
      "client_1",
      [McpScope.TASKS_PERSONAL],
      [],
    );
    await expect(verifyMcpAccessToken(minted)).resolves.toMatchObject({
      sub: "user_1",
      clientId: "client_1",
    });

    const legacy = await new SignJWT({
      clientId: "client_1",
      organizationIds: [],
      scopes: [McpScope.TASKS_PERSONAL],
      type: "access",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user_1")
      .setIssuer("https://warondisease.org")
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(process.env.NEXTAUTH_SECRET));

    await expect(verifyMcpAccessToken(legacy)).resolves.toMatchObject({
      sub: "user_1",
      clientId: "client_1",
    });
  });
});

describe("MCP authorize consent URL helpers", () => {
  it("builds consent URLs on the canonical issuer even when discovery was on warondisease", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXTAUTH_URL", "https://warondisease.org");

    const url = buildMcpConsentAuthorizeUrl({
      client_id: "mcp_abc",
      redirect_uri: "http://127.0.0.1:1234/callback",
      state: "state-1",
      scope: "tasks:personal",
      code_challenge: "challenge",
      client_name: "Cursor",
    });

    expect(url.origin).toBe(CANONICAL);
    expect(url.pathname).toBe("/mcp/authorize");
    expect(url.searchParams.get("client_id")).toBe("mcp_abc");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://127.0.0.1:1234/callback",
    );
  });

  it("returns a sign-in path whose callbackUrl is the authorize path on this origin", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXTAUTH_URL", "https://warondisease.org");

    const path = buildMcpAuthorizeSignInPath({
      client_id: "mcp_abc",
      redirect_uri: "http://127.0.0.1:1234/callback",
      code_challenge: "challenge",
      scope: "tasks:personal",
    });

    expect(path.startsWith("/auth/signin?callbackUrl=")).toBe(true);
    const callbackUrl = decodeURIComponent(
      path.slice("/auth/signin?callbackUrl=".length),
    );
    expect(callbackUrl.startsWith("/mcp/authorize?")).toBe(true);
    expect(callbackUrl).not.toMatch(/^https?:\/\//);
    expect(callbackUrl).toContain("client_id=mcp_abc");
    expect(callbackUrl).toContain("code_challenge=challenge");
  });

  it("bounces campaign-host authorize hits to the issuer without looping loopback aliases", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXTAUTH_URL", "https://warondisease.org");

    expect(shouldRedirectMcpAuthorizeToIssuer("https://warondisease.org")).toBe(
      true,
    );
    expect(shouldRedirectMcpAuthorizeToIssuer(CANONICAL)).toBe(false);

    vi.stubEnv("VERCEL_ENV", "development");
    vi.stubEnv("MCP_OAUTH_ISSUER", "http://localhost:3001");
    expect(shouldRedirectMcpAuthorizeToIssuer("http://127.0.0.1:3001")).toBe(
      false,
    );
  });
});

describe("getProtectedResourceMetadata", () => {
  it("advertises the dialed host as the resource while the authorization server stays canonical", () => {
    stubCanonicalOrigin();
    const metadata = getProtectedResourceMetadata("https://optimitron.com");

    expect(metadata.resource).toBe("https://optimitron.com/api/mcp");
    expect(metadata.resource_documentation).toBe("https://optimitron.com/mcp");
    expect(metadata.authorization_servers).toEqual([CANONICAL]);
  });

  it("does not let an unserved host claim a resource identity", () => {
    stubCanonicalOrigin();
    const metadata = getProtectedResourceMetadata(
      "https://attacker.example.com",
    );

    expect(metadata.resource).toBe(`${CANONICAL}/api/mcp`);
    expect(metadata.authorization_servers).toEqual([CANONICAL]);
  });
});

describe("getMcpRequestOrigin", () => {
  it("prefers the proxy-forwarded host over the internal host header", () => {
    stubCanonicalOrigin();
    const origin = getMcpRequestOrigin(
      request({
        host: "optimitron-abc123.vercel.app",
        "x-forwarded-host": "optimitron.com",
        "x-forwarded-proto": "https",
      }),
    );

    expect(origin).toBe("https://optimitron.com");
  });

  it("uses the first entry when a proxy chain forwards a comma-joined host", () => {
    stubCanonicalOrigin();
    const origin = getMcpRequestOrigin(
      request({
        host: "internal.invalid",
        "x-forwarded-host": "dih.earth, internal.invalid",
        "x-forwarded-proto": "https, http",
      }),
    );

    expect(origin).toBe("https://dih.earth");
  });

  it("falls back to the canonical origin when no header identifies a served host", () => {
    stubCanonicalOrigin();
    expect(getMcpRequestOrigin(request({ host: "unknown.example.com" }))).toBe(
      CANONICAL,
    );
  });
});
