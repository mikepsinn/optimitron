import { createHash } from "crypto";
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
} from "jose";
import { verifyCourtMcpAccessToken } from "@optimitron/mcp/auth";
import { getCourtPublicJwks } from "@/lib/mcp-court-oauth";

const mocks = vi.hoisted(() => ({
  findAuthCode: vi.fn(),
  updateAuthCode: vi.fn(),
  findGrant: vi.fn(),
  upsertGrant: vi.fn(),
  findUser: vi.fn(),
  findCodeGrant: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    oAuthAuthCode: {
      findUnique: mocks.findAuthCode,
      updateMany: mocks.updateAuthCode,
    },
    oAuthGrant: {
      findFirst: mocks.findGrant,
      upsert: mocks.upsertGrant,
    },
    user: { findFirst: mocks.findUser },
    $transaction: async (fn: (db: unknown) => Promise<unknown>) =>
      fn({
        oAuthAuthCode: { updateMany: mocks.updateAuthCode },
        oAuthGrant: {
          findFirst: mocks.findCodeGrant,
          create: mocks.upsertGrant,
          update: mocks.upsertGrant,
        },
      }),
  },
}));

import { signMcpRefreshToken } from "@/lib/mcp-oauth";
import { POST } from "./route";

const CODE_VERIFIER = "oauth-test-code-verifier";
const CODE_CHALLENGE = createHash("sha256")
  .update(CODE_VERIFIER)
  .digest("base64url");

function tokenRequest(redirectUri?: string, resource?: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: "auth_code_1",
    client_id: "client_1",
    code_verifier: CODE_VERIFIER,
  });
  if (redirectUri) body.set("redirect_uri", redirectUri);
  if (resource) body.set("resource", resource);

  return new Request("https://optimitron.com/api/mcp/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
}

function refreshRequest(refreshToken: string, resource?: string) {
  return new Request("https://optimitron.com/api/mcp/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: "client_1",
      ...(resource ? { resource } : {}),
    }),
  });
}

