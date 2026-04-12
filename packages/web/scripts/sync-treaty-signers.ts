import "./load-env";
import { pathToFileURL } from "url";
import "../../data/src/generated/country-panel";
import { getCountryPanelLatest } from "@optimitron/data";
import { OrgType } from "@optimitron/db";
import { findOrCreateOrganization } from "../src/lib/organization.server";
import { findOrCreatePerson } from "../src/lib/person.server";
import { prisma } from "../src/lib/prisma";
import { buildOnePercentTreatyPolicyModelRun } from "../src/lib/tasks/one-percent-treaty-policy-model";
import { upsertImportedTaskBundle } from "../src/lib/tasks/import-task-bundle.server";
import { syncTaskMilestones } from "../src/lib/tasks/milestones.server";
import { buildImportedTaskBundleFromPolicyModelRun } from "../src/lib/tasks/policy-model-run-to-imported-task-bundle";
import {
  buildTreatyParameterExport,
  getTreatyParameterSetHash,
} from "../src/lib/tasks/treaty-parameter-export";
import {
  attachTreatySignerSyncHash,
  buildTreatySignerSyncHash,
  canSkipTreatySignerSync,
  getTreatySignerSyncMismatchReasons,
} from "../src/lib/tasks/treaty-sync";
import {
  buildTreatySignerImportDraft,
  TREATY_DUE_AT,
  type TreatySignerSlot,
} from "../src/lib/tasks/treaty-signer-network";
import { buildFullTreatySignerSlots } from "../src/lib/tasks/treaty-signer-roster";
import { getTreatySignerTaskId, getTreatySignerTaskKey } from "../src/lib/tasks/task-keys";
import {
  ensureTreatyParentTask,
  softDeleteMissingTreatySignerNetworkTasks,
} from "../src/lib/tasks/treaty-program.server";

const SYNC_CONCURRENCY = 2;

interface PersistedTreatySignerSyncResult {
  action: "skipped" | "updated";
  assigneeOrganizationId: string;
  countryCode: string;
  signerTaskId: string;
  signerTaskKey: string;
}

export interface SyncTreatySignerCliOptions {
  countryCodes: string[] | null;
  importDb: boolean;
  printJson: boolean;
}

export function parseArgs(argv: string[]): SyncTreatySignerCliOptions {
  const getValue = (prefix: string) =>
    argv.find((arg) => arg.startsWith(`${prefix}=`))?.slice(prefix.length + 1) ?? null;
  const countryCodeValue = getValue("--country-codes");
  const ignoredParametersPath = getValue("--parameters");
  const ignoredRosterValue = getValue("--roster");

  if (ignoredParametersPath) {
    console.warn(
      `[TREATY SYNC] Ignoring --parameters=${ignoredParametersPath}. Treaty parameters now come from @optimitron/data/parameters.`,
    );
  }
  if (ignoredRosterValue) {
    console.warn(
      `[TREATY SYNC] Ignoring --roster=${ignoredRosterValue}. Signer tasks now always use the full impact-ranked roster.`,
    );
  }

  return {
    countryCodes:
      countryCodeValue == null
        ? null
        : countryCodeValue
            .split(",")
            .map((value) => value.trim().toUpperCase())
            .filter(Boolean),
    importDb: argv.includes("--import-db"),
    printJson: argv.includes("--print-json"),
  };
}

export function getTreatySignerSlots(options: {
  countryCodes?: string[] | null;
} = {}): TreatySignerSlot[] {
  const countryPanel = getCountryPanelLatest();
  const selectedRoster = buildFullTreatySignerSlots(countryPanel);

  if (options.countryCodes == null) {
    return selectedRoster;
  }

  const requested = new Set(options.countryCodes.map((value) => value.trim().toUpperCase()));
  return selectedRoster.filter((slot) => requested.has(slot.countryCode.toUpperCase()));
}

