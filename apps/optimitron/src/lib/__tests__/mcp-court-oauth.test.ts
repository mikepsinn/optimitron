import { readFileSync } from "node:fs";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  createLocalJWKSet,
  exportJWK,
  exportPKCS8,
  generateKeyPair,
  SignJWT,
} from "jose";
import {
  authenticateCourtMcpRequest,
  verifyCourtMcpAccessToken,
} from "@optimitron/mcp/auth";
import {
  COURT_MCP_RESOURCE,
  courtMcpResource,
} from "@optimitron/mcp/resources";
import {
  getCourtPublicJwks,
  resolveOAuthResource,
  signCourtMcpToken,
  verifyCourtMcpRefreshToken,
} from "../mcp-court-oauth";
import {
  signMcpAccessToken,
  verifyMcpAccessToken,
  verifyMcpRefreshToken,
} from "../mcp-oauth";

let keys: Awaited<ReturnType<typeof generateKeyPair>>;
let publicJwks: ReturnType<typeof getCourtPublicJwks>;
let pem: string;
const issuer = "https://optimitron.com";
beforeAll(async () => {
  keys = await generateKeyPair("RS256", { extractable: true });
  pem = await exportPKCS8(keys.privateKey);
  publicJwks = {
    keys: [
      {
        ...(await exportJWK(keys.publicKey)),
        kid: "test-court",
        alg: "RS256",
        use: "sig",
      },
    ],
  };
});
beforeEach(() => {
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("NEXTAUTH_SECRET", "legacy-test-secret");
  vi.stubEnv("MCP_COURT_RESOURCE_ENABLED", "1");
  vi.stubEnv("MCP_COURT_SIGNING_PRIVATE_KEY", pem);
  vi.stubEnv("MCP_COURT_SIGNING_KEY_ID", "test-court");
  vi.stubEnv("MCP_COURT_SIGNING_PUBLIC_JWKS", JSON.stringify(publicJwks));
});
afterEach(() => {
  vi.unstubAllEnvs();
});
const verify = (token: string) =>
  verifyCourtMcpAccessToken(token, {
    issuer,
    jwks: createLocalJWKSet(publicJwks),
  });

