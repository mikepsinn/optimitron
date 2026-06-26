import { describe, expect, it } from "vitest";
import { getDeveloperOpenApiDocument } from "@/lib/developer-openapi";

describe("developer OpenAPI document", () => {
  it("publishes OAuth, MCP, task, referral, vote, people, and organization APIs", () => {
    const doc = getDeveloperOpenApiDocument("https://optimitron.test/");

    expect(doc.openapi).toBe("3.1.0");
    expect(doc.servers).toEqual([{ url: "https://optimitron.test" }]);
    expect(doc.paths).toHaveProperty("/api/mcp/oauth/register");
    expect(doc.paths).toHaveProperty("/api/mcp/oauth/authorize");
    expect(doc.paths).toHaveProperty("/api/mcp/oauth/token");
    expect(doc.paths).toHaveProperty("/api/mcp/tools");
    expect(doc.paths).toHaveProperty("/api/tasks");
    expect(doc.paths).toHaveProperty("/api/referral-invitations");
    expect(doc.paths).toHaveProperty("/api/referendums/{slug}/vote");
    expect(doc.paths).toHaveProperty("/api/profile");
    expect(doc.paths).toHaveProperty("/api/people/search");
    expect(doc.paths).toHaveProperty("/api/organizations");

    const oauth =
      doc.components.securitySchemes.OptimitronOAuth.flows.authorizationCode;
    expect(oauth.authorizationUrl).toBe(
      "https://optimitron.test/api/mcp/oauth/authorize",
    );
    expect(oauth.tokenUrl).toBe("https://optimitron.test/api/mcp/oauth/token");
    expect(oauth.scopes).toHaveProperty("tasks:personal");
    expect(oauth.scopes).toHaveProperty("earthdata:write");
    expect(oauth.scopes).toHaveProperty("tasks:admin");
  });

  it("marks write endpoints with the scope external apps need", () => {
    const doc = getDeveloperOpenApiDocument("https://optimitron.test");

    expect(doc.paths["/api/tasks"].post.security).toEqual([
      { OptimitronOAuth: ["tasks:personal"] },
    ]);
    expect(doc.paths["/api/referendums/{slug}/vote"].post.security).toEqual([
      { OptimitronOAuth: ["earthdata:write"] },
    ]);
    expect(doc.paths["/api/organizations"].post.security).toEqual([
      { OptimitronOAuth: ["earthdata:write"] },
    ]);
  });
});
