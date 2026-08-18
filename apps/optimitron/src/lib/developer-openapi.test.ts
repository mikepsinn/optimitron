import { describe, expect, it } from "vitest";
import { getDeveloperOpenApiDocument } from "@/lib/developer-openapi";

describe("developer OpenAPI document", () => {
  it("publishes OAuth, MCP, task, content, referral, vote, people, and organization APIs", () => {
    const doc = getDeveloperOpenApiDocument("https://optimitron.test/");

    expect(doc.openapi).toBe("3.1.0");
    expect(doc.servers).toEqual([{ url: "https://optimitron.test" }]);
    expect(doc.paths).toHaveProperty("/api/mcp/oauth/register");
    expect(doc.paths).toHaveProperty("/api/mcp/oauth/authorize");
    expect(doc.paths).toHaveProperty("/api/mcp/oauth/token");
    expect(doc.paths).toHaveProperty("/api/mcp/tools");
    expect(doc.paths).toHaveProperty("/api/tasks");
    expect(doc.paths).toHaveProperty("/api/tasks/{id}/release");
    expect(doc.paths).toHaveProperty("/api/documents");
    expect(doc.paths).toHaveProperty("/api/collections/{id}/records");
    expect(doc.paths).toHaveProperty("/api/collections/{id}/records/batch");
    expect(doc.paths).toHaveProperty("/api/content/search");
    expect(doc.paths).toHaveProperty("/api/content/export");
    expect(doc.paths).toHaveProperty("/api/content/access");
    expect(doc.paths).toHaveProperty("/api/content/attachments/{attachmentId}");
    expect(doc.paths).toHaveProperty("/api/content/imports/notion");
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
      { OptimitronOAuth: ["tasks:admin"] },
    ]);
    expect(doc.paths["/api/tasks"].get.security).toEqual([
      {},
      { OptimitronOAuth: ["tasks:personal"] },
      { OptimitronOAuth: ["tasks:admin"] },
    ]);
    expect(doc.paths["/api/tasks/{id}"].get.security).toEqual([
      {},
      { OptimitronOAuth: ["tasks:personal"] },
      { OptimitronOAuth: ["tasks:admin"] },
    ]);
    expect(doc.paths["/api/tasks/{id}/comments"].post.security).toEqual([
      { OptimitronOAuth: ["tasks:personal"] },
      { OptimitronOAuth: ["tasks:admin"] },
    ]);
    expect(
      doc.paths["/api/tasks/{id}/complete"].post.requestBody,
    ).toMatchObject({
      required: true,
      content: {
        "application/json": {
          schema: { required: ["completionEvidence"] },
        },
      },
    });
    expect(doc.paths["/api/documents"].post.security).toEqual([
      { OptimitronOAuth: ["tasks:personal"] },
      { OptimitronOAuth: ["tasks:admin"] },
    ]);
    expect(doc.paths["/api/content/access"].post.security).toEqual([
      { OptimitronOAuth: ["tasks:personal"] },
      { OptimitronOAuth: ["tasks:admin"] },
    ]);
    expect(
      doc.paths["/api/collections/{id}/records/batch"].post.security,
    ).toEqual([
      { OptimitronOAuth: ["tasks:personal"] },
      { OptimitronOAuth: ["tasks:admin"] },
    ]);
    expect(doc.paths["/api/people/search"].get.security).toEqual([
      { OptimitronOAuth: ["tasks:personal"] },
      { OptimitronOAuth: ["earthdata:write"] },
    ]);
    expect(doc.paths["/api/referendums/{slug}/vote"].post.security).toEqual([
      { OptimitronOAuth: ["earthdata:write"] },
    ]);
    expect(doc.paths["/api/organizations"].post.security).toEqual([
      { OptimitronOAuth: ["earthdata:write"] },
      { OptimitronOAuth: ["tasks:admin"] },
    ]);
    expect(doc.paths["/api/organizations/{id}"].patch.security).toEqual([
      { OptimitronOAuth: ["earthdata:write"] },
      { OptimitronOAuth: ["tasks:admin"] },
    ]);
  });

  it("models OAuth token request fields per grant type", () => {
    const doc = getDeveloperOpenApiDocument("https://optimitron.test");

    expect(doc.components.schemas.OAuthTokenRequest).toMatchObject({
      oneOf: [
        {
          properties: {
            grant_type: { const: "authorization_code" },
          },
          required: [
            "grant_type",
            "code",
            "client_id",
            "redirect_uri",
            "code_verifier",
          ],
        },
        {
          properties: {
            grant_type: { const: "refresh_token" },
          },
          required: ["grant_type", "client_id", "refresh_token"],
        },
      ],
    });
  });

  it("publishes concrete document, collection, and import contracts", () => {
    const doc = getDeveloperOpenApiDocument("https://optimitron.test");

    expect(
      doc.paths["/api/documents"].post.requestBody.content["application/json"]
        .schema,
    ).toEqual({ $ref: "#/components/schemas/CreateDocumentRequest" });
    expect(doc.paths["/api/collections/{id}/records"].get.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "filters", in: "query" }),
        expect.objectContaining({ name: "sorts", in: "query" }),
        { $ref: "#/components/parameters/cursor" },
      ]),
    );
    expect(
      doc.paths["/api/collections/{id}/records"].post.requestBody.content[
        "application/json"
      ].schema,
    ).toEqual({
      $ref: "#/components/schemas/CreateCollectionRecordRequest",
    });
    expect(
      doc.paths["/api/content/access"].post.requestBody.content[
        "application/json"
      ].schema,
    ).toEqual({ $ref: "#/components/schemas/ContentGrantRequest" });
    expect(
      doc.paths["/api/content/imports/notion"].post.requestBody.content[
        "application/json"
      ].schema,
    ).toEqual({ $ref: "#/components/schemas/NotionImportRequest" });
    expect(doc.components.schemas.NotionImportBundle).toMatchObject({
      required: ["workspaceId"],
      properties: {
        collections: {
          items: {
            required: ["sourceId", "name"],
            properties: {
              fields: { type: "array", maxItems: 200 },
              records: { type: "array", maxItems: 20000 },
            },
          },
        },
      },
    });
  });
});
