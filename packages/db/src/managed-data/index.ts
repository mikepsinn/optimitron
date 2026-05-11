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
  formatManagedReferendumsResult,
  syncManagedReferendums,
} from "./managed-referendums.js";
import {
  OPTIMIZE_EARTH_TASK_TREE,
  OPTIMIZE_EARTH_TASK_TREE_COLLECTION_KEY,
} from "./optimize-earth-task-tree.js";
import {
  ensureManagedDataSystemUser,
  formatManagedTasksResult,
  syncManagedTasks,
  type ManagedIdentityClient,
  type ManagedTaskClient,
  type SyncManagedTasksResult,
} from "./sync-managed-tasks.js";

export interface SyncManagedDataOptions {
  apply: boolean;
  createdByUserId?: string;
  now?: Date;
}

export interface SyncManagedDataResult {
  tasks: SyncManagedTasksResult;
  referendums: Awaited<ReturnType<typeof syncManagedReferendums>>;
  grandmaKay: Awaited<ReturnType<typeof syncManagedGrandmaKay>>;
  demoUser: Awaited<ReturnType<typeof syncManagedDemoUser>>;
}

export async function syncManagedData(
  prisma: PrismaClient,
  options: SyncManagedDataOptions,
): Promise<SyncManagedDataResult> {
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

  const tasks = await syncManagedTasks(prisma as PrismaClient & ManagedTaskClient, {
    apply: options.apply,
    collectionKey: OPTIMIZE_EARTH_TASK_TREE_COLLECTION_KEY,
    createdByUserId,
    now: options.now,
    records: OPTIMIZE_EARTH_TASK_TREE,
  });

  // Grandma Kay has FK on the treaty referendum + needs the Wishonia user.
  const grandmaKay = await syncManagedGrandmaKay(prisma, { apply: options.apply });

  // Demo user is independent.
  const demoUser = await syncManagedDemoUser(prisma, { apply: options.apply });

  return { tasks, referendums, grandmaKay, demoUser };
}

export function formatManagedDataResult(result: SyncManagedDataResult) {
  return [
    formatManagedReferendumsResult(result.referendums),
    formatManagedTasksResult(result.tasks),
    formatManagedGrandmaKayResult(result.grandmaKay),
    formatManagedDemoUserResult(result.demoUser),
  ].join("\n");
}

export {
  OPTIMIZE_EARTH_TASK_TREE,
  OPTIMIZE_EARTH_TASK_TREE_COLLECTION_KEY,
  ensureManagedDataSystemUser,
  formatManagedDemoUserResult,
  formatManagedGrandmaKayResult,
  formatManagedReferendumsResult,
  formatManagedTasksResult,
  syncManagedDemoUser,
  syncManagedGrandmaKay,
  syncManagedReferendums,
  syncManagedTasks,
};
export { DEMO_EMAIL } from "./managed-demo-user.js";
export {
  GRANDMA_KAY_SOURCE_REF,
  GRANDMA_KAY_PERSON_CONDITION_ID,
} from "./managed-grandma-kay.js";
export {
  COURT_OF_HUMANITY_REFERENDUM_SLUG,
  DECLARATION_REFERENDUM_SLUG,
  MANAGED_REFERENDUMS,
  TREATY_REFERENDUM_SLUG,
  buildReferendumContentHash,
} from "./managed-referendums.js";
export type {
  ManagedIdentityClient,
  ManagedTaskClient,
  ManagedTransactionClient,
  ManagedTaskRecord,
  SyncManagedTasksOptions,
  SyncManagedTasksResult,
} from "./sync-managed-tasks.js";
