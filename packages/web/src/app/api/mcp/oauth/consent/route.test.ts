import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  findClient: vi.fn(),
  findUser: vi.fn(),
  findMemberships: vi.fn(),
  createAuthCode: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    oAuthClient: { findUnique: mocks.findClient },
    user: { findUnique: mocks.findUser },
    organizationMember: { findMany: mocks.findMemberships },
    oAuthAuthCode: { create: mocks.createAuthCode },
  },
}));

import { POST } from "./route";

function consentRequest(body: Record<string, unknown>) {
  return new Request("https://optimitron.com/api/mcp/oauth/consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("MCP OAuth consent route (Authorize)", () => {
  beforeEach(() => {
    mocks.getServerSession.mockReset();
    mocks.findClient.mockReset();
    mocks.findUser.mockReset();
    mocks.findMemberships.mockReset();
    mocks.createAuthCode.mockReset();

    mocks.getServerSession.mockResolvedValue({
      user: { id: "user_1", email: "mike@example.com" },
    });
    mocks.findClient.mockResolvedValue({
      clientId: "mcp_client",
      redirectUris: ["http://127.0.0.1:9999/callback"],
    });
    mocks.findUser.mockResolvedValue({ isAdmin: false });
    mocks.findMemberships.mockResolvedValue([]);
    mocks.createAuthCode.mockResolvedValue({ id: "code_row" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns a redirect_url with an auth code when Authorize succeeds", async () => {
    const response = await POST(
      consentRequest({
        client_id: "mcp_client",
        redirect_uri: "http://127.0.0.1:9999/callback",
        state: "state-1",
        scope: "tasks:personal",
        code_challenge: "challenge",
        approved: true,
        organization_ids: [],
      }),
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.redirect_url).toMatch(
      /^http:\/\/127\.0\.0\.1:9999\/callback\?code=.+&state=state-1$/,
    );
    expect(mocks.createAuthCode).toHaveBeenCalledOnce();
  });

  it("rejects Authorize when the session is missing", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    const response = await POST(
      consentRequest({
        client_id: "mcp_client",
        redirect_uri: "http://127.0.0.1:9999/callback",
        scope: "tasks:personal",
        code_challenge: "challenge",
        approved: true,
      }),
    );

    expect(response.status).toBe(401);
    expect(mocks.createAuthCode).not.toHaveBeenCalled();
  });
});
