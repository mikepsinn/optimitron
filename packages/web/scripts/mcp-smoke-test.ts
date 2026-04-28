/**
 * MCP smoke test — exercises a deployment's full OAuth + tool-call surface
 * end to end. Use it to isolate "is the server broken?" from "is the Claude.ai
 * connector broken?".
 *
 * Usage:
 *   pnpm --filter @optimitron/web exec tsx scripts/mcp-smoke-test.ts
 *   MCP_BASE=https://your-prod-host pnpm --filter @optimitron/web exec tsx scripts/mcp-smoke-test.ts
 *
 * To run authenticated checks, set MCP_BEARER_TOKEN to a token previously
 * minted via the OAuth flow (the smoke-test markdown has a curl recipe).
 *
 * What it does:
 *   1. POSTs unauth to /api/mcp        → expects 401 + WWW-Authenticate
 *   2. GETs   /.well-known/oauth-protected-resource/mcp
 *   3. GETs   /.well-known/oauth-authorization-server
 *   4. POSTs  /api/mcp/oauth/register  → DCR
 *   5. If MCP_BEARER_TOKEN set: tools/list
 *   6. If MCP_BEARER_TOKEN set: every public tool, then every personal tool
 *      (getNextTask, listTasks, evaluateTaskEconomics, getNextAction,
 *      getMyQueue, getAIQueue, getQueueAudit). For each, prints the parsed
 *      MCP response and flags isError responses.
 */

import "./load-env";

const BASE = (process.env.MCP_BASE ?? "http://localhost:3001").replace(/\/$/, "");
const TOKEN = process.env.MCP_BEARER_TOKEN;

interface Outcome {
  name: string;
  ok: boolean;
  detail: string;
}

const outcomes: Outcome[] = [];

function record(name: string, ok: boolean, detail: string) {
  outcomes.push({ name, ok, detail });
  const tag = ok ? "PASS" : "FAIL";
  console.log(`[${tag}] ${name} — ${detail}`);
}

async function expect401Challenge() {
  const res = await fetch(`${BASE}/api/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }),
  });
  const wwwAuth = res.headers.get("www-authenticate") ?? "";
  const ok = res.status === 401 && wwwAuth.includes("resource_metadata=");
  record(
    "Unauth 401 challenge",
    ok,
    `status=${res.status} www-authenticate=${wwwAuth || "<missing>"}`,
  );
}

async function expectMetadata(path: string, label: string, requiredKey: string) {
  const res = await fetch(`${BASE}${path}`);
  const body = await res.json().catch(() => null);
  const ok = res.status === 200 && body && typeof body === "object" && requiredKey in body;
  record(
    `Discovery: ${label}`,
    ok,
    ok ? `${requiredKey}=${JSON.stringify((body as Record<string, unknown>)[requiredKey])}` : `status=${res.status}`,
  );
}

async function expectDcr(): Promise<string | null> {
  const res = await fetch(`${BASE}/api/mcp/oauth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "mcp-smoke-test",
      redirect_uris: ["http://127.0.0.1:9999/callback"],
    }),
  });
  const body = (await res.json().catch(() => null)) as { client_id?: string } | null;
  const clientId = body?.client_id ?? null;
  record(
    "Dynamic Client Registration",
    res.status === 201 && !!clientId,
    clientId ? `client_id=${clientId}` : `status=${res.status}`,
  );
  return clientId;
}

interface McpToolResponse {
  result?: { content?: Array<{ text?: string }>; isError?: boolean };
  error?: unknown;
}

async function callTool(name: string, args: Record<string, unknown> = {}): Promise<McpToolResponse | null> {
  const res = await fetch(`${BASE}/api/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "Authorization": `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name, arguments: args },
      id: Date.now(),
    }),
  });
  const text = await res.text();
  // Streamable HTTP returns SSE: each event is "event: message\ndata: <json>\n\n"
  const dataLine = text.split("\n").find((l) => l.startsWith("data:"));
  if (!dataLine) {
    record(`Tool call: ${name}`, false, `no data line in response (status=${res.status}): ${text.slice(0, 200)}`);
    return null;
  }
  try {
    const parsed = JSON.parse(dataLine.slice(5).trim()) as McpToolResponse;
    const inner = parsed.result?.content?.[0]?.text;
    const isError = parsed.result?.isError === true;
    if (isError) {
      record(`Tool call: ${name}`, false, `isError=true body=${inner?.slice(0, 400)}`);
    } else if (parsed.error) {
      record(`Tool call: ${name}`, false, `jsonrpc error=${JSON.stringify(parsed.error).slice(0, 400)}`);
    } else {
      const preview = inner ? inner.replace(/\s+/g, " ").slice(0, 120) : "<empty>";
      record(`Tool call: ${name}`, true, preview);
    }
    return parsed;
  } catch (e) {
    record(`Tool call: ${name}`, false, `parse error: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

async function expectAuthenticatedToolCalls() {
  const listRes = await fetch(`${BASE}/api/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "Authorization": `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: "list" }),
  });
  record("tools/list", listRes.status === 200, `status=${listRes.status}`);

  const publicTools: Array<[string, Record<string, unknown>]> = [
    ["listTasks", { limit: 1 }],
    ["getNextTask", {}],
  ];
  const personalTools: Array<[string, Record<string, unknown>]> = [
    ["getNextAction", {}],
    ["getMyQueue", {}],
    ["getAIQueue", {}],
    ["getQueueAudit", {}],
  ];

  for (const [name, args] of publicTools) await callTool(name, args);
  for (const [name, args] of personalTools) await callTool(name, args);
}

async function main() {
  console.log(`MCP smoke test against ${BASE}`);
  console.log(`Authenticated checks: ${TOKEN ? "ON" : "OFF (set MCP_BEARER_TOKEN to enable)"}`);
  console.log("");

  await expect401Challenge();
  await expectMetadata("/.well-known/oauth-protected-resource/mcp", "protected-resource", "authorization_servers");
  await expectMetadata("/.well-known/oauth-authorization-server", "authorization-server", "authorization_endpoint");
  await expectDcr();

  if (TOKEN) {
    await expectAuthenticatedToolCalls();
  }

  console.log("");
  const failed = outcomes.filter((o) => !o.ok);
  console.log(`${outcomes.length - failed.length}/${outcomes.length} checks passed`);
  if (failed.length > 0) {
    console.log("");
    console.log("Failed checks:");
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
