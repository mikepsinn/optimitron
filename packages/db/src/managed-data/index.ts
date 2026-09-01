import type { PrismaClient } from "../generated/prisma/client.js";
import {
  formatManagedDemoUserResult,
  syncManagedDemoUser,
} from "./managed-demo-user.js";
import {
  formatManagedDemoContentResult,
  syncManagedDemoContent,
} from "./managed-demo-content.js";
import {
  formatManagedGrandmaKayResult,
  syncManagedGrandmaKay,
} from "./managed-grandma-kay.js";
import {
  formatManagedIamOrganizationResult,
  syncManagedIamOrganization,
} from "./managed-iam-organization.js";
import {
  formatManagedHumanityVGovernmentCaseResult,
  syncManagedHumanityVGovernmentCase,
} from "./managed-humanity-v-government.js";
import {
  formatManagedCommerceCatalogResult,
  syncManagedCommerceCatalog,
} from "./managed-commerce-catalog.js";
import {
  formatManagedDatingCatalogResult,
  syncManagedDatingCatalog,
} from "./managed-dating-catalog.js";
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
  treatyAccountabilityData: { synced: boolean; dryRun: boolean };
  tasks: SyncManagedTasksResult;
  taskTriggers: SyncManagedTaskTriggersResult;
  referendums: Awaited<ReturnType<typeof syncManagedReferendums>>;
  humanityVGovernmentCase: Awaited<
    ReturnType<typeof syncManagedHumanityVGovernmentCase>
  >;
  grandmaKay: Awaited<ReturnType<typeof syncManagedGrandmaKay>>;
  demoUser: Awaited<ReturnType<typeof syncManagedDemoUser>>;
  demoContent: Awaited<ReturnType<typeof syncManagedDemoContent>>;
  iamOrganization: Awaited<ReturnType<typeof syncManagedIamOrganization>>;
  commerceCatalog: Awaited<ReturnType<typeof syncManagedCommerceCatalog>>;
  datingCatalog: Awaited<ReturnType<typeof syncManagedDatingCatalog>>;
}

async function timeStep<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    console.log(`[managed-data] ${label}: ${Date.now() - start}ms`);
  }
}

export async function syncManagedData(
  prisma: PrismaClient,
  options: SyncManagedDataOptions,
): Promise<SyncManagedDataResult> {
  const totalStart = Date.now();
  setManagedSeedDataClient(prisma);

  const referenceData = { synced: false, dryRun: !options.apply };
  const treatyAccountabilityData = { synced: false, dryRun: !options.apply };

  if (options.apply) {
    await timeStep("reference-data", () => syncManagedReferenceData());
    referenceData.synced = true;
  }

  let createdByUserId = options.createdByUserId;

  if (!createdByUserId) {
    if (!options.apply) {
      createdByUserId = "managed-data-dry-run-user";
    } else {
      const user = await timeStep("system-user", () =>
        ensureManagedDataSystemUser(
          prisma as PrismaClient & ManagedTaskClient & ManagedIdentityClient,
          options.now,
        ),
      );
      createdByUserId = user.id;
    }
  }

  // Referendums first: tasks reference referendum slugs.
  const referendums = await timeStep("referendums", () =>
    syncManagedReferendums(prisma, { apply: options.apply }),
  );

  const humanityVGovernmentCase = await timeStep("humanity-v-government", () =>
    syncManagedHumanityVGovernmentCase(prisma, {
      apply: options.apply,
      createdByUserId,
    }),
  );

  const tasks = await timeStep("tasks", () =>
    syncManagedTasks(prisma as PrismaClient & ManagedTaskClient, {
      apply: options.apply,
      collectionKey: OPTIMIZE_EARTH_TASK_TREE_COLLECTION_KEY,
      createdByUserId,
      now: options.now,
      records: OPTIMIZE_EARTH_TASK_TREE,
    }),
  );

  if (options.apply) {
    await timeStep("treaty-accountability", () =>
      syncManagedTreatyAccountabilityData(),
    );
    treatyAccountabilityData.synced = true;
  }

  const taskTriggers = await timeStep("task-triggers", () =>
    syncManagedTaskTriggers(prisma, {
      apply: options.apply,
      now: options.now,
    }),
  );

  // Grandma Kay has FK on the treaty referendum + needs the Wishonia user.
  const grandmaKay = await timeStep("grandma-kay", () =>
    syncManagedGrandmaKay(prisma, { apply: options.apply }),
  );

  // Demo user is independent.
  const demoUser = await timeStep("demo-user", () =>
    syncManagedDemoUser(prisma, { apply: options.apply }),
  );

  const demoContent = await timeStep("demo-content", () =>
    syncManagedDemoContent(prisma, { apply: options.apply }),
  );

  // IAM is the campaign nonprofit org fixture + owner account.
  const iamOrganization = await timeStep("iam-organization", () =>
    syncManagedIamOrganization(prisma, { apply: options.apply }),
  );

  const commerceCatalog = await timeStep("commerce-catalog", () =>
    syncManagedCommerceCatalog(prisma, { apply: options.apply }),
  );

  const datingCatalog = await timeStep("dating-catalog", () =>
    syncManagedDatingCatalog(prisma, { apply: options.apply }),
  );

  console.log(`[managed-data] TOTAL: ${Date.now() - totalStart}ms`);

  return {
    referenceData,
    treatyAccountabilityData,
    tasks,
    taskTriggers,
    referendums,
    humanityVGovernmentCase,
    grandmaKay,
    demoUser,
    demoContent,
    iamOrganization,
    commerceCatalog,
    datingCatalog,
  };
}

