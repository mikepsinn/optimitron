export interface NarrationManifestEntry {
  hash: string;
  file: string;
  generatedAt: string;
}

export type NarrationManifest = Record<string, NarrationManifestEntry>;

/**
 * Narration audio is keyed directly by the segment id.
 * This keeps the manifest, URL hash, and generated file name aligned.
 */
export function getCanonicalNarrationManifestKey(segmentId: string): string {
  return segmentId;
}

export function getNarrationManifestLookupKeys(segmentId: string): string[] {
  return [segmentId];
}

export function getLegacyNarrationManifestKeys(
  manifest: NarrationManifest,
  validSegmentIds: Iterable<string>,
): string[] {
  const validKeys = new Set(validSegmentIds);
  return Object.keys(manifest).filter((key) => !validKeys.has(key));
}
