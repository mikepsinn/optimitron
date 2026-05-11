import {
  formatManagedDemoUserResult,
  syncManagedDemoUser,
  type ManagedDemoUserClient,
  type SyncManagedDemoUserResult,
} from "./managed-demo-user.js";
import {
  formatManagedGrandmaKayResult,
  syncManagedGrandmaKay,
  type ManagedGrandmaKayClient,
  type SyncManagedGrandmaKayResult,
} from "./managed-grandma-kay.js";
import {
  formatManagedReferendumsResult,
  syncManagedReferendums,
  type ManagedReferendumClient,
  type SyncManagedReferendumsResult,
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
  referendums: SyncManagedReferendumsResult;
  grandmaKay: SyncManagedGrandmaKayResult;
  demoUser: SyncManagedDemoUserResult;
}

export async function syncManagedData(
  client: ManagedTaskClient & ManagedReferendumClient & ManagedGrandmaKayClient & ManagedDemoUserClient & Partial<ManagedIdentityClient>,
  options: SyncManagedDataOptions,
): Promise<SyncManagedDataResult> {
  let createdByUserId = options.createdByUserId;

  if (!createdByUserId) {
    if (!options.apply) {
      createdByUserId = "managed-data-dry-run-user";
    } else if (client.person && client.user) {
      const user = await ensureManagedDataSystemUser(
        client as ManagedTaskClient & ManagedIdentityClient,
        options.now,
      );
      createdByUserId = user.id;
    } else {
      throw new Error(
        "syncManagedData apply mode requires createdByUserId or person/user delegates",
      );
    }
  }

  // Referendums sync first: the task tree references referendum slugs in
  // a few task contexts (e.g. "sign the treaty"), and ordering them before
  // tasks makes the dependency direction explicit even if no FK enforces it.
  const referendums = await syncManagedReferendums(client, {
    apply: options.apply,
  });

  const tasks = await syncManagedTasks(client, {
    apply: options.apply,
    collectionKey: OPTIMIZE_EARTH_TASK_TREE_COLLECTION_KEY,
    createdByUserId,
    now: options.now,
    records: OPTIMIZE_EARTH_TASK_TREE,
  });

  // Grandma Kay depends on the treaty referendum existing (FK on
  // referendumVote.referendumId). Run after referendums.
  const grandmaKay = await syncManagedGrandmaKay(client, {
    apply: options.apply,
  });

  // Demo user has no FK dependencies on other managed records.
  const demoUser = await syncManagedDemoUser(client, {
    apply: options.apply,
  });

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
export type {
  ManagedDemoUserClient,
  SyncManagedDemoUserOptions,
  SyncManagedDemoUserResult,
} from "./managed-demo-user.js";
export {
  GRANDMA_KAY_SOURCE_REF,
  GRANDMA_KAY_PERSON_CONDITION_ID,
} from "./managed-grandma-kay.js";
export type {
  ManagedGrandmaKayClient,
  SyncManagedGrandmaKayOptions,
  SyncManagedGrandmaKayResult,
} from "./managed-grandma-kay.js";
export {
  COURT_OF_HUMANITY_REFERENDUM_SLUG,
  DECLARATION_REFERENDUM_SLUG,
  MANAGED_REFERENDUMS,
  MANAGED_REFERENDUMS_COLLECTION_KEY,
  TREATY_REFERENDUM_SLUG,
  buildReferendumContentHash,
} from "./managed-referendums.js";
export type {
  ManagedReferendumClient,
  ManagedReferendumRecord,
  SyncManagedReferendumsOptions,
  SyncManagedReferendumsResult,
} from "./managed-referendums.js";
export type {
  ManagedIdentityClient,
  ManagedTaskClient,
  ManagedTransactionClient,
  ManagedTaskRecord,
  SyncManagedTasksOptions,
  SyncManagedTasksResult,
} from "./sync-managed-tasks.js";
