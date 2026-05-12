import type { PrismaClient } from "../generated/prisma/client.js";
import {
  formatManagedDemoUserResult,
  syncManagedDemoUser,
} from "./managed-demo-user.js";
import {
  formatManagedGrandmaKayResult,
  syncManagedGrandmaKay,
} from "./managed-grandma-kay.js";
import {
  formatManagedIamOrganizationResult,
  syncManagedIamOrganization,
} from "./managed-iam-organization.js";
import {
  formatManagedReferendumsResult,
  syncManagedReferendums,
} from "./managed-referendums.js";
import {
  formatManagedTaskTriggersResult,
  syncManagedTaskTriggers,
  type SyncManagedTaskTriggersResult,
} from "./managed-task-triggers.js";
import {
  OPTIMIZE_EARTH_TASK_TREE,
  OPTIMIZE_EARTH_TASK_TREE_COLLECTION_KEY,
} from "./optimize-earth-task-tree.js";
import {
  setManagedSeedDataClient,
  syncManagedBootstrapData,
  syncManagedReferenceData,
  syncManagedTreatyAccountabilityData,
} from "./managed-seed-data.js";
import {
  ensureManagedDataSystemUser,
  formatManagedTasksResult,
  syncManagedTasks,
  type ManagedIdentityClient,
  type ManagedTaskClient,
  type SyncManagedTasksResult,
} from "./sync-managed-tasks.js";

/**
 * Managed-data safety contract:
 * - This is the source of truth for production-worthy bootstrap/reference data.
 * - Sync code may create or update records it owns by stable ids/keys.
 * - Sync code must not treat absence from a source file as permission to delete.
 * - Removal must be explicit in the managed record, and should soft-delete by
 *   setting `deletedAt` / disabling the row. Hard deletes are only for owned
 *   child rows that are fully replaced inside a parent-owned collection.
 * - User-created rows, votes, comments, claims, donations, and plaintiffs are
 *   outside managed ownership unless a collection explicitly scopes them in.
 */

export interface SyncManagedDataOptions {
  apply: boolean;
  createdByUserId?: string;
  now?: Date;
}

export interface SyncManagedDataResult {
  referenceData: { synced: boolean; dryRun: boolean };
  bootstrapData: { synced: boolean; dryRun: boolean };
  treatyAccountabilityData: { synced: boolean; dryRun: boolean };
  tasks: SyncManagedTasksResult;
  taskTriggers: SyncManagedTaskTriggersResult;
  referendums: Awaited<ReturnType<typeof syncManagedReferendums>>;
  grandmaKay: Awaited<ReturnType<typeof syncManagedGrandmaKay>>;
  demoUser: Awaited<ReturnType<typeof syncManagedDemoUser>>;
  iamOrganization: Awaited<ReturnType<typeof syncManagedIamOrganization>>;
}

export async function syncManagedData(
  prisma: PrismaClient,
  options: SyncManagedDataOptions,
): Promise<SyncManagedDataResult> {
  setManagedSeedDataClient(prisma);

  const referenceData = { synced: false, dryRun: !options.apply };
  const bootstrapData = { synced: false, dryRun: !options.apply };
  const treatyAccountabilityData = { synced: false, dryRun: !options.apply };

  if (options.apply) {
    await syncManagedReferenceData();
    referenceData.synced = true;

    await syncManagedBootstrapData();
    bootstrapData.synced = true;
  }

  let createdByUserId = options.createdByUserId;

  if (!createdByUserId) {
    if (!options.apply) {
      createdByUserId = "managed-data-dry-run-user";
    } else {
      const user = await ensureManagedDataSystemUser(
        prisma as PrismaClient & ManagedTaskClient & ManagedIdentityClient,
        options.now,
      );
      createdByUserId = user.id;
    }
  }

  // Referendums first: tasks reference referendum slugs.
  const referendums = await syncManagedReferendums(prisma, { apply: options.apply });

  if (options.apply) {
    await syncManagedTreatyAccountabilityData();
    treatyAccountabilityData.synced = true;
  }

  const tasks = await syncManagedTasks(prisma as PrismaClient & ManagedTaskClient, {
    apply: options.apply,
    collectionKey: OPTIMIZE_EARTH_TASK_TREE_COLLECTION_KEY,
    createdByUserId,
    now: options.now,
    records: OPTIMIZE_EARTH_TASK_TREE,
  });

  const taskTriggers = await syncManagedTaskTriggers(prisma, {
    apply: options.apply,
    now: options.now,
  });

  // Grandma Kay has FK on the treaty referendum + needs the Wishonia user.
  const grandmaKay = await syncManagedGrandmaKay(prisma, { apply: options.apply });

  // Demo user is independent.
  const demoUser = await syncManagedDemoUser(prisma, { apply: options.apply });

  // IAM is the campaign nonprofit org fixture + owner account.
  const iamOrganization = await syncManagedIamOrganization(prisma, {
    apply: options.apply,
  });

  return {
    referenceData,
    bootstrapData,
    treatyAccountabilityData,
    tasks,
    taskTriggers,
    referendums,
    grandmaKay,
    demoUser,
    iamOrganization,
  };
}