export function formatManagedDataResult(result: SyncManagedDataResult) {
  return [
    formatSimpleManagedDataResult("Reference data", result.referenceData),
    formatManagedReferendumsResult(result.referendums),
    formatManagedHumanityVGovernmentCaseResult(result.humanityVGovernmentCase),
    formatManagedTasksResult(result.tasks),
    formatSimpleManagedDataResult(
      "Treaty accountability data",
      result.treatyAccountabilityData,
    ),
    formatManagedTaskTriggersResult(result.taskTriggers),
    formatManagedGrandmaKayResult(result.grandmaKay),
    formatManagedDemoUserResult(result.demoUser),
    formatManagedDemoContentResult(result.demoContent),
    formatManagedIamOrganizationResult(result.iamOrganization),
    formatManagedCommerceCatalogResult(result.commerceCatalog),
    formatManagedDatingCatalogResult(result.datingCatalog),
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
  formatManagedDemoContentResult,
  formatManagedDemoUserResult,
  formatManagedGrandmaKayResult,
  formatManagedCommerceCatalogResult,
  formatManagedDatingCatalogResult,
  formatManagedHumanityVGovernmentCaseResult,
  formatManagedIamOrganizationResult,
  formatManagedReferendumsResult,
  formatManagedTaskTriggersResult,
  formatManagedTasksResult,
  syncManagedDemoUser,
  syncManagedDemoContent,
  syncManagedGrandmaKay,
  syncManagedCommerceCatalog,
  syncManagedDatingCatalog,
  syncManagedHumanityVGovernmentCase,
  syncManagedIamOrganization,
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
  HUMANITY_V_GOVERNMENT_FULL_DAMAGES_PER_CAPITA_LABEL,
  MANAGED_HUMANITY_V_GOVERNMENT_CASE,
  MANAGED_HUMANITY_V_GOVERNMENT_VERDICT,
  getManagedHumanityVGovernmentMetadata,
} from "./managed-humanity-v-government.js";
export {
  AMF_LEGAL_NAME,
  IC2EWD_ORGANIZATION_NAME,
  IAM_ORGANIZATION_NAME,
  IAM_ORGANIZATION_NAMES,
  IAM_ORGANIZATION_NAMES_VERIFIED_AT_ISO,
  IAM_ORGANIZATION_SLUG,
  IAM_ORGANIZATION_SOURCE_REF,
  MIKE_SINN_EMAIL,
  MIKE_SINN_PERSON_SOURCE_REF,
} from "./managed-iam-organization.js";
export {
  COURT_OF_HUMANITY_REFERENDUM_SLUG,
  DECLARATION_REFERENDUM_SLUG,
  TRIAL_ABUNDANCE_REFERENDUM_QUESTION,
  TRIAL_ABUNDANCE_REFERENDUM_SLUG,
  TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_QUESTION,
  TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_SLUG,
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
