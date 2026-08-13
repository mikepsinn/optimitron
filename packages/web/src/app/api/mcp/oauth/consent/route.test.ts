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

  it("omits organization access when no organizations are selected", async () => {
    const response = await POST(
      consentRequest({
        client_id: "mcp_client",
        redirect_uri: "http://127.0.0.1:9999/callback",
        state: "state-1",
        scope: "tasks:personal tasks:organization",
        code_challenge: "challenge",
        approved: true,
        organization_ids: [],
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.findMemberships).not.toHaveBeenCalled();
    expect(mocks.createAuthCode).toHaveBeenCalledWith({
      data: expect.objectContaining({
        scopes: ["TASKS_PERSONAL"],
        organizationIds: [],
      }),
    });
  });

  it("allows public-only access when organization access was the only scope", async () => {
    const response = await POST(
      consentRequest({
        client_id: "mcp_client",
        redirect_uri: "http://127.0.0.1:9999/callback",
        scope: "tasks:organization",
        code_challenge: "challenge",
        approved: true,
        organization_ids: [],
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.findMemberships).not.toHaveBeenCalled();
    expect(mocks.createAuthCode).toHaveBeenCalledWith({
      data: expect.objectContaining({
        scopes: [],
        organizationIds: [],
      }),
    });
  });

  it("rejects requests with no recognized scopes", async () => {
    const response = await POST(
      consentRequest({
        client_id: "mcp_client",
        redirect_uri: "http://127.0.0.1:9999/callback",
        scope: "unknown:scope",
        code_challenge: "challenge",
        approved: true,
        organization_ids: [],
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "invalid_scope" });
    expect(mocks.createAuthCode).not.toHaveBeenCalled();
  });

  it("keeps organization access for selected member organizations", async () => {
    mocks.findMemberships.mockResolvedValue([
      { organizationId: "organization_1" },
    ]);

    const response = await POST(
      consentRequest({
        client_id: "mcp_client",
        redirect_uri: "http://127.0.0.1:9999/callback",
        scope: "tasks:personal tasks:organization",
        code_challenge: "challenge",
        approved: true,
        organization_ids: ["organization_1"],
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.createAuthCode).toHaveBeenCalledWith({
      data: expect.objectContaining({
        scopes: ["TASKS_PERSONAL", "TASKS_ORGANIZATION"],
        organizationIds: ["organization_1"],
      }),
    });
  });

  it("rejects organization IDs outside the user's memberships", async () => {
    const response = await POST(
      consentRequest({
        client_id: "mcp_client",
        redirect_uri: "http://127.0.0.1:9999/callback",
        scope: "tasks:personal tasks:organization",
        code_challenge: "challenge",
        approved: true,
        organization_ids: ["organization_unauthorized"],
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "invalid_scope",
    });
    expect(mocks.createAuthCode).not.toHaveBeenCalled();
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