export function formatManagedDataResult(result: SyncManagedDataResult) {
  return [
    formatSimpleManagedDataResult("Reference data", result.referenceData),
    formatSimpleManagedDataResult("Bootstrap data", result.bootstrapData),
    formatSimpleManagedDataResult(
      "Treaty accountability data",
      result.treatyAccountabilityData,
    ),
    formatManagedReferendumsResult(result.referendums),
    formatManagedTasksResult(result.tasks),
    formatManagedTaskTriggersResult(result.taskTriggers),
    formatManagedGrandmaKayResult(result.grandmaKay),
    formatManagedDemoUserResult(result.demoUser),
    formatManagedIamOrganizationResult(result.iamOrganization),
  ].join("\n");
}

function formatSimpleManagedDataResult(
  label: string,
  result: { synced: boolean; dryRun: boolean },
) {
  if (result.dryRun) return `${label}: would sync (dry-run)`;
  return result.synced ? `${label}: synced` : `${label}: unchanged`;
}

export {
  OPTIMIZE_EARTH_TASK_TREE,
  OPTIMIZE_EARTH_TASK_TREE_COLLECTION_KEY,
  ensureManagedDataSystemUser,
  formatManagedDemoUserResult,
  formatManagedGrandmaKayResult,
  formatManagedIamOrganizationResult,
  formatManagedReferendumsResult,
  formatManagedTaskTriggersResult,
  formatManagedTasksResult,
  syncManagedDemoUser,
  syncManagedGrandmaKay,
  syncManagedIamOrganization,
  syncManagedBootstrapData,
  syncManagedReferenceData,
  syncManagedReferendums,
  syncManagedTaskTriggers,
  syncManagedTasks,
  syncManagedTreatyAccountabilityData,
};
export { DEMO_EMAIL } from "./managed-demo-user.js";
export {
  GRANDMA_KAY_SOURCE_REF,
  GRANDMA_KAY_PERSON_CONDITION_ID,
} from "./managed-grandma-kay.js";
export {
  IAM_ORGANIZATION_NAME,
  IAM_ORGANIZATION_SLUG,
  IAM_ORGANIZATION_SOURCE_REF,
  MIKE_SINN_EMAIL,
  MIKE_SINN_PERSON_SOURCE_REF,
} from "./managed-iam-organization.js";
export {
  COURT_OF_HUMANITY_REFERENDUM_SLUG,
  DECLARATION_REFERENDUM_SLUG,
  TREATY_REFERENDUM_SLUG,
} from "../constants.js";
export {
  MANAGED_REFERENDUMS,
  buildReferendumContentHash,
} from "./managed-referendums.js";
export {
  ONE_PERCENT_TREATY_TRIGGER_BLUEPRINTS,
  type ManagedTaskCommunicationSpawnSpecInput,
  type ManagedTaskSpawnSpecInput,
  type ManagedTaskTriggerInput,
  type SyncManagedTaskTriggersOptions,
  type SyncManagedTaskTriggersResult,
} from "./managed-task-triggers.js";
export type {
  ManagedIdentityClient,
  ManagedTaskClient,
  ManagedTransactionClient,
  ManagedTaskRecord,
  SyncManagedTasksOptions,
  SyncManagedTasksResult,
} from "./sync-managed-tasks.js";
