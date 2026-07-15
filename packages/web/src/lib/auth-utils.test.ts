import { beforeEach, describe, expect, it, vi } from "vitest";
import { McpScope } from "@/lib/mcp-scopes";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  oAuthGrantFindFirst: vi.fn(),
  userFindFirst: vi.fn(),
  verifyMcpAccessToken: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/mcp-oauth", () => ({
  verifyMcpAccessToken: mocks.verifyMcpAccessToken,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    oAuthGrant: {
      findFirst: mocks.oAuthGrantFindFirst,
    },
    user: {
      findFirst: mocks.userFindFirst,
    },
  },
}));

import {
  getCurrentUser,
  hasBearerAuthorization,
  requireAuth,
} from "@/lib/auth-utils";

describe("auth-utils OAuth support", () => {
  beforeEach(() => {
    mocks.getServerSession.mockReset();
    mocks.oAuthGrantFindFirst.mockReset();
    mocks.userFindFirst.mockReset();
    mocks.verifyMcpAccessToken.mockReset();
    mocks.oAuthGrantFindFirst.mockResolvedValue({
      scopes: [McpScope.TASKS_PERSONAL],
    });
    mocks.userFindFirst.mockResolvedValue({
      email: "dev@example.org",
      id: "user_oauth",
    });
  });

  it("accepts a valid OAuth Bearer token with a required scope", async () => {
    mocks.verifyMcpAccessToken.mockResolvedValue({
      clientId: "client_field_app",
      scopes: [McpScope.TASKS_PERSONAL],
      sub: "user_oauth",
    });
    mocks.userFindFirst.mockResolvedValue({
      email: "dev@example.org",
      id: "user_oauth",
    });

    const auth = await requireAuth(
      new Request("https://optimitron.test/api/tasks", {
        headers: { Authorization: "Bearer access_token" },
      }),
      [McpScope.TASKS_PERSONAL],
    );

    expect(auth).toEqual({
      clientId: "client_field_app",
      scopes: [McpScope.TASKS_PERSONAL],
      userEmail: "dev@example.org",
      userId: "user_oauth",
    });
    expect(mocks.verifyMcpAccessToken).toHaveBeenCalledWith("access_token");
    expect(mocks.getServerSession).not.toHaveBeenCalled();
  });

  it("accepts the Bearer scheme case-insensitively", async () => {
    mocks.verifyMcpAccessToken.mockResolvedValue({
      clientId: "client_field_app",
      scopes: [McpScope.TASKS_PERSONAL],
      sub: "user_oauth",
    });
    mocks.userFindFirst.mockResolvedValue({
      email: "dev@example.org",
      id: "user_oauth",
    });

    const request = new Request("https://optimitron.test/api/tasks", {
      headers: { Authorization: "bearer access_token" },
    });

    await expect(requireAuth(request, [McpScope.TASKS_PERSONAL])).resolves.toMatchObject({
      userId: "user_oauth",
    });
    expect(hasBearerAuthorization(request)).toBe(true);
    expect(mocks.verifyMcpAccessToken).toHaveBeenCalledWith("access_token");
    expect(mocks.getServerSession).not.toHaveBeenCalled();
  });

  it("rejects malformed Bearer headers instead of falling back to the session", async () => {
    mocks.getServerSession.mockResolvedValue({
      user: { email: "browser@example.org", id: "user_session" },
    });

    const request = new Request("https://optimitron.test/api/tasks", {
      headers: { Authorization: "Bearer   " },
    });

    await expect(requireAuth(request, [McpScope.TASKS_PERSONAL])).rejects.toThrow(
      "Unauthorized",
    );
    expect(hasBearerAuthorization(request)).toBe(true);
    expect(mocks.verifyMcpAccessToken).not.toHaveBeenCalled();
    expect(mocks.getServerSession).not.toHaveBeenCalled();
  });

  it("rejects OAuth tokens that do not carry one of the required scopes", async () => {
    mocks.verifyMcpAccessToken.mockResolvedValue({
      clientId: "client_field_app",
      scopes: [McpScope.TASKS_PERSONAL],
      sub: "user_oauth",
    });

    await expect(
      requireAuth(
        new Request("https://optimitron.test/api/organizations", {
          headers: { Authorization: "Bearer access_token" },
        }),
        [McpScope.EARTHDATA_WRITE],
      ),
    ).rejects.toThrow("Unauthorized");
    expect(mocks.getServerSession).not.toHaveBeenCalled();
  });

  it("does not turn user lookup failures into Unauthorized", async () => {
    const dbError = new Error("database unavailable");
    mocks.verifyMcpAccessToken.mockResolvedValue({
      clientId: "client_field_app",
      scopes: [McpScope.TASKS_PERSONAL],
      sub: "user_oauth",
    });
    mocks.userFindFirst.mockRejectedValue(dbError);

    await expect(
      requireAuth(
        new Request("https://optimitron.test/api/tasks", {
          headers: { Authorization: "Bearer access_token" },
        }),
        [McpScope.TASKS_PERSONAL],
      ),
    ).rejects.toBe(dbError);
    expect(mocks.getServerSession).not.toHaveBeenCalled();
  });

  it("falls back to the NextAuth session when there is no Bearer token", async () => {
    mocks.getServerSession.mockResolvedValue({
      user: { email: "browser@example.org", id: "user_session" },
    });
    mocks.userFindFirst.mockResolvedValue({
      email: "browser@example.org",
      id: "user_session",
    });

    await expect(requireAuth()).resolves.toEqual({
      userEmail: "browser@example.org",
      userId: "user_session",
    });
    expect(mocks.verifyMcpAccessToken).not.toHaveBeenCalled();
  });

  it("loads the full current user for an OAuth token", async () => {
    const fullUser = {
      email: "dev@example.org",
      id: "user_oauth",
      person: { displayName: "Dev Example", handle: "dev", id: "person_1" },
    };
    mocks.verifyMcpAccessToken.mockResolvedValue({
      clientId: "client_field_app",
      scopes: [McpScope.TASKS_PERSONAL],
      sub: "user_oauth",
    });
    mocks.userFindFirst
      .mockResolvedValueOnce({ email: "dev@example.org", id: "user_oauth" })
      .mockResolvedValueOnce(fullUser);

    await expect(
      getCurrentUser(
        new Request("https://optimitron.test/api/tasks/task_1/comments", {
          headers: { Authorization: "Bearer access_token" },
        }),
        [McpScope.TASKS_PERSONAL],
      ),
    ).resolves.toBe(fullUser);
    expect(mocks.getServerSession).not.toHaveBeenCalled();
  });

  it("rejects a token after its OAuth grant is revoked", async () => {
    mocks.verifyMcpAccessToken.mockResolvedValue({
      clientId: "client_field_app",
      scopes: [McpScope.TASKS_PERSONAL],
      sub: "user_oauth",
    });
    mocks.oAuthGrantFindFirst.mockResolvedValue(null);

    await expect(
      requireAuth(
        new Request("https://optimitron.test/api/tasks", {
          headers: { Authorization: "Bearer access_token" },
        }),
        [McpScope.TASKS_PERSONAL],
      ),
    ).rejects.toThrow("Unauthorized");
  });
});
