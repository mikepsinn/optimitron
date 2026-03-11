import {
  CreateOptomitronPolicyAnalysisInputSchema,
  OptomitronPolicyAnalysisSnapshotSchema,
  type CreateOptomitronPolicyAnalysisInput,
  type OptomitronPolicyAnalysisSnapshot,
  type StoredSnapshotUpload,
} from './types.js';
import { uploadJson } from './client.js';

function nowIso(): string {
  return new Date().toISOString();
}

export function createPolicyAnalysisSnapshot(
  input: CreateOptomitronPolicyAnalysisInput,
): OptomitronPolicyAnalysisSnapshot {
  const parsed = CreateOptomitronPolicyAnalysisInputSchema.parse(input);
  return OptomitronPolicyAnalysisSnapshotSchema.parse({
    ...parsed,
    type: 'optomitron-policy-analysis',
    timestamp: parsed.timestamp ?? nowIso(),
  });
}

export async function storePolicyAnalysis(
  client: { uploadFile(file: Blob): Promise<unknown> },
  input: CreateOptomitronPolicyAnalysisInput,
): Promise<StoredSnapshotUpload<OptomitronPolicyAnalysisSnapshot>> {
  const snapshot = createPolicyAnalysisSnapshot(input);
  const cid = await uploadJson(client, snapshot);
  return { cid, snapshot };
}
