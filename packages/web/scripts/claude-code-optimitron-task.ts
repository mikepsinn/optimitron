#!/usr/bin/env tsx

import "./load-env";

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  buildClaudeCodePrompt,
  buildCompletionComment,
  buildPrTitle,
  parseClaudeHookArgs,
  type ClaudeHookTask,
} from "../src/lib/claude-code-task-hook";
import { resolveLocalMcpIdentity } from "../src/lib/mcp-local-identity.server";
import { ALL_SCOPES, createMcpServer } from "../src/lib/mcp-server";

interface ToolTextContent {
  text: string;
  type: "text";
}

interface ToolResponse {
  content?: ToolTextContent[];
  isError?: boolean;
}

interface QueueRow {
  id: string;
  title: string;
}

function parseToolBody(result: unknown) {
  const response = result as ToolResponse;
  const text = response.content?.[0]?.text;
  if (!text) {
    throw new Error("MCP tool returned no text content");
  }
  const body = JSON.parse(text) as unknown;
  if (response.isError) {
    throw new Error(text);
  }
  return body;
}

async function makeLocalMcpClient() {
  const identity = await resolveLocalMcpIdentity();
  const server = createMcpServer(identity.userId, ALL_SCOPES, {
    isAdmin: identity.isAdmin,
  });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: "optimitron-claude-code-hook", version: "1.0.0" });
  await client.connect(clientTransport);
  return client;
}

async function callTool(client: Client, name: string, args: Record<string, unknown>) {
  return parseToolBody(await client.callTool({ name, arguments: args }));
}

function findRepoRoot(start = process.cwd()) {
  let current = resolve(start);
  while (true) {
    const packagePath = resolve(current, "package.json");
    if (existsSync(packagePath) && existsSync(resolve(current, "packages", "web"))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) return resolve(start);
    current = parent;
  }
}

function getTaskFromDetail(detail: unknown): ClaudeHookTask {
  const record = detail as Record<string, unknown>;
  const task = record.task as Record<string, unknown> | undefined;
  if (!task || typeof task.id !== "string" || typeof task.title !== "string") {
    throw new Error("getTask returned no task object");
  }
  return {
    contextJson: task.contextJson,
    description: typeof task.description === "string" ? task.description : null,
    id: task.id,
    title: task.title,
  };
}

function queueRows(body: unknown) {
  const record = body as Record<string, unknown>;
  const queue = Array.isArray(record.queue) ? record.queue : [];
  return queue.filter((row): row is QueueRow => {
    const entry = row as Record<string, unknown>;
    return typeof entry.id === "string" && typeof entry.title === "string";
  });
}

function launchClaude(prompt: string) {
  // shell: false — prompt is task-derived (title + description from the DB)
  // and may contain shell metacharacters. spawnSync passes argv verbatim to
  // the OS without shell interpolation, eliminating injection. On Windows,
  // set CLAUDE_CODE_COMMAND to an explicit `.cmd`/`.exe` path if PATH
  // resolution doesn't find it.
  const command = process.env.CLAUDE_CODE_COMMAND?.trim() || "claude";
  const args = process.env.CLAUDE_CODE_ARGS?.trim()
    ? process.env.CLAUDE_CODE_ARGS.trim().split(/\s+/)
    : ["-p"];
  const result = spawnSync(command, [...args, prompt], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`${command} exited with status ${result.status ?? "unknown"}`);
  }
}

function createPullRequest(input: {
  baseBranch: string;
  body: string;
  title: string;
}) {
  // shell: false — title/body are task-derived. Body goes via stdin
  // (`--body-file -`) so newlines and shell metacharacters in summaries
  // can't be reinterpreted by a shell. Title goes via argv, also without
  // shell parsing.
  const result = spawnSync(
    "gh",
    ["pr", "create", "--base", input.baseBranch, "--title", input.title, "--body-file", "-"],
    {
      encoding: "utf8",
      input: input.body,
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || `gh pr create exited with status ${result.status}`);
  }
  const stdout = result.stdout.trim();
  return stdout.split(/\s+/).find((part) => part.startsWith("https://")) ?? stdout;
}

async function startTask(execute: boolean) {
  const client = await makeLocalMcpClient();
  const queue = queueRows(await callTool(client, "getAIQueue", { maxResults: 1 }));
  const top = queue[0];
  if (!top) {
    console.log("No AI Agent tasks available.");
    return;
  }

  const claim = await callTool(client, "claimTask", { taskId: top.id });
  const detail = await callTool(client, "getTask", { taskId: top.id });
  const task = getTaskFromDetail(detail);
  const repoRoot = findRepoRoot();
  const prompt = buildClaudeCodePrompt({ repoRoot, task });
  const promptPath = resolve(repoRoot, ".optimitron", "claude-code-task-prompt.md");
  mkdirSync(dirname(promptPath), { recursive: true });
  writeFileSync(promptPath, `${prompt}\n`, "utf8");

  const output = {
    claim,
    promptPath,
    taskId: task.id,
    title: task.title,
    next: {
      finish: `pnpm --filter @optimitron/web exec tsx scripts/claude-code-optimitron-task.ts finish --task-id ${task.id} --summary "..." --pr-url https://github.com/.../pull/...`,
      openPrompt: promptPath,
    },
  };
  console.log(JSON.stringify(output, null, 2));

  if (execute) {
    launchClaude(prompt);
  }
}

async function finishTask(input: {
  baseBranch: string;
  createPr: boolean;
  prUrl: string | null;
  summary: string | null;
  taskId: string | null;
}) {
  if (!input.taskId) throw new Error("--task-id is required for finish");
  if (!input.summary) throw new Error("--summary is required for finish");

  const client = await makeLocalMcpClient();
  const detail = await callTool(client, "getTask", { taskId: input.taskId });
  const task = getTaskFromDetail(detail);
  const title = buildPrTitle(task);
  let prUrl = input.prUrl;
  const comment = buildCompletionComment({
    prUrl,
    summary: input.summary,
    taskId: input.taskId,
  });

  if (input.createPr && !prUrl) {
    prUrl = createPullRequest({
      baseBranch: input.baseBranch,
      body: comment,
      title,
    });
  }

  const completionEvidence = buildCompletionComment({
    prUrl,
    summary: input.summary,
    taskId: input.taskId,
  });
  await callTool(client, "postTaskComment", {
    message: completionEvidence,
    taskId: input.taskId,
  });
  await callTool(client, "completeTaskClaim", {
    completionEvidence,
    taskId: input.taskId,
  });

  console.log(
    JSON.stringify(
      {
        prUrl,
        taskId: input.taskId,
        title,
      },
      null,
      2,
    ),
  );
}

async function main() {
  const args = parseClaudeHookArgs(process.argv.slice(2));
  if (args.command === "finish") {
    await finishTask(args);
    return;
  }
  await startTask(args.execute);
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
