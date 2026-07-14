import { createHash } from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findAuthCode: vi.fn(),
  updateAuthCode: vi.fn(),
  findGrant: vi.fn(),
  upsertGrant: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    oAuthAuthCode: {
      findUnique: mocks.findAuthCode,
      update: mocks.updateAuthCode,
    },
    oAuthGrant: {
      findUnique: mocks.findGrant,
      upsert: mocks.upsertGrant,
    },
  },
}));

import { signMcpRefreshToken } from "@/lib/mcp-oauth";
import { POST } from "./route";

const CODE_VERIFIER = "oauth-test-code-verifier";
const CODE_CHALLENGE = createHash("sha256")
  .update(CODE_VERIFIER)
  .digest("base64url");

function tokenRequest(redirectUri?: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: "auth_code_1",
    client_id: "client_1",
    code_verifier: CODE_VERIFIER,
  });
  if (redirectUri) body.set("redirect_uri", redirectUri);

  return new Request("https://optimitron.com/api/mcp/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
}

function refreshRequest(refreshToken: string) {
  return new Request("https://optimitron.com/api/mcp/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: "client_1",
    }),
  });
}

describe("MCP OAuth token route", () => {
  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = "test-nextauth-secret";
    process.env.NEXTAUTH_URL = "https://optimitron.com";
    mocks.findAuthCode.mockReset();
    mocks.updateAuthCode.mockReset();
    mocks.findGrant.mockReset();
    mocks.upsertGrant.mockReset();
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
    });
    mocks.updateAuthCode.mockResolvedValue(null);
    mocks.upsertGrant.mockResolvedValue(null);
  });

  it("accepts the Codex loopback hostname alias on the same listener", async () => {
    const response = await POST(
      tokenRequest("http://127.0.0.1:61648/callback"),
    );

    expect(response.status).toBe(200);
    expect(mocks.updateAuthCode).toHaveBeenCalledWith({
      where: { id: "auth_code_row_1" },
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
});
