import type { Prisma, TaskStatus } from "@optimitron/db";
import { prisma } from "@/lib/prisma";

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

export interface FireOptions {
  dryRun?: boolean;
  actorUserId?: string | null;
  /**
   * Optional caller-supplied transaction client. When provided, the trigger
   * runs inside the caller's transaction (no nested $transaction).
   */
  db?: Prisma.TransactionClient | typeof prisma;
}

export type FireDb = Prisma.TransactionClient | typeof prisma;

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
