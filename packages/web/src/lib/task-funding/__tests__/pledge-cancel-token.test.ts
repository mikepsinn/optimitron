import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildPledgeCancelUrl,
  createPledgeCancelToken,
  verifyPledgeCancelToken,
} from "../pledge-cancel-token";

describe("pledge-cancel-token", () => {
  const originalSecret = process.env.NEXTAUTH_SECRET;

  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = "test-secret-a";
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.NEXTAUTH_SECRET;
    else process.env.NEXTAUTH_SECRET = originalSecret;
  });

  it("signs deterministically so links in already-sent emails keep working", () => {
    const a = createPledgeCancelToken("pledge_1");
    const b = createPledgeCancelToken("pledge_1");
    expect(a).toBe(b);
    expect(a).toMatch(/^pledge_1\.[0-9a-f]{64}$/);
  });

  it("round-trips its own token back to the pledge id", () => {
    const token = createPledgeCancelToken("pledge_1");
    expect(verifyPledgeCancelToken(token)).toBe("pledge_1");
  });

  it("rejects a token whose pledge id was swapped", () => {
    const token = createPledgeCancelToken("pledge_1");
    const signature = token.slice(token.lastIndexOf(".") + 1);
    expect(verifyPledgeCancelToken(`pledge_2.${signature}`)).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const token = createPledgeCancelToken("pledge_1");
    process.env.NEXTAUTH_SECRET = "test-secret-b";
    expect(verifyPledgeCancelToken(token)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyPledgeCancelToken("")).toBeNull();
    expect(verifyPledgeCancelToken("no-separator")).toBeNull();
    expect(verifyPledgeCancelToken(".hexonly")).toBeNull();
    expect(verifyPledgeCancelToken("pledge_1.")).toBeNull();
    expect(verifyPledgeCancelToken("pledge_1.not-hex")).toBeNull();
    expect(verifyPledgeCancelToken("pledge_1.abc")).toBeNull();
  });

  it("returns null instead of throwing when the secret is missing", () => {
    const token = createPledgeCancelToken("pledge_1");
    delete process.env.NEXTAUTH_SECRET;
    expect(verifyPledgeCancelToken(token)).toBeNull();
  });

  it("builds a one-click cancel URL whose token round-trips", () => {
    const url = new URL(buildPledgeCancelUrl("pledge_1"));
    expect(url.pathname).toBe("/api/task-funding/pledge/cancel");
    const token = url.searchParams.get("token");
    expect(token).not.toBeNull();
    expect(verifyPledgeCancelToken(token as string)).toBe("pledge_1");
  });
});
