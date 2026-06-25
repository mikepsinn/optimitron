import assert from "node:assert/strict";
import test from "node:test";
import { evaluateDemoLoginSmokeResponse } from "../../packages/web/scripts/smoke-deploy.mjs";

test("accepts demo login redirect with a NextAuth session cookie", () => {
  const result = evaluateDemoLoginSmokeResponse({
    status: 303,
    location: "https://preview.example.com/dashboard",
    setCookie:
      "next-auth.session-token=abc123; Path=/; HttpOnly, other-cookie=value",
    body: "",
  });

  assert.equal(result.ok, true);
  assert.equal(result.error, null);
});

test("accepts demo login redirect with a chunked secure NextAuth cookie", () => {
  const result = evaluateDemoLoginSmokeResponse({
    status: 303,
    location: "/dashboard",
    setCookie: "__Secure-next-auth.session-token.0=abc123; Path=/; HttpOnly",
    body: "",
  });

  assert.equal(result.ok, true);
  assert.equal(result.error, null);
});

test("rejects the missing managed-data demo user response", () => {
  const result = evaluateDemoLoginSmokeResponse({
    status: 500,
    location: "",
    setCookie: "",
    body: "Demo user demo@thinkbynumbers.org not found in DB. Managed-data sync should have created it; run `pnpm db:sync:managed-data -- --apply` against this environment's database.",
  });

  assert.equal(result.ok, false);
  assert.match(result.error, /expected HTTP redirect 300-399, got 500/u);
  assert.match(result.error, /Managed-data sync should have created it/u);
  assert.match(result.error, /missing NextAuth session cookie/u);
});
