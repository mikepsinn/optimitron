import "./load-env";
import { mkdir, writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { buildOnePercentTreatyPolicyModelRun } from "../src/lib/tasks/one-percent-treaty-policy-model";
import { buildImportedTaskBundleFromPolicyModelRun } from "../src/lib/tasks/policy-model-run-to-imported-task-bundle";
import {
  buildTreatyParameterExport,
  getTreatyParameterSetHash,
} from "../src/lib/tasks/treaty-parameter-export";
import { ensureTreatyParentTask } from "../src/lib/tasks/treaty-program.server";
import { TREATY_DUE_AT } from "../src/lib/tasks/treaty-signer-network";

const DEFAULT_OUTPUT_PATH = "tmp/one-percent-treaty-policy-model-run.json";

interface CliOptions {
  importDb: boolean;
  outputPath: string | null;
  printJson: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const getValue = (prefix: string) =>
    argv.find((arg) => arg.startsWith(`${prefix}=`))?.slice(prefix.length + 1) ?? null;
  const ignoredParametersPath = getValue("--parameters");

  if (ignoredParametersPath) {
    console.warn(
      `[IMPORT TREATY MODEL] Ignoring --parameters=${ignoredParametersPath}. Treaty parameters now come from @optimitron/data/parameters.`,
    );
  }

  return {
    importDb: argv.includes("--import-db"),
    outputPath: getValue("--output"),
    printJson: argv.includes("--print-json"),
  };
}

async function resolveJurisdictionId(
  requestedJurisdictionId: string,
) {
  const { prisma } = await import("../src/lib/prisma");
  const record = await prisma.jurisdiction.findUnique({
    where: {
      id: requestedJurisdictionId,
    },
    select: {
      id: true,
    },
  });

  return record?.id ?? null;
}
async function main() {
  const options = parseArgs(process.argv.slice(2));
  const rawExport = buildTreatyParameterExport();
  const generatedAt = new Date().toISOString();
  const parameterSetHash = getTreatyParameterSetHash();
  const run = buildOnePercentTreatyPolicyModelRun(rawExport, {
    calculationVersion: "one-percent-treaty-compiler-v1",
    generatedAt,
    parameterSetHash,
  });
  const imported = buildImportedTaskBundleFromPolicyModelRun(run, {
    dueAt: TREATY_DUE_AT,
    impactStatement:
      "Thirty seconds for the signer. Civilizational upside if completed.",
    skillTags: ["diplomacy", "executive-action", "treaty-negotiation"],
  });
  imported.bundle.task.contextJson = {
    ...imported.bundle.task.contextJson,
    acceptanceCriteria: [
      "Executive order or treaty instrument is drafted.",
      "Relevant legal review is complete.",
      "Leader signs the treaty or equivalent commitment.",
      "Implementation authority is designated publicly.",
      "First public implementation step is announced within 90 days.",
    ],
  };
  const outputPath = resolve(
    process.cwd(),
    options.outputPath ?? DEFAULT_OUTPUT_PATH,
  );

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(run, null, 2)}\n`, "utf8");
  console.log(`wrote policy model run -> ${outputPath}`);

  if (options.printJson) {
    console.log(JSON.stringify(run, null, 2));
  }

  if (!options.importDb) {
    console.log("skip db import (pass --import-db to persist task + impact data)");
    return;
  }

  const [{ upsertImportedTaskBundle }, { findOrCreatePerson }, { syncTaskMilestones }] = await Promise.all([
    import("../src/lib/tasks/import-task-bundle.server"),
    import("../src/lib/person.server"),
    import("../src/lib/tasks/milestones.server"),
  ]);

  const assigneePerson =
    imported.assigneeHint == null
      ? null
      : await findOrCreatePerson({
          currentAffiliation: imported.assigneeHint.currentAffiliation,
          displayName: imported.assigneeHint.displayName,
          isPublicFigure: imported.assigneeHint.isPublicFigure,
          sourceRef: imported.assigneeHint.actorKey,
          sourceUrl:
            imported.bundle.sourceArtifacts.find((artifact) => artifact.sourceSystem === "MANUAL")
              ?.sourceUrl ?? null,
        });

  const jurisdictionId = await resolveJurisdictionId(run.policy.jurisdictionId);

  if (!jurisdictionId) {
    console.warn(
      `warning: jurisdiction ${run.policy.jurisdictionId} not found locally; importing task without jurisdiction link`,
    );
  }

  const parentTask = await ensureTreatyParentTask({
    jurisdictionId,
  });

  const result = await upsertImportedTaskBundle(imported.bundle, {
    assigneePersonId: assigneePerson?.id ?? null,
    isPublic: true,
    jurisdictionId,
  });
  const { prisma } = await import("../src/lib/prisma");
  await prisma.task.update({
    where: {
      id: result.taskId,
    },
    data: {
      parentTaskId: parentTask.id,
      sortOrder: 0,
    },
  });
  await syncTaskMilestones(result.taskId, []);

  console.log(
    JSON.stringify(
      {
        assigneePersonId: assigneePerson?.id ?? null,
        estimateSetId: result.estimateSetId,
        parentTaskId: parentTask.id,
        taskId: result.taskId,
        taskKey: result.taskKey,
      },
      null,
      2,
    ),
  );
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
