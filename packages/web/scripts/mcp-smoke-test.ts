/**
 * MCP smoke test — exercises a deployment's full OAuth + tool-call surface
 * end to end. Use it to isolate "is the server broken?" from "is the Claude.ai
 * connector broken?".
 *
 * Usage:
 *   pnpm --filter @optimitron/web exec tsx scripts/mcp-smoke-test.ts
 *   MCP_BASE=https://your-prod-host pnpm --filter @optimitron/web exec tsx scripts/mcp-smoke-test.ts
 *   OPTIMITRON_E2E_DESTRUCTIVE=1 OPTIMITRON_E2E_TEST_DATABASE=1 pnpm ... scripts/mcp-smoke-test.ts --scenario=signer-reminder
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
 *   7. If `--scenario=signer-reminder` AND the destructive-safety guard passes:
 *      claim → assert shape → confirm in queue → delete → assert removed.
 */

import "./load-env";
import { evaluateDestructiveMcpSmokeSafety } from "../src/lib/mcp-smoke-safety";

const BASE = (process.env.MCP_BASE ?? "http://localhost:3001").replace(
  /\/$/,
  "",
);
const TOKEN = process.env.MCP_BEARER_TOKEN;
const SCENARIO =
  process.argv
    .find((arg) => arg.startsWith("--scenario="))
    ?.slice("--scenario=".length) ?? null;
const DESTRUCTIVE = process.env.OPTIMITRON_E2E_DESTRUCTIVE === "1";
const TEST_DATABASE = process.env.OPTIMITRON_E2E_TEST_DATABASE === "1";
const REMOTE_TEST_SERVER =
  process.env.OPTIMITRON_E2E_REMOTE_TEST_SERVER === "1";

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

function destructiveScenarioAllowed(
  name: "signer-reminder" | "trigger-roundtrip",
) {
  const safety = evaluateDestructiveMcpSmokeSafety({
    base: BASE,
    destructiveFlag: DESTRUCTIVE,
    remoteTestServerFlag: REMOTE_TEST_SERVER,
    scenario: name,
    testDatabaseFlag: TEST_DATABASE,
  });
  if (!safety.ok) {
    record(`Scenario: ${name}`, false, safety.reason);
    return false;
  }
  return true;
}

