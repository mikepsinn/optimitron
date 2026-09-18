import { beforeEach, describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { McpScope } from "@optimitron/db/enums";
const auth = vi.hoisted(() => vi.fn());
vi.mock("@/lib/mcp/auth", () => ({
  authenticateCourtRequest: auth,
  courtMcpConfig: () => ({
    resource: "https://courtofhumanity.org/api/mcp",
    issuer: "https://optimitron.com",
  }),
}));
import { POST, GET, DELETE, OPTIONS } from "./route";
const endpoint = "https://courtofhumanity.org/api/mcp";
beforeEach(() => {
  auth.mockReset();
});
describe("Court Streamable HTTP boundary", () => {
  it("challenges every protected method with Court discovery and exposes CORS headers", async () => {
    auth.mockRejectedValue(new Error("Invalid bearer"));
    for (const [method, handler] of [
      ["GET", GET],
      ["POST", POST],
      ["DELETE", DELETE],
    ] as const) {
      const response = await handler(new Request(endpoint, { method }));
      expect(response.status).toBe(401);
      expect(response.headers.get("WWW-Authenticate")).toContain(
        'resource_metadata="https://courtofhumanity.org/.well-known/oauth-protected-resource/api/mcp"',
      );
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(await response.json()).toMatchObject({ error: "invalid_token" });
    }
    expect(OPTIONS().status).toBe(204);
  });
  it("supports SDK initialization, list and scope-denied call across independent HTTP requests", async () => {
    auth.mockResolvedValue({
      userId: "u",
      clientId: "c",
      grantId: "g",
      resource: endpoint,
      scopes: [McpScope.EARTHDATA_WRITE],
      isAdmin: false,
    });
    const client = new Client({ name: "court-http-test", version: "1" });
    const transport = new StreamableHTTPClientTransport(new URL(endpoint), {
      fetch: async (url, init) => {
        const request = new Request(url, init);
        return request.method === "POST"
          ? POST(request)
          : request.method === "DELETE"
            ? DELETE(request)
            : GET(request);
      },
      requestInit: { headers: { authorization: "Bearer court-test" } },
    });
    try {
      await client.connect(transport);
      expect((await client.listTools()).tools).toHaveLength(8);
      auth.mockResolvedValue({
        userId: "u",
        clientId: "c",
        grantId: "g",
        resource: endpoint,
        scopes: [],
        isAdmin: false,
      });
      const denied = await client.callTool({
        name: "upsertCourtCase",
        arguments: { title: "Denied" },
      });
      expect(denied.isError).toBe(true);
      expect(auth.mock.calls.length).toBeGreaterThanOrEqual(4);
    } finally {
      await client.close();
    }
  });
});