describe("Court resource credentials", () => {
  it("issues RS256 Court-only tokens and leaves legacy HS256 tokens working", async () => {
    const token = await signCourtMcpToken({
      userId: "user",
      clientId: "client",
      scopes: ["EARTHDATA_WRITE"],
      type: "access",
    });
    expect(await verify(token)).toMatchObject({
      sub: "user",
      clientId: "client",
      resource: COURT_MCP_RESOURCE,
      scopes: ["EARTHDATA_WRITE"],
    });
    await expect(verifyMcpAccessToken(token)).rejects.toThrow();
    const legacy = await signMcpAccessToken(
      "user",
      "client",
      ["TASKS_PERSONAL"],
      [],
    );
    expect(await verifyMcpAccessToken(legacy)).toMatchObject({ sub: "user" });
    await expect(verify(legacy)).rejects.toThrow();
  });

  it.each([
    { aud: "https://dfda.earth/api/mcp" },
    { iss: "https://other.invalid" },
    { type: "refresh" },
    { scopes: ["TASKS_ADMIN"] },
    { organizationIds: ["org"] },
    { exp: 1 },
    { sub: "" },
    { resource: "legacy" },
  ])("rejects invalid Court claims %j", async (overrides) => {
    const token = await new SignJWT({
      type: "access",
      sub: "user",
      clientId: "client",
      scopes: ["EARTHDATA_WRITE"],
      organizationIds: [],
      resource: COURT_MCP_RESOURCE,
      aud: COURT_MCP_RESOURCE,
      iss: issuer,
      exp: 4102444800,
      iat: 1780000000,
      ...overrides,
    })
      .setProtectedHeader({ alg: "RS256", kid: "test-court" })
      .sign(keys.privateKey);
    await expect(verify(token)).rejects.toThrow();
  });

  it("separates refresh and access credentials", async () => {
    const token = await signCourtMcpToken({
      userId: "user",
      clientId: "client",
      type: "refresh",
    });
    expect(await verifyCourtMcpRefreshToken(token)).toEqual({
      sub: "user",
      clientId: "client",
      resource: COURT_MCP_RESOURCE,
    });
    await expect(verify(token)).rejects.toThrow();
    await expect(verifyMcpRefreshToken(token)).rejects.toThrow();
  });

  it("does not issue Court credentials until explicitly enabled", async () => {
    vi.stubEnv("MCP_COURT_RESOURCE_ENABLED", "");
    expect(() => resolveOAuthResource(COURT_MCP_RESOURCE)).toThrow();
    expect(resolveOAuthResource(COURT_MCP_RESOURCE, true)).toBe(
      COURT_MCP_RESOURCE,
    );
    expect(resolveOAuthResource(undefined)).toBe("legacy");
    expect(resolveOAuthResource("https://dfda.earth/api/mcp")).toBe("legacy");
    expect(() =>
      resolveOAuthResource("https://attacker.invalid/api/mcp"),
    ).toThrow();
    await expect(
      signCourtMcpToken({ userId: "user", clientId: "client", type: "access" }),
    ).rejects.toThrow();
  });

  it("accepts issuer loopback aliases only with the configured protocol and port", () => {
    vi.stubEnv("VERCEL_ENV", "development");
    vi.stubEnv("MCP_OAUTH_ISSUER", "http://localhost:3001");
    expect(resolveOAuthResource("http://127.0.0.1:3001/api/mcp")).toBe(
      "legacy",
    );
    expect(resolveOAuthResource("http://[::1]:3001/api/mcp")).toBe("legacy");
    for (const resource of [
      "http://127.0.0.1:3017/api/mcp",
      "https://127.0.0.1:3001/api/mcp",
      "http://127.0.0.1:3001/api/mcp?x=1",
    ]) {
      expect(() => resolveOAuthResource(resource)).toThrow();
    }
    vi.stubEnv("VERCEL_ENV", "production");
    expect(() =>
      resolveOAuthResource("http://127.0.0.1:3001/api/mcp"),
    ).toThrow();
  });

  it("accepts dFDA's documented local resource without opening arbitrary resources or production loopback", () => {
    const dfdaPackage = JSON.parse(
      readFileSync(
        new URL("../../../../dfda/package.json", import.meta.url),
        "utf8",
      ),
    ) as { scripts: { dev: string } };
    const port = /--port\s+(\d+)/.exec(dfdaPackage.scripts.dev)?.[1];
    expect(port).toBeDefined();
    vi.stubEnv("VERCEL_ENV", "development");
    vi.stubEnv("MCP_OAUTH_ISSUER", "http://localhost:3001");
    // dFDA metadata uses the resource server's origin, not the issuer's port.
    const resources = ["localhost", "127.0.0.1", "[::1]"].map(
      (hostname) => `http://${hostname}:${port}/api/mcp`,
    );
    for (const resource of resources) {
      expect(resolveOAuthResource(resource)).toBe("legacy");
    }
    for (const resource of [
      `https://localhost:${port}/api/mcp`,
      `http://attacker.invalid:${port}/api/mcp`,
      `http://localhost:${port}/api/mcp?x=1`,
      `http://localhost:${port}/api/mcp/tools`,
      "http://localhost:3017/api/mcp",
    ]) {
      expect(() => resolveOAuthResource(resource)).toThrow();
    }
    vi.stubEnv("VERCEL_ENV", "production");
    for (const resource of resources) {
      expect(() => resolveOAuthResource(resource)).toThrow();
    }
  });

  it("pins production resource and permits only explicitly configured local resources", () => {
    expect(
      courtMcpResource("production", "https://other.invalid/api/mcp"),
    ).toBe(COURT_MCP_RESOURCE);
    expect(courtMcpResource("preview", "http://localhost:3017/api/mcp")).toBe(
      "http://localhost:3017/api/mcp",
    );
    expect(() =>
      courtMcpResource("preview", "http://other.invalid/api/mcp"),
    ).toThrow();
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("MCP_COURT_RESOURCE", "http://localhost:3017/api/mcp");
    expect(() => resolveOAuthResource(COURT_MCP_RESOURCE)).toThrow();
  });

  it("projects public JWKS members and rejects mismatched private keys", async () => {
    vi.stubEnv(
      "MCP_COURT_SIGNING_PUBLIC_JWKS",
      JSON.stringify({
        keys: [{ ...publicJwks.keys[0], d: "private", p: "private" }],
      }),
    );
    expect(getCourtPublicJwks()).toEqual(publicJwks);
    const otherKeys = await generateKeyPair("RS256", { extractable: true });
    vi.stubEnv(
      "MCP_COURT_SIGNING_PRIVATE_KEY",
      await exportPKCS8(otherKeys.privateKey),
    );
    await expect(
      signCourtMcpToken({ userId: "user", clientId: "client", type: "access" }),
    ).rejects.toThrow();
    vi.stubEnv("MCP_COURT_SIGNING_KEY_ID", "absent-key");
    await expect(
      signCourtMcpToken({ userId: "user", clientId: "client", type: "access" }),
    ).rejects.toThrow();
  });

  it("rechecks grant scope and current admin identity at every request", async () => {
    const token = await signCourtMcpToken({
      userId: "user",
      clientId: "client",
      type: "access",
      scopes: ["EARTHDATA_WRITE", "EARTHDATA_ADMIN"],
    });
    const request = new Request(COURT_MCP_RESOURCE, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const identity = {
      userId: "user",
      clientId: "client",
      grantId: "grant",
      resource: COURT_MCP_RESOURCE,
      scopes: ["EARTHDATA_WRITE", "EARTHDATA_ADMIN"] as const,
      isAdmin: false,
    };
    expect(
      await authenticateCourtMcpRequest(request, {
        verify,
        resolveIdentity: async () => identity,
      }),
    ).toMatchObject({ isAdmin: false, scopes: ["EARTHDATA_WRITE"] });
    await expect(
      authenticateCourtMcpRequest(request, {
        verify,
        resolveIdentity: async () => null,
      }),
    ).rejects.toThrow();
    await expect(
      authenticateCourtMcpRequest(request, {
        verify,
        resolveIdentity: async () => ({ ...identity, resource: "legacy" }),
      }),
    ).rejects.toThrow();
  });
});
