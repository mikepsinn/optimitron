import type { Prisma, TaskStatus } from "@optimitron/db";

export interface SpawnedSpec {
  /** The TaskSpawnSpec.kind that produced this task (e.g. "shareReferralUrl"). */
  kind: string;
  /** Whether this spec was the parent (isParent=true). */
  isParent: boolean;
  /** The resulting Task row id. */
  taskId: string;
  /** The resulting Task row taskKey (always non-null for trigger-spawned tasks). */
  taskKey: string;
  /** Current status of the task post-fire. */
  status: TaskStatus;
  /** True when this fire created the row instead of updating an existing taskKey. */
  wasCreated: boolean;
}

export interface FireResult {
  result:
    | "spawned"
    | "alreadyFired"
    | "filteredOut"
    | "verified"
    | "communicated"
    | "rateLimited"
    | "failed";
  triggerId?: string;
  triggerKey: string;
  idempotencyKey?: string;
  spawnedSpecs: SpawnedSpec[];
  spawnedTaskIds: string[];
  spawnedTaskKeys: string[];
  reason?: string;
  error?: string;
}

// Keep this structural: comparing the full PrismaClient and TransactionClient
// types makes TypeScript expand the entire generated schema at each union site.
export type FireDb = Pick<
  Prisma.TransactionClient,
  | "externalActionRequest"
  | "formSubmission"
  | "person"
  | "task"
  | "taskComment"
  | "taskCommunication"
  | "taskCommunicationEndpoint"
  | "taskExecutionAttempt"
  | "taskTrigger"
  | "taskTriggerFire"
  | "user"
>;

export interface FireOptions {
  dryRun?: boolean;
  actorUserId?: string | null;
  /**
   * Optional caller-supplied transaction client. When provided, the trigger
   * runs inside the caller's transaction (no nested $transaction).
   */
  db?: FireDb;
}

export type LoadedTrigger = Prisma.TaskTriggerGetPayload<{
  include: { spawnSpecs: true; communicationSpawnSpecs: true };
}>;

export function finished(
  result: FireResult["result"],
  triggerKey: string,
  extras: Partial<FireResult> = {},
): FireResult {
  return {
    result,
    triggerKey,
    spawnedSpecs: extras.spawnedSpecs ?? [],
    spawnedTaskIds: extras.spawnedTaskIds ?? [],
    spawnedTaskKeys: extras.spawnedTaskKeys ?? [],
    ...extras,
  };
}
