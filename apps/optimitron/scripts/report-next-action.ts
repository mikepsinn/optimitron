import "./load-env";

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { selectNextEarthAction } from "@optimitron/agent";
import { TaskStatus } from "@optimitron/db";
import { getEarthExecutionPolicy } from "../src/lib/tasks/action-policy";
import * as tasks from "../src/lib/tasks.server";

interface ParsedArgs {
  outPath: string | null;
}

function parseArgs(argv: string[]): ParsedArgs {
  let outPath: string | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--out") {
      outPath = argv[index + 1] ?? null;
      index += 1;
    }
  }

  return { outPath };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const liveTasks = await tasks.listTasks({
    limit: 5000,
    status: TaskStatus.ACTIVE,
    visibility: "public",
  });
  const decision = selectNextEarthAction({
    agent: {
      availableHoursPerWeek: 10,
      interestTags: ["growth", "governance", "systems", "funding", "procurement"],
      skillTags: ["typescript", "growth", "research", "policy", "funding", "procurement"],
    },
    policy: getEarthExecutionPolicy(),
    tasks: liveTasks as any,
  });

  const summary = {
    actionKind: decision.actionKind,
    auditIssues: decision.audit.issues,
    autoExecutable: decision.autoExecutable,
    economics: decision.economics
      ? {
          estimatedExternalCostUsd: decision.economics.estimatedExternalCostUsd,
          expectedValuePerHourUsd: decision.economics.expectedValuePerHourUsd,
          fundingGapUsd: decision.economics.fundingGapUsd,
          lawfulSpendTypes: decision.economics.lawfulSpendTypes,
          maxRationalSpendUsd: decision.economics.maxRationalSpendUsd,
          requiredApproval: decision.economics.requiredApproval,
          suggestedActionKind: decision.economics.suggestedActionKind,
        }
      : null,
    groundingRefs: decision.groundingRefs,
    queueRepairPlan: decision.queueRepairPlan ?? null,
    rationale: decision.rationale,
    requiredApproval: decision.requiredApproval,
    task:
      decision.task == null
        ? null
        : {
            id: decision.task.id,
            taskKey: decision.task.taskKey ?? null,
            title: decision.task.title,
          },
  };

  if (args.outPath) {
    const outputPath = resolve(process.cwd(), args.outPath);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    console.log(`Wrote next action report to ${outputPath}`);
    return;
  }

  console.log(JSON.stringify(summary, null, 2));
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
