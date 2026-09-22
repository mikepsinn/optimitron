import { createHash } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { POST } from "./route";

const clientId = "oauth-resource-transaction-test-client";
const userId = "oauth-resource-transaction-test-user";
const code = "oauth-resource-transaction-test-code";
const verifier = "oauth-resource-transaction-test-verifier";
const callback = "http://127.0.0.1:9191/callback";

beforeAll(async () => {
  const url = new URL(process.env.DATABASE_URL ?? "");
  if (
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    !/(^|_)test($|_)/.test(url.pathname.slice(1))
  ) {
    throw new Error(
      "OAuth transaction tests require an isolated local test database",
    );
  }
  await prisma.user.create({
    data: { id: userId, email: "oauth-transaction@example.invalid" },
  });
  await prisma.oAuthClient.create({
    data: { clientId, redirectUris: [callback] },
  });
});

beforeEach(async () => {
  await prisma.oAuthAuthCode.deleteMany({ where: { clientId } });
  await prisma.oAuthGrant.deleteMany({ where: { clientId } });
  await prisma.oAuthAuthCode.create({
    data: {
      code,
      clientId,
      userId,
      redirectUri: callback,
      codeChallenge: createHash("sha256").update(verifier).digest("base64url"),
      scopes: ["TASKS_PERSONAL"],
      expiresAt: new Date("2099-01-01T00:00:00Z"),
    },
  });
});

afterAll(async () => {
  await prisma.oAuthClient.deleteMany({ where: { clientId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

function request() {
  return new Request("http://localhost:3001/api/mcp/oauth/token", {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      code,
      code_verifier: verifier,
      redirect_uri: callback,
    }),
  });
}

describe("OAuth code transactions in PostgreSQL", () => {
  it("consumes a code once under concurrent exchanges and defaults old writers to legacy", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => POST(request())),
    );
    expect(results.map((result) => result.status).sort()).toEqual([
      200, 400, 400, 400, 400,
    ]);
    expect(
      await prisma.oAuthGrant.count({
        where: { clientId, userId, resource: "legacy" },
      }),
    ).toBe(1);
    expect(
      await prisma.oAuthAuthCode.findUnique({ where: { code } }),
    ).toMatchObject({ used: true, resource: "legacy" });
  });

  it("keeps Court and legacy grants independent after the final constraint migration", async () => {
    const courtGrant = await prisma.oAuthGrant.create({
      data: {
        clientId,
        userId,
        resource: "https://courtofhumanity.org/api/mcp",
        scopes: ["EARTHDATA_WRITE"],
      },
    });
    expect((await POST(request())).status).toBe(200);
    expect(
      await prisma.oAuthAuthCode.findUnique({ where: { code } }),
    ).toMatchObject({ used: true, resource: "legacy" });
    expect(await prisma.oAuthGrant.count({ where: { clientId } })).toBe(2);
    expect(
      await prisma.oAuthGrant.findUnique({ where: { id: courtGrant.id } }),
    ).toEqual(courtGrant);
  });
});
