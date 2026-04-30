export type ClaudeHookCommand = "finish" | "start";

export interface ClaudeHookTask {
  contextJson?: unknown;
  description?: string | null;
  id: string;
  title: string;
}

export interface ClaudeHookArgs {
  baseBranch: string;
  command: ClaudeHookCommand;
  createPr: boolean;
  execute: boolean;
  prUrl: string | null;
  summary: string | null;
  taskId: string | null;
}

function asRecord(value: unknown) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function getTaskAcceptanceCriteria(task: ClaudeHookTask) {
  const context = asRecord(task.contextJson);
  const criteria = context.acceptanceCriteria;
  if (!Array.isArray(criteria)) return [];
  return criteria
    .map((entry) => stringValue(entry))
    .filter((entry): entry is string => Boolean(entry));
}

export function buildPrTitle(task: ClaudeHookTask) {
  return `${task.id}: ${task.title}`.slice(0, 240);
}

export function buildClaudeCodePrompt(input: {
  repoRoot: string;
  task: ClaudeHookTask;
}) {
  const criteria = getTaskAcceptanceCriteria(input.task);
  const acceptanceBlock = criteria.length
    ? criteria.map((item) => `- [ ] ${item}`).join("\n")
    : "- [ ] Satisfy the task description and leave focused verification evidence.";

  return [
    "You are working an Optimitron AI Agent task.",
    "",
    `Task ID: ${input.task.id}`,
    `Title: ${input.task.title}`,
    `Repository: ${input.repoRoot}`,
    "",
    "Description:",
    input.task.description?.trim() || "(No description provided.)",
    "",
    "Acceptance criteria:",
    acceptanceBlock,
    "",
    "Workflow:",
    "1. Inspect the repo before editing.",
    "2. Keep changes scoped to this task.",
    "3. Run focused tests/typecheck for touched code.",
    `4. When done, open a PR whose title includes ${input.task.id}.`,
    "5. Post the PR URL and summary back to the Optimitron task.",
  ].join("\n");
}

export function buildCompletionComment(input: {
  prUrl?: string | null;
  summary: string;
  taskId: string;
}) {
  const lines = [
    `Completed implementation work for ${input.taskId}.`,
    "",
    `Summary: ${input.summary}`,
  ];

  if (input.prUrl) {
    lines.push("", `PR: ${input.prUrl}`);
  }

  return lines.join("\n");
}

function readFlagValue(argv: string[], index: number) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${argv[index]} requires a value`);
  }
  return value;
}

export function parseClaudeHookArgs(argv: string[]): ClaudeHookArgs {
  const command =
    argv[0] === "finish" || argv[0] === "start" ? argv[0] : "start";
  const args = command === argv[0] ? argv.slice(1) : argv;
  const parsed: ClaudeHookArgs = {
    baseBranch: "main",
    command,
    createPr: false,
    execute: false,
    prUrl: null,
    summary: null,
    taskId: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    switch (arg) {
      case "--base":
        parsed.baseBranch = readFlagValue(args, index);
        index += 1;
        break;
      case "--create-pr":
        parsed.createPr = true;
        break;
      case "--execute":
        parsed.execute = true;
        break;
      case "--pr-url":
        parsed.prUrl = readFlagValue(args, index);
        index += 1;
        break;
      case "--summary":
        parsed.summary = readFlagValue(args, index);
        index += 1;
        break;
      case "--task-id":
        parsed.taskId = readFlagValue(args, index);
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}
