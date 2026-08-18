import "./load-env";

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { reviewEarthQueueAndBuildSystemImprovements, type TaskTreeNode } from "@optimitron/agent";
import { PrismaClient, TaskStatus } from "@optimitron/db";
import { PrismaPg } from "@prisma/adapter-pg";
import * as taskApi from "../src/lib/tasks.server";

const tasks = ("default" in taskApi ? taskApi.default : taskApi) as typeof taskApi;

type LiveTaskRecord = Awaited<ReturnType<typeof tasks.listTasks>>[number];

interface FlatTaskRecord {
  category: string | null;
  estimatedEffortHours: number | null;
  id: string;
  isPublic: boolean;
  parentTaskId: string | null;
  status: string;
  taskKey: string | null;
  title: string;
}

interface ParsedArgs {
  outPath: string | null;
}

function parseArgs(argv: string[]): ParsedArgs {
  let outPath: string | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--out") {
      outPath = argv[index + 1] ?? null;
      index += 1;
    }
  }

  return { outPath };
}

function formatCompactNumber(value: number | null | undefined, options?: Intl.NumberFormatOptions) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "unknown";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    notation: Math.abs(value) >= 1000 ? "compact" : "standard",
    ...options,
  }).format(value);
}

function formatUsd(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "unknown";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    notation: Math.abs(value) >= 1000 ? "compact" : "standard",
    style: "currency",
  }).format(value);
}

function formatStatusBadge(task: { isPublic?: boolean | null; status?: string | null }) {
  return `${task.status ?? "UNKNOWN"}/${task.isPublic === false ? "private" : "public"}`;
}

function buildTreeMap<TTask extends { id: string; parentTaskId?: string | null }>(tasksToIndex: TTask[]) {
  const byParent = new Map<string | null, TTask[]>();

  for (const task of tasksToIndex) {
    const key = task.parentTaskId ?? null;
    const bucket = byParent.get(key) ?? [];
    bucket.push(task);
    byParent.set(key, bucket);
  }

  return byParent;
}

function renderLiveTaskTree(tasksToRender: LiveTaskRecord[]) {
  const byParent = buildTreeMap(tasksToRender);
  const allIds = new Set(tasksToRender.map((task) => task.id));
  const roots = tasksToRender.filter(
    (task) => task.parentTaskId === null || !allIds.has(task.parentTaskId),
  );

  const lines: string[] = [];
  const visited = new Set<string>();

  function renderNode(task: LiveTaskRecord, depth: number) {
    visited.add(task.id);
    const indent = "  ".repeat(depth);
    const evPerHour = formatUsd(task.impact?.expectedValuePerHourUsd);
    const delayPerDay = formatUsd(task.impact?.delayEconomicValueUsdLostPerDay);
    const effort = formatCompactNumber(task.estimatedEffortHours, { maximumFractionDigits: 1 });
    const taskKey = task.taskKey ? ` \`${task.taskKey}\`` : "";
    const category = task.category ? ` ${task.category}` : "";

    lines.push(
      `${indent}- ${task.title}${taskKey} (${formatStatusBadge(task)}${category}, effort ${effort}h, EV/hr ${evPerHour}, delay/day ${delayPerDay})`,
    );

    const children = (byParent.get(task.id) ?? []).sort((left, right) =>
      left.title.localeCompare(right.title),
    );
    for (const child of children) {
      renderNode(child, depth + 1);
    }
  }

  for (const root of roots.sort((left, right) => left.title.localeCompare(right.title))) {
    renderNode(root, 0);
  }

  const orphans = tasksToRender.filter((task) => !visited.has(task.id));
  if (orphans.length > 0) {
    lines.push("");
    lines.push("Orphans:");
    for (const task of orphans.sort((left, right) => left.title.localeCompare(right.title))) {
      renderNode(task, 1);
    }
  }

  return lines;
}

function renderFlatTree(tasksToRender: FlatTaskRecord[]) {
  const byParent = buildTreeMap(tasksToRender);
  const allIds = new Set(tasksToRender.map((task) => task.id));
  const roots = tasksToRender.filter(
    (task) => task.parentTaskId === null || !allIds.has(task.parentTaskId),
  );
  const lines: string[] = [];

  function renderNode(task: FlatTaskRecord, depth: number) {
    const indent = "  ".repeat(depth);
    const taskKey = task.taskKey ? ` \`${task.taskKey}\`` : "";
    const category = task.category ? ` ${task.category}` : "";
    const effort = formatCompactNumber(task.estimatedEffortHours, { maximumFractionDigits: 1 });
    lines.push(
      `${indent}- ${task.title}${taskKey} (${formatStatusBadge(task)}${category}, effort ${effort}h)`,
    );

    const children = (byParent.get(task.id) ?? []).sort((left, right) =>
      left.title.localeCompare(right.title),
    );
    for (const child of children) {
      renderNode(child, depth + 1);
    }
  }

  for (const root of roots.sort((left, right) => left.title.localeCompare(right.title))) {
    renderNode(root, 0);
  }

  return lines;
}

