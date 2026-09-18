import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { hashRefreshToken } from "@/lib/mcp-oauth";

const mocks = vi.hoisted(() => ({ findGrant: vi.fn(), revokeGrant: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    oAuthGrant: { findFirst: mocks.findGrant, updateMany: mocks.revokeGrant },
  },
}));
import { POST } from "./route";

beforeEach(() => {
  vi.stubEnv("MCP_COURT_RESOURCE_ENABLED", "");
  mocks.findGrant.mockReset();
  mocks.revokeGrant.mockReset();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it("logs a generic failure without database or token details", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.findGrant.mockRejectedValueOnce(new Error("private credential detail"));
  const response = await POST(
    new Request("https://optimitron.com/api/mcp/oauth/revoke", {
      method: "POST",
      body: new URLSearchParams({ token: "private-token" }),
    }),
  );
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "server_error" });
  expect(log).toHaveBeenCalledWith("[oauth/revoke] unexpected failure");
  expect(JSON.stringify(log.mock.calls)).not.toContain("private");
});

it("revokes the hash-bound Court grant without a resource parameter, even with issuance disabled", async () => {
  const hash = hashRefreshToken("court-refresh");
  mocks.findGrant.mockImplementation(async ({ where }) =>
    where.refreshTokenHash === hash &&
    (!where.resource ||
      where.resource === "https://courtofhumanity.org/api/mcp")
      ? {
          id: "court-grant",
          resource: "https://courtofhumanity.org/api/mcp",
          active: true,
        }
      : null,
  );
  const request = (resource?: string) =>
    new Request("https://optimitron.com/api/mcp/oauth/revoke", {
      method: "POST",
      body: new URLSearchParams({
        token: "court-refresh",
        ...(resource ? { resource } : {}),
      }),
    });
  expect((await POST(request("https://dfda.earth/api/mcp"))).status).toBe(200);
  expect(mocks.revokeGrant).not.toHaveBeenCalled();
  expect((await POST(request())).status).toBe(200);
  expect(mocks.revokeGrant).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        id: "court-grant",
        resource: "https://courtofhumanity.org/api/mcp",
        refreshTokenHash: hash,
      },
    }),
  );
});
