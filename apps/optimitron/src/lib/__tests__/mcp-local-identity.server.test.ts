import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  userFindFirst: vi.fn(),
}));

vi.mock("../prisma", () => ({
  prisma: {
    user: {
      findFirst: mocks.userFindFirst,
    },
  },
}));

import { resolveLocalMcpIdentity } from "../mcp-local-identity.server";

describe("resolveLocalMcpIdentity", () => {
  beforeEach(() => {
    mocks.userFindFirst.mockReset();
    delete process.env.MCP_USER_EMAIL;
    delete process.env.MCP_USER_ID;
  });

  it("uses MCP_USER_ID without a database lookup", async () => {
    process.env.MCP_USER_ID = "user-123";

    await expect(resolveLocalMcpIdentity()).resolves.toEqual({
      isAdmin: true,
      userId: "user-123",
    });
    expect(mocks.userFindFirst).not.toHaveBeenCalled();
  });

  it("resolves MCP_USER_EMAIL to a user id and admin flag", async () => {
    process.env.MCP_USER_EMAIL = "m@example.com";
    mocks.userFindFirst.mockResolvedValue({ id: "user-email", isAdmin: false });

    await expect(resolveLocalMcpIdentity()).resolves.toEqual({
      isAdmin: false,
      userId: "user-email",
    });
    expect(mocks.userFindFirst).toHaveBeenCalledWith({
      where: { email: "m@example.com" },
      select: { id: true, isAdmin: true },
    });
  });

  it("returns null when no local MCP identity env var is configured", async () => {
    await expect(resolveLocalMcpIdentity()).resolves.toEqual({
      isAdmin: true,
      userId: undefined,
    });
  });
});