function chunkArray<TValue>(values: TValue[], size: number) {
  const chunks: TValue[][] = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

export async function syncTreatySigners(options: SyncTreatySignerCliOptions) {
  const rawExport = buildTreatyParameterExport();
  const generatedAt = new Date().toISOString();
  const parameterSetHash = getTreatyParameterSetHash();

  const baseRun = buildOnePercentTreatyPolicyModelRun(rawExport, {
    calculationVersion: "one-percent-treaty-compiler-v1",
    generatedAt,
    parameterSetHash,
  });
  const baseDraft = buildImportedTaskBundleFromPolicyModelRun(baseRun, {
    dueAt: TREATY_DUE_AT,
    impactStatement:
      "Thirty seconds for the signer. Civilizational downside if this stays overdue.",
    skillTags: ["diplomacy", "executive-action", "treaty-negotiation"],
  });

  const selectedSlots = getTreatySignerSlots({
    countryCodes: options.countryCodes,
  });

  if (selectedSlots.length === 0) {
    throw new Error("No treaty signer slots matched the requested filter.");
  }

  const drafts = selectedSlots.map((slot) => {
    const signerDraft = buildTreatySignerImportDraft({
      baseDraft,
      slot,
    });

    return {
      signerDraft,
      slot,
    };
  });

  const summary = drafts.map(({ signerDraft, slot }) => {
    const frame = signerDraft.bundle.impactEstimate.frames[0];
    const annualRedirectMetric = frame?.metrics.find(
      (metric) => metric.metricKey === "annual_redirect_amount_usd",
    );

    return {
      annualRedirectAmountUsd: annualRedirectMetric?.baseValue ?? null,
      countryCode: slot.countryCode,
      countryName: slot.countryName,
      signerTaskKey: signerDraft.bundle.task.taskKey,
      treatyTarget: slot.decisionMakerLabel,
    };
  });

  if (options.printJson || !options.importDb) {
    console.log(JSON.stringify(summary, null, 2));
  }

  if (!options.importDb) {
    console.log("skip db sync (pass --import-db to persist signer tasks)");
    return;
  }

  const parentTask = await ensureTreatyParentTask({
    jurisdictionId: null,
  });

  const liveTaskKeys: string[] = [];
  const persisted: PersistedTreatySignerSyncResult[] = [];

  for (const chunk of chunkArray(drafts, SYNC_CONCURRENCY)) {
    const chunkResults = await Promise.all(
      chunk.map(async ({ signerDraft, slot }) => {
        const organization = await findOrCreateOrganization({
          name: slot.governmentName,
          sourceRef: `organization:government:${slot.countryCode.toLowerCase()}`,
          sourceUrl: slot.officialSourceUrl ?? slot.contactUrl ?? slot.governmentWebsite,
          type: OrgType.GOVERNMENT,
          website: slot.governmentWebsite,
        });

        // Create/find Person record so the leader has a profile page
        const person = await findOrCreatePerson({
          countryCode: slot.countryCode,
          currentAffiliation: slot.governmentName,
          displayName: slot.decisionMakerLabel,
          email: slot.contactEmail ?? undefined,
          isPublicFigure: true,
          roleTitle: slot.roleTitle,
          sourceUrl: slot.officialSourceUrl ?? slot.contactUrl ?? null,
        });

        // If we have a contact email, ensure a User record exists so the
        // leader (or their staff) can sign in via magic link and sign the treaty.
        if (slot.contactEmail) {
          const normalizedEmail = slot.contactEmail.trim().toLowerCase();
          const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: { id: true },
          });

          if (!existingUser) {
            try {
              await prisma.user.create({
                data: {
                  email: normalizedEmail,
                  name: slot.decisionMakerLabel,
                  personId: person.id,
                },
              });
            } catch (userCreateError) {
              // Race condition or constraint violation — user may have been
              // created between the findUnique and create calls. Safe to skip.
              console.warn(
                `[TREATY SYNC] Could not create user for ${slot.countryCode} (${normalizedEmail}):`,
                userCreateError instanceof Error ? userCreateError.message : userCreateError,
              );
            }
          }
        }

        const syncHash = buildTreatySignerSyncHash({
          assigneeOrganizationId: organization.id,
          assigneePersonId: person.id,
          bundle: signerDraft.bundle,
          parentTaskId: parentTask.id,
          sortOrder: slot.sortOrder,
        });

        attachTreatySignerSyncHash(signerDraft.bundle, syncHash);

        const existingTask = await prisma.task.findUnique({
          where: {
            taskKey: signerDraft.bundle.task.taskKey,
          },
          select: {
            assigneeOrganizationId: true,
            assigneePersonId: true,
            contextJson: true,
            currentImpactEstimateSet: {
              select: {
                parameterSetHash: true,
              },
            },
            deletedAt: true,
            id: true,
            parentTaskId: true,
            sortOrder: true,
            taskKey: true,
          },
        });

        if (
          canSkipTreatySignerSync({
            assigneeOrganizationId: organization.id,
            assigneePersonId: person.id,
            existingTask,
            parameterSetHash,
            parentTaskId: parentTask.id,
            sortOrder: slot.sortOrder,
            syncHash,
          })
        ) {
          return {
            action: "skipped" as const,
            assigneeOrganizationId: organization.id,
            countryCode: slot.countryCode,
            liveTaskKeys: [getTreatySignerTaskKey(slot)],
            signerTaskId: existingTask!.id,
            signerTaskKey: existingTask!.taskKey,
            sortOrder: slot.sortOrder,
          };
        }

        if (process.env.DEBUG_TREATY_SYNC === "1") {
          console.warn(
            `[TREATY SYNC] ${slot.countryCode} update reasons: ${getTreatySignerSyncMismatchReasons({
              assigneeOrganizationId: organization.id,
              assigneePersonId: person.id,
              existingTask,
              parameterSetHash,
              parentTaskId: parentTask.id,
              sortOrder: slot.sortOrder,
              syncHash,
            }).join(", ")}`,
          );
        }

        const result = await upsertImportedTaskBundle(signerDraft.bundle, {
          assigneeOrganizationId: organization.id,
          assigneePersonId: person.id,
          isPublic: true,
          jurisdictionId: null,
          parentTaskId: parentTask.id,
          taskId: getTreatySignerTaskId(slot),
        });

        await prisma.task.update({
          where: {
            id: result.taskId,
          },
          data: {
            sortOrder: slot.sortOrder,
          },
        });

        await syncTaskMilestones(result.taskId, []);

        return {
          action: "updated" as const,
          assigneeOrganizationId: organization.id,
          countryCode: slot.countryCode,
          liveTaskKeys: [getTreatySignerTaskKey(slot)],
          signerTaskId: result.taskId,
          signerTaskKey: result.taskKey,
          sortOrder: slot.sortOrder,
        };
      }),
    );

    for (const chunkResult of chunkResults.sort((left, right) => left.sortOrder - right.sortOrder)) {
      liveTaskKeys.push(...chunkResult.liveTaskKeys);
      persisted.push({
        action: chunkResult.action,
        assigneeOrganizationId: chunkResult.assigneeOrganizationId,
        countryCode: chunkResult.countryCode,
        signerTaskId: chunkResult.signerTaskId,
        signerTaskKey: chunkResult.signerTaskKey,
      });
    }
  }

  if (options.countryCodes == null) {
    await softDeleteMissingTreatySignerNetworkTasks(liveTaskKeys);
  }

  console.log(
    JSON.stringify(
      {
        parentTaskId: parentTask.id,
        skippedCount: persisted.filter((entry) => entry.action === "skipped").length,
        signerCount: persisted.length,
        synced: persisted,
        updatedCount: persisted.filter((entry) => entry.action === "updated").length,
      },
      null,
      2,
    ),
  );
}

async function main() {
  await syncTreatySigners(parseArgs(process.argv.slice(2)));
}

const isMain = process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  void main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
