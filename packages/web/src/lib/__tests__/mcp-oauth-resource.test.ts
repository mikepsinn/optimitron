import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getMcpRequestOrigin,
  getProtectedResourceMetadata,
  resolveMcpResourceOrigin,
} from "@/lib/mcp-oauth";

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
});

describe("getProtectedResourceMetadata", () => {
  it("advertises the dialed host as the resource while the authorization server stays canonical", () => {
    stubCanonicalOrigin();
    const metadata = getProtectedResourceMetadata("https://optimitron.com");

    // The mismatch this guards against: `resource` naming a different host
    // than the endpoint the client connected to, which clients reject during
    // discovery.
    expect(metadata.resource).toBe("https://optimitron.com/api/mcp");
    expect(metadata.resource_documentation).toBe("https://optimitron.com/mcp");
    // Sessions, consent, and token issuance live on exactly one origin.
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
