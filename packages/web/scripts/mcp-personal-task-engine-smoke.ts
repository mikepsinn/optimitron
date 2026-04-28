/**
 * End-to-end MCP smoke test for the personal task engine.
 *
 * Usage:
 *   MCP_BEARER_TOKEN=... pnpm --filter @optimitron/web exec tsx scripts/mcp-personal-task-engine-smoke.ts
 *   MCP_BASE=https://optimitron.com MCP_BEARER_TOKEN=... pnpm --filter @optimitron/web exec tsx scripts/mcp-personal-task-engine-smoke.ts
 */

import "./load-env";

const BASE = (process.env.MCP_BASE ?? "http://localhost:3001").replace(/\/$/, "");
const TOKEN = process.env.MCP_BEARER_TOKEN;
const RUN_ID = `personal-task-engine-smoke-${Date.now()}`;

if (!TOKEN) {
  throw new Error("MCP_BEARER_TOKEN is required.");
}

interface McpToolResponse {
  result?: { content?: Array<{ text?: string }>; isError?: boolean };
  error?: unknown;
}

type QueueRow = {
  id: string;
  title: string;
  priority: number;
};

type CreatedTask = {
  id: string;
  title: string;
};

const createdTasks: CreatedTask[] = [];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertClose(actual: number, expected: number, label: string) {
  const tolerance = Math.max(1, Math.abs(expected) * 0.002);
  assert(
    Math.abs(actual - expected) <= tolerance,
    `${label}: expected ${expected}, got ${actual}`,
  );
}

function titles(rows: QueueRow[]) {
  return rows.map((row) => row.title.replace(`${RUN_ID}: `, ""));
}

function assertQueue(rows: QueueRow[], expectedTitles: string[], expectedPriorities: Record<string, number>) {
  assert(
    JSON.stringify(titles(rows)) === JSON.stringify(expectedTitles),
    `expected queue ${JSON.stringify(expectedTitles)}, got ${JSON.stringify(titles(rows))}`,
  );
  for (const row of rows) {
    const shortTitle = row.title.replace(`${RUN_ID}: `, "");
    assert(typeof row.priority === "number" && Number.isFinite(row.priority), `${shortTitle} priority is not numeric`);
    assert(!("sprintPriority" in row), `${shortTitle} unexpectedly returned sprintPriority`);
    assert(!("taskPriority" in row), `${shortTitle} unexpectedly returned taskPriority`);
    assertClose(row.priority, expectedPriorities[shortTitle]!, shortTitle);
  }
}

async function callTool<T = unknown>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`${BASE}/api/mcp`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: `${name}-${Date.now()}`,
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });

  const text = await response.text();
  const dataLine = text.split("\n").find((line) => line.startsWith("data:"));
  assert(dataLine, `${name}: no SSE data line in response ${response.status}: ${text.slice(0, 300)}`);
  const parsed = JSON.parse(dataLine.slice(5).trim()) as McpToolResponse;
  assert(!parsed.error, `${name}: JSON-RPC error ${JSON.stringify(parsed.error)}`);
  assert(!parsed.result?.isError, `${name}: tool error ${parsed.result?.content?.[0]?.text}`);
  const bodyText = parsed.result?.content?.[0]?.text;
  assert(bodyText, `${name}: missing tool body`);
  return JSON.parse(bodyText) as T;
}

async function createTask(input: {
  key: string;
  title: string;
  hours: number;
  value: number;
  p_success: number;
  executor_type: "Self" | "AI Agent";
}) {
  const task = await callTool<CreatedTask>("createTask", {
    title: `${RUN_ID}: ${input.title}`,
    description: `Temporary personal task engine smoke test row ${input.key}.`,
    hours: input.hours,
    value: input.value,
    p_success: input.p_success,
    cash_cost: 0,
    executor_type: input.executor_type,
    ev_math: "Smoke-test deterministic EV inputs.",
    category: "OTHER",
  });
  assert(task.id, `createTask returned no id for ${input.title}`);
  createdTasks.push(task);
  return task;
}

async function getMyQueue() {
  const body = await callTool<{ queue: QueueRow[] }>("getMyQueue", { maxResults: 20 });
  return body.queue;
}

async function getAIQueue() {
  const body = await callTool<{ queue: QueueRow[] }>("getAIQueue", { maxResults: 20 });
  return body.queue;
}

async function markDone(task: CreatedTask) {
  await callTool("updateTask", {
    taskId: task.id,
    status: "VERIFIED",
    completionEvidence: "Completed by MCP personal task engine smoke test.",
  });
}

