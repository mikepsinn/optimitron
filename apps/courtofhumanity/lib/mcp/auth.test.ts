import { beforeEach, describe, expect, it, vi } from "vitest";
import { McpScope } from "@optimitron/db/enums";

const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  user: vi.fn(),
  grant: vi.fn(),
}));
vi.mock("@optimitron/mcp/auth", async (original) => ({
  ...(await original<object>()),
  createCourtMcpVerifier: () => mocks.verify,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: mocks.user },
    oAuthGrant: { findFirst: mocks.grant },
  },
}));
import { authenticateCourtRequest, courtResourceMetadata } from "./auth";

const resource = "https://courtofhumanity.org/api/mcp";
const request = () =>
  new Request(resource, { headers: { authorization: "Bearer signed-token" } });
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("VERCEL_ENV", "production");
  mocks.verify.mockResolvedValue({
    sub: "user",
    clientId: "client",
    resource,
    scopes: [McpScope.EARTHDATA_WRITE, McpScope.EARTHDATA_ADMIN],
    organizationIds: [],
  });
  mocks.user.mockResolvedValue({ id: "user", isAdmin: false });
  mocks.grant.mockResolvedValue({
    id: "grant",
    scopes: [McpScope.EARTHDATA_WRITE, McpScope.EARTHDATA_ADMIN],
  });
});
describe("Court request identity revalidation", () => {
  it("rereads current identity and exact resource grant on every request and intersects scopes", async () => {
    expect((await authenticateCourtRequest(request())).scopes).toEqual([
      McpScope.EARTHDATA_WRITE,
    ]);
    mocks.user.mockResolvedValue({ id: "user", isAdmin: true });
    mocks.grant.mockResolvedValue({
      id: "grant",
      scopes: [McpScope.EARTHDATA_WRITE],
    });
    expect((await authenticateCourtRequest(request())).scopes).toEqual([
      McpScope.EARTHDATA_WRITE,
    ]);
    expect(mocks.user).toHaveBeenCalledTimes(2);
    expect(mocks.user).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { id: "user", deletedAt: null } }),
    );
    expect(mocks.grant).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          userId: "user",
          clientId: "client",
          resource,
          active: true,
          revokedAt: null,
        },
      }),
    );
  });
  it.each(["user", "grant"] as const)("rejects unavailable %s", async (key) => {
    mocks[key].mockResolvedValue(null);
    await expect(authenticateCourtRequest(request())).rejects.toThrow();
  });
  it("rejects invalid token before database access", async () => {
    mocks.verify.mockRejectedValue(new Error("wrong audience"));
    await expect(authenticateCourtRequest(request())).rejects.toThrow();
    expect(mocks.user).not.toHaveBeenCalled();
    expect(mocks.grant).not.toHaveBeenCalled();
  });
  it("advertises Court as resource and Optimitron as issuer even with spoofed production overrides", () => {
    vi.stubEnv("MCP_OAUTH_ISSUER", "https://attacker.example");
    vi.stubEnv("MCP_COURT_RESOURCE", "https://attacker.example/api/mcp");
    expect(courtResourceMetadata()).toMatchObject({
      resource,
      authorization_servers: ["https://optimitron.com"],
      scopes_supported: ["earthdata:write", "earthdata:admin"],
    });
  });
});
