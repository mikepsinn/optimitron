import assert from "node:assert/strict";
import test from "node:test";
import { fetchRoute } from "./smoke-site-deployment.mjs";

const target = "https://warondisease-preview.vercel.app";

test("a protected preview cannot pass by following a redirect to the Vercel login page", async (t) => {
  const response = new Response("<title>Login – Vercel</title>", { status: 200 });
  Object.defineProperty(response, "url", { value: "https://vercel.com/login" });
  t.mock.method(globalThis, "fetch", async () => response);

  const result = await fetchRoute(target);
  assert.equal(result.ok, false);
  assert.equal(result.error, "Deployment protection redirected the request to Vercel login");
});

test("an unsigned webhook passes only when the application rejects its signature", async (t) => {
  const bodies = [{ error: "Authentication Required" }, { ok: false, reason: "invalid_signature" }];
  t.mock.method(globalThis, "fetch", async () => {
    const response = Response.json(bodies.shift(), { status: 401 });
    Object.defineProperty(response, "url", { value: `${target}/api/webhooks/resend` });
    return response;
  });
  const options = { method: "POST", body: "{}", expectedStatus: 401, expectedJson: { ok: false, reason: "invalid_signature" } };

  assert.equal((await fetchRoute(`${target}/api/webhooks/resend`, options)).ok, false);
  assert.equal((await fetchRoute(`${target}/api/webhooks/resend`, options)).ok, true);
});