async function cleanup() {
  for (const task of [...createdTasks].reverse()) {
    try {
      await callTool("deleteTask", { taskId: task.id });
    } catch (error) {
      console.error(`Cleanup failed for ${task.id} (${task.title}):`, error);
    }
  }
}

async function main() {
  console.log(`MCP personal task engine smoke test against ${BASE}`);

  const publicBefore = await callTool<unknown[]>("listTasks", { limit: 500 });

  try {
    const A = await createTask({ key: "A", title: "Build product demo", hours: 6, value: 50000, p_success: 0.9, executor_type: "Self" });
    const B = await createTask({ key: "B", title: "Create credibility page on website", hours: 0.5, value: 5000, p_success: 0.95, executor_type: "Self" });
    const C = await createTask({ key: "C", title: "Email Funder Alpha", hours: 1, value: 10000, p_success: 0.3, executor_type: "Self" });
    const D = await createTask({ key: "D", title: "Email Funder Beta", hours: 1, value: 15000, p_success: 0.25, executor_type: "Self" });
    const E = await createTask({ key: "E", title: "Email Funder Gamma", hours: 1, value: 8000, p_success: 0.2, executor_type: "Self" });
    const F = await createTask({ key: "F", title: "Write Grant Application Alpha", hours: 8, value: 75000, p_success: 0.15, executor_type: "Self" });
    const G = await createTask({ key: "G", title: "Write Grant Application Beta", hours: 6, value: 50000, p_success: 0.2, executor_type: "Self" });
    const H = await createTask({ key: "H", title: "Set up donation page", hours: 2, value: 10000, p_success: 0.8, executor_type: "Self" });
    const I = await createTask({ key: "I", title: "Organize files and folders", hours: 1, value: 100, p_success: 1, executor_type: "Self" });
    const J = await createTask({ key: "J", title: "Research potential funders list", hours: 3, value: 20000, p_success: 0.7, executor_type: "AI Agent" });

    await callTool("updateTask", { taskId: C.id, depends_on: [A.id] });
    await callTool("updateTask", { taskId: D.id, depends_on: [A.id] });
    await callTool("updateTask", { taskId: E.id, depends_on: [A.id] });
    await callTool("updateTask", { taskId: F.id, depends_on: [A.id, B.id, C.id] });
    await callTool("updateTask", { taskId: G.id, depends_on: [A.id, B.id, D.id] });

    assertQueue(await getMyQueue(), [
      "Create credibility page on website",
      "Build product demo",
      "Set up donation page",
      "Organize files and folders",
    ], {
      "Create credibility page on website": 9500,
      "Build product demo": 7500,
      "Set up donation page": 4000,
      "Organize files and folders": 100,
    });

    assertQueue(await getAIQueue(), ["Research potential funders list"], {
      "Research potential funders list": 4666.6667,
    });

    await markDone(B);
    assertQueue(await getMyQueue(), [
      "Build product demo",
      "Set up donation page",
      "Organize files and folders",
    ], {
      "Build product demo": 7500,
      "Set up donation page": 4000,
      "Organize files and folders": 100,
    });

    await markDone(A);
    assertQueue(await getMyQueue(), [
      "Set up donation page",
      "Email Funder Beta",
      "Email Funder Alpha",
      "Email Funder Gamma",
      "Organize files and folders",
    ], {
      "Set up donation page": 4000,
      "Email Funder Beta": 3750,
      "Email Funder Alpha": 3000,
      "Email Funder Gamma": 1600,
      "Organize files and folders": 100,
    });

    await markDone(C);
    assertQueue(await getMyQueue(), [
      "Set up donation page",
      "Email Funder Beta",
      "Email Funder Gamma",
      "Write Grant Application Alpha",
      "Organize files and folders",
    ], {
      "Set up donation page": 4000,
      "Email Funder Beta": 3750,
      "Email Funder Gamma": 1600,
      "Write Grant Application Alpha": 1406.25,
      "Organize files and folders": 100,
    });

    await markDone(D);
    const afterD = await getMyQueue();
    assert(titles(afterD).includes("Write Grant Application Beta"), "Task G should unblock after Task D is done");

    for (const task of [E, F, G, H, I]) {
      await markDone(task);
    }
    assertQueue(await getMyQueue(), [], {});
    await markDone(J);
  } finally {
    await cleanup();
  }

  const publicAfter = await callTool<unknown[]>("listTasks", { limit: 500 });
  assert(publicAfter.length === publicBefore.length, "Public task count changed after personal smoke test cleanup");

  console.log("MCP personal task engine smoke test passed.");
}

void main().catch(async (error) => {
  console.error(error);
  await cleanup();
  process.exit(1);
});
