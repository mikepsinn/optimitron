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
}

export async function syncManagedData(
  client: ManagedTaskClient & Partial<ManagedIdentityClient>,
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

  return {
    tasks: await syncManagedTasks(client, {
      apply: options.apply,
      collectionKey: OPTIMIZE_EARTH_TASK_TREE_COLLECTION_KEY,
      createdByUserId,
      now: options.now,
      records: OPTIMIZE_EARTH_TASK_TREE,
    }),
  };
}

export function formatManagedDataResult(result: SyncManagedDataResult) {
  return formatManagedTasksResult(result.tasks);
}

export {
  OPTIMIZE_EARTH_TASK_TREE,
  OPTIMIZE_EARTH_TASK_TREE_COLLECTION_KEY,
  ensureManagedDataSystemUser,
  formatManagedTasksResult,
  syncManagedTasks,
};
export type {
  ManagedIdentityClient,
  ManagedTaskClient,
  ManagedTransactionClient,
  ManagedTaskRecord,
  SyncManagedTasksOptions,
  SyncManagedTasksResult,
} from "./sync-managed-tasks.js";
