import {
  CreateHealthAnalysisInputSchema,
  HealthAnalysisSnapshotSchema,
  type CreateHealthAnalysisInput,
  type HealthAnalysisSnapshot,
  type StoredSnapshotUpload,
} from './types.js';
import {
  findLatestStoredSnapshot,
  uploadJson,
  type StorachaListClient,
  type StorachaUploadClient,
} from './client.js';

function nowIso(): string {
  return new Date().toISOString();
}

export function createHealthAnalysisSnapshot(
  input: CreateHealthAnalysisInput,
): HealthAnalysisSnapshot {
  const parsed = CreateHealthAnalysisInputSchema.parse(input);
  return HealthAnalysisSnapshotSchema.parse({
    ...parsed,
    type: 'health-analysis',
    timestamp: parsed.timestamp ?? nowIso(),
  });
}

export async function storeHealthAnalysis(
  client: StorachaUploadClient,
  input: CreateHealthAnalysisInput,
): Promise<StoredSnapshotUpload<HealthAnalysisSnapshot>> {
  const snapshot = createHealthAnalysisSnapshot(input);
  const cid = await uploadJson(client, snapshot);
  return { cid, snapshot };
}

export async function storeLinkedHealthAnalysis(
  client: StorachaUploadClient & StorachaListClient,
  input: CreateHealthAnalysisInput,
  fetchImpl: typeof fetch = fetch,
): Promise<StoredSnapshotUpload<HealthAnalysisSnapshot>> {
  const latestSnapshot = input.previousCid
    ? null
    : await findLatestStoredSnapshot(client, fetchImpl, {
      jurisdictionId: input.jurisdictionId,
      type: 'health-analysis',
    });

  return storeHealthAnalysis(client, {
    ...input,
    previousCid: input.previousCid ?? latestSnapshot?.cid,
  });
}