function renderTaskTreeNode(node: TaskTreeNode, depth = 0): string[] {
  const indent = "  ".repeat(depth);
  const taskKey = node.taskKey ? ` \`${node.taskKey}\`` : "";
  const effort = formatCompactNumber(node.estimatedEffortHours, { maximumFractionDigits: 1 });
  const evPerHour = formatUsd(node.impact?.expectedValuePerHourUsd);
  const delayPerDay = formatUsd(node.impact?.delayEconomicValueUsdLostPerDay);
  const lines = [
    `${indent}- ${node.title}${taskKey} (${node.status}/${node.isPublic === false ? "private" : "public"}, effort ${effort}h, EV/hr ${evPerHour}, delay/day ${delayPerDay})`,
  ];

  for (const child of node.children ?? []) {
    lines.push(...renderTaskTreeNode(child, depth + 1));
  }

  return lines;
}

function buildStatusSummary(tasksToSummarize: FlatTaskRecord[]) {
  const summary = new Map<string, number>();

  for (const task of tasksToSummarize) {
    const key = `${task.status}/${task.isPublic ? "public" : "private"}`;
    summary.set(key, (summary.get(key) ?? 0) + 1);
  }

  return [...summary.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([key, count]) => `- ${key}: ${count}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter, log: ["error"] });

  try {
    const [allTasks, liveTasks] = await Promise.all([
      prisma.task.findMany({
        where: { deletedAt: null },
        orderBy: [{ createdAt: "asc" }],
        select: {
          category: true,
          estimatedEffortHours: true,
          id: true,
          isPublic: true,
          parentTaskId: true,
          status: true,
          taskKey: true,
          title: true,
        },
      }),
      tasks.listTasks({
        limit: 5000,
        status: TaskStatus.ACTIVE,
        visibility: "public",
      }),
    ]);
    const liveAudit = reviewEarthQueueAndBuildSystemImprovements(liveTasks);

    const lines = [
      "# Task Tree Report",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Snapshot",
      "",
      `- Total tasks in DB: ${allTasks.length}`,
      `- Active public tasks: ${liveTasks.length}`,
      `- Top-level roots in DB: ${allTasks.filter((task) => task.parentTaskId === null).length}`,
      "",
      "Status counts:",
      ...buildStatusSummary(allTasks),
      "",
      "## Canonical Active Public Tree",
      "",
      ...renderLiveTaskTree(liveTasks),
      "",
      "## Queue Audit",
      "",
      `- Dominant family: ${liveAudit.audit.dominantFamily ?? "none"} (${formatCompactNumber(liveAudit.audit.dominantFamilyShare * 100, { maximumFractionDigits: 1 })}%)`,
      `- Impact coverage ratio: ${formatCompactNumber(liveAudit.audit.impactCoverageRatio * 100, { maximumFractionDigits: 1 })}%`,
      `- Treaty signer count in queue: ${liveAudit.audit.treatySignerCount}`,
      `- Aggregate EV/hr in queue: ${formatUsd(liveAudit.audit.aggregateExpectedValuePerHourUsd)}`,
      `- Aggregate delay cost/day in queue: ${formatUsd(liveAudit.audit.aggregateDelayEconomicValueUsdPerDay)}`,
      `- System-improvement priority: ${liveAudit.audit.systemImprovementPriority}`,
      "",
      "Issues:",
      ...liveAudit.audit.issues.map(
        (issue) => `- [${issue.severity}] ${issue.code}: ${issue.message}`,
      ),
      "",
      "## Recommended System-Improvement Tree",
      "",
      ...liveAudit.roots.flatMap((root) => renderTaskTreeNode(root)),
      "",
      "## Full Database Tree",
      "",
      ...renderFlatTree(allTasks),
      "",
    ];

    const output = `${lines.join("\n")}\n`;

    if (args.outPath) {
      const outputPath = resolve(process.cwd(), args.outPath);
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, output, "utf8");
      console.log(`Wrote task tree report to ${outputPath}`);
      return;
    }

    process.stdout.write(output);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown task tree export error";
  console.error(message);
  process.exit(1);
});
