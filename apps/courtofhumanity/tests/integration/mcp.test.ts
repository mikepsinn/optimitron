import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpScope } from "@optimitron/db/enums";
import { prisma } from "@/lib/prisma";
import { createCourtMcpServer } from "../../lib/mcp/server";
import { COURT_TOOL_DEFINITIONS } from "../../lib/mcp/tools";

const prefix = "court-mcp-integration-";
const actor = {
  userId: `${prefix}user`,
  clientId: `${prefix}client`,
  grantId: `${prefix}grant`,
  isAdmin: false,
  scopes: [McpScope.EARTHDATA_WRITE],
  resource: "https://courtofhumanity.org/api/mcp",
};
async function connect(scopes = actor.scopes) {
  const server = createCourtMcpServer({ ...actor, scopes });
  const client = new Client({ name: "court-test", version: "1" });
  const [left, right] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(left), client.connect(right)]);
  return {
    client,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}
async function cleanup() {
  await prisma.mcpToolCallAudit.deleteMany({ where: { userId: actor.userId } });
  await prisma.courtCase.deleteMany({
    where: { slug: { startsWith: prefix } },
  });
  await prisma.referendum.deleteMany({
    where: { slug: { startsWith: `court-${prefix}` } },
  });
  await prisma.subject.deleteMany({
    where: { externalId: { startsWith: prefix } },
  });
  await prisma.oAuthGrant.deleteMany({ where: { clientId: actor.clientId } });
  await prisma.oAuthClient.deleteMany({ where: { clientId: actor.clientId } });
  await prisma.user.deleteMany({ where: { id: actor.userId } });
}
beforeAll(async () => {
  await cleanup();
  await prisma.user.create({
    data: { id: actor.userId, email: `${prefix}user@example.invalid` },
  });
  await prisma.oAuthClient.create({
    data: {
      clientId: actor.clientId,
      clientName: "Court integration test",
      redirectUris: ["http://localhost/callback"],
    },
  });
  await prisma.oAuthGrant.create({
    data: {
      id: actor.grantId,
      clientId: actor.clientId,
      userId: actor.userId,
      scopes: actor.scopes,
      resource: actor.resource,
    },
  });
});
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Court MCP protocol and database integration", () => {
  it("lists and executes all eight tools with server-derived ownership and redacted attribution", async () => {
    const { client, close } = await connect();
    try {
      expect((await client.listTools()).tools.map((t) => t.name)).toEqual(
        COURT_TOOL_DEFINITIONS.map((t) => t.name),
      );
      const call = async (name: string, args: Record<string, unknown>) => {
        const result = await client.callTool({ name, arguments: args });
        expect(result.isError, JSON.stringify(result)).not.toBe(true);
        return result.structuredContent as Record<string, any>;
      };
      const created = await call("upsertCourtCase", {
        slug: `${prefix}case`,
        title: "MCP case",
        isPublic: true,
        createdByUserId: "spoofed",
        summary: "private audit sentinel",
      });
      const caseId = created.case.id;
      expect(created.case.createdByUserId).toBe(actor.userId);
      const party = await call("addCourtCaseParty", {
        caseId,
        subjectExternalId: `${prefix}cohort`,
        subjectDisplayName: "Test cohort",
        subjectType: "COHORT",
        role: "NAMED_PLAINTIFF",
        isPublic: true,
      });
      const claim = await call("addCourtCaseClaim", {
        caseId,
        title: "Claim",
        argumentMarkdown: "Test argument",
        isPublic: true,
      });
      const harm = await call("addCourtCaseHarm", {
        caseId,
        title: "Harm",
        claimId: claim.claim.id,
        partyId: party.party.id,
        isPublic: true,
      });
      await call("addCourtCaseEvidence", {
        caseId,
        title: "Public evidence",
        sourceUrl: "https://example.org/evidence",
        claimId: claim.claim.id,
        harmId: harm.harm.id,
        isPublic: true,
      });
      await call("addCourtCaseRemedy", {
        caseId,
        title: "Remedy",
        bodyMarkdown: "Test remedy",
        claimId: claim.claim.id,
        isPublic: true,
      });
      await call("openCourtCaseJuryVote", { caseIdOrSlug: caseId });
      const read = await call("getCourtCase", { caseIdOrSlug: caseId });
      expect(read.case.id).toBe(caseId);
      const audits = await prisma.mcpToolCallAudit.findMany({
        where: { userId: actor.userId },
      });
      expect(audits).toHaveLength(7);
      expect(
        audits.every(
          (row) =>
            row.status === "SUCCEEDED" &&
            row.clientId === actor.clientId &&
            row.oauthGrantId === actor.grantId,
        ),
      ).toBe(true);
      expect(JSON.stringify(audits)).not.toContain("private audit sentinel");
      const denied = await client.callTool({
        name: "upsertCourtCase",
        arguments: { id: caseId, title: "", summary: "failure audit sentinel" },
      });
      expect(denied.isError).toBe(true);
      const failed = await prisma.mcpToolCallAudit.findFirst({
        where: { userId: actor.userId, status: "FAILED" },
      });
      expect(failed).not.toBeNull();
      expect(JSON.stringify(failed)).not.toContain("failure audit sentinel");
    } finally {
      await close();
    }
  });
  it("does not list or execute tools without write scope and rejects unknown tools", async () => {
    const { client, close } = await connect([]);
    try {
      expect((await client.listTools()).tools).toEqual([]);
      expect(
        (
          await client.callTool({
            name: "upsertCourtCase",
            arguments: { title: "Denied" },
          })
        ).isError,
      ).toBe(true);
      expect(
        (await client.callTool({ name: "createTask", arguments: {} })).isError,
      ).toBe(true);
    } finally {
      await close();
    }
  });
});
