import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findClient: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    oAuthClient: {
      findUnique: mocks.findClient,
    },
  },
}));

import { GET } from "./route";

describe("MCP OAuth authorize route", () => {
  beforeEach(() => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXTAUTH_URL", "https://warondisease.org");
    mocks.findClient.mockReset();
    mocks.findClient.mockResolvedValue({
      clientId: "mcp_client",
      clientName: "Cursor",
      redirectUris: ["http://127.0.0.1:9999/callback"],
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("redirects consent to optimitron.com even when authorize is hit on warondisease.org", async () => {
    const response = await GET(
      new Request(
        "https://warondisease.org/api/mcp/oauth/authorize?response_type=code&client_id=mcp_client&redirect_uri=http%3A%2F%2F127.0.0.1%3A9999%2Fcallback&code_challenge=abc&state=xyz&scope=tasks%3Apersonal",
      ),
    );

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBeTruthy();
    const consent = new URL(location!);
    expect(consent.origin).toBe("https://optimitron.com");
    expect(consent.pathname).toBe("/mcp/authorize");
    expect(consent.searchParams.get("client_id")).toBe("mcp_client");
    expect(consent.searchParams.get("redirect_uri")).toBe(
      "http://127.0.0.1:9999/callback",
    );
    expect(consent.searchParams.get("code_challenge")).toBe("abc");
    expect(consent.searchParams.get("state")).toBe("xyz");
    expect(consent.searchParams.get("scope")).toBe("tasks:personal");
    expect(consent.searchParams.get("client_name")).toBe("Cursor");
  });

  it("carries an enabled Court resource into canonical consent", async () => {
    vi.stubEnv("MCP_COURT_RESOURCE_ENABLED", "1");
    const url = new URL("https://optimitron.com/api/mcp/oauth/authorize");
    url.search = new URLSearchParams({
      response_type: "code",
      client_id: "mcp_client",
      redirect_uri: "http://127.0.0.1:9999/callback",
      code_challenge: "abc",
      resource: "https://courtofhumanity.org/api/mcp",
    }).toString();
    const response = await GET(new Request(url));
    expect(response.status).toBe(307);
    expect(
      new URL(response.headers.get("location")!).searchParams.get("resource"),
    ).toBe("https://courtofhumanity.org/api/mcp");
    url.searchParams.append("resource", "https://dfda.earth/api/mcp");
    expect((await GET(new Request(url))).status).toBe(400);
  });
});
