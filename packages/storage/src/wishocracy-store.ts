import {
  CreateWishocracyAggregationInputSchema,
  WishocracyAggregationSnapshotSchema,
  type CreateWishocracyAggregationInput,
  type StoredSnapshotUpload,
  type WishocracyAggregationSnapshot,
} from './types.js';
import { uploadJson } from './client.js';

function nowIso(): string {
  return new Date().toISOString();
}

export function createAggregationSnapshot(
  input: CreateWishocracyAggregationInput,
): WishocracyAggregationSnapshot {
  const parsed = CreateWishocracyAggregationInputSchema.parse(input);
  return WishocracyAggregationSnapshotSchema.parse({
    ...parsed,
    type: 'wishocracy-aggregation',
    timestamp: parsed.timestamp ?? nowIso(),
  });
}

export async function storeAggregation(
  client: { uploadFile(file: Blob): Promise<unknown> },
  input: CreateWishocracyAggregationInput,
): Promise<StoredSnapshotUpload<WishocracyAggregationSnapshot>> {
  const snapshot = createAggregationSnapshot(input);
  const cid = await uploadJson(client, snapshot);
  return { cid, snapshot };
}
