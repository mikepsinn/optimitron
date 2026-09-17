import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateDemoLoginSmokeResponse,
  fetchAndAssert,
  PLAINTIFFS_REDIRECT_SMOKE_ROUTE,
} from "../../apps/optimitron/scripts/smoke-deploy.mjs";

test("retired plaintiffs smoke verifies the redirect boundary without forwarding bypass credentials", async () => {
  const route = PLAINTIFFS_REDIRECT_SMOKE_ROUTE;
  const url = new URL(route.path, "https://preview.example.com");
  const calls = [];
  const result = await fetchAndAssert({
    route,
    url,
    attempt: 1,
    bypassSecret: "test-only-bypass",
    fetchImpl: async (requestUrl, options) => {
      calls.push({ requestUrl, options });
      return new Response(null, {
        status: 308,
        headers: {
          location: `https://courtofhumanity.org/plaintiffs${url.search}`,
        },
      });
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.missingExpectedH1, false);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].requestUrl.origin, "https://preview.example.com");
  assert.equal(calls[0].options.redirect, "manual");
  assert.equal(
    calls[0].options.headers["x-vercel-protection-bypass"],
    "test-only-bypass",
  );
  assert.equal(url.search, "?ref=smoke-deploy&country=US");
});

test("retired plaintiffs smoke rejects wrong status, destination, and lost query parameters", async () => {
  const route = PLAINTIFFS_REDIRECT_SMOKE_ROUTE;
  const url = new URL(route.path, "https://preview.example.com");
  const correct = `https://courtofhumanity.org/plaintiffs${url.search}`;
  for (const [status, location] of [
    [200, correct],
    [307, correct],
    [308, "https://courtofhumanity.org/plaintiffs"],
    [308, `https://other.example/plaintiffs${url.search}`],
    [308, `https://courtofhumanity.org/people${url.search}`],
    [308, null],
  ]) {
    const result = await fetchAndAssert({
      route,
      url,
      attempt: 1,
      fetchImpl: async () =>
        new Response(null, { status, headers: location ? { location } : {} }),
    });
    assert.equal(result.ok, false, `${status} ${location}`);
  }
});

test("owned pages still require their expected heading and a successful error-free response", async () => {
  for (const [status, body, expected] of [
    [200, "<h1>Earth Optimization Tasks</h1>", true],
    [200, "<h1>Wrong page</h1>", false],
    [500, "<h1>Earth Optimization Tasks</h1>", false],
    [
      200,
      "<h1>Earth Optimization Tasks</h1><p>Internal Server Error</p>",
      false,
    ],
  ]) {
    const result = await fetchAndAssert({
      route: { path: "/tasks" },
      url: new URL("https://preview.example.com/tasks"),
      expectedH1: "Earth Optimization Tasks",
      attempt: 1,
      fetchImpl: async () => new Response(body, { status }),
    });
    assert.equal(result.ok, expected);
  }
});

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
