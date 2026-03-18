import {
  CreateOptimitronPolicyAnalysisInputSchema,
  OptimitronPolicyAnalysisSnapshotSchema,
  type CreateOptimitronPolicyAnalysisInput,
  type OptimitronPolicyAnalysisSnapshot,
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

export function createPolicyAnalysisSnapshot(
  input: CreateOptimitronPolicyAnalysisInput,
): OptimitronPolicyAnalysisSnapshot {
  const parsed = CreateOptimitronPolicyAnalysisInputSchema.parse(input);
  return OptimitronPolicyAnalysisSnapshotSchema.parse({
    ...parsed,
    type: 'optimitron-policy-analysis',
    timestamp: parsed.timestamp ?? nowIso(),
  });
}

export async function storePolicyAnalysis(
  client: StorachaUploadClient,
  input: CreateOptimitronPolicyAnalysisInput,
): Promise<StoredSnapshotUpload<OptimitronPolicyAnalysisSnapshot>> {
  const snapshot = createPolicyAnalysisSnapshot(input);
  const cid = await uploadJson(client, snapshot);
  return { cid, snapshot };
}

export async function storeLinkedPolicyAnalysis(
  client: StorachaUploadClient & StorachaListClient,
  input: CreateOptimitronPolicyAnalysisInput,
  fetchImpl: typeof fetch = fetch,
): Promise<StoredSnapshotUpload<OptimitronPolicyAnalysisSnapshot>> {
  const latestSnapshot = input.previousCid
    ? null
    : await findLatestStoredSnapshot(client, fetchImpl, {
      jurisdictionId: input.jurisdictionId,
      type: 'optimitron-policy-analysis',
    });

  return storePolicyAnalysis(client, {
    ...input,
    previousCid: input.previousCid ?? latestSnapshot?.cid,
  });
}