function summarizeAndExitIfFailed() {
  const failed = outcomes.filter((o) => !o.ok);
  console.log("");
  console.log(
    `${outcomes.length - failed.length}/${outcomes.length} checks passed`,
  );
  if (failed.length > 0) {
    console.log("");
    console.log("Failed checks:");
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
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

async function expectMetadata(
  path: string,
  label: string,
  requiredKey: string,
) {
  const res = await fetch(`${BASE}${path}`);
  const body = await res.json().catch(() => null);
  const ok =
    res.status === 200 &&
    body &&
    typeof body === "object" &&
    requiredKey in body;
  record(
    `Discovery: ${label}`,
    ok,
    ok
      ? `${requiredKey}=${JSON.stringify((body as Record<string, unknown>)[requiredKey])}`
      : `status=${res.status}`,
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
  const body = (await res.json().catch(() => null)) as {
    client_id?: string;
  } | null;
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

async function callTool(
  name: string,
  args: Record<string, unknown> = {},
): Promise<McpToolResponse | null> {
  const res = await fetch(`${BASE}/api/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${TOKEN}`,
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
  const contentType = res.headers.get("content-type") ?? "";
  const payload = text.trim();
  const rawJson =
    dataLine?.slice(5).trim() ||
    (contentType.includes("application/json") || payload.startsWith("{")
      ? payload
      : "");
  if (!rawJson) {
    record(
      `Tool call: ${name}`,
      false,
      `no data line in response (status=${res.status}): ${text.slice(0, 200)}`,
    );
    return null;
  }
  try {
    const parsed = JSON.parse(rawJson) as McpToolResponse;
    const inner = parsed.result?.content?.[0]?.text;
    const isError = parsed.result?.isError === true;
    if (isError) {
      record(
        `Tool call: ${name}`,
        false,
        `isError=true body=${inner?.slice(0, 400)}`,
      );
    } else if (parsed.error) {
      record(
        `Tool call: ${name}`,
        false,
        `jsonrpc error=${JSON.stringify(parsed.error).slice(0, 400)}`,
      );
    } else {
      const preview = inner
        ? inner.replace(/\s+/g, " ").slice(0, 120)
        : "<empty>";
      record(`Tool call: ${name}`, true, preview);
    }
    return parsed;
  } catch (e) {
    record(
      `Tool call: ${name}`,
      false,
      `parse error: ${e instanceof Error ? e.message : String(e)}`,
    );
    return null;
  }
}

async function expectAuthenticatedToolCalls() {
  const listRes = await fetch(`${BASE}/api/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${TOKEN}`,
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

/**
 * Destructive E2E scenario: claim a signer reminder for a stable test signer
 * (Vatican by default; tiny country, low traffic), assert the response shape,
 * confirm it appears in the citizen's queue, then delete and re-assert
 * absence. Gated by destructiveScenarioAllowed() so a stray run cannot pollute
 * prod or any non-test database.
 */
async function runSignerReminderScenario() {
  if (!TOKEN) {
    record(
      "Scenario: signer-reminder",
      false,
      "MCP_BEARER_TOKEN required (mint via mint-mcp-token.ts).",
    );
    return;
  }
  if (!destructiveScenarioAllowed("signer-reminder")) return;

  const signerTaskId =
    process.env.SCENARIO_SIGNER_TASK_ID ?? "1-pct-treaty-signer-va";

  // 1. Claim
  const claimResponse = await callTool("claimSignerReminder", { signerTaskId });
  const claimText = claimResponse?.result?.content?.[0]?.text;
  if (!claimText) {
    record(
      "Scenario step 1: claim",
      false,
      "no response body from claimSignerReminder",
    );
    return;
  }
  let claimBody: Record<string, unknown>;
  try {
    claimBody = JSON.parse(claimText) as Record<string, unknown>;
  } catch {
    record(
      "Scenario step 1: claim",
      false,
      `claim response not JSON: ${claimText.slice(0, 200)}`,
    );
    return;
  }
  const reminderTaskId = claimBody.taskId as string | undefined;
  const reminderTaskKey = claimBody.taskKey as string | undefined;
  if (!reminderTaskId || !reminderTaskKey) {
    record(
      "Scenario step 1: claim",
      false,
      `missing taskId/taskKey in response: ${JSON.stringify(claimBody).slice(0, 200)}`,
    );
    return;
  }
  record(
    "Scenario step 1: claim",
    true,
    `taskId=${reminderTaskId} taskKey=${reminderTaskKey} alreadyExisted=${claimBody.alreadyExisted}`,
  );

  // 2. Assert task shape via getTask
  const detail = await callTool("getTask", { taskId: reminderTaskId });
  const detailText = detail?.result?.content?.[0]?.text;
  let detailOk = false;
  let detailMsg = "no response";
  if (detailText) {
    try {
      const parsed = JSON.parse(detailText) as {
        task?: Record<string, unknown>;
      };
      const task = parsed.task as Record<string, unknown> | undefined;
      const ep = task?.primaryEndpoint as
        | { url?: string; label?: string }
        | null
        | undefined;
      const creatorOk = task?.createdByUserId ? true : false;
      const parentOk = task?.parentTaskId === signerTaskId;
      const labelOk = ep?.label === "Find their contact info";
      const urlOk =
        typeof ep?.url === "string" && ep.url.includes("google.com/search");
      detailOk = creatorOk && parentOk && labelOk && urlOk;
      detailMsg = `parent=${parentOk} creator=${creatorOk} label="${ep?.label}" url=${urlOk ? "google-search" : ep?.url}`;
    } catch (e) {
      detailMsg = `parse error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  record("Scenario step 2: shape", detailOk, detailMsg);

  // 3. Confirm appears in getMyQueue
  const queueResp = await callTool("getMyQueue", { maxResults: 50 });
  const queueText = queueResp?.result?.content?.[0]?.text;
  let inQueueOk = false;
  let queueMsg = "no response";
  if (queueText) {
    try {
      const parsed = JSON.parse(queueText) as { queue?: Array<{ id: string }> };
      const ids = (parsed.queue ?? []).map((t) => t.id);
      inQueueOk = ids.includes(reminderTaskId);
      queueMsg = `queue size ${ids.length}, includes reminder: ${inQueueOk}`;
    } catch (e) {
      queueMsg = `parse error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  record("Scenario step 3: in queue", inQueueOk, queueMsg);

  // 4. Idempotency: claim again, expect alreadyExisted=true
  const reclaimResponse = await callTool("claimSignerReminder", {
    signerTaskId,
  });
  const reclaimText = reclaimResponse?.result?.content?.[0]?.text;
  let idempOk = false;
  let idempMsg = "no response";
  if (reclaimText) {
    try {
      const parsed = JSON.parse(reclaimText) as Record<string, unknown>;
      idempOk =
        parsed.alreadyExisted === true && parsed.taskId === reminderTaskId;
      idempMsg = `alreadyExisted=${parsed.alreadyExisted} taskId=${parsed.taskId}`;
    } catch (e) {
      idempMsg = `parse error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  record("Scenario step 4: idempotent", idempOk, idempMsg);

  // 5. Cleanup: deleteTask
  const deleteResp = await callTool("deleteTask", { taskId: reminderTaskId });
  const deleteOk = deleteResp?.result?.isError !== true;
  record(
    "Scenario step 5: delete",
    deleteOk,
    deleteOk ? "deleted" : "delete failed",
  );

  // 6. Confirm gone from queue
  const queueResp2 = await callTool("getMyQueue", { maxResults: 50 });
  const queueText2 = queueResp2?.result?.content?.[0]?.text;
  let removedOk = false;
  let removedMsg = "no response";
  if (queueText2) {
    try {
      const parsed = JSON.parse(queueText2) as {
        queue?: Array<{ id: string }>;
      };
      const ids = (parsed.queue ?? []).map((t) => t.id);
      removedOk = !ids.includes(reminderTaskId);
      removedMsg = `still present: ${ids.includes(reminderTaskId)}`;
    } catch (e) {
      removedMsg = `parse error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  record("Scenario step 6: removed from queue", removedOk, removedMsg);
}

async function main() {
  console.log(`MCP smoke test against ${BASE}`);
  console.log(
    `Authenticated checks: ${TOKEN ? "ON" : "OFF (set MCP_BEARER_TOKEN to enable)"}`,
  );
  if (SCENARIO)
    console.log(
      `Scenario: ${SCENARIO} (destructive=${DESTRUCTIVE ? "yes" : "no"})`,
    );
  if (SCENARIO && DESTRUCTIVE) {
    console.log(
      `Destructive guard: testDatabase=${TEST_DATABASE ? "yes" : "no"} remoteTestServer=${REMOTE_TEST_SERVER ? "yes" : "no"}`,
    );
  }
  console.log("");

  if (
    SCENARIO === "signer-reminder" &&
    !destructiveScenarioAllowed("signer-reminder")
  ) {
    summarizeAndExitIfFailed();
    return;
  }
  if (
    SCENARIO === "trigger-roundtrip" &&
    !destructiveScenarioAllowed("trigger-roundtrip")
  ) {
    summarizeAndExitIfFailed();
    return;
  }

  await expect401Challenge();
  await expectMetadata(
    "/.well-known/oauth-protected-resource/mcp",
    "protected-resource",
    "authorization_servers",
  );
  await expectMetadata(
    "/.well-known/oauth-authorization-server",
    "authorization-server",
    "authorization_endpoint",
  );
  await expectDcr();

  if (TOKEN) {
    await expectAuthenticatedToolCalls();
  }

  if (SCENARIO === "signer-reminder") {
    await runSignerReminderScenario();
  } else if (SCENARIO === "trigger-roundtrip") {
    await runTriggerRoundtripScenario();
  } else if (SCENARIO) {
    record(
      "Scenario",
      false,
      `Unknown scenario "${SCENARIO}". Known: signer-reminder, trigger-roundtrip`,
    );
  }

  summarizeAndExitIfFailed();
}

async function runTriggerRoundtripScenario() {
  if (!TOKEN) {
    record(
      "Scenario: trigger-roundtrip",
      false,
      "MCP_BEARER_TOKEN required (mint via mint-mcp-token.ts).",
    );
    return;
  }
  if (!destructiveScenarioAllowed("trigger-roundtrip")) return;

  const triggerKey = `e2e:trigger-roundtrip:${Date.now()}`;
  const taskKeyBase = `e2e-trigger:${Date.now()}`;

  // 1. Create a test trigger via MCP.
  const create = await callTool("createTaskTrigger", {
    triggerKey,
    eventName: "e2e.trigger-roundtrip",
    triggerKind: "spawnTasks",
    idempotencyKeyTemplate: `${taskKeyBase}:{{run.id}}`,
    notes: "Smoke-test scratch trigger. Safe to delete.",
    spawnSpecs: [
      {
        kind: "root",
        isParent: true,
        sortOrder: 0,
        titleTemplate: "Smoke roundtrip task: {{run.label}}",
        descriptionTemplate: "Run id {{run.id}}.",
        category: "OTHER",
        creatorResolver: "actor",
        parentResolver: "none",
      },
    ],
  });
  const createOk =
    create?.result?.content?.[0]?.text &&
    !create.result.content[0].text.startsWith('{"error"');
  record(
    "Scenario step 1: createTaskTrigger",
    !!createOk,
    createOk
      ? `triggerKey=${triggerKey}`
      : (create?.result?.content?.[0]?.text ?? "no response"),
  );
  if (!createOk) return;

  // 2. dryRun fire — should preview without committing.
  const dryRun = await callTool("fireTaskTrigger", {
    triggerKey,
    context: { run: { id: "abc", label: "dryRun preview" } },
    dryRun: true,
  });
  const dryText = dryRun?.result?.content?.[0]?.text;
  let dryOk = false;
  if (dryText) {
    try {
      const parsed = JSON.parse(dryText) as {
        result?: string;
        spawnedTaskKeys?: string[];
      };
      dryOk =
        parsed.result === "spawned" &&
        (parsed.spawnedTaskKeys?.length ?? 0) > 0;
    } catch {
      // Malformed JSON from dryRun = smoke-test failure; dryOk stays false and
      // record() below reports it. Don't abort the rest of the suite.
    }
  }
  record(
    "Scenario step 2: fireTaskTrigger dryRun",
    dryOk,
    dryOk
      ? "rendered preview returned"
      : (dryText?.slice(0, 200) ?? "no response"),
  );

  // 3. Real fire — commits a Task row.
  const real = await callTool("fireTaskTrigger", {
    triggerKey,
    context: { run: { id: "abc", label: "real fire" } },
  });
  const realText = real?.result?.content?.[0]?.text;
  let realTaskId: string | null = null;
  if (realText) {
    try {
      const parsed = JSON.parse(realText) as {
        result?: string;
        spawnedTaskIds?: string[];
        spawnedTaskKeys?: string[];
      };
      if (parsed.result === "spawned" && parsed.spawnedTaskIds?.length) {
        realTaskId = parsed.spawnedTaskIds[0] ?? null;
      }
    } catch {
      // Malformed JSON from real fire = smoke-test failure; realTaskId stays
      // null and record() below reports it. Don't abort the rest of the suite.
    }
  }
  record(
    "Scenario step 3: fireTaskTrigger commit",
    !!realTaskId,
    realTaskId
      ? `taskId=${realTaskId}`
      : (realText?.slice(0, 200) ?? "no response"),
  );

  // 4. Re-fire — spawnTasks re-executes for lazy backfill, but upserts by taskKey.
  if (realTaskId) {
    const refire = await callTool("fireTaskTrigger", {
      triggerKey,
      context: { run: { id: "abc", label: "real fire" } },
    });
    const refireText = refire?.result?.content?.[0]?.text;
    let refireOk = false;
    if (refireText) {
      try {
        const parsed = JSON.parse(refireText) as {
          result?: string;
          spawnedTaskIds?: string[];
        };
        refireOk =
          parsed.result === "spawned" &&
          (parsed.spawnedTaskIds?.[0] ?? "") === realTaskId;
      } catch {
        // Malformed JSON from refire = smoke-test failure; refireOk stays
        // false and record() below reports it. Don't abort the rest of the suite.
      }
    }
    record(
      "Scenario step 4: re-fire returns spawned without duplicating",
      refireOk,
      refireOk
        ? "same task ID returned"
        : (refireText?.slice(0, 200) ?? "no response"),
    );

    // 5. Cleanup: delete the task and disable the trigger.
    const cleanup = await callTool("deleteTask", { taskId: realTaskId });
    const cleanupOk =
      cleanup?.result?.content?.[0]?.text &&
      !cleanup.result.content[0].text.startsWith('{"error"');
    record(
      "Scenario step 5: deleteTask cleanup",
      !!cleanupOk,
      cleanupOk
        ? "task soft-deleted"
        : (cleanup?.result?.content?.[0]?.text ?? "no response"),
    );
  }

  const disable = await callTool("disableTaskTrigger", {
    triggerKey,
    disabledReason: "smoke-test cleanup",
  });
  const disableOk =
    disable?.result?.content?.[0]?.text &&
    !disable.result.content[0].text.startsWith('{"error"');
  record(
    "Scenario step 6: disableTaskTrigger",
    !!disableOk,
    disableOk
      ? "trigger disabled"
      : (disable?.result?.content?.[0]?.text ?? "no response"),
  );
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
