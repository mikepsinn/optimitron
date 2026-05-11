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
}

export async function syncManagedData(
  client: ManagedTaskClient & ManagedReferendumClient & Partial<ManagedIdentityClient>,
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

  return { tasks, referendums };
}

export function formatManagedDataResult(result: SyncManagedDataResult) {
  return [
    formatManagedReferendumsResult(result.referendums),
    formatManagedTasksResult(result.tasks),
  ].join("\n");
}

export {
  OPTIMIZE_EARTH_TASK_TREE,
  OPTIMIZE_EARTH_TASK_TREE_COLLECTION_KEY,
  ensureManagedDataSystemUser,
  formatManagedReferendumsResult,
  formatManagedTasksResult,
  syncManagedReferendums,
  syncManagedTasks,
};
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
