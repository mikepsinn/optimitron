import { createHash } from "crypto";
import type {
  ImportedImpactFrameDraft,
  ImportedImpactMetricDraft,
  ImportedSourceArtifactDraft,
  ImportedTaskBundle,
} from "./opg-obg-adapters";

const TREATY_SIGNER_SYNC_HASH_KEY = "treatySignerSyncHash";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeForStableHash(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeForStableHash(entry));
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalizeForStableHash(entry)]),
    );
  }

  return value;
}

function normalizeMetrics(metrics: ImportedImpactMetricDraft[]) {
  return [...metrics]
    .map((metric) => ({
      ...metric,
      metadataJson: normalizeForStableHash(metric.metadataJson),
      summaryStatsJson: normalizeForStableHash(metric.summaryStatsJson),
    }))
    .sort((left, right) => left.metricKey.localeCompare(right.metricKey));
}

function normalizeFrames(frames: ImportedImpactFrameDraft[]) {
  return [...frames]
    .map((frame) => ({
      ...frame,
      metrics: normalizeMetrics(frame.metrics),
      summaryStatsJson: normalizeForStableHash(frame.summaryStatsJson),
    }))
    .sort((left, right) => left.frameSlug.localeCompare(right.frameSlug));
}

function normalizeSourceArtifacts(sourceArtifacts: ImportedSourceArtifactDraft[]) {
  return [...sourceArtifacts]
    .map((artifact) => ({
      ...artifact,
      payloadJson: normalizeForStableHash(artifact.payloadJson),
    }))
    .sort((left, right) => left.sourceKey.localeCompare(right.sourceKey));
}

export function buildTreatySignerSyncHash(input: {
  assigneeOrganizationId: string | null;
  assigneePersonId: string | null;
  bundle: ImportedTaskBundle;
  parentTaskId: string | null;
  sortOrder: number;
}) {
  return `sha256:${createHash("sha256").update(
    JSON.stringify(
      normalizeForStableHash({
        assigneeOrganizationId: input.assigneeOrganizationId,
        assigneePersonId: input.assigneePersonId,
        bundle: {
          impactEstimate: {
            ...input.bundle.impactEstimate,
            assumptionsJson: normalizeForStableHash(input.bundle.impactEstimate.assumptionsJson),
            frames: normalizeFrames(input.bundle.impactEstimate.frames),
          },
          sourceArtifacts: normalizeSourceArtifacts(input.bundle.sourceArtifacts),
          task: {
            ...input.bundle.task,
            contextJson: normalizeForStableHash(input.bundle.task.contextJson),
            interestTags: [...input.bundle.task.interestTags].sort(),
            skillTags: [...input.bundle.task.skillTags].sort(),
          },
        },
        parentTaskId: input.parentTaskId,
        sortOrder: input.sortOrder,
      }),
    ),
  ).digest("hex")}`;
}

export function attachTreatySignerSyncHash(bundle: ImportedTaskBundle, syncHash: string) {
  bundle.task.contextJson = {
    ...bundle.task.contextJson,
    [TREATY_SIGNER_SYNC_HASH_KEY]: syncHash,
  };
  bundle.impactEstimate.assumptionsJson = {
    ...bundle.impactEstimate.assumptionsJson,
    [TREATY_SIGNER_SYNC_HASH_KEY]: syncHash,
  };

  return bundle;
}

export function readTreatySignerSyncHash(contextJson: unknown): string | null {
  if (!isRecord(contextJson) || typeof contextJson[TREATY_SIGNER_SYNC_HASH_KEY] !== "string") {
    return null;
  }

  return contextJson[TREATY_SIGNER_SYNC_HASH_KEY] as string;
}

export function canSkipTreatySignerSync(input: {
  assigneeOrganizationId: string | null;
  assigneePersonId: string | null;
  existingTask: {
    assigneeOrganizationId: string | null;
    assigneePersonId: string | null;
    contextJson: unknown;
    currentImpactEstimateSet?: {
      parameterSetHash: string;
    } | null;
    deletedAt?: Date | null;
    parentTaskId: string | null;
    sortOrder: number | null;
  } | null;
  parameterSetHash: string;
  parentTaskId: string | null;
  sortOrder: number;
  syncHash: string;
}) {
  return getTreatySignerSyncMismatchReasons(input).length === 0;
}

export function getTreatySignerSyncMismatchReasons(input: {
  assigneeOrganizationId: string | null;
  assigneePersonId: string | null;
  existingTask: {
    assigneeOrganizationId: string | null;
    assigneePersonId: string | null;
    contextJson: unknown;
    currentImpactEstimateSet?: {
      parameterSetHash: string;
    } | null;
    deletedAt?: Date | null;
    parentTaskId: string | null;
    sortOrder: number | null;
  } | null;
  parameterSetHash: string;
  parentTaskId: string | null;
  sortOrder: number;
  syncHash: string;
}) {
  const reasons: string[] = [];
  const task = input.existingTask;
  if (!task || task.deletedAt != null) {
    return [task == null ? "missing-task" : "deleted-task"];
  }

  if (task.assigneeOrganizationId !== input.assigneeOrganizationId) {
    reasons.push("assignee-organization");
  }

  if (task.assigneePersonId !== input.assigneePersonId) {
    reasons.push("assignee-person");
  }

  if (task.parentTaskId !== input.parentTaskId) {
    reasons.push("parent-task");
  }

  if (task.sortOrder !== input.sortOrder) {
    reasons.push("sort-order");
  }

  if (task.currentImpactEstimateSet?.parameterSetHash !== input.parameterSetHash) {
    reasons.push("parameter-set-hash");
  }

  if (readTreatySignerSyncHash(task.contextJson) !== input.syncHash) {
    reasons.push("sync-hash");
  }

  return reasons;
}
