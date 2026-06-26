import { beforeEach, describe, expect, it, vi } from "vitest";
import { McpScope } from "@/lib/mcp-scopes";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  userFindUnique: vi.fn(),
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
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}));

import { getCurrentUser, requireAuth } from "@/lib/auth-utils";

describe("auth-utils OAuth support", () => {
  beforeEach(() => {
    mocks.getServerSession.mockReset();
    mocks.userFindUnique.mockReset();
    mocks.verifyMcpAccessToken.mockReset();
  });

  it("accepts a valid OAuth Bearer token with a required scope", async () => {
    mocks.verifyMcpAccessToken.mockResolvedValue({
      clientId: "client_field_app",
      scopes: [McpScope.TASKS_PERSONAL],
      sub: "user_oauth",
    });
    mocks.userFindUnique.mockResolvedValue({
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
    mocks.userFindUnique.mockRejectedValue(dbError);

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
    mocks.userFindUnique
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
});