describe("MCP OAuth token route", () => {
  let privatePem: string;
  let publicKeys: string;
  const courtResource = "https://courtofhumanity.org/api/mcp";
  beforeAll(async () => {
    const pair = await generateKeyPair("RS256", { extractable: true });
    privatePem = await exportPKCS8(pair.privateKey);
    publicKeys = JSON.stringify({
      keys: [{ ...(await exportJWK(pair.publicKey)), kid: "route-test" }],
    });
  });
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-14T12:00:00Z"));
    vi.stubEnv("NEXTAUTH_SECRET", "test-nextauth-secret");
    vi.stubEnv("NEXTAUTH_URL", "https://optimitron.com");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("MCP_COURT_RESOURCE_ENABLED", "1");
    vi.stubEnv("MCP_COURT_SIGNING_PRIVATE_KEY", privatePem);
    vi.stubEnv("MCP_COURT_SIGNING_KEY_ID", "route-test");
    vi.stubEnv("MCP_COURT_SIGNING_PUBLIC_JWKS", publicKeys);
    mocks.findAuthCode.mockReset();
    mocks.updateAuthCode.mockReset();
    mocks.findGrant.mockReset();
    mocks.upsertGrant.mockReset();
    mocks.findUser.mockReset();
    mocks.findUser.mockResolvedValue({ isAdmin: false });
    mocks.findCodeGrant.mockReset();
    mocks.findCodeGrant.mockResolvedValue(null);
    mocks.findAuthCode.mockResolvedValue({
      id: "auth_code_row_1",
      code: "auth_code_1",
      clientId: "client_1",
      userId: "user_1",
      redirectUri: "http://localhost:61648/callback",
      codeChallenge: CODE_CHALLENGE,
      scopes: ["TASKS_PERSONAL"],
      expiresAt: new Date(Date.now() + 60_000),
      used: false,
      resource: "legacy",
      organizationIds: [],
    });
    mocks.updateAuthCode.mockResolvedValue({ count: 1 });
    mocks.upsertGrant.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("accepts the Codex loopback hostname alias on the same listener", async () => {
    const response = await POST(
      tokenRequest("http://127.0.0.1:61648/callback"),
    );

    expect(response.status).toBe(200);
    expect(mocks.updateAuthCode).toHaveBeenCalledWith({
      where: {
        id: "auth_code_row_1",
        resource: "legacy",
        used: false,
        expiresAt: { gt: new Date() },
      },
      data: { used: true },
    });
    expect(mocks.upsertGrant).toHaveBeenCalledOnce();
  });

  it("rejects a different loopback callback port", async () => {
    const response = await POST(
      tokenRequest("http://127.0.0.1:49152/callback"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "invalid_grant",
      error_description: "redirect_uri mismatch",
    });
    expect(mocks.updateAuthCode).not.toHaveBeenCalled();
  });

  it("requires the callback URI used by the authorization request", async () => {
    const response = await POST(tokenRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "invalid_request",
      error_description:
        "code, client_id, redirect_uri, and code_verifier are required",
    });
    expect(mocks.findAuthCode).not.toHaveBeenCalled();
  });

  it("keeps the refresh token stable across access-token refreshes", async () => {
    const refreshToken = await signMcpRefreshToken("user_1", "client_1");
    mocks.findGrant.mockResolvedValue({
      id: "grant_1",
      active: true,
      clientId: "client_1",
      userId: "user_1",
      scopes: ["TASKS_PERSONAL"],
    });

    const response = await POST(refreshRequest(refreshToken));
    const body = (await response.json()) as {
      expires_in: number;
      refresh_token: string;
    };

    expect(response.status).toBe(200);
    expect(body.expires_in).toBe(24 * 60 * 60);
    expect(body.refresh_token).toBe(refreshToken);
  });

  it("only one concurrent exchange can claim an unused code", async () => {
    let used = false;
    mocks.updateAuthCode.mockImplementation(async () => {
      if (used) return { count: 0 };
      used = true;
      return { count: 1 };
    });
    const responses = await Promise.all([
      POST(tokenRequest("http://localhost:61648/callback")),
      POST(tokenRequest("http://localhost:61648/callback")),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 400,
    ]);
    expect(mocks.upsertGrant).toHaveBeenCalledOnce();
  });

  it("cannot exchange a Court code on the legacy resource", async () => {
    const code = await mocks.findAuthCode();
    mocks.findAuthCode.mockResolvedValue({
      ...code,
      resource: "https://courtofhumanity.org/api/mcp",
    });
    expect(
      (await POST(tokenRequest("http://localhost:61648/callback"))).status,
    ).toBe(400);
    expect(mocks.updateAuthCode).not.toHaveBeenCalled();
  });

  it("rejects deleted users before consuming their code", async () => {
    mocks.findUser.mockResolvedValue(null);
    expect(
      (await POST(tokenRequest("http://localhost:61648/callback"))).status,
    ).toBe(400);
    expect(mocks.updateAuthCode).not.toHaveBeenCalled();
  });

  it("binds Court exchange and refresh to one resource and current permissions", async () => {
    const code = await mocks.findAuthCode();
    mocks.findAuthCode.mockResolvedValue({
      ...code,
      resource: courtResource,
      scopes: ["EARTHDATA_WRITE", "EARTHDATA_ADMIN", "TASKS_PERSONAL"],
    });
    const response = await POST(
      tokenRequest("http://localhost:61648/callback", courtResource),
    );
    expect(response.status).toBe(200);
    const tokens = await response.json();
    const verify = (token: string) =>
      verifyCourtMcpAccessToken(token, {
        issuer: "https://optimitron.com",
        jwks: createLocalJWKSet(getCourtPublicJwks()),
      });
    expect(await verify(tokens.access_token)).toMatchObject({
      resource: courtResource,
      scopes: ["EARTHDATA_WRITE"],
    });
    expect(mocks.upsertGrant.mock.calls[0]?.[0].data).toMatchObject({
      clientId: "client_1",
      userId: "user_1",
      resource: courtResource,
    });
    mocks.findGrant.mockResolvedValue({
      id: "court-grant",
      active: true,
      clientId: "client_1",
      userId: "user_1",
      resource: courtResource,
      scopes: ["EARTHDATA_WRITE", "EARTHDATA_ADMIN"],
    });
    expect((await POST(refreshRequest(tokens.refresh_token))).status).toBe(400);
    const refreshed = await POST(
      refreshRequest(tokens.refresh_token, courtResource),
    );
    expect(refreshed.status).toBe(200);
    expect(await verify((await refreshed.json()).access_token)).toMatchObject({
      scopes: ["EARTHDATA_WRITE"],
    });
    mocks.findGrant.mockResolvedValue(null);
    expect(
      (await POST(refreshRequest(tokens.refresh_token, courtResource))).status,
    ).toBe(400);
  });
});
